"""Reproducibility checks: python -m unittest discover -s tests -v."""
import unittest
from api.run import (
    load_dataset, Study, step_quality, step_patterns,
    step_logistic, step_forest, step_comparison, step_targeting, execute
)

class CourseWorkTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.study = Study()

    def test_dataset_integrity(self):
        frame, meta = load_dataset()
        self.assertEqual(frame.shape, (800,9))
        self.assertEqual(meta["yes"], 264)
        self.assertEqual(meta["no"], 536)
        self.assertEqual(meta["missing_values"], 0)
        self.assertEqual(meta["unique_ids"], 800)
        self.assertEqual(len(self.study.y_test), 200)

    def test_quality_runs_independently(self):
        result = step_quality(self.study)
        self.assertEqual(result["split"]["train"], 600)
        self.assertEqual(result["split"]["test_positive"], 66)
        self.assertEqual(len(result["statistics"]), 6)

    def test_patterns_runs_independently(self):
        result = step_patterns(self.study)
        yes = next(x for x in result["loyalty"] if x["category"] == "Yes")
        no = next(x for x in result["loyalty"] if x["category"] == "No")
        self.assertEqual((yes["n"], no["n"]),(362,438))
        self.assertAlmostEqual(yes["rate"], .42541436464, places=7)
        self.assertEqual(len(result["quartiles"]["website_visits_30d"]),4)

    def test_model_results_match_notebook(self):
        logistic = step_logistic(self.study)["metrics"]
        forest = step_forest(self.study)["metrics"]
        self.assertAlmostEqual(logistic["test_auc"], .7741971958389868, places=9)
        self.assertAlmostEqual(forest["test_auc"], .7558796924468567, places=9)
        self.assertAlmostEqual(logistic["cv_auc"], .7646509377967712, places=9)
        self.assertEqual(logistic["confusion"], {"tn":126,"fp":8,"fn":36,"tp":30})
        self.assertEqual(forest["confusion"], {"tn":127,"fp":7,"fn":44,"tp":22})

    def test_comparison_does_not_claim_significance(self):
        comparison = step_comparison(self.study)
        lo, hi = comparison["difference_bootstrap_95"]
        self.assertLess(lo,0)
        self.assertGreater(hi,0)
        self.assertEqual(len(comparison["calibration"]),5)

    def test_targeting_rule(self):
        s = step_targeting(self.study)["scenarios"]
        share30 = next(x for x in s if x["share"] == .3)
        self.assertEqual(share30["contacts"],60)
        self.assertEqual(share30["historical_yes"],37)
        self.assertAlmostEqual(share30["rate"],37/60,places=9)
        self.assertEqual(len(s),5)

    def test_one_chapter_can_run_without_prior_work(self):
        result = execute("quality")
        self.assertEqual(result["step"],"quality")
        self.assertEqual(result["dataset"]["rows"],800)

if __name__ == "__main__":
    unittest.main()
