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
    let avgCrr = 0.0;
    if (totalGtChars > 0) {
        const cer = totalCharErrors / totalGtChars;
        avgCrr = Math.max(0.0, 1.0 - cer); // Ensure non-negative
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
        unmatched_ocr: ocrOnlyMatches.length
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
