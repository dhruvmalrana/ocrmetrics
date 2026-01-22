# OCR Metrics Evaluator

A web application for evaluating OCR (Optical Character Recognition) output quality by calculating word-level precision, recall, Character Recognition Rate (CRR), and providing visual highlighting of differences.

## Features

- **Dual Input Modes**:
  - **Manual Input**: Quick single comparison with text boxes
  - **Batch Upload**: Compare multiple OCR models against ground truth

- **Standard OCR Metrics**:
  - Word-level Precision and Recall (exact matches only - WER standard)
  - Average Character Recognition Rate (CRR) for matched words
  - F1 Score for balanced evaluation

- **Intelligent Word Matching**:
  - Two-phase algorithm: exact matching + fuzzy matching
  - Order-invariant comparison
  - Configurable edit distance threshold

- **Visual Highlighting**:
  - Color-coded text visualization
  - Red: Unmatched words
  - Purple: Fuzzy matches
  - Normal: Exact matches

- **Batch Comparison**:
  - Compare multiple OCR models simultaneously
  - Sortable comparison table
  - Expandable row details with visualizations
  - Configurable column visibility
  - CSV export

## Installation

### Prerequisites
- Python 3.7 or higher
- Conda (Miniconda or Anaconda) - **Recommended** for environment isolation

### Quick Start with Conda (Recommended)

The project comes with a conda environment already set up!

1. Clone the repository:
```bash
git clone git@github.com:dhruvmalrana/ocrmetrics.git
cd ocrmetrics
```

2. Activate the conda environment:
```bash
conda activate ocrmetrics
```

3. Run the application:
```bash
# Option 1: Use the run script
./run.sh

# Option 2: Run directly
python app.py
```

4. Open your browser to:
```
http://localhost:5000
```

### Manual Setup (Alternative)

If you prefer not to use conda:

1. Clone the repository:
```bash
git clone git@github.com:dhruvmalrana/ocrmetrics.git
cd ocrmetrics
```

2. Create a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python app.py
```

## Usage

### Manual Input Mode

1. Click "Manual Input" tab
2. Enter ground truth text in the left textarea
3. Enter OCR output text in the right textarea
4. Adjust configuration:
   - **Edit Distance Threshold**: Maximum character differences for fuzzy matching (0-5)
   - **Case Sensitive**: Whether 'Hello' and 'hello' are different
   - **Ignore Punctuation**: Whether to strip punctuation before matching
5. Click "Analyze"
6. View metrics and color-coded visualization

### Batch Upload Mode

1. Click "Batch Upload" tab
2. Prepare your files:
   - **gt.txt**: Ground truth text
   - **<model_name>_out.txt**: OCR outputs (e.g., `tesseract_out.txt`, `google_vision_out.txt`)
3. Upload files via drag-and-drop or click to browse
4. Adjust configuration settings
5. Click "Analyze All"
6. View comparison table:
   - Click column headers to sort
   - Toggle column visibility with checkboxes
   - Click "+" button to expand row and see detailed visualization
   - Click "Export as CSV" to download results

## Metrics Explanation

### Word-Level Precision

**Definition**: Of all words in the OCR output, how many are EXACT matches with the ground truth.

**Formula**:
```
Precision = Exact Matches / Total OCR Words
```

**Important**: Only exact matches count (after preprocessing). Fuzzy matches do NOT inflate precision.

**Example**:
- Ground Truth: "The quick brown fox"
- OCR Output: "The quik brown"
- Exact matches: "The", "brown" = 2
- Precision = 2/3 = 66.67%

**Interpretation**: High precision means low false positive rate (few incorrect words in OCR output).

### Word-Level Recall

**Definition**: Of all words in the ground truth, how many are EXACT matches in the OCR output.

**Formula**:
```
Recall = Exact Matches / Total GT Words
```

**Important**: Only exact matches count (aligns with Word Error Rate standards).

**Example**:
- Ground Truth: "The quick brown fox"
- OCR Output: "The quik brown"
- Exact matches: "The", "brown" = 2
- Recall = 2/4 = 50.00%

**Interpretation**: High recall means low false negative rate (few ground truth words missing from OCR).

### F1 Score

**Definition**: Harmonic mean of precision and recall, providing a balanced metric.

**Formula**:
```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

**Interpretation**: Single metric that balances both precision and recall. Useful for comparing models.

### Average Character Recognition Rate (CRR)

**Definition**: Character-level accuracy for ALL matched word pairs (both exact and fuzzy).

**Formula**:
```
For each matched pair:
  CRR = 1 - (Edit Distance / Max Word Length)

Average CRR = Mean of all CRR scores
```

**Important**:
- CRR includes BOTH exact and fuzzy matches
- Fuzzy matches contribute to CRR but NOT to precision/recall
- Shows how close near-misses are at character level

**Example**:
- Exact match: "fox" ↔ "fox" → CRR = 1.0 (100%)
- Fuzzy match: "quick" ↔ "quik" → Edit distance = 1, Max length = 5 → CRR = 1 - 1/5 = 0.8 (80%)
- Average CRR = (1.0 + 0.8) / 2 = 0.9 (90%)

**Interpretation**: Shows character-level quality of recognized words, including near-matches.

## Algorithm Details

### Word Matching Algorithm

The application uses a two-phase greedy matching algorithm:

#### Phase 1: Exact Matching
1. **Preprocessing**:
   - Tokenize text by splitting on whitespace
   - Apply normalization based on config:
     - Convert to lowercase if case-insensitive
     - Strip punctuation if enabled
   - Count word occurrences (handles duplicates)

2. **Exact Matching**:
   - For each ground truth word that appears in OCR words:
     - Match min(GT count, OCR count) instances
     - Mark as exact matches (edit distance = 0)
     - **These matches COUNT toward precision/recall**
   - Remove matched instances from consideration

#### Phase 2: Fuzzy Matching
3. **Fuzzy Matching**:
   - For remaining unmatched words:
     - Calculate Levenshtein edit distance between all pairs
     - Find best matches where distance ≤ threshold
     - Greedily match pairs with lowest edit distance first
     - **These matches are for CRR ONLY, NOT precision/recall**

4. **Result**:
   - Matched pairs (exact + fuzzy)
   - Unmatched GT words (false negatives - shown in red)
   - Unmatched OCR words (false positives - shown in red)

### Levenshtein Edit Distance

The edit distance is the minimum number of single-character operations (insertions, deletions, substitutions) required to transform one word into another.

**Examples**:
- "cat" → "cat": distance = 0 (exact match)
- "cat" → "cut": distance = 1 (1 substitution)
- "hello" → "helo": distance = 1 (1 deletion)
- "test" → "testing": distance = 3 (3 insertions)

**Implementation**: Uses `python-Levenshtein` library (fast C implementation) with pure Python fallback.

## Configuration Options

### Edit Distance Threshold (0-5)
- **Default**: 1 character
- **Purpose**: Maximum edit distance for fuzzy matching
- **Examples**:
  - Threshold = 0: Only exact matches count
  - Threshold = 1: "hello" matches "helo" (1 deletion)
  - Threshold = 2: "hello" matches "hllo" (1 deletion) and "helo" (1 deletion)
  - Threshold = 5: Very lenient matching (may match unrelated words)

### Case Sensitive
- **Default**: Unchecked (case-insensitive)
- **Purpose**: Whether to treat uppercase and lowercase as different
- **Examples**:
  - Unchecked: "Hello" = "hello" (match)
  - Checked: "Hello" ≠ "hello" (no match)

### Ignore Punctuation
- **Default**: Checked
- **Purpose**: Whether to remove punctuation before matching
- **Examples**:
  - Checked: "word." = "word" (match after stripping '.')
  - Unchecked: "word." ≠ "word" (different strings)

## File Naming Convention (Batch Mode)

### Ground Truth
- **Filename**: Must be exactly `gt.txt`
- **Content**: Reference text to compare against

### OCR Outputs
- **Format**: `<model_name>_out.txt`
- **Examples**:
  - `tesseract_out.txt` → Model name: "tesseract"
  - `google_vision_out.txt` → Model name: "google_vision"
  - `aws_textract_out.txt` → Model name: "aws_textract"
- **Content**: OCR output from the corresponding model

## Color Legend

- **No Highlight (Normal Text)**: Exact match
- **Purple Background**: Fuzzy match (matched via edit distance)
- **Red Background**: No match
  - In Ground Truth: Word not found in OCR output (false negative)
  - In OCR Output: Word not found in ground truth (false positive)

## Technical Architecture

### Backend (Python Flask)
- **app.py**: Flask application with API endpoints
- **core/preprocessor.py**: Text tokenization and normalization
- **core/matcher.py**: Two-phase word matching algorithm
- **core/metrics.py**: Precision, recall, CRR, F1 calculation
- **core/utils.py**: Levenshtein distance implementation
- **core/file_handler.py**: File upload parsing
- **core/batch_processor.py**: Multi-model comparison

### Frontend (Vanilla JavaScript)
- **app.js**: Mode switching and configuration management
- **manual-mode.js**: Single text comparison
- **batch-mode.js**: File upload and batch processing
- **table.js**: Sortable, expandable comparison table
- **styles.css**: Responsive UI styling

## Edge Cases Handled

- **Empty inputs**: Displays appropriate message
- **All exact matches**: Shows 100% metrics
- **No matches**: Shows 0% metrics
- **Duplicate words**: Correctly handles word counts
- **Punctuation-only differences**: Configurable handling
- **Case-only differences**: Configurable handling
- **Unicode characters**: Full support
- **Large files**: 10MB size limit with validation

## Comparison with Standard OCR Metrics

### Word Error Rate (WER)
Our **Precision** and **Recall** metrics use the same approach as WER:
- Only exact word matches count
- No fuzzy matching in word-level metrics
- Standard approach in speech recognition and OCR evaluation

### Character Error Rate (CER)
Our **CRR** metric is the inverse of CER:
- CER measures errors, CRR measures correctness
- Both use edit distance at character level
- CRR = 1 - (Edit Distance / Max Length)

## Example Workflow

### Manual Mode Example
```
Ground Truth: "The quick brown fox jumps over the lazy dog"
OCR Output: "The quik brown fox jumps over lazy dog"

Configuration:
- Edit Distance Threshold: 1
- Case Sensitive: No
- Ignore Punctuation: Yes

Results:
- Exact Matches: 7 ("The", "brown", "fox", "jumps", "over", "lazy", "dog")
- Fuzzy Matches: 1 ("quick" ↔ "quik", edit distance = 1)
- GT Only: 1 ("the" - second occurrence)
- OCR Only: 0

Metrics:
- Precision = 7/8 = 87.50% (only exact matches count)
- Recall = 7/9 = 77.78% (only exact matches count)
- F1 Score = 82.35%
- Avg CRR = 98.75% (includes 7 exact + 1 fuzzy match)
```

### Batch Mode Example
```
Files:
- gt.txt: "Hello world from Python"
- tesseract_out.txt: "Hello world from Python"
- google_vision_out.txt: "Helo world from Python"
- aws_textract_out.txt: "Hello wrld from Python"

Results Table:
┌───────────────┬───────────┬────────┬──────────┬─────────┐
│ Model         │ Precision │ Recall │ F1 Score │ Avg CRR │
├───────────────┼───────────┼────────┼──────────┼─────────┤
│ tesseract     │ 100.00%   │ 100%   │ 100.00%  │ 100.00% │
│ google_vision │  75.00%   │  75%   │  75.00%  │  93.75% │
│ aws_textract  │  75.00%   │  75%   │  75.00%  │  93.75% │
└───────────────┴───────────┴────────┴──────────┴─────────┘
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Acknowledgments

- Uses [python-Levenshtein](https://github.com/maxbachmann/Levenshtein) for fast edit distance calculation
- Built with [Flask](https://flask.palletsprojects.com/) web framework
- Inspired by standard OCR evaluation metrics (WER, CER)
