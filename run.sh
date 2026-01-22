#!/bin/bash

# OCR Metrics Evaluator - Run Script
# This script kills any old process, activates conda, and starts the Flask application

echo "🚀 Starting OCR Metrics Evaluator..."
echo ""

# Kill any existing process on port 5001
PORT=5001
PIDS=$(lsof -ti:$PORT 2>/dev/null)
if [ ! -z "$PIDS" ]; then
    echo "🧹 Killing old process(es) on port $PORT..."
    kill -9 $PIDS 2>/dev/null
    echo "✓ Old process(es) terminated"
fi

# Activate conda environment
source ~/miniconda3/bin/activate ocrmetrics

# Check if activation was successful
if [ $? -ne 0 ]; then
    echo "❌ Error: Could not activate conda environment 'ocrmetrics'"
    echo "Please run: conda activate ocrmetrics"
    exit 1
fi

echo "✓ Conda environment 'ocrmetrics' activated"
echo "✓ Starting Flask server on http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the Flask application
python app.py
