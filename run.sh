#!/bin/bash

# OCR Metrics Evaluator - Run Script
# This script activates the conda environment and starts the Flask application

echo "🚀 Starting OCR Metrics Evaluator..."
echo ""

# Activate conda environment
source ~/miniconda3/bin/activate ocrmetrics

# Check if activation was successful
if [ $? -ne 0 ]; then
    echo "❌ Error: Could not activate conda environment 'ocrmetrics'"
    echo "Please run: conda activate ocrmetrics"
    exit 1
fi

echo "✓ Conda environment 'ocrmetrics' activated"
echo "✓ Starting Flask server on http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the Flask application
python app.py
