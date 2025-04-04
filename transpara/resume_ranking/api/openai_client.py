import os
import logging
import json
from typing import Optional, Dict, Any, List
from openai import OpenAI
from dotenv import load_dotenv
from config.settings import MODEL_SETTINGS

logger = logging.getLogger(__name__)

def initialize_openai_client() -> Optional[OpenAI]:
    load_dotenv()
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        logger.warning("OPENAI_API_KEY not found in environment. ChatGPT explanations will not be available.")
        return None
    try:
        client = OpenAI(api_key=openai_api_key)
        response = client.chat.completions.create(
            model=MODEL_SETTINGS['gpt_model'],
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        if response:
            logger.info(f"Successfully connected to OpenAI API using model: {MODEL_SETTINGS['gpt_model']}")
        return client
    except Exception as e:
        logger.error(f"Error initializing OpenAI client: {str(e)}")
        return None

def get_completion(
    client: OpenAI,
    prompt: str,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None
) -> Optional[dict]:
    if client is None:
        logger.warning("OpenAI client is None. Cannot generate completion.")
        return None

    model = model or MODEL_SETTINGS['gpt_model']
    temperature = temperature if temperature is not None else MODEL_SETTINGS['gpt_temperature']
    max_tokens = max_tokens or MODEL_SETTINGS['gpt_max_tokens']

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    function_def = {
        "name": "generate_candidate_analysis",
        "description": "Generate a structured evaluation of a candidate for a job position.",
        "parameters": {
            "type": "object",
            "properties": {
                "job_position": {"type": "string"},
                "similarity": {
                    "type": "object",
                    "properties": {
                        "score": {"type": "number"},
                        "max_score": {"type": "number"},
                        "comment": {"type": "string"}
                    },
                    "required": ["score", "max_score", "comment"]
                },
                "shap_analysis": {
                    "type": "object",
                    "properties": {
                        "positive_contributors": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "feature": {"type": "string"},
                                    "impact": {"type": "string"},
                                    "comment": {"type": "string"}
                                },
                                "required": ["feature", "impact", "comment"]
                            }
                        },
                        "negative_contributors": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "feature": {"type": "string"},
                                    "impact": {"type": "string"},
                                    "comment": {"type": "string"}
                                },
                                "required": ["feature", "impact", "comment"]
                            }
                        }
                    },
                    "required": ["positive_contributors", "negative_contributors"]
                },
                "direct_observations": {
                    "type": "object",
                    "properties": {
                        "skills": {"type": "array", "items": {"type": "string"}},
                        "experience": {"type": "array", "items": {"type": "string"}},
                        "education": {"type": "string"},
                        "comment": {"type": "string"}
                    },
                    "required": ["skills", "experience", "education", "comment"]
                },
                "notable_gaps_and_missing_requirements": {"type": "string"},
                "gender_bias": {
                    "type": "object",
                    "properties": {
                        "score": {"type": "number"},
                        "max_score": {"type": "number"},
                        "comment": {"type": "string"}
                    },
                    "required": ["score", "max_score", "comment"]
                },
                "conclusion": {"type": "string"}
            },
            "required": [
                "job_position", "similarity", "shap_analysis",
                "direct_observations", "notable_gaps_and_missing_requirements",
                "gender_bias", "conclusion"
            ]
        }
    }

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            functions=[function_def],
            function_call={"name": "generate_candidate_analysis"}
        )

        if response and response.choices:
            message = response.choices[0].message
            try:
                function_call = message.get("function_call", None)
            except AttributeError:
                function_call = getattr(message, "function_call", None)

            if function_call:
                try:
                    arguments = function_call.get("arguments", None) if hasattr(function_call, "get") else function_call.arguments
                except Exception as ex:
                    logger.error(f"Error accessing function_call arguments: {ex}")
                    return None

                if arguments:
                    if not arguments.strip().endswith("}"):
                        logger.error(f"Returned JSON appears truncated: {arguments}")
                        return {"error": "Returned JSON is incomplete. Consider increasing max_tokens."}
                    try:
                        return json.loads(arguments)
                    except json.JSONDecodeError as json_err:
                        logger.error(f"JSON decoding error: {json_err} - Raw arguments: {arguments}")
                        return {"error": f"JSON decoding error: {json_err}"}
                else:
                    logger.warning("No function call arguments returned in response.")
                    return None
            else:
                logger.warning("No function call returned in response message.")
                return None
        else:
            logger.warning("Empty response from OpenAI API")
            return None

    except Exception as e:
        logger.error(f"Error getting completion from OpenAI API: {str(e)}")
        return {"error": f"Error getting completion: {str(e)}"}