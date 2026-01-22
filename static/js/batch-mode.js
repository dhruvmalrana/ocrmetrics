/**
 * Batch upload mode functionality
 * Handles file uploads and batch comparison
 */

let uploadedFiles = [];

document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const batchAnalyzeBtn = document.getElementById('batch-analyze-btn');

    // Click to browse
    dropZone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFileSelect({ target: { files: e.dataTransfer.files } });
    });

    // Batch analyze button
    batchAnalyzeBtn.addEventListener('click', handleBatchAnalyze);
});

function handleFileSelect(event) {
    const files = Array.from(event.target.files);

    // Filter .txt files only
    const txtFiles = files.filter(file => file.name.endsWith('.txt'));

    if (txtFiles.length === 0) {
        Utils.showError('Please select .txt files only');
        return;
    }

    // Add to uploaded files
    uploadedFiles = txtFiles;

    // Display file list
    displayFileList();

    // Show analyze button
    document.getElementById('batch-analyze-btn').style.display = 'block';
}

function displayFileList() {
    const fileListDiv = document.getElementById('file-list');
    fileListDiv.innerHTML = '<h4>Selected Files:</h4>';

    const list = document.createElement('ul');

    uploadedFiles.forEach(file => {
        const li = document.createElement('li');

        // Highlight ground truth and model files
        if (file.name === 'gt.txt') {
            li.innerHTML = `<strong>${file.name}</strong> <span class="file-tag ground-truth">Ground Truth</span>`;
        } else if (file.name.endsWith('_out.txt')) {
            const modelName = file.name.replace('_out.txt', '');
            li.innerHTML = `<strong>${file.name}</strong> <span class="file-tag model">Model: ${modelName}</span>`;
        } else {
            li.innerHTML = `${file.name} <span class="file-tag unknown">Unknown format</span>`;
        }

        list.appendChild(li);
    });

    fileListDiv.appendChild(list);
}

async function handleBatchAnalyze() {
    if (uploadedFiles.length === 0) {
        Utils.showError('Please select files first');
        return;
    }

    // Get configuration
    const config = AppConfig.getConfig();

    // Create FormData
    const formData = new FormData();

    uploadedFiles.forEach(file => {
        formData.append(file.name, file);
    });

    // Add config to form data
    formData.append('case_sensitive', config.case_sensitive);
    formData.append('ignore_punctuation', config.ignore_punctuation);
    formData.append('edit_distance_threshold', config.edit_distance_threshold);

    // Show loading
    Utils.showLoading();
    Utils.hideError();

    try {
        // Call API
        const response = await fetch('/api/batch-analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Batch analysis failed');
        }

        // Show any warnings/errors
        if (data.errors && data.errors.length > 0) {
            console.warn('Warnings:', data.errors);
        }

        // Display results
        displayBatchResults(data.results);

    } catch (error) {
        Utils.showError(`Error: ${error.message}`);
    } finally {
        Utils.hideLoading();
    }
}

function displayBatchResults(results) {
    // Show results section
    document.getElementById('batch-results').style.display = 'block';

    // Render table (using table.js)
    if (typeof window.TableRenderer !== 'undefined') {
        window.TableRenderer.renderTable(results);
    }

    // Scroll to results
    document.getElementById('batch-results').scrollIntoView({ behavior: 'smooth' });
}
