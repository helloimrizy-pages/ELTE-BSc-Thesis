import os
import logging
from typing import Optional, Dict, Any, List, Union

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
) -> Optional[str]:
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
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            presence_penalty=0.6,
            frequency_penalty=0.6
        )
        
        if response and response.choices:
            return response.choices[0].message.content
        else:
            logger.warning("Empty response from OpenAI API")
            return None
            
    except Exception as e:
        logger.error(f"Error getting completion from OpenAI API: {str(e)}")
        return None