'use client';
import { useEffect } from 'react';

export const RADIUS_MAP: Record<string, string> = {
  sharp: '4px', rounded: '12px', pill: '20px',
};

export const FONT_MAP: Record<string, string> = {
  inter:    "'Inter', sans-serif",
  poppins:  "'Poppins', sans-serif",
  dmsans:   "'DM Sans', sans-serif",
  manrope:  "'Manrope', sans-serif",
  jakarta:  "'Plus Jakarta Sans', sans-serif",
  grotesk:  "'Space Grotesk', sans-serif",
};

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap';

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darken(hex: string, amt = 20) {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - amt);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - amt);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - amt);
  return `rgb(${r},${g},${b})`;
}

// Get storage key scoped to the logged-in user
export function getStorageKey(): string {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return `inspiratoria_ui_prefs_${u.id || 'default'}`;
  } catch { return 'inspiratoria_ui_prefs_default'; }
}

export function buildCSS(prefs: any): string {
  const a   = prefs.accent     || '#F5C800';
  const at  = prefs.accentText || '#0f0f0f';
  const rr  = RADIUS_MAP[prefs.radius  || 'rounded'] || '12px';
  const ff  = FONT_MAP[prefs.font || 'inter'] || FONT_MAP.inter;
  const dim = hexToRgba(a, 0.12);
  const brd = hexToRgba(a, 0.30);
  const dk  = darken(a, 20);
  const dp  = prefs.density === 'compact' ? '1.5rem' : prefs.density === 'spacious' ? '2.75rem' : '2rem';

  return `
    /* ── Inspiratoria UI Prefs ── */
    :root {
      --ui-accent: ${a};
      --ui-accent-text: ${at};
      --ui-accent-dim: ${dim};
      --ui-accent-border: ${brd};
      --ui-radius: ${rr};
      --ui-font: ${ff};
    }

    /* Typography */
    body, input, select, textarea, button { font-family: ${ff} !important; }

    /* ── SIDEBAR ── */
    /* Active bar */
    .bg-primary-500 { background-color: ${a} !important; }
    .text-primary-500 { color: ${a} !important; }
    /* Active row background */
    .from-primary-500\\/10 { --tw-gradient-from: ${hexToRgba(a, 0.1)} !important; }
    .to-primary-500\\/5   { --tw-gradient-to:   ${hexToRgba(a, 0.05)} !important; }
    .text-primary-600 { color: ${dk} !important; }
    /* Icon glow */
    .bg-primary-500\\/20 { background-color: ${hexToRgba(a, 0.2)} !important; }
    /* Sidebar active row */
    .bg-gradient-to-r.from-primary-500\\/10.to-primary-500\\/5 {
      background: linear-gradient(to right, ${hexToRgba(a, 0.1)}, ${hexToRgba(a, 0.05)}) !important;
    }

    /* ── DASHBOARD EYEBROWS ── */
    .d3-eyebrow::before, .acc-eyebrow::before, .bill-eyebrow::before,
    .config-eyebrow::before, .programs-eyebrow::before { background: ${a} !important; }
    .d3-eyebrow, .acc-eyebrow, .bill-eyebrow, .config-eyebrow,
    .programs-eyebrow { color: ${dk} !important; }

    /* ── KPI FEATURED CARD ── */
    .d3-kpi.featured {
      border-color: ${brd} !important;
      background: linear-gradient(145deg, ${hexToRgba(a, 0.07)}, ${hexToRgba(a, 0.12)}) !important;
    }
    .d3-kpi.featured::after { background: ${a} !important; }
    .d3-kpi.featured .d3-kpi-num { color: ${dk} !important; }
    .d3-kpi-chip.y { background: ${dim} !important; color: ${dk} !important; }

    /* ── QUICK LINKS ── */
    .d3-quick:hover .d3-quick-ico { background: ${a} !important; color: ${at} !important; }

    /* ── PLAN BAR ── */
    .d3-plan-bar { background: linear-gradient(90deg, ${a}, ${dk}) !important; }

    /* ── ACTIVITY DOTS ── */
    .d3-act-dot { background: ${a} !important; }

    /* ── AVATAR ── */
    .d3-avatar { background: #0f0f0f !important; color: ${a} !important; }

    /* ── BADGES ── */
    .acc-title-badge { background: ${dim} !important; color: ${dk} !important; border-color: ${brd} !important; }
    .d3-badge.plan { background: ${dim} !important; color: ${dk} !important; border-color: ${brd} !important; }

    /* ── BILLING FEATURED STAT ── */
    .bill-stat.featured {
      border-color: ${brd} !important;
      background: linear-gradient(145deg, ${hexToRgba(a, 0.06)}, ${hexToRgba(a, 0.1)}) !important;
    }
    .bill-stat.featured::after { background: ${a} !important; }

    /* ── ACTIVE TABS ── */
    .d3-tab.on, .config-tab.active, .bill-tab.active {
      background: #0f0f0f !important;
    }

    /* ── BORDER RADIUS ── */
    .d3-kpi, .d3-quick, .d3-card, .d3-widget,
    .section, .bill-card, .bill-stat,
    .acc-company-row { border-radius: ${rr} !important; }

    /* ── DENSITY PADDING ── */
    .d3-wrap, .acc-container, .config-container { padding: ${dp} !important; }
  `;
}

export function applyPrefs(prefs: any) {
  if (typeof document === 'undefined') return;

  // Inject Google Fonts once
  if (!document.getElementById('ui-google-fonts')) {
    const link = document.createElement('link');
    link.id = 'ui-google-fonts';
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }

  const css = buildCSS(prefs);
  let el = document.getElementById('inspiratoria-ui-prefs');
  if (!el) { el = document.createElement('style'); el.id = 'inspiratoria-ui-prefs'; document.head.appendChild(el); }
  el.textContent = css;
  document.body.dataset.density = prefs.density || 'normal';
}

export default function UIPrefsLoader() {
  useEffect(() => {
    try {
      const key = getStorageKey();
      const raw = localStorage.getItem(key);
      if (!raw) return;
      applyPrefs(JSON.parse(raw));
    } catch {}
  }, []);
  return null;
}
