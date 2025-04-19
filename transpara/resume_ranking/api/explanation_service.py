import json
import logging

from typing import Dict, List, Optional, Any
from config.settings import MODEL_SETTINGS
from api.openai_client import initialize_openai_client, get_completion

logger = logging.getLogger(__name__)
def format_contributors_for_prompt(contributors: List[Dict[str, Any]]) -> str:
    if not contributors:
        return "None"
    formatted = []
    for item in contributors:
        feature = item.get('feature', 'Unknown')
        impact = item.get('impact', 0.0)
        formatted.append(f"{feature} ({impact:+.3f})")
    return ", ".join(formatted)

def generate_chatgpt_explanation(
    job_description: str,
    candidate_text: str,
    similarity_score: float,
    shap_explanation: Dict[str, Any],
    bias_score: float,
    client: Optional[Any] = None
) -> Dict[str, Any]:
    if client is None:
        client = initialize_openai_client()
        if client is None:
            return {"error": "ChatGPT explanation unavailable. OpenAI API key not configured."}
    
    pos_contributors = format_contributors_for_prompt(shap_explanation.get('top_positive', []))
    neg_contributors = format_contributors_for_prompt(shap_explanation.get('top_negative', []))
    
    user_prompt = f"""
    Analyze this candidate's match for the job using the following details:
    
    - Job Description: {job_description}
    - Resume Excerpt: {candidate_text}
    - Similarity Score: {similarity_score:.2f} out of 1.00
    - Gender Bias Score: {bias_score:.1f} out of 100 (lower is better)
    - SHAP Analysis Results:
        Positive Contributors: {pos_contributors}
        Negative Contributors: {neg_contributors}
    
    Provide a structured evaluation of the candidate. 
    Your responses must be complete under 550 words, avoid being cut off mid-sentence, and make sure you follow the provided JSON structure.
    """
    
    try:
        result = get_completion(
            client=client,
            prompt=user_prompt,
            system_prompt="You are an HR analyst tasked with writing fair, structured and concise evaluations for hiring decisions.",
            temperature=MODEL_SETTINGS['gpt_temperature'],
            max_tokens=MODEL_SETTINGS['gpt_max_tokens']
        )
        return result or {"error": "Failed to generate ChatGPT explanation"}
    except Exception as e:
        logger.error(f"Error generating ChatGPT explanation: {str(e)}")
        return {"error": f"ChatGPT explanation unavailable. Error: {str(e)}"}