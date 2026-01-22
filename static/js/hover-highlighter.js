/**
 * Hover Highlighter Module
 * Handles hover interactions to highlight matched words between GT and OCR panels
 */

const HoverHighlighter = {
    currentMatchId: null,
    initializedContainers: new WeakSet(),

    /**
     * Initialize hover highlighting for all visualization containers
     */
    initialize() {
        // Find all visualization containers
        const containers = document.querySelectorAll('.text-viz');

        if (containers.length === 0) {
            return;
        }

        // Attach event listeners to each container that hasn't been initialized yet
        containers.forEach(container => {
            if (!this.initializedContainers.has(container)) {
                this.attachListeners(container);
                this.initializedContainers.add(container);
            }
        });
    },

    /**
     * Attach event listeners to a visualization container
     */
    attachListeners(container) {
        // Use event delegation for better performance
        container.addEventListener('mouseenter', (e) => {
            if (e.target.classList.contains('word')) {
                this.highlightMatch(e.target);
            }
        }, true);  // Use capture phase for delegation

        container.addEventListener('mouseleave', (e) => {
            if (e.target.classList.contains('word')) {
                this.clearHighlight();
            }
        }, true);
    },

    /**
     * Highlight the hovered word and its matched counterpart
     */
    highlightMatch(wordElement) {
        const matchId = wordElement.dataset.matchId;

        // Ignore unmatched words
        if (matchId === 'unmatched' || !matchId) {
            return;
        }

        // Prevent redundant highlighting
        if (this.currentMatchId === matchId) {
            return;
        }

        this.clearHighlight();
        this.currentMatchId = matchId;

        // Get the word text (trimmed) for finding all instances
        const wordText = wordElement.textContent.trim().toLowerCase();
        const panel = wordElement.dataset.panel;

        // Find all words with this match_id across both panels
        const matchedWords = document.querySelectorAll(`[data-match-id="${matchId}"]`);
        const matchedWordElements = new Set();

        matchedWords.forEach(word => {
            matchedWordElements.add(word);
            if (word === wordElement) {
                word.classList.add('hover-source');  // Primary highlight (gold background)
            } else {
                word.classList.add('hover-target');  // Matched counterpart (blue background)
            }
        });

        // Find all other instances of the same word text across both panels
        const allWords = document.querySelectorAll('.word');
        allWords.forEach(word => {
            // Skip if already highlighted with background
            if (matchedWordElements.has(word)) {
                return;
            }

            // Check if this word has the same text content
            const currentText = word.textContent.trim().toLowerCase();
            if (currentText === wordText) {
                const currentPanel = word.dataset.panel;

                // Add border highlight based on which panel it's in
                if (currentPanel === panel) {
                    word.classList.add('hover-same-panel');  // Same panel as hovered word
                } else {
                    word.classList.add('hover-other-panel');  // Other panel
                }
            }
        });
    },

    /**
     * Clear all highlighting
     */
    clearHighlight() {
        if (!this.currentMatchId) {
            return;
        }

        const highlighted = document.querySelectorAll('.hover-source, .hover-target, .hover-same-panel, .hover-other-panel');
        highlighted.forEach(word => {
            word.classList.remove('hover-source', 'hover-target', 'hover-same-panel', 'hover-other-panel');
        });

        this.currentMatchId = null;
    },

    /**
     * Reset the highlighter (useful when switching between modes)
     */
    reset() {
        this.clearHighlight();
        this.initializedContainers = new WeakSet();
    }
};
