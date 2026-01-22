/**
 * Test suite for metrics.js
 * Tests metrics calculation functionality including Levenshtein-based CER
 */

(function() {
    const tests = [];
    let passedTests = 0;
    let failedTests = 0;

    function test(name, fn) {
        tests.push({ name, fn });
    }

    function assertEquals(actual, expected, message) {
        if (Math.abs(actual - expected) > 0.001) { // Allow small floating point differences
            throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
        }
    }

    function assertTrue(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    function runTests() {
        console.log('Running metrics.js tests...');
        passedTests = 0;
        failedTests = 0;

        for (const { name, fn } of tests) {
            try {
                fn();
                console.log(`✓ ${name}`);
                passedTests++;
            } catch (error) {
                console.error(`✗ ${name}`);
                console.error(`  ${error.message}`);
                failedTests++;
            }
        }

        console.log(`${passedTests} passed, ${failedTests} failed`);
        return { passed: passedTests, failed: failedTests, success: failedTests === 0 };
    }

// Levenshtein Distance Tests

test('Levenshtein: identical strings', () => {
    assertEquals(levenshteinDistance('hello', 'hello'), 0, 'Identical strings should have distance 0');
});

test('Levenshtein: empty strings', () => {
    assertEquals(levenshteinDistance('', ''), 0, 'Two empty strings should have distance 0');
    assertEquals(levenshteinDistance('hello', ''), 5, 'Distance from string to empty should be string length');
    assertEquals(levenshteinDistance('', 'world'), 5, 'Distance from empty to string should be string length');
});

test('Levenshtein: single substitution', () => {
    assertEquals(levenshteinDistance('quick', 'quiok'), 1, 'One char substitution should be 1');
    assertEquals(levenshteinDistance('cat', 'bat'), 1, 'One char substitution at start should be 1');
});

test('Levenshtein: single insertion/deletion', () => {
    assertEquals(levenshteinDistance('hello', 'helo'), 1, 'One deletion should be 1');
    assertEquals(levenshteinDistance('helo', 'hello'), 1, 'One insertion should be 1');
});

test('Levenshtein: multiple edits', () => {
    assertEquals(levenshteinDistance('kitten', 'sitting'), 3, 'kitten->sitting should be 3 edits');
    assertEquals(levenshteinDistance('saturday', 'sunday'), 3, 'saturday->sunday should be 3 edits');
});

// Metrics Tests

test('Metrics: perfect match', () => {
    const matches = [
        ['hello', 'hello', 0, 'exact'],
        ['world', 'world', 0, 'exact']
    ];

    const metrics = calculateMetrics(matches);

    assertEquals(metrics.precision, 1.0, 'Precision should be 1.0');
    assertEquals(metrics.recall, 1.0, 'Recall should be 1.0');
    assertEquals(metrics.f1_score, 1.0, 'F1 score should be 1.0');
    assertEquals(metrics.avg_crr, 1.0, 'CRR should be 1.0');
    assertEquals(metrics.exact_matches, 2, 'Should have 2 exact matches');
});

test('Metrics: no matches', () => {
    const matches = [
        ['hello', null, null, 'gt_only'],
        ['world', null, null, 'gt_only'],
        [null, 'foo', null, 'ocr_only'],
        [null, 'bar', null, 'ocr_only']
    ];

    const metrics = calculateMetrics(matches);

    assertEquals(metrics.precision, 0.0, 'Precision should be 0.0');
    assertEquals(metrics.recall, 0.0, 'Recall should be 0.0');
    assertEquals(metrics.f1_score, 0.0, 'F1 score should be 0.0');
    assertEquals(metrics.exact_matches, 0, 'Should have 0 exact matches');
});

test('Metrics: half precision', () => {
    const matches = [
        ['hello', 'hello', 0, 'exact'],
        [null, 'world', null, 'ocr_only'] // OCR hallucinated this
    ];

    const metrics = calculateMetrics(matches);

    assertEquals(metrics.precision, 0.5, 'Precision should be 0.5 (1/2)');
    assertEquals(metrics.recall, 1.0, 'Recall should be 1.0 (1/1)');
});

test('Metrics: half recall', () => {
    const matches = [
        ['hello', 'hello', 0, 'exact'],
        ['world', null, null, 'gt_only'] // OCR missed this
    ];

    const metrics = calculateMetrics(matches);

    assertEquals(metrics.precision, 1.0, 'Precision should be 1.0 (1/1)');
    assertEquals(metrics.recall, 0.5, 'Recall should be 0.5 (1/2)');
});

test('Metrics: F1 score calculation', () => {
    const matches = [
        ['the', 'the', 0, 'exact'],
        ['quick', 'quick', 0, 'exact'],
        ['brown', null, null, 'gt_only'],
        ['fox', null, null, 'gt_only'],
        [null, 'quik', null, 'ocr_only']
    ];

    const metrics = calculateMetrics(matches);

    // Precision: 2/3 = 0.667
    // Recall: 2/4 = 0.5
    // F1: 2 * (0.667 * 0.5) / (0.667 + 0.5) = 0.571
    assertEquals(metrics.precision, 2/3, 'Precision should be 2/3');
    assertEquals(metrics.recall, 0.5, 'Recall should be 0.5');
    assertEquals(metrics.f1_score, 0.571, 'F1 score should be ~0.571');
});

test('Metrics: CRR with exact match only', () => {
    const matches = [
        ['hello', 'hello', 0, 'exact']
    ];

    const metrics = calculateMetrics(matches);

    // Total chars: 5 (hello)
    // Errors: 0
    // CRR: 1 - (0/5) = 1.0
    assertEquals(metrics.avg_crr, 1.0, 'CRR should be 1.0 for exact match');
});

test('Metrics: CRR with unmatched words (Levenshtein)', () => {
    const matches = [
        ['hello', 'hello', 0, 'exact'],
        ['world', null, null, 'gt_only'],
        [null, 'test', null, 'ocr_only']
    ];

    const metrics = calculateMetrics(matches);

    // Reconstructed: gtText = "helloworld" (10 chars), ocrText = "hellotest" (9 chars)
    // Levenshtein("helloworld", "hellotest") = 5 (w->t, o->e, r->s, l->t, delete d)
    // CER = 5/10 = 0.5, CRR = 0.5
    assertEquals(metrics.avg_crr, 0.5, 'CRR should be 0.5 with Levenshtein');
});

test('Metrics: invoice example', () => {
    // Ground truth: "Invoice Number: INV-2024-001"
    // OCR output: "Invoice Number: INV-2O24-001" (O instead of 0)
    // After normalization: invoice, number, inv, 2024, 001 vs invoice, number, inv, 2o24, 001
    const matches = [
        ['invoice', 'invoice', 0, 'exact'],
        ['number', 'number', 0, 'exact'],
        ['inv', 'inv', 0, 'exact'],
        ['2024', null, null, 'gt_only'],
        ['001', '001', 0, 'exact'],
        [null, '2o24', null, 'ocr_only']
    ];

    const metrics = calculateMetrics(matches);

    // Precision: 4/5 = 0.8
    // Recall: 4/5 = 0.8
    // F1: 2 * (0.8 * 0.8) / (0.8 + 0.8) = 0.8
    assertEquals(metrics.precision, 0.8, 'Precision should be 0.8');
    assertEquals(metrics.recall, 0.8, 'Recall should be 0.8');
    assertEquals(metrics.f1_score, 0.8, 'F1 score should be 0.8');
});

test('Metrics: counts are correct', () => {
    const matches = [
        ['a', 'a', 0, 'exact'],
        ['b', 'b', 0, 'exact'],
        ['c', null, null, 'gt_only'],
        ['d', null, null, 'gt_only'],
        [null, 'e', null, 'ocr_only']
    ];

    const metrics = calculateMetrics(matches);

    assertEquals(metrics.exact_matches, 2, 'Should have 2 exact matches');
    assertEquals(metrics.total_gt_words, 4, 'Should have 4 GT words');
    assertEquals(metrics.total_ocr_words, 3, 'Should have 3 OCR words');
    assertEquals(metrics.unmatched_gt, 2, 'Should have 2 unmatched GT words');
    assertEquals(metrics.unmatched_ocr, 1, 'Should have 1 unmatched OCR word');
});

test('Metrics: CRR comprehensive calculation (Levenshtein)', () => {
    // Testing CRR with Levenshtein distance
    const matches = [
        ['the', 'the', 0, 'exact'],
        ['quick', 'quick', 0, 'exact'],
        ['brown', null, null, 'gt_only'],
        ['fox', null, null, 'gt_only'],
        [null, 'quik', null, 'ocr_only']
    ];

    const metrics = calculateMetrics(matches);

    // Reconstructed: gtText = "thequickbrownfox" (16 chars), ocrText = "thequickquik" (12 chars)
    // Levenshtein("thequickbrownfox", "thequickquik"):
    // - First 8 match (thequick)
    // - Transform "brownfox" -> "quik": b->q, r->u, o->i, w->k, del(n,o,f,x) = 8 edits
    // CER = 8/16 = 0.5, CRR = 0.5
    assertEquals(metrics.avg_crr, 0.5, 'CRR should be 0.5 (50%) with Levenshtein');
});

test('Metrics: empty input', () => {
    const matches = [];

    const metrics = calculateMetrics(matches);

    assertEquals(metrics.precision, 0.0, 'Precision should be 0.0 for empty input');
    assertEquals(metrics.recall, 0.0, 'Recall should be 0.0 for empty input');
    assertEquals(metrics.f1_score, 0.0, 'F1 score should be 0.0 for empty input');
    assertEquals(metrics.avg_crr, 0.0, 'CRR should be 0.0 for empty input');
});

test('Metrics: CRR with single char substitution (key improvement)', () => {
    // This is the key case that Levenshtein fixes:
    // "quick" -> "quiok" should be 1 error, not 10 (5 del + 5 ins)
    const matches = [
        ['quick', null, null, 'gt_only'],
        [null, 'quiok', null, 'ocr_only']
    ];

    const metrics = calculateMetrics(matches);

    // gtText = "quick" (5 chars), ocrText = "quiok" (5 chars)
    // Levenshtein("quick", "quiok") = 1 (c->o substitution)
    // CER = 1/5 = 0.2, CRR = 0.8
    assertEquals(metrics.avg_crr, 0.8, 'CRR should be 0.8 (80%) - single char substitution');
    assertEquals(metrics.char_errors, 1, 'Should have only 1 character error');
});

test('Metrics: CRR with word arrays provided', () => {
    // Test the primary code path where word arrays are passed directly
    const matches = [
        ['the', 'the', 0, 'exact'],
        ['quick', null, null, 'gt_only'],
        [null, 'quiok', null, 'ocr_only']
    ];
    const gtWords = ['the', 'quick'];
    const ocrWords = ['the', 'quiok'];

    const metrics = calculateMetrics(matches, gtWords, ocrWords);

    // gtText = "thequick" (8 chars), ocrText = "thequiok" (8 chars)
    // Levenshtein = 1 (c->o)
    // CER = 1/8 = 0.125, CRR = 0.875
    assertEquals(metrics.avg_crr, 0.875, 'CRR should be 0.875 with word arrays');
});

    // Register with test registry
    if (typeof window !== 'undefined' && window.TestRegistry) {
        window.TestRegistry.register('Metrics', { run: runTests });
    }

    // Export for Node.js testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { test, runTests, assertEquals, assertTrue };
    }
})();
