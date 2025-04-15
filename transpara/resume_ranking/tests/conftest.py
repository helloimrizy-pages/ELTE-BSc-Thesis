import pytest
from fastapi.testclient import TestClient
from backend.api_server import app
from src.data.embeddings import load_mbert_model

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="module")
def test_model_and_tokenizer():
    tokenizer, model = load_mbert_model()
    return tokenizer, model
