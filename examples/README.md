# Examples Folder

This folder contains example OCR evaluation datasets that can be loaded from the Examples tab.

## Structure

```
examples/
├── examples.json                     # Metadata index (REQUIRED)
├── example1/
│   ├── preview.png or preview.jpg    # Preview image shown in UI
│   ├── gt.txt                        # Ground truth text
│   ├── model1_out.txt                # OCR output from model 1
│   └── model2_out.txt                # OCR output from model 2 (optional)
└── example2/
    ├── preview.jpg
    ├── gt.txt
    └── model3_out.txt
```

## File Requirements

**Metadata Index** (REQUIRED):
- **examples.json**: Contains list of all examples with metadata

**Per Example Folder**:
- **preview.png or preview.jpg**: Preview image (PNG, JPG, or JPEG supported)
- **gt.txt**: Ground truth text
- **\*_out.txt**: OCR outputs from different models (at least one required)

## Adding New Examples

1. **Create folder**:
   ```bash
   mkdir examples/my_example
   ```

2. **Add files**:
   - `examples/my_example/preview.png` - Preview image
   - `examples/my_example/gt.txt` - Ground truth
   - `examples/my_example/model_out.txt` - OCR output(s)

3. **Update `examples.json`**:
   ```json
   {
     "examples": [
       {
         "name": "my_example",
         "preview_file": "preview.png",
         "has_gt": true,
         "output_files": ["model_out.txt"]
       }
     ]
   }
   ```

4. Refresh the page - your example appears in the Examples tab!

## `examples.json` Format

```json
{
  "examples": [
    {
      "name": "folder_name",
      "preview_file": "preview.png",
      "has_gt": true,
      "output_files": ["model1_out.txt", "model2_out.txt"]
    }
  ]
}
```

See [EXAMPLES_GUIDE.md](../EXAMPLES_GUIDE.md) for complete documentation.
