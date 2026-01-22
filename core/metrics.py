"""
Metrics calculation for OCR evaluation.
Computes precision, recall, CRR (Character Recognition Rate), and F1 score.
"""

from .utils import calculate_crr


def calculate_metrics(matches):
    """
    Calculate OCR evaluation metrics from word matches.

    Metrics:
    - Precision: exact_matches / total_ocr_words (only exact matches count)
    - Recall: exact_matches / total_gt_words (only exact matches count)
    - Average CRR: Character Recognition Rate across all matched pairs (exact + fuzzy)
    - F1 Score: Harmonic mean of precision and recall

    Args:
        matches (list): List of match tuples from matcher.match_words()
                       (gt_word, ocr_word, edit_distance, match_type)

    Returns:
        dict: Dictionary with keys:
            - precision (float): 0.0 to 1.0
            - recall (float): 0.0 to 1.0
            - avg_crr (float): 0.0 to 1.0
            - f1_score (float): 0.0 to 1.0
            - exact_matches (int): Count of exact matches
            - fuzzy_matches (int): Count of fuzzy matches
            - total_gt_words (int): Total words in ground truth
            - total_ocr_words (int): Total words in OCR output
            - unmatched_gt (int): GT words with no match
            - unmatched_ocr (int): OCR words with no match
    """
    # Separate matches by type
    exact_matches = [m for m in matches if m[3] == 'exact']
    fuzzy_matches = [m for m in matches if m[3] == 'fuzzy']
    gt_only_matches = [m for m in matches if m[3] == 'gt_only']
    ocr_only_matches = [m for m in matches if m[3] == 'ocr_only']

    # Count totals
    exact_count = len(exact_matches)
    fuzzy_count = len(fuzzy_matches)
    total_gt_words = exact_count + fuzzy_count + len(gt_only_matches)
    total_ocr_words = exact_count + fuzzy_count + len(ocr_only_matches)

    # Calculate Precision and Recall (only exact matches count)
    # This aligns with Word Error Rate (WER) standards
    precision = exact_count / total_ocr_words if total_ocr_words > 0 else 0.0
    recall = exact_count / total_gt_words if total_gt_words > 0 else 0.0

    # Calculate F1 Score
    if precision + recall > 0:
        f1_score = 2 * (precision * recall) / (precision + recall)
    else:
        f1_score = 0.0

    # Calculate Average CRR for all matched pairs (exact + fuzzy)
    # This shows character-level accuracy for recognized words
    crr_scores = []

    # Exact matches have CRR = 1.0 (edit distance = 0)
    for gt_word, ocr_word, edit_dist, match_type in exact_matches:
        crr = calculate_crr(gt_word, ocr_word)
        crr_scores.append(crr)

    # Fuzzy matches have CRR based on edit distance
    for gt_word, ocr_word, edit_dist, match_type in fuzzy_matches:
        crr = calculate_crr(gt_word, ocr_word)
        crr_scores.append(crr)

    avg_crr = sum(crr_scores) / len(crr_scores) if crr_scores else 0.0

    return {
        'precision': precision,
        'recall': recall,
        'avg_crr': avg_crr,
        'f1_score': f1_score,
        'exact_matches': exact_count,
        'fuzzy_matches': fuzzy_count,
        'total_gt_words': total_gt_words,
        'total_ocr_words': total_ocr_words,
        'unmatched_gt': len(gt_only_matches),
        'unmatched_ocr': len(ocr_only_matches)
    }


def format_metrics_for_display(metrics):
    """
    Format metrics as percentages for display.

    Args:
        metrics (dict): Metrics dictionary from calculate_metrics()

    Returns:
        dict: Formatted metrics with percentage strings
    """
    return {
        'precision': f"{metrics['precision'] * 100:.2f}%",
        'recall': f"{metrics['recall'] * 100:.2f}%",
        'avg_crr': f"{metrics['avg_crr'] * 100:.2f}%",
        'f1_score': f"{metrics['f1_score'] * 100:.2f}%",
        'exact_matches': metrics['exact_matches'],
        'fuzzy_matches': metrics['fuzzy_matches'],
        'total_gt_words': metrics['total_gt_words'],
        'total_ocr_words': metrics['total_ocr_words'],
        'unmatched_gt': metrics['unmatched_gt'],
        'unmatched_ocr': metrics['unmatched_ocr']
    }
