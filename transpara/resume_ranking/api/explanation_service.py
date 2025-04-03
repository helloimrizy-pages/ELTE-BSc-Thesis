import logging
from typing import Dict, List, Optional, Any, Union

from config.settings import MODEL_SETTINGS
from api.openai_client import initialize_openai_client, get_completion

logger = logging.getLogger(__name__)

def generate_chatgpt_explanation(
    job_description: str,
    candidate_text: str,
    similarity_score: float,
    shap_explanation: Dict[str, Any],
    bias_score: float,
    client: Optional[Any] = None
) -> str:
    if client is None:
        client = initialize_openai_client()
        if client is None:
            return "ChatGPT explanation unavailable. OpenAI API key not configured."
    
    system_prompt = (
        "You are an HR analyst providing concise candidate evaluations. Your responses must be complete, "
        "under 300 words, and avoid being cut off mid-sentence. "
        "Structure your response with clear sections and bullet points for readability. "
        "You analyze job descriptions and candidate resumes. Explain the candidate's suitability using: "
        "1. The computed similarity score, "
        "2. Key factors identified by SHAP analysis, "
        "3. Direct observations from the resume, "
        "4. Add a note if there's a potential gender bias score."
    )
    
    job_description = job_description[:2000]
    candidate_text = candidate_text[:3000]
    
    pos_contributors = format_contributors(shap_explanation.get('top_positive', []))
    neg_contributors = format_contributors(shap_explanation.get('top_negative', []))
    
    user_prompt = f"""
    Analyze this candidate's match for the job. Keep your entire response under 300 words to ensure it's complete.

    Job Description: {job_description}
    
    Resume Excerpt highlights: {candidate_text}
    
    Similarity Score: {similarity_score:.2f}/1.00
    
    Gender Bias Score: {bias_score:.1f}/100 (lower is better)
    
    SHAP Analysis Results:
    - Positive Contributors: {pos_contributors}
    - Negative Contributors: {neg_contributors}

    Provide a concise analysis in simple terms why this candidate might be a good or poor match for the job description. 
    Highlight specific strengths, skills, and any notable gaps or missing requirements.
    """
    
    try:
        explanation = get_completion(
            client,
            user_prompt,
            system_prompt=system_prompt,
            temperature=MODEL_SETTINGS['gpt_temperature'],
            max_tokens=MODEL_SETTINGS['gpt_max_tokens']
        )
        
        if explanation:
            return explanation
        else:
            return "ChatGPT explanation unavailable. Error generating response."
            
    except Exception as e:
        logger.error(f"Error generating ChatGPT explanation: {str(e)}")
        return f"ChatGPT explanation unavailable. Error: {str(e)}"

def format_contributors(contributors: List[Dict[str, Any]]) -> str:
    if not contributors:
        return "None"
        
    formatted = []
    for item in contributors:
        feature = item.get('feature', 'Unknown')
        impact = item.get('impact', 0.0)
        formatted.append(f"{feature} ({impact:+.3f})")
        
    return ", ".join(formatted)