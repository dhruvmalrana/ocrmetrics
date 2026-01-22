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

    // Show loading
    Utils.showLoading();
    Utils.hideError();

    try {
        // Read all files
        const fileContents = await readAllFiles(uploadedFiles);

        // Find ground truth
        if (!fileContents['gt.txt']) {
            throw new Error('Ground truth file (gt.txt) not found');
        }

        const groundTruth = fileContents['gt.txt'];

        // Find all model output files
        const modelFiles = Object.keys(fileContents).filter(name => name.endsWith('_out.txt'));

        if (modelFiles.length === 0) {
            throw new Error('No model output files found (must end with _out.txt)');
        }

        // Process each model
        const results = [];
        for (const modelFile of modelFiles) {
            const modelName = modelFile.replace('_out.txt', '');
            const ocrOutput = fileContents[modelFile];

            // Process text
            const gtResult = preprocessText(groundTruth, config);
            const ocrResult = preprocessText(ocrOutput, config);

            // Match words (exact matching only)
            const matches = matchWords(gtResult.words, ocrResult.words);

            // Calculate metrics (pass word arrays for accurate Levenshtein-based CER)
            const metrics = calculateMetrics(matches, gtResult.words, ocrResult.words);

            // Create annotations
            const gtAnnotations = createAnnotations(gtResult.wordData, matches, true);
            const ocrAnnotations = createAnnotations(ocrResult.wordData, matches, false);

            results.push({
                model_name: modelName,
                metrics: metrics,
                gt_annotations: gtAnnotations,
                ocr_annotations: ocrAnnotations
            });
        }

        // Display results
        displayBatchResults(results);

    } catch (error) {
        Utils.showError(`Error: ${error.message}`);
    } finally {
        Utils.hideLoading();
    }
}

async function readAllFiles(files) {
    const fileContents = {};

    for (const file of files) {
        const text = await readFileAsText(file);
        fileContents[file.name] = text;
    }

    return fileContents;
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file: ' + file.name));
        reader.readAsText(file);
    });
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
