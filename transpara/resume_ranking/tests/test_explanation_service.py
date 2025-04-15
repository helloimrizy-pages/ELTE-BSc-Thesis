from api.explanation_service import generate_chatgpt_explanation
from unittest.mock import patch

@patch("api.explanation_service.initialize_openai_client", return_value=None)
def test_generate_chatgpt_explanation_with_no_client(mock_init):
    response = generate_chatgpt_explanation(
        job_description="Some job",
        candidate_text="A resume",
        similarity_score=0.85,
        shap_explanation={"top_positive": [], "top_negative": []},
        bias_score=2.5,
        client=None
    )
    assert "error" in response

