/**
 * Metrics calculation for OCR evaluation.
 * Computes precision, recall, CRR (Character Recognition Rate), and F1 score.
 */

/**
 * Calculate Levenshtein (edit) distance between two strings.
 * Uses dynamic programming approach.
 *
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Minimum number of single-character edits (insertions, deletions, substitutions)
 */
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;

    // Handle edge cases
    if (m === 0) return n;
    if (n === 0) return m;

    // Create 2D array for dynamic programming
    // Use only two rows to save memory (current and previous)
    let prevRow = new Array(n + 1);
    let currRow = new Array(n + 1);

    // Initialize first row (distance from empty string to str2 prefixes)
    for (let j = 0; j <= n; j++) {
        prevRow[j] = j;
    }

    // Fill the matrix
    for (let i = 1; i <= m; i++) {
        currRow[0] = i; // Distance from str1 prefix to empty string

        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                // Characters match, no operation needed
                currRow[j] = prevRow[j - 1];
            } else {
                // Take minimum of:
                // - prevRow[j] + 1: deletion from str1
                // - currRow[j-1] + 1: insertion into str1
                // - prevRow[j-1] + 1: substitution
                currRow[j] = 1 + Math.min(prevRow[j], currRow[j - 1], prevRow[j - 1]);
            }
        }

        // Swap rows
        [prevRow, currRow] = [currRow, prevRow];
    }

    // Result is in prevRow because of the final swap
    return prevRow[n];
}

/**
 * Calculate OCR evaluation metrics from word matches.
 *
 * Metrics:
 * - Precision: exact_matches / total_ocr_words (only exact matches count)
 * - Recall: exact_matches / total_gt_words (only exact matches count)
 * - CRR: Character Recognition Rate = 1 - CER (uses Levenshtein distance)
 * - F1 Score: Harmonic mean of precision and recall
 *
 * @param {Array} matches - List of match tuples from matchWords()
 * @param {Array} gtWords - List of preprocessed ground truth words (optional, for accurate CER)
 * @param {Array} ocrWords - List of preprocessed OCR output words (optional, for accurate CER)
 * @returns {Object} Dictionary with metrics
 */
function calculateMetrics(matches, gtWords, ocrWords) {
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

    // Calculate CER/CRR using Levenshtein distance (standard approach)
    let avgCrr = 0.0;
    let charErrors = 0;
    let totalGtChars = 0;

    if (gtWords && ocrWords) {
        // Use proper Levenshtein distance on concatenated text (standard CER)
        const gtText = gtWords.join('');
        const ocrText = ocrWords.join('');
        totalGtChars = gtText.length;
        charErrors = levenshteinDistance(gtText, ocrText);

        if (totalGtChars > 0) {
            const cer = charErrors / totalGtChars;
            avgCrr = 1.0 - cer;
        }
    } else {
        // Fallback for tests that don't provide word arrays:
        // Reconstruct from matches (order doesn't matter for Levenshtein on concatenated words)
        const gtWordsFromMatches = [];
        const ocrWordsFromMatches = [];

        for (const [gtWord, ocrWord, , matchType] of matches) {
            if (matchType === 'exact') {
                gtWordsFromMatches.push(gtWord);
                ocrWordsFromMatches.push(ocrWord);
            } else if (matchType === 'gt_only') {
                gtWordsFromMatches.push(gtWord);
            } else if (matchType === 'ocr_only') {
                ocrWordsFromMatches.push(ocrWord);
            }
        }

        const gtText = gtWordsFromMatches.join('');
        const ocrText = ocrWordsFromMatches.join('');
        totalGtChars = gtText.length;
        charErrors = levenshteinDistance(gtText, ocrText);

        if (totalGtChars > 0) {
            const cer = charErrors / totalGtChars;
            avgCrr = 1.0 - cer;
        }
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
        char_errors: charErrors,
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
                return `CRR = 1 - CER (Character Error Rate)\nCER = Levenshtein Distance / GT Characters\n= ${charErrors} / ${totalGtChars} = ${cer}%\nCRR = 1 - ${cer}% = ${(metrics.avg_crr * 100).toFixed(2)}%`;

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
