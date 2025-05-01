import os
from src.models.ranking_model import rank_candidates
from src.utils.io_utils import load_job_description, load_candidate_pdfs

def test_rank_candidates_pipeline(test_model_and_tokenizer):
    tokenizer, model = test_model_and_tokenizer

    job_desc_path = "tests/sample_data/job_desc.txt"
    candidates_dir = "tests/sample_data/candidates"
    job_id = "test_job_id"

    job_text = load_job_description(job_desc_path)
    candidate_files, candidate_texts = load_candidate_pdfs(candidates_dir)

    output_folders = {
        "models": "tests/sample_data/models",
        "reports": f"tests/output/reports/{job_id}"
    }
    os.makedirs(output_folders["reports"], exist_ok=True)

    skill_keywords = [
        "ci/cd",
        "clean code",
        "cloud services",
        "code review",
        "collaboration",
        "computer science",
        "cross-functional",
        "debugging",
        "feature specifications",
        "hiring process",
        "hr tech",
        "innovation",
        "javascript",
        "node.js",
        "production issues",
        "programming language",
        "python",
        "react",
        "restful apis",
        "scalable software",
        "software development",
        "software engineer",
        "sprint planning",
        "transparency",
        "typescript",
        "web application"
    ]

    results = rank_candidates(
        job_description_text=job_text,
        candidate_texts=candidate_texts,
        candidate_files=candidate_files,
        tokenizer=tokenizer,
        model=model,
        output_folders=output_folders,
        job_id=job_id,
        custom_keywords=skill_keywords
    )

    assert "predictions" in results
    assert len(results["predictions"]) == len(candidate_files)
    assert os.path.exists(os.path.join(output_folders["reports"], "ranking_results.json"))
