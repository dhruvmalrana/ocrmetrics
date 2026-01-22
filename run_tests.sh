#!/bin/bash

# OCR Metrics Evaluator - Test Runner
# Runs all unit tests for the core logic
# IMPORTANT: This script assumes you are in the 'ocrmetrics' conda environment

echo "🧪 Running OCR Metrics Tests..."
echo ""

# Activate conda environment
source ~/miniconda3/bin/activate ocrmetrics

# Check if activation was successful
if [ $? -ne 0 ]; then
    echo "❌ Error: Could not activate conda environment 'ocrmetrics'"
    echo "Please activate the environment first: conda activate ocrmetrics"
    exit 1
fi

echo "✓ Conda environment 'ocrmetrics' activated"
echo ""

# Run all tests with verbose output
python -m unittest discover -s tests -p "test_*.py" -v

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
else
    echo ""
    echo "❌ Some tests failed"
    exit 1
fi
