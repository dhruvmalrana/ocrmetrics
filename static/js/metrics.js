/**
 * Metrics calculation for OCR evaluation.
 * Computes precision, recall, CRR (Character Recognition Rate), and F1 score.
 */

/**
 * Calculate OCR evaluation metrics from word matches.
 *
 * Metrics:
 * - Precision: exact_matches / total_ocr_words (only exact matches count)
 * - Recall: exact_matches / total_gt_words (only exact matches count)
 * - CRR: Character Recognition Rate = 1 - CER (document-level, includes all characters)
 * - F1 Score: Harmonic mean of precision and recall
 *
 * @param {Array} matches - List of match tuples from matchWords()
 * @returns {Object} Dictionary with metrics
 */
function calculateMetrics(matches) {
    // Separate matches by type
    const exactMatches = matches.filter(m => m[3] === 'exact');
    const gtOnlyMatches = matches.filter(m => m[3] === 'gt_only');
    const ocrOnlyMatches = matches.filter(m => m[3] === 'ocr_only');

    // Count totals
    const exactCount = exactMatches.length;
    const totalGtWords = exactCount + gtOnlyMatches.length;
    const totalOcrWords = exactCount + ocrOnlyMatches.length;

    // Calculate Precision and Recall (only exact matches count)
    const precision = totalOcrWords > 0 ? exactCount / totalOcrWords : 0.0;
    const recall = totalGtWords > 0 ? exactCount / totalGtWords : 0.0;

    // Calculate F1 Score
    let f1Score = 0.0;
    if (precision + recall > 0) {
        f1Score = 2 * (precision * recall) / (precision + recall);
    }

    // Calculate document-level CRR (Character Recognition Rate)
    let totalCharErrors = 0;
    let totalGtChars = 0;

    // For exact matches: 0 errors (words are identical)
    for (const [gtWord] of exactMatches) {
        // No errors for exact matches
        totalGtChars += gtWord.length;
    }

    // For unmatched GT words: all characters are errors (deletions - OCR missed them)
    for (const [gtWord] of gtOnlyMatches) {
        totalCharErrors += gtWord.length;
        totalGtChars += gtWord.length;
    }

    // For unmatched OCR words: all characters are errors (insertions - OCR hallucinated them)
    for (const [, ocrWord] of ocrOnlyMatches) {
        totalCharErrors += ocrWord.length;
    }

    // Calculate CRR (Character Recognition Rate = 1 - CER)
    // CRR can be negative if OCR produces more errors than GT characters
    let avgCrr = 0.0;
    if (totalGtChars > 0) {
        const cer = totalCharErrors / totalGtChars;
        avgCrr = 1.0 - cer;
    }

    return {
        precision: precision,
        recall: recall,
        avg_crr: avgCrr,
        f1_score: f1Score,
        exact_matches: exactCount,
        total_gt_words: totalGtWords,
        total_ocr_words: totalOcrWords,
        unmatched_gt: gtOnlyMatches.length,
        unmatched_ocr: ocrOnlyMatches.length,
        // Additional data for tooltips
        char_errors: totalCharErrors,
        total_gt_chars: totalGtChars
    };
}

/**
 * Format metrics as percentages for display.
 *
 * @param {Object} metrics - Metrics object from calculateMetrics()
 * @returns {Object} Formatted metrics with percentage strings
 */
function formatMetricsForDisplay(metrics) {
    return {
        precision: `${(metrics.precision * 100).toFixed(2)}%`,
        recall: `${(metrics.recall * 100).toFixed(2)}%`,
        avg_crr: `${(metrics.avg_crr * 100).toFixed(2)}%`,
        f1_score: `${(metrics.f1_score * 100).toFixed(2)}%`,
        exact_matches: metrics.exact_matches,
        total_gt_words: metrics.total_gt_words,
        total_ocr_words: metrics.total_ocr_words,
        unmatched_gt: metrics.unmatched_gt,
        unmatched_ocr: metrics.unmatched_ocr
    };
}

/**
 * Metrics utility functions for tooltips and display.
 * Attached to window for global access.
 */
window.MetricsUtils = {
    /**
     * Generate tooltip text showing how a metric was calculated.
     *
     * @param {string} metricName - Name of the metric ('precision', 'recall', 'f1_score', 'avg_crr')
     * @param {Object} metrics - Metrics object from calculateMetrics()
     * @returns {string} Tooltip text with formula and calculation
     */
    getTooltip(metricName, metrics) {
        const exact = metrics.exact_matches;
        const totalGt = metrics.total_gt_words;
        const totalOcr = metrics.total_ocr_words;
        const charErrors = metrics.char_errors;
        const totalGtChars = metrics.total_gt_chars;

        switch (metricName) {
            case 'precision':
                return `Precision = Exact Matches / Total OCR Words\n= ${exact} / ${totalOcr}\n= ${(metrics.precision * 100).toFixed(2)}%`;

            case 'recall':
                return `Recall = Exact Matches / Total GT Words\n= ${exact} / ${totalGt}\n= ${(metrics.recall * 100).toFixed(2)}%`;

            case 'f1_score':
                const p = (metrics.precision * 100).toFixed(2);
                const r = (metrics.recall * 100).toFixed(2);
                return `F1 Score = 2 × (Precision × Recall) / (Precision + Recall)\n= 2 × (${p}% × ${r}%) / (${p}% + ${r}%)\n= ${(metrics.f1_score * 100).toFixed(2)}%`;

            case 'avg_crr':
                const cer = totalGtChars > 0 ? (charErrors / totalGtChars * 100).toFixed(2) : '0.00';
                return `CRR = 1 - (Character Errors / Total GT Chars)\n= 1 - (${charErrors} / ${totalGtChars})\n= 1 - ${cer}%\n= ${(metrics.avg_crr * 100).toFixed(2)}%`;

            default:
                return '';
        }
    },

    /**
     * Apply tooltip to an existing DOM element.
     *
     * @param {HTMLElement} element - The DOM element to add tooltip to
     * @param {string} metricName - Name of the metric
     * @param {Object} metrics - Metrics object from calculateMetrics()
     */
    applyTooltip(element, metricName, metrics) {
        element.classList.add('metric-with-tooltip');

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'metric-tooltip';
        tooltip.textContent = this.getTooltip(metricName, metrics);
        element.appendChild(tooltip);
    },

    /**
     * Create a table cell with metric value and tooltip.
     *
     * @param {number} value - The metric value (0.0-1.0)
     * @param {string} metricName - Name of the metric
     * @param {Object} metrics - Metrics object from calculateMetrics()
     * @returns {HTMLTableCellElement} The created td element
     */
    createMetricCell(value, metricName, metrics) {
        const td = document.createElement('td');
        td.textContent = Utils.formatPercentage(value);
        this.applyTooltip(td, metricName, metrics);
        return td;
    }
};
