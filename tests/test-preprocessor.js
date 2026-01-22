/**
 * Test suite for preprocessor.js
 * Tests text preprocessing functionality
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
        console.log('Running preprocessor.js tests...');
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

// Tests

test('Tokenize: simple text', () => {
    const words = tokenize('hello world');
    assertEquals(words, ['hello', 'world'], 'Should split on spaces');
});

test('Tokenize: multiple spaces', () => {
    const words = tokenize('hello   world');
    assertEquals(words, ['hello', 'world'], 'Should handle multiple spaces');
});

test('Tokenize: tabs and newlines', () => {
    const words = tokenize('hello\tworld\ntest');
    assertEquals(words, ['hello', 'world', 'test'], 'Should split on all whitespace');
});

test('Tokenize: empty string', () => {
    const words = tokenize('');
    assertEquals(words, [], 'Should return empty array for empty string');
});

test('Normalize: lowercase', () => {
    const config = { case_sensitive: false, ignore_punctuation: false };
    const result = normalize(['Hello', 'WORLD'], config);
    assertEquals(result, ['hello', 'world'], 'Should convert to lowercase');
});

test('Normalize: case sensitive', () => {
    const config = { case_sensitive: true, ignore_punctuation: false };
    const result = normalize(['Hello', 'WORLD'], config);
    assertEquals(result, ['Hello', 'WORLD'], 'Should preserve case');
});

test('Normalize: remove punctuation', () => {
    const config = { case_sensitive: false, ignore_punctuation: true };
    const result = normalize(['hello,', 'world!'], config);
    assertEquals(result, ['hello', 'world'], 'Should remove punctuation');
});

test('Normalize: keep punctuation', () => {
    const config = { case_sensitive: false, ignore_punctuation: false };
    const result = normalize(['hello,', 'world!'], config);
    assertEquals(result, ['hello,', 'world!'], 'Should keep punctuation');
});

test('PreprocessText: full pipeline', () => {
    const config = { case_sensitive: false, ignore_punctuation: true };
    const result = preprocessText('Hello, World!', config);

    assertEquals(result.words, ['hello', 'world'], 'Words should be normalized');
    assertTrue(result.wordData.length === 2, 'Should have 2 word data entries');
    assertEquals(result.wordData[0].original, 'Hello', 'Should preserve original part');
    assertEquals(result.wordData[0].normalized, 'hello', 'Should have normalized');
});

test('PreprocessText: empty after normalization', () => {
    const config = { case_sensitive: false, ignore_punctuation: true };
    const result = preprocessText('... !!!', config);

    assertEquals(result.words, [], 'Should have no words after removing punctuation');
    assertEquals(result.wordData, [], 'Should have no word data');
});

test('PreprocessText: invoice example', () => {
    const text = 'Invoice Number: INV-2024-001';
    const config = { case_sensitive: false, ignore_punctuation: true };
    const result = preprocessText(text, config);

    assertEquals(result.words, ['invoice', 'number', 'inv', '2024', '001'],
                 'Should handle invoice text correctly');
});

    // Register with test registry
    if (typeof window !== 'undefined' && window.TestRegistry) {
        window.TestRegistry.register('Preprocessor', { run: runTests });
    }

    // Export for Node.js testing
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { test, runTests, assertEquals, assertTrue };
    }
})();
