# Examples Folder

This folder contains example OCR evaluation datasets that can be loaded directly from the UI.

## Structure

Each example should be in its own subfolder with the following files:

```
examples/
├── example1/
│   ├── preview.png or preview.jpg    # Preview image shown in UI
│   ├── gt.txt                        # Ground truth text
│   ├── model1_out.txt                # OCR output from model 1
│   ├── model2_out.txt                # OCR output from model 2 (optional)
│   └── ...                           # Additional model outputs
├── example2/
│   ├── preview.jpg
│   ├── gt.txt
│   └── ...
└── ...
```

## File Requirements

- **preview.png or preview.jpg**: An image representing the example (both PNG and JPG formats supported)
- **gt.txt**: The ground truth text
- **\*_out.txt**: OCR outputs from different models (at least one required)

## Example Usage

1. Create a new folder for your example (e.g., `receipt_example`)
2. Add the required files following the naming convention above
3. The example will automatically appear in the "Examples" section of the batch upload mode
