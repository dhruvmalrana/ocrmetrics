"""
Flask application for OCR Metrics evaluation.
Provides web interface and API endpoints for evaluating OCR output quality.
"""

from flask import Flask, render_template, request, jsonify
from core.preprocessor import preprocess_text
from core.matcher import match_words, create_annotations
from core.metrics import calculate_metrics, format_metrics_for_display
from core.file_handler import parse_uploaded_files
from core.batch_processor import process_batch

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file size


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    API endpoint for single text comparison (manual input mode).

    Request JSON:
        {
            "ground_truth": str,
            "ocr_output": str,
            "config": {
                "case_sensitive": bool,
                "ignore_punctuation": bool,
                "edit_distance_threshold": int,
                "punctuation_chars": str (optional)
            }
        }

    Returns:
        JSON: {
            "success": bool,
            "metrics": dict,
            "gt_annotations": list,
            "ocr_annotations": list,
            "error": str (if success=False)
        }
    """
    try:
        data = request.get_json()

        # Validate input
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        ground_truth = data.get('ground_truth', '')
        ocr_output = data.get('ocr_output', '')
        config = data.get('config', {})

        # Set default config values
        config.setdefault('case_sensitive', False)
        config.setdefault('ignore_punctuation', True)
        config.setdefault('edit_distance_threshold', 1)

        # Preprocess text
        gt_words, gt_word_data = preprocess_text(ground_truth, config)
        ocr_words, ocr_word_data = preprocess_text(ocr_output, config)

        # Match words
        threshold = config.get('edit_distance_threshold', 1)
        matches = match_words(gt_words, ocr_words, threshold)

        # Calculate metrics
        metrics = calculate_metrics(matches)

        # Create annotations (preserving original word order)
        gt_annotations = create_annotations(gt_word_data, matches, is_ground_truth=True)
        ocr_annotations = create_annotations(ocr_word_data, matches, is_ground_truth=False)

        return jsonify({
            'success': True,
            'metrics': metrics,
            'gt_annotations': gt_annotations,
            'ocr_annotations': ocr_annotations
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/batch-analyze', methods=['POST'])
def batch_analyze():
    """
    API endpoint for batch file comparison.

    Request: multipart/form-data with multiple .txt files
    - gt.txt: Ground truth
    - <model_name>_out.txt: OCR outputs

    Also expects form data for config:
    - case_sensitive: bool
    - ignore_punctuation: bool
    - edit_distance_threshold: int

    Returns:
        JSON: {
            "success": bool,
            "results": [
                {
                    "model_name": str,
                    "metrics": dict,
                    "gt_annotations": list,
                    "ocr_annotations": list
                },
                ...
            ],
            "errors": [str, ...],
            "error": str (if success=False)
        }
    """
    try:
        # Parse uploaded files
        file_data = parse_uploaded_files(request.files)

        # Check for errors
        if file_data['ground_truth'] is None or not file_data['models']:
            return jsonify({
                'success': False,
                'error': 'Invalid file upload',
                'errors': file_data['errors']
            }), 400

        # Get configuration from form data
        config = {
            'case_sensitive': request.form.get('case_sensitive', 'false').lower() == 'true',
            'ignore_punctuation': request.form.get('ignore_punctuation', 'true').lower() == 'true',
            'edit_distance_threshold': int(request.form.get('edit_distance_threshold', '1'))
        }

        # Process batch
        results = process_batch(
            file_data['ground_truth'],
            file_data['models'],
            config
        )

        return jsonify({
            'success': True,
            'results': results,
            'errors': file_data['errors']
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file size exceeded error."""
    return jsonify({
        'success': False,
        'error': 'File too large. Maximum file size is 10MB.'
    }), 413


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
