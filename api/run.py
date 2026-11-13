"""ShopDirect P3.1 — reproducible coursework, executable by independent chapters.

Educational dataset is bundled under data/P3_1_campaign_response.csv.
Each run performs actual pandas/scikit-learn calculations; no arbitrary code
execution, customer-level prediction dumps or file uploads are exposed.
"""
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path
from functools import lru_cache
import csv
import hashlib
import inspect
import json
import math
import time

import numpy as np
import pandas as pd
import sklearn
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, confusion_matrix, roc_auc_score, roc_curve, brier_score_loss
)
from sklearn.calibration import calibration_curve

NUMERIC = [
    "website_visits_30d", "orders_12m", "avg_order_value_eur",
    "recency_days", "email_engagement", "promotion_affinity"
]
FEATURES = NUMERIC + ["loyalty_member"]
COLUMNS = ["customer_id", *FEATURES, "response"]
SEED = 42
VALID_STEPS = ("quality", "patterns", "logistic", "forest", "comparison", "targeting")
DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "P3_1_campaign_response.csv"
LABELS = {
    "website_visits_30d": "Посещения за 30 дни",
    "orders_12m": "Поръчки за 12 месеца",
    "avg_order_value_eur": "Средна поръчка (€)",
    "recency_days": "Дни от покупка",
    "email_engagement": "Email ангажираност",
    "promotion_affinity": "Афинитет към промоции",
}


@lru_cache(maxsize=1)
def load_dataset():
    """Read the instructor's bundled CSV; preserve exact original observations."""
    paths = [DATA_FILE, Path.cwd() / "data" / "P3_1_campaign_response.csv"]
    source = next((path for path in paths if path.is_file()), None)
    if source is None:
        raise FileNotFoundError("Вграденият CSV не е открит във функцията.")
    raw = source.read_bytes()
    frame = pd.read_csv(source)
    if list(frame.columns) != COLUMNS:
        raise ValueError("Схемата на вградения набор от данни е различна.")
    if frame.empty or frame.customer_id.duplicated().any():
        raise ValueError("Невалидни или повтарящи се идентификатори.")
    if frame.isna().any().any():
        raise ValueError("В изходните данни има липсващи стойности.")
    if not frame["response"].isin(["Yes", "No"]).all():
        raise ValueError("Невалиден целеви клас.")
    if not frame["loyalty_member"].isin(["Yes", "No"]).all():
        raise ValueError("Невалидна стойност за loyalty_member.")
    y = (frame["response"] == "Yes").astype(int)
    meta = {
        "name": "P3_1_campaign_response.csv",
        "rows": int(len(frame)),
        "columns": int(len(frame.columns)),
        "yes": int(y.sum()),
        "no": int((1 - y).sum()),
        "response_rate": float(y.mean()),
        "missing_values": int(frame.isna().sum().sum()),
        "unique_ids": int(frame.customer_id.nunique()),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "version": {"python": "3.12 target", "pandas": pd.__version__, "sklearn": sklearn.__version__},
    }
    return frame, meta


def make_model(kind):
    """All transforms are inside the model pipeline to avoid data leakage."""
    numeric = StandardScaler() if kind == "logistic" else "passthrough"
    prep = ColumnTransformer([
        ("numeric", numeric, NUMERIC),
        ("categorical", OneHotEncoder(drop="if_binary", handle_unknown="ignore"),
         ["loyalty_member"]),
    ])
    if kind == "logistic":
        estimator = LogisticRegression(max_iter=2000, random_state=SEED)
    elif kind == "forest":
        estimator = RandomForestClassifier(
            n_estimators=250, max_depth=7, min_samples_leaf=5,
            random_state=SEED, n_jobs=1
        )
    else:
        raise ValueError("Неизвестен модел.")
    return Pipeline([("prep", prep), ("model", estimator)])


class Study:
    """Request-local state. Reuse trained models only within one explicit run."""
    def __init__(self):
        self.started = time.monotonic()
        self.trace = []
        self.frame, self.meta = load_dataset()
        self.log("dataset", f"CSV зареден: {self.meta['rows']} клиента, {self.meta['columns']} колони.")
        self.log("validation", f"Проверени ID и липсващи стойности: {self.meta['missing_values']} пропуска.")
        self.y = (self.frame["response"] == "Yes").astype(int)
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            self.frame[FEATURES], self.y,
            test_size=.25, random_state=SEED, stratify=self.y
        )
        self.trained = {}
        self.predicted = {}
        self.cv_scores = {}
        self.log("split", f"Stratified split: {len(self.X_train)} train / {len(self.X_test)} test.")

    def log(self, stage, message):
        """Server-recorded milestone with real elapsed monotonic time."""
        self.trace.append({
            "at": round(time.monotonic() - self.started, 3),
            "stage": stage,
            "message": message,
        })

    def train(self, kind):
        if kind not in self.trained:
            label = "Logistic Regression" if kind == "logistic" else "Random Forest"
            self.log("model", f"Инициализиран {label} с фиксиран random_state={SEED}.")
            model = make_model(kind)
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
            self.log("cross_validation", f"Започва 5-fold CV за {label}.")
            scores = cross_val_score(model, self.X_train, self.y_train,
                                     scoring="roc_auc", cv=cv)
            self.log("cross_validation", f"{label}: CV AUC = {float(scores.mean()):.4f}.")
            self.log("fit", f"Обучение на {label} върху {len(self.X_train)} наблюдения.")
            model.fit(self.X_train, self.y_train)
            self.cv_scores[kind] = scores
            self.predicted[kind] = model.predict_proba(self.X_test)[:, 1]
            self.trained[kind] = model
            self.log("test", f"{label}: Test AUC = {roc_auc_score(self.y_test, self.predicted[kind]):.4f}.")
        return self.trained[kind]

    def statistics(self, kind):
        self.train(kind)
        prob = self.predicted[kind]
        predicted = (prob >= .5).astype(int)
        tn, fp, fn, tp = [int(x) for x in confusion_matrix(
            self.y_test, predicted, labels=[0, 1]).ravel()]
        fpr, tpr, _ = roc_curve(self.y_test, prob)
        return {
            "name": "Логистична регресия" if kind == "logistic" else "Random Forest",
            "cv_auc": float(self.cv_scores[kind].mean()),
            "cv_folds": [float(x) for x in self.cv_scores[kind]],
            "test_auc": float(roc_auc_score(self.y_test, prob)),
            "accuracy": float(accuracy_score(self.y_test, predicted)),
            "sensitivity": tp / (tp + fn),
            "specificity": tn / (tn + fp),
            "brier": float(brier_score_loss(self.y_test, prob)),
            "confusion": {"tn": tn, "fp": fp, "fn": fn, "tp": tp},
            "roc": [[round(float(a), 5), round(float(b), 5)]
                    for a, b in zip(fpr, tpr)],
        }


def step_quality(study):
    """CHAPTER 01 · Data quality, response rate and descriptive statistics."""
    df, meta = study.frame, study.meta
    numeric = df[NUMERIC].agg(["mean", "median", "std", "min", "max"]).T
    summary = [
        {"variable": field, "label": LABELS[field],
         "mean": float(row["mean"]), "median": float(row["median"]),
         "std": float(row["std"]), "min": float(row["min"]), "max": float(row["max"])}
        for field, row in numeric.iterrows()
    ]
    return {
        "population": meta, "statistics": summary,
        "split": {"train": int(len(study.X_train)), "test": int(len(study.X_test)),
                  "train_positive": int(study.y_train.sum()),
                  "test_positive": int(study.y_test.sum())},
        "interpretation": "33% от клиентите са отговорили положително на предходната оферта."
    }


def step_patterns(study):
    """CHAPTER 02 · Univariate segments and associations (not causal effects)."""
    frame = study.frame.assign(positive=study.y)
    loyal = frame.groupby("loyalty_member")["positive"].agg(["size", "sum", "mean"])
    loyalty = [
        {"label": "Членове" if key == "Yes" else "Без членство",
         "category": key, "n": int(loyal.loc[key, "size"]),
         "positive": int(loyal.loc[key, "sum"]),
         "rate": float(loyal.loc[key, "mean"])}
        for key in ("Yes", "No")
    ]
    groups = {}
    for col in ("website_visits_30d", "recency_days", "orders_12m"):
        quartiles = pd.qcut(
            frame[col].rank(method="first"), q=4,
            labels=["Q1", "Q2", "Q3", "Q4"]
        )
        aggregate = frame.groupby(quartiles, observed=False)["positive"].agg(
            ["size", "sum", "mean"]
        )
        groups[col] = [
            {"quartile": key, "n": int(aggregate.loc[key, "size"]),
             "positive": int(aggregate.loc[key, "sum"]),
             "rate": float(aggregate.loc[key, "mean"])}
            for key in ("Q1", "Q2", "Q3", "Q4")
        ]
    return {
        "loyalty": loyalty, "quartiles": groups,
        "note": "Рангови квартилни групи; равни стойности могат да попаднат в съседни групи.",
        "interpretation": "Разликите са описателни асоциации; от тях не следва причинен ефект."
    }


def step_logistic(study):
    """CHAPTER 03 · Logistic regression and interpretable odds ratios."""
    model = study.train("logistic")
    coefficients = model.named_steps["model"].coef_[0]
    names = [
        "Посещения (1 SD)", "Поръчки (1 SD)", "Стойност (€; 1 SD)",
        "Дни от покупка (1 SD)", "Email (1 SD)", "Промо афинитет (1 SD)",
        "Лоялност (Yes vs No)"
    ]
    odds = [
        {"feature": label, "coefficient": float(coef),
         "odds_ratio": float(np.exp(coef))}
        for label, coef in zip(names, coefficients)
    ]
    return {
        "metrics": study.statistics("logistic"),
        "odds_ratios": odds,
        "interpretation": "Коефициентите са асоциации при равни други условия; не са каузални ефекти."
    }


def step_forest(study):
    """CHAPTER 04 · Random Forest with identical training/testing split."""
    model = study.train("forest")
    labels = [
        "Посещения", "Поръчки", "Средна поръчка", "Recency",
        "Email", "Промо афинитет", "Лоялност"
    ]
    importance = [
        {"feature": label, "importance": float(value)}
        for label, value in zip(labels, model.named_steps["model"].feature_importances_)
    ]
    return {
        "metrics": study.statistics("forest"),
        "feature_importance": importance,
        "interpretation": "Importance е относителна вътрешномоделна мярка, не знак или причинен ефект."
    }


def step_comparison(study):
    """CHAPTER 05 · ROC comparison, paired bootstrap and calibration."""
    linear = study.statistics("logistic")
    forest = study.statistics("forest")
    observed = study.y_test.to_numpy()
    p1, p2 = study.predicted["logistic"], study.predicted["forest"]
    rng = np.random.default_rng(20261113)
    differences = []
    # Fixed-seed paired bootstrap: uncertainty of test-set AUC difference.
    for _ in range(2000):
        ix = rng.integers(0, len(observed), size=len(observed))
        y_sub = observed[ix]
        if y_sub.min() == y_sub.max():
            continue
        differences.append(roc_auc_score(y_sub, p1[ix]) -
                           roc_auc_score(y_sub, p2[ix]))
    lo, hi = np.quantile(differences, [.025, .975])
    observed_rate, predicted_rate = calibration_curve(
        observed, p1, n_bins=5, strategy="quantile"
    )
    return {
        "logistic": linear, "forest": forest,
        "auc_difference": float(linear["test_auc"] - forest["test_auc"]),
        "difference_bootstrap_95": [float(lo), float(hi)],
        "calibration": [
            {"predicted": float(x), "observed": float(y)}
            for x, y in zip(predicted_rate, observed_rate)
        ],
        "base_accuracy_no": float((observed == 0).mean()),
        "interpretation": "Интервалът за разликата пресича 0; предпочитанието към логистичната регресия е прагматично."
    }


def step_targeting(study):
    """CHAPTER 06 · Rank holdout probabilities, examine coverage and lift."""
    study.train("logistic")
    ranked = pd.DataFrame({
        "probability": study.predicted["logistic"],
        "observed": study.y_test.to_numpy()
    }).sort_values("probability", ascending=False)
    base_rate = float(ranked["observed"].mean())
    positives = int(ranked["observed"].sum())
    scenarios = []
    for share in (.1, .2, .3, .4, .5):
        contacts = int(round(len(ranked) * share))
        chosen = ranked.head(contacts)
        hits = int(chosen["observed"].sum())
        rate = hits / contacts
        scenarios.append({
            "share": share, "contacts": contacts,
            "historical_yes": hits, "rate": rate,
            "lift": rate / base_rate,
            "capture": hits / positives,
            "probability_threshold": float(chosen["probability"].iloc[-1]),
        })
    return {
        "base_rate": base_rate, "positives_in_test": positives,
        "selected_share": .3, "scenarios": scenarios,
        "note": "Таргетираме само допустими за контакт клиенти; 30% е работна хипотеза, не доказан ROI оптимум."
    }


STEP_FUNCTIONS = {
    "quality": step_quality,
    "patterns": step_patterns,
    "logistic": step_logistic,
    "forest": step_forest,
    "comparison": step_comparison,
    "targeting": step_targeting,
}
STEP_CODE = {
    "quality": [load_dataset, step_quality],
    "patterns": [step_patterns],
    "logistic": [make_model, Study.train, Study.statistics, step_logistic],
    "forest": [make_model, Study.train, Study.statistics, step_forest],
    "comparison": [Study.statistics, step_comparison],
    "targeting": [Study.train, step_targeting],
}


def execute(step):
    """Execute real Python and return a truthful, timestamped milestone trace."""
    study = Study()
    if step == "all":
        result = {}
        for key, function in STEP_FUNCTIONS.items():
            study.log("chapter", f"Начало на глава: {key}.")
            result[key] = function(study)
            study.log("completed", f"Изчисленията за {key} завършиха.")
    elif step in STEP_FUNCTIONS:
        study.log("chapter", f"Начало на глава: {step}.")
        result = STEP_FUNCTIONS[step](study)
        study.log("completed", f"Изчисленията за {step} завършиха.")
    else:
        raise ValueError("Неизвестна аналитична глава.")
    elapsed = round(time.monotonic() - study.started, 3)
    return {
        "step": step, "result": result,
        "dataset": study.meta, "execution": "Python / pandas / scikit-learn",
        "trace": study.trace, "elapsed_seconds": elapsed,
        "method": {"train_test": "75/25 stratified",
                   "cv": "StratifiedKFold(5, shuffle=True)",
                   "random_state": 42, "probability_cutoff": .5},
    }


class handler(BaseHTTPRequestHandler):
    """Public same-origin read-only academic analysis endpoint."""
    def reply(self, status, value):
        body = json.dumps(value, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'none'")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        source = query.get("source", [""])[0]
        if source:
            if source not in STEP_CODE:
                return self.reply(404, {"error": "Непозната глава."})
            code = "\n\n".join(inspect.getsource(fn) for fn in STEP_CODE[source])
            return self.reply(200, {"step": source, "code": code,
                                    "path": "api/run.py", "is_executable": True})
        self.reply(200, {
            "status": "ready", "project": "ShopDirect Research Lab",
            "dataset": "bundled", "steps": list(VALID_STEPS) + ["all"],
            "execution": "Server-side Python, not a prerecorded animation."
        })

    def do_POST(self):
        try:
            origin = self.headers.get("Origin")
            host = self.headers.get("Host", "")
            if origin and urlparse(origin).netloc != host:
                return self.reply(403, {"error": "Заявка от различен домейн."})
            length = int(self.headers.get("Content-Length", "0"))
            if length < 2 or length > 2048:
                return self.reply(413, {"error": "Невалиден размер на заявката."})
            if "application/json" not in self.headers.get("Content-Type", ""):
                return self.reply(415, {"error": "Очаква се JSON."})
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError("Невалиден JSON обект.")
            step = payload.get("step")
            if step not in (*VALID_STEPS, "all"):
                raise ValueError("Невалидна стъпка.")
            self.reply(200, execute(step))
        except (ValueError, KeyError, TypeError, OverflowError) as exc:
            self.reply(400, {"error": str(exc)[:200]})
        except (FileNotFoundError, OSError):
            self.reply(503, {"error": "Не може да се зареди вграденият CSV."})
        except Exception:
            self.reply(500, {"error": "Възникна грешка при анализа. Проверете логовете на сървъра."})

    def log_message(self, format, *args):
        return
