"""
Regression test for duplicate word annotation bug (AppleCare customer issue)
Tests the specific case reported by user where 'customer' appeared twice in both
GT and OCR, but the second instance was incorrectly marked as unmatched (red).
"""

import unittest
from core.preprocessor import preprocess_text
from core.matcher import match_words, create_annotations
from core.metrics import calculate_metrics


class TestAppleCareCustomerBug(unittest.TestCase):
    """Regression test for customer duplicate word bug"""

    def test_applecare_customer_not_marked_red(self):
        """
        User-reported bug: Last 'customer' in OCR incorrectly marked red.
        Both GT and OCR have 'customer' twice - both should match exactly.
        """
        config = {'case_sensitive': False, 'ignore_punctuation': True}

        # User's exact text
        gt_text = """AppleCare Service Dear Apple Customer, Thank you for choosing AppleCare Service. To ensure the highest level of quality and reliability, all work has been performed in an Apple approved screening facility. After thorough diagnostic testing, it has been determined that a replacement iPhone* (enclosed) is necessary. Warranty: Your replacement iPhone assumes the remaining warranty of the original product or 90 days from the date of replacement or repair, whichever provides longer coverage. not covered under Apple warranty, your credit card will be charged in the amount Warranty, this replacement iPhone is provided at no charge. If the original iPhone is quoted to you when you agreed to proceed with this service/evaluation. If your original iPhone is covered under its original Apple One (1) Year Limited If your product is within its Apple One (1) Year Limited Warranty, you may consider (replace xx with your country code; for example uk for United Kingdom, ie for purchasing an AppleCare Protection Plan: www.apple.com/xx/support/products Ireland, fi for Finland, no for Norway, dk for Denmark). Note: If you are a consumer, this warranty is in addition to, and does not affect, your legal rights. Serial Number: valid for your replacement iPhone. Always retain a record of your Serial Number/s Please note that your replacement iPhone has a new Serial Number different to that of your original iPhone. However, any warranty remaining on your original iPhone is for future reference. iPhone User Tips: Important information and troubleshooting is available at Apple's online support We wish you continued enjoyment with your iPhone. AppleCare Service Sincerely, Apple's warranty, an AppleCare extended service agreement, and Repair Terms and Conditions, service parts that * The replacement product may be new or equivalent to new in performance and reliability. Any applicable cost is indicated adjacent to the part(s) or product description or in a separate invoice. Pursuant to the terms of are exchanged are not returned to the customer. U.S. and other countries. AppleCare is a service mark of Apple Inc., registered in the U.S. and other countries. Other product and company names mentioned herein may be trademarks of their respective companies. Apple Distribution International Directors: Cathy Kearney, Michael O'Sullivan (Irish), Gene Levoff (United States of America) B073-1141 Apple Distribution International Hollyhill Industrial Estate Hollyhill Ireland Cork site:"""

        ocr_text = """AppleCare Service Apple Distribution International Hollyhill Industrial Estate Hollyhill Cork Ireland Dear Apple Customer, Thank you for choosing AppleCare Service. To ensure the highest level of quality and reliability, all work has been performed in an Apple approved screening facility. After thorough diagnostic testing, it has been determined that a replacement iPhone* (enclosed) is necessary. Warranty: Your replacement iPhone assumes the remaining warranty of the original product or 90 days from the date of replacement or repair, whichever provides longer coverage. If your original iPhone is covered under its original Apple One (1) Year Limited Warranty, this replacement iPhone is provided at no charge. If the original iPhone is not covered under Apple warranty, your credit card will be charged in the amount quoted to you when you agreed to proceed with this service/evaluation. If your product is within its Apple One (1) Year Limited Warranty, you may consider purchasing an AppleCare Protection Plan: www.apple.com/xx/support/products (replace xx with your country code; for example uk for United Kingdom, ie for Ireland, fi for Finland, no for Norway, dk for Denmark). Note: If you are a consumer, this warranty is in addition to, and does not affect, your legal rights. Serial Number: Please note that your replacement iPhone has a new Serial Number different to that of your original iPhone. However, any warranty remaining on your original iPhone is valid for your replacement iPhone. Always retain a record of your Serial Number/s for future reference. iPhone User Tips: Important information and troubleshooting is available at Apple's online support site: www.apple.com/support/country. We wish you continued enjoyment with your iPhone. Sincerely, AppleCare Service * The replacement product may be new or equivalent to new in performance and reliability. Any applicable cost is indicated adjacent to the part(s) or product description or in a separate invoice. Pursuant to the terms of Apple's warranty, an AppleCare extended service agreement, and Repair Terms and Conditions, service parts that are exchanged are not returned to the customer. © 2012 Apple Inc. All rights reserved. Apple, the Apple logo, iPhone, and iTunes are trademarks of Apple Inc., registered in the U.S. and other countries. AppleCare is a service mark of Apple Inc., registered in the U.S. and other countries. Other product and company names mentioned herein may be trademarks of their respective companies. Apple Distribution International Directors: Cathy Kearney, Michael O'Sullivan (Irish), Gene Levoff (United States of America)"""

        # Preprocess
        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        # Verify both have 'customer' twice
        gt_customer_count = gt_normalized.count('customer')
        ocr_customer_count = ocr_normalized.count('customer')
        self.assertEqual(gt_customer_count, 2, "GT should have 'customer' exactly 2 times")
        self.assertEqual(ocr_customer_count, 2, "OCR should have 'customer' exactly 2 times")

        # Match
        matches = match_words(gt_normalized, ocr_normalized, threshold=0)

        # Verify 2 exact matches for 'customer'
        customer_exact_matches = [m for m in matches
                                  if m[0] == 'customer' and m[1] == 'customer' and m[3] == 'exact']
        self.assertEqual(len(customer_exact_matches), 2,
                        "Should have exactly 2 exact matches for 'customer'")

        # Create annotations
        ocr_annotations = create_annotations(ocr_data, matches, is_ground_truth=False)

        # Find all 'customer' annotations in OCR
        customer_annotations = []
        for i, ann in enumerate(ocr_annotations):
            # Normalize for comparison (remove punctuation, lowercase)
            word_normalized = ann['word'].lower().replace(',', '').replace('.', '')
            if word_normalized == 'customer':
                customer_annotations.append((i, ann))

        # Critical assertion: NO 'customer' should be marked as 'ocr_only'
        for pos, ann in customer_annotations:
            self.assertNotEqual(ann['match_type'], 'ocr_only',
                              f"'customer' at position {pos} should NOT be marked as 'ocr_only' (red). "
                              f"Found: {ann['match_type']}. Word: '{ann['word']}'")

        # All 'customer' instances should be 'exact' matches
        for pos, ann in customer_annotations:
            self.assertEqual(ann['match_type'], 'exact',
                           f"'customer' at position {pos} should be 'exact' match. "
                           f"Found: {ann['match_type']}. Word: '{ann['word']}'")

        # Verify we found exactly 2 customer annotations
        self.assertEqual(len(customer_annotations), 2,
                        f"Should find exactly 2 'customer' annotations in OCR, found {len(customer_annotations)}")

    def test_simple_duplicate_customer_case(self):
        """Simplified test case with just customer duplicates"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}

        gt_text = "hello customer world customer end"
        ocr_text = "hello customer world customer end"

        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        matches = match_words(gt_normalized, ocr_normalized, threshold=0)

        # Create annotations
        gt_annotations = create_annotations(gt_data, matches, is_ground_truth=True)
        ocr_annotations = create_annotations(ocr_data, matches, is_ground_truth=False)

        # All annotations should be exact matches
        for ann in gt_annotations:
            self.assertEqual(ann['match_type'], 'exact',
                           f"GT word '{ann['word']}' should be exact match")

        for ann in ocr_annotations:
            self.assertEqual(ann['match_type'], 'exact',
                           f"OCR word '{ann['word']}' should be exact match")

        # Specifically check both customer instances
        gt_customer_anns = [ann for ann in gt_annotations if ann['word'] == 'customer']
        ocr_customer_anns = [ann for ann in ocr_annotations if ann['word'] == 'customer']

        self.assertEqual(len(gt_customer_anns), 2)
        self.assertEqual(len(ocr_customer_anns), 2)

        for ann in gt_customer_anns:
            self.assertEqual(ann['match_type'], 'exact')

        for ann in ocr_customer_anns:
            self.assertEqual(ann['match_type'], 'exact')

    def test_unequal_customer_counts(self):
        """Test case where customer counts differ - should correctly mark as unmatched"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}

        gt_text = "hello customer world customer customer end"  # 3 customers
        ocr_text = "hello customer world customer end"  # 2 customers

        gt_normalized, gt_data = preprocess_text(gt_text, config)
        ocr_normalized, ocr_data = preprocess_text(ocr_text, config)

        matches = match_words(gt_normalized, ocr_normalized, threshold=0)

        gt_annotations = create_annotations(gt_data, matches, is_ground_truth=True)
        ocr_annotations = create_annotations(ocr_data, matches, is_ground_truth=False)

        # GT should have 2 exact + 1 gt_only
        gt_customer_anns = [ann for ann in gt_annotations if ann['word'] == 'customer']
        self.assertEqual(len(gt_customer_anns), 3)

        exact_count = sum(1 for ann in gt_customer_anns if ann['match_type'] == 'exact')
        gt_only_count = sum(1 for ann in gt_customer_anns if ann['match_type'] == 'gt_only')

        self.assertEqual(exact_count, 2)
        self.assertEqual(gt_only_count, 1)

        # OCR should have 2 exact, 0 ocr_only
        ocr_customer_anns = [ann for ann in ocr_annotations if ann['word'] == 'customer']
        self.assertEqual(len(ocr_customer_anns), 2)

        for ann in ocr_customer_anns:
            self.assertEqual(ann['match_type'], 'exact',
                           "All OCR customers should be exact since there are enough in GT")


if __name__ == '__main__':
    unittest.main()
