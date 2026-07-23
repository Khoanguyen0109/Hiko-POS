export const V2_UI_STORAGE_KEY = 'hiko.features.v2Ui';

export function isV2UiEnabled() {
  try {
    const value = localStorage.getItem(V2_UI_STORAGE_KEY);
    if (value === null) return true;
    return value === 'true';
  } catch {
    return true;
  }
}

export function setV2UiEnabled(enabled) {
  try {
    localStorage.setItem(V2_UI_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore quota/private mode
  }
}
