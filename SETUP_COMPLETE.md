# 🎉 OCR Metrics Evaluator - Setup Complete!

## ✅ What's Been Done

1. **Miniconda Installed**: ~/miniconda3
2. **Conda Environment Created**: `ocrmetrics` (Python 3.9)
3. **Dependencies Installed**: Flask, python-Levenshtein
4. **Run Script Created**: `run.sh` (executable)
5. **Test Files Created**: `test_files/` directory with sample data
6. **Git Repository Initialized**: Ready for commits

## 🚀 Quick Start

### Start the Application

```bash
# Option 1: Use the run script (recommended)
./run.sh

# Option 2: Manual activation
conda activate ocrmetrics
python app.py
```

Then open your browser to: **http://localhost:5000**

### Try the Demo

1. Click **"Manual Input"** tab
   - Ground Truth: "The quick brown fox jumps"
   - OCR Output: "The quik brown fox"
   - Click **"Analyze"**

2. Click **"Batch Upload"** tab
   - Upload all files from `test_files/` folder
   - Click **"Analyze All"**
   - See comparison table with 3 models

## 📁 Project Structure

```
ocrmetrics/
├── app.py                  # Flask application
├── run.sh                  # Quick start script
├── requirements.txt        # Dependencies
├── README.md              # Full documentation
├── core/                  # Backend modules
├── static/                # Frontend assets
├── templates/             # HTML templates
└── test_files/            # Sample test data
```

## 🔧 Conda Environment

Your conda environment is named **`ocrmetrics`**

**Activate**: `conda activate ocrmetrics`
**Deactivate**: `conda deactivate`
**List environments**: `conda env list`

## 📊 Features

- **Manual Input Mode**: Quick single comparisons
- **Batch Upload Mode**: Compare multiple OCR models
- **Metrics**: Precision, Recall, CRR, F1 Score
- **Visual Highlighting**: Color-coded word matching
- **Export**: Download results as CSV

## 🎯 Next Steps

1. **Try the app**: `./run.sh`
2. **Read the docs**: Check [README.md](README.md) for detailed usage
3. **Test batch mode**: Use files in `test_files/`
4. **Customize**: Adjust config settings (edit distance, case sensitivity, etc.)

## 🔗 Important Links

- **Local App**: http://localhost:5000
- **Documentation**: README.md
- **Test Files**: test_files/
- **GitHub**: git@github.com:dhruvmalrana/ocrmetrics.git

## 💡 Tips

- Edit distance threshold of 1-2 works best for most OCR outputs
- Enable "Ignore Punctuation" for cleaner comparisons
- Use batch mode to compare multiple OCR engines
- Export to CSV for further analysis in Excel/Google Sheets

## ❓ Troubleshooting

**Port already in use?**
```bash
lsof -ti:5000 | xargs kill -9
```

**Conda environment not found?**
```bash
conda activate ocrmetrics
```

**Dependencies missing?**
```bash
conda activate ocrmetrics
pip install -r requirements.txt
```

---

**Ready to go! Run `./run.sh` to start the application.** 🚀
