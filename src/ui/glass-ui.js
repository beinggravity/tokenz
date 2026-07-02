import { PRODUCT_NAME, PRODUCT_TAGLINE } from '../shared/brand.js';

const STYLE_ID = 'tokenz-glass-styles';
const SPLASH_ID = 'tokenz-splash';
const STATUS_ID = 'tokenz-status';
const HUD_ID = 'tokenz-center-hud';

let hideTimer = null;
let hudLocked = false;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    .tokenz-glass {
      --tz-bg: rgba(14, 14, 22, 0.88);
      --tz-border: rgba(255, 255, 255, 0.12);
      --tz-text: rgba(255, 255, 255, 0.96);
      --tz-muted: rgba(255, 255, 255, 0.52);
      --tz-accent: #7c8cff;
      --tz-accent2: #b48cff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: var(--tz-text);
      pointer-events: none;
      letter-spacing: -0.01em;
    }

    #${SPLASH_ID} {
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      animation: tokenz-splash-in 0.4s ease;
    }
    #${SPLASH_ID} .tokenz-splash-card {
      background: var(--tz-bg);
      border: 1px solid var(--tz-border);
      border-radius: 24px;
      padding: 36px 40px 32px;
      min-width: min(360px, calc(100vw - 48px));
      max-width: 400px;
      text-align: center;
      box-shadow: 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06);
      backdrop-filter: blur(28px) saturate(160%);
      -webkit-backdrop-filter: blur(28px) saturate(160%);
    }
    #${SPLASH_ID} .tokenz-splash-logo {
      width: 64px; height: 64px; border-radius: 18px; margin: 0 auto 20px;
      background: linear-gradient(145deg, var(--tz-accent), var(--tz-accent2));
      display: grid; place-items: center;
      box-shadow: 0 12px 32px rgba(124, 140, 255, 0.4);
    }
    #${SPLASH_ID} .tokenz-splash-logo svg { width: 32px; height: 32px; }
    #${SPLASH_ID} .tokenz-splash-title {
      font-size: 22px; font-weight: 700; letter-spacing: -0.03em; margin-bottom: 6px;
    }
    #${SPLASH_ID} .tokenz-splash-sub {
      font-size: 13px; color: var(--tz-muted); line-height: 1.5; margin-bottom: 20px;
    }
    #${SPLASH_ID} .tokenz-splash-pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 16px; border-radius: 99px;
      background: rgba(124, 140, 255, 0.12);
      border: 1px solid rgba(124, 140, 255, 0.25);
      font-size: 12px; font-weight: 600; color: #a8b8ff;
    }
    #${SPLASH_ID} .tokenz-splash-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #6ee7a8; box-shadow: 0 0 10px rgba(110, 231, 168, 0.7);
      animation: tokenz-dot-pulse 1.8s ease infinite;
    }

    #${HUD_ID} {
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
    }
    #${HUD_ID} .tokenz-hud-card {
      background: var(--tz-bg);
      border: 1px solid var(--tz-border);
      border-radius: 22px;
      padding: 28px 32px 24px;
      width: min(340px, calc(100vw - 48px));
      text-align: center;
      box-shadow: 0 28px 70px rgba(0,0,0,0.5);
      backdrop-filter: blur(24px);
    }
    #${HUD_ID} .tokenz-ring-wrap {
      width: 72px; height: 72px; margin: 0 auto 16px;
    }
    #${HUD_ID} .tokenz-ring { width: 72px; height: 72px; transform: rotate(-90deg); }
    #${HUD_ID} .tokenz-ring-bg { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 5; }
    #${HUD_ID} .tokenz-ring-fg {
      fill: none; stroke: url(#tokenz-grad); stroke-width: 5; stroke-linecap: round;
      transition: stroke-dashoffset 0.35s ease;
    }
    #${HUD_ID} .tokenz-hud-title { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
    #${HUD_ID} .tokenz-hud-detail { font-size: 12px; color: var(--tz-muted); line-height: 1.5; }

    #${STATUS_ID} {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      z-index: 2147483646;
      background: var(--tz-bg);
      border: 1px solid var(--tz-border);
      border-radius: 14px;
      padding: 12px 18px;
      min-width: 200px; text-align: center;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
      backdrop-filter: blur(20px);
      animation: tokenz-toast-in 0.3s ease;
    }
    #${STATUS_ID} .tokenz-status-title { font-size: 13px; font-weight: 600; }
    #${STATUS_ID} .tokenz-status-detail { font-size: 11px; color: var(--tz-muted); margin-top: 4px; }

    @keyframes tokenz-splash-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes tokenz-splash-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes tokenz-dot-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.85); }
    }
    @keyframes tokenz-toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `;
  document.documentElement.appendChild(s);
}

const MARK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M7 8h10M7 12h7M6 4h8l4 4v12a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1z"/></svg>`;

function ringSvg(progress, uid) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, progress ?? 0));
  const offset = c - (pct / 100) * c;
  const gradId = `tokenz-grad-${uid}`;
  return `
    <svg class="tokenz-ring" viewBox="0 0 72 72">
      <defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#7c8cff"/>
          <stop offset="100%" stop-color="#b48cff"/>
        </linearGradient>
      </defs>
      <circle class="tokenz-ring-bg" cx="36" cy="36" r="${r}"/>
      <circle class="tokenz-ring-fg" cx="36" cy="36" r="${r}" stroke="url(#${gradId})"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>
    </svg>`;
}

let ringUid = 0;

function removeSplash() {
  document.getElementById(SPLASH_ID)?.remove();
}

export function showActiveBadge() {
  ensureStyles();
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', showActiveBadge, { once: true });
    return;
  }
  if (document.getElementById(SPLASH_ID) || document.getElementById(HUD_ID)) return;

  const splash = document.createElement('div');
  splash.id = SPLASH_ID;
  splash.className = 'tokenz-glass';
  splash.innerHTML = `
    <div class="tokenz-splash-card">
      <div class="tokenz-splash-logo">${MARK_SVG}</div>
      <div class="tokenz-splash-title">${PRODUCT_NAME}</div>
      <div class="tokenz-splash-sub">${PRODUCT_TAGLINE}</div>
      <div class="tokenz-splash-pill"><span class="tokenz-splash-dot"></span>Active on this page</div>
    </div>`;
  document.body.appendChild(splash);

  setTimeout(() => {
    splash.style.animation = 'tokenz-splash-out 0.5s ease forwards';
    setTimeout(() => splash.remove(), 500);
  }, 2400);
}

export function lockHud() {
  hudLocked = true;
  clearTimeout(hideTimer);
}

export function unlockHud() {
  hudLocked = false;
}

export function hideActiveIndicators() {
  if (hudLocked) return;
  removeSplash();
  document.getElementById(HUD_ID)?.remove();
}

function showCenterHud(title, detail, progress, variant) {
  ensureStyles();
  removeSplash();
  document.getElementById(STATUS_ID)?.remove();

  let hud = document.getElementById(HUD_ID);
  if (!hud) {
    hud = document.createElement('div');
    hud.id = HUD_ID;
    hud.setAttribute('role', 'status');
    document.body.appendChild(hud);
  }

  const uid = ++ringUid;
  const icon = variant === 'success' ? '✓' : variant === 'error' ? '×' : null;
  const ring = progress != null
    ? `<div class="tokenz-ring-wrap">${ringSvg(progress, uid)}</div>`
    : `<div class="tokenz-ring-wrap" style="font-size:36px;line-height:72px;color:#a8b8ff">${icon || '◌'}</div>`;

  hud.innerHTML = `
    <div class="tokenz-hud-card tokenz-glass">
      ${ring}
      <div class="tokenz-hud-title">${escapeHtml(title)}</div>
      ${detail ? `<div class="tokenz-hud-detail">${escapeHtml(detail)}</div>` : ''}
    </div>`;
  hud.dataset.v = variant || 'info';
}

export function setStatus(title, variant = 'info', opts = {}) {
  if (opts.lock) hudLocked = true;
  if (opts.unlock) hudLocked = false;
  clearTimeout(hideTimer);

  if (opts.center || opts.progress != null || hudLocked) {
    showCenterHud(title, opts.detail, opts.progress, variant);
    if (!hudLocked && !opts.persist && variant !== 'error') {
      hideTimer = setTimeout(() => document.getElementById(HUD_ID)?.remove(), variant === 'success' ? 3500 : 5500);
    }
    return;
  }

  ensureStyles();
  document.getElementById(HUD_ID)?.remove();

  let el = document.getElementById(STATUS_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = STATUS_ID;
    el.className = 'tokenz-glass';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }

  el.innerHTML = `
    <div class="tokenz-status-title">${escapeHtml(title)}</div>
    ${opts.detail ? `<div class="tokenz-status-detail">${escapeHtml(opts.detail)}</div>` : ''}`;
  el.dataset.v = variant;

  if (!opts.persist && variant !== 'error') {
    hideTimer = setTimeout(() => el.remove(), 4000);
  }
}

export function clearStatus() {
  hudLocked = false;
  clearTimeout(hideTimer);
  document.getElementById(HUD_ID)?.remove();
  document.getElementById(STATUS_ID)?.remove();
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
