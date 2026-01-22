/**
 * Test suite for matcher.js
 * Tests word matching functionality
 */

(function() {
    const tests = [];
    let passedTests = 0;
    let failedTests = 0;

    function test(name, fn) {
        tests.push({ name, fn });
    }

    function assertEquals(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
        }
    }

    function assertTrue(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    function runTests() {
        console.log('Running matcher.js tests...');
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

    // Helper to count match types
    function countMatchTypes(matches) {
        return {
            exact: matches.filter(m => m[3] === 'exact').length,
            gt_only: matches.filter(m => m[3] === 'gt_only').length,
            ocr_only: matches.filter(m => m[3] === 'ocr_only').length
        };
    }

// Tests for matchWords

test('Match: exact matches only', () => {
    const gt = ['hello', 'world'];
    const ocr = ['hello', 'world'];
    const matches = matchWords(gt, ocr);

    const counts = countMatchTypes(matches);
    assertEquals(counts.exact, 2, 'Should have 2 exact matches');
    assertEquals(counts.gt_only, 0, 'Should have no GT-only words');
    assertEquals(counts.ocr_only, 0, 'Should have no OCR-only words');
});

test('Match: no matches', () => {
    const gt = ['hello', 'world'];
    const ocr = ['foo', 'bar'];
    const matches = matchWords(gt, ocr);

    const counts = countMatchTypes(matches);
    assertEquals(counts.exact, 0, 'Should have no exact matches');
    assertEquals(counts.gt_only, 2, 'Should have 2 GT-only words');
    assertEquals(counts.ocr_only, 2, 'Should have 2 OCR-only words');
});

test('Match: OCR missing words', () => {
    const gt = ['hello', 'world', 'test'];
    const ocr = ['hello'];
    const matches = matchWords(gt, ocr);

    const counts = countMatchTypes(matches);
    assertEquals(counts.exact, 1, 'Should have 1 exact match');
    assertEquals(counts.gt_only, 2, 'Should have 2 missing words');
});

test('Match: OCR extra words', () => {
    const gt = ['hello'];
    const ocr = ['hello', 'world', 'test'];
    const matches = matchWords(gt, ocr);

    const counts = countMatchTypes(matches);
    assertEquals(counts.exact, 1, 'Should have 1 exact match');
    assertEquals(counts.ocr_only, 2, 'Should have 2 extra words');
});

test('Match: duplicates handled correctly', () => {
    const gt = ['the', 'the', 'cat'];
    const ocr = ['the', 'cat'];
    const matches = matchWords(gt, ocr);

    const counts = countMatchTypes(matches);
    assertEquals(counts.exact, 2, 'Should match both "the" and "cat"');
    assertEquals(counts.gt_only, 1, 'Should have one unmatched "the"');
});

test('Match: non-exact words are not matched', () => {
    const gt = ['hello'];
    const ocr = ['helo']; // 1 char different
    const matches = matchWords(gt, ocr);

    const counts = countMatchTypes(matches);
    assertEquals(counts.exact, 0, 'Should have no exact matches');
    assertEquals(counts.gt_only, 1, 'Should have 1 GT-only word');
    assertEquals(counts.ocr_only, 1, 'Should have 1 OCR-only word');
});

test('Match: invoice example', () => {
    const gt = ['invoice', 'number', 'inv', '2024', '001'];
    const ocr = ['invoice', 'number', 'inv', '2o24', '001']; // O instead of 0
    const matches = matchWords(gt, ocr);

    const counts = countMatchTypes(matches);
    assertEquals(counts.exact, 4, 'Should have 4 exact matches');
    assertEquals(counts.gt_only, 1, 'Should have 1 GT-only word');
    assertEquals(counts.ocr_only, 1, 'Should have 1 OCR-only word');
});

// Tests for createAnnotations

test('Annotations: preserves original order', () => {
    const wordData = [
        { normalized: 'hello', original: 'Hello', position: 0 },
        { normalized: 'world', original: 'World!', position: 1 }
    ];
    const matches = [
        ['hello', 'hello', 0, 'exact'],
        ['world', 'world', 0, 'exact']
    ];

    const annotations = createAnnotations(wordData, matches, true);

    assertEquals(annotations[0].word, 'Hello', 'Should preserve original text');
    assertEquals(annotations[1].word, 'World!', 'Should preserve original punctuation');
});

test('Annotations: marks unmatched words', () => {
    const wordData = [
        { normalized: 'hello', original: 'Hello', position: 0 },
        { normalized: 'world', original: 'World', position: 1 }
    ];
    const matches = [
        ['hello', 'hello', 0, 'exact'],
        ['world', null, null, 'gt_only']
    ];

    const annotations = createAnnotations(wordData, matches, true);

    assertEquals(annotations[0].match_type, 'exact', 'First word should be exact');
    assertEquals(annotations[1].match_type, 'gt_only', 'Second word should be gt_only');
});

test('Annotations: assigns match IDs', () => {
    const wordData = [
        { normalized: 'hello', original: 'Hello', position: 0 }
    ];
    const matches = [
        ['hello', 'hello', 0, 'exact']
    ];

    const annotations = createAnnotations(wordData, matches, true);

    assertTrue(annotations[0].match_id !== null, 'Should have a match ID');
    assertTrue(annotations[0].match_id.startsWith('match_'), 'Match ID should have correct format');
});

test('Annotations: first-to-first matching with duplicates', () => {
    // GT has 2 'the's, OCR has 1 'the'
    // The first 'the' in GT should match with the 'the' in OCR
    const gtWordData = [
        { normalized: 'the', original: 'The', position: 0 },
        { normalized: 'cat', original: 'cat', position: 1 },
        { normalized: 'the', original: 'the', position: 2 }
    ];
    const ocrWordData = [
        { normalized: 'the', original: 'The', position: 0 },
        { normalized: 'cat', original: 'cat', position: 1 }
    ];

    const matches = matchWords(['the', 'cat', 'the'], ['the', 'cat']);

    const gtAnnotations = createAnnotations(gtWordData, matches, true);
    const ocrAnnotations = createAnnotations(ocrWordData, matches, false);

    // First 'The' in GT should have a match_id (exact match)
    assertTrue(gtAnnotations[0].match_id !== null, 'First The in GT should be matched');
    assertEquals(gtAnnotations[0].match_type, 'exact', 'First The in GT should be exact match');

    // Second 'the' in GT should NOT have a match_id (gt_only)
    assertEquals(gtAnnotations[2].match_id, null, 'Second the in GT should be unmatched');
    assertEquals(gtAnnotations[2].match_type, 'gt_only', 'Second the in GT should be gt_only');

    // The in OCR should have the same match_id as first The in GT
    assertEquals(ocrAnnotations[0].match_id, gtAnnotations[0].match_id,
        'OCR The should match with first GT The');
});

    // Register with test registry
    if (typeof window !== 'undefined' && window.TestRegistry) {
        window.TestRegistry.register('Matcher', { run: runTests });
    }

    // Export for Node.js testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { test, runTests, assertEquals, assertTrue };
    }
})();
