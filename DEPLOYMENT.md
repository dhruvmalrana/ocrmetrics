# Deployment Guide for GitHub Pages

This guide will help you deploy the OCR Metrics Evaluator as a static website on GitHub Pages.

## Overview

The application has been converted to a fully static website that runs entirely in the browser:
- All Python backend logic has been ported to JavaScript
- No server required - everything runs client-side
- Free hosting on GitHub Pages

## Prerequisites

- A GitHub account
- Git installed on your computer
- Your project pushed to a GitHub repository

## Deployment Steps

### 1. Push Your Code to GitHub

If you haven't already:

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Convert to static site for GitHub Pages deployment"

# Add remote (replace with your GitHub username and repo name)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to main branch
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings**
3. In the left sidebar, click **Pages**
4. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
5. The deployment workflow will automatically run

### 3. Wait for Deployment

- Go to the **Actions** tab in your repository
- You should see a workflow run called "Deploy to GitHub Pages"
- Wait for it to complete (usually takes 1-2 minutes)

### 4. Access Your Site

Once deployed, your site will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

For example, if your username is `johndoe` and repo is `ocrmetrics`:
```
https://johndoe.github.io/ocrmetrics/
```

## File Structure

The static site includes:

```
ocrmetrics/
├── index.html                 # Main HTML file (no Flask templating)
├── static/
│   ├── css/
│   │   └── styles.css        # Styles
│   └── js/
│       ├── preprocessor.js   # Text preprocessing
│       ├── matcher.js        # Word matching algorithm (exact matching)
│       ├── metrics.js        # Metrics calculation
│       ├── app.js            # Main app logic
│       ├── manual-mode.js    # Manual input mode
│       ├── batch-mode.js     # Batch upload mode
│       ├── examples.js       # Examples mode
│       ├── table.js          # Table rendering
│       └── hover-highlighter.js  # Hover effects
├── examples/
│   ├── examples.json         # Example datasets metadata
│   └── [example folders]/    # Example data and images
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions workflow
└── .nojekyll                 # Tells GitHub Pages not to use Jekyll

Files NOT needed for deployment (can be ignored or deleted):
├── app.py                    # Flask backend (not used)
├── core/                     # Python backend (not used)
├── templates/                # Flask templates (not used)
├── requirements.txt          # Python deps (not used)
├── run.sh                    # Flask runner (not used)
├── tests/                    # Python tests (not used)
└── __pycache__/             # Python cache (not used)
```

## How It Works

### Client-Side Processing

All text processing happens in the browser using JavaScript:

1. **Text Preprocessing** (`preprocessor.js`):
   - Tokenization (word splitting)
   - Normalization (case, punctuation)

2. **Word Matching** (`matcher.js`):
   - Exact matching only
   - Handles duplicates correctly

3. **Metrics Calculation** (`metrics.js`):
   - Precision, Recall, F1 Score
   - Character Recognition Rate (CRR)

### Modes

All three modes work client-side:

1. **Manual Input**: Direct text comparison
2. **Batch Upload**: Upload local `.txt` files
3. **Examples**: Pre-loaded example datasets from `examples/` folder

## Updating Your Site

To update your deployed site:

```bash
# Make changes to your files
git add .
git commit -m "Update site"
git push

# GitHub Actions will automatically redeploy
```

## Custom Domain (Optional)

To use a custom domain:

1. Go to **Settings** → **Pages**
2. Under "Custom domain", enter your domain
3. Follow GitHub's instructions to configure DNS

## Troubleshooting

### Site Not Loading

- Check the **Actions** tab for deployment errors
- Ensure GitHub Pages is enabled in Settings
- Wait a few minutes after deployment

### Examples Not Loading

- Check that `examples/examples.json` exists
- Verify example folders contain `.txt` and image files
- Check browser console for fetch errors

### Configuration Issues

- Clear browser cache
- Check browser console (F12) for JavaScript errors
- Ensure all `.js` files are being loaded

## Browser Compatibility

The site works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## Performance

- **No server costs** - everything runs in the browser
- **Fast loading** - static files served by CDN
- **Scalable** - GitHub Pages handles traffic automatically

## Security

- No backend to secure
- No API keys needed
- Files processed locally in browser
- No data sent to any server

## Adding New Examples

To add new example datasets:

1. Create a folder in `examples/` with a unique name
2. Add files:
   - `gt.txt` - Ground truth
   - `model_name_out.txt` - OCR outputs
   - `preview.png` or `preview.jpg` - Preview image
3. Update `examples/examples.json`:
```json
{
  "examples": [
    {
      "name": "your_example_name",
      "preview_file": "preview.jpg",
      "has_gt": true,
      "output_files": ["model1_out.txt", "model2_out.txt"]
    }
  ]
}
```
4. Commit and push:
```bash
git add examples/
git commit -m "Add new example"
git push
```

## Need Help?

- Check GitHub Pages documentation: https://pages.github.com/
- File an issue in your repository
- Check browser console for errors

## What Was Changed

### Removed (Not needed for static deployment)
- Flask backend (`app.py`)
- Python core modules (`core/`)
- Flask templates (`templates/index.html`)
- Python dependencies (`requirements.txt`)

### Added
- JavaScript backend logic (`static/js/utils.js`, `preprocessor.js`, `matcher.js`, `metrics.js`)
- Static HTML (`index.html` at root)
- GitHub Actions workflow (`.github/workflows/deploy.yml`)
- Examples metadata (`examples/examples.json`)
- `.nojekyll` file

### Modified
- `manual-mode.js` - Now uses client-side processing
- `batch-mode.js` - Reads files locally, processes client-side
- `examples.js` - Loads from static JSON and files
- `index.html` - Removed Flask templating, uses static paths

Enjoy your free, serverless OCR Metrics Evaluator!
