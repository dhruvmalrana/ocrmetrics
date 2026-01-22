/**
 * Table rendering and manipulation for batch comparison results
 * Handles sorting, expansion, column visibility, and CSV export
 */

window.TableRenderer = {
    results: [],
    sortColumn: 'f1_score',  // Default sort by F1 score
    sortAscending: false,    // Descending (highest first)
    visibleColumns: new Set(['precision', 'recall', 'f1', 'crr', 'exact']),

    renderTable(results) {
        this.results = results;
        this.updateTable();
        this.setupColumnToggles();
        this.setupCSVExport();
    },

    updateTable() {
        const container = document.getElementById('comparison-table-container');
        const table = document.createElement('table');
        table.className = 'comparison-table';

        // Create header
        const thead = this.createTableHeader();
        table.appendChild(thead);

        // Create body
        const tbody = this.createTableBody();
        table.appendChild(tbody);

        // Replace table
        container.innerHTML = '';
        container.appendChild(table);
    },

    createTableHeader() {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');

        // Expand column
        tr.appendChild(this.createHeaderCell('', 'expand', false));

        // Rank column
        tr.appendChild(this.createHeaderCell('Rank', 'rank', false));

        // Model name
        tr.appendChild(this.createHeaderCell('Model', 'model_name', true));

        // Metrics columns (conditional)
        if (this.visibleColumns.has('precision')) {
            tr.appendChild(this.createHeaderCell('Precision', 'precision', true));
        }
        if (this.visibleColumns.has('recall')) {
            tr.appendChild(this.createHeaderCell('Recall', 'recall', true));
        }
        if (this.visibleColumns.has('f1')) {
            tr.appendChild(this.createHeaderCell('F1 Score', 'f1_score', true));
        }
        if (this.visibleColumns.has('crr')) {
            tr.appendChild(this.createHeaderCell('Avg CRR', 'avg_crr', true));
        }
        if (this.visibleColumns.has('exact')) {
            tr.appendChild(this.createHeaderCell('Exact Matches', 'exact_matches', true));
        }

        thead.appendChild(tr);
        return thead;
    },

    createHeaderCell(text, column, sortable) {
        const th = document.createElement('th');
        th.textContent = text;

        if (sortable) {
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => this.handleSort(column));

            // Add sort indicator
            if (this.sortColumn === column) {
                th.textContent += this.sortAscending ? ' ↑' : ' ↓';
            }
        }

        return th;
    },

    createTableBody() {
        const tbody = document.createElement('tbody');

        // Sort results if needed
        const sortedResults = this.getSortedResults();

        // Calculate rankings based on F1 score (descending)
        const rankedResults = sortedResults.map((result, index) => ({
            ...result,
            rank: index + 1
        }));

        rankedResults.forEach((result, index) => {
            // Main row
            const tr = this.createTableRow(result, index);
            tbody.appendChild(tr);

            // Expandable detail row (hidden by default)
            const detailRow = this.createDetailRow(result, index);
            tbody.appendChild(detailRow);
        });

        return tbody;
    },

    createTableRow(result, index) {
        const tr = document.createElement('tr');
        tr.className = 'table-row';

        // Add ranking class for top 3
        if (result.rank === 1) {
            tr.classList.add('rank-1');
        } else if (result.rank === 2) {
            tr.classList.add('rank-2');
        } else if (result.rank === 3) {
            tr.classList.add('rank-3');
        }

        // Expand button
        const expandTd = document.createElement('td');
        const expandBtn = document.createElement('button');
        expandBtn.textContent = '+';
        expandBtn.className = 'expand-btn';
        expandBtn.dataset.index = index;
        expandBtn.addEventListener('click', () => this.toggleRowExpansion(index));
        expandTd.appendChild(expandBtn);
        tr.appendChild(expandTd);

        // Rank cell with medals
        const rankTd = document.createElement('td');
        rankTd.className = 'rank-cell';
        if (result.rank === 1) {
            rankTd.innerHTML = '<span class="rank-medal gold">🥇</span>';
            rankTd.title = 'Champion - Highest F1 Score';
        } else if (result.rank === 2) {
            rankTd.innerHTML = '<span class="rank-medal silver">🥈</span>';
            rankTd.title = '2nd Place';
        } else if (result.rank === 3) {
            rankTd.innerHTML = '<span class="rank-medal bronze">🥉</span>';
            rankTd.title = '3rd Place';
        } else {
            rankTd.textContent = result.rank;
        }
        tr.appendChild(rankTd);

        // Model name
        const modelTd = document.createElement('td');
        modelTd.textContent = result.model_name;
        modelTd.className = 'model-name';
        tr.appendChild(modelTd);

        const metrics = result.metrics;

        // Metrics columns (conditional) with tooltips
        if (this.visibleColumns.has('precision')) {
            tr.appendChild(MetricsUtils.createMetricCell(metrics.precision, 'precision', metrics));
        }
        if (this.visibleColumns.has('recall')) {
            tr.appendChild(MetricsUtils.createMetricCell(metrics.recall, 'recall', metrics));
        }
        if (this.visibleColumns.has('f1')) {
            tr.appendChild(MetricsUtils.createMetricCell(metrics.f1_score, 'f1_score', metrics));
        }
        if (this.visibleColumns.has('crr')) {
            tr.appendChild(MetricsUtils.createMetricCell(metrics.avg_crr, 'avg_crr', metrics));
        }
        if (this.visibleColumns.has('exact')) {
            const td = document.createElement('td');
            td.textContent = metrics.exact_matches;
            tr.appendChild(td);
        }

        return tr;
    },

    createDetailRow(result, index) {
        const tr = document.createElement('tr');
        tr.className = 'detail-row';
        tr.id = `detail-${index}`;
        tr.style.display = 'none';

        const td = document.createElement('td');
        td.colSpan = 99; // Span all columns

        const detailDiv = document.createElement('div');
        detailDiv.className = 'detail-content';

        // Create visualizations
        const vizContainer = document.createElement('div');
        vizContainer.className = 'visualization-section';

        // GT visualization
        const gtCol = document.createElement('div');
        gtCol.className = 'viz-column';
        gtCol.innerHTML = '<h4>Ground Truth (Annotated)</h4>';
        const gtViz = document.createElement('div');
        gtViz.className = 'text-viz';
        this.renderAnnotations(gtViz, result.gt_annotations, 'gt');
        gtCol.appendChild(gtViz);

        // OCR visualization
        const ocrCol = document.createElement('div');
        ocrCol.className = 'viz-column';
        ocrCol.innerHTML = '<h4>OCR Output (Annotated)</h4>';
        const ocrViz = document.createElement('div');
        ocrViz.className = 'text-viz';
        this.renderAnnotations(ocrViz, result.ocr_annotations, 'ocr');
        ocrCol.appendChild(ocrViz);

        vizContainer.appendChild(gtCol);
        vizContainer.appendChild(ocrCol);
        detailDiv.appendChild(vizContainer);

        td.appendChild(detailDiv);
        tr.appendChild(td);

        return tr;
    },

    renderAnnotations(container, annotations, panel) {
        container.innerHTML = '';

        annotations.forEach(annotation => {
            const span = document.createElement('span');
            span.textContent = annotation.word + ' ';

            // Apply CSS class based on match type
            if (annotation.match_type === 'exact') {
                span.className = 'word';
            } else {
                // All non-exact matches are shown as no-match (red)
                span.className = 'word no-match';
            }

            // Add data attributes for hover highlighting
            span.dataset.matchId = annotation.match_id || 'unmatched';
            span.dataset.matchType = annotation.match_type;
            span.dataset.panel = panel;

            container.appendChild(span);
        });
    },

    toggleRowExpansion(index) {
        const detailRow = document.getElementById(`detail-${index}`);
        const expandBtn = document.querySelector(`.expand-btn[data-index="${index}"]`);

        if (detailRow.style.display === 'none') {
            detailRow.style.display = 'table-row';
            expandBtn.textContent = '−';

            // Initialize hover highlighter for the newly shown visualizations
            if (typeof HoverHighlighter !== 'undefined') {
                // Use setTimeout to ensure DOM is fully updated
                setTimeout(() => {
                    HoverHighlighter.initialize();
                }, 0);
            }
        } else {
            detailRow.style.display = 'none';
            expandBtn.textContent = '+';
        }
    },

    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortAscending = !this.sortAscending;
        } else {
            this.sortColumn = column;
            this.sortAscending = true;
        }
        this.updateTable();
    },

    getSortedResults() {
        if (!this.sortColumn) {
            return this.results;
        }

        return [...this.results].sort((a, b) => {
            let valA, valB;

            if (this.sortColumn === 'model_name') {
                valA = a.model_name;
                valB = b.model_name;
            } else {
                valA = a.metrics[this.sortColumn] || 0;
                valB = b.metrics[this.sortColumn] || 0;
            }

            if (typeof valA === 'string') {
                return this.sortAscending
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            } else {
                return this.sortAscending
                    ? valA - valB
                    : valB - valA;
            }
        });
    },

    setupColumnToggles() {
        const toggles = document.querySelectorAll('.column-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const column = e.target.dataset.column;
                if (e.target.checked) {
                    this.visibleColumns.add(column);
                } else {
                    this.visibleColumns.delete(column);
                }
                this.updateTable();
            });
        });
    },

    setupCSVExport() {
        const exportBtn = document.getElementById('export-csv-btn');
        exportBtn.addEventListener('click', () => this.exportToCSV());
    },

    exportToCSV() {
        const headers = ['Model Name'];
        if (this.visibleColumns.has('precision')) headers.push('Precision');
        if (this.visibleColumns.has('recall')) headers.push('Recall');
        if (this.visibleColumns.has('f1')) headers.push('F1 Score');
        if (this.visibleColumns.has('crr')) headers.push('Avg CRR');
        if (this.visibleColumns.has('exact')) headers.push('Exact Matches');

        const rows = [headers];

        this.results.forEach(result => {
            const row = [result.model_name];
            const m = result.metrics;

            if (this.visibleColumns.has('precision')) row.push(Utils.formatPercentage(m.precision));
            if (this.visibleColumns.has('recall')) row.push(Utils.formatPercentage(m.recall));
            if (this.visibleColumns.has('f1')) row.push(Utils.formatPercentage(m.f1_score));
            if (this.visibleColumns.has('crr')) row.push(Utils.formatPercentage(m.avg_crr));
            if (this.visibleColumns.has('exact')) row.push(m.exact_matches);

            rows.push(row);
        });

        // Create CSV content
        const csvContent = rows.map(row => row.join(',')).join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ocr_metrics_comparison.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
};
