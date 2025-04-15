import os
import pandas as pd
import numpy as np
from src.analysis.shap_explanation import generate_model_explanations
from src.models.ranking_model import load_ranking_model

def test_shap_explanation_generation():
    model_path = "tests/sample_data/models/ranking_model.joblib"
    model = load_ranking_model(model_path)

    df = pd.read_json("tests/sample_data/test_features.json")
    feature_names = df.columns.tolist()

    explanations, shap_values, shap_df = generate_model_explanations(
        model=model,
        feature_names=feature_names,
        X=df
    )

    assert len(explanations) == len(df)
    assert isinstance(shap_values, (np.ndarray, list, pd.DataFrame))
    assert not shap_df.empty
    assert shap_values.shape[0] == len(df)
    assert isinstance(shap_values, np.ndarray)

