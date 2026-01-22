"""
Batch processing for comparing multiple OCR models against ground truth.
"""

from .preprocessor import preprocess_text
from .matcher import match_words, create_annotations
from .metrics import calculate_metrics


def process_batch(ground_truth, models, config):
    """
    Process multiple OCR model outputs against a single ground truth.

    Args:
        ground_truth (str): Ground truth text
        models (list): List of dicts with keys 'name' and 'text'
        config (dict): Configuration for preprocessing and matching

    Returns:
        list: List of result dicts, one per model:
            {
                'model_name': str,
                'metrics': dict,
                'matches': list,
                'gt_annotations': list,
                'ocr_annotations': list
            }
    """
    results = []

    # Preprocess ground truth once
    gt_words, gt_word_data = preprocess_text(ground_truth, config)

    for model in models:
        model_name = model['name']
        ocr_text = model['text']

        # Process this model
        result = process_single_model(
            ground_truth,
            ocr_text,
            gt_words,
            gt_word_data,
            model_name,
            config
        )

        results.append(result)

    return results


def process_single_model(ground_truth, ocr_text, gt_words_preprocessed, gt_word_data, model_name, config):
    """
    Process a single OCR model output against ground truth.

    Args:
        ground_truth (str): Original ground truth text
        ocr_text (str): OCR output text
        gt_words_preprocessed (list): Preprocessed GT words (to avoid reprocessing)
        gt_word_data (list): GT word data with original words and positions
        model_name (str): Name of the model
        config (dict): Configuration

    Returns:
        dict: Result dictionary with metrics and annotations
    """
    # Preprocess OCR output
    ocr_words, ocr_word_data = preprocess_text(ocr_text, config)

    # Get threshold from config
    threshold = config.get('edit_distance_threshold', 1)

    # Match words
    matches = match_words(gt_words_preprocessed, ocr_words, threshold)

    # Calculate metrics
    metrics = calculate_metrics(matches)

    # Create annotations for visualization (preserving original word order)
    gt_annotations = create_annotations(gt_word_data, matches, is_ground_truth=True)
    ocr_annotations = create_annotations(ocr_word_data, matches, is_ground_truth=False)

    return {
        'model_name': model_name,
        'metrics': metrics,
        'matches': matches,
        'gt_annotations': gt_annotations,
        'ocr_annotations': ocr_annotations,
        'gt_text': ground_truth,
        'ocr_text': ocr_text
    }
