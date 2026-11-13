"""Minimal runtime smoke endpoint; does not touch instructor data."""
from http.server import BaseHTTPRequestHandler
import json


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            import numpy
            import pandas
            import sklearn
            from sklearn.linear_model import LogisticRegression
            # Exercises the installed extension modules and an actual fit.
            model = LogisticRegression(max_iter=100, random_state=42)
            model.fit([[0.0], [0.3], [0.9], [1.2], [1.7], [2.0]], [0, 0, 0, 1, 1, 1])
            ready = model.predict_proba([[1.0]])[0, 1]
            status = 200
            body = {
                "status": "ready",
                "engine": "Python / scikit-learn",
                "real_fit": True,
                "numpy": numpy.__version__,
                "pandas": pandas.__version__,
                "sklearn": sklearn.__version__,
                "test_probability": round(float(ready), 5),
                "instructor_data_processed": False,
            }
        except Exception:
            status = 503
            body = {"status": "error", "message": "Python ML dependencies are unavailable."}
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format, *args):
        return
