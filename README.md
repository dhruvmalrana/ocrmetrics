# OCR Metrics Evaluator

A client-side web application for evaluating OCR (Optical Character Recognition) output quality. Calculate word-level precision, recall, F1 score, and Character Recognition Rate (CRR) with interactive visualizations.

**✨ Runs entirely in your browser - no server needed!**

## Features

- **Three Evaluation Modes**:
  - **Manual Input**: Quick single comparison with examples
  - **Batch Upload**: Compare multiple OCR models at once
  - **Examples**: Pre-loaded datasets with preview images

- **Standard OCR Metrics**:
  - Word-level Precision and Recall (exact matches only)
  - Document-level Character Recognition Rate (CRR)
  - F1 Score for balanced evaluation

- **Interactive Visualizations**:
  - Color-coded highlighting (red = unmatched words)
  - Hover over words to see matches across panels
  - Expandable comparison tables

- **Batch Comparison Features**:
  - Automatic ranking with medals (🥇🥈🥉)
  - CSV export
  - Configurable column visibility

## Quick Start

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/ocrmetrics.git
cd ocrmetrics

# 2. Start local server
python3 -m http.server 8000

# 3. Open browser
open http://localhost:8000/
```

That's it! No dependencies, no build process.

### Deploy to GitHub Pages

```bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# Enable GitHub Pages:
# Go to repo Settings → Pages → Source: "GitHub Actions"
# Site will be live at: https://YOUR_USERNAME.github.io/ocrmetrics/
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

## Usage

### Manual Input Mode

1. Click **"Manual Input"** tab
2. Enter ground truth and OCR output (or use the example)
3. Adjust settings (case sensitivity, punctuation)
4. Click **"Analyze"**
5. View metrics and hover over words to see matches

### Batch Upload Mode

1. Click **"Batch Upload"** tab
2. Upload files:
   - `gt.txt` - Ground truth
   - `model_name_out.txt` - OCR outputs (e.g., `tesseract_out.txt`)
3. Click **"Analyze All"**
4. View ranked comparison table
5. Click **"+"** to expand details
6. Export to CSV if needed

### Examples Mode

1. Click **"Examples"** tab
2. Click any example card
3. Results display automatically

## Metrics Explained

### Precision
What % of OCR words are correct?
```
Precision = Exact Matches / Total OCR Words
```
**Example**: OCR outputs "hello world test", GT has "hello world" → 2/3 = 66.67%

### Recall
What % of GT words were found?
```
Recall = Exact Matches / Total GT Words
```
**Example**: GT has "hello world test", OCR outputs "hello world" → 2/3 = 66.67%

### F1 Score
Balanced metric combining precision and recall
```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

### CRR (Character Recognition Rate)
Character-level accuracy using Levenshtein distance
```
CRR = 1 - CER
CER = Levenshtein_Distance(OCR_text, GT_text) / Total_GT_Characters
```
Levenshtein distance counts the minimum single-character edits (insertions, deletions, substitutions) needed to transform OCR output into ground truth.

**Note**: CRR can be negative if OCR produces significantly more errors than GT characters (CER > 100%)

## Configuration Options

- **Case Sensitive**: Treat "Hello" and "hello" as different (default: off)
- **Ignore Punctuation**: Strip punctuation before matching (default: on)

## File Format (Batch Mode)

### Required Files

**Ground Truth:**
- Filename: `gt.txt`
- Content: Reference text

**OCR Outputs:**
- Format: `<model_name>_out.txt`
- Examples: `tesseract_out.txt`, `google_vision_out.txt`

### Example Structure
```
your_files/
├── gt.txt                    # Ground truth
├── tesseract_out.txt         # Model: tesseract
├── google_vision_out.txt     # Model: google_vision
└── aws_textract_out.txt      # Model: aws_textract
```

To test batch mode, you can use files from any `examples/` folder.

## Adding Your Own Examples

1. Create folder: `examples/my_example/`
2. Add files: `preview.png`, `gt.txt`, `model_out.txt`
3. Update `examples/examples.json` with example metadata
4. Refresh page - your example appears!

See [examples/README.md](examples/README.md) for complete instructions and JSON format.

## How It Works

### Matching Algorithm

1. **Preprocessing**:
   - Tokenize by whitespace
   - Apply case/punctuation normalization
   - Count word occurrences

2. **Exact Matching**:
   - Match identical words (case-insensitive if configured)
   - Handle duplicates correctly
   - Only exact matches count toward precision/recall

3. **Character Error Rate (CER)**:
   - Uses Levenshtein (edit) distance on concatenated text
   - Counts minimum single-character edits: insertions, deletions, substitutions
   - CER = Levenshtein_Distance / Total_GT_Characters
   - CRR = 1 - CER

### References

The metrics implemented follow standard OCR evaluation practices:

- **Levenshtein Distance**: V.I. Levenshtein, "Binary codes capable of correcting deletions, insertions, and reversals," Soviet Physics Doklady, 1966
- **CER for OCR**: R. Prasad et al., "Evaluation metrics for document analysis," ICDAR 2001
- **OCR Evaluation Best Practices**: [OCR-D Ground Truth Guidelines](https://ocr-d.de/en/gt-guidelines/trans/trLevelOfTranscription.html)

## Testing

Run the test suite:

```bash
# Start test server
./run-tests.sh

# Or manually
python3 -m http.server 8000
open http://localhost:8000/tests/run-tests.html
```

All core logic is tested:
- Text preprocessing and normalization
- Word matching algorithm (exact matching)
- Metrics calculation (Precision, Recall, F1, CRR)

See [tests/README.md](tests/README.md) for details.

## Technical Details

### Architecture

**Client-Side Only:**
- No backend server required
- All processing in JavaScript
- Works offline after first load

**Core Modules:**
- `static/js/preprocessor.js` - Text normalization
- `static/js/matcher.js` - Word matching (exact matching only)
- `static/js/metrics.js` - Metrics calculation

**UI:**
- Vanilla JavaScript (no frameworks)
- Responsive design
- File upload via FileReader API

### Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## Color Legend

**Static Colors:**
- No highlight = Exact match
- Red background = No match

**Hover Highlighting:**
- Gold background = Hovered word
- Blue background = Matched counterpart
- Gold border = Same word, same panel
- Blue border = Same word, other panel

## Example Results

```
Ground Truth: "The quick brown fox"
OCR Output: "The quik brown"

Matching:
- Exact Matches: "The", "brown" (2 words)
- Unmatched GT: "quick", "fox"
- Unmatched OCR: "quik"

Results:
- Precision: 66.67% (2 exact matches / 3 OCR words)
- Recall: 50.00% (2 exact matches / 4 GT words)
- F1 Score: 57.14%
- CRR: 68.75%
  - GT text (normalized): "thequickbrownfox" (16 chars)
  - OCR text (normalized): "thequikbrown" (12 chars)
  - Levenshtein distance: 5 edits (c→k substitution + delete "fox")
  - CER = 5/16 = 31.25%
  - CRR = 1 - 31.25% = 68.75%
```

**Key improvement**: With the old word-level approximation, "quick"→"quik" would count as 9 errors (5 deletions + 4 insertions). With Levenshtein distance, it correctly counts as just 1 substitution.

## License

MIT License

## Contributing

Pull requests welcome! Please include tests for new features.

## Links

- [Deployment Guide](DEPLOYMENT.md)
- [Testing Guide](TESTING.md)
- [Examples Guide](examples/README.md)
