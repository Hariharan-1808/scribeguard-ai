/**
 * ScribeGuard AI - Main Application Logic
 * Integrates HybridAIRouter, PII Sanitizer, Document Presets, and Live Telemetry
 */

import { HybridAIRouter } from './firebase-config.js';

// Initialize Hybrid Router
const router = new HybridAIRouter();
let routingMode = 'auto'; // 'auto' | 'local' | 'cloud'
let latencyChartInstance = null;

// Document Templates
const documentPresets = {
  medical: `PATIENT CLINICAL CONSULTATION NOTE
Date: 14 November 2026
Patient: Robert H. Vance (DOB: 12/04/1982)
SSN: 489-22-9104
Email: robert.vance@healthcorp-secure.org
Phone: +1 (555) 392-8192
Attending Physician: Dr. Maya Lin, MD

CHIEF COMPLAINT & HISTORY:
Patient presents with chronic hypertension and intermittent chest palpitations following high-stress work cycles. Reports consistent medication adherence with Lisinopril 20mg daily. Recent lab panels indicate elevated resting blood pressure (148/92 mmHg).

CONFIDENTIAL CLINICAL ASSESSMENT:
1. Rule out secondary hypertensive causes and transient arrhythmia.
2. Order 48-hour continuous Holter monitor and echocardiogram.
3. Patient expressed extreme sensitivity regarding workplace disclosure; medical records must remain strictly confidential under HIPAA and must not leave the internal clinic premises.

DISPOSITION & IMMEDIATE ORDERS:
- Adjust Lisinopril to 30mg daily with AM dosing.
- Schedule follow-up telemetry review in 14 business days.
- Emergency precautions communicated; patient verbally verified understanding.`,

  legal: `CONFIDENTIAL M&A STRATEGIC ACQUISITION TERM SHEET
STRICTLY PRIVATE & CONFIDENTIAL - ATTORNEY-CLIENT PRIVILEGED
Date of Draft: November 2026
Target Entity: Project Horizon Technologies Inc.
Lead Acquirer Contact: Sarah Jenkins (sarah.jenkins@acq-partners.capital)
Direct Line: +1 (212) 849-0192
Acquisition Escrow Account: 4829-1928-3849-1092

1. TRANSACTION STRUCTURE & VALUATION:
The Acquirer proposes to acquire 100% of the issued and outstanding equity of the Target for an aggregate purchase consideration of $85,000,000 USD, payable 70% in cash and 30% in Class A restricted equity.

2. DUE DILIGENCE & RESTRICTIONS:
Target grants Acquirer a 45-day exclusive negotiating window. Both parties agree that any disclosure of this term sheet or proprietary financial metrics will result in liquidated damages of $5,000,000 USD.

3. GOVERNING LAW & JURISDICTION:
This agreement shall be governed by Delaware General Corporation Law. All disputes subject to binding arbitration under AAA rules in New York, NY.`,

  code: `CONFIDENTIAL TECHNICAL ARCHITECTURE & IP SPECIFICATION
Product: Project Aegis Autonomous Security Microkernel
Author: Alex Vance (alex.vance@aegis-security.internal)
Internal Hotline: +44 20 7946 0912
Access Token ID: 9942-8819-2019-3382

1. KERNEL SPECIFICATIONS:
The microkernel operates in Ring-0 hypervisor space with memory isolation across cryptographic enclaves. All inter-process communication (IPC) uses zero-copy shared memory with Blake3 hashing.

2. CRYPTOGRAPHIC PRIMITIVES:
Key exchanges utilize Kyber-768 post-quantum lattice cryptography. Hardware security module (HSM) seed keys are never persisted in unencrypted non-volatile storage.

3. INTELLECTUAL PROPERTY NOTICE:
This architecture represents unreleased trade secrets. Export or public internet transmission without explicit CISO cryptographic sign-off is strictly prohibited.`,

  custom: ``
};

// DOM References
const docEditor = document.getElementById('doc-editor');
const charCounter = document.getElementById('char-counter');
const wordCounter = document.getElementById('word-counter');
const tokenCounter = document.getElementById('token-counter');
const outputArea = document.getElementById('output-area');
const outputMetaBadge = document.getElementById('output-meta-badge');
const outputLatency = document.getElementById('output-latency');
const outputEngine = document.getElementById('output-engine');
const metricLocalTokens = document.getElementById('metric-local-tokens');
const metricPiiCount = document.getElementById('metric-pii-count');
const presetSelector = document.getElementById('preset-selector');

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
  loadPresetDocument();
  initLatencyChart();
  setupEditorListeners();
  updateMetricsDisplay();
});

// Setup Editor Input Listeners
function setupEditorListeners() {
  docEditor.addEventListener('input', () => {
    updateCounters();
  });
}

function updateCounters() {
  const text = docEditor.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const tokens = Math.round(chars / 4);

  charCounter.textContent = `${chars} chars`;
  wordCounter.textContent = `${words} words`;
  tokenCounter.textContent = `~${tokens} tokens`;
}

// Preset Loader
window.loadPresetDocument = function() {
  const selected = presetSelector.value;
  docEditor.value = documentPresets[selected] || '';
  updateCounters();
};

// Routing Mode Setter
window.setRoutingMode = function(mode) {
  routingMode = mode;
  ['auto', 'local', 'cloud'].forEach(m => {
    const btn = document.getElementById(`mode-${m}`);
    if (m === mode) {
      btn.className = 'px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold';
    } else {
      btn.className = 'px-2.5 py-1 rounded-lg text-gray-400 hover:text-white';
    }
  });

  const statusText = document.getElementById('status-text');
  if (mode === 'auto') {
    statusText.textContent = 'Auto Hybrid (On-Device + Cloud)';
  } else if (mode === 'local') {
    statusText.textContent = 'Forced On-Device (Gemini Nano)';
  } else {
    statusText.textContent = 'Forced Cloud (Firebase AI Logic)';
  }
};

// PII Redactor
window.runPIIRedaction = function() {
  const text = docEditor.value;
  if (!text.trim()) {
    alert('Please enter or select a document to redact.');
    return;
  }

  const result = router.sanitizePIILocally(text);
  docEditor.value = result.sanitizedText;
  updateCounters();
  updateMetricsDisplay();

  // Show status feedback
  outputMetaBadge.textContent = 'PII Redacted Locally';
  outputMetaBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20';
  outputEngine.textContent = 'On-Device Regex & Token Sanitizer';
  outputLatency.textContent = '12 ms';

  outputArea.innerHTML = `
    <div class="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/30 space-y-2">
      <div class="flex items-center gap-2 text-teal-300 font-bold">
        <i class="fa-solid fa-shield-halved"></i>
        <span>Local PII Sanitization Complete</span>
      </div>
      <p class="text-gray-300">
        Identified and redacted <strong>${result.detectionsCount} sensitive entities</strong> (emails, phone numbers, national IDs, and financial identifiers) directly in browser memory.
      </p>
      <div class="text-[11px] text-teal-400 font-mono">
        ✓ 100% Client-Side. No raw sensitive data was transmitted over the network.
      </div>
    </div>
  `;
};

// Trigger AI Actions
window.triggerAction = async function(actionType) {
  const text = docEditor.value;
  if (!text.trim()) {
    alert('Please enter or select a document first.');
    return;
  }

  // Display Loading State
  outputMetaBadge.textContent = 'Processing...';
  outputMetaBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 animate-pulse';
  outputArea.innerHTML = `
    <div class="flex flex-col items-center justify-center py-12 space-y-3 text-gray-400">
      <i class="fa-solid fa-circle-notch fa-spin text-2xl text-emerald-400"></i>
      <p class="text-xs">Executing Hybrid AI Inference...</p>
    </div>
  `;

  let prompt = '';
  if (actionType === 'summarize') {
    prompt = 'Generate a high-density, confidential executive summary highlighting primary obligations, risks, and clinical/legal requirements.';
  } else if (actionType === 'extract_action_items') {
    prompt = 'Extract all actionable tasks, compliance mandates, and immediate orders into a structured checklist.';
  } else if (actionType === 'deep_synthesis') {
    prompt = 'Perform a deep regulatory, structural, and cross-document risk audit with strategic mitigation steps.';
  }

  try {
    const response = await router.executePrompt({
      prompt: prompt,
      context: text,
      taskType: actionType,
      forceEngine: routingMode
    });

    // Render Output
    renderResponse(response);
    updateMetricsDisplay();
    updateChartData(response.latencyMs, response.isLocal);
  } catch (err) {
    console.error('Execution error:', err);
    outputArea.innerHTML = `<div class="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300">Execution error: ${err.message}</div>`;
  }
};

function renderResponse(res) {
  outputEngine.textContent = res.engine;
  outputLatency.textContent = `${res.latencyMs} ms`;

  if (res.isLocal) {
    outputMetaBadge.textContent = 'On-Device (Gemini Nano)';
    outputMetaBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';
  } else {
    outputMetaBadge.textContent = 'Firebase Cloud AI Logic';
    outputMetaBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20';
  }

  // Convert basic markdown to styled HTML
  let formatted = res.output
    .replace(/^### (.*$)/gim, '<h4 class="text-emerald-400 font-bold text-sm mt-2 mb-1">$1</h4>')
    .replace(/^#### (.*$)/gim, '<h5 class="text-gray-200 font-semibold text-xs mt-2 mb-1">$1</h5>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-gray-300">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-gray-300">$1</li>')
    .replace(/\n\n/gim, '<p class="my-1.5"></p>');

  let privacyNote = `
    <div class="mt-3 p-2.5 rounded-lg ${res.isLocal ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-400' : 'bg-cyan-950/30 border border-cyan-500/20 text-cyan-300'} text-[11px] font-mono">
      <i class="${res.isLocal ? 'fa-solid fa-lock' : 'fa-solid fa-cloud'} mr-1"></i>
      <span>${res.privacyStatus}</span>
      ${res.escalationReason ? `<div class="text-[10px] text-gray-400 mt-1">Escalation Trigger: ${res.escalationReason}</div>` : ''}
    </div>
  `;

  outputArea.innerHTML = formatted + privacyNote;
}

function updateMetricsDisplay() {
  metricLocalTokens.textContent = `${router.metrics.localTokensProcessed.toLocaleString()} tokens`;
  metricPiiCount.textContent = `${router.metrics.piiRedactedCount} entities`;
}

// Chart.js Latency Visualization
function initLatencyChart() {
  const ctx = document.getElementById('latencyChart').getContext('2d');
  latencyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['On-Device (Nano)', 'Cloud (Firebase AI)'],
      datasets: [{
        label: 'Latency (ms)',
        data: [22, 940],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(56, 189, 248, 0.7)'
        ],
        borderColor: [
          '#10b981',
          '#38bdf8'
        ],
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af', font: { size: 10 } }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#f3f4f6', font: { size: 10, weight: 'bold' } }
        }
      }
    }
  });
}

function updateChartData(latestLatency, isLocal) {
  if (!latencyChartInstance) return;
  if (isLocal) {
    latencyChartInstance.data.datasets[0].data[0] = latestLatency;
  } else {
    latencyChartInstance.data.datasets[0].data[1] = latestLatency;
  }
  latencyChartInstance.update();
}

// Copy Output
window.copyOutput = function() {
  const text = outputArea.innerText;
  navigator.clipboard.writeText(text);
  alert('Output copied to clipboard!');
};

// Architecture Modal
window.openArchitectureModal = function() {
  document.getElementById('arch-modal').classList.remove('hidden');
};
window.closeArchitectureModal = function() {
  document.getElementById('arch-modal').classList.add('hidden');
};

// Settings Modal
window.openSettingsModal = function() {
  document.getElementById('input-api-key').value = localStorage.getItem('scribeguard_gemini_key') || '';
  document.getElementById('settings-modal').classList.remove('hidden');
};
window.closeSettingsModal = function() {
  document.getElementById('settings-modal').classList.add('hidden');
};
window.saveSettings = function() {
  const key = document.getElementById('input-api-key').value.trim();
  if (key) {
    localStorage.setItem('scribeguard_gemini_key', key);
  }
  closeSettingsModal();
  alert('Settings saved successfully!');
};
