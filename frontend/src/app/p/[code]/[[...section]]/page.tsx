'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

// ============================================================================
// CONSTANTS
// ============================================================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

const ROLE_LABELS: Record<string, string> = {
  facilitator: 'Facilitador', mentor: 'Mentor', mentee: 'Mentee',
  participant_cell: 'Participante célula', participant: 'Participante', facilitator_internal: 'Facilitador',
  administrator: 'Admin (legacy)', instructor: 'Instructor (legacy)', observer: 'Observador (legacy)',
};

const THEME_GRADIENTS: Record<string, string> = {
  leadership: 'linear-gradient(135deg, #0c4a6e 0%, #0e7490 30%, #0891b2 60%, #06b6d4 100%)',
  innovation: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 30%, #0284c7 60%, #0ea5e9 100%)',
  diversity: 'linear-gradient(135deg, #134e4a 0%, #0f766e 30%, #0d9488 60%, #14b8a6 100%)',
  onboarding: 'linear-gradient(135deg, #064e3b 0%, #047857 30%, #059669 60%, #10b981 100%)',
  technical: 'linear-gradient(135deg, #0c4a6e 0%, #075985 30%, #0369a1 60%, #0284c7 100%)',
  General: 'linear-gradient(135deg, #164e63 0%, #155e75 30%, #0e7490 60%, #0891b2 100%)',
};

const LABELS = {
  status: { designed: 'Diseñado', active: 'Activo', matching: 'En matching', running: 'En ejecución', completed: 'Completado', closed: 'Cerrado', draft: 'Borrador', ready_for_execution: 'Listo', in_execution: 'En ejecución', under_review: 'En revisión', created: 'Creada' } as Record<string, string>,
  theme: { leadership: 'Liderazgo', innovation: 'Innovación', diversity: 'Diversidad', onboarding: 'Onboarding', technical: 'Técnico', General: 'General' } as Record<string, string>,
  actType: { training: 'Formación', event: 'Evento', exercise: 'Ejercicio', workshop: 'Taller', session: 'Sesión', assessment: 'Evaluación' } as Record<string, string>,
  actCategory: { mentoria: 'Mentoría', liderazgo: 'Liderazgo', tecnico: 'Técnico', general: 'General' } as Record<string, string>,
  targetRole: { both: 'Todos', mentor: 'Mentor', mentee: 'Mentee' } as Record<string, string>,
  modality: { online: 'Online', presencial: 'Presencial', hibrido: 'Híbrido' } as Record<string, string>,
};

const SIDEBAR_W_COLLAPSED = 72;
const SIDEBAR_W_EXPANDED = 264;

// ============================================================================
// STYLES — Participant-only teal theme
// ============================================================================
const styles = `
  * { box-sizing: border-box; }
  .p-layout { display: flex; min-height: 100vh; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

  /* ═══ Sidebar ═══ */
  .p-sidebar {
    width: ${SIDEBAR_W_COLLAPSED}px;
    background: linear-gradient(180deg, #0c1929 0%, #0f2744 40%, #0a1628 100%);
    display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 40;
    transition: width 0.28s cubic-bezier(0.4,0,0.2,1); overflow: hidden;
    box-shadow: 4px 0 24px rgba(0,0,0,0.15);
  }
  .p-sidebar::before {
    content: ''; position: absolute; inset: 0; opacity: 0.03; pointer-events: none;
    background-image: radial-gradient(circle at 20% 50%, rgba(6,182,212,0.4) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(34,211,153,0.3) 0%, transparent 50%);
  }
  .p-sidebar.expanded { width: ${SIDEBAR_W_EXPANDED}px; }

  .p-sidebar-header { padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; gap: 0; min-height: 64px; position: relative; z-index: 1; }
  .p-sidebar.expanded .p-sidebar-header { justify-content: flex-start; gap: 12px; }
  .p-sidebar-logo-img { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; filter: brightness(1.1); }
  .p-sidebar-logo-text { font-size: 1.05rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; white-space: nowrap; display: none; }
  .p-sidebar.expanded .p-sidebar-logo-text { display: inline; }

  /* Program card in sidebar */
  .p-program-card {
    margin: 4px 10px 8px; padding: 10px 12px; border-radius: 10px;
    background: linear-gradient(135deg, rgba(6,182,212,0.12), rgba(34,211,153,0.08));
    border: 1px solid rgba(6,182,212,0.18);
    opacity: 0; max-height: 0; overflow: hidden; transition: all 0.25s;
  }
  .p-sidebar.expanded .p-program-card { opacity: 1; max-height: 100px; }
  .p-program-card-name { font-size: 0.72rem; font-weight: 700; color: #e0f2fe; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
  .p-program-card-meta { font-size: 0.62rem; color: rgba(255,255,255,0.45); display: flex; gap: 8px; }

  /* Nav */
  .p-nav { flex: 1; padding: 8px; overflow-y: auto; overflow-x: hidden; position: relative; z-index: 1; }
  .p-nav::-webkit-scrollbar { width: 3px; }
  .p-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  .p-nav-section { margin-bottom: 12px; }
  .p-nav-section-title { font-size: 0.6rem; font-weight: 700; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.1em; padding: 0 8px; margin-bottom: 6px; white-space: nowrap; overflow: hidden; opacity: 0; height: 0; transition: opacity 0.2s, height 0.2s; }
  .p-sidebar.expanded .p-nav-section-title { opacity: 1; height: auto; margin-bottom: 6px; }

  .p-nav-item { display: flex; align-items: center; justify-content: center; gap: 0; padding: 10px 0; border-radius: 10px; cursor: pointer; font-size: 0.82rem; font-weight: 500; color: rgba(255,255,255,0.55); transition: all 0.18s; border: none; background: none; width: 100%; text-align: left; position: relative; white-space: nowrap; }
  .p-sidebar.expanded .p-nav-item { justify-content: flex-start; padding: 10px 14px; gap: 12px; }
  .p-nav-item:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.95); }
  .p-nav-item.active { background: rgba(6,182,212,0.15); color: #fff; font-weight: 600; }
  .p-nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 24px; background: #22d3ee; border-radius: 0 4px 4px 0; }
  .p-nav-item .nav-icon { width: 22px; height: 22px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: filter 0.18s; color: inherit; }
  .p-nav-item.active .nav-icon { filter: drop-shadow(0 0 6px rgba(34,211,153,0.4)); color: #67e8f9; }
  .p-nav-item .nav-icon svg { width: 20px; height: 20px; stroke: currentColor; }
  .p-nav-label { display: none; }
  .p-sidebar.expanded .p-nav-label { display: inline; }
  .p-nav-count { display: none; }
  .p-sidebar.expanded .p-nav-count { display: inline-block; margin-left: auto; font-size: 0.65rem; font-weight: 700; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); padding: 2px 8px; border-radius: 10px; }
  .p-nav-item.active .p-nav-count { background: rgba(6,182,212,0.2); color: #67e8f9; }

  /* Tooltip on collapsed */
  .p-nav-item .nav-tooltip { position: absolute; left: 68px; top: 50%; transform: translateY(-50%); background: #0c4a6e; color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 100; }
  .p-nav-item .nav-tooltip::before { content: ''; position: absolute; left: -4px; top: 50%; transform: translateY(-50%) rotate(45deg); width: 8px; height: 8px; background: #0c4a6e; }
  .p-sidebar:not(.expanded) .p-nav-item:hover .nav-tooltip { opacity: 1; }

  .p-sidebar-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,0.06); position: relative; z-index: 1; }
  .p-user-card { display: flex; align-items: center; justify-content: center; gap: 0; padding: 8px; border-radius: 10px; transition: background 0.15s; }
  .p-sidebar.expanded .p-user-card { justify-content: flex-start; gap: 10px; }
  .p-user-card:hover { background: rgba(255,255,255,0.04); }
  .p-user-avatar { width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #0891b2, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 0.82rem; font-weight: 800; color: #fff; flex-shrink: 0; box-shadow: 0 2px 8px rgba(6,182,212,0.3); }
  .p-user-info { display: none; }
  .p-sidebar.expanded .p-user-info { display: block; }
  .p-user-name { font-size: 0.8rem; font-weight: 600; color: #fff; white-space: nowrap; }
  .p-user-role { font-size: 0.65rem; color: rgba(255,255,255,0.4); white-space: nowrap; }
  .p-user-online { position: absolute; bottom: -1px; right: -1px; width: 10px; height: 10px; border-radius: 50%; background: #22c55e; border: 2px solid #0a1628; }

  /* Support button */
  .p-support-btn { display: flex; align-items: center; justify-content: center; gap: 0; padding: 10px 0; border-radius: 10px; cursor: pointer; font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.55); transition: all 0.18s; border: none; background: none; width: 100%; text-align: left; white-space: nowrap; }
  .p-sidebar.expanded .p-support-btn { justify-content: flex-start; padding: 10px 14px; gap: 10px; }
  .p-support-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.95); }
  .p-support-btn .nav-icon { width: 22px; height: 22px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: inherit; }
  .p-support-btn .nav-icon svg { width: 20px; height: 20px; stroke: currentColor; }
  .p-support-label { display: none; }
  .p-sidebar.expanded .p-support-label { display: inline; }

  /* Logout button */
  .p-logout-btn { display: flex; align-items: center; justify-content: center; gap: 0; padding: 8px 0; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 500; color: rgba(255,255,255,0.35); transition: all 0.18s; border: none; background: none; width: 100%; white-space: nowrap; margin-top: 6px; }
  .p-sidebar.expanded .p-logout-btn { justify-content: flex-start; padding: 8px 14px; gap: 10px; }
  .p-logout-btn:hover { background: rgba(239,68,68,0.1); color: #fca5a5; }
  .p-logout-label { display: none; }
  .p-sidebar.expanded .p-logout-label { display: inline; }

  /* ═══ Topbar ═══ */
  .p-topbar { position: fixed; top: 0; left: ${SIDEBAR_W_COLLAPSED}px; right: 0; height: 64px; background: #fff; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; z-index: 30; transition: left 0.28s cubic-bezier(0.4,0,0.2,1); }
  .p-sidebar.expanded ~ .p-topbar { left: ${SIDEBAR_W_EXPANDED}px; }
  .p-topbar-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .p-topbar-home { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #9ca3af; cursor: pointer; display: flex; align-items: center; transition: all 0.15s; }
  .p-topbar-home:hover { background: #f3f4f6; color: #374151; }
  .p-topbar-sep { color: #d1d5db; font-size: 0.7rem; flex-shrink: 0; }
  .p-topbar-crumb { font-size: 0.82rem; font-weight: 500; color: #6b7280; cursor: pointer; background: none; border: none; padding: 4px 6px; border-radius: 6px; transition: color 0.15s; white-space: nowrap; }
  .p-topbar-crumb:hover { color: #111827; }
  .p-topbar-crumb.current { font-weight: 600; color: #111827; cursor: default; }
  .p-topbar-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .p-topbar-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; }
  .p-topbar-badge-role { background: #dbeafe; color: #2563eb; }
  .p-topbar-badge-portal { background: #f3f4f6; color: #6b7280; font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.02em; }
  .p-topbar-user { font-size: 0.82rem; font-weight: 600; color: #111827; white-space: nowrap; }
  .p-topbar-id { font-size: 0.7rem; color: #9ca3af; white-space: nowrap; }
  .p-topbar-time { font-size: 0.7rem; color: #9ca3af; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .p-topbar-divider { width: 1px; height: 32px; background: #e5e7eb; }
  .p-topbar-logout { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #9ca3af; cursor: pointer; display: flex; align-items: center; transition: all 0.15s; }
  .p-topbar-logout:hover { background: #fef2f2; color: #ef4444; }

  /* ═══ Main ═══ */
  .p-main { margin-left: ${SIDEBAR_W_COLLAPSED}px; margin-top: 64px; padding: 32px 32px 64px; flex: 1; background: #fafafa; transition: all 0.28s cubic-bezier(0.4,0,0.2,1); }
  .p-sidebar.expanded ~ .p-topbar ~ .p-main,
  .p-sidebar.expanded ~ .p-main { margin-left: ${SIDEBAR_W_EXPANDED}px; }

  /* Dashboard */
  .dash-header { margin-bottom: 20px; }
  .dash-title { font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0 0 4px; letter-spacing: -0.02em; }
  .dash-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0; }

  /* Stats */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .stat-card { background: #fff; border-radius: 16px; padding: 18px 16px; border: 1px solid #f0f0f0; position: relative; overflow: hidden; transition: all 0.2s ease; }
  .stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
  .stat-card-stripe { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .stat-label { font-size: 0.72rem; font-weight: 500; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: #111827; letter-spacing: -0.02em; }
  .stat-change { font-size: 0.7rem; color: #9ca3af; margin-top: 4px; }

  /* Section card */
  .pd-section { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; margin-bottom: 20px; overflow: hidden; transition: box-shadow 0.2s; }
  .pd-section:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
  .pd-section-head { padding: 18px 22px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
  .pd-section-title { font-size: 0.92rem; font-weight: 700; color: #111827; }
  .pd-section-body { padding: 18px 22px; }

  /* Settings */
  .settings-section { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; margin-bottom: 14px; overflow: hidden; }
  .settings-section-title { font-size: 0.82rem; font-weight: 600; color: #111827; padding: 14px 16px; border-bottom: 1px solid #f3f4f6; }
  .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
  .settings-row:last-child { border-bottom: none; }
  .settings-label { font-size: 0.82rem; font-weight: 500; color: #374151; }
  .settings-value { font-size: 0.82rem; color: #6b7280; }

  .empty-state { text-align: center; padding: 48px; color: #6b7280; }

  /* Badges */
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; white-space: nowrap; }
  .badge-active { background: #d1fae5; color: #065f46; }
  .badge-draft { background: #f3f4f6; color: #6b7280; }
  .badge-completed { background: #dbeafe; color: #1e40af; }

  /* Data table */
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #eaedf2; }
  .data-table td { font-size: 0.8rem; color: #374151; padding: 12px 14px; border-bottom: 1px solid #f5f5f5; }
  .data-table tr:hover td { background: #fafbfc; }
  .data-table tr:last-child td { border-bottom: none; }

  /* ═══ Program Detail ═══ */
  .pd-wrapper { background: #fafafa; min-height: calc(100vh - 64px); width: 100%; }
  .pd-hero { position: relative; overflow: hidden; padding: 0; width: 100%; }
  .pd-hero-bg { position: absolute; inset: 0; z-index: 0; }
  .pd-hero-inner { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 40px 36px 32px; }
  .pd-back { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.7); font-size: 0.78rem; font-weight: 500; cursor: pointer; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 6px 14px; backdrop-filter: blur(8px); transition: all 0.2s; }
  .pd-back:hover { background: rgba(255,255,255,0.2); color: #fff; }
  .pd-hero-title { font-size: 2rem; font-weight: 800; color: #fff; letter-spacing: -0.03em; margin: 16px 0 8px; line-height: 1.15; }
  .pd-hero-desc { font-size: 0.95rem; color: rgba(255,255,255,0.8); max-width: 600px; line-height: 1.6; }
  .pd-hero-meta { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px; }
  .pd-hero-meta-item { display: flex; flex-direction: column; gap: 2px; }
  .pd-hero-meta-label { font-size: 0.68rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
  .pd-hero-meta-value { font-size: 1rem; font-weight: 700; color: #fff; }
  .pd-hero-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
  .pd-pill { padding: 5px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; backdrop-filter: blur(10px); }
  .pd-pill-theme { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
  .pd-pill-status { border: 1px solid rgba(255,255,255,0.2); }
  .pd-bubble { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.06); z-index: 1; }
  .pd-bubble-1 { width: 300px; height: 300px; top: -80px; right: -40px; animation: pd-float 8s ease-in-out infinite; }
  .pd-bubble-2 { width: 200px; height: 200px; bottom: -60px; left: 10%; animation: pd-float 12s ease-in-out infinite reverse; }
  .pd-bubble-3 { width: 150px; height: 150px; top: 30%; right: 20%; animation: pd-float 10s ease-in-out infinite 2s; background: rgba(255,255,255,0.04); }
  .pd-bubble-4 { width: 80px; height: 80px; bottom: 20px; right: 35%; animation: pd-float 7s ease-in-out infinite 1s; background: rgba(255,255,255,0.08); }
  .pd-bubble-5 { width: 120px; height: 120px; top: 10px; left: 30%; animation: pd-float 9s ease-in-out infinite 3s; background: rgba(255,255,255,0.03); }
  @keyframes pd-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
  .pd-tabs { max-width: 1200px; margin: 0 auto; padding: 0 36px; }
  .pd-tabs-bar { display: flex; gap: 4px; background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); border-radius: 14px; padding: 5px; border: 1px solid rgba(6,182,212,0.08); margin-top: -24px; position: relative; z-index: 10; box-shadow: 0 4px 24px rgba(6,182,212,0.08); }
  .pd-tab { flex: 1; padding: 11px 8px; font-size: 0.8rem; font-weight: 500; color: #6b7280; cursor: pointer; border: none; background: transparent; border-radius: 10px; transition: all 0.2s; text-align: center; }
  .pd-tab:hover { color: #374151; background: rgba(6,182,212,0.04); }
  .pd-tab.active { background: #fff; color: #0891b2; font-weight: 700; box-shadow: 0 2px 8px rgba(6,182,212,0.1); }
  .pd-content { max-width: 1200px; margin: 0 auto; padding: 28px 36px 60px; }
  .pd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .pd-stat { background: #fff; border-radius: 16px; padding: 20px; border: 1px solid #f0f0f0; position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
  .pd-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
  .pd-stat-accent { position: absolute; top: 0; left: 0; width: 4px; height: 100%; border-radius: 4px 0 0 4px; }
  .pd-stat-label { font-size: 0.72rem; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .pd-stat-val { font-size: 1.8rem; font-weight: 800; color: #111827; letter-spacing: -0.03em; line-height: 1; }
  .pd-stat-sub { font-size: 0.72rem; color: #9ca3af; margin-top: 6px; }
  .pd-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
  .pd-info-item { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; }
  .pd-info-item:nth-child(3n) { border-right: none; }
  .pd-info-label { font-size: 0.68rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; font-weight: 600; }
  .pd-info-val { font-size: 0.88rem; font-weight: 600; color: #111827; }
  .pd-tag { padding: 5px 14px; background: #f3f4f6; border-radius: 20px; font-size: 0.75rem; color: #374151; font-weight: 600; border: 1px solid #e5e7eb; }
  .pd-req { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; overflow: hidden; }
  .pd-req-head { padding: 14px 20px; background: #fafafa; border-bottom: 1px solid #f3f4f6; font-size: 0.82rem; font-weight: 700; color: #374151; }
  .pd-req-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid #f5f5f5; font-size: 0.82rem; }
  .pd-req-row:last-child { border-bottom: none; }
  .pd-req-label { color: #6b7280; font-weight: 500; }
  .pd-req-val { color: #111827; font-weight: 600; }
  .pd-mod { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; overflow: hidden; transition: all 0.2s; }
  .pd-mod:hover { border-color: #e0e0e0; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
  .pd-mod-head { display: flex; align-items: center; gap: 16px; padding: 18px 22px; cursor: pointer; transition: background 0.15s; }
  .pd-mod-head:hover { background: #f0fdfa; }
  .pd-mod-num { width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #0891b2, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; color: #fff; flex-shrink: 0; }
  .pd-mod-info { flex: 1; }
  .pd-mod-name { font-size: 0.92rem; font-weight: 700; color: #111827; }
  .pd-mod-meta { display: flex; gap: 14px; font-size: 0.72rem; color: #6b7280; margin-top: 3px; }
  .pd-mod-meta span { display: inline-flex; align-items: center; gap: 4px; }
  .pd-mod-toggle { font-size: 0.78rem; color: #9ca3af; padding: 4px 8px; border-radius: 6px; transition: all 0.2s; }
  .pd-mod-head:hover .pd-mod-toggle { background: #f3f4f6; color: #374151; }
  .pd-mod-body { border-top: 1px solid #f3f4f6; padding: 20px 22px; background: #fafafa; }
  .pd-res { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #fff; border-radius: 10px; border: 1px solid #f0f0f0; transition: border-color 0.2s; }
  .pd-res:hover { border-color: #e0e0e0; }
  .pd-res-type { padding: 3px 10px; border-radius: 6px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  .pd-res-name { flex: 1; font-size: 0.82rem; font-weight: 500; color: #1f2937; }
  .pd-res-link { font-size: 0.72rem; color: #1a1a1a; font-weight: 600; text-decoration: none; padding: 4px 10px; border-radius: 6px; transition: background 0.15s; }
  .pd-res-link:hover { background: #f3f4f6; }
  .pd-ms { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; padding: 20px 22px; transition: all 0.2s; position: relative; }
  .pd-ms:hover { border-color: #e0e0e0; box-shadow: 0 4px 20px rgba(0,0,0,0.04); transform: translateY(-1px); }
  .pd-ms-week { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #0891b2, #06b6d4); display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
  .pd-ms-wk-label { font-size: 0.58rem; color: rgba(255,255,255,0.8); font-weight: 600; text-transform: uppercase; }
  .pd-ms-wk-num { font-size: 1.2rem; font-weight: 800; color: #fff; line-height: 1; }
  .pd-ms-title { font-size: 0.92rem; font-weight: 700; color: #111827; margin-bottom: 6px; }
  .pd-ms-desc { font-size: 0.82rem; color: #4b5563; line-height: 1.6; margin-bottom: 8px; }
  .pd-ms-deliverable { font-size: 0.78rem; padding: 8px 14px; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border: 1px solid #bbf7d0; border-radius: 10px; color: #166534; font-weight: 500; }
  .pd-section-count { font-size: 0.72rem; font-weight: 600; color: #374151; background: #f3f4f6; padding: 3px 10px; border-radius: 12px; }

  /* ═══ Progress Page ═══ */
  .prg-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .prg-header-left h2 { font-size: 1.2rem; font-weight: 800; color: #111827; margin: 0 0 4px; letter-spacing: -0.02em; }
  .prg-header-left p { font-size: 0.82rem; color: #6b7280; margin: 0; }

  .prg-overall { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; padding: 24px; margin-bottom: 24px; }
  .prg-overall-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .prg-overall-label { font-size: 0.82rem; font-weight: 600; color: #374151; }
  .prg-overall-pct { font-size: 1.6rem; font-weight: 800; color: #111827; letter-spacing: -0.03em; }
  .prg-bar-track { height: 12px; background: #f3f4f6; border-radius: 99px; overflow: hidden; position: relative; }
  .prg-bar-fill { height: 100%; border-radius: 99px; transition: width 1.2s cubic-bezier(0.4,0,0.2,1); position: relative; }
  .prg-bar-fill::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%); animation: prg-shimmer 2s ease-in-out infinite; }
  @keyframes prg-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

  .prg-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .prg-stat { background: #fff; border-radius: 14px; border: 1px solid #f0f0f0; padding: 18px 16px; position: relative; overflow: hidden; }
  .prg-stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
  .prg-stat-val { font-size: 1.4rem; font-weight: 800; color: #111827; letter-spacing: -0.02em; }
  .prg-stat-label { font-size: 0.72rem; color: #6b7280; margin-top: 2px; }

  .prg-grid { display: grid; grid-template-columns: 1fr 360px; gap: 20px; align-items: start; }
  @media (max-width: 1024px) { .prg-grid { grid-template-columns: 1fr; } .prg-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) { .prg-stats { grid-template-columns: 1fr; } }

  /* Timeline */
  .prg-timeline { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; overflow: hidden; }
  .prg-timeline-head { padding: 18px 22px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
  .prg-timeline-title { font-size: 0.92rem; font-weight: 700; color: #111827; }
  .prg-timeline-body { padding: 22px; }

  .prg-tl-item { display: flex; gap: 18px; position: relative; padding-bottom: 28px; }
  .prg-tl-item:last-child { padding-bottom: 0; }
  .prg-tl-item::before { content: ''; position: absolute; left: 19px; top: 40px; bottom: 0; width: 2px; background: #e5e7eb; }
  .prg-tl-item:last-child::before { display: none; }
  .prg-tl-item.active::before { background: linear-gradient(180deg, #0891b2, #e5e7eb); }
  .prg-tl-item.completed::before { background: #10b981; }

  .prg-tl-node { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 0.82rem; font-weight: 800; flex-shrink: 0; position: relative; z-index: 2; transition: all 0.3s; }
  .prg-tl-node.locked { background: #f3f4f6; color: #9ca3af; border: 2px solid #e5e7eb; }
  .prg-tl-node.active { background: linear-gradient(135deg, #0891b2, #06b6d4); color: #fff; box-shadow: 0 0 0 4px rgba(8,145,178,0.15), 0 4px 12px rgba(8,145,178,0.25); animation: prg-pulse 2s ease-in-out infinite; }
  .prg-tl-node.completed { background: #10b981; color: #fff; }
  @keyframes prg-pulse { 0%, 100% { box-shadow: 0 0 0 4px rgba(8,145,178,0.15), 0 4px 12px rgba(8,145,178,0.25); } 50% { box-shadow: 0 0 0 8px rgba(8,145,178,0.08), 0 4px 16px rgba(8,145,178,0.3); } }

  .prg-tl-content { flex: 1; min-width: 0; }
  .prg-tl-name { font-size: 0.88rem; font-weight: 700; color: #111827; margin-bottom: 3px; }
  .prg-tl-meta { font-size: 0.72rem; color: #6b7280; display: flex; gap: 12px; flex-wrap: wrap; }
  .prg-tl-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 0.66rem; font-weight: 700; }
  .prg-tl-badge.done { background: #d1fae5; color: #065f46; }
  .prg-tl-badge.current { background: #dbeafe; color: #1d4ed8; }
  .prg-tl-badge.pending { background: #f3f4f6; color: #6b7280; }

  .prg-tl-progress { height: 4px; background: #f3f4f6; border-radius: 99px; margin-top: 8px; overflow: hidden; }
  .prg-tl-progress-fill { height: 100%; border-radius: 99px; transition: width 0.8s ease; }

  /* Milestone marker on timeline */
  .prg-tl-milestone { display: flex; gap: 18px; position: relative; padding-bottom: 28px; }
  .prg-tl-milestone::before { content: ''; position: absolute; left: 19px; top: 36px; bottom: 0; width: 2px; background: #e5e7eb; z-index: 0; }
  .prg-tl-milestone:last-child::before { display: none; }
  .prg-tl-ms-node { width: 40px; height: 40px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; z-index: 2; border: 2px dashed #f59e0b; background: #fffbeb; }
  .prg-tl-ms-node svg { width: 18px; height: 18px; color: #f59e0b; }

  /* Right panel */
  .prg-panel { display: flex; flex-direction: column; gap: 16px; }
  .prg-card { background: #fff; border-radius: 14px; border: 1px solid #f0f0f0; overflow: hidden; }
  .prg-card-head { padding: 14px 18px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
  .prg-card-title { font-size: 0.82rem; font-weight: 700; color: #111827; }
  .prg-card-body { padding: 14px 18px; }

  .prg-cal-week { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f8f8f8; font-size: 0.78rem; }
  .prg-cal-week:last-child { border-bottom: none; }
  .prg-cal-wk { width: 50px; font-weight: 700; color: #374151; flex-shrink: 0; font-size: 0.72rem; }
  .prg-cal-bar { flex: 1; height: 8px; background: #f3f4f6; border-radius: 99px; overflow: hidden; position: relative; }
  .prg-cal-fill { height: 100%; border-radius: 99px; }
  .prg-cal-dots { display: flex; gap: 4px; flex-shrink: 0; }
  .prg-cal-dot { width: 8px; height: 8px; border-radius: 999px; }

  .prg-act-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f8f8f8; }
  .prg-act-item:last-child { border-bottom: none; }
  .prg-act-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.7rem; }
  .prg-act-info { flex: 1; min-width: 0; }
  .prg-act-name { font-size: 0.8rem; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .prg-act-sub { font-size: 0.68rem; color: #9ca3af; }
  .prg-act-status { font-size: 0.66rem; font-weight: 700; padding: 3px 8px; border-radius: 20px; white-space: nowrap; }

  /* ═══ Profile Edit ═══ */
  .prof-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
  @media (max-width: 900px) { .prof-grid { grid-template-columns: 1fr; } }

  .prof-avatar-card { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; padding: 28px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .prof-avatar { width: 120px; height: 120px; border-radius: 999px; overflow: hidden; background: linear-gradient(135deg, #0891b2, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 2.4rem; font-weight: 800; color: #fff; position: relative; margin-bottom: 16px; }
  .prof-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .prof-avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; cursor: pointer; border-radius: 999px; }
  .prof-avatar:hover .prof-avatar-overlay { opacity: 1; }
  .prof-avatar-name { font-size: 1.1rem; font-weight: 800; color: #111827; margin-bottom: 4px; }
  .prof-avatar-role { font-size: 0.78rem; color: #6b7280; margin-bottom: 12px; }
  .prof-avatar-btn { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; font-size: 0.78rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.15s; }
  .prof-avatar-btn:hover { background: #f9fafb; border-color: #d1d5db; }

  .prof-form-card { background: #fff; border-radius: 16px; border: 1px solid #f0f0f0; overflow: hidden; }
  .prof-form-head { padding: 18px 24px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
  .prof-form-title { font-size: 0.92rem; font-weight: 700; color: #111827; }
  .prof-form-body { padding: 24px; }
  .prof-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 640px) { .prof-form-grid { grid-template-columns: 1fr; } }
  .prof-field { display: flex; flex-direction: column; gap: 5px; }
  .prof-field.full { grid-column: 1 / -1; }
  .prof-field label { font-size: 0.72rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
  .prof-field input, .prof-field textarea { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; font-size: 0.85rem; color: #111827; outline: none; transition: border-color 0.15s; font-family: inherit; }
  .prof-field input:focus, .prof-field textarea:focus { border-color: #0891b2; box-shadow: 0 0 0 3px rgba(8,145,178,0.08); }
  .prof-field input:disabled, .prof-field textarea:disabled { background: #f9fafb; color: #9ca3af; cursor: not-allowed; }
  .prof-field textarea { resize: vertical; min-height: 80px; }
  .prof-field .prof-hint { font-size: 0.66rem; color: #9ca3af; }

  .prof-skills-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .prof-skill-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 20px; font-size: 0.72rem; font-weight: 600; color: #0369a1; }
  .prof-skill-tag button { border: none; background: none; color: #9ca3af; cursor: pointer; font-size: 0.8rem; padding: 0; line-height: 1; }
  .prof-skill-tag button:hover { color: #ef4444; }
  .prof-skill-add { display: flex; gap: 6px; }
  .prof-skill-add input { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 12px; font-size: 0.78rem; outline: none; }
  .prof-skill-add input:focus { border-color: #0891b2; }
  .prof-skill-add button { padding: 6px 14px; border-radius: 8px; border: none; background: #0891b2; color: #fff; font-size: 0.72rem; font-weight: 700; cursor: pointer; }

  .prof-actions { display: flex; gap: 10px; justify-content: flex-end; padding: 18px 24px; border-top: 1px solid #f3f4f6; }
  .prof-btn-save { padding: 10px 28px; border-radius: 10px; border: none; background: #0891b2; color: #fff; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.15s; }
  .prof-btn-save:hover { background: #0e7490; }
  .prof-btn-save:disabled { background: #9ca3af; cursor: not-allowed; }
  .prof-btn-cancel { padding: 10px 28px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
  .prof-btn-cancel:hover { background: #f9fafb; }
  .prof-btn-edit { padding: 6px 16px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; font-size: 0.75rem; font-weight: 600; color: #374151; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
  .prof-btn-edit:hover { background: #f3f4f6; }
  .prof-msg { font-size: 0.78rem; padding: 10px 16px; border-radius: 10px; margin-bottom: 16px; }
  .prof-msg-ok { background: #d1fae5; color: #065f46; }
  .prof-msg-err { background: #fef2f2; color: #991b1b; }

  /* Loading */
  .p-loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fafafa; }
  .p-loading-spinner { width: 40px; height: 40px; border: 3px solid #e0f2fe; border-top: 3px solid #0891b2; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .p-error { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #fafafa; gap: 16px; }
  .p-error-code { font-size: 4rem; font-weight: 800; color: #0891b2; letter-spacing: -0.04em; }
  .p-error-msg { font-size: 1rem; color: #6b7280; }
  .p-error-btn { padding: 10px 28px; border-radius: 10px; border: none; background: #0891b2; color: #fff; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
  .p-error-btn:hover { background: #0e7490; }

  @media (max-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .pd-stats { grid-template-columns: repeat(2, 1fr); }
    .pd-info-grid { grid-template-columns: repeat(2, 1fr); }
    .pd-hero-inner { padding: 28px 20px 24px; }
    .pd-content, .pd-tabs { padding-left: 20px; padding-right: 20px; }
    .p-sidebar { display: none; }
    .p-topbar { left: 0 !important; }
    .p-main { margin-left: 0 !important; }
  }
  @media (max-width: 640px) {
    .stats-grid { grid-template-columns: 1fr; }
    .pd-stats { grid-template-columns: 1fr; }
    .pd-info-grid { grid-template-columns: 1fr; }
    .pd-info-item { border-right: none; }
    .pd-hero-title { font-size: 1.4rem; }
    .pd-tabs-bar { flex-wrap: wrap; }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BADGES / INSIGNIAS — Minimal dark UI
     ══════════════════════════════════════════════════════════════════════════ */
  .bdg-page { max-width: 100%; }
  .bdg-header { margin-bottom: 32px; }
  .bdg-title { font-size: 1.35rem; font-weight: 600; color: #1e293b; margin: 0 0 2px; }
  .bdg-subtitle { font-size: 0.8rem; color: #64748b; }

  .bdg-overview { display: flex; align-items: stretch; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }
  .bdg-overview-level { flex: 0 0 200px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
  .bdg-overview-level-ring { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; }
  .bdg-overview-level-ring svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .bdg-overview-level-ring .bdg-ring-text { position: relative; font-size: 1.3rem; font-weight: 700; color: #1e293b; z-index: 1; }
  .bdg-overview-level-name { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
  .bdg-overview-stats { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; min-width: 280px; }
  .bdg-os { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 16px; }
  .bdg-os-value { font-size: 1.6rem; font-weight: 700; color: #1e293b; line-height: 1; }
  .bdg-os-label { font-size: 0.7rem; color: #64748b; margin-top: 6px; letter-spacing: 0.3px; }
  .bdg-os-bar { margin-top: 10px; height: 3px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
  .bdg-os-bar-fill { height: 100%; border-radius: 3px; background: #94a3b8; transition: width 0.5s ease; }

  .bdg-section-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; margin-bottom: 14px; }

  .bdg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1px; background: #e2e8f0; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; }

  .bdg-card { background: #ffffff; padding: 22px 20px; display: flex; align-items: flex-start; gap: 16px; transition: background 0.15s; }
  .bdg-card:hover { background: #f8fafc; }

  .bdg-card-left { flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #e2e8f0; transition: border-color 0.2s, background 0.2s; }
  .bdg-card-left svg { width: 22px; height: 22px; }
  .bdg-earned .bdg-card-left { border-color: #cbd5e1; background: #f1f5f9; }
  .bdg-locked .bdg-card-left { opacity: 0.4; }

  .bdg-card-body { flex: 1; min-width: 0; }
  .bdg-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
  .bdg-card-name { font-size: 0.85rem; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bdg-locked .bdg-card-name { color: #94a3b8; }
  .bdg-card-tier { font-size: 0.55rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 2px 7px; border-radius: 4px; white-space: nowrap; }
  .bdg-card-desc { font-size: 0.72rem; color: #64748b; line-height: 1.35; margin-bottom: 10px; }

  .bdg-card-progress { display: flex; align-items: center; gap: 10px; }
  .bdg-card-bar { flex: 1; height: 4px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
  .bdg-card-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .bdg-card-pct { font-size: 0.65rem; font-weight: 600; color: #64748b; min-width: 32px; text-align: right; }

  @media (max-width: 768px) {
    .bdg-overview { flex-direction: column; }
    .bdg-overview-level { flex: none; }
    .bdg-overview-stats { grid-template-columns: 1fr 1fr; }
    .bdg-grid { grid-template-columns: 1fr; }
  }

  /* ═══ CHAT — Dark sleek theme ═══ */
  .cht-page { display: flex; height: calc(100vh - 140px); min-height: 500px; background: #0a0a0a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 32px rgba(0,0,0,0.4); }

  /* Left panel — conversations */
  .cht-sidebar { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; background: #111111; border-right: 1px solid #1e1e1e; }
  .cht-sidebar-head { padding: 18px 20px 12px; background: #161616; border-bottom: 1px solid #1e1e1e; color: #fff; }
  .cht-sidebar-title { font-size: 1rem; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 2px; color: #f5f5f5; }
  .cht-sidebar-sub { font-size: 0.7rem; color: rgba(255,255,255,0.4); }
  .cht-sidebar-tabs { display: flex; border-bottom: 1px solid #1e1e1e; background: #111111; }
  .cht-sidebar-tab { flex: 1; padding: 10px 0; font-size: 0.72rem; font-weight: 600; color: #666; cursor: pointer; text-align: center; border-bottom: 2px solid transparent; transition: all 0.2s; background: none; border-top: none; border-left: none; border-right: none; }
  .cht-sidebar-tab:hover { color: #aaa; }
  .cht-sidebar-tab.active { color: #fff; border-bottom-color: #fff; }
  .cht-program-list { flex: 1; overflow-y: auto; }
  .cht-program-item { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #1a1a1a; transition: all 0.15s; display: flex; gap: 12px; align-items: center; position: relative; }
  .cht-program-item:hover { background: #1a1a1a; }
  .cht-program-item.active { background: #1e1e1e; }
  .cht-program-item.active::before { content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: #fff; }
  .cht-program-avatar { width: 44px; height: 44px; border-radius: 12px; background: #2a2a2a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #ccc; font-weight: 700; font-size: 0.85rem; border: 1px solid #333; }
  .cht-program-info { flex: 1; min-width: 0; }
  .cht-program-name { font-size: 0.82rem; font-weight: 600; color: #e5e5e5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cht-program-last { font-size: 0.68rem; color: #666; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; }
  .cht-program-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
  .cht-program-time { font-size: 0.6rem; color: #555; }
  .cht-program-badge { background: #fff; color: #000; font-size: 0.6rem; font-weight: 700; min-width: 20px; height: 20px; border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 0 6px; }

  /* Participant list inside sidebar */
  .cht-people-list { flex: 1; overflow-y: auto; padding: 6px 0; }
  .cht-person { padding: 10px 16px; cursor: pointer; display: flex; gap: 12px; align-items: center; transition: background 0.12s; border-radius: 0; }
  .cht-person:hover { background: #1a1a1a; }
  .cht-person-avi { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; background: #2a2a2a; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #999; overflow: hidden; position: relative; border: 1px solid #333; }
  .cht-person-avi img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .cht-person-info { flex: 1; min-width: 0; }
  .cht-person-name { font-size: 0.8rem; font-weight: 600; color: #e5e5e5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cht-person-role { font-size: 0.65rem; color: #666; margin-top: 1px; text-transform: capitalize; }
  .cht-person-you { font-size: 0.55rem; font-weight: 600; color: #999; background: #1e1e1e; padding: 2px 6px; border-radius: 4px; margin-left: 6px; }

  /* Right panel — messages */
  .cht-main { flex: 1; display: flex; flex-direction: column; background: #0a0a0a; min-width: 0; }
  .cht-main-head { padding: 14px 20px; border-bottom: 1px solid #1e1e1e; display: flex; align-items: center; gap: 14px; background: #111111; }
  .cht-main-avatar { width: 40px; height: 40px; border-radius: 12px; background: #2a2a2a; display: flex; align-items: center; justify-content: center; color: #ccc; font-weight: 700; font-size: 0.8rem; flex-shrink: 0; border: 1px solid #333; }
  .cht-main-info { flex: 1; min-width: 0; }
  .cht-main-name { font-size: 0.9rem; font-weight: 700; color: #f5f5f5; }
  .cht-main-detail { font-size: 0.68rem; color: #666; margin-top: 1px; }
  .cht-main-actions { display: flex; gap: 6px; }
  .cht-main-actions button { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #2a2a2a; background: #161616; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .cht-main-actions button:hover { background: #1e1e1e; color: #fff; border-color: #444; }
  .cht-main-actions button svg { width: 18px; height: 18px; }

  .cht-messages { flex: 1; overflow-y: auto; padding: 20px 28px; display: flex; flex-direction: column; gap: 2px; scroll-behavior: smooth; background: #0a0a0a; }
  .cht-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #555; }
  .cht-empty-icon { width: 72px; height: 72px; border-radius: 50%; background: #161616; display: flex; align-items: center; justify-content: center; color: #555; border: 1px solid #2a2a2a; }
  .cht-empty-icon svg { width: 36px; height: 36px; }
  .cht-empty-title { font-size: 0.95rem; font-weight: 700; color: #ccc; }
  .cht-empty-sub { font-size: 0.78rem; color: #555; max-width: 280px; text-align: center; line-height: 1.5; }

  /* Message bubbles */
  .cht-msg-group { display: flex; gap: 10px; padding: 3px 0; }
  .cht-msg-group.mine { flex-direction: row-reverse; }
  .cht-msg-avi { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; object-fit: cover; background: #2a2a2a; display: flex; align-items: center; justify-content: center; font-size: 0.68rem; font-weight: 700; color: #999; overflow: hidden; border: 1px solid #333; }
  .cht-msg-avi img { width: 100%; height: 100%; object-fit: cover; }
  .cht-msg-body { max-width: 60%; display: flex; flex-direction: column; }
  .cht-msg-sender { font-size: 0.62rem; font-weight: 600; color: #888; margin-bottom: 3px; padding: 0 10px; }
  .mine .cht-msg-sender { text-align: right; color: #555; }
  .cht-msg-bubble { padding: 10px 14px; border-radius: 16px; font-size: 0.82rem; line-height: 1.5; word-break: break-word; }
  .cht-msg-group:not(.mine) .cht-msg-bubble { background: #1a1a1a; color: #e0e0e0; border: 1px solid #2a2a2a; border-bottom-left-radius: 4px; }
  .cht-msg-group.mine .cht-msg-bubble { background: #fff; color: #0a0a0a; border-bottom-right-radius: 4px; }
  .cht-msg-time { font-size: 0.58rem; color: #555; margin-top: 3px; padding: 0 10px; }
  .mine .cht-msg-time { text-align: right; }
  .cht-msg-attachments { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; padding: 0 4px; }
  .cht-msg-file { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; background: #161616; border-radius: 10px; font-size: 0.7rem; color: #ccc; border: 1px solid #2a2a2a; text-decoration: none; max-width: 240px; transition: all 0.12s; }
  .cht-msg-file:hover { background: #1e1e1e; border-color: #444; }
  .mine .cht-msg-file { background: rgba(0,0,0,0.2); color: #333; border-color: rgba(0,0,0,0.15); }
  .cht-msg-file-icon { flex-shrink: 0; width: 18px; height: 18px; color: #888; }
  .mine .cht-msg-file-icon { color: #555; }
  .cht-msg-file-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
  .cht-msg-file-size { color: #555; font-size: 0.6rem; flex-shrink: 0; }
  .mine .cht-msg-file-size { color: #888; }

  /* Date separator */
  .cht-date-sep { display: flex; align-items: center; gap: 14px; padding: 14px 0; }
  .cht-date-sep::before, .cht-date-sep::after { content: ''; flex: 1; height: 1px; background: #1e1e1e; }
  .cht-date-sep span { font-size: 0.62rem; font-weight: 600; color: #555; background: #1a1a1a; padding: 4px 12px; border-radius: 12px; white-space: nowrap; border: 1px solid #2a2a2a; }

  /* Typing indicator */
  .cht-typing { padding: 6px 28px 10px; font-size: 0.68rem; color: #888; font-style: italic; min-height: 22px; background: #0a0a0a; }
  .cht-typing-dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #888; margin: 0 1.5px; animation: chtTyping 1.2s infinite; }
  .cht-typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .cht-typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes chtTyping { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }

  /* Input area */
  .cht-input-area { padding: 12px 20px 16px; border-top: 1px solid #1e1e1e; background: #111111; }
  .cht-input-attachments { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .cht-input-att { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; background: #1e1e1e; border-radius: 8px; font-size: 0.68rem; color: #aaa; font-weight: 500; }
  .cht-input-att button { background: none; border: none; color: #555; cursor: pointer; padding: 0; line-height: 1; font-size: 0.85rem; }
  .cht-input-att button:hover { color: #ef4444; }
  .cht-input-row { display: flex; align-items: flex-end; gap: 10px; }
  .cht-input-wrap { flex: 1; display: flex; align-items: flex-end; background: #1a1a1a; border-radius: 24px; border: 2px solid #2a2a2a; padding: 4px; transition: all 0.2s; }
  .cht-input-wrap:focus-within { border-color: #555; background: #161616; box-shadow: 0 0 0 3px rgba(255,255,255,0.03); }
  .cht-input-wrap textarea { flex: 1; border: none; background: transparent; resize: none; font-size: 0.82rem; line-height: 1.45; padding: 8px 12px; color: #e5e5e5; outline: none; max-height: 120px; font-family: inherit; }
  .cht-input-wrap textarea::placeholder { color: #555; }
  .cht-input-btns { display: flex; gap: 2px; padding: 4px; }
  .cht-input-btn { width: 34px; height: 34px; border-radius: 50%; border: none; background: transparent; color: #555; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
  .cht-input-btn:hover { background: #2a2a2a; color: #ccc; }
  .cht-input-btn svg { width: 20px; height: 20px; }
  .cht-send-btn { width: 42px; height: 42px; border-radius: 50%; border: none; background: #fff; color: #0a0a0a; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; box-shadow: 0 2px 12px rgba(255,255,255,0.1); }
  .cht-send-btn:hover { transform: scale(1.06); box-shadow: 0 4px 20px rgba(255,255,255,0.15); }
  .cht-send-btn:disabled { background: #2a2a2a; color: #555; box-shadow: none; cursor: not-allowed; transform: none; }
  .cht-send-btn svg { width: 18px; height: 18px; }

  /* No program selected */
  .cht-no-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #555; background: #0a0a0a; }
  .cht-no-chat-icon { width: 80px; height: 80px; border-radius: 50%; background: #161616; display: flex; align-items: center; justify-content: center; border: 1px solid #2a2a2a; }
  .cht-no-chat-icon svg { width: 40px; height: 40px; color: #555; }

  /* System message */
  .cht-system { text-align: center; font-size: 0.68rem; color: #444; padding: 10px 0; font-style: italic; }

  @media (max-width: 768px) {
    .cht-page { flex-direction: column; height: calc(100vh - 120px); }
    .cht-sidebar { width: 100%; max-height: 220px; border-right: none; border-bottom: 1px solid #1e1e1e; }
    .cht-msg-body { max-width: 85%; }
    .cht-messages { padding: 16px 14px; }
  }
`;

// ============================================================================
// NAV ICONS
// ============================================================================
const navIcons: Record<string, JSX.Element> = {
  home: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  program: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  modules: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  activities: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  participants: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  milestones: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>,
  ecosystem: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  profile: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  badges: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  chat: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  support: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  logout: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  progress: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
};

// ============================================================================
// COMPONENT
// ============================================================================
export default function ParticipantPortalPage() {
  const router = useRouter();
  const params = useParams();
  const portalCode = params.code as string;
  const sectionParam = (params.section as string[] | undefined)?.[0] || '';

  // Map URL slug → internal section key
  const SECTION_SLUGS: Record<string, string> = {
    '': 'dashboard',
    'programa': 'my-program',
    'progreso': 'my-progress',
    'modulos': 'my-modules',
    'actividades': 'my-activities',
    'participantes': 'my-participants',
    'hitos': 'my-milestones',
    'ecosistema': 'my-ecosystem',
    'perfil': 'my-profile',
    'insignias': 'my-badges',
    'chat': 'my-chat',
  };
  const NAV_TO_SLUG: Record<string, string> = Object.fromEntries(Object.entries(SECTION_SLUGS).map(([k, v]) => [v, k]));
  const activeNav = SECTION_SLUGS[sectionParam] || 'dashboard';
  const navigate = (navId: string) => {
    const slug = NAV_TO_SLUG[navId] || '';
    router.push(`/p/${portalCode}${slug ? `/${slug}` : ''}`);
  };

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [portalUser, setPortalUser] = useState<any>(null);
  const [myPrograms, setMyPrograms] = useState<any[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Program detail state
  const [programDetail, setProgramDetail] = useState<any>(null);
  const [programTemplate, setProgramTemplate] = useState<any>(null);
  const [programParticipants, setProgramParticipants] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [ecosystemFilter, setEcosystemFilter] = useState<'all' | 'mentors' | 'mentees'>('all');
  const [showEcosystemInsights, setShowEcosystemInsights] = useState(true);
  const [selectedEcoPerson, setSelectedEcoPerson] = useState<any>(null);

  // Profile editing state
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileForm, setProfileForm] = useState({
    full_name: '', phone: '', position: '', department: '',
    linkedin_url: '', bio: '', headline: '', skills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Badges state
  const [badgesData, setBadgesData] = useState<any>(null);
  const [badgesLoading, setBadgesLoading] = useState(false);

  // Chat state
  const [chatPrograms, setChatPrograms] = useState<any[]>([]);
  const [chatActiveProgram, setChatActiveProgram] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatTyping, setChatTyping] = useState<string[]>([]);
  const [chatAttachments, setChatAttachments] = useState<any[]>([]);
  const [chatUploading, setChatUploading] = useState(false);
  const [chatUserId, setChatUserId] = useState('');
  const [chatParticipants, setChatParticipants] = useState<any[]>([]);
  const [chatSidebarTab, setChatSidebarTab] = useState<'chats' | 'people'>('chats');
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<any>(null);
  const chatTypingRef = useRef<any>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);

  // Derived
  const activeProgram = selectedProgram || myPrograms[0] || null;
  const roleLabel = ROLE_LABELS[portalUser?.role] || 'Participante';
  const displayName = portalUser?.full_name && portalUser.full_name !== '' 
    ? portalUser.full_name.split(' ')[0] 
    : (portalUser?.email?.split('@')[0] || 'Participante');
  const companyName = myPrograms[0]?.company_name || '';
  const totalSessions = programTemplate?.modules?.reduce((a: number, m: any) => a + (m.sessions || 0), 0) || 0;
  const totalResources = programTemplate?.modules?.reduce((a: number, m: any) => a + (m.resources?.length || 0), 0) || 0;

  // Derive detail tab from URL section
  const detailTab = (() => {
    const map: Record<string, string> = { 'my-program': 'overview', 'my-progress': 'progress', 'my-modules': 'modules', 'my-activities': 'activities', 'my-participants': 'participants', 'my-milestones': 'milestones', 'my-ecosystem': 'ecosystem' };
    return (map[activeNav] || 'overview') as 'overview' | 'modules' | 'participants' | 'activities' | 'milestones' | 'ecosystem';
  })();

  // Nav items
  const navItems = [
    { section: 'Mi Espacio', items: [
      { id: 'dashboard', label: 'Inicio', icon: 'home' },
      { id: 'my-program', label: 'Mi Programa', icon: 'program', count: myPrograms.length },
      { id: 'my-progress', label: 'Progreso', icon: 'progress' },
      { id: 'my-modules', label: 'Módulos', icon: 'modules', count: programTemplate?.modules?.length || 0 },
      { id: 'my-activities', label: 'Actividades', icon: 'activities' },
      { id: 'my-participants', label: 'Participantes', icon: 'participants', count: programParticipants.length || 0 },
      { id: 'my-milestones', label: 'Hitos', icon: 'milestones', count: programTemplate?.milestones?.length || 0 },
      { id: 'my-ecosystem', label: 'Ecosistema', icon: 'ecosystem' },
    ]},
    { section: 'Personal', items: [
      { id: 'my-profile', label: 'Mi Perfil', icon: 'profile' },
    ]},
    { section: 'Reconocimiento', items: [
      { id: 'my-badges', label: 'Insignias', icon: 'badges' },
    ]},
    { section: 'Conexión', items: [
      { id: 'my-chat', label: 'Chat', icon: 'chat' },
    ]},
  ];

  // ── Init: validate portal code ──
  useEffect(() => {
    if (!portalCode) { setError('Código de portal no válido'); setLoading(false); return; }

    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login/admin'); return; }

    // Validate the portal code
    fetch(`${API_URL}/api/companies/portal/${portalCode}`)
      .then(r => { if (!r.ok) throw new Error('not_found'); return r.json(); })
      .then(data => {
        setPortalUser(data.user);
        // Fetch programs
        if (data.user?.id) {
          setLoadingPrograms(true);
          fetch(`${API_URL}/api/programs/my-programs/${data.user.id}`)
            .then(r => r.ok ? r.json() : [])
            .then(programs => {
              const arr = Array.isArray(programs) ? programs : [];
              setMyPrograms(arr);
              if (arr.length >= 1) setSelectedProgram(arr[0]);
            })
            .catch(() => {})
            .finally(() => setLoadingPrograms(false));
        }
        setLoading(false);
      })
      .catch(() => { setError('Portal no encontrado'); setLoading(false); });
  }, [portalCode, router]);

  // ── Fetch full program data when a program is selected ──
  useEffect(() => {
    if (!selectedProgram?.id) return;
    setLoadingDetail(true);
    setProgramDetail(null);
    setProgramTemplate(null);
    setProgramParticipants([]);

    const programId = selectedProgram.id;

    // Fetch all 3 in parallel
    Promise.all([
      fetch(`${API_URL}/api/programs/${programId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_URL}/api/program-templates`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API_URL}/api/programs/${programId}/participants`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([detail, templates, participants]) => {
      if (detail) setProgramDetail(detail);
      // Match template by name
      const allTemplates = Array.isArray(templates) ? templates : [];
      const matched = allTemplates.find((t: any) => t.name === selectedProgram.name);
      if (matched) setProgramTemplate(matched);
      setProgramParticipants(Array.isArray(participants) ? participants : []);
    }).finally(() => setLoadingDetail(false));
  }, [selectedProgram?.id, selectedProgram?.name]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    localStorage.removeItem('program_participant');
    localStorage.removeItem('session_expires_at');
    router.push('/login/admin');
  };

  // Clock
  // Fetch badges when entering the badges tab
  useEffect(() => {
    if (activeNav !== 'my-badges' || !portalCode) return;
    setBadgesLoading(true);
    fetch(`${API_URL}/api/companies/portal/${portalCode}/badges`)
      .then(r => { if (!r.ok) throw new Error('badges_error'); return r.json(); })
      .then(data => setBadgesData(data))
      .catch(() => setBadgesData(null))
      .finally(() => setBadgesLoading(false));
  }, [activeNav, portalCode]);

  // ── Chat: fetch programs list ──
  useEffect(() => {
    if (activeNav !== 'my-chat') {
      // Cleanup polling when leaving chat
      if (chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; }
      return;
    }
    fetch(`${API_URL}/api/companies/portal/${portalCode}/chat/programs`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setChatPrograms(data.programs || []);
          setChatUserId(data.user_id || '');
          // Auto-select first program if none selected
          if (!chatActiveProgram && data.programs?.length > 0) {
            setChatActiveProgram(data.programs[0]);
          }
        }
      })
      .catch(() => {});
  }, [activeNav, portalCode]);

  // ── Chat: fetch messages when program changes ──
  useEffect(() => {
    if (!chatActiveProgram || activeNav !== 'my-chat') return;
    setChatLoading(true);
    setChatMessages([]);
    // Fetch messages
    fetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/messages`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setChatMessages(data.messages || []);
      })
      .catch(() => {})
      .finally(() => {
        setChatLoading(false);
        setTimeout(() => { chatMessagesRef.current?.scrollTo({ top: chatMessagesRef.current.scrollHeight }); }, 100);
      });
  }, [chatActiveProgram?.id, activeNav, portalCode]);

  // ── Chat: fetch participants when program changes ──
  useEffect(() => {
    if (!chatActiveProgram || activeNav !== 'my-chat') return;
    fetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/participants`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setChatParticipants(data.participants || []); })
      .catch(() => {});
  }, [chatActiveProgram?.id, activeNav, portalCode]);

  // ── Chat: polling for new messages + typing ──
  useEffect(() => {
    if (!chatActiveProgram || activeNav !== 'my-chat') return;
    const poll = () => {
      const lastMsg = chatMessages[chatMessages.length - 1];
      const after = lastMsg?.created_at || '';
      fetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/poll${after ? `?after=${after}` : ''}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            if (data.messages?.length > 0) {
              setChatMessages(prev => {
                const ids = new Set(prev.map((m: any) => m.id));
                const newMsgs = data.messages.filter((m: any) => !ids.has(m.id));
                if (newMsgs.length === 0) return prev;
                const updated = [...prev, ...newMsgs];
                setTimeout(() => { chatMessagesRef.current?.scrollTo({ top: chatMessagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
                return updated;
              });
            }
            setChatTyping(data.typing || []);
          }
        })
        .catch(() => {});
    };
    chatPollRef.current = setInterval(poll, 2000);
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [chatActiveProgram?.id, activeNav, portalCode, chatMessages]);

  // ── Chat functions ──
  const sendChatMessage = useCallback(async () => {
    if ((!chatInput.trim() && chatAttachments.length === 0) || chatSending || !chatActiveProgram) return;
    setChatSending(true);
    try {
      const res = await fetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: chatInput.trim(), attachments: chatAttachments }),
      });
      if (res.ok) {
        const msg = await res.json();
        setChatMessages(prev => [...prev, msg]);
        setChatInput('');
        setChatAttachments([]);
        setTimeout(() => { chatMessagesRef.current?.scrollTo({ top: chatMessagesRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
      }
    } catch {}
    setChatSending(false);
  }, [chatInput, chatAttachments, chatSending, chatActiveProgram, portalCode]);

  const handleChatTyping = useCallback(() => {
    if (!chatActiveProgram) return;
    const now = Date.now();
    if (chatTypingRef.current && now - chatTypingRef.current < 2000) return;
    chatTypingRef.current = now;
    fetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/typing`, { method: 'POST' }).catch(() => {});
  }, [chatActiveProgram, portalCode]);

  const handleChatFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !chatActiveProgram) return;
    setChatUploading(true);
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append('file', files[i]);
      try {
        const res = await fetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/upload`, { method: 'POST', body: fd });
        if (res.ok) {
          const att = await res.json();
          setChatAttachments(prev => [...prev, att]);
        }
      } catch {}
    }
    setChatUploading(false);
    if (chatFileRef.current) chatFileRef.current.value = '';
  }, [chatActiveProgram, portalCode]);

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Loading / Error states ──
  if (loading) return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="p-loading"><div className="p-loading-spinner" /></div>
    </>
  );

  if (error) return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="p-error">
        <div className="p-error-code">404</div>
        <div className="p-error-msg">{error}</div>
        <button className="p-error-btn" onClick={() => router.push('/login/admin')}>Ir al login</button>
      </div>
    </>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER SECTIONS
  // ══════════════════════════════════════════════════════════════════════════

  const renderDashboard = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Hola, {displayName}</h1>
        <p className="dash-subtitle">Bienvenido a tu espacio de aprendizaje</p>
      </div>

      {loadingPrograms ? (
        <div className="empty-state">Cargando tus programas...</div>
      ) : myPrograms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: 8 }}>Aún no estás inscrito en un programa</h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Cuando te asignen a un programa, aparecerá aquí.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: myPrograms.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
            {myPrograms.map(mp => {
              const gradient = THEME_GRADIENTS[mp.theme] || THEME_GRADIENTS.leadership;
              return (
                <div key={mp.id} onClick={() => { setSelectedProgram(mp); navigate('my-program'); }}
                  style={{ background: gradient, borderRadius: 16, padding: '28px 28px 20px', cursor: 'pointer', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'rgba(255,255,255,0.06)', borderRadius: '0 0 0 120px' }} />
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', display: 'inline-block' }} />
                    {roleLabel}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8, lineHeight: 1.3 }}>{mp.name}</div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.8, marginBottom: 16, lineHeight: 1.5 }}>{mp.description?.slice(0, 120)}{(mp.description?.length || 0) > 120 ? '...' : ''}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', opacity: 0.75 }}>
                    <span>{programTemplate?.modules?.length || mp.modules?.length || 0} módulos</span>
                    <span>{programDetail?.activities?.length || mp.activities?.length || 0} actividades</span>
                    <span>{programParticipants.length || mp.total_participants || 0} participantes</span>
                  </div>
                  {mp.vinculation && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.12)', borderRadius: 10, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Mentoría con <strong>{mp.vinculation.partner_name}</strong>
                    </div>
                  )}
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 600, opacity: 0.9 }}>
                    <span>Ver programa</span>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="stats-grid">
            {[
              { label: 'Programas activos', value: myPrograms.length, change: `Inscrito como ${roleLabel.toLowerCase()}`, stripe: '#0891b2' },
              { label: 'Módulos', value: programTemplate?.modules?.length || myPrograms.reduce((a: number, p: any) => a + (p.modules?.length || 0), 0), change: 'Contenido del programa', stripe: '#6366f1' },
              { label: 'Actividades', value: programDetail?.activities?.length || myPrograms.reduce((a: number, p: any) => a + (p.activities?.length || 0), 0), change: 'Ejercicios y entrenamientos', stripe: '#059669' },
              { label: 'Empresa', value: companyName || '—', change: roleLabel, stripe: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-card-stripe" style={{ background: s.stripe }} />
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: typeof s.value === 'string' ? '0.9rem' : undefined }}>{s.value}</div>
                <div className="stat-change">{s.change}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );

  const renderMyProgram = () => {
    const mp = activeProgram;
    if (!mp) return <div className="empty-state">Selecciona un programa</div>;
    if (loadingDetail) return <div className="empty-state">Cargando datos del programa...</div>;

    const heroGradient = THEME_GRADIENTS[mp.theme] || THEME_GRADIENTS.leadership;
    const activities = programDetail?.activities || mp.activities || [];
    const modulesCount = programTemplate?.modules?.length || 0;

    const getStatusBadge = (st: string) => (
      <span className={`badge ${st === 'active' || st === 'running' ? 'badge-active' : st === 'completed' ? 'badge-completed' : 'badge-draft'}`}>
        {LABELS.status[st] || st}
      </span>
    );

    return (
      <div className="pd-wrapper">
        {/* ── HERO — only on programa overview ── */}
        {detailTab === 'overview' && (
        <section className="pd-hero">
          <div className="pd-hero-bg" style={{ background: heroGradient }}>
            <div className="pd-bubble pd-bubble-1" />
            <div className="pd-bubble pd-bubble-2" />
            <div className="pd-bubble pd-bubble-3" />
            <div className="pd-bubble pd-bubble-4" />
            <div className="pd-bubble pd-bubble-5" />
          </div>
          <div className="pd-hero-inner">
            <button className="pd-back" onClick={() => navigate('dashboard')}>
              &larr; Volver al inicio
            </button>
            <h1 className="pd-hero-title">{mp.name}</h1>
            {mp.description && <p className="pd-hero-desc">{mp.description}</p>}

            <div className="pd-hero-meta">
              <div className="pd-hero-meta-item"><div className="pd-hero-meta-label">Participantes</div><div className="pd-hero-meta-value">{programParticipants.length}</div></div>
              <div className="pd-hero-meta-item"><div className="pd-hero-meta-label">Actividades</div><div className="pd-hero-meta-value">{activities.length}</div></div>
              <div className="pd-hero-meta-item"><div className="pd-hero-meta-label">Módulos</div><div className="pd-hero-meta-value">{modulesCount}</div></div>
              <div className="pd-hero-meta-item"><div className="pd-hero-meta-label">Duración</div><div className="pd-hero-meta-value">{programTemplate?.duration || '—'}</div></div>
              <div className="pd-hero-meta-item"><div className="pd-hero-meta-label">Mi rol</div><div className="pd-hero-meta-value">{roleLabel}</div></div>
            </div>

            <div className="pd-hero-pills">
              <span className="pd-pill pd-pill-theme">{LABELS.theme[mp.theme] || mp.theme}</span>
              <span className="pd-pill pd-pill-status" style={{ background: mp.status === 'active' || mp.status === 'running' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.12)', color: '#fff' }}>{LABELS.status[mp.status] || mp.status}</span>
              {programTemplate?.tags?.map((tag: string, i: number) => (
                <span key={i} className="pd-pill" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)' }}>#{tag}</span>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ── Mini context bar for sub-section pages ── */}
        {detailTab !== 'overview' && (
          <div style={{ background: heroGradient, padding: '16px 36px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="pd-back" onClick={() => navigate('my-program')} style={{ margin: 0, fontSize: '0.72rem', padding: '5px 12px' }}>
              &larr; {mp.name}
            </button>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>|</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>
              {{ modules: 'Módulos', participants: 'Participantes', activities: 'Actividades', milestones: 'Hitos', ecosystem: 'Ecosistema' }[detailTab]}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', marginLeft: 'auto' }}>{roleLabel} &middot; {programTemplate?.duration || ''}</span>
          </div>
        )}

        {/* ── CONTENT ── */}
        <div className="pd-content">

          {/* ─── TAB: OVERVIEW ─── */}
          {detailTab === 'overview' && (
            <>
              <div className="pd-stats">
                {[
                  { label: 'Participantes', value: programParticipants.length, sub: programParticipants.length > 0 ? 'Inscritos' : 'Sin inscripciones', color: '#0891b2' },
                  { label: 'Actividades', value: activities.length, sub: `${activities.filter((a: any) => a.status === 'completed').length} completadas`, color: '#059669' },
                  { label: 'Módulos', value: modulesCount, sub: `${totalSessions} sesiones, ${totalResources} recursos`, color: '#2563eb' },
                  { label: 'Hitos', value: programTemplate?.milestones?.length || 0, sub: programTemplate?.milestones?.length ? 'Definidos' : 'Sin hitos', color: '#f59e0b' },
                ].map((s, i) => (
                  <div key={i} className="pd-stat">
                    <div className="pd-stat-accent" style={{ background: s.color }} />
                    <div className="pd-stat-label">{s.label}</div>
                    <div className="pd-stat-val">{s.value}</div>
                    <div className="pd-stat-sub">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Program info */}
              <div className="pd-section">
                <div className="pd-section-head">
                  <div className="pd-section-title">Información del Programa</div>
                </div>
                <div className="pd-info-grid">
                  <div className="pd-info-item"><div className="pd-info-label">Nombre</div><div className="pd-info-val">{mp.name}</div></div>
                  <div className="pd-info-item"><div className="pd-info-label">Tema</div><div className="pd-info-val">{LABELS.theme[mp.theme] || mp.theme}</div></div>
                  <div className="pd-info-item"><div className="pd-info-label">Estado</div><div className="pd-info-val">{LABELS.status[mp.status] || mp.status}</div></div>
                  <div className="pd-info-item"><div className="pd-info-label">Mi rol</div><div className="pd-info-val">{roleLabel}</div></div>
                  <div className="pd-info-item"><div className="pd-info-label">Empresa</div><div className="pd-info-val">{mp.company_name || companyName}</div></div>
                  <div className="pd-info-item"><div className="pd-info-label">Inscripción</div><div className="pd-info-val">{mp.joined_at ? new Date(mp.joined_at).toLocaleDateString('es-CL') : '—'}</div></div>
                  {programTemplate?.duration && <div className="pd-info-item"><div className="pd-info-label">Duración</div><div className="pd-info-val">{programTemplate.duration}</div></div>}
                  {programTemplate?.category && <div className="pd-info-item"><div className="pd-info-label">Categoría</div><div className="pd-info-val">{programTemplate.category}</div></div>}
                  {mp.description && <div className="pd-info-item" style={{ gridColumn: '1 / -1' }}><div className="pd-info-label">Descripción</div><div className="pd-info-val" style={{ fontWeight: 400 }}>{mp.description}</div></div>}
                </div>
              </div>

              {/* Tags */}
              {programTemplate?.tags?.length > 0 && (
                <div className="pd-section">
                  <div className="pd-section-head">
                    <div className="pd-section-title">Etiquetas</div>
                    <div className="pd-section-count">{programTemplate.tags.length}</div>
                  </div>
                  <div className="pd-section-body">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {programTemplate.tags.map((tag: string, i: number) => (
                        <span key={i} className="pd-tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {programTemplate?.mentorRequirements && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div className="pd-req">
                    <div className="pd-req-head">Requisitos Mentor</div>
                    <div className="pd-req-row"><span className="pd-req-label">Máx. mentees</span><span className="pd-req-val">{programTemplate.mentorRequirements.maxMentees || '—'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Experiencia mínima</span><span className="pd-req-val">{programTemplate.mentorRequirements.minExperienceYears ? `${programTemplate.mentorRequirements.minExperienceYears} años` : '—'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Nivel requerido</span><span className="pd-req-val">{programTemplate.mentorRequirements.requiredLevel || '—'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Requiere perfil</span><span className="pd-req-val">{programTemplate.mentorRequirements.requireProfile ? 'Sí' : 'No'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Requiere LinkedIn</span><span className="pd-req-val">{programTemplate.mentorRequirements.requireLinkedIn ? 'Sí' : 'No'}</span></div>
                  </div>
                  <div className="pd-req">
                    <div className="pd-req-head">Requisitos Mentee</div>
                    <div className="pd-req-row"><span className="pd-req-label">Puede elegir mentor</span><span className="pd-req-val">{programTemplate.menteeRequirements?.canSelectMentor ? 'Sí' : 'No'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Máx. mentores</span><span className="pd-req-val">{programTemplate.menteeRequirements?.maxMentors || '—'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Objetivos requeridos</span><span className="pd-req-val">{programTemplate.menteeRequirements?.requiredGoals ? 'Sí' : 'No'}</span></div>
                  </div>
                </div>
              )}

              {/* Activities summary */}
              {activities.length > 0 && (
                <div className="pd-section">
                  <div className="pd-section-head">
                    <div className="pd-section-title">Actividades</div>
                    <div className="pd-section-count">{activities.length}</div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr><th>Nombre</th><th>Tipo</th><th>Categoría</th><th>Modalidad</th><th>Obligatoria</th><th>Estado</th></tr>
                      </thead>
                      <tbody>
                        {activities.map((a: any, i: number) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{a.name}</td>
                            <td>{LABELS.actType[a.activity_type || a.type] || a.activity_type || a.type || '—'}</td>
                            <td>{LABELS.actCategory[a.category] || a.category || '—'}</td>
                            <td>{LABELS.modality[a.modality] || a.modality || '—'}</td>
                            <td>{a.is_mandatory ? 'Sí' : 'No'}</td>
                            <td>{getStatusBadge(a.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Vinculation */}
              {mp.vinculation && (
                <div className="pd-section">
                  <div className="pd-section-head"><div className="pd-section-title">Mi Vinculación</div></div>
                  <div className="pd-section-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                        {mp.vinculation.partner_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827' }}>{mp.vinculation.partner_name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{ROLE_LABELS[mp.vinculation.partner_role] || mp.vinculation.partner_role}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{mp.vinculation.partner_email}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── TAB: MODULES ─── */}
          {detailTab === 'modules' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Módulos del Programa</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                    {modulesCount} módulos — {totalSessions} sesiones — {totalResources} recursos
                  </div>
                </div>
                {modulesCount > 0 && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ fontSize: '0.72rem', padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }} onClick={() => {
                      const allKeys = programTemplate.modules.map((m: any, i: number) => m.id || `mod-${i}`);
                      setExpandedModules(new Set(allKeys));
                    }}>Expandir todo</button>
                    <button style={{ fontSize: '0.72rem', padding: '5px 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer' }} onClick={() => setExpandedModules(new Set())}>Colapsar</button>
                  </div>
                )}
              </div>

              {!programTemplate || !programTemplate.modules?.length ? (
                <div className="pd-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sin módulos</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Este programa no tiene módulos configurados</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {programTemplate.modules.map((mod: any, idx: number) => {
                    const modKey = mod.id || `mod-${idx}`;
                    const isExpanded = expandedModules.has(modKey);
                    return (
                      <div key={modKey} className="pd-mod">
                        <div className="pd-mod-head" onClick={() => {
                          setExpandedModules(prev => {
                            const next = new Set(prev);
                            if (next.has(modKey)) next.delete(modKey); else next.add(modKey);
                            return next;
                          });
                        }}>
                          <div className="pd-mod-num">{idx + 1}</div>
                          <div className="pd-mod-info">
                            <div className="pd-mod-name">{mod.name}</div>
                            <div className="pd-mod-meta">
                              {mod.duration && <span>{mod.duration}</span>}
                              <span>{mod.sessions || 0} sesiones</span>
                              <span>{mod.resources?.length || 0} recursos</span>
                              {mod.activities?.length > 0 && <span>{mod.activities.length} actividades</span>}
                            </div>
                          </div>
                          <div className="pd-mod-toggle">{isExpanded ? '▲' : '▼'}</div>
                        </div>

                        {isExpanded && (
                          <div className="pd-mod-body">
                            {mod.description && <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.7, margin: '0 0 18px' }}>{mod.description}</p>}

                            {mod.objectives?.length > 0 && (
                              <div style={{ marginBottom: 18 }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Objetivos</div>
                                <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.82rem', color: '#4b5563', listStyle: 'disc', lineHeight: 1.8 }}>
                                  {mod.objectives.map((obj: string, oi: number) => (
                                    <li key={oi}>{obj}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {mod.resources?.length > 0 && (
                              <div style={{ marginBottom: 18 }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Recursos ({mod.resources.length})</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {mod.resources.map((res: any, ri: number) => (
                                    <div key={ri} className="pd-res">
                                      <span className="pd-res-type" style={{
                                        background: res.type === 'pdf' ? '#fef2f2' : res.type === 'video' ? '#eff6ff' : res.type === 'template' ? '#fffbeb' : '#f3f4f6',
                                        color: res.type === 'pdf' ? '#dc2626' : res.type === 'video' ? '#2563eb' : res.type === 'template' ? '#d97706' : '#6b7280',
                                      }}>{res.type || 'doc'}</span>
                                      <span className="pd-res-name">{res.name}</span>
                                      {res.size && <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{res.size}</span>}
                                      {(res.url || res.dataUrl) && (
                                        <a href={res.url || res.dataUrl} target="_blank" rel="noopener noreferrer" className="pd-res-link">Abrir</a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {mod.activities?.length > 0 && (
                              <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Actividades del módulo ({mod.activities.length})</div>
                                <table className="data-table" style={{ fontSize: '0.78rem' }}>
                                  <thead><tr><th>Nombre</th><th>Tipo</th><th>Modalidad</th></tr></thead>
                                  <tbody>
                                    {mod.activities.map((act: any, ai: number) => (
                                      <tr key={ai}>
                                        <td style={{ fontWeight: 600 }}>{act.name || act.title || `Actividad ${ai + 1}`}</td>
                                        <td>{act.type || '—'}</td>
                                        <td>{act.modality || '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ─── TAB: PARTICIPANTS ─── */}
          {detailTab === 'participants' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Participantes del Programa</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{programParticipants.length} persona{programParticipants.length !== 1 ? 's' : ''} inscrita{programParticipants.length !== 1 ? 's' : ''}</div>
              </div>

              {programParticipants.length === 0 ? (
                <div className="pd-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sin participantes</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Aún no hay participantes en este programa</div>
                </div>
              ) : (
                <div className="pd-section">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th></tr>
                      </thead>
                      <tbody>
                        {programParticipants.map((pt: any, i: number) => {
                          const u = pt.user || {};
                          const name = u.full_name || [u.nombre || u.first_name, u.apellidos || u.last_name].filter(Boolean).join(' ').trim() || '—';
                          return (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{name}</td>
                            <td>{u.email || pt.email || '—'}</td>
                            <td>{ROLE_LABELS[pt.role] || pt.role}</td>
                            <td><span className={`badge ${pt.status === 'active' ? 'badge-active' : 'badge-draft'}`}>{pt.status === 'active' ? 'Activo' : pt.status}</span></td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── TAB: ACTIVITIES ─── */}
          {detailTab === 'activities' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Actividades del Programa</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{activities.length} actividad{activities.length !== 1 ? 'es' : ''} configurada{activities.length !== 1 ? 's' : ''}</div>
              </div>

              {activities.length === 0 ? (
                <div className="pd-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sin actividades</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Este programa no tiene actividades configuradas aún</div>
                </div>
              ) : (
                <div className="pd-section">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nombre</th><th>Tipo</th><th>Categoría</th><th>Modalidad</th><th>Dirigido a</th><th>Obligatoria</th><th>Certificado</th><th>Capacidad</th><th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.map((a: any, i: number) => (
                          <tr key={i}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{a.name}</div>
                              {a.description && <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{a.description}</div>}
                            </td>
                            <td>{LABELS.actType[a.activity_type || a.type] || a.activity_type || a.type || '—'}</td>
                            <td>{LABELS.actCategory[a.category] || a.category || '—'}</td>
                            <td>{LABELS.modality[a.modality] || a.modality || '—'}</td>
                            <td>{LABELS.targetRole[a.target_role] || a.target_role || '—'}</td>
                            <td>{a.is_mandatory ? 'Sí' : 'No'}</td>
                            <td>{a.is_certificate_issued ? 'Sí' : 'No'}</td>
                            <td>{a.capacity || '—'}</td>
                            <td>{getStatusBadge(a.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── TAB: MILESTONES ─── */}
          {detailTab === 'milestones' && (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Hitos del Programa</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                  {programTemplate?.milestones?.length || 0} hito{(programTemplate?.milestones?.length || 0) !== 1 ? 's' : ''} definido{(programTemplate?.milestones?.length || 0) !== 1 ? 's' : ''}
                </div>
              </div>

              {!programTemplate || !programTemplate.milestones?.length ? (
                <div className="pd-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sin hitos</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Este programa no tiene hitos configurados</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {programTemplate.milestones.map((ms: any, idx: number) => (
                    <div key={ms.id || idx} className="pd-ms">
                      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                        <div className="pd-ms-week">
                          <div className="pd-ms-wk-label">Semana</div>
                          <div className="pd-ms-wk-num">{ms.week}</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="pd-ms-title">{ms.name}</div>
                          {ms.description && <div className="pd-ms-desc">{ms.description}</div>}
                          {ms.deliverable && (
                            <div className="pd-ms-deliverable">
                              <span style={{ fontWeight: 700 }}>Entregable:</span> {ms.deliverable}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─── TAB: ECOSYSTEM ─── */}
          {detailTab === 'ecosystem' && (
            <>
              <style>{`
                @keyframes ecoOrbit{0%{transform:rotate(0deg) translateX(var(--eco-r)) rotate(0deg)}100%{transform:rotate(360deg) translateX(var(--eco-r)) rotate(-360deg)}}
                @keyframes ecoPulse{0%,100%{box-shadow:0 0 20px var(--eco-glow)}50%{box-shadow:0 0 36px var(--eco-glow),0 0 60px color-mix(in srgb,var(--eco-glow) 30%,transparent)}}
                @keyframes ecoRing{0%{transform:translate(-50%,-50%) scale(1);opacity:0.25}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}
              `}</style>
              {(() => {
                const people = programParticipants.map((pt: any, i: number) => {
                  const roleRaw = String(pt?.role || '').toLowerCase();
                  const role = roleRaw === 'mentor' || roleRaw === 'instructor' ? 'mentor' : 'mentee';
                  const u = pt.user || {};
                  const fullName = u.full_name || [u.nombre || u.first_name, u.apellidos || u.last_name].filter(Boolean).join(' ').trim() || (u.email || pt.email || `Participante ${i + 1}`).split('@')[0];
                  const email = u.email || pt.email || 'sin-email';
                  const position = ROLE_LABELS[pt.role] || pt.role || (role === 'mentor' ? 'Mentor' : 'Mentee');
                  const avatarUrl = u.avatar_url || '';
                  const headline = u.headline || '';
                  const influence = Math.min(96, Math.max(35, 45 + (i * 7) % 48));
                  const isMe = String(u.id) === String(portalUser?.id);
                  return { id: String(pt.id || i + 1), name: fullName, email, role, position, influence, status: pt.status || 'active', avatarUrl, headline, isMe };
                });

                // Current user = center
                const me = people.find((p: any) => p.isMe) || {
                  id: 'me', name: portalUser?.full_name || displayName, email: portalUser?.email || '',
                  role: portalUser?.role || 'mentor', position: roleLabel, influence: 95,
                  status: 'active', avatarUrl: portalUser?.avatar_url || '', headline: portalUser?.headline || '', isMe: true,
                };
                const others = people.filter((p: any) => !p.isMe);

                const mentors = others.filter((p: any) => p.role === 'mentor');
                const mentees = others.filter((p: any) => p.role === 'mentee');
                const filteredOthers = ecosystemFilter === 'all' ? others : others.filter((p: any) => p.role === (ecosystemFilter === 'mentors' ? 'mentor' : 'mentee'));

                // Place surrounding nodes in a circle
                const getNodePos = (idx: number, total: number) => {
                  const angle = (idx / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
                  const radius = 34;
                  return { left: 50 + Math.cos(angle) * radius, top: 50 + Math.sin(angle) * radius };
                };

                const meInitials = (me.name || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

                return (
                  <div style={{ background: 'linear-gradient(135deg,#0b1020,#121a33 48%,#1a1145)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.09)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>Mi Red de Influencia</div>
                        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.76rem', marginTop: 2 }}>{me.name} · {mp.name}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {([
                          { id: 'all', label: 'Todos' },
                          { id: 'mentors', label: 'Mentores' },
                          { id: 'mentees', label: 'Mentees' },
                        ] as const).map(f => (
                          <button key={f.id} onClick={() => setEcosystemFilter(f.id)} style={{ border: 'none', borderRadius: 8, padding: '7px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', background: ecosystemFilter === f.id ? '#06b6d4' : 'rgba(255,255,255,0.14)', color: '#fff' }}>
                            {f.label}
                          </button>
                        ))}
                        <button onClick={() => setShowEcosystemInsights(v => !v)} style={{ border: '1px solid rgba(255,255,255,0.22)', borderRadius: 8, padding: '7px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', background: showEcosystemInsights ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.12)', color: '#fff' }}>
                          Insights
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: showEcosystemInsights ? '1fr 320px' : '1fr', minHeight: 560 }}>
                      <div style={{ position: 'relative', padding: 16, minHeight: 560 }}>
                        {/* Orbit rings */}
                        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '42%', aspectRatio: '1 / 1', borderRadius: '999px', border: '1px dashed rgba(6,182,212,0.2)' }} />
                        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '70%', aspectRatio: '1 / 1', borderRadius: '999px', border: '1px dashed rgba(96,165,250,0.15)' }} />

                        {/* Animated pulse ring behind center */}
                        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 100, height: 100, borderRadius: 999, border: '2px solid rgba(6,182,212,0.3)', animation: 'ecoRing 3s ease-out infinite' }} />

                        {/* Connection lines from center to each node */}
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                          <defs>
                            <linearGradient id="eco-line-mentor" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="rgba(6,182,212,0.6)" />
                              <stop offset="100%" stopColor="rgba(6,182,212,0.15)" />
                            </linearGradient>
                            <linearGradient id="eco-line-mentee" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="rgba(96,165,250,0.6)" />
                              <stop offset="100%" stopColor="rgba(96,165,250,0.15)" />
                            </linearGradient>
                          </defs>
                          {filteredOthers.map((person: any, idx: number) => {
                            const pos = getNodePos(idx, filteredOthers.length);
                            return (
                              <line
                                key={person.id}
                                x1="50%" y1="50%"
                                x2={`${pos.left}%`} y2={`${pos.top}%`}
                                stroke={person.role === 'mentor' ? 'url(#eco-line-mentor)' : 'url(#eco-line-mentee)'}
                                strokeWidth="1.5"
                                strokeDasharray="4 4"
                                opacity="0.7"
                              />
                            );
                          })}
                        </svg>

                        {/* CENTER NODE: current user */}
                        <div style={{
                          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                          width: 96, height: 96, borderRadius: 999, zIndex: 10,
                          background: me.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #0891b2, #06b6d4)',
                          boxShadow: '0 0 28px rgba(6,182,212,0.5), 0 0 60px rgba(6,182,212,0.2)',
                          border: '3px solid rgba(6,182,212,0.7)',
                          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }} onClick={() => setSelectedEcoPerson(selectedEcoPerson?.isMe ? null : me)}>
                          {me.avatarUrl ? (
                            <img src={me.avatarUrl} alt={me.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.5rem' }}>{meInitials}</span>
                          )}
                        </div>
                        {/* Center label below */}
                        <div style={{
                          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, 56px)',
                          textAlign: 'center', zIndex: 10, pointerEvents: 'none',
                        }}>
                          <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.78rem', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                            {(me.name || 'Yo').split(' ')[0]}
                          </div>
                          <div style={{ color: 'rgba(6,182,212,0.9)', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                            {me.position}
                          </div>
                        </div>

                        {/* Surrounding people nodes */}
                        {filteredOthers.map((person: any, idx: number) => {
                          const pos = getNodePos(idx, filteredOthers.length);
                          const isSelected = selectedEcoPerson?.id === person.id;
                          const nodeColor = person.role === 'mentor' ? '#06b6d4' : '#60A5FA';
                          const nodeSize = person.role === 'mentor' ? 66 : 56;
                          const personInitials = (person.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                          return (
                            <div key={person.id} style={{ position: 'absolute', left: `${pos.left}%`, top: `${pos.top}%`, transform: 'translate(-50%, -50%)', zIndex: isSelected ? 8 : 5 }}>
                              <button
                                type="button"
                                onClick={() => setSelectedEcoPerson(isSelected ? null : person)}
                                style={{
                                  width: nodeSize, height: nodeSize, borderRadius: 999,
                                  border: isSelected ? '3px solid #fff' : `2px solid ${nodeColor}`,
                                  background: person.avatarUrl ? '#111827' : 'rgba(17,24,39,0.92)',
                                  overflow: 'hidden', cursor: 'pointer', padding: 0,
                                  boxShadow: `0 0 18px ${nodeColor}55`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  // @ts-ignore
                                  '--eco-glow': nodeColor, animation: `ecoPulse ${4 + (idx % 3)}s ease-in-out infinite`,
                                }}
                                title={`${person.name} (${person.position})`}
                              >
                                {person.avatarUrl ? (
                                  <img src={person.avatarUrl} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 999 }} />
                                ) : (
                                  <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.72rem' }}>{personInitials}</span>
                                )}
                              </button>
                              <div style={{ textAlign: 'center', marginTop: 4, pointerEvents: 'none' }}>
                                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.62rem', textShadow: '0 1px 6px rgba(0,0,0,0.7)', whiteSpace: 'nowrap' }}>
                                  {person.name.split(' ')[0]}
                                </div>
                                <div style={{ color: nodeColor, fontWeight: 600, fontSize: '0.56rem', opacity: 0.9 }}>
                                  {person.role === 'mentor' ? 'Mentor' : 'Mentee'}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Legend */}
                        <div style={{ position: 'absolute', left: 16, bottom: 16, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: '0.72rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}><span style={{ width: 10, height: 10, borderRadius: 999, background: '#06b6d4', display: 'inline-block' }} />Mentores ({mentors.length})</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 999, background: '#60A5FA', display: 'inline-block' }} />Mentees ({mentees.length})</div>
                        </div>

                        {/* Stats */}
                        <div style={{ position: 'absolute', right: 16, bottom: 16, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: '0.72rem' }}>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{others.length + 1}</div>
                          <div style={{ opacity: 0.8 }}>nodos</div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: 4 }}>{filteredOthers.length}</div>
                          <div style={{ opacity: 0.8 }}>conexiones</div>
                        </div>
                      </div>

                      {/* Insights panel */}
                      {showEcosystemInsights && (
                        <aside style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.28)', padding: 16, color: '#fff' }}>
                          {selectedEcoPerson ? (
                            <>
                              <button onClick={() => setSelectedEcoPerson(null)} style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '0.72rem', marginBottom: 10 }}>
                                ← Volver
                              </button>
                              <div style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.06)' }}>
                                {/* Profile photo in insights */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                  <div style={{
                                    width: 52, height: 52, borderRadius: 999, overflow: 'hidden', flexShrink: 0,
                                    background: selectedEcoPerson.avatarUrl ? '#111' : 'linear-gradient(135deg,#0891b2,#06b6d4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: `2px solid ${selectedEcoPerson.role === 'mentor' ? '#06b6d4' : '#60A5FA'}`,
                                  }}>
                                    {selectedEcoPerson.avatarUrl ? (
                                      <img src={selectedEcoPerson.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.82rem' }}>
                                        {(selectedEcoPerson.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedEcoPerson.name}</div>
                                    <div style={{ fontSize: '0.72rem', opacity: 0.75

 }}>{selectedEcoPerson.email}</div>
                                    {selectedEcoPerson.headline && (
                                      <div style={{ fontSize: '0.72rem', color: '#06b6d4', marginTop: 2 }}>{selectedEcoPerson.headline}</div>
                                    )}
                                  </div>
                                </div>
                                <div style={{ fontSize: '0.75rem' }}>{selectedEcoPerson.position}</div>
                                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
                                    <div style={{ fontSize: '0.66rem', opacity: 0.7 }}>Influencia</div>
                                    <div style={{ fontWeight: 800 }}>{selectedEcoPerson.influence}%</div>
                                  </div>
                                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
                                    <div style={{ fontSize: '0.66rem', opacity: 0.7 }}>Rol</div>
                                    <div style={{ fontWeight: 800 }}>{selectedEcoPerson.isMe ? 'Tú' : (selectedEcoPerson.role === 'mentor' ? 'Mentor' : 'Mentee')}</div>
                                  </div>
                                </div>
                                {selectedEcoPerson.isMe && (
                                  <div style={{ marginTop: 12, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 8, padding: 10, fontSize: '0.72rem' }}>
                                    Estás al centro de tu red de influencia. Conectas con {others.length} persona{others.length !== 1 ? 's' : ''} en este programa.
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 4 }}>Insights</div>
                              <div style={{ fontSize: '0.74rem', opacity: 0.75, marginBottom: 12 }}>Tu ecosistema de influencia</div>

                              {/* Mini profile card */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{
                                  width: 38, height: 38, borderRadius: 999, overflow: 'hidden', flexShrink: 0,
                                  background: me.avatarUrl ? '#111' : 'linear-gradient(135deg,#0891b2,#06b6d4)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: '2px solid #06b6d4',
                                }}>
                                  {me.avatarUrl ? (
                                    <img src={me.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}>{meInitials}</span>
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>{me.name}</div>
                                  <div style={{ fontSize: '0.66rem', opacity: 0.7 }}>{me.position} · {companyName || 'Inspiratoria'}</div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.14)', borderRadius: 10, padding: 10 }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>Tu Red</div>
                                  <div style={{ fontSize: '0.74rem', marginTop: 4, opacity: 0.9 }}>
                                    Conectas con {mentors.length} mentor{mentors.length !== 1 ? 'es' : ''} y {mentees.length} mentee{mentees.length !== 1 ? 's' : ''} en este programa.
                                  </div>
                                </div>
                                <div style={{ border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.14)', borderRadius: 10, padding: 10 }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>Atención</div>
                                  <div style={{ fontSize: '0.74rem', marginTop: 4, opacity: 0.9 }}>
                                    {others.length === 0 ? 'Aún no hay otros participantes en tu red.' : 'Mantener balance mentor/mentee para escalar tu impacto.'}
                                  </div>
                                </div>
                                <div style={{ border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.14)', borderRadius: 10, padding: 10 }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>Oportunidad</div>
                                  <div style={{ fontSize: '0.74rem', marginTop: 4, opacity: 0.9 }}>Profundizar conexiones con perfiles complementarios a tu experiencia.</div>
                                </div>
                              </div>

                              {/* People list */}
                              {others.length > 0 && (
                                <div style={{ marginTop: 14 }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: 8 }}>Personas en tu red</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                                    {others.map((p: any) => (
                                      <button key={p.id} onClick={() => setSelectedEcoPerson(p)} style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', width: '100%', textAlign: 'left',
                                      }}>
                                        <div style={{
                                          width: 28, height: 28, borderRadius: 999, overflow: 'hidden', flexShrink: 0,
                                          background: p.avatarUrl ? '#111' : (p.role === 'mentor' ? '#0891b2' : '#3b82f6'),
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                          {p.avatarUrl ? (
                                            <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                          ) : (
                                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.56rem' }}>{(p.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                                          )}
                                        </div>
                                        <div>
                                          <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.72rem' }}>{p.name}</div>
                                          <div style={{ color: p.role === 'mentor' ? '#06b6d4' : '#60A5FA', fontSize: '0.6rem' }}>{p.position}</div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </aside>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}

        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: PROGRESS
  // ══════════════════════════════════════════════════════════════════════════
  const renderProgress = () => {
    const mp = activeProgram;
    if (!mp) return <div className="empty-state">Selecciona un programa para ver el progreso</div>;
    if (loadingDetail) return <div className="empty-state">Cargando progreso...</div>;

    const modules = programTemplate?.modules || [];
    const milestones = programTemplate?.milestones || [];
    const activities = programDetail?.activities || mp.activities || [];
    const durationStr = programTemplate?.duration || '2 meses';
    const heroGradient = THEME_GRADIENTS[mp.theme] || THEME_GRADIENTS.leadership;

    // ── Calculate program timeline ──
    const durationMatch = durationStr.match(/(\d+)/);
    const durationMonths = durationMatch ? parseInt(durationMatch[1]) : 2;
    const totalWeeks = durationMonths * 4;

    // Simulate a start date (use joined_at or created_at or 30 days ago)
    const startDate = new Date(mp.joined_at || mp.created_at || Date.now() - 30 * 24 * 3600 * 1000);
    const endDate = new Date(startDate.getTime() + durationMonths * 30 * 24 * 3600 * 1000);
    const now = new Date();
    const elapsedMs = Math.max(0, now.getTime() - startDate.getTime());
    const totalMs = endDate.getTime() - startDate.getTime();
    const overallProgressRaw = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;
    const overallProgress = Math.round(overallProgressRaw);

    // Days remaining
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 3600 * 1000)));
    const daysPassed = Math.max(0, Math.ceil(elapsedMs / (24 * 3600 * 1000)));
    const currentWeek = Math.min(totalWeeks, Math.max(1, Math.ceil(daysPassed / 7)));

    // Module progress based on timeline position
    const weeksPerModule = modules.length > 0 ? totalWeeks / modules.length : totalWeeks;
    const moduleStatuses = modules.map((_m: any, idx: number) => {
      const moduleStartWeek = idx * weeksPerModule;
      const moduleEndWeek = (idx + 1) * weeksPerModule;
      if (currentWeek > moduleEndWeek) return { status: 'completed' as const, progress: 100 };
      if (currentWeek >= moduleStartWeek && currentWeek <= moduleEndWeek) {
        const pct = weeksPerModule > 0 ? Math.round(((currentWeek - moduleStartWeek) / weeksPerModule) * 100) : 0;
        return { status: 'active' as const, progress: Math.min(100, Math.max(5, pct)) };
      }
      return { status: 'locked' as const, progress: 0 };
    });

    const completedModules = moduleStatuses.filter(m => m.status === 'completed').length;
    const completedActivities = activities.filter((a: any) => a.status === 'completed').length;

    // Build timeline items: interleave modules with milestones at correct positions
    type TLItem = { type: 'module'; mod: any; idx: number; status: any } | { type: 'milestone'; ms: any; idx: number };
    const timelineItems: TLItem[] = [];
    let milestonesCopy = [...milestones].sort((a: any, b: any) => (a.week || 0) - (b.week || 0));

    modules.forEach((mod: any, idx: number) => {
      const moduleWeek = Math.round(idx * weeksPerModule) + 1;
      // Insert any milestones that occur before this module's week
      while (milestonesCopy.length > 0 && (milestonesCopy[0].week || 0) <= moduleWeek) {
        timelineItems.push({ type: 'milestone', ms: milestonesCopy.shift(), idx: timelineItems.length });
      }
      timelineItems.push({ type: 'module', mod, idx, status: moduleStatuses[idx] });
    });
    // Any remaining milestones
    milestonesCopy.forEach(ms => timelineItems.push({ type: 'milestone', ms, idx: timelineItems.length }));

    // Weekly calendar data
    const weeks = Array.from({ length: totalWeeks }, (_, i) => {
      const weekNum = i + 1;
      const weekProgress = weekNum < currentWeek ? 100 : weekNum === currentWeek ? Math.round(((daysPassed % 7) / 7) * 100) : 0;
      const weekMilestones = milestones.filter((ms: any) => ms.week === weekNum);
      const hasActivity = activities.some((_a: any, ai: number) => (ai % totalWeeks) + 1 === weekNum);
      return { weekNum, progress: weekProgress, milestones: weekMilestones, hasActivity, isCurrent: weekNum === currentWeek };
    });

    // Next milestone
    const nextMilestone = milestones.find((ms: any) => (ms.week || 0) >= currentWeek);

    return (
      <>
        {/* Mini context bar */}
        <div style={{ background: heroGradient, padding: '16px 36px', margin: '-32px -32px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="pd-back" onClick={() => navigate('my-program')} style={{ margin: 0, fontSize: '0.72rem', padding: '5px 12px' }}>
            &larr; {mp.name}
          </button>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>|</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Progreso del Programa</span>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', marginLeft: 'auto' }}>
            Semana {currentWeek} de {totalWeeks} &middot; {roleLabel}
          </span>
        </div>

        {/* Overall progress bar */}
        <div className="prg-overall">
          <div className="prg-overall-top">
            <div>
              <div className="prg-overall-label">Progreso general del programa</div>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{mp.name}</div>
            </div>
            <div className="prg-overall-pct">{overallProgress}%</div>
          </div>
          <div className="prg-bar-track">
            <div className="prg-bar-fill" style={{
              width: `${overallProgress}%`,
              background: overallProgress >= 75 ? 'linear-gradient(90deg, #10b981, #34d399)' : overallProgress >= 40 ? 'linear-gradient(90deg, #0891b2, #06b6d4)' : 'linear-gradient(90deg, #6366f1, #818cf8)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.7rem', color: '#9ca3af' }}>
            <span>Inicio: {startDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>Fin: {endDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="prg-stats">
          {[
            { svg: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563eb" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, bg: '#dbeafe', val: `${completedModules}/${modules.length}`, label: 'Módulos completados', color: '#2563eb' },
            { svg: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, bg: '#fef3c7', val: `${daysRemaining}`, label: 'Días restantes', color: '#d97706' },
            { svg: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, bg: '#d1fae5', val: `${completedActivities}/${activities.length}`, label: 'Actividades', color: '#059669' },
            { svg: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#db2777" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, bg: '#fce7f3', val: nextMilestone ? `Sem ${nextMilestone.week}` : '—', label: nextMilestone ? nextMilestone.name : 'Sin hitos pendientes', color: '#db2777' },
          ].map((s, i) => (
            <div key={i} className="prg-stat">
              <div className="prg-stat-icon" style={{ background: s.bg }}>
                {s.svg}
              </div>
              <div className="prg-stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="prg-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="prg-grid">
          {/* LEFT: Timeline roadmap */}
          <div className="prg-timeline">
            <div className="prg-timeline-head">
              <div className="prg-timeline-title">Roadmap del Programa</div>
              <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>Semana {currentWeek} / {totalWeeks}</span>
            </div>
            <div className="prg-timeline-body">
              {timelineItems.length === 0 ? (
                <div className="empty-state">Sin contenido de programa</div>
              ) : (
                timelineItems.map((item, i) => {
                  if (item.type === 'milestone') {
                    const ms = item.ms;
                    const isPast = (ms.week || 0) < currentWeek;
                    return (
                      <div key={`ms-${i}`} className="prg-tl-milestone">
                        <div className="prg-tl-ms-node" style={isPast ? { background: '#d1fae5', borderColor: '#10b981' } : {}}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={isPast ? { color: '#10b981' } : {}}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                          </svg>
                        </div>
                        <div className="prg-tl-content">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hito — Semana {ms.week}</span>
                            {isPast && <span className="prg-tl-badge done">✓ Alcanzado</span>}
                          </div>
                          <div className="prg-tl-name" style={{ color: isPast ? '#065f46' : '#92400e' }}>{ms.name}</div>
                          {ms.description && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{ms.description}</div>}
                          {ms.deliverable && (
                            <div style={{ marginTop: 6, fontSize: '0.72rem', padding: '6px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e', fontWeight: 500 }}>
                              Entregable: {ms.deliverable}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Module item
                  const { mod, idx, status } = item;
                  const st = status.status;
                  const pct = status.progress;
                  return (
                    <div key={`mod-${idx}`} className={`prg-tl-item ${st}`}>
                      <div className={`prg-tl-node ${st}`}>
                        {st === 'completed' ? (
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : st === 'active' ? (
                          <span>{idx + 1}</span>
                        ) : (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        )}
                      </div>
                      <div className="prg-tl-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <div className="prg-tl-name" style={{ opacity: st === 'locked' ? 0.5 : 1 }}>
                            {mod.name}
                          </div>
                          <span className={`prg-tl-badge ${st === 'completed' ? 'done' : st === 'active' ? 'current' : 'pending'}`}>
                            {st === 'completed' ? 'Completado' : st === 'active' ? 'En curso' : 'Bloqueado'}
                          </span>
                        </div>
                        <div className="prg-tl-meta" style={{ opacity: st === 'locked' ? 0.4 : 1 }}>
                          {mod.duration && <span>{mod.duration}</span>}
                          <span>{mod.sessions || 0} sesiones</span>
                          <span>{mod.resources?.length || 0} recursos</span>
                        </div>
                        {(st === 'active' || st === 'completed') && (
                          <div className="prg-tl-progress">
                            <div className="prg-tl-progress-fill" style={{
                              width: `${pct}%`,
                              background: st === 'completed' ? '#10b981' : 'linear-gradient(90deg, #0891b2, #06b6d4)',
                            }} />
                          </div>
                        )}
                        {st === 'active' && (
                          <div style={{ fontSize: '0.7rem', color: '#0891b2', fontWeight: 600, marginTop: 4 }}>{pct}% completado</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Sidebar panels */}
          <div className="prg-panel">
            {/* Weekly calendar */}
            <div className="prg-card">
              <div className="prg-card-head">
                <div className="prg-card-title">Calendario Semanal</div>
                <span style={{ fontSize: '0.66rem', color: '#9ca3af', fontWeight: 600 }}>{totalWeeks} semanas</span>
              </div>
              <div className="prg-card-body" style={{ maxHeight: 280, overflowY: 'auto' }}>
                {weeks.map(w => (
                  <div key={w.weekNum} className="prg-cal-week" style={w.isCurrent ? { background: '#f0f9ff', borderRadius: 8, padding: '8px 6px', margin: '2px -6px' } : {}}>
                    <div className="prg-cal-wk" style={w.isCurrent ? { color: '#0891b2', fontWeight: 800 } : {}}>
                      S{w.weekNum} {w.isCurrent && '→'}
                    </div>
                    <div className="prg-cal-bar">
                      <div className="prg-cal-fill" style={{
                        width: `${w.progress}%`,
                        background: w.progress === 100 ? '#10b981' : w.isCurrent ? '#0891b2' : '#d1d5db',
                      }} />
                    </div>
                    <div className="prg-cal-dots">
                      {w.milestones.map((_ms: any, mi: number) => (
                        <div key={mi} className="prg-cal-dot" style={{ background: '#f59e0b' }} title={_ms.name} />
                      ))}
                      {w.hasActivity && <div className="prg-cal-dot" style={{ background: '#6366f1' }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activities feed */}
            <div className="prg-card">
              <div className="prg-card-head">
                <div className="prg-card-title">Actividades</div>
                <span style={{ fontSize: '0.66rem', color: '#9ca3af', fontWeight: 600 }}>{activities.length}</span>
              </div>
              <div className="prg-card-body">
                {activities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: '0.78rem' }}>Sin actividades</div>
                ) : (
                  activities.map((a: any, i: number) => {
                    const isDone = a.status === 'completed';
                    return (
                      <div key={i} className="prg-act-item">
                        <div className="prg-act-icon" style={{ background: isDone ? '#d1fae5' : '#dbeafe', color: isDone ? '#059669' : '#2563eb' }}>
                          {isDone ? '✓' : '○'}
                        </div>
                        <div className="prg-act-info">
                          <div className="prg-act-name">{a.name}</div>
                          <div className="prg-act-sub">
                            {LABELS.actType[a.activity_type || a.type] || a.type || '—'} &middot; {LABELS.modality[a.modality] || a.modality || '—'}
                          </div>
                        </div>
                        <span className="prg-act-status" style={{
                          background: isDone ? '#d1fae5' : a.status === 'active' ? '#dbeafe' : '#f3f4f6',
                          color: isDone ? '#065f46' : a.status === 'active' ? '#1d4ed8' : '#6b7280',
                        }}>
                          {LABELS.status[a.status] || a.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Program info mini-card */}
            <div className="prg-card">
              <div className="prg-card-head">
                <div className="prg-card-title">Resumen</div>
              </div>
              <div className="prg-card-body" style={{ fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8f8f8' }}>
                  <span style={{ color: '#6b7280' }}>Duración</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{durationStr}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8f8f8' }}>
                  <span style={{ color: '#6b7280' }}>Semanas totales</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{totalWeeks}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8f8f8' }}>
                  <span style={{ color: '#6b7280' }}>Días transcurridos</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{daysPassed}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8f8f8' }}>
                  <span style={{ color: '#6b7280' }}>Sesiones totales</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{totalSessions}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: '#6b7280' }}>Participantes</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{programParticipants.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // ── Profile helpers ──
  const startEditProfile = () => {
    setProfileForm({
      full_name: portalUser?.full_name || '',
      phone: portalUser?.phone || '',
      position: portalUser?.position || '',
      department: portalUser?.department || '',
      linkedin_url: portalUser?.linkedin_url || '',
      bio: portalUser?.bio || '',
      headline: portalUser?.headline || '',
      skills: Array.isArray(portalUser?.skills) ? [...portalUser.skills] : [],
    });
    setProfileEditing(true);
    setProfileMsg('');
  };

  const cancelEditProfile = () => {
    setProfileEditing(false);
    setProfileMsg('');
  };

  const saveProfile = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const res = await fetch(`${API_URL}/api/companies/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al guardar');
      }
      const updated = await res.json();
      setPortalUser((prev: any) => ({ ...prev, ...updated }));
      setProfileEditing(false);
      setProfileMsg('ok:Perfil actualizado correctamente');
    } catch (e: any) {
      setProfileMsg('err:' + (e.message || 'Error al guardar'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setProfileMsg('err:La imagen no puede superar 2 MB'); return; }
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setAvatarUploading(true);
    setProfileMsg('');
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch(`${API_URL}/api/companies/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      setPortalUser((prev: any) => ({ ...prev, avatar_url: data.avatar_url }));
      setProfileMsg('ok:Foto actualizada');
    } catch (e: any) {
      setProfileMsg('err:' + (e.message || 'Error al subir'));
    } finally {
      setAvatarUploading(false);
    }
  };

  const deleteAvatar = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setAvatarUploading(true);
    try {
      await fetch(`${API_URL}/api/companies/auth/avatar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortalUser((prev: any) => ({ ...prev, avatar_url: null }));
      setProfileMsg('ok:Foto eliminada');
    } catch {
      setProfileMsg('err:Error al eliminar foto');
    } finally {
      setAvatarUploading(false);
    }
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s || profileForm.skills.includes(s) || profileForm.skills.length >= 20) return;
    setProfileForm(f => ({ ...f, skills: [...f.skills, s] }));
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    setProfileForm(f => ({ ...f, skills: f.skills.filter(sk => sk !== skill) }));
  };

  const initials = (portalUser?.full_name || portalUser?.email || 'U')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const renderProfile = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Mi Perfil</h1>
        <p className="dash-subtitle">{roleLabel} en {companyName || 'Inspiratoria'}</p>
      </div>

      {profileMsg && (
        <div className={`prof-msg ${profileMsg.startsWith('ok:') ? 'prof-msg-ok' : 'prof-msg-err'}`}>
          {profileMsg.replace(/^(ok:|err:)/, '')}
        </div>
      )}

      <div className="prof-grid">
        {/* ── Left: Avatar Card ── */}
        <div className="prof-avatar-card">
          <div className="prof-avatar">
            {portalUser?.avatar_url ? (
              <img src={portalUser.avatar_url} alt="Avatar" />
            ) : (
              initials
            )}
            <label className="prof-avatar-overlay" htmlFor="avatar-upload">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </label>
            <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </div>
          <div className="prof-avatar-name">{portalUser?.full_name || displayName}</div>
          <div className="prof-avatar-role">{roleLabel}</div>
          {portalUser?.headline && !profileEditing && (
            <div style={{ fontSize: '0.78rem', color: '#4b5563', marginBottom: 12 }}>{portalUser.headline}</div>
          )}
          {avatarUploading ? (
            <button className="prof-avatar-btn" disabled>Subiendo...</button>
          ) : (
            <>
              <label htmlFor="avatar-upload" className="prof-avatar-btn" style={{ cursor: 'pointer', textAlign: 'center', display: 'block', marginBottom: 6 }}>
                Cambiar foto
              </label>
              {portalUser?.avatar_url && (
                <button className="prof-avatar-btn" onClick={deleteAvatar} style={{ color: '#ef4444', borderColor: '#fecaca' }}>Eliminar foto</button>
              )}
            </>
          )}

          {/* Read-only info */}
          <div style={{ width: '100%', marginTop: 18, borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 8 }}>Información</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>Email:</span> {portalUser?.email || '—'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
              <span style={{ fontWeight: 600 }}>Portal:</span>{' '}
              <span style={{ fontFamily: 'monospace' }}>{portalCode}</span>
            </div>
            {portalUser?.created_at && (
              <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                <span style={{ fontWeight: 600 }}>Miembro desde:</span>{' '}
                {new Date(portalUser.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Form Card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="prof-form-card">
            <div className="prof-form-head">
              <span className="prof-form-title">Datos Personales</span>
              {!profileEditing && (
                <button className="prof-btn-edit" onClick={startEditProfile}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
              )}
            </div>
            <div className="prof-form-body">
              {profileEditing ? (
                <>
                  <div className="prof-form-grid">
                    <div className="prof-field">
                      <label>Nombre completo</label>
                      <input value={profileForm.full_name} onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Tu nombre completo" />
                    </div>
                    <div className="prof-field">
                      <label>Titular / Headline</label>
                      <input value={profileForm.headline} onChange={e => setProfileForm(f => ({ ...f, headline: e.target.value }))} placeholder="Ej: Mentor de innovación" maxLength={200} />
                    </div>
                    <div className="prof-field">
                      <label>Teléfono</label>
                      <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+56 9 1234 5678" />
                    </div>
                    <div className="prof-field">
                      <label>Cargo / Posición</label>
                      <input value={profileForm.position} onChange={e => setProfileForm(f => ({ ...f, position: e.target.value }))} placeholder="Ej: Director de tecnología" />
                    </div>
                    <div className="prof-field">
                      <label>Departamento / Área</label>
                      <input value={profileForm.department} onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))} placeholder="Ej: Innovación" />
                    </div>
                    <div className="prof-field">
                      <label>Perfil LinkedIn</label>
                      <input type="url" value={profileForm.linkedin_url} onChange={e => setProfileForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://www.linkedin.com/in/tu-perfil" />
                      <span className="prof-hint">URL completa de tu perfil de LinkedIn</span>
                    </div>
                    <div className="prof-field full">
                      <label>Biografía</label>
                      <textarea value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} placeholder="Cuéntanos sobre tu experiencia, trayectoria y áreas de expertise…" maxLength={1000} rows={4} />
                      <span className="prof-hint">{profileForm.bio.length}/1000 caracteres</span>
                    </div>
                    <div className="prof-field full">
                      <label>Habilidades / Áreas de expertise</label>
                      <div className="prof-skills-list">
                        {profileForm.skills.map(sk => (
                          <span key={sk} className="prof-skill-tag">
                            {sk}
                            <button onClick={() => removeSkill(sk)} aria-label={`Quitar ${sk}`}>&times;</button>
                          </span>
                        ))}
                      </div>
                      <div className="prof-skill-add">
                        <input
                          value={newSkill}
                          onChange={e => setNewSkill(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                          placeholder="Agregar habilidad…"
                          maxLength={50}
                        />
                        <button type="button" onClick={addSkill}>Agregar</button>
                      </div>
                      <span className="prof-hint">{profileForm.skills.length}/20 habilidades · Presiona Enter para agregar</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="prof-form-grid">
                  <div className="prof-field">
                    <label>Nombre completo</label>
                    <input disabled value={portalUser?.full_name || '—'} />
                  </div>
                  <div className="prof-field">
                    <label>Titular / Headline</label>
                    <input disabled value={portalUser?.headline || '—'} />
                  </div>
                  <div className="prof-field">
                    <label>Teléfono</label>
                    <input disabled value={portalUser?.phone || '—'} />
                  </div>
                  <div className="prof-field">
                    <label>Cargo / Posición</label>
                    <input disabled value={portalUser?.position || '—'} />
                  </div>
                  <div className="prof-field">
                    <label>Departamento / Área</label>
                    <input disabled value={portalUser?.department || '—'} />
                  </div>
                  <div className="prof-field">
                    <label>Perfil LinkedIn</label>
                    {portalUser?.linkedin_url ? (
                      <a href={portalUser.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#0891b2', textDecoration: 'none' }}>
                        {portalUser.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '') || portalUser.linkedin_url}
                      </a>
                    ) : (
                      <input disabled value="—" />
                    )}
                  </div>
                  <div className="prof-field full">
                    <label>Biografía</label>
                    <textarea disabled value={portalUser?.bio || 'Sin biografía'} rows={3} />
                  </div>
                  {portalUser?.skills?.length > 0 && (
                    <div className="prof-field full">
                      <label>Habilidades</label>
                      <div className="prof-skills-list">
                        {portalUser.skills.map((sk: string) => (
                          <span key={sk} className="prof-skill-tag">{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {profileEditing && (
              <div className="prof-actions">
                <button className="prof-btn-cancel" onClick={cancelEditProfile} disabled={profileSaving}>Cancelar</button>
                <button className="prof-btn-save" onClick={saveProfile} disabled={profileSaving}>
                  {profileSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </div>

          {/* Programs card */}
          {myPrograms.length > 0 && (
            <div className="prof-form-card">
              <div className="prof-form-head">
                <span className="prof-form-title">Mis Programas</span>
              </div>
              <div className="prof-form-body">
                {myPrograms.map((mp: any) => (
                  <div key={mp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>{mp.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{ROLE_LABELS[mp.my_role] || mp.my_role}</div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                      {mp.joined_at ? new Date(mp.joined_at).toLocaleDateString('es-CL') : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  // ── Badge icon mapping ──
  const badgeIcons: Record<string, JSX.Element> = {
    people: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.208V17a6.003 6.003 0 017.212-5.876c.09.019.176.045.262.076M15 19.128a6.002 6.002 0 00-4-5.659M12 6a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    program: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
    clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
    link: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.856-2.07a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.07 8.811" /></svg>,
    ecosystem: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
    skills: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
    fire: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" /></svg>,
    shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
    trophy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.318 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.852m0 0a6.023 6.023 0 01-2.77-.852" /></svg>,
  };

  // Tier accent colors — subtle, only for the small dot/pill
  const tierAccent: Record<number, string> = { 0: '#cbd5e1', 1: '#d97706', 2: '#64748b', 3: '#eab308' };
  const tierLabel: Record<number, string> = { 0: '', 1: 'Bronce', 2: 'Plata', 3: 'Oro' };
  const tierPillBg: Record<number, string> = { 0: 'transparent', 1: '#fef3c7', 2: '#f1f5f9', 3: '#fef9c3' };
  const tierPillText: Record<number, string> = { 0: '#94a3b8', 1: '#b45309', 2: '#475569', 3: '#a16207' };

  const renderBadges = () => {
    if (badgesLoading) return <div className="empty-state">Cargando insignias...</div>;
    if (!badgesData) return <div className="empty-state">No se pudieron cargar las insignias</div>;

    const { badges, summary } = badgesData;
    const globalPct = Math.round(summary.tier_points / summary.max_tier_points * 100);
    const earnedBadges = badges.filter((b: any) => b.earned);
    const lockedBadges = badges.filter((b: any) => !b.earned);

    return (
      <div className="bdg-page">
        {/* Header */}
        <div className="bdg-header">
          <h2 className="bdg-title">Insignias</h2>
          <p className="bdg-subtitle">{summary.earned} de {summary.total_badges} desbloqueadas</p>
        </div>

        {/* Overview */}
        <div className="bdg-overview">
          {/* Circular level indicator */}
          <div className="bdg-overview-level">
            <div className="bdg-overview-level-ring">
              <svg viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="32" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle cx="36" cy="36" r="32" fill="none" stroke="#6366f1" strokeWidth="4"
                  strokeDasharray={`${globalPct * 2.01} 201`}
                  strokeLinecap="round"
                  transform="rotate(-90 36 36)"
                  style={{ transition: 'stroke-dasharray 0.6s ease' }} />
              </svg>
              <span className="bdg-ring-text">{globalPct}%</span>
            </div>
            <div className="bdg-overview-level-name">{summary.level}</div>
          </div>

          {/* Stats row */}
          <div className="bdg-overview-stats">
            <div className="bdg-os">
              <div className="bdg-os-value">{summary.earned}<span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>/{summary.total_badges}</span></div>
              <div className="bdg-os-label">Insignias activas</div>
              <div className="bdg-os-bar"><div className="bdg-os-bar-fill" style={{ width: `${Math.round(summary.earned / summary.total_badges * 100)}%`, background: '#6366f1' }} /></div>
            </div>
            <div className="bdg-os">
              <div className="bdg-os-value">{summary.tier_points}<span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>/{summary.max_tier_points}</span></div>
              <div className="bdg-os-label">Puntos de tier</div>
              <div className="bdg-os-bar"><div className="bdg-os-bar-fill" style={{ width: `${globalPct}%`, background: '#6366f1' }} /></div>
            </div>
            <div className="bdg-os">
              <div className="bdg-os-value">{summary.locked}</div>
              <div className="bdg-os-label">Por desbloquear</div>
              <div className="bdg-os-bar"><div className="bdg-os-bar-fill" style={{ width: `${Math.round(summary.locked / summary.total_badges * 100)}%`, background: '#e2e8f0' }} /></div>
            </div>
          </div>
        </div>

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <>
            <div className="bdg-section-label">Desbloqueadas</div>
            <div className="bdg-grid" style={{ marginBottom: 28 }}>
              {earnedBadges.map((b: any) => {
                const nextTier = b.tiers.find((t: any) => t.threshold > b.current_value);
                const nextThreshold = nextTier ? nextTier.threshold : (b.tiers[b.tiers.length - 1]?.threshold || 1);
                const progressToNext = nextTier ? Math.min(100, Math.round(b.current_value / nextThreshold * 100)) : 100;
                return (
                  <div key={b.id} className="bdg-card bdg-earned">
                    <div className="bdg-card-left" style={{ color: tierPillText[b.tier] || '#94a3b8' }}>
                      {badgeIcons[b.icon] || badgeIcons.trophy}
                    </div>
                    <div className="bdg-card-body">
                      <div className="bdg-card-top">
                        <div className="bdg-card-name">{b.name}</div>
                        {b.tier > 0 && <span className="bdg-card-tier" style={{ background: tierPillBg[b.tier], color: tierPillText[b.tier] }}>{tierLabel[b.tier]}</span>}
                      </div>
                      <div className="bdg-card-desc">{b.description}</div>
                      <div className="bdg-card-progress">
                        <div className="bdg-card-bar"><div className="bdg-card-bar-fill" style={{ width: `${progressToNext}%`, background: tierAccent[b.tier] || '#334155' }} /></div>
                        <div className="bdg-card-pct">{b.current_value}/{nextThreshold}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Locked badges */}
        {lockedBadges.length > 0 && (
          <>
            <div className="bdg-section-label">Por desbloquear</div>
            <div className="bdg-grid">
              {lockedBadges.map((b: any) => {
                const firstTier = b.tiers[0];
                const progressToFirst = firstTier ? Math.min(100, Math.round(b.current_value / firstTier.threshold * 100)) : 0;
                return (
                  <div key={b.id} className="bdg-card bdg-locked">
                    <div className="bdg-card-left" style={{ color: '#cbd5e1' }}>
                      {badgeIcons[b.icon] || badgeIcons.trophy}
                    </div>
                    <div className="bdg-card-body">
                      <div className="bdg-card-top">
                        <div className="bdg-card-name">{b.name}</div>
                      </div>
                      <div className="bdg-card-desc">{b.description}</div>
                      <div className="bdg-card-progress">
                        <div className="bdg-card-bar"><div className="bdg-card-bar-fill" style={{ width: `${progressToFirst}%`, background: '#cbd5e1' }} /></div>
                        <div className="bdg-card-pct">{b.current_value}/{firstTier?.threshold || '?'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER CHAT — Gmail-style real-time messaging
  // ══════════════════════════════════════════════════════════════════════════
  const formatChatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const chatDateGroup = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Hoy';
    const y = new Date(now); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const renderChat = () => {
    const fileIcon = <svg className="cht-msg-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;

    const avatarSrc = (url: string) => {
      if (!url) return '';
      if (url.startsWith('data:') || url.startsWith('http')) return url;
      return `${API_URL}${url}`;
    };

    let lastDate = '';

    return (
      <div className="cht-page">
        {/* Left — Sidebar with tabs */}
        <div className="cht-sidebar">
          <div className="cht-sidebar-head">
            <div className="cht-sidebar-title">💬 Chat</div>
            <div className="cht-sidebar-sub">{chatPrograms.length} programa{chatPrograms.length !== 1 ? 's' : ''} · {chatParticipants.length} persona{chatParticipants.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="cht-sidebar-tabs">
            <button className={`cht-sidebar-tab${chatSidebarTab === 'chats' ? ' active' : ''}`} onClick={() => setChatSidebarTab('chats')}>
              <svg style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px', marginRight: 5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Chats
            </button>
            <button className={`cht-sidebar-tab${chatSidebarTab === 'people' ? ' active' : ''}`} onClick={() => setChatSidebarTab('people')}>
              <svg style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px', marginRight: 5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Personas ({chatParticipants.length})
            </button>
          </div>

          {chatSidebarTab === 'chats' ? (
            <div className="cht-program-list">
              {chatPrograms.map((p: any) => (
                <div
                  key={p.id}
                  className={`cht-program-item${chatActiveProgram?.id === p.id ? ' active' : ''}`}
                  onClick={() => { setChatActiveProgram(p); setChatSidebarTab('chats'); }}
                >
                  <div className="cht-program-avatar">{p.name.charAt(0)}</div>
                  <div className="cht-program-info">
                    <div className="cht-program-name">{p.name}</div>
                    <div className="cht-program-last">
                      {p.last_message ? `${p.last_message.sender_name}: ${p.last_message.content}` : 'Sin mensajes aún'}
                    </div>
                  </div>
                  <div className="cht-program-meta">
                    {p.last_message && <div className="cht-program-time">{formatChatTime(p.last_message.created_at)}</div>}
                    {p.unread_count > 0 && <div className="cht-program-badge">{p.unread_count}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="cht-people-list">
              {chatParticipants.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#8e99a4', fontSize: '0.78rem' }}>
                  {chatActiveProgram ? 'No hay participantes' : 'Selecciona un programa para ver los participantes'}
                </div>
              ) : (
                chatParticipants.map((p: any) => (
                  <div key={p.id} className="cht-person">
                    <div className="cht-person-avi">
                      {p.avatar ? <img src={avatarSrc(p.avatar)} alt="" /> : p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="cht-person-info">
                      <div className="cht-person-name">
                        {p.name}
                        {p.is_me && <span className="cht-person-you">Tú</span>}
                      </div>
                      <div className="cht-person-role">{p.role || 'Participante'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right — Chat window */}
        <div className="cht-main">
          {chatActiveProgram ? (
            <>
              {/* Header */}
              <div className="cht-main-head">
                <div className="cht-main-avatar">{chatActiveProgram.name.charAt(0)}</div>
                <div className="cht-main-info">
                  <div className="cht-main-name">{chatActiveProgram.name}</div>
                  <div className="cht-main-detail">{chatActiveProgram.participant_count} participante{chatActiveProgram.participant_count !== 1 ? 's' : ''} · {chatActiveProgram.my_role}</div>
                </div>
                <div className="cht-main-actions">
                  <button onClick={() => setChatSidebarTab('people')} title="Ver participantes">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="cht-messages" ref={chatMessagesRef}>
                {chatLoading ? (
                  <div className="cht-empty">
                    <div className="cht-empty-icon" style={{ animation: 'chtTyping 1.5s infinite' }}>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <div className="cht-empty-title">Cargando mensajes...</div>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="cht-empty">
                    <div className="cht-empty-icon">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <div className="cht-empty-title">¡Inicia la conversación!</div>
                    <div className="cht-empty-sub">Sé el primero en enviar un mensaje a este grupo. Los participantes recibirán tu mensaje al instante.</div>
                  </div>
                ) : (
                  chatMessages.map((m: any, idx: number) => {
                    const isMine = m.sender_id === chatUserId;
                    const dateLabel = chatDateGroup(m.created_at);
                    let showDate = false;
                    if (dateLabel !== lastDate) { showDate = true; lastDate = dateLabel; }
                    const prevMsg = idx > 0 ? chatMessages[idx - 1] : null;
                    const sameSender = prevMsg && prevMsg.sender_id === m.sender_id && !showDate;

                    if (m.is_system) {
                      return <div key={m.id} className="cht-system">{m.content}</div>;
                    }

                    return (
                      <div key={m.id}>
                        {showDate && <div className="cht-date-sep"><span>{dateLabel}</span></div>}
                        <div className={`cht-msg-group${isMine ? ' mine' : ''}`}>
                          {!sameSender ? (
                            <div className="cht-msg-avi">
                              {m.sender_avatar ? <img src={avatarSrc(m.sender_avatar)} alt="" /> : m.sender_name.charAt(0).toUpperCase()}
                            </div>
                          ) : <div style={{ width: 34, flexShrink: 0 }} />}
                          <div className="cht-msg-body">
                            {!sameSender && <div className="cht-msg-sender">{isMine ? 'Tú' : m.sender_name}</div>}
                            {m.content && <div className="cht-msg-bubble">{m.content}</div>}
                            {m.attachments && m.attachments.length > 0 && (
                              <div className="cht-msg-attachments">
                                {m.attachments.map((att: any, aidx: number) => (
                                  <a key={aidx} className="cht-msg-file" href={att.url.startsWith('http') ? att.url : `${API_URL}${att.url}`} target="_blank" rel="noopener noreferrer">
                                    {fileIcon}
                                    <span className="cht-msg-file-name">{att.name}</span>
                                    <span className="cht-msg-file-size">{formatFileSize(att.size)}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                            <div className="cht-msg-time">{formatChatTime(m.created_at)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Typing indicator */}
              <div className="cht-typing">
                {chatTyping.length > 0 && (
                  <>
                    <span className="cht-typing-dot" /><span className="cht-typing-dot" /><span className="cht-typing-dot" />
                    {' '}{chatTyping.join(', ')} {chatTyping.length === 1 ? 'está escribiendo' : 'están escribiendo'}...
                  </>
                )}
              </div>

              {/* Input */}
              <div className="cht-input-area">
                {chatAttachments.length > 0 && (
                  <div className="cht-input-attachments">
                    {chatAttachments.map((att, i) => (
                      <div key={i} className="cht-input-att">
                        <span>{att.name}</span>
                        <button onClick={() => setChatAttachments(prev => prev.filter((_, j) => j !== i))}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="cht-input-row">
                  <div className="cht-input-wrap">
                    <textarea
                      rows={1}
                      placeholder="Escribe un mensaje..."
                      value={chatInput}
                      onChange={e => { setChatInput(e.target.value); handleChatTyping(); }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                      onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }}
                    />
                    <div className="cht-input-btns">
                      <button className="cht-input-btn" onClick={() => chatFileRef.current?.click()} title="Adjuntar archivo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                      </button>
                    </div>
                  </div>
                  <button
                    className="cht-send-btn"
                    onClick={sendChatMessage}
                    disabled={chatSending || (!chatInput.trim() && chatAttachments.length === 0)}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                  </button>
                </div>
                <input ref={chatFileRef} type="file" multiple style={{ display: 'none' }} onChange={handleChatFileUpload} />
              </div>
            </>
          ) : (
            <div className="cht-no-chat">
              <div className="cht-no-chat-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4a5568' }}>Selecciona un programa</div>
              <div style={{ fontSize: '0.78rem', color: '#8e99a4', maxWidth: 260, textAlign: 'center', lineHeight: 1.5 }}>Elige un programa de la lista para comenzar a chatear con los participantes</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard': return renderDashboard();
      case 'my-program': return renderMyProgram();
      case 'my-progress': return renderProgress();
      case 'my-modules': return renderMyProgram();
      case 'my-activities': return renderMyProgram();
      case 'my-participants': return renderMyProgram();
      case 'my-milestones': return renderMyProgram();
      case 'my-ecosystem': return renderMyProgram();
      case 'my-profile': return renderProfile();
      case 'my-badges': return renderBadges();
      case 'my-chat': return renderChat();
      default: return renderDashboard();
    }
  };

  const currentNavLabel = navItems.flatMap(s => s.items).find(i => i.id === activeNav)?.label || 'Inicio';

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="p-layout">

        {/* SIDEBAR */}
        <aside
          className={`p-sidebar${sidebarExpanded ? ' expanded' : ''}`}
          style={{ width: sidebarExpanded ? SIDEBAR_W_EXPANDED : SIDEBAR_W_COLLAPSED }}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}>
          <div className="p-sidebar-header" style={{ justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: sidebarExpanded ? 12 : 0 }}>
            <Image src="/images/logo.png" alt="Inspiratoria" width={36} height={36} className="p-sidebar-logo-img" style={{ borderRadius: 10 }} />
            {sidebarExpanded && <span className="p-sidebar-logo-text" style={{ display: 'inline' }}>Inspiratoria</span>}
          </div>

          {activeProgram && (
            <div className="p-program-card">
              {sidebarExpanded && (
                <>
                  <div className="p-program-card-name">{activeProgram.name}</div>
                  <div className="p-program-card-meta">
                    <span>{activeProgram.activities?.length || 0} actividades</span>
                    <span>&middot;</span>
                    <span>{roleLabel}</span>
                  </div>
                </>
              )}
            </div>
          )}

          <nav className="p-nav">
            {navItems.map(section => (
              <div key={section.section} className="p-nav-section">
                {sidebarExpanded && <div className="p-nav-section-title" style={{ opacity: 1, height: 'auto' }}>{section.section}</div>}
                {section.items.map(item => (
                  <button key={item.id}
                    className={`p-nav-item ${activeNav === item.id ? 'active' : ''}`}
                    style={{ justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: sidebarExpanded ? 12 : 0, padding: sidebarExpanded ? '10px 14px' : '10px 0' }}
                    onClick={() => navigate(item.id)}>
                    <span className="nav-icon">{navIcons[item.icon] || navIcons.home}</span>
                    {sidebarExpanded && <span className="p-nav-label">{item.label}</span>}
                    {sidebarExpanded && item.count !== undefined && <span className="p-nav-count" style={{ display: 'inline-block' }}>{item.count}</span>}
                    {!sidebarExpanded && <span className="nav-tooltip">{item.label}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="p-sidebar-footer">
            <button className="p-support-btn"
              style={{ justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: sidebarExpanded ? 10 : 0, padding: sidebarExpanded ? '10px 14px' : '10px 0' }}>
              <span className="nav-icon">{navIcons.support}</span>
              {sidebarExpanded && <span className="p-support-label">Soporte</span>}
            </button>
            <div className="p-user-card" style={{ marginTop: 8, justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: sidebarExpanded ? 10 : 0 }}>
              <div style={{ position: 'relative' }}>
                <div className="p-user-avatar" style={portalUser?.avatar_url ? { padding: 0, overflow: 'hidden' } : {}}>
                  {portalUser?.avatar_url
                    ? <img src={portalUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                    : displayName.charAt(0).toUpperCase()}
                </div>
                <div className="p-user-online" />
              </div>
              {sidebarExpanded && (
                <div className="p-user-info" style={{ display: 'block' }}>
                  <div className="p-user-name">{displayName}</div>
                  <div className="p-user-role">{roleLabel}</div>
                </div>
              )}
            </div>
            <button className="p-logout-btn"
              style={{ justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: sidebarExpanded ? 10 : 0, padding: sidebarExpanded ? '8px 14px' : '8px 0' }}
              onClick={handleLogout}>
              <span className="nav-icon">{navIcons.logout}</span>
              {sidebarExpanded && <span className="p-logout-label">Cerrar sesión</span>}
            </button>
          </div>
        </aside>

        {/* TOPBAR */}
        <header className="p-topbar" style={{ left: sidebarExpanded ? SIDEBAR_W_EXPANDED : SIDEBAR_W_COLLAPSED }}>
          <div className="p-topbar-left">
            <button className="p-topbar-home" onClick={() => navigate('dashboard')}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </button>
            {activeNav !== 'dashboard' && (
              <>
                <svg width="12" height="12" className="p-topbar-sep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                <span className="p-topbar-crumb current">{currentNavLabel}</span>
              </>
            )}
            {activeNav === 'dashboard' && (
              <span className="p-topbar-crumb current">Portal</span>
            )}
            {companyName && (
              <>
                <span className="p-topbar-sep" style={{ margin: '0 4px' }}>&middot;</span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{companyName}</span>
              </>
            )}
          </div>

          <div className="p-topbar-right">
            <span className="p-topbar-badge p-topbar-badge-role">{roleLabel}</span>
            <span className="p-topbar-badge p-topbar-badge-portal">Portal: {portalCode}</span>
            <div className="p-topbar-divider" />
            <span className="p-topbar-user">{displayName}</span>
            {portalUser?.id && <span className="p-topbar-id">ID: {portalUser.id}</span>}
            <span className="p-topbar-time">{currentTime}</span>
            <div className="p-topbar-divider" />
            <button className="p-topbar-logout" onClick={handleLogout} title="Cerrar sesión">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>

        {/* MAIN */}
        <main className="p-main" style={{ marginLeft: sidebarExpanded ? SIDEBAR_W_EXPANDED : SIDEBAR_W_COLLAPSED }}>
          {loadingPrograms ? (
            <div className="empty-state">Cargando datos...</div>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </>
  );
}
