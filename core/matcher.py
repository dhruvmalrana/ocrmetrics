"""
Word matching algorithm for OCR evaluation.
Implements two-phase matching: exact matching followed by fuzzy matching.
"""

from collections import Counter
from .utils import levenshtein_distance


def match_words(gt_words, ocr_words, threshold=1):
    """
    Match OCR words to ground truth words using exact and fuzzy matching.
    Order-invariant, handles word counts properly.

    Algorithm:
    1. Phase 1 - Exact Matching: Match identical words first
    2. Phase 2 - Fuzzy Matching: Match remaining words using edit distance ≤ threshold

    Args:
        gt_words (list): List of preprocessed ground truth words
        ocr_words (list): List of preprocessed OCR output words
        threshold (int): Maximum edit distance for fuzzy matching (default: 1)

    Returns:
        list: List of match tuples (gt_word, ocr_word, edit_distance, match_type)
              match_type can be: 'exact', 'fuzzy', 'gt_only', 'ocr_only'
    """
    matches = []

    # Count word occurrences (handles duplicates)
    gt_counts = Counter(gt_words)
    ocr_counts = Counter(ocr_words)

    # Track matched word instances
    gt_matched = Counter()
    ocr_matched = Counter()

    # PHASE 1: Exact matching (greedy, highest counts first)
    # This ensures exact matches are prioritized
    for gt_word in sorted(gt_counts.keys(), key=lambda w: gt_counts[w], reverse=True):
        if gt_word in ocr_counts:
            # Match as many instances as possible
            match_count = min(gt_counts[gt_word], ocr_counts[gt_word])
            for _ in range(match_count):
                matches.append((gt_word, gt_word, 0, 'exact'))
            gt_matched[gt_word] = match_count
            ocr_matched[gt_word] = match_count

    # PHASE 2: Fuzzy matching for unmatched words
    # Create lists of remaining unmatched instances
    gt_remaining = []
    for word, count in gt_counts.items():
        matched = gt_matched.get(word, 0)
        gt_remaining.extend([word] * (count - matched))

    ocr_remaining = []
    for word, count in ocr_counts.items():
        matched = ocr_matched.get(word, 0)
        ocr_remaining.extend([word] * (count - matched))

    # Greedy fuzzy matching: find best pairs below threshold
    while gt_remaining and ocr_remaining:
        best_match = None
        best_distance = threshold + 1
        best_gt_idx = None
        best_ocr_idx = None

        # Find the best match (lowest edit distance ≤ threshold)
        for gt_idx, gt_word in enumerate(gt_remaining):
            for ocr_idx, ocr_word in enumerate(ocr_remaining):
                distance = levenshtein_distance(gt_word, ocr_word)

                # Check if this is a better match
                if distance <= threshold and distance < best_distance:
                    best_distance = distance
                    best_match = (gt_word, ocr_word, distance)
                    best_gt_idx = gt_idx
                    best_ocr_idx = ocr_idx

        # If we found a match, record it and remove from remaining lists
        if best_match:
            gt_word, ocr_word, distance = best_match
            matches.append((gt_word, ocr_word, distance, 'fuzzy'))
            gt_remaining.pop(best_gt_idx)
            ocr_remaining.pop(best_ocr_idx)
        else:
            # No more matches possible
            break

    # PHASE 3: Mark unmatched words
    # GT words with no match (false negatives)
    for gt_word in gt_remaining:
        matches.append((gt_word, None, None, 'gt_only'))

    # OCR words with no match (false positives)
    for ocr_word in ocr_remaining:
        matches.append((None, ocr_word, None, 'ocr_only'))

    return matches


def create_annotations(word_data, matches, is_ground_truth=True):
    """
    Create annotations for text visualization, preserving original word order.

    Args:
        word_data (list): List of word data dicts with keys: normalized, original, position
        matches (list): Match results from match_words()
        is_ground_truth (bool): True if annotating GT text, False if OCR text

    Returns:
        list: List of annotation dicts with keys: word, match_type, matched_with, edit_distance
    """
    # Build a mapping from normalized words to their match information
    # Handle duplicates by tracking counts
    match_map = {}  # normalized_word -> list of (matched_with, edit_dist, match_type)

    if is_ground_truth:
        for match in matches:
            gt_word, ocr_word, edit_dist, match_type = match
            if match_type in ['exact', 'fuzzy', 'gt_only']:
                if gt_word not in match_map:
                    match_map[gt_word] = []
                match_map[gt_word].append({
                    'matched_with': ocr_word,
                    'edit_distance': edit_dist,
                    'match_type': match_type
                })
    else:
        for match in matches:
            gt_word, ocr_word, edit_dist, match_type = match
            if match_type in ['exact', 'fuzzy', 'ocr_only']:
                if ocr_word not in match_map:
                    match_map[ocr_word] = []
                match_map[ocr_word].append({
                    'matched_with': gt_word,
                    'edit_distance': edit_dist,
                    'match_type': match_type
                })

    # Create annotations in original word order
    annotations = []
    used_counts = {}  # Track which instance of each word we've used

    for word_info in word_data:
        normalized = word_info['normalized']
        original = word_info['original']

        if normalized in match_map:
            # Get the index for this instance of the word
            idx = used_counts.get(normalized, 0)
            used_counts[normalized] = idx + 1

            # Get match info for this instance (if available)
            if idx < len(match_map[normalized]):
                match_info = match_map[normalized][idx]
            else:
                # Fallback if we have more instances than matches
                match_info = match_map[normalized][-1]

            annotations.append({
                'word': original,  # Use original word, not normalized
                'match_type': match_info['match_type'],
                'matched_with': match_info['matched_with'],
                'edit_distance': match_info['edit_distance']
            })
        else:
            # No match found - shouldn't happen but handle gracefully
            annotations.append({
                'word': original,
                'match_type': 'ocr_only' if not is_ground_truth else 'gt_only',
                'matched_with': None,
                'edit_distance': None
            })

    return annotations
