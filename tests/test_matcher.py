"""
Unit tests for core/matcher.py
Tests word matching algorithm and annotation creation
"""

import unittest
from core.matcher import match_words, create_annotations


class TestMatchWords(unittest.TestCase):
    """Test word matching algorithm"""

    def test_all_exact_matches(self):
        """All words match exactly"""
        gt_words = ["hello", "world"]
        ocr_words = ["hello", "world"]
        matches = match_words(gt_words, ocr_words, threshold=0)

        # All should be exact matches
        exact_matches = [m for m in matches if m[3] == 'exact']
        self.assertEqual(len(exact_matches), 2)

    def test_no_matches(self):
        """No matching words"""
        gt_words = ["hello", "world"]
        ocr_words = ["foo", "bar"]
        matches = match_words(gt_words, ocr_words, threshold=0)

        # Should have 2 gt_only and 2 ocr_only
        gt_only = [m for m in matches if m[3] == 'gt_only']
        ocr_only = [m for m in matches if m[3] == 'ocr_only']
        self.assertEqual(len(gt_only), 2)
        self.assertEqual(len(ocr_only), 2)

    def test_partial_matches(self):
        """Some words match, some don't"""
        gt_words = ["hello", "world", "test"]
        ocr_words = ["hello", "foo", "test"]
        matches = match_words(gt_words, ocr_words, threshold=0)

        exact_matches = [m for m in matches if m[3] == 'exact']
        gt_only = [m for m in matches if m[3] == 'gt_only']
        ocr_only = [m for m in matches if m[3] == 'ocr_only']

        self.assertEqual(len(exact_matches), 2)  # hello, test
        self.assertEqual(len(gt_only), 1)  # world
        self.assertEqual(len(ocr_only), 1)  # foo

    def test_duplicates(self):
        """Handle duplicate words correctly"""
        gt_words = ["hello", "hello", "world"]
        ocr_words = ["hello", "world", "world"]
        matches = match_words(gt_words, ocr_words, threshold=0)

        exact_matches = [m for m in matches if m[3] == 'exact']
        gt_only = [m for m in matches if m[3] == 'gt_only']
        ocr_only = [m for m in matches if m[3] == 'ocr_only']

        # hello: match 1 (min of 2,1)
        # world: match 1 (min of 1,2)
        self.assertEqual(len(exact_matches), 2)
        self.assertEqual(len(gt_only), 1)  # one extra "hello"
        self.assertEqual(len(ocr_only), 1)  # one extra "world"

    def test_threshold_zero_no_fuzzy(self):
        """Threshold 0 should not create fuzzy matches"""
        gt_words = ["hello", "test"]
        ocr_words = ["helo", "test"]  # "helo" has edit distance 1 from "hello"
        matches = match_words(gt_words, ocr_words, threshold=0)

        fuzzy_matches = [m for m in matches if m[3] == 'fuzzy']
        self.assertEqual(len(fuzzy_matches), 0)

        # Should have 1 exact (test), 1 gt_only (hello), 1 ocr_only (helo)
        exact = [m for m in matches if m[3] == 'exact']
        gt_only = [m for m in matches if m[3] == 'gt_only']
        ocr_only = [m for m in matches if m[3] == 'ocr_only']

        self.assertEqual(len(exact), 1)
        self.assertEqual(len(gt_only), 1)
        self.assertEqual(len(ocr_only), 1)

    def test_fuzzy_matching_threshold_1(self):
        """Fuzzy matching with threshold 1"""
        gt_words = ["hello"]
        ocr_words = ["helo"]  # Edit distance 1
        matches = match_words(gt_words, ocr_words, threshold=1)

        fuzzy_matches = [m for m in matches if m[3] == 'fuzzy']
        # With threshold=1, "hello" and "helo" should fuzzy match
        self.assertEqual(len(fuzzy_matches), 1)
        self.assertEqual(fuzzy_matches[0][0], "hello")
        self.assertEqual(fuzzy_matches[0][1], "helo")
        self.assertEqual(fuzzy_matches[0][2], 1)  # edit distance

    def test_fuzzy_matching_threshold_2(self):
        """Fuzzy matching with threshold 2"""
        gt_words = ["test"]
        ocr_words = ["tst"]  # Edit distance 1
        matches = match_words(gt_words, ocr_words, threshold=2)

        fuzzy_matches = [m for m in matches if m[3] == 'fuzzy']
        self.assertEqual(len(fuzzy_matches), 1)

    def test_exact_match_priority(self):
        """Exact matches should be prioritized over fuzzy"""
        gt_words = ["hello", "world"]
        ocr_words = ["hello", "wrld"]
        matches = match_words(gt_words, ocr_words, threshold=2)

        exact = [m for m in matches if m[3] == 'exact']
        fuzzy = [m for m in matches if m[3] == 'fuzzy']

        self.assertEqual(len(exact), 1)  # "hello"
        self.assertEqual(len(fuzzy), 1)  # "world" ~ "wrld"

    def test_empty_inputs(self):
        """Handle empty inputs"""
        # Both empty
        matches = match_words([], [], threshold=1)
        self.assertEqual(len(matches), 0)

        # GT empty
        matches = match_words([], ["hello"], threshold=1)
        ocr_only = [m for m in matches if m[3] == 'ocr_only']
        self.assertEqual(len(ocr_only), 1)

        # OCR empty
        matches = match_words(["hello"], [], threshold=1)
        gt_only = [m for m in matches if m[3] == 'gt_only']
        self.assertEqual(len(gt_only), 1)

    def test_greedy_fuzzy_matching(self):
        """Greedy matching should pick best matches"""
        gt_words = ["hello", "test"]
        ocr_words = ["helo", "tst"]  # Both have distance 1
        matches = match_words(gt_words, ocr_words, threshold=1)

        fuzzy = [m for m in matches if m[3] == 'fuzzy']
        self.assertEqual(len(fuzzy), 2)

        # Check that matches are correct (not crossed)
        match_pairs = [(m[0], m[1]) for m in fuzzy]
        self.assertIn(("hello", "helo"), match_pairs)
        self.assertIn(("test", "tst"), match_pairs)


class TestCreateAnnotations(unittest.TestCase):
    """Test annotation creation for visualization"""

    def test_basic_annotations_gt(self):
        """Create annotations for ground truth"""
        word_data = [
            {'normalized': 'hello', 'original': 'Hello', 'position': 0},
            {'normalized': 'world', 'original': 'World', 'position': 1}
        ]
        matches = [
            ('hello', 'hello', 0, 'exact'),
            ('world', None, None, 'gt_only')
        ]

        annotations = create_annotations(word_data, matches, is_ground_truth=True)

        self.assertEqual(len(annotations), 2)
        self.assertEqual(annotations[0]['word'], 'Hello')
        self.assertEqual(annotations[0]['match_type'], 'exact')
        self.assertEqual(annotations[1]['word'], 'World')
        self.assertEqual(annotations[1]['match_type'], 'gt_only')

    def test_basic_annotations_ocr(self):
        """Create annotations for OCR output"""
        word_data = [
            {'normalized': 'hello', 'original': 'hello', 'position': 0},
            {'normalized': 'foo', 'original': 'foo', 'position': 1}
        ]
        matches = [
            ('hello', 'hello', 0, 'exact'),
            (None, 'foo', None, 'ocr_only')
        ]

        annotations = create_annotations(word_data, matches, is_ground_truth=False)

        self.assertEqual(len(annotations), 2)
        self.assertEqual(annotations[0]['match_type'], 'exact')
        self.assertEqual(annotations[1]['match_type'], 'ocr_only')

    def test_fuzzy_match_annotations(self):
        """Fuzzy matches in annotations"""
        word_data = [
            {'normalized': 'hello', 'original': 'hello', 'position': 0}
        ]
        matches = [
            ('hello', 'helo', 1, 'fuzzy')
        ]

        annotations = create_annotations(word_data, matches, is_ground_truth=True)

        self.assertEqual(annotations[0]['match_type'], 'fuzzy')
        self.assertEqual(annotations[0]['matched_with'], 'helo')
        self.assertEqual(annotations[0]['edit_distance'], 1)

    def test_preserves_original_word(self):
        """Annotations should use original words, not normalized"""
        word_data = [
            {'normalized': 'hello', 'original': 'HELLO', 'position': 0}
        ]
        matches = [
            ('hello', 'hello', 0, 'exact')
        ]

        annotations = create_annotations(word_data, matches, is_ground_truth=True)

        # Should preserve original case
        self.assertEqual(annotations[0]['word'], 'HELLO')

    def test_preserves_word_order(self):
        """Annotations should preserve original word order"""
        word_data = [
            {'normalized': 'one', 'original': 'One', 'position': 0},
            {'normalized': 'two', 'original': 'Two', 'position': 1},
            {'normalized': 'three', 'original': 'Three', 'position': 2}
        ]
        matches = [
            ('one', 'one', 0, 'exact'),
            ('two', None, None, 'gt_only'),
            ('three', 'three', 0, 'exact')
        ]

        annotations = create_annotations(word_data, matches, is_ground_truth=True)

        # Order should be preserved
        self.assertEqual(annotations[0]['word'], 'One')
        self.assertEqual(annotations[1]['word'], 'Two')
        self.assertEqual(annotations[2]['word'], 'Three')

    def test_duplicate_words_in_annotations(self):
        """Handle duplicate words in annotations"""
        word_data = [
            {'normalized': 'hello', 'original': 'hello', 'position': 0},
            {'normalized': 'hello', 'original': 'hello', 'position': 1}
        ]
        matches = [
            ('hello', 'hello', 0, 'exact'),
            ('hello', None, None, 'gt_only')
        ]

        annotations = create_annotations(word_data, matches, is_ground_truth=True)

        # Should handle both instances
        self.assertEqual(len(annotations), 2)
        self.assertEqual(annotations[0]['match_type'], 'exact')
        self.assertEqual(annotations[1]['match_type'], 'gt_only')


if __name__ == '__main__':
    unittest.main()
