"""
Text preprocessing functions for OCR evaluation.
Handles tokenization and normalization based on configuration.
"""

import re
import string


def tokenize(text):
    """
    Tokenize text into words by splitting on whitespace.

    Args:
        text (str): Input text

    Returns:
        list: List of words (strings)
    """
    if not text:
        return []

    # Split on whitespace (spaces, tabs, newlines)
    words = text.split()

    return words


def normalize(words, config):
    """
    Normalize words based on configuration settings.

    Args:
        words (list): List of words to normalize
        config (dict): Configuration dictionary with keys:
            - case_sensitive (bool): If False, convert to lowercase
            - ignore_punctuation (bool): If True, remove punctuation
            - punctuation_chars (str): Characters to remove if ignore_punctuation is True

    Returns:
        list: List of normalized words
    """
    if not words:
        return []

    normalized = []

    for word in words:
        # Handle punctuation
        if config.get('ignore_punctuation', True):
            punct_chars = config.get('punctuation_chars', string.punctuation)
            word = remove_punctuation(word, punct_chars)

        # Handle case sensitivity
        if not config.get('case_sensitive', False):
            word = word.lower()

        # Only keep non-empty words
        if word:
            normalized.append(word)

    return normalized


def remove_punctuation(word, punctuation_chars):
    """
    Remove punctuation characters from a word.

    Args:
        word (str): Input word
        punctuation_chars (str): String of punctuation characters to remove

    Returns:
        str: Word with punctuation removed
    """
    # Remove all specified punctuation characters
    translator = str.maketrans('', '', punctuation_chars)
    return word.translate(translator)


def preprocess_text(text, config):
    """
    Complete preprocessing pipeline: tokenize and normalize.

    Args:
        text (str): Input text
        config (dict): Configuration dictionary

    Returns:
        tuple: (list of preprocessed words, list of original words with positions)
    """
    original_words = tokenize(text)
    normalized_words = normalize(original_words, config)

    # Create list of tuples: (normalized_word, original_word, position)
    word_data = []
    for i, (normalized, original) in enumerate(zip(normalized_words, original_words)):
        word_data.append({
            'normalized': normalized,
            'original': original,
            'position': i
        })

    return normalized_words, word_data
