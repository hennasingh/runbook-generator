// Get DOM elements
const form = document.getElementById('problemForm');
const problemInput = document.getElementById('problemInput');
const generateBtn = document.getElementById('generateBtn');
const resultDiv = document.getElementById('result');
const resultContent = document.getElementById('resultContent');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const saveBtn = document.getElementById('saveBtn');

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

function showError(message) {
    errorDiv.textContent = `❌ ${message}`;
    errorDiv.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    loadingDiv.classList.add('hidden');
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