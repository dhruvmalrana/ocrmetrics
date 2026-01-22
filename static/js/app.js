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
    const manualModeBtn = document.getElementById('manual-mode-btn');
    const batchModeBtn = document.getElementById('batch-mode-btn');
    const manualMode = document.getElementById('manual-mode');
    const batchMode = document.getElementById('batch-mode');

    // Switch to manual mode
    manualModeBtn.addEventListener('click', function() {
        manualModeBtn.classList.add('active');
        batchModeBtn.classList.remove('active');
        manualMode.classList.add('active');
        batchMode.classList.remove('active');
    });

    // Switch to batch mode
    batchModeBtn.addEventListener('click', function() {
        batchModeBtn.classList.add('active');
        manualModeBtn.classList.remove('active');
        batchMode.classList.add('active');
        manualMode.classList.remove('active');
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
