/**
 * Manual input mode functionality
 * Handles single text comparison
 */

document.addEventListener('DOMContentLoaded', function() {
    const analyzeBtn = document.getElementById('analyze-btn');

    analyzeBtn.addEventListener('click', handleAnalyze);
});

async function handleAnalyze() {
    const groundTruth = document.getElementById('ground-truth').value;
    const ocrOutput = document.getElementById('ocr-output').value;

    // Validate input
    if (!groundTruth.trim() || !ocrOutput.trim()) {
        Utils.showError('Please enter both ground truth and OCR output text');
        return;
    }

    // Get configuration
    const config = AppConfig.getConfig();

    // Show loading
    Utils.showLoading();
    Utils.hideError();

    try {
        // Call API
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ground_truth: groundTruth,
                ocr_output: ocrOutput,
                config: config
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Analysis failed');
        }

        // Display results
        displayManualResults(data);

    } catch (error) {
        Utils.showError(`Error: ${error.message}`);
    } finally {
        Utils.hideLoading();
    }
}

function displayManualResults(data) {
    const { metrics, gt_annotations, ocr_annotations } = data;

    // Show results section
    document.getElementById('manual-results').style.display = 'block';

    // Display metrics
    document.getElementById('precision-value').textContent = Utils.formatPercentage(metrics.precision);
    document.getElementById('recall-value').textContent = Utils.formatPercentage(metrics.recall);
    document.getElementById('f1-value').textContent = Utils.formatPercentage(metrics.f1_score);
    document.getElementById('crr-value').textContent = Utils.formatPercentage(metrics.avg_crr);

    // Display details
    document.getElementById('exact-matches').textContent = metrics.exact_matches;
    document.getElementById('fuzzy-matches').textContent = metrics.fuzzy_matches;
    document.getElementById('total-gt').textContent = metrics.total_gt_words;
    document.getElementById('total-ocr').textContent = metrics.total_ocr_words;

    // Display visualizations
    displayVisualization('gt-visualization', gt_annotations);
    displayVisualization('ocr-visualization', ocr_annotations);

    // Scroll to results
    document.getElementById('manual-results').scrollIntoView({ behavior: 'smooth' });
}

function displayVisualization(containerId, annotations) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    annotations.forEach(annotation => {
        const span = document.createElement('span');
        span.textContent = annotation.word + ' ';

        // Apply CSS class based on match type
        if (annotation.match_type === 'exact') {
            // No class for exact matches (normal text)
            span.className = 'word';
        } else if (annotation.match_type === 'fuzzy') {
            span.className = 'word fuzzy-match';
            span.title = `Matched with: ${annotation.matched_with} (edit distance: ${annotation.edit_distance})`;
        } else if (annotation.match_type === 'gt_only' || annotation.match_type === 'ocr_only') {
            span.className = 'word no-match';
        }

        container.appendChild(span);
    });
}
