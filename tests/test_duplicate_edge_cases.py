"""
Unit tests for duplicate word edge cases
Tests scenarios where duplicate words might be incorrectly marked as unmatched
"""

import unittest
from core.preprocessor import preprocess_text
from core.matcher import match_words, create_annotations
from core.metrics import calculate_metrics


class TestDuplicateWordMatching(unittest.TestCase):
    """Test edge cases with duplicate words"""

    def test_perfect_duplicates_both_sides(self):
        """Both GT and OCR have same word twice - all should match"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}

        gt_text = "customer support customer service"
        ocr_text = "customer support customer service"

        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        matches = match_words(gt_normalized, ocr_normalized, threshold=0)

        # Should have 4 exact matches, no unmatched
        exact = [m for m in matches if m[3] == 'exact']
        gt_only = [m for m in matches if m[3] == 'gt_only']
        ocr_only = [m for m in matches if m[3] == 'ocr_only']

        self.assertEqual(len(exact), 4, "Should have 4 exact matches")
        self.assertEqual(len(gt_only), 0, "Should have 0 gt_only")
        self.assertEqual(len(ocr_only), 0, "Should have 0 ocr_only")

        # Check annotations - no word should be marked red
        gt_annotations = create_annotations(gt_data, matches, is_ground_truth=True)
        ocr_annotations = create_annotations(ocr_data, matches, is_ground_truth=False)

        for ann in gt_annotations:
            self.assertEqual(ann['match_type'], 'exact',
                           f"GT word '{ann['word']}' should be exact match, not {ann['match_type']}")

        for ann in ocr_annotations:
            self.assertEqual(ann['match_type'], 'exact',
                           f"OCR word '{ann['word']}' should be exact match, not {ann['match_type']}")

    def test_duplicate_gt_missing_one_in_ocr(self):
        """GT has word twice, OCR only once - one GT should be red"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}

        gt_text = "customer support customer service"
        ocr_text = "customer support service"  # Missing second "customer"

        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        matches = match_words(gt_normalized, ocr_normalized, threshold=0)

        # Should have 3 exact matches (customer, support, service)
        # and 1 gt_only (the extra customer)
        exact = [m for m in matches if m[3] == 'exact']
        gt_only = [m for m in matches if m[3] == 'gt_only']

        self.assertEqual(len(exact), 3)
        self.assertEqual(len(gt_only), 1)
        self.assertEqual(gt_only[0][0], 'customer', "Unmatched GT word should be 'customer'")

        # GT annotations should have one 'customer' as gt_only
        gt_annotations = create_annotations(gt_data, matches, is_ground_truth=True)
        customer_annotations = [ann for ann in gt_annotations if ann['word'] == 'customer']

        self.assertEqual(len(customer_annotations), 2, "Should have 2 'customer' annotations in GT")

        # One should be exact, one should be gt_only
        match_types = sorted([ann['match_type'] for ann in customer_annotations])
        self.assertEqual(match_types, ['exact', 'gt_only'])

    def test_duplicate_ocr_missing_one_in_gt(self):
        """OCR has word twice, GT only once - one OCR should be red"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}

        gt_text = "customer support service"
        ocr_text = "customer support customer service"  # Extra "customer"

        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        matches = match_words(gt_normalized, ocr_normalized, threshold=0)

        # Should have 3 exact matches and 1 ocr_only
        exact = [m for m in matches if m[3] == 'exact']
        ocr_only = [m for m in matches if m[3] == 'ocr_only']

        self.assertEqual(len(exact), 3)
        self.assertEqual(len(ocr_only), 1)
        self.assertEqual(ocr_only[0][1], 'customer', "Unmatched OCR word should be 'customer'")

        # OCR annotations should have one 'customer' as ocr_only
        ocr_annotations = create_annotations(ocr_data, matches, is_ground_truth=False)
        customer_annotations = [ann for ann in ocr_annotations if ann['word'] == 'customer']

        self.assertEqual(len(customer_annotations), 2, "Should have 2 'customer' annotations in OCR")

        # One should be exact, one should be ocr_only
        match_types = sorted([ann['match_type'] for ann in customer_annotations])
        self.assertEqual(match_types, ['exact', 'ocr_only'])

    def test_case_sensitive_duplicates_different_capitalization(self):
        """With case_sensitive=True, 'Customer' and 'customer' don't match"""
        config = {'case_sensitive': True, 'ignore_punctuation': True}

        gt_text = "Customer support customer service"  # First capitalized
        ocr_text = "customer support customer service"  # Both lowercase

        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        matches = match_words(gt_normalized, ocr_normalized, threshold=0)

        # Should match: support, one customer, service (3 exact)
        # Unmatched: GT "Customer", OCR "customer" (1 gt_only, 1 ocr_only)
        exact = [m for m in matches if m[3] == 'exact']
        gt_only = [m for m in matches if m[3] == 'gt_only']
        ocr_only = [m for m in matches if m[3] == 'ocr_only']

        self.assertEqual(len(exact), 3)
        self.assertEqual(len(gt_only), 1)
        self.assertEqual(len(ocr_only), 1)

    def test_punctuation_sensitive_duplicates(self):
        """With ignore_punctuation=False, 'customer,' and 'customer' don't match"""
        config = {'case_sensitive': False, 'ignore_punctuation': False}

        gt_text = "customer, support customer service"  # First has comma
        ocr_text = "customer support customer service"  # No commas

        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        matches = match_words(gt_normalized, ocr_normalized, threshold=0)

        # Should match: support, one customer, service (3 exact)
        # Unmatched: GT "customer,", OCR "customer" (1 gt_only, 1 ocr_only)
        exact = [m for m in matches if m[3] == 'exact']
        gt_only = [m for m in matches if m[3] == 'gt_only']
        ocr_only = [m for m in matches if m[3] == 'ocr_only']

        self.assertEqual(len(exact), 3, "Should have 3 exact matches")
        self.assertEqual(len(gt_only), 1, "Should have 1 unmatched GT word")
        self.assertEqual(len(ocr_only), 1, "Should have 1 unmatched OCR word")

        # The unmatched GT word should have a comma
        self.assertIn(',', gt_only[0][0], "Unmatched GT word should contain comma")

    def test_triple_duplicates_partial_match(self):
        """GT has word 3 times, OCR has it 2 times"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}

        gt_text = "test test test end"
        ocr_text = "test test end"

        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        matches = match_words(gt_normalized, ocr_normalized, threshold=0)

        # Should match: min(3, 2) = 2 test, plus 1 end = 3 exact
        # Unmatched: 1 gt_only test
        exact = [m for m in matches if m[3] == 'exact']
        gt_only = [m for m in matches if m[3] == 'gt_only']

        self.assertEqual(len(exact), 3)
        self.assertEqual(len(gt_only), 1)
        self.assertEqual(gt_only[0][0], 'test')

        # GT should have 3 'test' annotations: 2 exact, 1 gt_only
        gt_annotations = create_annotations(gt_data, matches, is_ground_truth=True)
        test_annotations = [ann for ann in gt_annotations if ann['word'] == 'test']

        self.assertEqual(len(test_annotations), 3)

        exact_count = sum(1 for ann in test_annotations if ann['match_type'] == 'exact')
        gt_only_count = sum(1 for ann in test_annotations if ann['match_type'] == 'gt_only')

        self.assertEqual(exact_count, 2, "Should have 2 exact 'test' matches")
        self.assertEqual(gt_only_count, 1, "Should have 1 gt_only 'test'")

    def test_whitespace_normalization_duplicates(self):
        """Extra whitespace should be normalized away"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}

        gt_text = "customer  support   customer service"  # Extra spaces
        ocr_text = "customer support customer service"

        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        matches = match_words(gt_normalized, ocr_normalized, threshold=0)

        # All should match exactly despite different spacing
        exact = [m for m in matches if m[3] == 'exact']
        self.assertEqual(len(exact), 4, "All words should match despite spacing differences")


class TestDuplicateAnnotationOrder(unittest.TestCase):
    """Test that duplicate word annotations preserve correct order"""

    def test_annotation_position_preserved(self):
        """Annotations should preserve original word positions"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}

        gt_text = "word1 word2 word1 word3"
        ocr_text = "word1 word2 word1 word3"

        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        matches = match_words(gt_normalized, ocr_normalized, threshold=0)
        gt_annotations = create_annotations(gt_data, matches, is_ground_truth=True)

        # Verify annotation order matches original
        self.assertEqual(gt_annotations[0]['word'], 'word1')
        self.assertEqual(gt_annotations[1]['word'], 'word2')
        self.assertEqual(gt_annotations[2]['word'], 'word1')
        self.assertEqual(gt_annotations[3]['word'], 'word3')

        # All should be exact matches
        for ann in gt_annotations:
            self.assertEqual(ann['match_type'], 'exact')

    def test_partial_duplicate_annotation_order(self):
        """When some duplicates match, order should still be preserved"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}

        gt_text = "apple banana apple cherry"
        ocr_text = "apple banana cherry"  # Missing second apple

        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        matches = match_words(gt_normalized, ocr_normalized, threshold=0)
        gt_annotations = create_annotations(gt_data, matches, is_ground_truth=True)

        # Verify positions are correct
        self.assertEqual(gt_annotations[0]['word'], 'apple')
        self.assertEqual(gt_annotations[1]['word'], 'banana')
        self.assertEqual(gt_annotations[2]['word'], 'apple')
        self.assertEqual(gt_annotations[3]['word'], 'cherry')

        # Check match types - first apple should match, second should be gt_only
        apple_annotations = [gt_annotations[0], gt_annotations[2]]
        match_types = [ann['match_type'] for ann in apple_annotations]

        # Exactly one should be exact and one should be gt_only
        self.assertEqual(sorted(match_types), ['exact', 'gt_only'])


if __name__ == '__main__':
    unittest.main()
