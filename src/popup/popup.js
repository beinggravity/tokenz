import { loadSettings, saveSettings } from '../shared/settings.js';

const enabledEl = /** @type {HTMLInputElement} */ (document.getElementById('enabled'));
const ocrEl = /** @type {HTMLInputElement} */ (document.getElementById('ocrApiKey'));
const toggleLabel = document.getElementById('toggleLabel');
const statusPill = document.getElementById('statusPill');
const statusText = document.getElementById('statusText');

function reflectEnabled(on) {
  enabledEl.checked = on;
  toggleLabel.textContent = on ? 'On' : 'Off';
  statusPill?.classList.toggle('off', !on);
  if (statusText) statusText.textContent = on ? 'Active' : 'Paused';
}

loadSettings().then((s) => {
  reflectEnabled(s.enabled !== false);
  ocrEl.value = s.ocrApiKey || '';
});

enabledEl.addEventListener('change', () => {
  const on = enabledEl.checked;
  reflectEnabled(on);
  saveSettings({ enabled: on });
});

ocrEl.addEventListener('change', () => {
  saveSettings({ ocrApiKey: ocrEl.value.trim() });
});
