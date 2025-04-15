import os
import json
import pytest
from unittest.mock import patch

def mock_load_json_report(path):
    return {"mock_key": "mock_value"}

@patch("backend.api_server.load_json_report", side_effect=mock_load_json_report)
def test_get_analysis(mock_report, client):
    job_id = "test-job"
    response = client.get(f"/api/get-analysis/{job_id}")
    assert response.status_code == 200
    assert response.json()["ranking_results"]["mock_key"] == "mock_value"


@patch("backend.api_server.download_job_description", return_value=True)
@patch("backend.api_server.download_candidate_pdfs", return_value=2)
@patch("backend.api_server.os.system", return_value=0)
@patch("backend.api_server.load_json_report", return_value={"mock_key": "value"})
def test_analyze_candidates(mock_load, mock_system, mock_download_pdfs, mock_download_desc, client):
    response = client.post("/api/analyze-candidates", json={"jobId": "job123"})
    assert response.status_code == 200
    assert "mock_key" in response.json()["ranking_results"]

