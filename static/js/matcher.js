/**
 * Word matching algorithm for OCR evaluation.
 * Implements two-phase matching: exact matching followed by fuzzy matching.
 */

/**
 * Count occurrences of items in an array (like Python's Counter).
 *
 * @param {Array} arr - Array of items
 * @returns {Object} Object with items as keys and counts as values
 */
function counter(arr) {
    const counts = {};
    for (const item of arr) {
        counts[item] = (counts[item] || 0) + 1;
    }
    return counts;
}

/**
 * Match OCR words to ground truth words using exact matching only.
 * Order-invariant, handles word counts properly.
 *
 * Algorithm:
 * 1. Exact Matching: Match identical words
 * 2. Mark Unmatched: Remaining words are gt_only or ocr_only
 *
 * @param {Array<string>} gtWords - List of preprocessed ground truth words
 * @param {Array<string>} ocrWords - List of preprocessed OCR output words
 * @returns {Array} List of match tuples [gtWord, ocrWord, editDistance, matchType]
 */
function matchWords(gtWords, ocrWords) {
    const matches = [];

    // Count word occurrences (handles duplicates)
    const gtCounts = counter(gtWords);
    const ocrCounts = counter(ocrWords);

    // Track matched word instances
    const gtMatched = {};
    const ocrMatched = {};

    // PHASE 1: Exact matching (greedy, highest counts first)
    const gtWordsUnique = Object.keys(gtCounts).sort((a, b) => gtCounts[b] - gtCounts[a]);

    for (const gtWord of gtWordsUnique) {
        if (gtWord in ocrCounts) {
            // Match as many instances as possible
            const matchCount = Math.min(gtCounts[gtWord], ocrCounts[gtWord]);
            for (let i = 0; i < matchCount; i++) {
                matches.push([gtWord, gtWord, 0, 'exact']);
            }
            gtMatched[gtWord] = matchCount;
            ocrMatched[gtWord] = matchCount;
        }
    }

    // PHASE 2: Mark unmatched words
    // Create lists of remaining unmatched instances
    const gtRemaining = [];
    for (const [word, count] of Object.entries(gtCounts)) {
        const matched = gtMatched[word] || 0;
        for (let i = 0; i < count - matched; i++) {
            gtRemaining.push(word);
        }
    }

    const ocrRemaining = [];
    for (const [word, count] of Object.entries(ocrCounts)) {
        const matched = ocrMatched[word] || 0;
        for (let i = 0; i < count - matched; i++) {
            ocrRemaining.push(word);
        }
    }

    // GT words with no match (false negatives)
    for (const gtWord of gtRemaining) {
        matches.push([gtWord, null, null, 'gt_only']);
    }

    // OCR words with no match (false positives)
    for (const ocrWord of ocrRemaining) {
        matches.push([null, ocrWord, null, 'ocr_only']);
    }

    return matches;
}

/**
 * Create annotations for text visualization, preserving original word order.
 *
 * @param {Array} wordData - List of word data objects with keys: normalized, original, position
 * @param {Array} matches - Match results from matchWords()
 * @param {boolean} isGroundTruth - True if annotating GT text, False if OCR text
 * @returns {Array} List of annotation objects
 */
function createAnnotations(wordData, matches, isGroundTruth = true) {
    // Build a mapping from normalized words to their match information
    // Handle duplicates by tracking available matches
    const matchMap = {}; // normalized_word -> list of {matchInfo, used: bool}

    if (isGroundTruth) {
        for (let idx = 0; idx < matches.length; idx++) {
            const [gtWord, ocrWord, editDist, matchType] = matches[idx];
            if (['exact', 'gt_only'].includes(matchType)) {
                if (!(gtWord in matchMap)) {
                    matchMap[gtWord] = [];
                }
                matchMap[gtWord].push({
                    matched_with: ocrWord,
                    edit_distance: editDist,
                    match_type: matchType,
                    match_id: matchType === 'exact' ? `match_${idx}` : null,
                    order: idx,  // Track original order for first-to-first matching
                    used: false  // Track if this match has been consumed
                });
            }
        }
    } else {
        for (let idx = 0; idx < matches.length; idx++) {
            const [gtWord, ocrWord, editDist, matchType] = matches[idx];
            if (['exact', 'ocr_only'].includes(matchType)) {
                if (!(ocrWord in matchMap)) {
                    matchMap[ocrWord] = [];
                }
                matchMap[ocrWord].push({
                    matched_with: gtWord,
                    edit_distance: editDist,
                    match_type: matchType,
                    match_id: matchType === 'exact' ? `match_${idx}` : null,
                    order: idx,  // Track original order for first-to-first matching
                    used: false  // Track if this match has been consumed
                });
            }
        }
    }

    // Create annotations in original word order
    const annotations = [];

    for (const wordInfo of wordData) {
        const normalized = wordInfo.normalized;
        const original = wordInfo.original;

        if (normalized in matchMap) {
            // Find the next available (unused) match for this word
            // Prefer exact matches, then only matches, with first-to-first ordering
            const availableMatches = matchMap[normalized].filter(m => !m.used);

            let matchInfo;
            if (availableMatches.length > 0) {
                // Prioritize exact matches over only matches (first-to-first ordering)
                // First, try to find an exact match (prefer lower order for first-to-first)
                const exactMatches = availableMatches
                    .filter(m => m.match_type === 'exact')
                    .sort((a, b) => a.order - b.order);

                if (exactMatches.length > 0) {
                    matchInfo = exactMatches[0];
                } else {
                    // No exact match available, use first only match (sorted by order)
                    const onlyMatches = availableMatches.sort((a, b) => a.order - b.order);
                    matchInfo = onlyMatches[0];
                }
                matchInfo.used = true; // Mark as consumed
            } else {
                // All matches for this word have been used - mark as unmatched
                matchInfo = {
                    match_type: isGroundTruth ? 'gt_only' : 'ocr_only',
                    matched_with: null,
                    edit_distance: null,
                    match_id: null
                };
            }

            annotations.push({
                word: original,  // Use original word, not normalized
                match_type: matchInfo.match_type,
                matched_with: matchInfo.matched_with,
                edit_distance: matchInfo.edit_distance,
                match_id: matchInfo.match_id
            });
        } else {
            // No match found - shouldn't happen but handle gracefully
            annotations.push({
                word: original,
                match_type: isGroundTruth ? 'gt_only' : 'ocr_only',
                matched_with: null,
                edit_distance: null,
                match_id: null
            });
        }
    }

    return annotations;
}
