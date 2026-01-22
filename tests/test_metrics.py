"""
Unit tests for core/metrics.py
Tests precision, recall, F1 score, and CRR calculations
"""

import unittest
from core.metrics import calculate_metrics, format_metrics_for_display


class TestCalculateMetrics(unittest.TestCase):
    """Test metrics calculation"""

    def test_all_exact_matches(self):
        """All words match exactly - perfect score"""
        matches = [
            ('hello', 'hello', 0, 'exact'),
            ('world', 'world', 0, 'exact')
        ]

        metrics = calculate_metrics(matches)

        self.assertEqual(metrics['precision'], 1.0)  # 2/2
        self.assertEqual(metrics['recall'], 1.0)  # 2/2
        self.assertEqual(metrics['f1_score'], 1.0)
        self.assertEqual(metrics['avg_crr'], 1.0)  # No errors
        self.assertEqual(metrics['exact_matches'], 2)
        self.assertEqual(metrics['fuzzy_matches'], 0)
        self.assertEqual(metrics['total_gt_words'], 2)
        self.assertEqual(metrics['total_ocr_words'], 2)

    def test_no_matches(self):
        """No matching words - worst case"""
        matches = [
            ('hello', None, None, 'gt_only'),
            ('world', None, None, 'gt_only'),
            (None, 'foo', None, 'ocr_only'),
            (None, 'bar', None, 'ocr_only')
        ]

        metrics = calculate_metrics(matches)

        self.assertEqual(metrics['precision'], 0.0)  # 0/2
        self.assertEqual(metrics['recall'], 0.0)  # 0/2
        self.assertEqual(metrics['f1_score'], 0.0)
        self.assertEqual(metrics['exact_matches'], 0)
        self.assertEqual(metrics['unmatched_gt'], 2)
        self.assertEqual(metrics['unmatched_ocr'], 2)

    def test_precision_calculation(self):
        """Test precision: exact_matches / total_ocr_words"""
        # GT: "hello world test"
        # OCR: "hello world foo"
        matches = [
            ('hello', 'hello', 0, 'exact'),
            ('world', 'world', 0, 'exact'),
            ('test', None, None, 'gt_only'),
            (None, 'foo', None, 'ocr_only')
        ]

        metrics = calculate_metrics(matches)

        # Precision: 2 exact matches / 3 total OCR words = 2/3
        self.assertAlmostEqual(metrics['precision'], 0.6667, places=4)

    def test_recall_calculation(self):
        """Test recall: exact_matches / total_gt_words"""
        # GT: "hello world test"
        # OCR: "hello world"
        matches = [
            ('hello', 'hello', 0, 'exact'),
            ('world', 'world', 0, 'exact'),
            ('test', None, None, 'gt_only')
        ]

        metrics = calculate_metrics(matches)

        # Recall: 2 exact matches / 3 total GT words = 2/3
        self.assertAlmostEqual(metrics['recall'], 0.6667, places=4)

    def test_f1_score_calculation(self):
        """Test F1 score: harmonic mean of precision and recall"""
        # Precision = 2/3, Recall = 2/4 = 0.5
        # F1 = 2 * (0.6667 * 0.5) / (0.6667 + 0.5) = 2 * 0.3333 / 1.1667 = 0.5714
        matches = [
            ('hello', 'hello', 0, 'exact'),
            ('world', 'world', 0, 'exact'),
            ('quick', None, None, 'gt_only'),
            ('fox', None, None, 'gt_only'),
            (None, 'test', None, 'ocr_only')
        ]

        metrics = calculate_metrics(matches)

        precision = 2 / 3  # 0.6667
        recall = 2 / 4  # 0.5
        expected_f1 = 2 * (precision * recall) / (precision + recall)

        self.assertAlmostEqual(metrics['f1_score'], expected_f1, places=4)

    def test_crr_only_exact_matches(self):
        """CRR with only exact matches"""
        # All exact, no errors
        matches = [
            ('hello', 'hello', 0, 'exact'),
            ('world', 'world', 0, 'exact')
        ]

        metrics = calculate_metrics(matches)

        # CRR = 1 - (0 errors / 10 chars) = 1.0
        self.assertEqual(metrics['avg_crr'], 1.0)

    def test_crr_with_unmatched_gt_words(self):
        """CRR counts unmatched GT words as errors"""
        # GT: "hello world" (10 chars)
        # OCR: "hello" (5 chars)
        # Unmatched: "world" (5 chars)
        matches = [
            ('hello', 'hello', 0, 'exact'),
            ('world', None, None, 'gt_only')
        ]

        metrics = calculate_metrics(matches)

        # CRR = 1 - (5 errors / 10 total chars) = 0.5
        self.assertEqual(metrics['avg_crr'], 0.5)

    def test_crr_with_unmatched_ocr_words(self):
        """CRR counts unmatched OCR words as errors"""
        # GT: "hello" (5 chars)
        # OCR: "hello world" (10 chars)
        # Unmatched: "world" (5 chars - hallucinated)
        matches = [
            ('hello', 'hello', 0, 'exact'),
            (None, 'world', None, 'ocr_only')
        ]

        metrics = calculate_metrics(matches)

        # Total errors = 5 (unmatched OCR chars)
        # Total GT chars = 5
        # CRR = 1 - (5/5) = 0.0
        self.assertEqual(metrics['avg_crr'], 0.0)

    def test_crr_comprehensive_example(self):
        """Comprehensive CRR test with README example"""
        # GT: "The quick brown fox" (16 chars)
        # OCR: "The quik brown" (13 chars)
        # Exact: "The" (0 errors), "brown" (0 errors)
        # Unmatched GT: "quick" (5 chars), "fox" (3 chars) = 8 errors
        # Unmatched OCR: "quik" (4 chars) = 4 errors
        # Total errors: 12
        # CRR = 1 - (12/16) = 0.25

        matches = [
            ('The', 'The', 0, 'exact'),
            ('brown', 'brown', 0, 'exact'),
            ('quick', None, None, 'gt_only'),
            ('fox', None, None, 'gt_only'),
            (None, 'quik', None, 'ocr_only')
        ]

        metrics = calculate_metrics(matches)

        # Total errors = 0 + 0 + 5 + 3 + 4 = 12
        # Total GT chars = 3 + 5 + 5 + 3 = 16
        # CRR = 1 - 12/16 = 0.25
        self.assertEqual(metrics['avg_crr'], 0.25)

    def test_fuzzy_matches_dont_count_for_precision_recall(self):
        """Fuzzy matches should NOT count toward precision/recall"""
        matches = [
            ('hello', 'hello', 0, 'exact'),
            ('world', 'wrld', 1, 'fuzzy')  # Fuzzy match
        ]

        metrics = calculate_metrics(matches)

        # Only exact match counts
        self.assertEqual(metrics['precision'], 0.5)  # 1/2
        self.assertEqual(metrics['recall'], 0.5)  # 1/2
        self.assertEqual(metrics['exact_matches'], 1)
        self.assertEqual(metrics['fuzzy_matches'], 1)

    def test_fuzzy_matches_count_for_crr(self):
        """Fuzzy matches DO count toward CRR"""
        # GT: "hello" (5 chars)
        # OCR: "helo" (4 chars)
        # Fuzzy match with edit distance 1
        matches = [
            ('hello', 'helo', 1, 'fuzzy')
        ]

        metrics = calculate_metrics(matches)

        # CRR = 1 - (1 error / 5 chars) = 0.8
        self.assertEqual(metrics['avg_crr'], 0.8)

    def test_empty_matches(self):
        """Handle empty match list"""
        matches = []

        metrics = calculate_metrics(matches)

        self.assertEqual(metrics['precision'], 0.0)
        self.assertEqual(metrics['recall'], 0.0)
        self.assertEqual(metrics['f1_score'], 0.0)
        self.assertEqual(metrics['avg_crr'], 0.0)
        self.assertEqual(metrics['exact_matches'], 0)

    def test_zero_division_handling(self):
        """Handle zero division cases gracefully"""
        # Only GT words, no OCR
        matches = [
            ('hello', None, None, 'gt_only')
        ]

        metrics = calculate_metrics(matches)

        # Precision should be 0 (0 exact / 0 OCR words)
        self.assertEqual(metrics['precision'], 0.0)
        # Recall should be 0 (0 exact / 1 GT word)
        self.assertEqual(metrics['recall'], 0.0)

    def test_counts_are_correct(self):
        """Verify all count fields are correct"""
        matches = [
            ('a', 'a', 0, 'exact'),
            ('b', 'b', 0, 'exact'),
            ('c', 'd', 1, 'fuzzy'),
            ('e', None, None, 'gt_only'),
            (None, 'f', None, 'ocr_only')
        ]

        metrics = calculate_metrics(matches)

        self.assertEqual(metrics['exact_matches'], 2)
        self.assertEqual(metrics['fuzzy_matches'], 1)
        self.assertEqual(metrics['total_gt_words'], 4)  # a, b, c, e
        self.assertEqual(metrics['total_ocr_words'], 4)  # a, b, d, f
        self.assertEqual(metrics['unmatched_gt'], 1)  # e
        self.assertEqual(metrics['unmatched_ocr'], 1)  # f


class TestFormatMetricsForDisplay(unittest.TestCase):
    """Test metrics formatting for display"""

    def test_format_percentages(self):
        """Format metrics as percentages"""
        metrics = {
            'precision': 0.6667,
            'recall': 0.5,
            'avg_crr': 0.75,
            'f1_score': 0.5714,
            'exact_matches': 2,
            'fuzzy_matches': 1,
            'total_gt_words': 3,
            'total_ocr_words': 3,
            'unmatched_gt': 1,
            'unmatched_ocr': 1
        }

        formatted = format_metrics_for_display(metrics)

        self.assertEqual(formatted['precision'], "66.67%")
        self.assertEqual(formatted['recall'], "50.00%")
        self.assertEqual(formatted['avg_crr'], "75.00%")
        self.assertIn("57.1", formatted['f1_score'])

    def test_format_preserves_counts(self):
        """Counts should not be formatted"""
        metrics = {
            'precision': 1.0,
            'recall': 1.0,
            'avg_crr': 1.0,
            'f1_score': 1.0,
            'exact_matches': 5,
            'fuzzy_matches': 2,
            'total_gt_words': 7,
            'total_ocr_words': 7,
            'unmatched_gt': 0,
            'unmatched_ocr': 0
        }

        formatted = format_metrics_for_display(metrics)

        self.assertEqual(formatted['exact_matches'], 5)
        self.assertEqual(formatted['fuzzy_matches'], 2)
        self.assertEqual(formatted['total_gt_words'], 7)


if __name__ == '__main__':
    unittest.main()
