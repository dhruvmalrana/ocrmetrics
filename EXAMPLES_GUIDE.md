# Examples Feature Guide

## Overview

The OCR Metrics app includes two demonstration features:
1. **Prepopulated Manual Input** - Demo text is preloaded in manual mode
2. **Examples Tab** - Dedicated tab with click-to-load example datasets

## Manual Input Mode

The manual input textareas come prepopulated with a sample invoice comparison showing common OCR errors (0 vs O confusion). Users can clear this and enter their own text or use it as a starting point.

## Examples Tab

### How It Works

1. **Examples Folder Structure**:
   ```
   examples/
   ├── examples.json                   # Metadata index (REQUIRED)
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

2. **Using Examples**:
   - Click on the **"Examples"** tab
   - Browse the available examples (loaded from `examples.json`)
   - Click on any example card
   - The app automatically fetches and analyzes the files
   - Results appear in the comparison table below

### File Naming Convention

- **Metadata Index**: `examples/examples.json` (REQUIRED - see format below)
- **Ground Truth**: Must be named `gt.txt`
- **OCR Outputs**: Must end with `_out.txt` (e.g., `tesseract_out.txt`, `gpt4_vision_out.txt`)
- **Preview Image**: Must be named `preview.png`, `preview.jpg`, or `preview.jpeg`

### Adding New Examples

1. **Create the folder structure**:
   ```bash
   mkdir examples/my_example
   ```

2. **Add your files**:
   - `examples/my_example/preview.png` - Preview image
   - `examples/my_example/gt.txt` - Ground truth text
   - `examples/my_example/model1_out.txt` - OCR output(s)

3. **Update `examples/examples.json`**:
   ```json
   {
     "examples": [
       {
         "name": "my_example",
         "preview_file": "preview.png",
         "has_gt": true,
         "output_files": ["model1_out.txt", "model2_out.txt"]
       }
     ]
   }
   ```

4. **Refresh the page** - your example appears in the Examples tab!

### `examples.json` Format

```json
{
  "examples": [
    {
      "name": "example_folder_name",
      "preview_file": "preview.png",
      "has_gt": true,
      "output_files": ["tesseract_out.txt", "easyocr_out.txt"]
    }
  ]
}
```

**Fields:**
- `name`: Folder name in `examples/` directory
- `preview_file`: Image filename (png, jpg, or jpeg)
- `has_gt`: Set to `true` if `gt.txt` exists
- `output_files`: Array of OCR output filenames

## Technical Implementation

### Client-Side Architecture

This is a **static site** - all processing happens in the browser:

**`static/js/examples.js`**:
- `Examples.initialize()`: Fetches `examples/examples.json`
- `renderExamples()`: Creates interactive cards with preview images
- `loadExample()`: Fetches files from example folder using Fetch API
- `analyzeExampleFiles()`: Processes files client-side (same as batch mode)
- `displayExampleResults()`: Renders comparison table with expandable rows

**File Loading**:
- Metadata: `fetch('examples/examples.json')`
- Preview images: `examples/{name}/{preview_file}`
- Text files: `examples/{name}/{filename}` loaded via Fetch API

**UI Features**:
- Responsive grid layout
- Hover effects on cards
- Metadata display (number of models)
- Expandable detail rows with hover highlighting

## Tips

- Use clear, descriptive folder names (e.g., `receipt_2024`, `handwritten_form`)
- Preview images help users understand what the example contains
- Include at least 2 OCR models for meaningful comparison
- Keep example texts concise for better demonstration
- Always update `examples.json` when adding new examples
