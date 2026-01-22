# JavaScript Test Suite

All core OCR evaluation logic is tested with browser-based JavaScript tests.

## Quick Start

```bash
# From project root
./run-tests.sh

# Or manually
python3 -m http.server 8000
open http://localhost:8000/tests/run-tests.html
```

Click "Run All Tests" - all tests should pass ✓

## Test Files

- **test-preprocessor.js** - Tokenization, normalization
- **test-matcher.js** - Word matching algorithm (exact matching only)
- **test-metrics.js** - Precision, Recall, F1, CRR metrics (including Levenshtein distance)

## Complete Testing Guide

See [TESTING.md](../TESTING.md) for:
- Detailed test coverage
- Troubleshooting guide
- How to add new tests
- Manual testing checklist
