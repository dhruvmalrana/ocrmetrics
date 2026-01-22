# Examples Feature Guide

## Overview

The OCR Metrics app now includes two new features:
1. **Prepopulated Manual Input** - Demo text is preloaded in manual mode
2. **Examples Tab** - Dedicated tab with click-to-load example datasets

## Manual Input Mode

The manual input textareas now come prepopulated with a sample invoice comparison showing common OCR errors (0 vs O confusion). Users can clear this and enter their own text or use it as a starting point.

## Examples Tab

### How It Works

1. **Examples Folder Structure**:
   ```
   examples/
   ├── sample_invoice/
   │   ├── preview.png or preview.jpg  # Preview image (REQUIRED)
   │   ├── gt.txt                      # Ground truth
   │   ├── tesseract_out.txt           # OCR output 1
   │   └── easyocr_out.txt             # OCR output 2
   └── your_example/
       ├── preview.jpg
       ├── gt.txt
       └── model_out.txt
   ```

2. **Adding New Examples**:
   - Create a new folder in `examples/`
   - Add a `preview.png` or `preview.jpg` image (screenshot/photo of the document)
   - Add `gt.txt` with ground truth text
   - Add one or more `*_out.txt` files with OCR outputs
   - The example will automatically appear in the UI

3. **Using Examples**:
   - Click on the **"Examples"** tab
   - Browse the available examples
   - Click on any example card
   - The app automatically loads and analyzes the files
   - Results appear in the comparison table below

### File Naming Convention

- **Ground Truth**: Must be named `gt.txt`
- **OCR Outputs**: Must end with `_out.txt` (e.g., `tesseract_out.txt`, `gpt4_vision_out.txt`)
- **Preview Image**: Must be named `preview.png`, `preview.jpg`, or `preview.jpeg` (all formats supported)

### Example Provided

A sample invoice example is included in `examples/sample_invoice/`:
- Shows common OCR errors (0 vs O in numbers)
- Compares two OCR models (Tesseract vs EasyOCR)
- **Note**: You need to add a `preview.png` image to this folder

## Technical Implementation

### Backend (app.py)
- `GET /api/examples` - Lists all available examples
- `GET /api/examples/<name>/preview` - Serves preview images
- `GET /api/examples/<name>/load` - Loads example text files

### Frontend
- `static/js/examples.js` - Handles example loading and display
- Auto-loads examples when batch mode is opened
- Creates interactive cards with preview images
- Automatically triggers batch analysis when clicked

### Styling
- Responsive grid layout
- Hover effects on cards
- Metadata display (number of models)
- Warning indicators for missing files

## Adding Your Own Examples

1. Create a folder: `examples/my_example/`
2. Add your PNG preview image: `examples/my_example/preview.png`
3. Add ground truth: `examples/my_example/gt.txt`
4. Add OCR outputs: `examples/my_example/model1_out.txt`, etc.
5. Refresh the page - your example will appear automatically!

## Tips

- Use clear, descriptive folder names (e.g., `receipt_2024`, `handwritten_form`)
- Preview images help users understand what the example contains
- Include at least 2 OCR models for meaningful comparison
- Keep example texts concise for better demonstration
