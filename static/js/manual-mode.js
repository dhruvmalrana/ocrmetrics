/**
 * Manual input mode functionality
 * Handles single text comparison
 */

document.addEventListener('DOMContentLoaded', function() {
    const analyzeBtn = document.getElementById('analyze-btn');
    const vizExpandBtn = document.getElementById('viz-expand-btn');

    analyzeBtn.addEventListener('click', handleAnalyze);
    vizExpandBtn.addEventListener('click', toggleVisualization);
});

function toggleVisualization() {
    const detailRow = document.getElementById('manual-detail-row');
    const expandBtn = document.getElementById('viz-expand-btn');

    if (detailRow.style.display === 'none') {
        detailRow.style.display = 'table-row';
        expandBtn.textContent = '−';

        // Initialize hover highlighter when shown
        if (typeof HoverHighlighter !== 'undefined') {
            setTimeout(() => HoverHighlighter.initialize(), 0);
        }
    } else {
        detailRow.style.display = 'none';
        expandBtn.textContent = '+';
    }
}

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
        // Process text using client-side backend
        const gtResult = preprocessText(groundTruth, config);
        const ocrResult = preprocessText(ocrOutput, config);

        // Match words (exact matching only)
        const matches = matchWords(gtResult.words, ocrResult.words);

        // Calculate metrics
        const metrics = calculateMetrics(matches);

        // Create annotations
        const gtAnnotations = createAnnotations(gtResult.wordData, matches, true);
        const ocrAnnotations = createAnnotations(ocrResult.wordData, matches, false);

        // Display results
        displayManualResults({
            metrics: metrics,
            gt_annotations: gtAnnotations,
            ocr_annotations: ocrAnnotations
        });

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

    // Display metrics in table with tooltips
    const precisionCell = document.getElementById('precision-value');
    precisionCell.textContent = Utils.formatPercentage(metrics.precision);
    MetricsUtils.applyTooltip(precisionCell, 'precision', metrics);

    const recallCell = document.getElementById('recall-value');
    recallCell.textContent = Utils.formatPercentage(metrics.recall);
    MetricsUtils.applyTooltip(recallCell, 'recall', metrics);

    const f1Cell = document.getElementById('f1-value');
    f1Cell.textContent = Utils.formatPercentage(metrics.f1_score);
    MetricsUtils.applyTooltip(f1Cell, 'f1_score', metrics);

    const crrCell = document.getElementById('crr-value');
    crrCell.textContent = Utils.formatPercentage(metrics.avg_crr);
    MetricsUtils.applyTooltip(crrCell, 'avg_crr', metrics);

    document.getElementById('exact-matches').textContent = metrics.exact_matches;
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
        } else {
            // All non-exact matches are shown as no-match (red)
            span.className = 'word no-match';
        }

        // Add data attributes for hover highlighting
        span.dataset.matchId = annotation.match_id || 'unmatched';
        span.dataset.matchType = annotation.match_type;
        span.dataset.panel = containerId.includes('gt') ? 'gt' : 'ocr';

        container.appendChild(span);
    });
}
