import spacy
from typing import Dict, List
from config.settings import GENDERED_TERMS

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("SpaCy model not found. Please run: python -m spacy download en_core_web_sm")
    raise

def compute_gender_bias_score(text: str) -> float:
    terms = detect_gendered_terms(text)
    male_count = len(terms['male_terms'])
    female_count = len(terms['female_terms'])
    total_words = len(nlp(text))
    return (abs(male_count - female_count) / (total_words + 1e-6)) * 100

def mitigate_gender_bias(text: str) -> str:
    doc = nlp(text)
    replaced = []

    for token in doc:
        lower_text = token.text.lower()
        if lower_text in GENDERED_TERMS and token.pos_ not in ["PROPN", "PRON"]:
            replacement = GENDERED_TERMS[lower_text]
            if token.is_title:
                replaced.append(replacement.capitalize())
            else:
                replaced.append(replacement)
        else:
            replaced.append(token.text)
        replaced.append(token.whitespace_)

    return "".join(replaced)

def detect_gendered_terms(text: str) -> Dict[str, List[str]]:
    doc = nlp(text.lower())

    male_terms = [token.text for token in doc if token.text in
                 {"he", "his", "him", "man", "men", "male", "father", "son", "brother", "uncle"}]

    female_terms = [token.text for token in doc if token.text in
                   {"she", "her", "hers", "woman", "women", "female", "mother", "daughter", "sister", "aunt"}]

    return {
        'male_terms': male_terms,
        'female_terms': female_terms
    }