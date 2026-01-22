"""
File upload handling for batch OCR evaluation.
Parses uploaded .txt files and extracts ground truth and model outputs.
"""

import os


def parse_uploaded_files(files):
    """
    Parse uploaded files from Flask request.

    Expected file naming:
    - gt.txt: Ground truth text
    - <model_name>_out.txt: OCR output from a model

    Args:
        files (dict): Flask request.files dictionary or list of file-like objects

    Returns:
        dict: {
            'ground_truth': str or None,
            'models': [{'name': str, 'text': str}, ...],
            'errors': [str, ...]
        }

    Raises:
        ValueError: If no valid files are provided
    """
    result = {
        'ground_truth': None,
        'models': [],
        'errors': []
    }

    if not files:
        result['errors'].append("No files uploaded")
        return result

    # Process each file
    for file_key in files:
        file = files[file_key]

        # Skip if no file selected
        if not file or not file.filename:
            continue

        filename = file.filename

        # Validate file extension
        if not filename.endswith('.txt'):
            result['errors'].append(f"Skipping '{filename}': Only .txt files are supported")
            continue

        # Read file content
        try:
            content = file.read().decode('utf-8')
        except UnicodeDecodeError:
            result['errors'].append(f"Error reading '{filename}': File must be UTF-8 encoded")
            continue
        except Exception as e:
            result['errors'].append(f"Error reading '{filename}': {str(e)}")
            continue

        # Check if this is the ground truth file
        if filename == 'gt.txt':
            result['ground_truth'] = content
        # Check if this is a model output file
        elif filename.endswith('_out.txt'):
            model_name = extract_model_name(filename)
            result['models'].append({
                'name': model_name,
                'text': content
            })
        else:
            result['errors'].append(
                f"Skipping '{filename}': File must be either 'gt.txt' or '<model_name>_out.txt'"
            )

    # Validate results
    if result['ground_truth'] is None:
        result['errors'].append("Ground truth file 'gt.txt' not found")

    if not result['models']:
        result['errors'].append("No model output files found (must be named '<model_name>_out.txt')")

    return result


def extract_model_name(filename):
    """
    Extract model name from filename.

    Args:
        filename (str): Filename in format '<model_name>_out.txt'

    Returns:
        str: Model name

    Example:
        'tesseract_out.txt' -> 'tesseract'
        'google_vision_out.txt' -> 'google_vision'
    """
    # Remove .txt extension
    name_without_ext = filename[:-4] if filename.endswith('.txt') else filename

    # Remove _out suffix
    if name_without_ext.endswith('_out'):
        model_name = name_without_ext[:-4]
    else:
        model_name = name_without_ext

    return model_name


def validate_file_size(file, max_size_mb=10):
    """
    Validate that file size is within limits.

    Args:
        file: File-like object
        max_size_mb (int): Maximum file size in MB

    Returns:
        bool: True if file size is valid

    Raises:
        ValueError: If file is too large
    """
    # Get file size
    file.seek(0, os.SEEK_END)
    size_bytes = file.tell()
    file.seek(0)  # Reset to beginning

    max_size_bytes = max_size_mb * 1024 * 1024

    if size_bytes > max_size_bytes:
        raise ValueError(f"File is too large ({size_bytes / 1024 / 1024:.2f}MB). Maximum size is {max_size_mb}MB")

    return True
