"""ShopDirect P3.1 — on-demand reproduction of the notebook experiment.

No training data is bundled with the deployment. Raw rows are accepted in-memory
only and are not persisted. No arbitrary code execution is exposed.
"""
from http.server import BaseHTTPRequestHandler
import json
import math
import time

COLUMNS = (
    "customer_id", "website_visits_30d", "orders_12m",
    "avg_order_value_eur", "recency_days", "email_engagement",
    "promotion_affinity", "loyalty_member", "response"
)
NUMERIC = list(COLUMNS[1:7])
FEATURES = NUMERIC + ["loyalty_member"]
SEED = 42
MAX_BYTES = 1_000_000
MAX_ROWS = 2000


def validate_rows(rows):
    if not isinstance(rows, list) or not 100 <= len(rows) <= MAX_ROWS:
        raise ValueError("Очакват се между 100 и 2000 клиентски записа.")
    result, ids = [], set()
    for index, original in enumerate(rows):
        if not isinstance(original, dict) or not set(COLUMNS).issubset(original):
            raise ValueError(f"Невалидна структура на ред {index + 1}.")
        row = {"customer_id": str(original["customer_id"]).strip()}
        if not row["customer_id"] or row["customer_id"] in ids:
            raise ValueError("Липсващ или повторен customer_id.")
        ids.add(row["customer_id"])
        for feature in NUMERIC:
            value = float(original[feature])
            if not math.isfinite(value) or value < 0 or value > 1e8:
                raise ValueError(f"Невалидна стойност за {feature}, ред {index + 1}.")
            row[feature] = value
        for feature in ("loyalty_member", "response"):
            value = str(original[feature]).strip()
            if value not in ("Yes", "No"):
                raise ValueError(f"{feature} трябва да бъде Yes или No.")
            row[feature] = value
        result.append(row)
    return result


def run_analysis(rows):
    import numpy as np
    import pandas as pd
    import sklearn
    from sklearn.compose import ColumnTransformer
    from sklearn.preprocessing import StandardScaler, OneHotEncoder
    from sklearn.pipeline import Pipeline
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
    from sklearn.metrics import (accuracy_score, confusion_matrix, roc_auc_score,
                                 roc_curve, brier_score_loss)

    started = time.monotonic()
    frame = pd.DataFrame(rows, columns=COLUMNS)
    y = frame["response"].map({"No": 0, "Yes": 1}).astype(int)
    if y.nunique() != 2 or min(y.value_counts()) < 10:
        raise ValueError("Нужни са поне 10 наблюдения от всеки клас.")
    X = frame[FEATURES].copy()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, stratify=y, test_size=.25, random_state=SEED
    )
    logistic = Pipeline([
        ("prep", ColumnTransformer([
            ("num", StandardScaler(), NUMERIC),
            ("cat", OneHotEncoder(drop="if_binary", handle_unknown="ignore"),
             ["loyalty_member"]),
        ])),
        ("model", LogisticRegression(max_iter=2000, random_state=SEED)),
    ])
    forest = Pipeline([
        ("prep", ColumnTransformer([
            ("num", "passthrough", NUMERIC),
            ("cat", OneHotEncoder(drop="if_binary", handle_unknown="ignore"),
             ["loyalty_member"]),
        ])),
        ("model", RandomForestClassifier(
            n_estimators=250, max_depth=7, min_samples_leaf=5,
            random_state=SEED, n_jobs=1
        )),
    ])
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    models, test_probabilities = {}, {}
    for key, pipeline in (("logistic", logistic), ("forest", forest)):
        fold_auc = cross_val_score(pipeline, X_train, y_train,
                                  scoring="roc_auc", cv=cv)
        pipeline.fit(X_train, y_train)
        probability = pipeline.predict_proba(X_test)[:, 1]
        prediction = (probability >= .5).astype(int)
        tn, fp, fn, tp = [int(v) for v in confusion_matrix(
            y_test, prediction, labels=[0, 1]).ravel()]
        fpr, tpr, _ = roc_curve(y_test, probability)
        models[key] = {
            "cv_auc": float(fold_auc.mean()),
            "test_auc": float(roc_auc_score(y_test, probability)),
            "accuracy": float(accuracy_score(y_test, prediction)),
            "sensitivity": tp / (tp + fn),
            "specificity": tn / (tn + fp),
            "brier": float(brier_score_loss(y_test, probability)),
            "confusion": {"tn": tn, "fp": fp, "fn": fn, "tp": tp},
            "roc": [[round(float(x), 5), round(float(z), 5)]
                    for x, z in zip(fpr, tpr)],
        }
        test_probabilities[key] = probability

    ranked = pd.DataFrame({
        "probability": test_probabilities["logistic"],
        "observed": y_test.to_numpy(),
    }).sort_values("probability", ascending=False)
    base_rate = float(ranked["observed"].mean())
    total_positive = int(ranked["observed"].sum())
    scenarios = []
    for share in (.1, .2, .3, .4, .5):
        count = max(1, int(round(len(ranked) * share)))
        chosen = ranked.head(count)
        positives = int(chosen["observed"].sum())
        rate = positives / count
        scenarios.append({
            "share": share, "clients": count, "positives": positives,
            "rate": rate, "lift": rate / base_rate,
            "capture": positives / total_positive,
            "cutoff": float(chosen["probability"].iloc[-1]),
        })

    coeff_names = ["Посещения (1 SD)", "Поръчки (1 SD)", "Средна поръчка (1 SD)",
                   "Дни от покупка (1 SD)", "Email ангажираност (1 SD)",
                   "Афинитет към промоции (1 SD)", "Лоялен клиент (Yes)"]
    coefficients = logistic.named_steps["model"].coef_[0]
    odds = [{"name": name, "odds_ratio": float(np.exp(value))}
            for name, value in zip(coeff_names, coefficients)]

    loyal = frame.assign(positive=y).groupby("loyalty_member")["positive"].agg(
        ["size", "mean"])
    loyalty = {category: {"count": int(loyal.loc[category, "size"]),
                          "rate": float(loyal.loc[category, "mean"])}
               for category in ("No", "Yes") if category in loyal.index}

    return {
        "mode": "recomputed_from_uploaded_csv",
        "sample": {"n": len(frame), "positive": int(y.sum()),
                   "negative": int(len(y) - y.sum()),
                   "train": len(X_train), "test": len(X_test),
                   "test_positive": total_positive},
        "models": models, "scenarios": scenarios, "odds_ratios": odds,
        "loyalty": loyalty,
        "settings": {"seed": SEED, "split": "75/25 stratified",
                     "cv": "5-fold stratified", "threshold": .5,
                     "sklearn": sklearn.__version__, "pandas": pd.__version__},
        "elapsed_seconds": round(time.monotonic() - started, 2),
        "disclaimer": "Retrospective response propensity; not incremental uplift or ROI."
    }


class handler(BaseHTTPRequestHandler):
    def respond(self, status, data):
        body = json.dumps(data, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'none'")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self.respond(200, {
            "status": "ready", "service": "ShopDirect reproducibility API",
            "method": "POST JSON {rows:[...]} to /api/run",
            "requires_csv": True, "dataset_is_not_public": True
        })

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 2 or length > MAX_BYTES:
                self.respond(413, {"error": "Невалиден размер на заявката (макс. 1 MB)."})
                return
            if "application/json" not in self.headers.get("Content-Type", ""):
                self.respond(415, {"error": "Очаква се application/json."})
                return
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict) or "rows" not in payload:
                raise ValueError("Липсва поле rows.")
            rows = validate_rows(payload["rows"])
            result = run_analysis(rows)
            self.respond(200, result)
        except (ValueError, KeyError, TypeError, OverflowError) as exc:
            self.respond(400, {"error": str(exc)[:280]})
        except Exception:
            # Never leak stack traces or raw customer data to the browser.
            self.respond(500, {"error": "Неуспешно изпълнение. Проверете данните и опитайте отново."})

    def log_message(self, format, *args):
        # Avoid logging customer data, paths or request bodies.
        return
