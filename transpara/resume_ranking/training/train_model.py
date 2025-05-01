# python -m training.train_model
import os
import numpy as np
import pandas as pd
import joblib
import torch
import argparse
import matplotlib.pyplot as plt

from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression

from src.data.document_extraction import extract_text_from_pdf
from src.data.embeddings import load_mbert_model
from config.settings import DEFAULT_SKILLS, MODEL_SETTINGS
from src.utils.file_utils import clean_html
from src.utils.text_utils import extract_matched_keywords

def plot_calibration_curve(y_pred, y_true, calibrated_pred, method, output_path):
    bins = np.linspace(0, 1, 20)
    bin_centers = []
    bin_avg_true = []

    for i in range(len(bins) - 1):
        bin_mask = (y_pred >= bins[i]) & (y_pred < bins[i + 1])
        if np.any(bin_mask):
            bin_centers.append(np.mean(y_pred[bin_mask]))
            bin_avg_true.append(np.mean(y_true[bin_mask]))

    plt.figure(figsize=(8, 6))
    plt.plot(bin_centers, bin_avg_true, 'o-', label=f'{method} Calibration')
    plt.plot([0, 1], [0, 1], 'k--', label='Perfect Calibration')
    plt.xlabel("Average Predicted Score (per bin)")
    plt.ylabel("Average True Score (per bin)")
    plt.title(f"Calibration Plot - {method}")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"✅ Calibration plot saved: {output_path}")

def calibrate_with_isotonic(y_pred, y_true):
    iso_reg = IsotonicRegression(out_of_bounds='clip')
    calibrated = iso_reg.fit_transform(y_pred, y_true)
    return iso_reg, calibrated

def calibrate_with_platt(y_pred, y_true):
    log_reg = LogisticRegression()
    y_pred_reshaped = y_pred.reshape(-1, 1)
    y_true_binary = np.digitize(y_true, bins=np.linspace(0, 1, 3)) - 1
    log_reg.fit(y_pred_reshaped, y_true_binary)
    calibrated = log_reg.predict_proba(y_pred_reshaped)[:, 1]
    return log_reg, calibrated

def run_calibration_analysis(y_true, y_pred, output_dir="output/reports"):
    os.makedirs(output_dir, exist_ok=True)

    iso_model, iso_calibrated = calibrate_with_isotonic(y_pred, y_true)
    mse_iso = mean_squared_error(y_true, iso_calibrated)
    r2_iso = r2_score(y_true, iso_calibrated)
    print(f"📈 Isotonic Regression -> MSE: {mse_iso:.4f}, R²: {r2_iso:.4f}")
    plot_calibration_curve(y_pred, y_true, iso_calibrated, "Isotonic", os.path.join(output_dir, "calibration_isotonic.png"))

    platt_model, platt_calibrated = calibrate_with_platt(y_pred, y_true)
    mse_platt = mean_squared_error(y_true, platt_calibrated)
    r2_platt = r2_score(y_true, platt_calibrated)
    print(f"📈 Platt Scaling (Logistic) -> MSE: {mse_platt:.4f}, R²: {r2_platt:.4f}")
    plot_calibration_curve(y_pred, y_true, platt_calibrated, "Platt", os.path.join(output_dir, "calibration_platt.png"))

    return {
        "isotonic": {"model": iso_model, "calibrated": iso_calibrated},
        "platt": {"model": platt_model, "calibrated": platt_calibrated}
    }

def plot_regression_calibration(y_true: np.ndarray, y_pred: np.ndarray, output_path: str = None, bins: int = 10):
    assert len(y_true) == len(y_pred), "Length mismatch between true and predicted values"

    df = pd.DataFrame({'y_true': y_true, 'y_pred': y_pred})
    df['bin'] = pd.qcut(df['y_pred'], q=bins, duplicates='drop')

    grouped = df.groupby('bin').agg({
        'y_true': 'mean',
        'y_pred': 'mean'
    }).reset_index()

    plt.figure(figsize=(8, 6))
    plt.plot(grouped['y_pred'], grouped['y_true'], marker='o', label='Model Calibration')
    plt.plot([0, 1], [0, 1], linestyle='--', color='gray', label='Perfect Calibration')
    plt.xlabel("Average Predicted Score (per bin)")
    plt.ylabel("Average True Score (per bin)")
    plt.title("Calibration Plot for Ranking Model")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()

    if output_path:
        plt.savefig(output_path, dpi=300)
        print(f"📊 Calibration plot saved to {output_path}")
    else:
        plt.show()

def plot_feature_importance(model, feature_names, output_path, top_n=10):
    importances = model.feature_importances_
    indices = np.argsort(importances)[-top_n:]
    plt.figure(figsize=(10, 6))
    plt.barh(range(top_n), importances[indices], align='center')
    plt.yticks(range(top_n), [feature_names[i] for i in indices])
    plt.xlabel("Feature Importance Score")
    plt.title("Top Feature Importances")
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()

def plot_predictions(y_true, y_pred, output_path):
    plt.figure(figsize=(8, 6))
    plt.scatter(y_true, y_pred, alpha=0.7)
    plt.plot([min(y_true), max(y_true)], [min(y_true), max(y_true)], 'r--')
    plt.xlabel("True Score")
    plt.ylabel("Predicted Score")
    plt.title("Predicted vs Actual Scores")
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()

def plot_keyword_match_distribution(match_counts, output_path):
    if not match_counts:
        print("⚠️ No keyword matches found. Skipping keyword match distribution plot.")
        return

    if max(match_counts) == 0:
        print("⚠️ All match counts are zero. Skipping keyword match distribution plot.")
        return

    plt.figure(figsize=(8, 5))
    plt.hist(match_counts, bins=range(0, max(match_counts)+2), alpha=0.75, edgecolor='black')
    plt.xlabel("Skill Keywords Matched")
    plt.ylabel("Candidate Count")
    plt.title("Skill Keyword Match Distribution")
    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"📊 Keyword match distribution plot saved to {output_path}")

def prepare_training_data(job_description_text, candidate_texts, tokenizer, model,
                          skill_keywords=None, gender_directions=None, synthetic=True, reports_path=None):
    from src.data.embeddings import get_text_embedding, cosine_similarity, create_feature_vectors_dataset

    if skill_keywords is None:
        skill_keywords = DEFAULT_SKILLS

    print("Skills used for matching:", skill_keywords)

    job_description_text = clean_html(job_description_text)
    job_embedding = get_text_embedding(job_description_text, tokenizer, model)
    cv_embeddings = [get_text_embedding(text, tokenizer, model) for text in candidate_texts]
    
    match_counts, ratios, scores = [], [], []

    for i, text in enumerate(candidate_texts):
        matched_keywords = extract_matched_keywords(text, skill_keywords)
        match_count = len(matched_keywords)
        ratio = match_count / len(skill_keywords)
        match_counts.append(match_count)
        ratios.append(ratio)

        if synthetic:
            cosine_score = cosine_similarity(job_embedding, cv_embeddings[i])
            score = 0.6 * cosine_score + 0.4 * ratio
            scores.append(score)

    print("Keyword match counts per candidate:", match_counts)

    if reports_path and match_counts:
        output_path = os.path.join(reports_path, "keyword_match_distribution.png")
        plot_keyword_match_distribution(match_counts, output_path)

    df = create_feature_vectors_dataset(
        job_embedding, cv_embeddings, candidate_texts,
        gender_directions=gender_directions,
        skill_keywords=skill_keywords,
        similarity_scores=scores
    )

    return df


def train_ranking_model(features_df, save_path=None, output_folders=None, param_grid=None):
    if 'target_score' not in features_df.columns:
        raise ValueError("Missing 'target_score' column")

    X = features_df.drop(columns='target_score')
    y = features_df['target_score']

    if param_grid is None:
        param_grid = MODEL_SETTINGS['gbm_params']

    if len(X) <= 3:
        model = _train_small_dataset(X, y)
    else:
        model = _train_with_cross_validation(X, y, param_grid, output_folders)

    if output_folders:
        plot_feature_importance(model, X.columns, os.path.join(output_folders['reports'], "feature_importance.png"))

    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        joblib.dump(model, save_path)
        print(f"Model saved to {save_path}")

    return model, X.columns.tolist()


def _train_small_dataset(X, y):
    model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42)
    model.fit(X, y)
    print(f"Training MSE: {mean_squared_error(y, model.predict(X)):.4f}")
    return model


def _train_with_cross_validation(X, y, param_grid, output_folders=None):
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Training on {len(X_train)} samples, validating on {len(X_val)}")

    model = GridSearchCV(
        GradientBoostingRegressor(random_state=42),
        param_grid,
        cv=3,
        scoring='neg_mean_squared_error'
    )
    model.fit(X_train, y_train)

    best_model = model.best_estimator_
    print(f"Best params: {model.best_params_}")

    y_pred = best_model.predict(X_val)
    print(f"Validation MSE: {mean_squared_error(y_val, y_pred):.4f}")
    
    try:
        print(f"R² Score: {r2_score(y_val, y_pred):.4f}")
    except:
        pass

    if output_folders:
        plot_predictions(y_val, y_pred, os.path.join(output_folders['reports'], "pred_vs_actual.png"))
        plot_regression_calibration(y_val, y_pred, os.path.join(output_folders['reports'], "calibration_plot.png"))
        run_calibration_analysis(y_val, y_pred, output_dir=output_folders['reports'])

    return best_model

def get_candidate_texts(candidates_dir):
    files, texts = [], []
    for file in os.listdir(candidates_dir):
        path = os.path.join(candidates_dir, file)
        if path.endswith('.pdf'):
            files.append(path)
            texts.append(extract_text_from_pdf(path))
    return files, texts

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--job_description', type=str, default='data/job_desc/data.txt')
    parser.add_argument('--candidates_dir', type=str, default='resume_generator/output')
    args = parser.parse_args()

    if not os.path.exists(args.job_description):
        print("Job description file not found.")
        return

    if not os.path.isdir(args.candidates_dir):
        print("Candidates directory not found.")
        return

    with open(args.job_description, 'r', encoding='utf-8') as f:
        job_description = f.read()

    candidate_files, candidate_texts = get_candidate_texts(args.candidates_dir)
    if not candidate_files:
        print("No candidate resumes found.")
        return

    tokenizer, model = load_mbert_model()

    today = datetime.today().strftime('%Y%m%d')
    output_folders = {
        'models': os.path.join("output", f"models_{today}"),
        'reports': os.path.join("output", "reports")
    }

    os.makedirs(output_folders['models'], exist_ok=True)
    os.makedirs(output_folders['reports'], exist_ok=True)

    print("Preparing training data...")
    df = prepare_training_data(
        job_description_text=job_description,
        candidate_texts=candidate_texts,
        tokenizer=tokenizer,
        model=model,
        skill_keywords=DEFAULT_SKILLS,
        gender_directions=None,
        synthetic=True,
        reports_path=output_folders['reports']
    )

    print("Training model...")
    model_path = os.path.join(output_folders['models'], "ranking_model.joblib")
    train_ranking_model(df, save_path=model_path, output_folders=output_folders)

    print("✅ Training complete. Reports saved in:", output_folders['reports'])


if __name__ == '__main__':
    main()
