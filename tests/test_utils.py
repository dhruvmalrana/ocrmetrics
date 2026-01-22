"""
Unit tests for core/utils.py
Tests Levenshtein distance and CRR calculation
"""

import unittest
from core.utils import levenshtein_distance, calculate_crr


class TestLevenshteinDistance(unittest.TestCase):
    """Test Levenshtein edit distance calculation"""

    def test_identical_strings(self):
        """Identical strings should have distance 0"""
        self.assertEqual(levenshtein_distance("hello", "hello"), 0)
        self.assertEqual(levenshtein_distance("test", "test"), 0)
        self.assertEqual(levenshtein_distance("", ""), 0)

    def test_one_substitution(self):
        """One character substitution should have distance 1"""
        self.assertEqual(levenshtein_distance("cat", "cut"), 1)
        self.assertEqual(levenshtein_distance("hello", "hallo"), 1)

    def test_one_deletion(self):
        """One character deletion should have distance 1"""
        self.assertEqual(levenshtein_distance("hello", "helo"), 1)
        self.assertEqual(levenshtein_distance("test", "tst"), 1)

    def test_one_insertion(self):
        """One character insertion should have distance 1"""
        self.assertEqual(levenshtein_distance("cat", "cart"), 1)
        self.assertEqual(levenshtein_distance("test", "tests"), 1)

    def test_multiple_operations(self):
        """Multiple operations should calculate correct distance"""
        self.assertEqual(levenshtein_distance("kitten", "sitting"), 3)
        self.assertEqual(levenshtein_distance("saturday", "sunday"), 3)

    def test_empty_strings(self):
        """Empty string comparisons"""
        self.assertEqual(levenshtein_distance("", "hello"), 5)
        self.assertEqual(levenshtein_distance("hello", ""), 5)

    def test_completely_different(self):
        """Completely different strings"""
        self.assertEqual(levenshtein_distance("abc", "xyz"), 3)

    def test_case_sensitive(self):
        """Distance is case-sensitive"""
        self.assertEqual(levenshtein_distance("Hello", "hello"), 1)


class TestCalculateCRR(unittest.TestCase):
    """Test Character Recognition Rate calculation"""

    def test_identical_words(self):
        """Identical words should have CRR of 1.0 (100%)"""
        self.assertEqual(calculate_crr("hello", "hello"), 1.0)
        self.assertEqual(calculate_crr("test", "test"), 1.0)

    def test_one_error(self):
        """One character error should calculate correct CRR"""
        # "hello" vs "helo": 1 error, 5 chars = 1 - 1/5 = 0.8
        self.assertAlmostEqual(calculate_crr("hello", "helo"), 0.8, places=5)

        # "cat" vs "cut": 1 error, 3 chars = 1 - 1/3 = 0.6667
        self.assertAlmostEqual(calculate_crr("cat", "cut"), 0.6667, places=4)

    def test_multiple_errors(self):
        """Multiple character errors"""
        # "test" vs "best": 1 error, 4 chars = 1 - 1/4 = 0.75
        self.assertAlmostEqual(calculate_crr("test", "best"), 0.75, places=5)

        # "kitten" vs "sitting": 3 errors, 7 chars = 1 - 3/7 = 0.5714
        self.assertAlmostEqual(calculate_crr("kitten", "sitting"), 0.5714, places=4)

    def test_different_lengths(self):
        """Words with different lengths (uses max length)"""
        # "cat" vs "cart": 1 insertion, max(3,4) = 4 = 1 - 1/4 = 0.75
        self.assertAlmostEqual(calculate_crr("cat", "cart"), 0.75, places=5)

        # "hello" vs "helo": 1 deletion, max(5,4) = 5 = 1 - 1/5 = 0.8
        self.assertAlmostEqual(calculate_crr("hello", "helo"), 0.8, places=5)

    def test_completely_different(self):
        """Completely different words should have low CRR"""
        # "abc" vs "xyz": 3 errors, 3 chars = 1 - 3/3 = 0.0
        self.assertEqual(calculate_crr("abc", "xyz"), 0.0)

    def test_empty_strings(self):
        """Empty string cases"""
        self.assertEqual(calculate_crr("", ""), 1.0)
        self.assertEqual(calculate_crr("hello", ""), 0.0)
        self.assertEqual(calculate_crr("", "hello"), 0.0)

    def test_non_negative(self):
        """CRR should never be negative"""
        # Even if errors > length, CRR should be 0.0, not negative
        result = calculate_crr("a", "xyz")
        self.assertGreaterEqual(result, 0.0)


if __name__ == '__main__':
    unittest.main()
