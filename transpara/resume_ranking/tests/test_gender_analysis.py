from src.models.linguistic_debiasing import compute_gender_bias_score

def test_bias_score_balanced_text():
    text = "The engineer solved problems. They collaborated in the team."
    score = compute_gender_bias_score(text)
    assert isinstance(score, float)
    assert score < 5
