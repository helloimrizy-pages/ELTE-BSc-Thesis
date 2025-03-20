import os
import pdfplumber
import pytesseract
import torch
import numpy as np
import openai
import shap

# Hugging Face Transformers
from transformers import AutoTokenizer, AutoModel
from pdf2image import convert_from_path
from PIL import Image
from dotenv import load_dotenv

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")
os.environ["OPENAI_API_KEY"] = openai_api_key
client = openai.OpenAI()

# PDF Extraction
def is_text_based_pdf(pdf_path):
    """Check if PDF contains extractable text using pdfplumber."""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                if page.extract_text(strip=True):
                    return True
        return False
    except Exception as e:
        print(f"Error checking PDF: {e}")
        return False

def extract_text_from_pdf(pdf_path):
    """
    Extract all text from a PDF. If it's a text-based PDF,
    use pdfplumber; if scanned, use OCR via pytesseract.
    """
    if is_text_based_pdf(pdf_path):
        extracted_text = ""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"
        except Exception as e:
            print(f"Error reading PDF with pdfplumber: {e}")
            return ""
        return extracted_text
    else:
        return extract_text_with_ocr(pdf_path)

def extract_text_with_ocr(pdf_path):
    """Extract text from scanned PDF pages using Tesseract OCR."""
    try:
        text = ""
        images = convert_from_path(pdf_path)
        for i, image in enumerate(images):
            image_path = f"temp_page_{i+1}.jpg"
            image.save(image_path, "JPEG")
            
            page_text = pytesseract.image_to_string(Image.open(image_path))
            text += page_text + "\n"
            os.remove(image_path)
        return text
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""

# mBERT Model
def load_mbert_model(model_name="bert-base-multilingual-cased"):
    """
    Load the tokenizer and model for mBERT.
    """
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)
    model.eval()
    return tokenizer, model

def get_text_embedding(text, tokenizer, model, max_length=512):
    """
    Get a single text embedding by mean-pooling the last hidden states of the model.
    """
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=max_length,
        padding="max_length"
    )
    
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Last hidden state is of shape [batch_size, sequence_length, hidden_size].
    # We do a simple mean pool across the sequence dimension.
    last_hidden_state = outputs.last_hidden_state  # [1, seq_len, hidden_dim]
    embedding = torch.mean(last_hidden_state, dim=1)  # [1, hidden_dim]
    return embedding.squeeze(0)  # [hidden_dim]

def cosine_similarity(a, b):
    """
    Compute cosine similarity between two 1D torch tensors.
    """
    a_norm = a / a.norm(p=2, dim=0, keepdim=True)
    b_norm = b / b.norm(p=2, dim=0, keepdim=True)
    return torch.dot(a_norm, b_norm).item()

# Ranking Candidates
def rank_candidates(job_desc_text, candidate_texts, tokenizer, model):
    """
    Given a job description and a list of candidate texts (resumes),
    return a sorted list of (candidate_index, similarity_score),
    with highest similarity first.
    """
    jd_embedding = get_text_embedding(job_desc_text, tokenizer, model)
    
    # Compute each candidate's similarity
    results = []
    for idx, text in enumerate(candidate_texts):
        if not text.strip():
            # If there's no text, skip or treat as zero
            similarity = 0.0
        else:
            cv_embedding = get_text_embedding(text, tokenizer, model)
            similarity = cosine_similarity(jd_embedding, cv_embedding)
        results.append((idx, similarity))
    
    # Sort by similarity descending
    results.sort(key=lambda x: x[1], reverse=True)
    return results

def create_token_predictor(job_embedding, tokenizer, model):
    """
    Create a custom predictor that accepts a 2D array of token lists.
    """
    def predictor(batch_of_token_lists):
        scores = []
        for token_list in batch_of_token_lists:
            valid_tokens = [t for t in token_list if t is not None]
            partial_text = " ".join(valid_tokens)

            cv_embedding = get_text_embedding(partial_text, tokenizer, model)
            similarity = cosine_similarity(job_embedding, cv_embedding)

            print(f"Tokens: {valid_tokens[:5]}... -> similarity: {similarity}")

            scores.append(similarity)
        return np.array(scores)
    
    return predictor

def explain_with_shap_tokenlevel(job_embedding, candidate_text, tokenizer, model, max_length=960):
    """
    Generate token-level SHAP values for a candidate text by
    treating each token as a separate feature.
    """
    # Truncate text to handle extreme lengths
    truncated_text = " ".join(candidate_text.split()[:max_length])
    tokens = truncated_text.split()
    
    background_data = np.array([tokens], dtype=object)
    predictor = create_token_predictor(job_embedding, tokenizer, model)

    explainer = shap.KernelExplainer(predictor, background_data)
    
    # Evaluate shap values for the candidate tokens
    candidate_tokens_2d = np.array([tokens], dtype=object)
    shap_values = explainer.shap_values(candidate_tokens_2d)
    
    if isinstance(shap_values, list) and len(shap_values) > 0:
        shap_values = shap_values[0]  # shap_values shape -> (1, n_tokens)
    
    shap_values = shap_values[0]
    print("Raw SHAP values:", shap_values[0])

    token_shap_pairs = list(zip(tokens, shap_values))
    
    # Identify top tokens by absolute importance
    token_shap_pairs.sort(key=lambda x: abs(x[1]), reverse=True)
    top_5 = token_shap_pairs[:5]
    
    # Get positive & negative contributors (top 5 in each category)
    top_positive = [(t, v) for t,v in token_shap_pairs if v > 0][:5]
    top_negative = [(t, v) for t,v in token_shap_pairs if v < 0][:5]
    
    return {
        "token_level_shap": token_shap_pairs,
        "top_5": top_5,
        "top_positive": top_positive,
        "top_negative": top_negative
    }

def generate_chatgpt_explanation(job_description, candidate_text, similarity_score, shap_explanation):
    """
    This function returns the generated explanation text.
    """

    system_prompt = (
        "You are an HR analyst. You analyze job descriptions and candidate resumes. Explain the candidate's suitability using: "
        "1. The computed similarity score "
        "2. Key factors identified by SHAP analysis "
        "3. Direct observations from the text"
    )

    user_prompt = f"""
    Job Description: {job_description[:4000]}
    
    Resume Excerpt: {candidate_text[:7000]}
    
    Similarity Score: {similarity_score:.2f}/1.00
    
    SHAP Analysis Results:
    - Positive Contributors: {shap_explanation['top_positive']}
    - Negative Contributors: {shap_explanation['top_negative']}
    
    Provide a concise analysis in simple terms why this candidate might be a good or poor match for the job description. 
    Highlight specific strengths, skills, and any notable gaps or missing requirements:
    1. Interprets the numerical score
    2. Explains the SHAP-identified factors
    3. Highlights matching/missing skills
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        max_tokens=400
    )
    return response.choices[0].message.content

# Main pipeline
def main():
    # Define the job description text
    job_description_text = """
    We are looking for a Data Scientist with experience in Python, NLP, 
    and machine learning. The candidate should be familiar with 
    large language models and deep learning frameworks.
    """
    
    # Look for CV PDFs in the data folder
    pdf_folder = "data"
    if not os.path.isdir(pdf_folder):
        print(f"Folder not found: {pdf_folder}")
        return
    
    pdf_files = [os.path.join(pdf_folder, f) for f in os.listdir(pdf_folder) 
                 if f.lower().endswith(".pdf")]
    
    # Extract text from each PDF
    candidate_texts = []
    for pdf_file in pdf_files:
        print(f"Extracting text from {pdf_file}...")
        text = extract_text_from_pdf(pdf_file)
        candidate_texts.append(text)
    
    # Load mBERT model
    print("Loading mBERT model...")
    tokenizer, model = load_mbert_model("bert-base-multilingual-cased")

    # Rank candidates by similarity
    print("Ranking candidates by similarity...")
    results = rank_candidates(job_description_text, candidate_texts, tokenizer, model)
    
    # Display top candidates
    # results is a list of (candidate_index, similarity_score)
    print("\n=== Ranking Results ===")
    top_n = 10 # Display only top 10 candidates
    top_results = results[:top_n]

    for rank, (idx, score) in enumerate(top_results, start=1):
        pdf_name = os.path.basename(pdf_files[idx])
        print(f"{rank}. {pdf_name} -> Similarity: {score:.4f}")
        
    # Generate ChatGPT explanations for top candidates
    print("\n=== Generating ChatGPT Explanations for Top Candidates ===")
    # Pick top candidates for SHAP explanation
    print("\n=== Generating Token-Level SHAP Explanations for Top Candidates ===")
    
    # Precompute the job embedding (so we don't do it repeatedly)
    jd_embedding = get_text_embedding(job_description_text, tokenizer, model)
    
    for rank, (idx, score) in enumerate(top_results, start=1):
        candidate_text = candidate_texts[idx]
        pdf_name = os.path.basename(pdf_files[idx])
        
        if not candidate_text.strip():
            # Skip empty text
            print(f"\n--- Explanation for Rank #{rank} ({pdf_name}) ---")
            print("No text extracted. Skipping SHAP explanation.")
            continue
        
        # Generate a token-level SHAP explanation
        shap_explanation = explain_with_shap_tokenlevel(
            jd_embedding,
            candidate_text,
            tokenizer,
            model,
            max_length=128
        )

        print("Candidate tokens:", tokens)

        # Generate a ChatGPT-based explanation
        explanation = generate_chatgpt_explanation(
            job_description_text,
            candidate_text,
            score,
            shap_explanation
        )
        
        print(f"\n--- Explanation for Rank #{rank} ({pdf_name}) ---")
        print(explanation)

    print("\nDone.")


if __name__ == "__main__":
    main()
