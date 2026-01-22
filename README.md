# OCR Metrics Evaluator

A web application for evaluating OCR (Optical Character Recognition) output quality by calculating word-level precision, recall, Character Recognition Rate (CRR), and providing visual highlighting of differences.

## Features

- **Dual Input Modes**:
  - **Manual Input**: Quick single comparison with text boxes
  - **Batch Upload**: Compare multiple OCR models against ground truth

- **Standard OCR Metrics**:
  - Word-level Precision and Recall (exact matches only - standard WER approach)
  - Document-level Character Recognition Rate (CRR) - standard CER approach
  - F1 Score for balanced evaluation

- **Exact Word Matching**:
  - Only exact matches count toward precision/recall
  - Order-invariant comparison
  - Configurable preprocessing (case, punctuation)

- **Visual Highlighting**:
  - Color-coded text visualization
  - Red: Unmatched words
  - Normal text: Exact matches

- **Batch Comparison**:
  - Compare multiple OCR models simultaneously
  - Automatic ranking by F1 Score with top 3 medals (🥇🥈🥉)
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
# Option 1: Use the run script (recommended - automatically handles port cleanup)
./run.sh

# Option 2: Run directly
python app.py
```

4. Open your browser to:
```
http://localhost:5001
```

**Note**: The run script automatically kills any old process using port 5001, so you can just run `./run.sh` each time without worrying about port conflicts.

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

## Testing

The project includes comprehensive unit tests for all core logic.

**IMPORTANT**: Tests must be run within the `ocrmetrics` conda environment.

### Running Tests

First, activate the conda environment:
```bash
conda activate ocrmetrics
```

Then run the tests:
```bash
# Option 1: Use the test runner script (automatically activates conda)
./run_tests.sh

# Option 2: Run tests directly (make sure conda is activated first!)
python -m unittest discover -s tests -p "test_*.py" -v

# Option 3: Run specific test file
python -m unittest tests.test_metrics -v
```

### Test Coverage

- **test_utils.py**: Levenshtein distance and CRR calculation
- **test_preprocessor.py**: Tokenization, normalization, and text preprocessing
- **test_matcher.py**: Word matching algorithm (exact and fuzzy)
- **test_metrics.py**: Precision, recall, F1 score, and CRR metrics

All core algorithms are thoroughly tested with edge cases including:
- Empty inputs
- Duplicate words
- Case sensitivity
- Punctuation handling
- Fuzzy matching thresholds
- Zero division scenarios

## Usage

### Manual Input Mode

1. Click "Manual Input" tab
2. Enter ground truth text in the left textarea
3. Enter OCR output text in the right textarea
4. Adjust configuration:
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
   - Results automatically sorted by F1 Score (highest first)
   - Top 3 models highlighted with medals: 🥇 Champion, 🥈 2nd Place, 🥉 3rd Place
   - Click column headers to re-sort
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

**Important**: Only exact matches count (after preprocessing based on case/punctuation settings).

**Example**:
- Ground Truth: "The quick brown fox"
- OCR Output: "The quik brown"
- Exact matches: "The", "brown" = 2
- Precision = 2/3 = 66.67%

**Interpretation**: High precision = low false positive rate (OCR doesn't add wrong words).

### Word-Level Recall

**Definition**: Of all words in the ground truth, how many are EXACT matches in the OCR output.

**Formula**:
```
Recall = Exact Matches / Total GT Words
```

**Important**: Only exact matches count (standard WER approach).

**Example**:
- Ground Truth: "The quick brown fox"
- OCR Output: "The quik brown"
- Exact matches: "The", "brown" = 2
- Recall = 2/4 = 50.00%

**Interpretation**: High recall = low false negative rate (OCR doesn't miss words).

### F1 Score

**Definition**: Harmonic mean of precision and recall, providing a balanced metric.

**Formula**:
```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

**Interpretation**: Single metric that balances both precision and recall. Useful for comparing models.

### Character Recognition Rate (CRR)

**Definition**: Document-level character accuracy using standard CER (Character Error Rate) methodology.

**Formula**:
```
Character Errors =
  + Edit distance for matched word pairs
  + All characters in unmatched GT words (OCR missed)
  + All characters in unmatched OCR words (OCR hallucinated)

CER = Character Errors / Total GT Characters
CRR = 1 - CER
```

**Important**:
- CRR uses document-level calculation (not word-level averaging)
- ALL characters count, including those in unmatched words
- This is the standard CER approach used in OCR literature
- CRR = 1 - CER (inverse of Character Error Rate)

**Example**:
- Ground Truth: "The quick brown fox" (16 characters)
- OCR Output: "The quik brown" (13 characters)
- Matched: "The" (0 errors), "brown" (0 errors)
- Unmatched GT: "quick" (5 chars), "fox" (3 chars) = 8 errors
- Unmatched OCR: "quik" (4 chars) = 4 errors
- Character Errors = 0 + 0 + 8 + 4 = 12
- CRR = 1 - (12/16) = 25.00%

**Interpretation**: Shows overall character-level accuracy. Unmatched words significantly impact CRR.

## Algorithm Details

### Word Matching Algorithm

The application uses exact word matching with configurable preprocessing:

#### Preprocessing & Matching
1. **Preprocessing**:
   - Tokenize text by splitting on whitespace
   - Apply normalization based on config:
     - Convert to lowercase if case-insensitive
     - Strip punctuation if enabled
   - Count word occurrences (handles duplicates)

2. **Exact Matching**:
   - For each ground truth word that appears in OCR words:
     - Match min(GT count, OCR count) instances
     - Mark as exact matches
     - **These matches COUNT toward precision/recall**
   - Remove matched instances from consideration

3. **Result**:
   - Matched pairs (exact matches only)
   - Unmatched GT words (false negatives - shown in red)
   - Unmatched OCR words (false positives - shown in red)

4. **Character Error Calculation**:
   - For matched pairs: Calculate edit distance at character level
   - For unmatched words: Count all characters as errors
   - CRR = 1 - (Total Character Errors / Total GT Characters)

### Levenshtein Edit Distance

The edit distance is the minimum number of single-character operations (insertions, deletions, substitutions) required to transform one word into another.

**Examples**:
- "cat" → "cat": distance = 0 (exact match)
- "cat" → "cut": distance = 1 (1 substitution)
- "hello" → "helo": distance = 1 (1 deletion)
- "test" → "testing": distance = 3 (3 insertions)

**Implementation**: Uses `python-Levenshtein` library (fast C implementation) with pure Python fallback.

## Configuration Options

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
Our **Precision** and **Recall** metrics align with WER methodology:
- Only exact word matches count
- No fuzzy matching in word-level metrics
- Standard approach in speech recognition and OCR evaluation

### Character Error Rate (CER)
Our **CRR** metric is the inverse of CER:
- CER measures errors, CRR measures correctness (accuracy)
- Both use Levenshtein edit distance at character level
- CRR = 1 - CER = 1 - (Character Errors / Total GT Characters)
- Standard document-level calculation used in OCR literature

## Example Workflow

### Manual Mode Example
```
Ground Truth: "The quick brown fox"
OCR Output: "The quik brown"

Configuration:
- Case Sensitive: No
- Ignore Punctuation: Yes

Results:
- Exact Matches: 2 ("The", "brown")
- GT Only: 2 ("quick", "fox")
- OCR Only: 1 ("quik")

Metrics:
- Precision = 2/3 = 66.67% (exact matches / OCR words)
- Recall = 2/4 = 50.00% (exact matches / GT words)
- F1 Score = 57.14%
- Character errors = 0 (The) + 0 (brown) + 5 (quick) + 3 (fox) + 4 (quik) = 12
- CRR = 1 - (12/16) = 25.00%
```

### Batch Mode Example
```
Files:
- gt.txt: "Hello world from Python"
- tesseract_out.txt: "Hello world from Python"
- google_vision_out.txt: "Helo world from Python"
- aws_textract_out.txt: "Hello wrld from Python"

Results Table (sorted by F1 Score):
┌──────┬────────────────┬───────────┬────────┬──────────┬─────────┐
│ Rank │ Model          │ Precision │ Recall │ F1 Score │ Avg CRR │
├──────┼────────────────┼───────────┼────────┼──────────┼─────────┤
│ 🥇   │ tesseract      │ 100.00%   │ 100%   │ 100.00%  │ 100.00% │
│ 🥈   │ google_vision  │  75.00%   │  75%   │  75.00%  │  93.75% │
│ 🥉   │ aws_textract   │  75.00%   │  75%   │  75.00%  │  93.75% │
└──────┴────────────────┴───────────┴────────┴──────────┴─────────┘
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Acknowledgments

- Uses [python-Levenshtein](https://github.com/maxbachmann/Levenshtein) for fast edit distance calculation
- Built with [Flask](https://flask.palletsprojects.com/) web framework
- Inspired by standard OCR evaluation metrics (WER, CER)
