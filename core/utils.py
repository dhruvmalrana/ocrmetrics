"""
Utility functions for OCR metrics calculation.
"""

def levenshtein_distance(word1, word2):
    """
    Calculate the Levenshtein edit distance between two words.

    Args:
        word1 (str): First word
        word2 (str): Second word

    Returns:
        int: Minimum number of single-character edits (insertions, deletions, substitutions)
             required to change word1 into word2
    """
    # Try using the fast C implementation first
    try:
        import Levenshtein
        return Levenshtein.distance(word1, word2)
    except ImportError:
        # Fallback to pure Python implementation
        return _levenshtein_python(word1, word2)


def _levenshtein_python(word1, word2):
    """
    Pure Python implementation of Levenshtein distance using dynamic programming.

    Args:
        word1 (str): First word
        word2 (str): Second word

    Returns:
        int: Edit distance
    """
    len1, len2 = len(word1), len(word2)

    # Create a matrix to store distances
    # dp[i][j] = edit distance between word1[0:i] and word2[0:j]
    dp = [[0] * (len2 + 1) for _ in range(len1 + 1)]

    # Initialize base cases
    for i in range(len1 + 1):
        dp[i][0] = i  # Delete all characters from word1
    for j in range(len2 + 1):
        dp[0][j] = j  # Insert all characters from word2

    # Fill the matrix
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            if word1[i - 1] == word2[j - 1]:
                # Characters match, no edit needed
                dp[i][j] = dp[i - 1][j - 1]
            else:
                # Take minimum of:
                # 1. Replace (substitute): dp[i-1][j-1] + 1
                # 2. Delete from word1: dp[i-1][j] + 1
                # 3. Insert into word1: dp[i][j-1] + 1
                dp[i][j] = 1 + min(
                    dp[i - 1][j - 1],  # Replace
                    dp[i - 1][j],      # Delete
                    dp[i][j - 1]       # Insert
                )

    return dp[len1][len2]


def calculate_crr(gt_word, ocr_word):
    """
    Calculate Character Recognition Rate for a word pair.

    CRR = 1 - (edit_distance / max_length)

    Args:
        gt_word (str): Ground truth word
        ocr_word (str): OCR output word

    Returns:
        float: CRR score between 0 and 1 (1 = perfect match)
    """
    if not gt_word and not ocr_word:
        return 1.0

    max_len = max(len(gt_word), len(ocr_word))
    if max_len == 0:
        return 1.0

    edit_dist = levenshtein_distance(gt_word, ocr_word)
    crr = 1.0 - (edit_dist / max_len)

    return max(0.0, crr)  # Ensure non-negative
