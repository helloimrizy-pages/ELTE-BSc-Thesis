from src.utils.text_utils import extract_skill_keywords

def test_extract_skill_keywords():
    text = "Python, SQL, and React are used in the project."
    result = extract_skill_keywords(text, ["python", "sql", "react", "docker"])
    assert result["python"] == 1
    assert result["sql"] == 1
    assert result["react"] == 1
    assert "docker" not in result
