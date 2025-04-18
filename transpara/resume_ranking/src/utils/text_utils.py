import re
import string
import spacy
import hashlib

from typing import Dict, List, Set, Tuple, Optional, Any, Union
from config.settings import DEFAULT_SKILLS

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("SpaCy model not found. Please run: python -m spacy download en_core_web_sm")
    raise

def extract_skill_keywords(text: str, skill_keywords: Optional[List[str]] = None) -> Dict[str, int]:
    if skill_keywords is None:
        skill_keywords = DEFAULT_SKILLS
        
    text = text.lower()
    result = {}
    
    for skill in skill_keywords:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        count = len(re.findall(pattern, text))
        if count > 0:
            result[skill] = count
            
    return result

def preprocess_text(text: str, lowercase: bool = True, remove_punctuation: bool = True) -> str:
    if lowercase:
        text = text.lower()
        
    if remove_punctuation:
        translator = str.maketrans('', '', string.punctuation)
        text = text.translate(translator)
        
    return text

def tokenize(text: str, remove_stopwords: bool = True) -> List[str]:
    doc = nlp(text)
    
    if remove_stopwords:
        tokens = [token.text for token in doc if not token.is_stop and not token.is_punct]
    else:
        tokens = [token.text for token in doc if not token.is_punct]
        
    return tokens

def extract_named_entities(text: str) -> Dict[str, List[str]]:
    doc = nlp(text)
    entities = {}
    
    for ent in doc.ents:
        if ent.label_ in entities:
            entities[ent.label_].append(ent.text)
        else:
            entities[ent.label_] = [ent.text]
            
    return entities

def calculate_term_frequency(tokens: List[str]) -> Dict[str, float]:
    term_counts = {}
    for token in tokens:
        term_counts[token] = term_counts.get(token, 0) + 1
        
    total_tokens = len(tokens)
    term_freq = {term: count / total_tokens for term, count in term_counts.items()}
    
    return term_freq

def extract_sentences(text: str) -> List[str]:
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents]
    return sentences

def get_word_count(text: str) -> int:
    doc = nlp(text)
    word_count = sum(1 for token in doc if not token.is_punct and not token.is_space)
    return word_count

def get_text_statistics(text: str) -> Dict[str, Any]:
    doc = nlp(text)
    
    char_count = len(text)
    word_count = sum(1 for token in doc if not token.is_punct and not token.is_space)
    sentence_count = len(list(doc.sents))
    
    if word_count > 0:
        avg_word_length = sum(len(token.text) for token in doc if not token.is_punct and not token.is_space) / word_count
    else:
        avg_word_length = 0
        
    if sentence_count > 0:
        avg_sentence_length = word_count / sentence_count
    else:
        avg_sentence_length = 0
    
    pos_counts = {}
    for token in doc:
        pos_counts[token.pos_] = pos_counts.get(token.pos_, 0) + 1
    
    return {
        'char_count': char_count,
        'word_count': word_count,
        'sentence_count': sentence_count,
        'avg_word_length': avg_word_length,
        'avg_sentence_length': avg_sentence_length,
        'pos_counts': pos_counts
    }

def filter_text_by_keywords(text: str, keywords: List[str], window_size: int = 20) -> List[str]:
    segments = []
    tokens = tokenize(text, remove_stopwords=False)
    
    for i, token in enumerate(tokens):
        if token.lower() in [keyword.lower() for keyword in keywords]:
            start = max(0, i - window_size)
            end = min(len(tokens), i + window_size + 1)
            
            segment = ' '.join(tokens[start:end])
            segments.append(segment)
            
    return segments

def compute_text_hash(text: str) -> str:
    return hashlib.md5(text.encode("utf-8")).hexdigest()

def extract_matched_keywords(text: str, keywords: list[str]) -> list[str]:
    text_lower = text.lower()
    matched = []
    for keyword in keywords:
        pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
        if re.search(pattern, text_lower):
            matched.append(keyword)
    return matched