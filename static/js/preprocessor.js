/**
 * Text preprocessing functions for OCR evaluation.
 * Handles tokenization and normalization based on configuration.
 */

/**
 * Tokenize text into words by splitting on whitespace.
 *
 * @param {string} text - Input text
 * @returns {Array<string>} List of words
 */
function tokenize(text) {
    if (!text) {
        return [];
    }

    // Split on whitespace (spaces, tabs, newlines)
    return text.split(/\s+/).filter(word => word.length > 0);
}

/**
 * Remove punctuation characters from a word.
 *
 * @param {string} word - Input word
 * @param {string} punctuationChars - String of punctuation characters to remove
 * @returns {string} Word with punctuation removed
 */
function removePunctuation(word, punctuationChars) {
    // Default punctuation if not provided
    if (!punctuationChars) {
        punctuationChars = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
    }

    // Create regex pattern from punctuation characters
    const pattern = new RegExp(`[${punctuationChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`, 'g');
    return word.replace(pattern, '');
}

/**
 * Normalize words based on configuration settings.
 *
 * @param {Array<string>} words - List of words to normalize
 * @param {Object} config - Configuration object
 * @returns {Array<string>} List of normalized words
 */
function normalize(words, config) {
    if (!words || words.length === 0) {
        return [];
    }

    const normalized = [];

    for (let word of words) {
        // Handle punctuation
        if (config.ignore_punctuation !== false) {
            const punctChars = config.punctuation_chars || '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
            word = removePunctuation(word, punctChars);
        }

        // Handle case sensitivity
        if (config.case_sensitive !== true) {
            word = word.toLowerCase();
        }

        // Only keep non-empty words
        if (word) {
            normalized.push(word);
        }
    }

    return normalized;
}

/**
 * Complete preprocessing pipeline: tokenize and normalize.
 *
 * @param {string} text - Input text
 * @param {Object} config - Configuration object
 * @returns {Object} Object with normalized words and word data
 */
function preprocessText(text, config) {
    const originalWords = tokenize(text);

    // Normalize each word individually and track which ones remain
    // This preserves the correct pairing between original and normalized
    const normalizedWords = [];
    const wordData = [];

    for (let i = 0; i < originalWords.length; i++) {
        const original = originalWords[i];
        let normalized = original;

        // Normalize this specific word
        if (config.ignore_punctuation !== false) {
            const punctChars = config.punctuation_chars || '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
            normalized = removePunctuation(normalized, punctChars);
        }

        // Handle case sensitivity
        if (config.case_sensitive !== true) {
            normalized = normalized.toLowerCase();
        }

        // Only keep non-empty words (but maintain correct pairing)
        if (normalized) {
            normalizedWords.push(normalized);
            wordData.push({
                normalized: normalized,
                original: original,
                position: normalizedWords.length - 1  // Position in normalized list
            });
        }
    }

    return {
        words: normalizedWords,
        wordData: wordData
    };
}
