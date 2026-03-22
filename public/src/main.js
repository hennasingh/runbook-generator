// Get DOM elements
const form = document.getElementById('problemForm');
const problemInput = document.getElementById('problemInput');
const generateBtn = document.getElementById('generateBtn');
const resultDiv = document.getElementById('result');
const resultContent = document.getElementById('resultContent');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const saveBtn = document.getElementById('saveBtn');

// Browse section DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const browseResults = document.getElementById('browseResults');
const browseLoading = document.getElementById('browseLoading');
const browseError = document.getElementById('browseError');
const noResults = document.getElementById('noResults');
const browsePagination = document.getElementById('browsePagination');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');

// Store current runbook data
let currentRunbook = null;

// Browse state
let browseState = {
    currentPage: 1,
    searchQuery: null,
    totalResults: 0,
    hasNext: false,
    hasPrev: false
};

// Initialize browse on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBrowseRunbooks(1);
});

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const problemDescription = problemInput.value.trim();
    
    if (!problemDescription) {
        showError('Please describe the problem');
        return;
    }

    await generateRunbook(problemDescription);
});

// Handle save button
saveBtn.addEventListener('click', async () => {
    if (!currentRunbook) {
        showError('No runbook to save');
        return;
    }

    await saveRunbook(currentRunbook);
});

// Browse and Search Event Listeners
searchBtn.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (!query) {
        showBrowseError('Please enter a search term');
        return;
    }
    browseState.searchQuery = query;
    browseState.currentPage = 1;
    await searchRunbooks(query, 1);
});

searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    browseState.searchQuery = null;
    browseState.currentPage = 1;
    clearSearchBtn.classList.add('hidden');
    loadBrowseRunbooks(1);
});

prevBtn.addEventListener('click', () => {
    if (browseState.currentPage > 1) {
        browseState.currentPage--;
        if (browseState.searchQuery) {
            searchRunbooks(browseState.searchQuery, browseState.currentPage);
        } else {
            loadBrowseRunbooks(browseState.currentPage);
        }
    }
});

nextBtn.addEventListener('click', () => {
    browseState.currentPage++;
    if (browseState.searchQuery) {
        searchRunbooks(browseState.searchQuery, browseState.currentPage);
    } else {
        loadBrowseRunbooks(browseState.currentPage);
    }
});

async function generateRunbook(problemDescription) {
    try {
        // Show loading, hide others
        loadingDiv.classList.remove('hidden');
        resultDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        generateBtn.disabled = true;

        // Call API
        const response = await fetch('/api/generateRunbook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ problemDescription })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate runbook');
        }

        const runbook = await response.json();
        currentRunbook = runbook; // Store for saving later
        displayRunbook(runbook);
        loadingDiv.classList.add('hidden');
        resultDiv.classList.remove('hidden');
        saveBtn.classList.remove('hidden');

    } catch (error) {
        showError(error.message);
        loadingDiv.classList.add('hidden');
    } finally {
        generateBtn.disabled = false;
    }
}

function displayRunbook(runbook) {
    resultContent.innerHTML = '';

    // Title
    if (runbook.title) {
        const titleSection = document.createElement('div');
        titleSection.className = 'runbook-section';
        titleSection.innerHTML = `<h3>Title</h3><p>${escapeHtml(runbook.title)}</p>`;
        resultContent.appendChild(titleSection);
    }

    // Summary
    if (runbook.summary) {
        const summarySection = document.createElement('div');
        summarySection.className = 'runbook-section';
        summarySection.innerHTML = `<h3>Problem Summary</h3><p>${escapeHtml(runbook.summary)}</p>`;
        resultContent.appendChild(summarySection);
    }

    // Affected Components
    if (runbook.affected_components && runbook.affected_components.length > 0) {
        const componentSection = document.createElement('div');
        componentSection.className = 'runbook-section';
        const items = runbook.affected_components.map(c => `<div class="array-item">${escapeHtml(c)}</div>`).join('');
        componentSection.innerHTML = `<h3>Affected Components</h3>${items}`;
        resultContent.appendChild(componentSection);
    }

    // Likely Causes
    if (runbook.likely_causes && runbook.likely_causes.length > 0) {
        const causesSection = document.createElement('div');
        causesSection.className = 'runbook-section';
        const items = runbook.likely_causes.map(c => `<div class="array-item">${escapeHtml(c)}</div>`).join('');
        causesSection.innerHTML = `<h3>Likely Causes</h3>${items}`;
        resultContent.appendChild(causesSection);
    }

    // Troubleshooting Steps
    if (runbook.steps && runbook.steps.length > 0) {
        const stepsSection = document.createElement('div');
        stepsSection.className = 'runbook-section';
        const items = runbook.steps.map((step, idx) => `<div class="array-item"><strong>Step ${idx + 1}:</strong> ${escapeHtml(step)}</div>`).join('');
        stepsSection.innerHTML = `<h3>Troubleshooting Steps</h3>${items}`;
        resultContent.appendChild(stepsSection);
    }

    // Escalation Criteria
    if (runbook.escalation_criteria && runbook.escalation_criteria.length > 0) {
        const escalationSection = document.createElement('div');
        escalationSection.className = 'runbook-section';
        const items = runbook.escalation_criteria.map(e => `<div class="array-item">${escapeHtml(e)}</div>`).join('');
        escalationSection.innerHTML = `<h3>Escalation Criteria</h3>${items}`;
        resultContent.appendChild(escalationSection);
    }
}
async function saveRunbook(runbook) {
    try {
        saveBtn.disabled = true;
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';

        const response = await fetch('/api/saveRunbook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(runbook)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save runbook');
        }

        const result = await response.json();
        
        // Show success message
        showSuccess(`✅ Runbook saved with ID: ${result.runbook.id}`);
        
        // Reset form
        problemInput.value = '';
        currentRunbook = null;
        resultDiv.classList.add('hidden');

    } catch (error) {
        showError(error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

function showError(message) {
    errorDiv.textContent = `❌ ${message}`;
    errorDiv.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    loadingDiv.classList.add('hidden');
}

function showSuccess(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.style.backgroundColor = '#e8f5e9';
    errorDiv.style.color = '#2e7d32';
    errorDiv.style.borderLeftColor = '#2e7d32';
    setTimeout(() => {
        errorDiv.classList.add('hidden');
        errorDiv.style.backgroundColor = '';
        errorDiv.style.color = '';
        errorDiv.style.borderLeftColor = '';
    }, 3000); // Hide after 3 seconds
    loadingDiv.classList.add('hidden');
}

// Browse & Search Functions
async function loadBrowseRunbooks(page) {
    try {
        browseLoading.classList.remove('hidden');
        browseResults.innerHTML = '';
        browseError.classList.add('hidden');
        noResults.classList.add('hidden');

        const response = await fetch(`/api/listRunbooks?page=${page}&limit=10`);
        if (!response.ok) {
            throw new Error('Failed to load runbooks');
        }

        const data = await response.json();
        browseState.currentPage = data.page;
        browseState.totalResults = data.total;
        browseState.hasNext = data.hasNext;
        browseState.hasPrev = data.hasPrev;

        if (data.runbooks.length === 0) {
            noResults.classList.remove('hidden');
            browsePagination.classList.add('hidden');
        } else {
            displayRunbookCards(data.runbooks, false);
            updatePaginationControls();
        }

        browseLoading.classList.add('hidden');

    } catch (error) {
        showBrowseError(error.message);
        browseLoading.classList.add('hidden');
    }
}

async function searchRunbooks(query, page) {
    try {
        browseLoading.classList.remove('hidden');
        browseResults.innerHTML = '';
        browseError.classList.add('hidden');
        noResults.classList.add('hidden');

        const response = await fetch(`/api/searchRunbooks?q=${encodeURIComponent(query)}&page=${page}&limit=10`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Search failed');
        }

        const data = await response.json();
        browseState.currentPage = data.page;
        browseState.totalResults = data.total;
        browseState.hasNext = data.hasNext;
        browseState.hasPrev = data.hasPrev;
        clearSearchBtn.classList.remove('hidden');

        if (data.runbooks.length === 0) {
            noResults.textContent = `📭 No runbooks found for "${query}"`;
            noResults.classList.remove('hidden');
            browsePagination.classList.add('hidden');
        } else {
            displayRunbookCards(data.runbooks, true);
            updatePaginationControls();
        }

        browseLoading.classList.add('hidden');

    } catch (error) {
        showBrowseError(error.message);
        browseLoading.classList.add('hidden');
    }
}

function displayRunbookCards(runbooks, isSearch) {
    browseResults.innerHTML = '';

    runbooks.forEach(runbook => {
        const card = document.createElement('div');
        card.className = 'runbook-card';
        card.dataset.id = runbook.id;

        // Format date
        const date = new Date(runbook.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${escapeHtml(runbook.title)}</div>
                <span class="card-expand-icon">›</span>
            </div>
            <p class="card-summary">${escapeHtml(runbook.summary || 'No description')}</p>
            <div class="card-date">${formattedDate}</div>
        `;

        card.addEventListener('click', () => {
            expandRunbookCard(runbook);
        });

        browseResults.appendChild(card);
    });
}

function expandRunbookCard(runbook) {
    // Check if already expanded
    const existingExpanded = browseResults.querySelector('.card-expanded');
    if (existingExpanded) {
        existingExpanded.remove();
    }

    const expandedView = document.createElement('div');
    expandedView.className = 'card-expanded';

    // Create full runbook display
    let content = `<h3>${escapeHtml(runbook.title)}</h3>`;

    // Summary
    if (runbook.summary) {
        content += `
            <div class="runbook-section">
                <h4>Problem Summary</h4>
                <p>${escapeHtml(runbook.summary)}</p>
            </div>
        `;
    }

    // Affected Components
    if (runbook.affected_components && runbook.affected_components.length > 0) {
        content += `<div class="runbook-section"><h4>Affected Components</h4>`;
        runbook.affected_components.forEach(item => {
            content += `<div class="array-item">${escapeHtml(item)}</div>`;
        });
        content += `</div>`;
    }

    // Likely Causes
    if (runbook.likely_causes && runbook.likely_causes.length > 0) {
        content += `<div class="runbook-section"><h4>Likely Causes</h4>`;
        runbook.likely_causes.forEach(item => {
            content += `<div class="array-item">${escapeHtml(item)}</div>`;
        });
        content += `</div>`;
    }

    // Troubleshooting Steps
    if (runbook.steps && runbook.steps.length > 0) {
        content += `<div class="runbook-section"><h4>Troubleshooting Steps</h4>`;
        runbook.steps.forEach((step, idx) => {
            content += `<div class="array-item"><strong>Step ${idx + 1}:</strong> ${escapeHtml(step)}</div>`;
        });
        content += `</div>`;
    }

    // Escalation Criteria
    if (runbook.escalation_criteria && runbook.escalation_criteria.length > 0) {
        content += `<div class="runbook-section"><h4>Escalation Criteria</h4>`;
        runbook.escalation_criteria.forEach(item => {
            content += `<div class="array-item">${escapeHtml(item)}</div>`;
        });
        content += `</div>`;
    }

    expandedView.innerHTML = content;

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-close-btn';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        expandedView.remove();
    });

    expandedView.appendChild(closeBtn);
    browseResults.appendChild(expandedView);
}

function updatePaginationControls() {
    if (browseState.totalResults === 0) {
        browsePagination.classList.add('hidden');
        return;
    }

    browsePagination.classList.remove('hidden');
    prevBtn.disabled = !browseState.hasPrev;
    nextBtn.disabled = !browseState.hasNext;
    pageInfo.textContent = `Page ${browseState.currentPage}`;
}

function showBrowseError(message) {
    browseError.textContent = `❌ ${message}`;
    browseError.classList.remove('hidden');
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}