"""
Unit tests for core/preprocessor.py
Tests tokenization, normalization, and text preprocessing
"""

import unittest
from core.preprocessor import tokenize, normalize, remove_punctuation, preprocess_text


class TestTokenize(unittest.TestCase):
    """Test text tokenization"""

    def test_simple_tokenization(self):
        """Basic tokenization by whitespace"""
        self.assertEqual(tokenize("hello world"), ["hello", "world"])
        self.assertEqual(tokenize("one two three"), ["one", "two", "three"])

    def test_multiple_spaces(self):
        """Handle multiple spaces"""
        self.assertEqual(tokenize("hello  world"), ["hello", "world"])
        self.assertEqual(tokenize("one   two    three"), ["one", "two", "three"])

    def test_tabs_and_newlines(self):
        """Handle tabs and newlines"""
        self.assertEqual(tokenize("hello\tworld"), ["hello", "world"])
        self.assertEqual(tokenize("hello\nworld"), ["hello", "world"])
        self.assertEqual(tokenize("hello\r\nworld"), ["hello", "world"])

    def test_mixed_whitespace(self):
        """Handle mixed whitespace"""
        self.assertEqual(tokenize("hello \t world\n test"), ["hello", "world", "test"])

    def test_empty_string(self):
        """Empty string should return empty list"""
        self.assertEqual(tokenize(""), [])
        self.assertEqual(tokenize("   "), [])

    def test_single_word(self):
        """Single word"""
        self.assertEqual(tokenize("hello"), ["hello"])


class TestRemovePunctuation(unittest.TestCase):
    """Test punctuation removal"""

    def test_basic_punctuation(self):
        """Remove basic punctuation"""
        import string
        self.assertEqual(remove_punctuation("hello.", string.punctuation), "hello")
        self.assertEqual(remove_punctuation("hello,world!", string.punctuation), "helloworld")

    def test_multiple_punctuation(self):
        """Remove multiple punctuation marks"""
        import string
        self.assertEqual(remove_punctuation("hello...", string.punctuation), "hello")
        self.assertEqual(remove_punctuation("test!!!", string.punctuation), "test")

    def test_no_punctuation(self):
        """No punctuation to remove"""
        import string
        self.assertEqual(remove_punctuation("hello", string.punctuation), "hello")

    def test_only_punctuation(self):
        """String with only punctuation"""
        import string
        self.assertEqual(remove_punctuation("!!!", string.punctuation), "")

    def test_custom_punctuation(self):
        """Custom punctuation characters"""
        self.assertEqual(remove_punctuation("hello.world", "."), "helloworld")
        self.assertEqual(remove_punctuation("test-case", "-"), "testcase")


class TestNormalize(unittest.TestCase):
    """Test word normalization"""

    def test_case_insensitive(self):
        """Convert to lowercase when case_insensitive"""
        config = {'case_sensitive': False, 'ignore_punctuation': False}
        self.assertEqual(normalize(["Hello", "WORLD"], config), ["hello", "world"])

    def test_case_sensitive(self):
        """Preserve case when case_sensitive"""
        config = {'case_sensitive': True, 'ignore_punctuation': False}
        self.assertEqual(normalize(["Hello", "WORLD"], config), ["Hello", "WORLD"])

    def test_ignore_punctuation(self):
        """Remove punctuation when ignore_punctuation"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}
        self.assertEqual(normalize(["hello.", "world!"], config), ["hello", "world"])

    def test_keep_punctuation(self):
        """Keep punctuation when not ignoring"""
        config = {'case_sensitive': False, 'ignore_punctuation': False}
        self.assertEqual(normalize(["hello.", "world!"], config), ["hello.", "world!"])

    def test_combined_normalization(self):
        """Both case and punctuation normalization"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}
        self.assertEqual(normalize(["Hello.", "WORLD!"], config), ["hello", "world"])

    def test_empty_words_removed(self):
        """Empty words (punctuation-only) should be removed"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}
        self.assertEqual(normalize(["hello", ".", "world"], config), ["hello", "world"])

    def test_empty_list(self):
        """Empty word list"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}
        self.assertEqual(normalize([], config), [])


class TestPreprocessText(unittest.TestCase):
    """Test complete text preprocessing pipeline"""

    def test_basic_preprocessing(self):
        """Basic text preprocessing"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}
        normalized, word_data = preprocess_text("Hello World", config)

        self.assertEqual(normalized, ["hello", "world"])
        self.assertEqual(len(word_data), 2)
        self.assertEqual(word_data[0]['normalized'], "hello")
        self.assertEqual(word_data[0]['original'], "Hello")
        self.assertEqual(word_data[0]['position'], 0)

    def test_word_data_structure(self):
        """Word data contains correct structure"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}
        normalized, word_data = preprocess_text("Hello, World!", config)

        # Check structure
        for item in word_data:
            self.assertIn('normalized', item)
            self.assertIn('original', item)
            self.assertIn('position', item)

        # Check values
        self.assertEqual(word_data[0]['normalized'], "hello")
        self.assertEqual(word_data[0]['original'], "Hello,")
        self.assertEqual(word_data[1]['normalized'], "world")
        self.assertEqual(word_data[1]['original'], "World!")

    def test_preserves_original(self):
        """Original words are preserved"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}
        normalized, word_data = preprocess_text("HELLO world!", config)

        # Normalized should be lowercase
        self.assertEqual(normalized[0], "hello")
        # Original should be preserved
        self.assertEqual(word_data[0]['original'], "HELLO")

    def test_case_sensitive_config(self):
        """Case-sensitive configuration"""
        config = {'case_sensitive': True, 'ignore_punctuation': False}
        normalized, word_data = preprocess_text("Hello World", config)

        self.assertEqual(normalized, ["Hello", "World"])
        self.assertEqual(word_data[0]['normalized'], "Hello")

    def test_empty_text(self):
        """Empty text"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}
        normalized, word_data = preprocess_text("", config)

        self.assertEqual(normalized, [])
        self.assertEqual(word_data, [])

    def test_position_tracking(self):
        """Position indices are correct"""
        config = {'case_sensitive': False, 'ignore_punctuation': True}
        normalized, word_data = preprocess_text("one two three", config)

        self.assertEqual(word_data[0]['position'], 0)
        self.assertEqual(word_data[1]['position'], 1)
        self.assertEqual(word_data[2]['position'], 2)


if __name__ == '__main__':
    unittest.main()
