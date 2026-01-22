# Testing Guide

## Run the Test Suite

```bash
# Quick start: Start server and open tests
./run-tests.sh
```

Or manually:
```bash
# Start local server
python3 -m http.server 8000

# Open tests in browser
open http://localhost:8000/tests/run-tests.html
```

Click "Run All Tests" to see results. All tests should pass ✓

## Run the Application

```bash
# Start local server
python3 -m http.server 8000

# Open app in browser
open http://localhost:8000/
```

**Important:** Use a web server, not `file://` - it will cause CORS errors.

## Testing Checklist

### 1. Manual Mode
- Click "Manual Input" tab
- Example text is pre-filled
- Click "Analyze"
- Should see metrics and visualizations
- Hover over words to see matches

### 2. Batch Mode
- Click "Batch Upload" tab
- Upload files from any `examples/` folder (e.g., `examples/15ed2e2d627d9efd/`):
  - `gt.txt`
  - `*_out.txt` files (OCR outputs)
- Click "Analyze All"
- Should see comparison table with rankings

### 3. Examples Mode
- Click "Examples" tab
- Should see 3 example cards with images
- Click any example
- Should see automatic analysis results

## Browser Console Test

Open browser console (F12) and run:

```javascript
// Test if functions are loaded
console.log('preprocessText:', typeof preprocessText);
console.log('matchWords:', typeof matchWords);
console.log('calculateMetrics:', typeof calculateMetrics);

// Quick functionality test
const config = { case_sensitive: false, ignore_punctuation: true };
const result = preprocessText("Hello World", config);
console.log('Test result:', result);
```

Expected output:
```
preprocessText: function
matchWords: function
calculateMetrics: function
Test result: {words: Array(2), wordData: Array(2)}
```

## Troubleshooting

### CORS Errors
**Problem:** "Access to fetch has been blocked by CORS policy"

**Solution:** Must use `http://localhost:8000/`, not `file://`. Start the Python server.

### Functions Not Defined
**Problem:** IDE shows "preprocessText is not defined"

**Solution:** This is just an IDE warning. The browser loads all scripts in order and functions work fine. You can ignore this warning.

### Examples Not Loading
**Problem:** Examples tab shows "Loading examples..." forever

**Solution:**
1. Check that `examples/examples.json` exists
2. Verify example folders have `gt.txt`, `*_out.txt`, and image files
3. Check browser console for fetch errors

### Clear Browser Cache
If something seems broken after making changes:

```bash
# Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
# Firefox: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows/Linux)
```

## Test Coverage

The test suite covers:
- ✓ Text preprocessing (tokenization, normalization)
- ✓ Word matching algorithm (exact matching only)
- ✓ Metrics calculation (Precision, Recall, F1, CRR)
- ✓ Edge cases (empty input, duplicates, etc.)

All tests should pass ✓

## Deploying to Production

Once tests pass locally, you're ready to deploy to GitHub Pages!

See [DEPLOYMENT.md](DEPLOYMENT.md) for instructions.
