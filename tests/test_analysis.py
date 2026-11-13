"""Local smoke and reproducibility tests. Run: python -m unittest discover -s tests -v"""
import csv
import math
import os
import unittest
from api.run import validate_rows, run_analysis


class AnalysisTests(unittest.TestCase):
    def test_refuses_unexpected_rows(self):
        with self.assertRaises(ValueError):
            validate_rows([{"customer_id": "x"}])

    def test_smoke_on_synthetic_rows(self):
        rows = []
        for index in range(120):
            rows.append({
                "customer_id": f"TEST-{index:04d}",
                "website_visits_30d": index % 17,
                "orders_12m": index % 8,
                "avg_order_value_eur": float(35 + index % 50),
                "recency_days": index % 90,
                "email_engagement": round(index % 13 / 13, 3),
                "promotion_affinity": round(index % 11 / 11, 3),
                "loyalty_member": "Yes" if index % 2 else "No",
                "response": "Yes" if index % 3 == 0 else "No",
            })
        result = run_analysis(validate_rows(rows))
        self.assertEqual(result["sample"]["n"], 120)
        self.assertTrue(math.isfinite(result["models"]["logistic"]["test_auc"]))
        self.assertEqual(len(result["scenarios"]), 5)
        self.assertEqual(result["settings"]["seed"], 42)

    def test_instructor_csv_when_available(self):
        path = "P3_1_campaign_response.csv"
        if not os.path.isfile(path):
            self.skipTest("The instructor's original CSV is intentionally not committed.")
        with open(path, encoding="utf-8-sig", newline="") as file:
            rows = list(csv.DictReader(file))
        output = run_analysis(validate_rows(rows))
        self.assertEqual(output["sample"]["n"], 800)
        self.assertEqual(output["sample"]["positive"], 264)
        self.assertEqual(output["sample"]["test"], 200)
        self.assertAlmostEqual(output["models"]["logistic"]["test_auc"],
                               0.7741971958389868, places=5)
        self.assertAlmostEqual(output["models"]["forest"]["test_auc"],
                               0.7558796924468567, places=5)
        selected = next(s for s in output["scenarios"] if s["share"] == .3)
        self.assertEqual((selected["clients"], selected["positives"]), (60, 37))


if __name__ == "__main__":
    unittest.main()
