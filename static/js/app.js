/**
 * Main application script for OCR Metrics Evaluator
 * Handles mode switching and shared configuration
 */

// Shared configuration state
const AppConfig = {
    getConfig() {
        return {
            case_sensitive: document.getElementById('case-sensitive').checked,
            ignore_punctuation: document.getElementById('ignore-punctuation').checked,
            edit_distance_threshold: 0  // Fixed to 0 for exact matching only (standard OCR evaluation)
        };
    }
};

// Mode switching
document.addEventListener('DOMContentLoaded', function() {
    const howtoModeBtn = document.getElementById('howto-mode-btn');
    const manualModeBtn = document.getElementById('manual-mode-btn');
    const batchModeBtn = document.getElementById('batch-mode-btn');
    const examplesModeBtn = document.getElementById('examples-mode-btn');
    const howtoMode = document.getElementById('howto-mode');
    const manualMode = document.getElementById('manual-mode');
    const batchMode = document.getElementById('batch-mode');
    const examplesMode = document.getElementById('examples-mode');

    function switchMode(activeBtn, activeMode) {
        // Remove active class from all buttons and modes
        [howtoModeBtn, manualModeBtn, batchModeBtn, examplesModeBtn].forEach(btn => btn.classList.remove('active'));
        [howtoMode, manualMode, batchMode, examplesMode].forEach(mode => mode.classList.remove('active'));

        // Add active class to selected button and mode
        activeBtn.classList.add('active');
        activeMode.classList.add('active');
    }

    // Switch to how it works mode
    howtoModeBtn.addEventListener('click', function() {
        switchMode(howtoModeBtn, howtoMode);
    });

    // Switch to manual mode
    manualModeBtn.addEventListener('click', function() {
        switchMode(manualModeBtn, manualMode);
    });

    // Switch to batch mode
    batchModeBtn.addEventListener('click', function() {
        switchMode(batchModeBtn, batchMode);
    });

    // Switch to examples mode
    examplesModeBtn.addEventListener('click', function() {
        switchMode(examplesModeBtn, examplesMode);
    });
});

// Utility functions
const Utils = {
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    },

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    },

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    },

    hideError() {
        document.getElementById('error-message').style.display = 'none';
    },

    formatPercentage(value) {
        return `${(value * 100).toFixed(2)}%`;
    }
};
