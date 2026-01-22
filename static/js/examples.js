/**
 * Examples functionality
 * Handles loading and displaying example datasets
 */

const Examples = {
    examples: [],

    /**
     * Initialize examples section
     */
    async initialize() {
        await this.loadExamples();
        this.renderExamples();
    },

    /**
     * Load available examples from the server
     */
    async loadExamples() {
        try {
            const response = await fetch('/api/examples');
            const data = await response.json();

            if (data.success) {
                this.examples = data.examples;
            } else {
                console.error('Failed to load examples:', data.error);
            }
        } catch (error) {
            console.error('Error loading examples:', error);
        }
    },

    /**
     * Render examples in the grid
     */
    renderExamples() {
        const container = document.getElementById('examples-container');

        if (!container) {
            return;
        }

        if (this.examples.length === 0) {
            container.innerHTML = '<div class="loading-examples">No examples available yet.<br>Add example folders to the examples/ directory.</div>';
            return;
        }

        container.innerHTML = '';

        this.examples.forEach(example => {
            const card = this.createExampleCard(example);
            container.appendChild(card);
        });
    },

    /**
     * Create an example card element
     */
    createExampleCard(example) {
        const card = document.createElement('div');
        card.className = 'example-card';
        card.onclick = () => this.loadExample(example.name);

        // Format example name (replace underscores/dashes with spaces, capitalize)
        const displayName = example.name
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());

        const modelCount = example.output_files.length;
        const modelsText = modelCount === 1 ? '1 model' : `${modelCount} models`;

        card.innerHTML = `
            <img src="${example.preview_url}" alt="${displayName}">
            <div class="example-card-info">
                <div class="example-card-title">${displayName}</div>
                <div class="example-card-meta">
                    <span>${modelsText} to compare</span>
                    ${!example.has_gt ? '<span style="color: #e74c3c;">⚠ Missing ground truth</span>' : ''}
                </div>
            </div>
        `;

        return card;
    },

    /**
     * Load an example and trigger analysis
     */
    async loadExample(exampleName) {
        try {
            // Show loading state
            Utils.showLoading();
            Utils.hideError();

            // Load example files from server
            const response = await fetch(`/api/examples/${exampleName}/load`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load example');
            }

            // Convert file contents to File objects for the batch analyzer
            const files = [];
            const fileContents = data.files;

            for (const [filename, content] of Object.entries(fileContents)) {
                const blob = new Blob([content], { type: 'text/plain' });
                const file = new File([blob], filename, { type: 'text/plain' });
                files.push(file);
            }

            // Trigger batch analysis with example files
            await this.analyzeExampleFiles(files);

        } catch (error) {
            Utils.showError(`Error loading example: ${error.message}`);
        } finally {
            Utils.hideLoading();
        }
    },

    /**
     * Analyze example files using the batch processor
     */
    async analyzeExampleFiles(files) {
        try {
            // Create FormData with example files
            const formData = new FormData();
            files.forEach(file => {
                // Use filename as the key so backend can iterate over all files
                formData.append(file.name, file);
            });

            // Get configuration
            const config = AppConfig.getConfig();
            formData.append('case_sensitive', config.case_sensitive);
            formData.append('ignore_punctuation', config.ignore_punctuation);
            formData.append('edit_distance_threshold', config.edit_distance_threshold);

            // Call batch analyze API
            const response = await fetch('/api/batch-analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Analysis failed');
            }

            // Display results in examples mode container
            this.displayExampleResults(data.results);

            // Show results section
            document.getElementById('examples-results').style.display = 'block';

            // Scroll to results
            document.getElementById('examples-results').scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            Utils.showError(`Error analyzing example: ${error.message}`);
        }
    },

    /**
     * Display example results in the examples mode table
     */
    displayExampleResults(results) {
        // Create a separate table instance for examples mode
        const container = document.getElementById('comparison-table-container-examples');
        container.innerHTML = '';

        // Use ComparisonTable logic but render in examples container
        const table = document.createElement('table');
        table.className = 'comparison-table';

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        const headers = ['', 'Model', 'Precision', 'Recall', 'F1 Score', 'Avg CRR', 'Exact Matches'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body with results
        const tbody = document.createElement('tbody');

        // Sort by F1 score
        const sortedResults = results.sort((a, b) => b.metrics.f1_score - a.metrics.f1_score);

        sortedResults.forEach((result, index) => {
            const rank = index + 1;
            const tr = document.createElement('tr');

            // Add rank class
            if (rank === 1) tr.classList.add('rank-1');
            else if (rank === 2) tr.classList.add('rank-2');
            else if (rank === 3) tr.classList.add('rank-3');

            // Expand button
            const expandTd = document.createElement('td');
            const expandBtn = document.createElement('button');
            expandBtn.textContent = '+';
            expandBtn.className = 'expand-btn';
            expandBtn.dataset.index = index;
            expandBtn.onclick = () => this.toggleExampleRow(index);
            expandTd.appendChild(expandBtn);
            tr.appendChild(expandTd);

            // Model name with medal
            const modelTd = document.createElement('td');
            let medal = '';
            if (rank === 1) medal = '🥇 ';
            else if (rank === 2) medal = '🥈 ';
            else if (rank === 3) medal = '🥉 ';
            modelTd.innerHTML = `${medal}<strong>${result.model_name}</strong>`;
            tr.appendChild(modelTd);

            // Metrics
            ['precision', 'recall', 'f1_score', 'avg_crr'].forEach(metric => {
                const td = document.createElement('td');
                td.textContent = Utils.formatPercentage(result.metrics[metric]);
                tr.appendChild(td);
            });

            // Exact matches
            const exactTd = document.createElement('td');
            exactTd.textContent = result.metrics.exact_matches;
            tr.appendChild(exactTd);

            tbody.appendChild(tr);

            // Add detail row
            const detailTr = document.createElement('tr');
            detailTr.className = 'detail-row';
            detailTr.id = `example-detail-${index}`;
            detailTr.style.display = 'none';

            const detailTd = document.createElement('td');
            detailTd.colSpan = 99;
            detailTd.innerHTML = `
                <div class="detail-content">
                    <div class="visualization-section">
                        <div class="viz-column">
                            <h4>Ground Truth (Annotated)</h4>
                            <div class="text-viz" id="example-gt-viz-${index}"></div>
                        </div>
                        <div class="viz-column">
                            <h4>OCR Output (Annotated)</h4>
                            <div class="text-viz" id="example-ocr-viz-${index}"></div>
                        </div>
                    </div>
                </div>
            `;

            // Store result data for later rendering
            detailTd.dataset.result = JSON.stringify(result);

            detailTr.appendChild(detailTd);
            tbody.appendChild(detailTr);
        });

        table.appendChild(tbody);
        container.appendChild(table);
    },

    /**
     * Toggle example detail row
     */
    toggleExampleRow(index) {
        const detailRow = document.getElementById(`example-detail-${index}`);
        const expandBtn = document.querySelector(`.expand-btn[data-index="${index}"]`);

        if (detailRow.style.display === 'none') {
            detailRow.style.display = 'table-row';
            expandBtn.textContent = '−';

            // Render annotations if not already rendered
            const gtViz = document.getElementById(`example-gt-viz-${index}`);
            if (gtViz.children.length === 0) {
                const result = JSON.parse(detailRow.querySelector('td').dataset.result);
                this.renderAnnotations(gtViz, result.gt_annotations, 'gt');
                this.renderAnnotations(document.getElementById(`example-ocr-viz-${index}`), result.ocr_annotations, 'ocr');

                // Initialize hover highlighter
                if (typeof HoverHighlighter !== 'undefined') {
                    setTimeout(() => HoverHighlighter.initialize(), 0);
                }
            }
        } else {
            detailRow.style.display = 'none';
            expandBtn.textContent = '+';
        }
    },

    /**
     * Render annotations (similar to table.js)
     */
    renderAnnotations(container, annotations, panel) {
        container.innerHTML = '';

        annotations.forEach(annotation => {
            const span = document.createElement('span');
            span.textContent = annotation.word + ' ';

            if (annotation.match_type === 'exact') {
                span.className = 'word';
            } else if (annotation.match_type === 'fuzzy') {
                span.className = 'word fuzzy-match';
                span.title = `Matched with: ${annotation.matched_with} (edit distance: ${annotation.edit_distance})`;
            } else {
                span.className = 'word no-match';
            }

            span.dataset.matchId = annotation.match_id || 'unmatched';
            span.dataset.matchType = annotation.match_type;
            span.dataset.panel = panel;

            container.appendChild(span);
        });
    }
};

// Initialize examples when batch mode is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on a page with the examples container
    if (document.getElementById('examples-container')) {
        Examples.initialize();
    }
});
