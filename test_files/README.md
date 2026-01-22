# Test Files for OCR Metrics Evaluator

These sample files demonstrate the batch comparison feature.

## Files

- **gt.txt**: Ground truth text
- **model_a_out.txt**: OCR output with one typo ("quik" instead of "quick")
- **model_b_out.txt**: OCR output with one typo ("brwn" instead of "brown") and one missing word ("the")
- **model_c_out.txt**: Perfect OCR output (100% match)

## How to Use

1. Start the application: `./run.sh` or `python app.py`
2. Click the "Batch Upload" tab
3. Upload all files from this folder
4. Click "Analyze All"
5. Compare the metrics across all three models

## Expected Results

- **model_c**: 100% precision, 100% recall, 100% CRR (perfect)
- **model_a**: ~88.9% precision/recall with fuzzy match
- **model_b**: ~77.8% precision/recall with fuzzy match and missing word
