/**
 * Test suite for metrics.js
 * Tests metrics calculation functionality
 */

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
    console.log('Running metrics.js tests...\n');

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

    console.log(`\n${passedTests} passed, ${failedTests} failed`);
    return failedTests === 0;
}

// Tests

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
        ['hello', 'hello', 0, 'exact'] // 0 character errors
    ];

    const metrics = calculateMetrics(matches);

    // Total chars: 5 (hello)
    // Errors: 0
    // CRR: 1 - (0/5) = 1.0
    assertEquals(metrics.avg_crr, 1.0, 'CRR should be 1.0 for exact match');
});

test('Metrics: CRR with unmatched words', () => {
    const matches = [
        ['hello', 'hello', 0, 'exact'], // 0 errors
        ['world', null, null, 'gt_only'], // 5 chars = 5 errors
        [null, 'test', null, 'ocr_only'] // 4 chars = 4 errors
    ];

    const metrics = calculateMetrics(matches);

    // Total GT chars: 5 + 5 = 10
    // Total errors: 0 + 5 + 4 = 9
    // CRR: 1 - (9/10) = 0.1
    assertEquals(metrics.avg_crr, 0.1, 'CRR should be 0.1');
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

test('Metrics: CRR comprehensive calculation', () => {
    // Testing all CRR scenarios:
    // - Exact matches contribute 0 errors
    // - GT-only words: all chars are errors
    // - OCR-only words: all chars are errors
    const matches = [
        ['the', 'the', 0, 'exact'],      // 3 chars, 0 errors
        ['quick', 'quick', 0, 'exact'],  // 5 chars, 0 errors
        ['brown', null, null, 'gt_only'], // 5 chars, 5 errors (missed by OCR)
        ['fox', null, null, 'gt_only'],   // 3 chars, 3 errors (missed by OCR)
        [null, 'quik', null, 'ocr_only']  // 4 chars, 4 errors (hallucinated)
    ];

    const metrics = calculateMetrics(matches);

    // Total GT chars: 3 (the) + 5 (quick) + 5 (brown) + 3 (fox) = 16
    // Total errors: 0 (the) + 0 (quick) + 5 (brown) + 3 (fox) + 4 (quik) = 12
    // CRR: 1 - (12/16) = 0.25
    assertEquals(metrics.avg_crr, 0.25, 'CRR should be 0.25 (25%)');
});

test('Metrics: empty input', () => {
    const matches = [];

    const metrics = calculateMetrics(matches);

    assertEquals(metrics.precision, 0.0, 'Precision should be 0.0 for empty input');
    assertEquals(metrics.recall, 0.0, 'Recall should be 0.0 for empty input');
    assertEquals(metrics.f1_score, 0.0, 'F1 score should be 0.0 for empty input');
    assertEquals(metrics.avg_crr, 0.0, 'CRR should be 0.0 for empty input');
});

// Run tests if in browser
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const success = runTests();
        if (!success) {
            console.error('Some tests failed!');
        }
    });
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { test, runTests, assertEquals, assertTrue };
}
