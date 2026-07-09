export const DEFAULT_SETTINGS = {
  enabled: true,
  ocrApiKey: '',
  sendCharLimit: 65000,
  pasteCharLimit: 10000,
};

export async function loadSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
}

export async function saveSettings(partial) {
  const next = { ...await loadSettings(), ...partial };
  await chrome.storage.local.set({ settings: next });
  return next;
}

/** MAIN-world intercept: not "off" = active until bootstrap confirms settings. */
export function syncEnabledToDom(enabled) {
  document.documentElement.setAttribute('data-tokenz', enabled ? 'on' : 'off');
}

export function isEnabledOnDom() {
  return document.documentElement.getAttribute('data-tokenz') !== 'off';
}
