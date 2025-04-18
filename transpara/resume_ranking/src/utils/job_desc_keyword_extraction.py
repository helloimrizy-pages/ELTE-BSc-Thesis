import json
import logging
import os
import re
from typing import List, Optional, Any
from api.openai_client import initialize_openai_client, get_completion
from openai import OpenAI
from dotenv import load_dotenv
from config.settings import MODEL_SETTINGS

logger = logging.getLogger(__name__)

def extract_keywords_from_job_description(
    job_description: str,
    max_keywords: int = 25,
    client: Optional[Any] = None
) -> List[str]:
    """
    Extracts relevant keywords from a job description using OpenAI (structured JSON response).
    Returns a list of lowercase keywords.
    """

    if client is None:
        load_dotenv()
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            logger.warning("OPENAI_API_KEY not found. Cannot extract keywords.")
            return []
        client = OpenAI(api_key=openai_api_key)

    system_prompt = (
        "You are an AI assistant that extracts relevant technical and domain-specific keywords from job descriptions. "
        "Return a list of lowercase keywords only, without any explanations."
    )

    user_prompt = (
        f"Extract up to {max_keywords} relevant keywords from the following job description:\n\n"
        f"{job_description}\n\n"
        "Respond with a JSON array of lowercase keywords only. Do not include any explanation or extra text."
    )

    try:
        response = client.chat.completions.create(
            model=MODEL_SETTINGS["gpt_model"],
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0,
            max_tokens=400
        )

        content = response.choices[0].message.content.strip()

        # Try direct JSON parsing
        try:
            keywords = json.loads(content)
        except json.JSONDecodeError:
            # Try extracting JSON array from text
            match = re.search(r"\[[^\]]+\]", content)
            if match:
                keywords = json.loads(match.group(0))
            else:
                raise ValueError(f"OpenAI response not valid JSON array: {content}")

        return [kw.lower() for kw in keywords if isinstance(kw, str)]

    except Exception as e:
        logger.error(f"Keyword extraction failed: {str(e)}")
        return []
