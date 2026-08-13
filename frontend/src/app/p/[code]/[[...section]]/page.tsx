'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { apiFetch } from "@/lib/api";
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY, type Simulation } from 'd3-force';
import ProgramPreviewView from '@/app/dashboard/programs/preview/ProgramPreviewView';

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
    background: #ffffff;
    border-right: 1px solid #f1f2f4;
    display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 40;
    transition: width 0.32s cubic-bezier(0.4,0,0.2,1); overflow: hidden;
    box-shadow: 2px 0 24px rgba(15,23,42,0.045), 1px 0 0 rgba(15,23,42,0.02);
  }
  .p-sidebar.expanded { width: ${SIDEBAR_W_EXPANDED}px; }

  .p-sidebar-header { padding: 14px; border-bottom: 1px solid #f1f2f4; display: flex; align-items: center; justify-content: center; gap: 0; min-height: 64px; position: relative; z-index: 1; }
  .p-sidebar.expanded .p-sidebar-header { justify-content: flex-start; gap: 12px; }
  .p-sidebar-logo-img { width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0; filter: drop-shadow(0 3px 8px rgba(255,217,2,0.35)); transition: transform 0.25s cubic-bezier(0.4,0,0.2,1); }
  .p-sidebar-header:hover .p-sidebar-logo-img { transform: scale(1.05) rotate(-4deg); }
  .p-sidebar-logo-text { font-size: 1.05rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; white-space: nowrap; display: none; }
  .p-sidebar.expanded .p-sidebar-logo-text { display: inline; }

  /* Program card in sidebar */
  .p-program-card {
    margin: 4px 10px 8px; padding: 12px 13px; border-radius: 14px;
    background: linear-gradient(135deg, rgba(255,217,2,0.14), rgba(255,199,0,0.05));
    border: 1px solid rgba(255,217,2,0.35);
    opacity: 0; max-height: 0; overflow: hidden; transition: all 0.25s;
  }
  .p-sidebar.expanded .p-program-card { opacity: 1; max-height: 100px; }
  .p-program-card-name { font-size: 0.72rem; font-weight: 700; color: #8a6d00; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
  .p-program-card-meta { font-size: 0.62rem; color: #6b7280; display: flex; gap: 8px; }

  /* Nav */
  .p-nav { flex: 1; padding: 10px 8px; overflow-y: auto; overflow-x: hidden; position: relative; z-index: 1; }
  .p-nav::-webkit-scrollbar { width: 3px; }
  .p-nav::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.1); border-radius: 3px; }
  .p-nav-section { margin-bottom: 14px; }
  .p-nav-section-title { font-size: 0.6rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; padding: 0 10px; margin-bottom: 8px; white-space: nowrap; overflow: hidden; opacity: 0; height: 0; transition: opacity 0.2s, height 0.2s; }
  .p-sidebar.expanded .p-nav-section-title { opacity: 1; height: auto; margin-bottom: 8px; }

  .p-nav-item { display: flex; align-items: center; justify-content: center; gap: 0; padding: 10px 0; margin-bottom: 2px; border-radius: 12px; cursor: pointer; font-size: 0.82rem; font-weight: 500; color: #6b7280; transition: background 0.18s, color 0.18s, transform 0.18s; border: none; background: none; width: 100%; text-align: left; position: relative; white-space: nowrap; }
  .p-sidebar.expanded .p-nav-item { justify-content: flex-start; padding: 10px 14px; gap: 12px; }
  .p-nav-item:hover { background: #f6f7f8; color: #111827; transform: translateX(1px); }
  .p-nav-item.active { background: linear-gradient(135deg, rgba(255,217,2,0.22), rgba(255,217,2,0.1)); color: #1a1a1a; font-weight: 700; box-shadow: inset 0 0 0 1px rgba(255,217,2,0.4); }
  .p-nav-item.active::before { content: ''; position: absolute; left: -8px; top: 50%; transform: translateY(-50%); width: 4px; height: 18px; background: #FFD902; border-radius: 4px; box-shadow: 0 0 8px rgba(255,217,2,0.6); }
  .p-sidebar.expanded .p-nav-item.active::before { left: 0; }
  .p-nav-item .nav-icon { width: 22px; height: 22px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: transform 0.18s; color: inherit; }
  .p-nav-item:hover .nav-icon { transform: scale(1.08); }
  .p-nav-item.active .nav-icon { color: #8a6d00; }
  .p-nav-item .nav-icon svg { width: 20px; height: 20px; stroke: currentColor; }
  .p-nav-label { display: none; }
  .p-sidebar.expanded .p-nav-label { display: inline; }
  .p-nav-count { display: none; }
  .p-sidebar.expanded .p-nav-count { display: inline-block; margin-left: auto; font-size: 0.65rem; font-weight: 700; background: rgba(15,23,42,0.06); color: #6b7280; padding: 2px 8px; border-radius: 10px; }
  .p-nav-item.active .p-nav-count { background: rgba(255,217,2,0.3); color: #8a6d00; }

  /* Tooltip on collapsed */
  .p-nav-item .nav-tooltip { position: absolute; left: 68px; top: 50%; transform: translateY(-50%) translateX(-4px); background: #1c1c1c; color: #fff; padding: 7px 13px; border-radius: 9px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.18s, transform 0.18s; box-shadow: 0 8px 20px rgba(0,0,0,0.25); z-index: 100; border-left: 2px solid #FFD902; }
  .p-nav-item .nav-tooltip::before { content: ''; position: absolute; left: -4px; top: 50%; transform: translateY(-50%) rotate(45deg); width: 8px; height: 8px; background: #1c1c1c; }
  .p-sidebar:not(.expanded) .p-nav-item:hover .nav-tooltip { opacity: 1; transform: translateY(-50%) translateX(0); }

  .p-sidebar-footer { padding: 12px; border-top: 1px solid #f1f2f4; position: relative; z-index: 1; }
  .p-user-card { display: flex; align-items: center; justify-content: center; gap: 0; padding: 8px; border-radius: 12px; transition: background 0.15s; }
  .p-sidebar.expanded .p-user-card { justify-content: flex-start; gap: 10px; }
  .p-user-card:hover { background: #f6f7f8; }
  .p-user-avatar { width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #FFD902, #FFC700); display: flex; align-items: center; justify-content: center; font-size: 0.82rem; font-weight: 800; color: #1a1a1a; flex-shrink: 0; box-shadow: 0 3px 10px rgba(255,217,2,0.4); }
  .p-user-info { display: none; }
  .p-sidebar.expanded .p-user-info { display: block; }
  .p-user-name { font-size: 0.8rem; font-weight: 600; color: #111827; white-space: nowrap; }
  .p-user-role { font-size: 0.65rem; color: #6b7280; white-space: nowrap; }
  .p-user-online { position: absolute; bottom: -1px; right: -1px; width: 10px; height: 10px; border-radius: 50%; background: #22c55e; border: 2px solid #ffffff; }

  /* Support button */
  .p-support-btn { display: flex; align-items: center; justify-content: center; gap: 0; padding: 10px 0; border-radius: 12px; cursor: pointer; font-size: 0.8rem; font-weight: 600; color: #6b7280; transition: all 0.18s; border: none; background: none; width: 100%; text-align: left; white-space: nowrap; }
  .p-sidebar.expanded .p-support-btn { justify-content: flex-start; padding: 10px 14px; gap: 10px; }
  .p-support-btn:hover { background: #f6f7f8; color: #111827; }
  .p-support-btn .nav-icon { width: 22px; height: 22px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: inherit; }
  .p-support-btn .nav-icon svg { width: 20px; height: 20px; stroke: currentColor; }
  .p-support-label { display: none; }
  .p-sidebar.expanded .p-support-label { display: inline; }

  /* Logout button */
  .p-logout-btn { display: flex; align-items: center; justify-content: center; gap: 0; padding: 8px 0; border-radius: 10px; cursor: pointer; font-size: 0.75rem; font-weight: 500; color: #9ca3af; transition: all 0.18s; border: none; background: none; width: 100%; white-space: nowrap; margin-top: 6px; }
  .p-sidebar.expanded .p-logout-btn { justify-content: flex-start; padding: 8px 14px; gap: 10px; }
  .p-logout-btn:hover { background: rgba(239,68,68,0.08); color: #dc2626; }
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
  .p-main-fullscreen { padding: 0; height: calc(100vh - 64px); overflow: hidden; }

  /* Dashboard */
  .dash-header { margin-bottom: 20px; }
  .dash-title { font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0 0 4px; letter-spacing: -0.02em; }
  .dash-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0; }
  .dash-banner-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .dash-banner-svg svg { width: 100%; height: 100%; }

  /* Page header — mismo look que el dashboard en todas las sub-páginas, sin banner de color */
  .pd-page-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .pd-page-pills { display: flex; gap: 8px; flex-wrap: wrap; }
  .pd-pill-lite { padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; background: #f4f5f6; color: #52525b; border: 1px solid #ececec; white-space: nowrap; }

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
  .pd-content { max-width: 1200px; margin: 0 auto; padding: 28px 36px 60px; }
  .pd-wrapper-eco { height: 100%; min-height: 0; overflow: hidden; }
  .pd-content-eco { max-width: none; margin: 0; padding: 0; height: 100%; }
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

  .prof-avatar-card { background: #fff; border-radius: 20px; border: 1px solid #f0f0f0; padding: 28px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 1px 2px rgba(15,23,42,0.03), 0 16px 40px -16px rgba(15,23,42,0.08); }
  .prof-avatar { width: 120px; height: 120px; border-radius: 999px; overflow: hidden; background: linear-gradient(135deg, #FFD902, #FFC700); display: flex; align-items: center; justify-content: center; font-size: 2.4rem; font-weight: 800; color: #1a1a1a; position: relative; margin-bottom: 16px; box-shadow: 0 6px 20px -4px rgba(255,217,2,0.5); }
  .prof-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .prof-avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; cursor: pointer; border-radius: 999px; }
  .prof-avatar:hover .prof-avatar-overlay { opacity: 1; }
  .prof-avatar-name { font-size: 1.1rem; font-weight: 800; color: #111827; margin-bottom: 4px; }
  .prof-avatar-role { font-size: 0.78rem; color: #6b7280; margin-bottom: 12px; }
  .prof-avatar-btn { width: 100%; padding: 10px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; font-size: 0.78rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.15s; }
  .prof-avatar-btn:hover { background: #fffbeb; border-color: #FFD902; color: #8a6d00; }

  .prof-form-card { background: #fff; border-radius: 22px; border: 1px solid #f2f2f3; overflow: hidden; box-shadow: 0 1px 2px rgba(15,23,42,0.03), 0 20px 48px -20px rgba(15,23,42,0.09); }
  .prof-form-head { padding: 20px 26px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
  .prof-form-title { font-size: 0.92rem; font-weight: 700; color: #111827; }
  .prof-form-body { padding: 26px; animation: profStepIn 0.32s cubic-bezier(0.16,1,0.3,1); }
  @keyframes profStepIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .prof-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  @media (max-width: 640px) { .prof-form-grid { grid-template-columns: 1fr; } }
  .prof-field { display: flex; flex-direction: column; gap: 6px; }
  .prof-field.full { grid-column: 1 / -1; }
  .prof-field label { font-size: 0.72rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
  .prof-field input, .prof-field select, .prof-field textarea { border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 11px 14px; font-size: 0.85rem; color: #111827; outline: none; transition: border-color 0.15s, box-shadow 0.15s; font-family: inherit; }
  .prof-field input:hover, .prof-field select:hover, .prof-field textarea:hover { border-color: #d1d5db; }
  .prof-field input:focus, .prof-field select:focus, .prof-field textarea:focus { border-color: #FFD902; box-shadow: 0 0 0 3px rgba(255,217,2,0.18); }
  .prof-field input:disabled, .prof-field textarea:disabled { background: #f9fafb; color: #9ca3af; cursor: not-allowed; }
  .prof-field textarea { resize: vertical; min-height: 80px; }
  .prof-field .prof-hint { font-size: 0.66rem; color: #9ca3af; }

  .chip-btn { transition: transform 0.15s, box-shadow 0.15s, background 0.15s, border-color 0.15s, color 0.15s; }
  .chip-btn:hover { transform: translateY(-1.5px); box-shadow: 0 3px 10px rgba(15,23,42,0.08); }
  .chip-btn:active { transform: translateY(0); }

  .prof-skills-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .prof-skill-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; background: #fffbd6; border: 1px solid rgba(255,217,2,0.4); border-radius: 20px; font-size: 0.72rem; font-weight: 600; color: #8a6d00; }
  .prof-skill-tag button { border: none; background: none; color: #9ca3af; cursor: pointer; font-size: 0.8rem; padding: 0; line-height: 1; }
  .prof-skill-tag button:hover { color: #ef4444; }
  .prof-skill-add { display: flex; gap: 6px; }
  .prof-skill-add input { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 12px; font-size: 0.78rem; outline: none; }
  .prof-skill-add input:focus { border-color: #FFD902; }
  .prof-skill-add button { padding: 6px 14px; border-radius: 8px; border: none; background: #FFD902; color: #1a1a1a; font-size: 0.72rem; font-weight: 700; cursor: pointer; }

  .prof-actions { display: flex; gap: 10px; justify-content: flex-end; padding: 18px 24px; border-top: 1px solid #f3f4f6; }
  .prof-btn-save { padding: 10px 28px; border-radius: 12px; border: none; background: #FFD902; color: #1a1a1a; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.15s, transform 0.15s; }
  .prof-btn-save:hover { background: #E6C300; transform: translateY(-1px); }
  .prof-btn-save:disabled { background: #9ca3af; cursor: not-allowed; }
  .prof-btn-cancel { padding: 10px 28px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
  .prof-btn-cancel:hover { background: #f9fafb; }
  .prof-btn-edit { padding: 6px 16px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; font-size: 0.75rem; font-weight: 600; color: #374151; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.15s; }
  .prof-btn-edit:hover { background: #fffbeb; border-color: #FFD902; color: #8a6d00; }
  .prof-msg { font-size: 0.78rem; padding: 10px 16px; border-radius: 12px; margin-bottom: 16px; }
  .prof-msg-ok { background: #d1fae5; color: #065f46; }
  .prof-msg-err { background: #fef2f2; color: #991b1b; }

  /* Step indicator */
  .prof-step-track { display: flex; align-items: flex-start; gap: 0; margin-bottom: 30px; padding: 0 4px; }
  .prof-step-item { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
  .prof-step-item:last-child { flex: none; }
  .prof-step-circle { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.82rem; flex-shrink: 0; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); position: relative; z-index: 2; }
  .prof-step-circle.done, .prof-step-circle.current { background: #FFD902; color: #1a1a1a; box-shadow: 0 0 0 4px rgba(255,217,2,0.18); }
  .prof-step-circle.current { transform: scale(1.08); box-shadow: 0 0 0 5px rgba(255,217,2,0.22), 0 4px 12px rgba(255,217,2,0.35); }
  .prof-step-circle.upcoming { background: #eef0f2; color: #9ca3af; }
  .prof-step-label { font-size: 0.66rem; font-weight: 600; color: #9ca3af; margin-top: 8px; text-align: center; white-space: nowrap; transition: color 0.2s; }
  .prof-step-label.active { color: #1a1a1a; }
  .prof-step-line { position: absolute; top: 19px; left: calc(50% + 24px); right: calc(-50% + 24px); height: 3px; border-radius: 3px; background: #eef0f2; z-index: 1; overflow: hidden; }
  .prof-step-line::after { content: ''; position: absolute; inset: 0; background: #FFD902; transform: scaleX(var(--fill, 0)); transform-origin: left; transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }

  /* Profile wizard modal */
  .prof-modal-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.58); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 28px; z-index: 500;
    animation: profOverlayIn 0.22s ease-out;
  }
  @keyframes profOverlayIn { from { opacity: 0; } to { opacity: 1; } }
  .prof-modal-dialog {
    width: 100%; max-width: 780px; max-height: 92vh; overflow-y: auto; position: relative;
    background: #fff; border-radius: 26px; padding: 30px 34px 26px; box-shadow: 0 30px 80px -20px rgba(15,23,42,0.45);
    animation: profDialogIn 0.28s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes profDialogIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .prof-modal-dialog::-webkit-scrollbar { width: 6px; }
  .prof-modal-dialog::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 6px; }
  .prof-modal-dialog .prof-form-card { border: none; box-shadow: none; background: #fbfbfc; }
  .prof-modal-close {
    position: absolute; top: 18px; right: 18px; width: 34px; height: 34px; border-radius: 50%; border: none;
    background: #f3f4f6; color: #6b7280; font-size: 1.2rem; line-height: 1; cursor: pointer; z-index: 10;
    transition: all 0.15s; display: flex; align-items: center; justify-content: center;
  }
  .prof-modal-close:hover { background: #fef2f2; color: #dc2626; transform: rotate(90deg); }
  @media (max-width: 640px) { .prof-modal-overlay { padding: 0; } .prof-modal-dialog { max-height: 100vh; height: 100vh; border-radius: 0; padding: 24px 18px; } }

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
    .pd-content { padding-left: 20px; padding-right: 20px; }
    .p-sidebar { display: none; }
    .p-topbar { left: 0 !important; }
    .p-main { margin-left: 0 !important; }
  }
  @media (max-width: 640px) {
    .stats-grid { grid-template-columns: 1fr; }
    .pd-stats { grid-template-columns: 1fr; }
    .pd-info-grid { grid-template-columns: 1fr; }
    .pd-info-item { border-right: none; }
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

  /* Profile detail modal */
  .cht-profile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); animation: chtFadeIn 0.2s; }
  @keyframes chtFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .cht-profile-card { width: 380px; max-width: 92vw; max-height: 85vh; overflow-y: auto; background: #ffffff; border-radius: 20px; border: 1px solid #e5e7eb; box-shadow: 0 24px 64px rgba(0,0,0,0.12); animation: chtSlideUp 0.25s ease-out; }
  @keyframes chtSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .cht-profile-header { position: relative; padding: 32px 24px 20px; text-align: center; border-bottom: 1px solid #f0f0f0; }
  .cht-profile-close { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; border: none; background: #f3f4f6; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; font-size: 1.1rem; }
  .cht-profile-close:hover { background: #e5e7eb; color: #111; }
  .cht-profile-avatar { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 14px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 700; color: #9ca3af; overflow: hidden; border: 2px solid #e5e7eb; }
  .cht-profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .cht-profile-name { font-size: 1.1rem; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .cht-profile-headline { font-size: 0.78rem; color: #6b7280; line-height: 1.4; }
  .cht-profile-role-badge { display: inline-block; margin-top: 10px; padding: 4px 14px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; text-transform: capitalize; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .cht-profile-body { padding: 20px 24px; }
  .cht-profile-section { margin-bottom: 18px; }
  .cht-profile-label { font-size: 0.62rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
  .cht-profile-value { font-size: 0.82rem; color: #374151; line-height: 1.5; }
  .cht-profile-value a { color: #2563eb; text-decoration: underline; text-underline-offset: 2px; }
  .cht-profile-value a:hover { color: #1d4ed8; }
  .cht-profile-skills { display: flex; flex-wrap: wrap; gap: 6px; }
  .cht-profile-skill { padding: 4px 10px; border-radius: 8px; font-size: 0.68rem; font-weight: 500; background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
  .cht-profile-program { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; }
  .cht-profile-program-icon { width: 36px; height: 36px; border-radius: 10px; background: #e0e7ff; display: flex; align-items: center; justify-content: center; color: #4338ca; font-weight: 700; font-size: 0.8rem; flex-shrink: 0; }
  .cht-profile-program-name { font-size: 0.78rem; font-weight: 600; color: #111827; }
  .cht-profile-program-role { font-size: 0.62rem; color: #6b7280; text-transform: capitalize; }
  .cht-profile-empty { font-size: 0.75rem; color: #9ca3af; font-style: italic; }

  @media (max-width: 768px) {
    .cht-page { flex-direction: column; height: calc(100vh - 120px); }
    .cht-sidebar { width: 100%; max-height: 220px; border-right: none; border-bottom: 1px solid #1e1e1e; }
    .cht-msg-body { max-width: 85%; }
    .cht-messages { padding: 16px 14px; }
    .cht-profile-card { width: 95vw; }
  }

  /* ═══ Ecosistema (grafo de vínculos) — vista full screen ═══ */
  .eco-wrap { display: flex; flex-direction: column; gap: 14px; height: 100%; padding: 18px 26px; box-sizing: border-box; overflow: hidden; }
  .eco-header-row { flex-shrink: 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .eco-stat-cards { display: flex; gap: 12px; flex-wrap: wrap; }
  .eco-stat-card { background: #fff; border: 1px solid #eef0f2; border-radius: 14px; padding: 12px 18px; min-width: 150px; position: relative; box-shadow: 0 1px 2px rgba(15,23,42,0.03); }
  .eco-stat-label { font-size: 0.68rem; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
  .eco-stat-value { font-size: 1.05rem; font-weight: 800; color: #111827; }
  .eco-stat-bar { height: 4px; border-radius: 4px; background: #eef0f2; margin-top: 8px; overflow: hidden; }
  .eco-stat-bar div { height: 100%; background: linear-gradient(90deg,#14b8a6,#22c55e); border-radius: 4px; }
  .eco-stat-icon { position: absolute; right: 14px; top: 12px; color: #94a3b8; }
  .eco-header-actions { display: flex; gap: 10px; }
  .eco-dropdown-btn { display: flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; }
  .eco-dropdown-btn:hover { background: #f9fafb; }
  .eco-dot { width: 7px; height: 7px; border-radius: 50%; background: #14b8a6; display: inline-block; }
  .eco-badge-count { background: #14b8a6; color: #fff; font-size: 0.62rem; font-weight: 700; border-radius: 10px; padding: 1px 6px; }
  .eco-dropdown-panel { position: absolute; right: 0; top: calc(100% + 6px); background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 12px 32px -8px rgba(15,23,42,0.18); padding: 10px; z-index: 50; min-width: 220px; }
  .eco-toggle-row { display: flex; align-items: center; gap: 8px; padding: 7px 6px; font-size: 0.8rem; color: #374151; cursor: pointer; white-space: nowrap; border-radius: 8px; }
  .eco-toggle-row:hover { background: #f9fafb; }
  .eco-dropdown-sep { height: 1px; background: #f0f0f0; margin: 6px 0; }

  .eco-main-grid { display: grid; grid-template-columns: 260px 1fr 300px; gap: 16px; align-items: stretch; flex: 1; min-height: 0; }
  @media (max-width: 1100px) { .eco-main-grid { grid-template-columns: 1fr; overflow-y: auto; } }
  .eco-left-col, .eco-right-col { display: flex; flex-direction: column; gap: 14px; overflow-y: auto; min-height: 0; }
  .eco-graph-col { min-width: 0; min-height: 0; height: 100%; }

  .eco-panel { background: #fff; border: 1px solid #eef0f2; border-radius: 16px; padding: 16px; box-shadow: 0 1px 2px rgba(15,23,42,0.03); }
  .eco-panel-title { font-size: 0.82rem; font-weight: 700; color: #111827; margin-bottom: 10px; }
  .eco-panel-sub { font-size: 0.7rem; color: #6b7280; margin-bottom: 10px; margin-top: -6px; }
  .eco-empty-hint { font-size: 0.75rem; color: #9ca3af; }

  .eco-legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.76rem; color: #4b5563; margin-bottom: 8px; }
  .eco-legend-dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
  .eco-legend-line { width: 22px; height: 2px; background: #cbd5e1; flex-shrink: 0; display: inline-block; }
  .eco-legend-line-dashed { background: repeating-linear-gradient(90deg, #94a3b8 0 4px, transparent 4px 8px); }

  .eco-city-row { display: flex; justify-content: space-between; font-size: 0.78rem; color: #374151; padding: 6px 0; border-bottom: 1px solid #f6f7f8; }
  .eco-city-row:last-child { border-bottom: none; }
  .eco-city-count { font-weight: 700; color: #111827; }

  .eco-challenge-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f6f7f8; }
  .eco-challenge-row:last-child { border-bottom: none; }
  .eco-challenge-check { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #fff; flex-shrink: 0; margin-top: 1px; }
  .eco-challenge-check.done { background: #14b8a6; border-color: #14b8a6; }
  .eco-challenge-label { font-size: 0.74rem; color: #374151; margin-bottom: 4px; }
  .eco-challenge-frac { font-size: 0.7rem; font-weight: 700; color: #6b7280; flex-shrink: 0; }
  .eco-mini-bar { height: 4px; border-radius: 4px; background: #eef0f2; overflow: hidden; }
  .eco-mini-bar div { height: 100%; background: #14b8a6; border-radius: 4px; }

  .eco-canvas {
    position: relative; overflow: hidden; border-radius: 16px; border: 1px solid #eef0f2;
    background-color: #fbfbfc;
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cg stroke='%23dbe3ea' stroke-width='1' fill='none' opacity='0.7'%3E%3Cline x1='15' y1='25' x2='70' y2='55'/%3E%3Cline x1='70' y1='55' x2='130' y2='30'/%3E%3Cline x1='50' y1='120' x2='110' y2='150'/%3E%3Cline x1='110' y1='150' x2='170' y2='115'/%3E%3Cline x1='20' y1='160' x2='50' y2='120'/%3E%3Cline x1='130' y1='30' x2='175' y2='70'/%3E%3C/g%3E%3Cg fill='%23c9d4de'%3E%3Ccircle cx='15' cy='25' r='2.2'/%3E%3Ccircle cx='70' cy='55' r='2.2'/%3E%3Ccircle cx='130' cy='30' r='2.2'/%3E%3Ccircle cx='50' cy='120' r='2.2'/%3E%3Ccircle cx='110' cy='150' r='2.2'/%3E%3Ccircle cx='170' cy='115' r='2.2'/%3E%3Ccircle cx='20' cy='160' r='2.2'/%3E%3Ccircle cx='175' cy='70' r='2.2'/%3E%3C/g%3E%3C/svg%3E"),
      radial-gradient(circle at 12% 18%, rgba(20,184,166,0.10), transparent 42%),
      radial-gradient(circle at 88% 12%, rgba(59,130,246,0.09), transparent 42%),
      radial-gradient(circle at 30% 88%, rgba(139,92,246,0.07), transparent 40%),
      radial-gradient(circle at 92% 82%, rgba(34,197,94,0.08), transparent 42%);
    background-repeat: repeat, no-repeat, no-repeat, no-repeat, no-repeat;
    background-size: 200px 200px, auto, auto, auto, auto;
  }
  /* Vida ambiental del grafo — sutil, no debe distraer (sección 21 del instructivo) */
  @keyframes ecoBreathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }
  @keyframes ecoPulseRing { 0% { transform: scale(0.85); opacity: 0.55; } 100% { transform: scale(1.9); opacity: 0; } }
  @keyframes ecoGlowPulse { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.75; } }
  .eco-node-breathe { animation: ecoBreathe 5s ease-in-out infinite; }
  .eco-pulse-ring { position: absolute; inset: -8px; border-radius: 50%; border: 2px solid #14b8a6; animation: ecoPulseRing 2.6s cubic-bezier(0.4,0,0.2,1) infinite; pointer-events: none; }
  .eco-zoom-controls { position: absolute; left: 16px; bottom: 16px; display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 6px 10px; box-shadow: 0 4px 14px rgba(15,23,42,0.08); font-size: 0.75rem; color: #374151; font-weight: 600; }
  .eco-zoom-controls button { border: none; background: #f3f4f6; width: 22px; height: 22px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; color: #374151; display: flex; align-items: center; justify-content: center; }
  .eco-zoom-controls button:hover { background: #e5e7eb; }

  .eco-detail-panel { position: relative; }
  .eco-detail-close { position: absolute; top: 12px; right: 12px; width: 26px; height: 26px; border-radius: 50%; border: none; background: #f3f4f6; color: #6b7280; cursor: pointer; font-size: 1rem; }
  .eco-detail-close:hover { background: #fef2f2; color: #dc2626; }
  .eco-detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .eco-detail-avatar { width: 56px; height: 56px; border-radius: 50%; border: 3px solid #e5e7eb; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #f3f4f6; font-weight: 800; color: #6b7280; }
  .eco-detail-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .eco-detail-name { font-size: 0.95rem; font-weight: 800; color: #111827; }
  .eco-detail-role { font-size: 0.72rem; font-weight: 700; }
  .eco-detail-city { font-size: 0.7rem; color: #6b7280; margin-top: 2px; display: inline-flex; align-items: center; gap: 4px; }
  .eco-incomplete-note { font-size: 0.76rem; color: #92400e; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; }
  .eco-detail-fields { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
  .eco-detail-fields div { display: flex; justify-content: space-between; font-size: 0.76rem; border-bottom: 1px solid #f6f7f8; padding-bottom: 6px; }
  .eco-detail-fields span:first-child { color: #9ca3af; font-weight: 600; }
  .eco-detail-fields span:last-child { color: #111827; font-weight: 600; text-align: right; }
  .eco-detail-sessions { margin-bottom: 14px; font-size: 0.76rem; color: #374151; display: flex; flex-direction: column; gap: 6px; }
  .eco-detail-sessions span:nth-child(2) { font-weight: 700; color: #111827; }
  .eco-btn-primary { width: 100%; padding: 11px; border-radius: 12px; border: none; background: linear-gradient(135deg,#8b5cf6,#7c3aed); color: #fff; font-weight: 700; font-size: 0.82rem; cursor: pointer; margin-bottom: 8px; transition: transform 0.15s; display: flex; align-items: center; justify-content: center; gap: 7px; }
  .eco-btn-primary:hover { transform: translateY(-1px); }
  .eco-btn-secondary { width: 100%; padding: 10px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; color: #374151; font-weight: 600; font-size: 0.8rem; cursor: pointer; }
  .eco-btn-secondary:hover { background: #f9fafb; }

  .eco-insight-row { font-size: 0.76rem; color: #374151; padding: 8px 0; border-bottom: 1px solid #f6f7f8; line-height: 1.4; display: flex; align-items: flex-start; gap: 7px; }
  .eco-insight-row svg { flex-shrink: 0; margin-top: 2px; color: #f59e0b; }
  .eco-insight-row:last-child { border-bottom: none; }

  .eco-bottom-bar { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; background: #fff; border: 1px solid #eef0f2; border-radius: 16px; padding: 18px 20px; flex-shrink: 0; max-height: 34%; overflow-y: auto; }
  @media (max-width: 900px) { .eco-bottom-bar { grid-template-columns: 1fr; } }
  .eco-bottom-numbers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .eco-bottom-numbers div { display: flex; flex-direction: column; }
  .eco-bottom-numbers strong { font-size: 1.3rem; font-weight: 800; color: #111827; }
  .eco-bottom-numbers span { font-size: 0.66rem; color: #6b7280; margin-top: 2px; }
  .eco-level-row { display: flex; justify-content: space-between; font-size: 0.76rem; color: #374151; margin-bottom: 3px; }
  .eco-level-track { height: 5px; border-radius: 5px; background: #f3f4f6; overflow: hidden; margin-bottom: 8px; }
  .eco-level-track div { height: 100%; border-radius: 5px; }
`;

// ============================================================================
// NAV ICONS
// ============================================================================
const navIcons: Record<string, JSX.Element> = {
  home: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
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
};

// ============================================================================
// COMPONENT
// ============================================================================

// Único indicador de carga reutilizado en toda la app — evita mostrar un
// spinner y luego un skeleton distinto para la misma navegación.
const InlineSpinner = ({ minH = 300 }: { minH?: number }) => (
  <div style={{ minHeight: minH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="p-loading-spinner" />
  </div>
);

// ============================================================================
// ECOSYSTEM FORCE-DIRECTED GRAPH
// Modela el ecosistema de vínculos mentor-mentee según el instructivo del
// algoritmo: la dupla es la relación estructural (línea gruesa + sesiones
// visibles), el resto son vínculos sociales sutiles. La afinidad (misma
// ciudad) NO dibuja línea — solo agrupa vía una fuerza adicional.
// ============================================================================
type EcoNodeDatum = {
  id: string; full_name: string; role: string; avatar_url: string; city: string; area: string;
  position: string; organization: string; career: string; profile_complete: boolean;
  is_viewer: boolean; is_my_dupla: boolean; extra_links: number; has_sent_message?: boolean;
  x?: number; y?: number; vx?: number; vy?: number; fx?: number | null; fy?: number | null;
};
type EcoEdgeDatum = {
  source: string; target: string; type: string; strength: number;
  sessions_completed: number; sessions_planned: number; status: string;
};

function seededRand(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = (h << 5) - h + seed.charCodeAt(i); h |= 0; }
  return () => { h = (h * 1103515245 + 12345) & 0x7fffffff; return (h % 1000) / 1000; };
}

// Convierte un username/email tipo "juan.reinoso.pardo" en "Juan Reinoso Pardo" para
// nunca mostrar un identificador técnico como si fuera el nombre de una persona.
function humanizeName(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .split(/[._-]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function bestName(person?: { full_name?: string; username?: string; email?: string } | null, fallback = 'Participante'): string {
  if (!person) return fallback;
  if (person.full_name && person.full_name.trim()) return person.full_name.trim();
  const fromUsername = humanizeName(person.username);
  if (fromUsername) return fromUsername;
  const fromEmail = humanizeName(person.email?.split('@')[0]);
  return fromEmail || fallback;
}

function ecoInitials(name: string) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

// Iconos SVG (mismo estilo trazo que navIcons) para el tab Ecosistema — sin emojis.
const EcoIcons = {
  eye: (p: { size?: number }) => <svg width={p.size || 15} height={p.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  filter: (p: { size?: number }) => <svg width={p.size || 15} height={p.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M8 12h8M11 18h2" /></svg>,
  trophy: (p: { size?: number }) => <svg width={p.size || 18} height={p.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M8.21 13.89L7 21l5-3 5 3-1.21-7.11" /></svg>,
  users: (p: { size?: number }) => <svg width={p.size || 18} height={p.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  bulb: (p: { size?: number }) => <svg width={p.size || 15} height={p.size || 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M15.09 14c.3-.5.5-1.1.7-1.6.5-1.3 1.2-2.5 1.2-4.4 0-3.3-2.7-6-6-6S5 4.7 5 8c0 1.9.7 3.1 1.2 4.4.2.5.4 1.1.7 1.6" /></svg>,
  pin: (p: { size?: number }) => <svg width={p.size || 13} height={p.size || 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  message: (p: { size?: number }) => <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>,
  expand: (p: { size?: number }) => <svg width={p.size || 13} height={p.size || 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>,
  chevronDown: (p: { size?: number }) => <svg width={p.size || 11} height={p.size || 11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>,
};

function EcosystemGraph({
  nodes: rawNodes, edges: rawEdges, width = 900, height = 620, selectedId, onSelect,
  viewDuplasOnly, roleFilter, viewerCity, cityOnly, interactedOnly, viewerId,
}: {
  nodes: EcoNodeDatum[]; edges: EcoEdgeDatum[]; width?: number; height?: number;
  selectedId: string | null; onSelect: (id: string | null) => void;
  viewDuplasOnly: boolean; roleFilter: 'all' | 'mentor' | 'mentee'; viewerCity: string;
  cityOnly: boolean; interactedOnly: boolean; viewerId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<Simulation<EcoNodeDatum, undefined> | null>(null);
  const nodesRef = useRef<EcoNodeDatum[]>([]);
  const [, setTick] = useState(0);
  const [dims, setDims] = useState({ w: width, h: height });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [dragId, setDragId] = useState<string | null>(null);
  const panningRef = useRef<{ startX: number; startY: number; startTx: number; startTy: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setDims({ w: el.clientWidth || width, h: el.clientHeight || height });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  useEffect(() => {
    const w0 = containerRef.current?.clientWidth || width;
    const h0 = containerRef.current?.clientHeight || height;
    const simNodes: EcoNodeDatum[] = rawNodes.map(n => {
      const rand = seededRand(n.id);
      return { ...n, x: w0 / 2 + (rand() - 0.5) * w0 * 0.6, y: h0 / 2 + (rand() - 0.5) * h0 * 0.6 };
    });
    const nodeById = new Map(simNodes.map(n => [n.id, n]));
    const validEdges = rawEdges.filter(e => nodeById.has(e.source) && nodeById.has(e.target));
    const simLinks = validEdges.map(e => ({ ...e, source: nodeById.get(e.source)!, target: nodeById.get(e.target)! }));
    nodesRef.current = simNodes;

    const sim = forceSimulation(simNodes)
      .force('link', forceLink(simLinks as any).id((d: any) => d.id)
        .distance((l: any) => l.type === 'MENTORSHIP' ? 95 : Math.max(110, 260 - (l.strength || 30) * 1.4))
        .strength((l: any) => l.type === 'MENTORSHIP' ? 0.95 : 0.15))
      .force('charge', forceManyBody().strength(-230).distanceMax(420))
      .force('collide', forceCollide().radius((d: any) => (d.is_viewer ? 50 : d.is_my_dupla ? 44 : 38)))
      .force('x', forceX(w0 / 2).strength(0.06))
      .force('y', forceY(h0 / 2).strength(0.06))
      .alpha(1).alphaDecay(0.025);

    // Afinidad por ciudad: agrupa sin dibujar línea (sección 24 del instructivo)
    sim.force('affinity', (alpha: number) => {
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const a = simNodes[i], b = simNodes[j];
          if (a.city && a.city === b.city) {
            const dx = (b.x! - a.x!), dy = (b.y! - a.y!);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist > 150) {
              const f = 0.006 * alpha;
              a.vx! += (dx / dist) * f; a.vy! += (dy / dist) * f;
              b.vx! -= (dx / dist) * f; b.vy! -= (dy / dist) * f;
            }
          }
        }
      }
    });

    sim.on('tick', () => {
      const w = containerRef.current?.clientWidth || width;
      const h = containerRef.current?.clientHeight || height;
      for (const n of simNodes) {
        const r = n.is_viewer ? 52 : n.is_my_dupla ? 46 : 40;
        n.x = Math.max(r, Math.min(w - r, n.x!));
        n.y = Math.max(r, Math.min(h - r, n.y!));
      }
      setTick(t => t + 1);
    });
    simRef.current = sim;
    return () => { sim.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawNodes, rawEdges, width, height]);

  const highlightIds = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>([selectedId]);
    rawEdges.forEach(e => { if (e.source === selectedId) s.add(e.target); if (e.target === selectedId) s.add(e.source); });
    return s;
  }, [selectedId, rawEdges]);

  const interactedSet = useMemo(() => {
    const s = new Set<string>();
    rawEdges.forEach(e => { if (e.source === viewerId) s.add(e.target); if (e.target === viewerId) s.add(e.source); });
    return s;
  }, [rawEdges, viewerId]);

  const passesFilter = useCallback((n: EcoNodeDatum) => {
    if (n.is_viewer) return true;
    if (roleFilter !== 'all' && n.role !== roleFilter) return false;
    if (cityOnly && n.city !== viewerCity) return false;
    if (interactedOnly && !interactedSet.has(n.id)) return false;
    return true;
  }, [roleFilter, cityOnly, viewerCity, interactedOnly, interactedSet]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    setTransform(t => {
      const newK = Math.min(2.5, Math.max(0.4, t.k * (1 - e.deltaY * 0.001)));
      const newX = cx - ((cx - t.x) / t.k) * newK;
      const newY = cy - ((cy - t.y) / t.k) * newK;
      return { x: newX, y: newY, k: newK };
    });
  };

  const zoomBy = (factor: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : width / 2, cy = rect ? rect.height / 2 : height / 2;
    setTransform(t => {
      const newK = Math.min(2.5, Math.max(0.4, t.k * factor));
      const newX = cx - ((cx - t.x) / t.k) * newK;
      const newY = cy - ((cy - t.y) / t.k) * newK;
      return { x: newX, y: newY, k: newK };
    });
  };

  const handleBgPointerDown = (e: React.PointerEvent) => {
    panningRef.current = { startX: e.clientX, startY: e.clientY, startTx: transform.x, startTy: transform.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleBgPointerMove = (e: React.PointerEvent) => {
    if (!panningRef.current) return;
    const dx = e.clientX - panningRef.current.startX, dy = e.clientY - panningRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) panningRef.current.moved = true;
    setTransform(t => ({ ...t, x: panningRef.current!.startTx + dx, y: panningRef.current!.startTy + dy }));
  };
  const handleBgPointerUp = () => {
    if (panningRef.current && !panningRef.current.moved) onSelect(null);
    panningRef.current = null;
  };

  const handleNodePointerDown = (nodeId: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;
    setDragId(nodeId);
    simRef.current?.alphaTarget(0.25).restart();
    node.fx = node.x; node.fy = node.y;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleNodePointerMove = (nodeId: string) => (e: React.PointerEvent) => {
    if (dragId !== nodeId) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;
    node.fx = (e.clientX - rect.left - transform.x) / transform.k;
    node.fy = (e.clientY - rect.top - transform.y) / transform.k;
    setTick(t => t + 1);
  };
  const handleNodePointerUp = (nodeId: string) => () => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node) { node.fx = null; node.fy = null; }
    simRef.current?.alphaTarget(0);
    setDragId(null);
  };

  return (
    <div ref={containerRef} className="eco-canvas"
      onWheel={handleWheel} onPointerDown={handleBgPointerDown} onPointerMove={handleBgPointerMove} onPointerUp={handleBgPointerUp}
      style={{ width: '100%', height: '100%', cursor: panningRef.current ? 'grabbing' : 'grab' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`, transformOrigin: '0 0' }}>
        <svg style={{ position: 'absolute', left: 0, top: 0, width: dims.w, height: dims.h, overflow: 'visible', pointerEvents: 'none' }}>
          {rawEdges.map((e, i) => {
            if (viewDuplasOnly && e.type !== 'MENTORSHIP') return null;
            const s = nodesRef.current.find(n => n.id === e.source), t = nodesRef.current.find(n => n.id === e.target);
            if (!s || !t || s.x === undefined || t.x === undefined) return null;
            const dimmed = highlightIds ? !(highlightIds.has(e.source) && highlightIds.has(e.target)) : false;
            const isDupla = e.type === 'MENTORSHIP';
            const dx = t.x! - s.x!, dy = t.y! - s.y!;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len, ny = dx / len; // unit normal, perpendicular to the line
            const midX = (s.x! + t.x!) / 2 + nx * 20, midY = (s.y! + t.y!) / 2 + ny * 20;
            return (
              <g key={i} opacity={dimmed ? 0.12 : 1}>
                {isDupla && (
                  <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#14b8a6" strokeWidth={11} strokeLinecap="round"
                    style={{ animation: 'ecoGlowPulse 2.8s ease-in-out infinite', animationDelay: `${(i % 5) * 0.3}s` }} />
                )}
                <line x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={isDupla ? '#14b8a6' : '#cbd5e1'} strokeWidth={isDupla ? 5 : 1.5}
                  strokeDasharray={isDupla ? undefined : '4 5'} strokeLinecap="round" />
                {isDupla && (
                  <>
                    <rect x={midX - 17} y={midY - 10} width={34} height={20} rx={10} fill="#0f172a" />
                    <text x={midX} y={midY + 4} textAnchor="middle" fontSize="10" fontWeight={700} fill="#fff">
                      {e.sessions_completed}/{e.sessions_planned || e.sessions_completed}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
        {nodesRef.current.map(node => {
          const isSelected = selectedId === node.id;
          const dimmed = (highlightIds && !highlightIds.has(node.id)) || !passesFilter(node);
          const ringColor = node.role === 'mentor' ? '#22c55e' : '#3b82f6';
          const size = node.is_viewer ? 84 : node.is_my_dupla ? 66 : 58;
          return (
            <div key={node.id}
              onPointerDown={handleNodePointerDown(node.id)}
              onPointerMove={handleNodePointerMove(node.id)}
              onPointerUp={handleNodePointerUp(node.id)}
              onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
              style={{
                position: 'absolute', left: node.x, top: node.y, transform: 'translate(-50%, -50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                opacity: dimmed ? 0.22 : 1, transition: 'opacity 0.25s', zIndex: node.is_viewer ? 6 : isSelected ? 5 : 3,
                touchAction: 'none',
              }}>
              <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                {node.is_viewer && !dimmed && <div className="eco-pulse-ring" />}
                {(node.is_viewer || node.is_my_dupla) && !dimmed && <div className="eco-pulse-ring" style={{ animationDelay: '1.3s' }} />}
                <div className="eco-node-breathe" style={{ animationDelay: `${(seededRand(node.id)() * 3).toFixed(2)}s`, width: size, height: size }}>
                  <div style={{
                    width: size, height: size, borderRadius: '50%', overflow: 'hidden',
                    border: `${node.is_viewer ? 4 : 3}px solid ${node.is_viewer ? '#14b8a6' : ringColor}`,
                    background: node.avatar_url ? '#fff' : (node.role === 'mentor' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#3b82f6,#2563eb)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isSelected ? `0 0 0 4px ${ringColor}33, 0 6px 18px rgba(15,23,42,0.25)` : '0 2px 8px rgba(15,23,42,0.12)',
                  }}>
                    {node.avatar_url ? (
                      <img src={node.avatar_url} alt={node.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: size > 70 ? '1.3rem' : '1rem' }}>{ecoInitials(node.full_name)}</span>
                    )}
                  </div>
                </div>
                {node.has_sent_message && !node.is_viewer && (
                  <div title="Ha enviado mensajes" style={{
                    position: 'absolute', top: -3, right: -3, width: 20, height: 20, borderRadius: '50%',
                    background: '#8b5cf6', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(139,92,246,0.5)',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 6, textAlign: 'center', pointerEvents: 'none', maxWidth: 100 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node.is_viewer ? 'TÚ' : (node.full_name.split(' ')[0] || '—')}
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 600, color: ringColor }}>
                  {node.role === 'mentor' ? 'Mentor' : 'Mentee'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="eco-zoom-controls">
        <button onClick={() => zoomBy(0.85)} aria-label="Alejar">−</button>
        <span>{Math.round(transform.k * 100)}%</span>
        <button onClick={() => zoomBy(1.18)} aria-label="Acercar">+</button>
        <button onClick={() => setTransform({ x: 0, y: 0, k: 1 })} aria-label="Restablecer zoom"><EcoIcons.expand /></button>
      </div>
    </div>
  );
}

export default function ParticipantPortalPage() {
  const router = useRouter();
  const params = useParams();
  const portalCode = params.code as string;
  const sectionParam = (params.section as string[] | undefined)?.[0] || '';
  // Un admin de Inspiratoria puede "ver como" cualquier mentor/mentee desde la
  // consola admin (?preview=admin). Es una vista de solo lectura: no dispara el
  // marcado de mensajes como leídos ni ninguna acción que mute datos reales de
  // esa persona — no cuenta como un acceso real suyo. Leemos el query param
  // directo de window.location (no useSearchParams) para no forzar un límite
  // de Suspense en esta página.
  const [isAdminPreview, setIsAdminPreview] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `admin_preview_${portalCode}`;
    const fromUrl = new URLSearchParams(window.location.search).get('preview') === 'admin';
    if (fromUrl) {
      sessionStorage.setItem(key, '1');
    }
    // sessionStorage.setItem is synchronous, so this read always sees the write above.
    setIsAdminPreview(fromUrl || sessionStorage.getItem(key) === '1');
  }, [portalCode]);
  const blockInPreview = () => { alert('Estás en modo vista previa (solo lectura) — esta acción no está disponible.'); };

  // Map URL slug → internal section key
  const SECTION_SLUGS: Record<string, string> = {
    '': 'dashboard',
    'modulos': 'my-modules',
    'actividades': 'my-activities',
    'participantes': 'my-participants',
    'hitos': 'my-milestones',
    'ecosistema': 'my-ecosystem',
    'perfil': 'my-profile',
    'insignias': 'my-badges',
    'chat': 'my-chat',
    'mentees': 'my-mentees',
    'mi-mentor': 'my-mentor',
    'sesiones': 'my-sessions',
    'red': 'my-network',
    'mis-actividades': 'my-portal-activities',
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
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [programTemplate, setProgramTemplate] = useState<any>(null);
  const [programParticipants, setProgramParticipants] = useState<any[]>([]);
  const [modulesTemplate, setModulesTemplate] = useState<any>(null);
  const [modulesTemplateLoading, setModulesTemplateLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [ecosystemData, setEcosystemData] = useState<any>(null);
  const [ecosystemLoading, setEcosystemLoading] = useState(false);
  const [ecoSelectedId, setEcoSelectedId] = useState<string | null>(null);
  const [ecoViewDuplasOnly, setEcoViewDuplasOnly] = useState(false);
  const [ecoRoleFilter, setEcoRoleFilter] = useState<'all' | 'mentor' | 'mentee'>('all');
  const [ecoCityOnly, setEcoCityOnly] = useState(false);
  const [ecoInteractedOnly, setEcoInteractedOnly] = useState(false);
  const [ecoViewMenuOpen, setEcoViewMenuOpen] = useState(false);
  const [ecoFiltersOpen, setEcoFiltersOpen] = useState(false);

  // Profile editing state
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileForm, setProfileForm] = useState({
    full_name: '', phone: '', position: '', department: '',
    linkedin_url: '', bio: '', headline: '', skills: [] as string[],
    gender: '', personal_email: '', presentation: '',
    residence_city: '', work_location: '', area_or_function: '', career: '',
    mentor_topics: [] as string[], mentor_objectives: [] as string[],
    mentor_style: [] as string[], experience_level: '',
    experience_area: [] as string[], mentee_preference: [] as string[],
    mentee_outcomes: [] as string[], session_structure: [] as string[],
    mentee_goals: [] as string[], mentee_interests: [] as string[],
    mentee_challenges: [] as string[], mentee_expectations: [] as string[],
    preferred_mentor_style: [] as string[], session_format_preference: [] as string[],
  });
  const [newSkill, setNewSkill] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [mentorStep, setMentorStep] = useState(0); // Multi-step wizard: 0=not started, 1-4 steps
  const [otherTopicInput, setOtherTopicInput] = useState('');
  const [otherAreaInput, setOtherAreaInput] = useState('');

  // Badges state
  const [badgesData, setBadgesData] = useState<any>(null);
  const [badgesLoading, setBadgesLoading] = useState(false);

  // Mentees state
  const [myMentees, setMyMentees] = useState<any[]>([]);
  const [menteesLoading, setMenteesLoading] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<any>(null);

  // My Mentor state (for mentees)
  const [myMentor, setMyMentor] = useState<any>(null);
  const [mentorLoading, setMentorLoading] = useState(false);

  // Sessions state
  const [mySessions, setMySessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionForm, setSessionForm] = useState({ mentee_id: '', program_id: '', title: '', description: '', scheduled_at: '', duration_minutes: 60, meeting_url: '' });
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [sessionNotesForm, setSessionNotesForm] = useState({ session_notes: '', topics_covered: [] as string[], mentee_mood: 0, next_steps: '' });
  const [showNotesModal, setShowNotesModal] = useState<any>(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Activities state
  const [portalActivities, setPortalActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Network state
  const [networkPeople, setNetworkPeople] = useState<any[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);

  // Session form state
  const [sessionFormError, setSessionFormError] = useState('');
  const [sessionCreating, setSessionCreating] = useState(false);

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
  const [chatProfileDetail, setChatProfileDetail] = useState<any>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<any>(null);
  const chatTypingRef = useRef<any>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);

  // Derived
  const activeProgram = selectedProgram || myPrograms[0] || null;
  const roleLabel = ROLE_LABELS[portalUser?.role] || 'Participante';
  const fullDisplayName = bestName(portalUser);
  const displayName = fullDisplayName.split(' ')[0];
  const companyName = myPrograms[0]?.company_name || '';
  const totalSessions = programTemplate?.modules?.reduce((a: number, m: any) => a + (m.sessions || 0), 0) || 0;
  const totalResources = programTemplate?.modules?.reduce((a: number, m: any) => a + (m.resources?.length || 0), 0) || 0;

  // Profile completeness gate — mentors need wizard step 6, mentees need mentee wizard step 6
  const userRole = portalUser?.role || '';
  const isMentee = userRole === 'mentee';
  const isProfileComplete = isMentee
    ? (portalUser?.mentee_profile_step || 0) >= 6
    : (portalUser?.mentor_profile_step || 0) >= 6;

  // Derive detail tab from URL section
  const detailTab = (() => {
    const map: Record<string, string> = { 'my-program': 'overview', 'my-progress': 'progress', 'my-modules': 'modules', 'my-activities': 'activities', 'my-participants': 'participants', 'my-milestones': 'milestones', 'my-ecosystem': 'ecosystem' };
    return (map[activeNav] || 'overview') as 'overview' | 'modules' | 'participants' | 'activities' | 'milestones' | 'ecosystem';
  })();

  // Nav items — filtered by role
  const mentoriaItems = isMentee ? [
    { id: 'my-mentor', label: 'Mi Mentor', icon: 'participants' },
    { id: 'my-sessions', label: 'Sesiones', icon: 'milestones' },
    { id: 'my-network', label: 'Mi Red', icon: 'ecosystem' },
    { id: 'my-portal-activities', label: 'Actividades', icon: 'activities' },
  ] : [
    { id: 'my-mentees', label: 'Mis Mentees', icon: 'participants' },
    { id: 'my-sessions', label: 'Sesiones', icon: 'milestones' },
    { id: 'my-network', label: 'Mi Red', icon: 'ecosystem' },
    { id: 'my-portal-activities', label: 'Actividades', icon: 'activities' },
  ];
  const navItems = [
    { section: 'Mi Espacio', items: [
      { id: 'dashboard', label: 'Inicio', icon: 'home' },
      { id: 'my-modules', label: 'Módulos', icon: 'modules', count: programTemplate?.modules?.length || 0 },
      { id: 'my-activities', label: 'Actividades', icon: 'activities' },
      { id: 'my-participants', label: 'Participantes', icon: 'participants', count: programParticipants.length || 0 },
      { id: 'my-milestones', label: 'Hitos', icon: 'milestones', count: programTemplate?.milestones?.length || 0 },
      { id: 'my-ecosystem', label: 'Ecosistema', icon: 'ecosystem' },
    ]},
    { section: 'Mentoría', items: mentoriaItems },
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
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}`)
      .then(r => { if (!r.ok) throw new Error('not_found'); return r.json(); })
      .then(data => {
        setPortalUser(data.user);
        // Fetch programs
        if (data.user?.id) {
          setLoadingPrograms(true);
          apiFetch(`${API_URL}/api/programs/my-programs/${data.user.id}`, { headers: { Authorization: `Bearer ${token}` } })
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

  // ── Fetch full program data (used on mount + on focus + on manual refresh) ──
  const reloadProgramData = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!selectedProgram?.id) return;
    const programId = selectedProgram.id;
    if (opts.silent) setRefreshing(true); else setLoadingDetail(true);
    try {
      const authHeaders = { Authorization: `Bearer ${localStorage.getItem('auth_token')}` };
      const [detail, templates, participants, myProgs] = await Promise.all([
        apiFetch(`${API_URL}/api/programs/${programId}`, { headers: authHeaders }).then(r => r.ok ? r.json() : null).catch(() => null),
        apiFetch(`${API_URL}/api/program-templates`).then(r => r.ok ? r.json() : []).catch(() => []),
        apiFetch(`${API_URL}/api/programs/${programId}/participants`, { headers: authHeaders }).then(r => r.ok ? r.json() : []).catch(() => []),
        portalUser?.id ? apiFetch(`${API_URL}/api/programs/my-programs/${portalUser.id}`, { headers: authHeaders }).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
      ]);
      if (detail) setProgramDetail(detail);
      const allTemplates = Array.isArray(templates) ? templates : [];
      const matched = allTemplates.find((t: any) => t.name === selectedProgram.name);
      if (matched) setProgramTemplate(matched);
      setProgramParticipants(Array.isArray(participants) ? participants : []);
      // Refresh my-programs (status, joined_at, etc.)
      if (Array.isArray(myProgs)) {
        setMyPrograms(myProgs);
        const updated = myProgs.find((p: any) => p.id === programId);
        if (updated) setSelectedProgram(updated);
      }
      setLastSyncedAt(new Date());
    } finally {
      if (opts.silent) setRefreshing(false); else setLoadingDetail(false);
    }
  }, [selectedProgram?.id, selectedProgram?.name, portalUser?.id]);

  // Initial load when program changes
  useEffect(() => {
    if (!selectedProgram?.id) return;
    setProgramDetail(null);
    setProgramTemplate(null);
    setProgramParticipants([]);
    reloadProgramData();
  }, [selectedProgram?.id, selectedProgram?.name, reloadProgramData]);

  // Lock body scroll while the profile wizard modal is open
  useEffect(() => {
    if (profileEditing) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [profileEditing]);

  // Auto-refresh on window focus / tab visibility (silent)
  useEffect(() => {
    if (!selectedProgram?.id) return;
    const onFocus = () => reloadProgramData({ silent: true });
    const onVisible = () => { if (document.visibilityState === 'visible') reloadProgramData({ silent: true }); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [selectedProgram?.id, reloadProgramData]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    localStorage.removeItem('program_participant');
    localStorage.removeItem('session_expires_at');
    router.push('/login/admin');
  };

  // Force redirect to profile if incomplete
  useEffect(() => {
    if (!loading && portalUser && !isProfileComplete && activeNav !== 'my-profile') {
      navigate('my-profile');
    }
  }, [loading, portalUser, isProfileComplete, activeNav]);

  // Clock
  // Fetch badges when entering the badges tab
  useEffect(() => {
    if (activeNav !== 'my-badges' || !portalCode) return;
    if (badgesData) return; // already loaded
    setBadgesLoading(true);
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}/badges`)
      .then(r => { if (!r.ok) throw new Error('badges_error'); return r.json(); })
      .then(data => setBadgesData(data))
      .catch(() => setBadgesData(null))
      .finally(() => setBadgesLoading(false));
  }, [activeNav, portalCode]);

  // Fetch mentees when entering mentees OR sessions tab (mentor only)
  useEffect(() => {
    if ((activeNav !== 'my-mentees' && activeNav !== 'my-sessions') || !portalCode || isMentee) return;
    if (myMentees.length > 0 && activeNav === 'my-sessions') return; // already loaded
    setMenteesLoading(true);
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}/mentees`)
      .then(r => r.ok ? r.json() : { mentees: [] })
      .then(data => setMyMentees(data.mentees || []))
      .catch(() => setMyMentees([]))
      .finally(() => setMenteesLoading(false));
  }, [activeNav, portalCode, isMentee]);

  // Fetch my mentor when mentee enters my-mentor, sessions or dashboard
  useEffect(() => {
    if (!isMentee || !portalCode) return;
    if (activeNav !== 'my-mentor' && activeNav !== 'my-sessions' && activeNav !== 'dashboard') return;
    if (myMentor) return; // already loaded
    setMentorLoading(true);
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}/my-mentor`)
      .then(r => r.ok ? r.json() : { mentor: null })
      .then(data => setMyMentor(data.mentor))
      .catch(() => setMyMentor(null))
      .finally(() => setMentorLoading(false));
  }, [activeNav, portalCode, isMentee]);

  // Fetch sessions when entering the sessions tab or mentee dashboard/mentor view
  useEffect(() => {
    if (!portalCode) return;
    const needsSessions = activeNav === 'my-sessions' || (isMentee && (activeNav === 'dashboard' || activeNav === 'my-mentor'));
    if (!needsSessions) return;
    if (mySessions.length > 0 && activeNav !== 'my-sessions') return; // already loaded from sessions tab
    setSessionsLoading(true);
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}/sessions`)
      .then(r => r.ok ? r.json() : { sessions: [] })
      .then(data => setMySessions(data.sessions || []))
      .catch(() => setMySessions([]))
      .finally(() => setSessionsLoading(false));
  }, [activeNav, portalCode, isMentee]);

  // Fetch activities when entering the activities tab (with completion status)
  useEffect(() => {
    if (activeNav !== 'my-portal-activities' || !portalCode) return;
    if (portalActivities.length > 0) return; // already loaded — usa el botón "Actualizar" para refrescar
    setActivitiesLoading(true);
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}/activities`)
      .then(r => r.ok ? r.json() : { activities: [] })
      .then(data => setPortalActivities(data.activities || []))
      .catch(() => setPortalActivities([]))
      .finally(() => setActivitiesLoading(false));
  }, [activeNav, portalCode]);

  // Fetch network when entering the network tab
  useEffect(() => {
    if (activeNav !== 'my-network' || !portalCode) return;
    if (networkPeople.length > 0) return; // already loaded
    setNetworkLoading(true);
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}/network`)
      .then(r => r.ok ? r.json() : { network: [] })
      .then(data => setNetworkPeople(data.network || []))
      .catch(() => setNetworkPeople([]))
      .finally(() => setNetworkLoading(false));
  }, [activeNav, portalCode]);

  // Fetch ecosystem graph (duplas + red social) when entering the ecosystem tab
  useEffect(() => {
    if (activeNav !== 'my-ecosystem' || !portalCode || !selectedProgram?.id) return;
    if (ecosystemData && ecosystemData.program?.id === selectedProgram.id) return; // already loaded for this program
    setEcosystemLoading(true);
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}/ecosystem?program_id=${selectedProgram.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setEcosystemData(data))
      .catch(() => setEcosystemData(null))
      .finally(() => setEcosystemLoading(false));
  }, [activeNav, portalCode, selectedProgram?.id]);

  // Fetch the full program template (con archivos) cuando se entra a Módulos —
  // misma llamada que usa Studio, siempre en vivo, para replicar esa vista exacta.
  useEffect(() => {
    if (activeNav !== 'my-modules' || !selectedProgram?.template_slug) return;
    if (modulesTemplate && modulesTemplate.slug === selectedProgram.template_slug) return; // ya cargado
    setModulesTemplateLoading(true);
    apiFetch(`${API_URL}/api/program-templates?include_files=true`)
      .then(r => r.ok ? r.json() : [])
      .then(all => setModulesTemplate((Array.isArray(all) ? all : []).find((t: any) => t.slug === selectedProgram.template_slug) || null))
      .catch(() => setModulesTemplate(null))
      .finally(() => setModulesTemplateLoading(false));
  }, [activeNav, selectedProgram?.template_slug]);

  // ── Chat: fetch programs list ──
  useEffect(() => {
    if (activeNav !== 'my-chat') {
      // Cleanup polling when leaving chat
      if (chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; }
      return;
    }
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}/chat/programs`)
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
    // Fetch messages — en vista previa de admin, no marca como leído (no cuenta como acceso real)
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/messages${isAdminPreview ? '?preview=1' : ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setChatMessages(data.messages || []);
      })
      .catch(() => {})
      .finally(() => {
        setChatLoading(false);
        setTimeout(() => { chatMessagesRef.current?.scrollTo({ top: chatMessagesRef.current.scrollHeight }); }, 100);
      });
  }, [chatActiveProgram?.id, activeNav, portalCode, isAdminPreview]);

  // ── Chat: fetch participants when program changes ──
  useEffect(() => {
    if (!chatActiveProgram || activeNav !== 'my-chat') return;
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/participants`)
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
      apiFetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/poll${after ? `?after=${after}` : ''}`)
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
    if (isAdminPreview) { blockInPreview(); return; }
    setChatSending(true);
    try {
      const res = await apiFetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/messages`, {
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
  }, [chatInput, chatAttachments, chatSending, chatActiveProgram, portalCode, isAdminPreview]);

  const handleChatTyping = useCallback(() => {
    if (!chatActiveProgram) return;
    const now = Date.now();
    if (chatTypingRef.current && now - chatTypingRef.current < 2000) return;
    chatTypingRef.current = now;
    apiFetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/typing`, { method: 'POST' }).catch(() => {});
  }, [chatActiveProgram, portalCode]);

  const handleChatFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !chatActiveProgram) return;
    setChatUploading(true);
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append('file', files[i]);
      try {
        const res = await apiFetch(`${API_URL}/api/companies/portal/${portalCode}/chat/${chatActiveProgram.id}/upload`, { method: 'POST', body: fd });
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
  if (loading || loadingPrograms) return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: styles }} />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div className="p-loading-spinner" />
      </div>
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

      {loadingPrograms ? null : myPrograms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: 8 }}>Aún no estás inscrito en un programa</h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Cuando te asignen a un programa, aparecerá aquí.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: myPrograms.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
            {myPrograms.map(mp => {
              const gradient = THEME_GRADIENTS[mp.theme] || THEME_GRADIENTS.leadership;
              const hasBanner = !!(mp.banner_image || mp.banner_svg);
              return (
                <div key={mp.id} onClick={() => { setSelectedProgram(mp); navigate('my-modules'); }}
                  style={{ background: hasBanner ? '#111827' : gradient, borderRadius: 16, padding: '28px 28px 20px', cursor: 'pointer', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
                  {mp.banner_image ? (
                    <img src={mp.banner_image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : mp.banner_svg ? (
                    <div className="dash-banner-svg" dangerouslySetInnerHTML={{ __html: mp.banner_svg }} />
                  ) : null}
                  {hasBanner && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />}
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'rgba(255,255,255,0.06)', borderRadius: '0 0 0 120px' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
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

          {renderProgressSection()}
        </>
      )}
    </>
  );

  const renderMyProgram = () => {
    if (loadingDetail) return <InlineSpinner minH={400} />;
    const mp = activeProgram;
    if (!mp) return <div className="empty-state">Selecciona un programa</div>;

    const activities = programDetail?.activities || mp.activities || [];

    const getStatusBadge = (st: string) => (
      <span className={`badge ${st === 'active' || st === 'running' ? 'badge-active' : st === 'completed' ? 'badge-completed' : 'badge-draft'}`}>
        {LABELS.status[st] || st}
      </span>
    );

    const pageTitle = ({ participants: 'Participantes', activities: 'Actividades', milestones: 'Hitos', ecosystem: 'Ecosistema' } as Record<string, string>)[detailTab];
    const pageSubtitle = `${roleLabel} · ${programTemplate?.duration || mp.name}`;

    return (
      <div className={`pd-wrapper${detailTab === 'ecosystem' ? ' pd-wrapper-eco' : ''}`}>
        {/* ── CONTENT ── */}
        <div className={`pd-content${detailTab === 'ecosystem' ? ' pd-content-eco' : ''}`}>

          {/* ── Encabezado de página — mismo estilo que Inicio, sin banner de color ── */}
          {detailTab !== 'ecosystem' && (
            <div className="pd-page-header">
              <div>
                <h1 className="dash-title">{pageTitle}</h1>
                <p className="dash-subtitle">{pageSubtitle}</p>
              </div>
            </div>
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
              <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Actividades del Programa</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                    {activities.length} actividad{activities.length !== 1 ? 'es' : ''} ·{' '}
                    {activities.filter((a: any) => a.start_date).length} agendada{activities.filter((a: any) => a.start_date).length !== 1 ? 's' : ''}
                  </div>
                </div>
                {lastSyncedAt && <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Sincronizado {lastSyncedAt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>}
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
                          <th>Nombre</th><th>Tipo</th><th>Modalidad</th><th>Fecha</th><th>Reunión</th><th>Dirigido a</th><th>Obligatoria</th><th>Estado</th>
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
                            <td>{LABELS.modality[a.modality] || a.modality || '—'}</td>
                            <td style={{ fontSize: '0.75rem' }}>
                              {a.start_date ? (
                                <span style={{ color: '#0e7490', fontWeight: 600 }}>
                                  {new Date(a.start_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  <div style={{ color: '#9ca3af', fontSize: '0.7rem', fontWeight: 500 }}>{new Date(a.start_date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</div>
                                </span>
                              ) : (
                                <span style={{ color: '#d97706', fontStyle: 'italic' }}>Sin agendar</span>
                              )}
                            </td>
                            <td>
                              {a.meeting_url ? (
                                <a href={a.meeting_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0891b2', fontSize: '0.75rem', fontWeight: 600 }}>Unirse →</a>
                              ) : '—'}
                            </td>
                            <td>{LABELS.targetRole[a.target_role] || a.target_role || '—'}</td>
                            <td>{a.is_mandatory ? 'Sí' : 'No'}</td>
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
              {ecosystemLoading && !ecosystemData && <InlineSpinner minH={500} />}
              {!ecosystemLoading && !ecosystemData && (
                <div className="empty-state">No se pudo cargar el ecosistema de este programa.</div>
              )}
              {ecosystemData && (() => {
                const nodes: EcoNodeDatum[] = ecosystemData.nodes || [];
                const edges: EcoEdgeDatum[] = ecosystemData.edges || [];
                const challenges = ecosystemData.challenges || [];
                const stats = ecosystemData.stats || {};
                const viewer = nodes.find(n => n.is_viewer);
                const selectedNode = ecoSelectedId ? nodes.find(n => n.id === ecoSelectedId) : null;
                const selectedEdge = selectedNode ? edges.find(e => (e.source === selectedNode.id && e.target === (viewer?.id || '')) || (e.target === selectedNode.id && e.source === (viewer?.id || ''))) : null;
                const activeFilterCount = [ecoRoleFilter !== 'all', ecoCityOnly, ecoInteractedOnly].filter(Boolean).length;

                return (
                  <div className="eco-wrap">
                    {/* Header row: title + stat cards + view/filter controls */}
                    <div className="eco-header-row">
                      <div>
                        <h1 className="dash-title" style={{ marginBottom: 2 }}>Mi Ecosistema de Influencia</h1>
                        <p className="dash-subtitle">{ecosystemData.program?.name} · {nodes.length} participantes</p>
                      </div>
                      <div className="eco-stat-cards">
                        <div className="eco-stat-card">
                          <div className="eco-stat-label">Sesiones completadas</div>
                          <div className="eco-stat-value">{stats.sessions_completed || 0} / {stats.sessions_planned || 0}</div>
                          <div className="eco-stat-bar"><div style={{ width: `${stats.sessions_planned ? Math.min(100, (stats.sessions_completed / stats.sessions_planned) * 100) : 0}%` }} /></div>
                        </div>
                        <div className="eco-stat-card">
                          <div className="eco-stat-label">Duplas activas</div>
                          <div className="eco-stat-value">{stats.duplas_active || 0} / {stats.duplas_total || 0}</div>
                          <div className="eco-stat-icon"><EcoIcons.users /></div>
                        </div>
                        <div className="eco-stat-card">
                          <div className="eco-stat-label">Desafíos activos</div>
                          <div className="eco-stat-value">{stats.challenges_completed || 0} / {stats.challenges_total || 0}</div>
                          <div className="eco-stat-icon"><EcoIcons.trophy /></div>
                        </div>
                      </div>
                      <div className="eco-header-actions">
                        <div style={{ position: 'relative' }}>
                          <button className="eco-dropdown-btn" onClick={() => { setEcoViewMenuOpen(v => !v); setEcoFiltersOpen(false); }}>
                            <EcoIcons.eye /> Ver duplas {ecoViewDuplasOnly && <span className="eco-dot" />} <EcoIcons.chevronDown />
                          </button>
                          {ecoViewMenuOpen && (
                            <div className="eco-dropdown-panel">
                              <label className="eco-toggle-row">
                                <input type="checkbox" checked={ecoViewDuplasOnly} onChange={e => setEcoViewDuplasOnly(e.target.checked)} />
                                Mostrar solo duplas (ocultar red social)
                              </label>
                            </div>
                          )}
                        </div>
                        <div style={{ position: 'relative' }}>
                          <button className="eco-dropdown-btn" onClick={() => { setEcoFiltersOpen(v => !v); setEcoViewMenuOpen(false); }}>
                            <EcoIcons.filter /> Filtros {activeFilterCount > 0 && <span className="eco-badge-count">{activeFilterCount}</span>} <EcoIcons.chevronDown />
                          </button>
                          {ecoFiltersOpen && (
                            <div className="eco-dropdown-panel">
                              {(['all', 'mentor', 'mentee'] as const).map(r => (
                                <label key={r} className="eco-toggle-row">
                                  <input type="radio" name="eco-role" checked={ecoRoleFilter === r} onChange={() => setEcoRoleFilter(r)} />
                                  {r === 'all' ? 'Todos' : r === 'mentor' ? 'Mentores' : 'Mentees'}
                                </label>
                              ))}
                              <div className="eco-dropdown-sep" />
                              <label className="eco-toggle-row">
                                <input type="checkbox" checked={ecoCityOnly} onChange={e => setEcoCityOnly(e.target.checked)} />
                                Mi ciudad ({viewer?.city || '—'})
                              </label>
                              <label className="eco-toggle-row">
                                <input type="checkbox" checked={ecoInteractedOnly} onChange={e => setEcoInteractedOnly(e.target.checked)} />
                                Con quienes he interactuado
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Main 3-column layout */}
                    <div className="eco-main-grid">
                      {/* Left column */}
                      <div className="eco-left-col">
                        <div className="eco-panel">
                          <div className="eco-panel-title">Leyenda</div>
                          <div className="eco-legend-item"><span className="eco-legend-dot" style={{ border: '2px solid #14b8a6', background: '#fff' }} /> Tú</div>
                          <div className="eco-legend-item"><span className="eco-legend-dot" style={{ background: '#3b82f6' }} /> Mentee</div>
                          <div className="eco-legend-item"><span className="eco-legend-dot" style={{ background: '#22c55e' }} /> Mentor</div>
                          <div className="eco-legend-item"><span className="eco-legend-line" style={{ background: '#14b8a6', height: 4 }} /> Dupla (mentoría)</div>
                          <div className="eco-legend-item"><span className="eco-legend-line eco-legend-line-dashed" /> Vínculo social</div>
                        </div>
                        <div className="eco-panel">
                          <div className="eco-panel-title">Ciudades</div>
                          {(stats.cities || []).length === 0 && <div className="eco-empty-hint">Sin datos de ciudad aún.</div>}
                          {(stats.cities || []).map((c: any) => (
                            <div key={c.city} className="eco-city-row">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><EcoIcons.pin /> {c.city}</span><span className="eco-city-count">{c.count}</span>
                            </div>
                          ))}
                        </div>
                        <div className="eco-panel">
                          <div className="eco-panel-title">Desafíos activos</div>
                          <div className="eco-panel-sub">{stats.challenges_completed || 0} / {stats.challenges_total || 0} completados</div>
                          {challenges.map((c: any) => (
                            <div key={c.id} className="eco-challenge-row">
                              <div className={`eco-challenge-check ${c.completed ? 'done' : ''}`}>{c.completed ? '✓' : ''}</div>
                              <div style={{ flex: 1 }}>
                                <div className="eco-challenge-label">{c.label}</div>
                                <div className="eco-mini-bar"><div style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }} /></div>
                              </div>
                              <div className="eco-challenge-frac">{c.progress}/{c.target}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Center: graph */}
                      <div className="eco-graph-col">
                        <EcosystemGraph
                          nodes={nodes} edges={edges} height={620}
                          selectedId={ecoSelectedId} onSelect={setEcoSelectedId}
                          viewDuplasOnly={ecoViewDuplasOnly} roleFilter={ecoRoleFilter}
                          viewerCity={viewer?.city || ''} cityOnly={ecoCityOnly} interactedOnly={ecoInteractedOnly}
                          viewerId={ecosystemData.viewer_id}
                        />
                      </div>

                      {/* Right column: selected participant OR hint */}
                      <div className="eco-right-col">
                        {selectedNode ? (
                          <div className="eco-panel eco-detail-panel">
                            <button className="eco-detail-close" onClick={() => setEcoSelectedId(null)}>×</button>
                            <div className="eco-detail-header">
                              <div className="eco-detail-avatar" style={{ borderColor: selectedNode.role === 'mentor' ? '#22c55e' : '#3b82f6' }}>
                                {selectedNode.avatar_url ? <img src={selectedNode.avatar_url} alt="" /> : <span>{ecoInitials(selectedNode.full_name)}</span>}
                              </div>
                              <div>
                                <div className="eco-detail-name">{selectedNode.full_name || 'Participante'}</div>
                                <div className="eco-detail-role" style={{ color: selectedNode.role === 'mentor' ? '#22c55e' : '#3b82f6' }}>
                                  {selectedNode.role === 'mentor' ? 'Mentor' : 'Mentee'}
                                </div>
                                {selectedNode.city && <div className="eco-detail-city"><EcoIcons.pin /> {selectedNode.city}</div>}
                              </div>
                            </div>
                            {!selectedNode.profile_complete ? (
                              <div className="eco-incomplete-note">Esta persona aún no ha completado sus datos de perfil.</div>
                            ) : (
                              <div className="eco-detail-fields">
                                {selectedNode.area && <div><span>Área</span><span>{selectedNode.area}</span></div>}
                                {selectedNode.career && <div><span>Carrera</span><span>{selectedNode.career}</span></div>}
                                {selectedNode.position && <div><span>Cargo</span><span>{selectedNode.position}</span></div>}
                                {selectedNode.organization && <div><span>Organización</span><span>{selectedNode.organization}</span></div>}
                              </div>
                            )}
                            {selectedEdge && selectedEdge.type === 'MENTORSHIP' && (
                              <div className="eco-detail-sessions">
                                <span>Sesiones completadas</span>
                                <span>{selectedEdge.sessions_completed} / {selectedEdge.sessions_planned || selectedEdge.sessions_completed}</span>
                                <div className="eco-mini-bar"><div style={{ width: `${selectedEdge.sessions_planned ? Math.min(100, (selectedEdge.sessions_completed / selectedEdge.sessions_planned) * 100) : 0}%` }} /></div>
                              </div>
                            )}
                            {!selectedNode.is_viewer && (
                              <>
                                <button className="eco-btn-primary" onClick={() => navigate('my-chat')}><EcoIcons.message /> Ir al chat del programa</button>
                                <div className="eco-empty-hint" style={{ marginTop: -4, marginBottom: 10, textAlign: 'center' }}>El chat es grupal — todo el programa participa ahí.</div>
                                {selectedNode.is_my_dupla && (
                                  <button className="eco-btn-secondary" onClick={() => navigate(isMentee ? 'my-mentor' : 'my-sessions')}>Ir a mi espacio de mentoría</button>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="eco-panel">
                            <div className="eco-panel-title">Insights</div>
                            {(stats.insights || []).map((ins: string, i: number) => (
                              <div key={i} className="eco-insight-row"><EcoIcons.bulb /> {ins}</div>
                            ))}
                            <div className="eco-empty-hint" style={{ marginTop: 10 }}>Haz clic en una persona del grafo para ver su ficha.</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom stats bar */}
                    <div className="eco-bottom-bar">
                      <div className="eco-bottom-section">
                        <div className="eco-panel-title">Tu red en números</div>
                        <div className="eco-bottom-numbers">
                          <div><strong>{stats.direct_connections || 0}</strong><span>Conexiones directas</span></div>
                          <div><strong>{stats.mentors_connected || 0}</strong><span>Mentores conectados</span></div>
                          <div><strong>{stats.mentees_connected || 0}</strong><span>Mentees conectados</span></div>
                          <div><strong>{stats.cities_connected || 0}</strong><span>Ciudades conectadas</span></div>
                        </div>
                      </div>
                      <div className="eco-bottom-section">
                        <div className="eco-panel-title">Nivel de conexión</div>
                        {(() => {
                          const lv = stats.connection_levels || { strong: 0, medium: 0, weak: 0, none: 0 };
                          const total = Math.max(1, lv.strong + lv.medium + lv.weak + lv.none);
                          return (
                            <>
                              <div className="eco-level-row"><span>Fuerte</span><strong>{lv.strong}</strong></div>
                              <div className="eco-level-track"><div style={{ width: `${(lv.strong / total) * 100}%`, background: '#14b8a6' }} /></div>
                              <div className="eco-level-row"><span>Media</span><strong>{lv.medium}</strong></div>
                              <div className="eco-level-track"><div style={{ width: `${(lv.medium / total) * 100}%`, background: '#94a3b8' }} /></div>
                              <div className="eco-level-row"><span>Débil</span><strong>{lv.weak}</strong></div>
                              <div className="eco-level-track"><div style={{ width: `${(lv.weak / total) * 100}%`, background: '#cbd5e1' }} /></div>
                            </>
                          );
                        })()}
                      </div>
                      <div className="eco-bottom-section">
                        <div className="eco-panel-title">Insights</div>
                        {(stats.insights || []).map((ins: string, i: number) => (
                          <div key={i} className="eco-insight-row">💡 {ins}</div>
                        ))}
                      </div>
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
  // RENDER: MÓDULOS — misma vista que Studio (Vista General / Módulos / Configuración)
  // ══════════════════════════════════════════════════════════════════════════
  const renderModulesPreview = () => {
    if (!selectedProgram) return <div className="empty-state">Selecciona un programa</div>;
    if (!selectedProgram.template_slug) return <div className="empty-state">Este programa no tiene una plantilla de módulos configurada</div>;
    if (modulesTemplateLoading || !modulesTemplate || modulesTemplate.slug !== selectedProgram.template_slug) return <InlineSpinner minH={400} />;
    return (
      <ProgramPreviewView
        template={modulesTemplate}
        showAssignedPrograms={false}
        onBack={() => navigate('dashboard')}
        backLabel="Inicio"
      />
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: PROGRESS
  // ══════════════════════════════════════════════════════════════════════════
  const renderProgressSection = () => {
    if (loadingDetail) return <InlineSpinner minH={200} />;
    const mp = activeProgram;
    if (!mp) return null;

    const modules = programTemplate?.modules || [];
    const milestones = programTemplate?.milestones || [];
    const activities = programDetail?.activities || mp.activities || [];
    const durationStr = programTemplate?.duration || '2 meses';

    // ── Calculate program timeline ──
    const durationMatch = durationStr.match(/(\d+)/);
    const durationMonths = durationMatch ? parseInt(durationMatch[1]) : 2;
    const totalWeeks = durationMonths * 4;

    // Use REAL cronograma dates if the PM scheduled them; fall back to joined_at + template duration
    const scheduledActivities = activities.filter((a: any) => a.start_date).map((a: any) => new Date(a.start_date).getTime()).sort((a: number, b: number) => a - b);
    const scheduledEnds = activities.filter((a: any) => a.end_date || a.start_date).map((a: any) => new Date(a.end_date || a.start_date).getTime()).sort((a: number, b: number) => a - b);
    const hasRealSchedule = scheduledActivities.length > 0;
    const startDate = hasRealSchedule
      ? new Date(scheduledActivities[0])
      : new Date(mp.joined_at || mp.created_at || Date.now() - 30 * 24 * 3600 * 1000);
    const endDate = hasRealSchedule && scheduledEnds.length > 0
      ? new Date(scheduledEnds[scheduledEnds.length - 1])
      : new Date(startDate.getTime() + durationMonths * 30 * 24 * 3600 * 1000);
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

    const completedModules = moduleStatuses.filter((m: any) => m.status === 'completed').length;
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
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          Progreso · Semana {currentWeek} de {totalWeeks}
        </h2>

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
      </div>
    );
  };

  // ── Profile helpers ──
  const startEditProfile = () => {
    setProfileForm({
      full_name: portalUser?.full_name || [portalUser?.first_name, portalUser?.last_name].filter(Boolean).join(' ').trim() || '',
      phone: portalUser?.phone || '',
      position: portalUser?.position || '',
      department: portalUser?.department || '',
      linkedin_url: portalUser?.linkedin_url || '',
      bio: portalUser?.bio || '',
      headline: portalUser?.headline || '',
      skills: Array.isArray(portalUser?.skills) ? [...portalUser.skills] : [],
      gender: portalUser?.gender || '',
      personal_email: portalUser?.personal_email || '',
      presentation: portalUser?.presentation || '',
      residence_city: portalUser?.residence_city || '',
      work_location: portalUser?.work_location || '',
      area_or_function: portalUser?.area_or_function || '',
      career: portalUser?.career || '',
      mentor_topics: Array.isArray(portalUser?.mentor_topics) ? [...portalUser.mentor_topics] : [],
      mentor_objectives: Array.isArray(portalUser?.mentor_objectives) ? [...portalUser.mentor_objectives] : [],
      mentor_style: Array.isArray(portalUser?.mentor_style) ? [...portalUser.mentor_style] : [],
      experience_level: portalUser?.experience_level || '',
      experience_area: Array.isArray(portalUser?.experience_area) ? [...portalUser.experience_area] : [],
      mentee_preference: Array.isArray(portalUser?.mentee_preference) ? [...portalUser.mentee_preference] : [],
      mentee_outcomes: Array.isArray(portalUser?.mentee_outcomes) ? [...portalUser.mentee_outcomes] : [],
      session_structure: Array.isArray(portalUser?.session_structure) ? [...portalUser.session_structure] : [],
      mentee_goals: Array.isArray(portalUser?.mentee_goals) ? [...portalUser.mentee_goals] : [],
      mentee_interests: Array.isArray(portalUser?.mentee_interests) ? [...portalUser.mentee_interests] : [],
      mentee_challenges: Array.isArray(portalUser?.mentee_challenges) ? [...portalUser.mentee_challenges] : [],
      mentee_expectations: Array.isArray(portalUser?.mentee_expectations) ? [...portalUser.mentee_expectations] : [],
      preferred_mentor_style: Array.isArray(portalUser?.preferred_mentor_style) ? [...portalUser.preferred_mentor_style] : [],
      session_format_preference: Array.isArray(portalUser?.session_format_preference) ? [...portalUser.session_format_preference] : [],
    });
    setProfileEditing(true);
    setProfileMsg('');
    // Start from where user left off, or step 1
    if (isMentee) {
      setMentorStep(Math.max(1, Math.min(6, (portalUser?.mentee_profile_step || 0) + 1)));
    } else {
      setMentorStep(Math.max(1, Math.min(6, (portalUser?.mentor_profile_step || 0) + 1)));
    }
  };

  const cancelEditProfile = () => {
    setProfileEditing(false);
    setProfileMsg('');
  };

  const saveProfile = async (stepOverride?: number) => {
    if (isAdminPreview) { blockInPreview(); return; }
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const bodyData: any = { ...profileForm };
      // When step is completed, update the profile_step for the correct role
      if (stepOverride !== undefined) {
        if (isMentee) {
          bodyData.mentee_profile_step = stepOverride;
        } else {
          bodyData.mentor_profile_step = stepOverride;
        }
      }
      const res = await apiFetch(`${API_URL}/api/companies/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bodyData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error al guardar');
      }
      const updated = await res.json();
      setPortalUser((prev: any) => ({ ...prev, ...updated }));
      if (stepOverride !== undefined && stepOverride >= 6) {
        setProfileEditing(false);
        setMentorStep(0);
        setProfileMsg('ok:¡Perfil completado exitosamente!');
      } else if (stepOverride !== undefined) {
        setProfileMsg('ok:Paso guardado correctamente');
      } else {
        setProfileEditing(false);
        setProfileMsg('ok:Perfil actualizado correctamente');
      }
    } catch (e: any) {
      setProfileMsg('err:' + (e.message || 'Error al guardar'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAdminPreview) { blockInPreview(); return; }
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
      const res = await apiFetch(`${API_URL}/api/companies/auth/avatar`, {
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
    if (isAdminPreview) { blockInPreview(); return; }
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setAvatarUploading(true);
    try {
      await apiFetch(`${API_URL}/api/companies/auth/avatar`, {
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

  const initials = bestName(portalUser, 'U')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  /* ── Mentor multi-step wizard helpers ── */
  const MENTOR_TOPICS = ['Liderazgo', 'Comunicación efectiva', 'Desarrollo de carrera', 'Gestión de equipos', 'Marca personal y posicionamiento profesional', 'Networking y visibilidad', 'Transiciones laborales', 'Bienestar y equilibrio', 'Influencia e impacto'];
  const MENTOR_OBJECTIVES = ['Ganar claridad sobre su rumbo profesional', 'Prepararse para un nuevo desafío', 'Fortalecer su seguridad y autoconfianza', 'Mejorar sus habilidades de comunicación', 'Diseñar un plan de crecimiento', 'Desarrollar su liderazgo', 'Navegar un cambio organizacional o de carrera', 'Ordenar prioridades y foco'];
  const MENTOR_STYLES = ['Cercano y contenedor', 'Estratégico y orientado a objetivos', 'Práctico y enfocado en la acción', 'Reflexivo, basado en preguntas', 'Directo y desafiante', 'Inspirador y motivador', 'Mixto, depende del momento'];
  const EXP_LEVELS = ['3 a 5 años', '6 a 10 años', '11 a 15 años', '16 a 20 años', 'Más de 20 años'];
  const EXP_AREAS = ['Operaciones', 'Comercial / Ventas', 'Marketing', 'Personas / RRHH', 'Finanzas', 'Tecnología', 'Sostenibilidad / RSE', 'Proyectos / Innovación', 'Supply chain / Logística'];
  const MENTEE_PREFS = ['Personas en etapa inicial de su carrera', 'Talento con alto potencial en transición a roles de liderazgo', 'Personas en transición laboral o reinvención profesional', 'Nuevas jefaturas o primeros cargos de liderazgo', 'Profesionales que buscan mayor visibilidad o posicionamiento', 'Personas que enfrentan desafíos de comunicación o equipos', 'Me adapto según la necesidad'];
  const MENTEE_OUTCOMES_OPTS = ['Más claridad sobre su camino profesional', 'Mayor confianza en sí misma', 'Un plan de acción concreto', 'Herramientas para liderar mejor', 'Mejor comunicación e influencia', 'Más foco y orden en sus prioridades', 'Una mirada más amplia de su carrera'];
  const SESSION_STRUCTURES = ['Conversación abierta y flexible', 'Sesiones con objetivos claros por encuentro', 'Trabajo sobre casos o situaciones reales del mentee', 'Seguimiento de avances entre sesiones', 'Uso de herramientas y ejercicios prácticos', 'Mixto, según la etapa del proceso'];

  /* ── Mentee multi-step wizard helpers ── */
  const MENTEE_GOALS = ['Desarrollar mi liderazgo', 'Crecer profesionalmente', 'Explorar un cambio de carrera', 'Mejorar mi comunicación', 'Ampliar mi red de contactos', 'Ganar confianza y seguridad', 'Lograr equilibrio vida-trabajo', 'Definir mi propósito profesional', 'Prepararme para un nuevo rol'];
  const MENTEE_INTEREST_AREAS = ['Liderazgo', 'Comunicación efectiva', 'Desarrollo de carrera', 'Gestión de equipos', 'Marca personal y posicionamiento', 'Networking y visibilidad', 'Transiciones laborales', 'Bienestar y equilibrio', 'Innovación y emprendimiento'];
  const MENTEE_CHALLENGE_OPTS = ['Falta de claridad en mi carrera', 'Dificultad para tomar decisiones', 'Baja visibilidad en la organización', 'Gestión del tiempo y prioridades', 'Manejo de equipos o personas', 'Comunicación con stakeholders', 'Transición a nuevo rol o área', 'Síndrome del impostor', 'Falta de red de apoyo profesional'];
  const MENTEE_EXPECTATION_OPTS = ['Orientación práctica y concreta', 'Escucha activa y empatía', 'Feedback directo y honesto', 'Herramientas y frameworks útiles', 'Acompañamiento emocional', 'Desafío y provocación constructiva', 'Conexión con otros profesionales', 'Un espacio seguro para reflexionar'];
  const PREFERRED_MENTOR_STYLES = ['Cercano y contenedor', 'Estratégico y orientado a resultados', 'Directo y desafiante', 'Inspirador y motivacional', 'Reflexivo y analítico', 'Práctico y enfocado en la acción', 'Me adapto, no tengo preferencia'];
  const SESSION_FORMAT_OPTS = ['Conversación abierta y flexible', 'Agenda estructurada por sesión', 'Ejercicios y actividades prácticas', 'Trabajo sobre casos reales míos', 'Seguimiento de compromisos entre sesiones', 'Mixto, según el momento'];

  const toggleArrayItem = (field: string, value: string) => {
    setProfileForm(f => {
      const arr = (f as any)[field] as string[];
      return { ...f, [field]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value] };
    });
  };

  const addOtherItem = (field: string, value: string, setter: (v: string) => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setProfileForm(f => {
      const arr = (f as any)[field] as string[];
      if (arr.includes(trimmed)) return f;
      return { ...f, [field]: [...arr, trimmed] };
    });
    setter('');
  };

  const TOTAL_WIZARD_STEPS = 6;
  const wizardStepLabels = isMentee
    ? ['', 'Sobre ti', 'Tu rol', 'Tu historia', 'Objetivos', 'Experiencia', 'Expectativas']
    : ['', 'Sobre ti', 'Tu rol', 'Tu historia', 'Expertise del Mentor', 'Experiencia', 'Expectativas'];

  const MultiChip = ({ options, field, allowOther, otherValue, onOtherChange, onOtherAdd }: {
    options: string[]; field: string; allowOther?: boolean; otherValue?: string; onOtherChange?: (v: string) => void; onOtherAdd?: () => void;
  }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const selected = ((profileForm as any)[field] as string[]).includes(opt);
        return (
          <button key={opt} type="button" className="chip-btn" onClick={() => toggleArrayItem(field, opt)} style={{
            padding: '8px 16px', borderRadius: 20, border: selected ? '2px solid #FFD902' : '1.5px solid #d1d5db',
            background: selected ? '#FFFBD6' : '#fff', color: selected ? '#8a6d00' : '#4b5563',
            fontSize: '0.8rem', fontWeight: selected ? 600 : 400, cursor: 'pointer',
            boxShadow: selected ? '0 2px 8px rgba(255,217,2,0.28)' : 'none',
          }}>{opt}</button>
        );
      })}
      {/* Custom items not in predefined list */}
      {((profileForm as any)[field] as string[]).filter((v: string) => !options.includes(v)).map((v: string) => (
        <button key={v} type="button" className="chip-btn" onClick={() => toggleArrayItem(field, v)} style={{
          padding: '8px 16px', borderRadius: 20, border: '2px solid #FFD902',
          background: '#FFFBD6', color: '#8a6d00', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(255,217,2,0.28)',
        }}>{v} ×</button>
      ))}
      {allowOther && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input value={otherValue || ''} onChange={e => onOtherChange?.(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onOtherAdd?.(); } }}
            placeholder="Otra…" maxLength={60}
            style={{ padding: '8px 12px', borderRadius: 20, border: '1.5px solid #d1d5db', fontSize: '0.8rem', width: 130 }} />
          <button type="button" className="chip-btn" onClick={onOtherAdd} style={{
            padding: '6px 12px', borderRadius: 20, border: 'none', background: '#FFD902', color: '#1a1a1a',
            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
          }}>+</button>
        </div>
      )}
    </div>
  );

  const SingleChip = ({ options, field }: { options: string[]; field: string }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const selected = (profileForm as any)[field] === opt;
        return (
          <button key={opt} type="button" className="chip-btn" onClick={() => setProfileForm(f => ({ ...f, [field]: opt }))} style={{
            padding: '8px 16px', borderRadius: 20, border: selected ? '2px solid #FFD902' : '1.5px solid #d1d5db',
            background: selected ? '#FFFBD6' : '#fff', color: selected ? '#8a6d00' : '#4b5563',
            fontSize: '0.8rem', fontWeight: selected ? 600 : 400, cursor: 'pointer',
            boxShadow: selected ? '0 2px 8px rgba(255,217,2,0.28)' : 'none',
          }}>{opt}</button>
        );
      })}
    </div>
  );

  const renderProfile = () => {
    // If editing (wizard mode), show the multi-step wizard inside a modal overlay
    const wizardModal = profileEditing && mentorStep >= 1 && (() => {
      const personalEmailInvalid = profileForm.personal_email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.personal_email.trim());
      const stepMissingLabels: string[] = [];
      if (mentorStep === 1 && personalEmailInvalid) stepMissingLabels.push('Mail personal (formato inválido)');
      if (mentorStep === 2) {
        if (!profileForm.position.trim()) stepMissingLabels.push(isMentee ? 'Cargo actual o etapa profesional' : 'Cargo actual');
        if (!profileForm.department.trim()) stepMissingLabels.push(isMentee ? 'Empresa / institución' : 'Empresa / Área');
        if (!profileForm.residence_city.trim()) stepMissingLabels.push('Ciudad de residencia');
        if (!isMentee && !profileForm.work_location.trim()) stepMissingLabels.push('Localidad laboral');
        if (isMentee && !profileForm.area_or_function.trim()) stepMissingLabels.push('Área o función');
        if (isMentee && !profileForm.career.trim()) stepMissingLabels.push('Carrera');
      }
      if (mentorStep === 3 && !profileForm.presentation.trim()) stepMissingLabels.push('Breve presentación');

      return (
        <div className="prof-modal-overlay" onClick={cancelEditProfile}>
          <div className="prof-modal-dialog" onClick={e => e.stopPropagation()}>
            <button className="prof-modal-close" onClick={cancelEditProfile} aria-label="Cerrar">×</button>
            <div className="dash-header" style={{ marginBottom: 18 }}>
              <h1 className="dash-title">Completa tu Perfil {isMentee ? 'de Mentee' : 'de Mentor'}</h1>
              <p className="dash-subtitle">Paso {mentorStep} de {TOTAL_WIZARD_STEPS} — {wizardStepLabels[mentorStep]}</p>
            </div>

            {profileMsg && (
              <div className={`prof-msg ${profileMsg.startsWith('ok:') ? 'prof-msg-ok' : 'prof-msg-err'}`}>
                {profileMsg.replace(/^(ok:|err:)/, '')}
              </div>
            )}

            {/* Step indicator */}
            <div className="prof-step-track">
              {Array.from({ length: TOTAL_WIZARD_STEPS }, (_, i) => i + 1).map(s => (
                <div key={s} className="prof-step-item">
                  {s < TOTAL_WIZARD_STEPS && <div className="prof-step-line" style={{ '--fill': s < mentorStep ? 1 : 0 } as React.CSSProperties} />}
                  <div className={`prof-step-circle ${s < mentorStep ? 'done' : s === mentorStep ? 'current' : 'upcoming'}`}>
                    {s < mentorStep ? '✓' : s}
                  </div>
                  <div className={`prof-step-label ${s <= mentorStep ? 'active' : ''}`}>{wizardStepLabels[s]}</div>
                </div>
              ))}
            </div>

            <div className="prof-form-card">
              <div className="prof-form-body" key={mentorStep}>

                {/* ════ STEP 1: Sobre ti ════ */}
                {mentorStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Empecemos por lo básico — esto nos ayuda a identificarte en la plataforma.</div>
                    {/* Avatar upload */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 4 }}>
                      <div className="prof-avatar" style={{ width: 84, height: 84, fontSize: '1.4rem' }}>
                        {portalUser?.avatar_url ? <img src={portalUser.avatar_url} alt="Avatar" /> : initials}
                        <label className="prof-avatar-overlay" htmlFor="avatar-upload" style={{ borderRadius: '50%' }}>
                          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" /></svg>
                        </label>
                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>Foto de perfil</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Sube una foto profesional (máx. 2 MB)</div>
                        {avatarUploading && <div style={{ fontSize: '0.72rem', color: '#8a6d00', marginTop: 4 }}>Subiendo...</div>}
                      </div>
                    </div>

                    <div className="prof-form-grid">
                      <div className="prof-field">
                        <label>Nombre y apellido *</label>
                        <input
                          value={profileForm.full_name}
                          readOnly
                          title="Este dato fue recogido al momento de la invitación. Si necesitas modificarlo, contacta a tu coordinador."
                          style={{ background: '#f3f4f6', color: '#374151', cursor: 'not-allowed' }}
                        />
                        <span className="prof-hint" style={{ color: '#6b7280' }}>Recogido al invitarte. Pídele a tu coordinador modificarlo si es necesario.</span>
                      </div>
                      <div className="prof-field">
                        <label>Email de acceso</label>
                        <input
                          type="email"
                          value={portalUser?.email || ''}
                          readOnly
                          title="Este es el email con el que accedes al portal."
                          style={{ background: '#f3f4f6', color: '#374151', cursor: 'not-allowed' }}
                        />
                        <span className="prof-hint" style={{ color: '#6b7280' }}>Este es tu email de acceso a la plataforma. No se puede modificar.</span>
                      </div>
                      {!isMentee && (
                        <>
                          <div className="prof-field">
                            <label>Género</label>
                            <select value={profileForm.gender} onChange={e => setProfileForm(f => ({ ...f, gender: e.target.value }))}>
                              <option value="">Seleccionar...</option>
                              <option value="masculino">Masculino</option>
                              <option value="femenino">Femenino</option>
                              <option value="no_binario">No binario</option>
                              <option value="prefiero_no_decir">Prefiero no decir</option>
                            </select>
                          </div>
                          <div className="prof-field">
                            <label>Mail personal</label>
                            <input type="email" value={profileForm.personal_email} onChange={e => setProfileForm(f => ({ ...f, personal_email: e.target.value }))} placeholder="tu@correo-personal.com"
                              style={personalEmailInvalid ? { borderColor: '#dc2626' } : undefined} />
                            {personalEmailInvalid && <span className="prof-hint" style={{ color: '#dc2626' }}>Ese email no parece válido.</span>}
                          </div>
                        </>
                      )}
                    </div>
                    {stepMissingLabels.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
                        Falta completar: {stepMissingLabels.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* ════ STEP 2: Tu rol profesional ════ */}
                {mentorStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>Esto es clave para encontrarte el match ideal — sé lo más específico posible.</div>
                    <div className="prof-form-grid">
                      {!isMentee && (
                        <>
                          <div className="prof-field">
                            <label>Cargo actual *</label>
                            <input value={profileForm.position} onChange={e => setProfileForm(f => ({ ...f, position: e.target.value }))} placeholder="Ej: Gerente de Innovación" />
                          </div>
                          <div className="prof-field">
                            <label>Empresa / Área *</label>
                            <input value={profileForm.department} onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))} placeholder="Ej: Acme Corp / Tecnología" />
                          </div>
                          <div className="prof-field">
                            <label>Ciudad de residencia *</label>
                            <input value={profileForm.residence_city} onChange={e => setProfileForm(f => ({ ...f, residence_city: e.target.value }))} placeholder="Ej: Santiago, Chile" />
                          </div>
                          <div className="prof-field">
                            <label>Localidad laboral *</label>
                            <input value={profileForm.work_location} onChange={e => setProfileForm(f => ({ ...f, work_location: e.target.value }))} placeholder="Ej: Santiago, Chile" />
                          </div>
                          <div className="prof-field">
                            <label>Perfil LinkedIn</label>
                            <input type="url" value={profileForm.linkedin_url} onChange={e => setProfileForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://www.linkedin.com/in/tu-perfil" />
                          </div>
                        </>
                      )}
                      {isMentee && (
                        <>
                          <div className="prof-field">
                            <label>Cargo actual o etapa profesional *</label>
                            <input value={profileForm.position} onChange={e => setProfileForm(f => ({ ...f, position: e.target.value }))} placeholder="Ej: Estudiante de Ingeniería, 5to año" />
                          </div>
                          <div className="prof-field">
                            <label>Empresa / institución *</label>
                            <input value={profileForm.department} onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))} placeholder="Ej: Universidad de Chile" />
                          </div>
                          <div className="prof-field">
                            <label>Área o función *</label>
                            <input value={profileForm.area_or_function} onChange={e => setProfileForm(f => ({ ...f, area_or_function: e.target.value }))} placeholder="Ej: Ingeniería / Marketing" />
                          </div>
                          <div className="prof-field">
                            <label>Carrera *</label>
                            <input value={profileForm.career} onChange={e => setProfileForm(f => ({ ...f, career: e.target.value }))} placeholder="Ej: Ingeniería Civil Industrial" />
                          </div>
                          <div className="prof-field">
                            <label>Ciudad de residencia *</label>
                            <input value={profileForm.residence_city} onChange={e => setProfileForm(f => ({ ...f, residence_city: e.target.value }))} placeholder="Ej: Santiago, Chile" />
                          </div>
                          <div className="prof-field">
                            <label>Perfil LinkedIn</label>
                            <input type="url" value={profileForm.linkedin_url} onChange={e => setProfileForm(f => ({ ...f, linkedin_url: e.target.value }))} placeholder="https://www.linkedin.com/in/tu-perfil" />
                          </div>
                        </>
                      )}
                    </div>
                    {stepMissingLabels.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
                        Falta completar: {stepMissingLabels.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* ════ STEP 3: Tu historia ════ */}
                {mentorStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 4 }}>Cuéntanos tu historia en pocas líneas</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Esto es lo primero que verá la otra persona de tu match — hazlo genuino.</div>
                    </div>
                    <div className="prof-field full">
                      <textarea value={profileForm.presentation} onChange={e => setProfileForm(f => ({ ...f, presentation: e.target.value }))}
                        placeholder={isMentee ? "Cuéntanos en 3 a 5 líneas quién eres, en qué momento profesional estás y qué te gustaría trabajar en este proceso." : "Cuéntanos en 3 a 5 líneas quién eres, qué haces y qué tipo de acompañamiento te gustaría brindar."}
                        maxLength={500} rows={7} style={{ fontSize: '0.92rem' }} />
                      <span className="prof-hint">{profileForm.presentation.length}/500 caracteres</span>
                    </div>
                    {stepMissingLabels.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
                        Falta completar: {stepMissingLabels.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* ════ STEP 4: Role-specific ════ */}
                {mentorStep === 4 && !isMentee && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿En qué temas puedes aportar mayor valor como mentor/a?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={MENTOR_TOPICS} field="mentor_topics" allowOther otherValue={otherTopicInput} onOtherChange={setOtherTopicInput} onOtherAdd={() => addOtherItem('mentor_topics', otherTopicInput, setOtherTopicInput)} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Qué tipo de objetivos te acomoda más acompañar en un mentee?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={MENTOR_OBJECTIVES} field="mentor_objectives" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Cómo describirías tu estilo de acompañamiento?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={MENTOR_STYLES} field="mentor_style" />
                  </div>
                </div>
              )}
              {mentorStep === 4 && isMentee && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Qué te gustaría lograr con este proceso de mentoría?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={MENTEE_GOALS} field="mentee_goals" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿En qué áreas te gustaría desarrollarte o profundizar?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={MENTEE_INTEREST_AREAS} field="mentee_interests" />
                  </div>
                </div>
              )}

              {/* ════ STEP 5: Role-specific ════ */}
              {mentorStep === 5 && !isMentee && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Cuál es tu nivel de experiencia profesional?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona una opción</div>
                    <SingleChip options={EXP_LEVELS} field="experience_level" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿En qué área o función has desarrollado mayor experiencia?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={EXP_AREAS} field="experience_area" allowOther otherValue={otherAreaInput} onOtherChange={setOtherAreaInput} onOtherAdd={() => addOtherItem('experience_area', otherAreaInput, setOtherAreaInput)} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Con qué perfil de mentee te sentirías más cómodo/a trabajando?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={MENTEE_PREFS} field="mentee_preference" />
                  </div>
                </div>
              )}
              {mentorStep === 5 && isMentee && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Cuál es tu nivel de experiencia profesional?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona una opción</div>
                    <SingleChip options={EXP_LEVELS} field="experience_level" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿En qué área o función te desempeñas actualmente?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={EXP_AREAS} field="experience_area" allowOther otherValue={otherAreaInput} onOtherChange={setOtherAreaInput} onOtherAdd={() => addOtherItem('experience_area', otherAreaInput, setOtherAreaInput)} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Cuáles son tus principales desafíos actuales?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={MENTEE_CHALLENGE_OPTS} field="mentee_challenges" />
                  </div>
                </div>
              )}

              {/* ════ STEP 6: Role-specific ════ */}
              {mentorStep === 6 && !isMentee && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Qué esperas que logre una persona al finalizar un proceso de mentoría contigo?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={MENTEE_OUTCOMES_OPTS} field="mentee_outcomes" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Cómo prefieres estructurar las sesiones de mentoría?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={SESSION_STRUCTURES} field="session_structure" />
                  </div>
                </div>
              )}
              {mentorStep === 6 && isMentee && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Qué esperas de tu mentor/a en este proceso?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={MENTEE_EXPECTATION_OPTS} field="mentee_expectations" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Qué estilo de mentor/a prefieres?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={PREFERRED_MENTOR_STYLES} field="preferred_mentor_style" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 4 }}>¿Cómo prefieres que sean las sesiones?</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Selecciona todas las que apliquen</div>
                    <MultiChip options={SESSION_FORMAT_OPTS} field="session_format_preference" />
                  </div>
                </div>
              )}
            </div>

            {/* Wizard navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 26px', borderTop: '1px solid #f3f4f6', background: '#fbfbfc' }}>
              <button className="chip-btn" onClick={() => { if (mentorStep > 1) setMentorStep(s => s - 1); else cancelEditProfile(); }}
                disabled={profileSaving} style={{
                  padding: '10px 22px', borderRadius: 12, border: '1.5px solid #d1d5db', background: '#fff',
                  color: '#4b5563', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                }}>
                {mentorStep === 1 ? 'Cancelar' : '← Anterior'}
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                {mentorStep < TOTAL_WIZARD_STEPS ? (
                  <button className={(stepMissingLabels.length > 0) ? '' : 'chip-btn'} onClick={() => {
                    if (stepMissingLabels.length > 0) { setProfileMsg('err:Completa los campos obligatorios antes de continuar.'); return; }
                    saveProfile(mentorStep); setMentorStep(s => s + 1);
                  }}
                    disabled={profileSaving || stepMissingLabels.length > 0} style={{
                      padding: '10px 28px', borderRadius: 12, border: 'none',
                      background: stepMissingLabels.length > 0 ? '#e5e7eb' : '#FFD902',
                      color: stepMissingLabels.length > 0 ? '#9ca3af' : '#1a1a1a',
                      fontWeight: 600, fontSize: '0.82rem',
                      boxShadow: stepMissingLabels.length > 0 ? 'none' : '0 4px 14px -2px rgba(255,217,2,0.45)',
                      cursor: stepMissingLabels.length > 0 ? 'not-allowed' : 'pointer',
                    }}>
                    {profileSaving ? 'Guardando…' : 'Siguiente →'}
                  </button>
                ) : (
                  <button onClick={() => saveProfile(TOTAL_WIZARD_STEPS)}
                    disabled={profileSaving} style={{
                      padding: '11px 30px', borderRadius: 12, border: 'none',
                      background: 'linear-gradient(135deg, #FFD902 0%, #FFC700 100%)',
                      color: '#1a1a1a', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s',
                      boxShadow: '0 6px 20px -4px rgba(255,217,2,0.55)',
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 26px -4px rgba(255,217,2,0.6)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 20px -4px rgba(255,217,2,0.55)'; }}>
                    {profileSaving ? 'Guardando…' : '✓ Finalizar y desbloquear plataforma'}
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      );
    })();

    // Read-only profile view (after wizard is complete)
    return (
      <>
        {wizardModal}
        <div className="dash-header">
          <h1 className="dash-title">Mi Perfil</h1>
          <p className="dash-subtitle">{roleLabel} en {companyName || 'Inspiratoria'}</p>
        </div>

        {!isProfileComplete && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%)',
            border: '1px solid #fbbf24', borderRadius: 14, padding: '18px 22px', marginBottom: 20,
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#92400e" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e', marginBottom: 4 }}>Completa tu perfil para desbloquear la plataforma</div>
              <div style={{ fontSize: '0.78rem', color: '#a16207', lineHeight: 1.5 }}>
                Necesitas completar los 6 pasos del perfil para acceder a todas las funcionalidades.
              </div>
              <button onClick={startEditProfile} style={{
                marginTop: 10, padding: '8px 20px', borderRadius: 10, border: 'none',
                background: '#f59e0b', color: '#fff', fontWeight: 600, fontSize: '0.78rem',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseOver={e => (e.currentTarget.style.background = '#d97706')}
              onMouseOut={e => (e.currentTarget.style.background = '#f59e0b')}>
                Completar ahora
              </button>
            </div>
          </div>
        )}

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
              ) : initials}
              <label className="prof-avatar-overlay" htmlFor="avatar-upload">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            </div>
            <div className="prof-avatar-name">{fullDisplayName}</div>
            <div className="prof-avatar-role">{roleLabel}</div>
            {portalUser?.presentation && (
              <div style={{ fontSize: '0.78rem', color: '#4b5563', marginBottom: 12, textAlign: 'center', lineHeight: 1.5 }}>{portalUser.presentation}</div>
            )}
            {avatarUploading ? (
              <button className="prof-avatar-btn" disabled>Subiendo...</button>
            ) : (
              <>
                <label htmlFor="avatar-upload" className="prof-avatar-btn" style={{ cursor: 'pointer', textAlign: 'center', display: 'block', marginBottom: 6 }}>Cambiar foto</label>
                {portalUser?.avatar_url && (
                  <button className="prof-avatar-btn" onClick={deleteAvatar} style={{ color: '#ef4444', borderColor: '#fecaca' }}>Eliminar foto</button>
                )}
              </>
            )}
            <div style={{ width: '100%', marginTop: 18, borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 8 }}>Información</div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Email:</span> {portalUser?.email || '—'}
              </div>
              {portalUser?.personal_email && (
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Personal:</span> {portalUser.personal_email}
                </div>
              )}
              {portalUser?.gender && (
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Género:</span> {portalUser.gender === 'masculino' ? 'Masculino' : portalUser.gender === 'femenino' ? 'Femenino' : portalUser.gender === 'no_binario' ? 'No binario' : 'Prefiero no decir'}
                </div>
              )}
              {portalUser?.linkedin_url && (
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>LinkedIn:</span>{' '}
                  <a href={portalUser.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0891b2', textDecoration: 'none' }}>Ver perfil</a>
                </div>
              )}
              <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Portal:</span> <span style={{ fontFamily: 'monospace' }}>{portalCode}</span>
              </div>
              {portalUser?.created_at && (
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                  <span style={{ fontWeight: 600 }}>Miembro desde:</span>{' '}
                  {new Date(portalUser.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Data cards ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Basic info card */}
            <div className="prof-form-card">
              <div className="prof-form-head">
                <span className="prof-form-title">Datos Básicos</span>
                <button className="prof-btn-edit" onClick={startEditProfile}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
              </div>
              <div className="prof-form-body">
                <div className="prof-form-grid">
                  <div className="prof-field"><label>Nombre</label><input disabled value={portalUser?.full_name || '—'} /></div>
                  <div className="prof-field"><label>{isMentee ? 'Cargo / Etapa profesional' : 'Cargo'}</label><input disabled value={portalUser?.position || '—'} /></div>
                  <div className="prof-field"><label>{isMentee ? 'Empresa / Institución' : 'Empresa / Área'}</label><input disabled value={portalUser?.department || '—'} /></div>
                  <div className="prof-field"><label>Experiencia</label><input disabled value={portalUser?.experience_level || '—'} /></div>
                  <div className="prof-field"><label>Ciudad de residencia</label><input disabled value={portalUser?.residence_city || '—'} /></div>
                  {!isMentee && <div className="prof-field"><label>Localidad laboral</label><input disabled value={portalUser?.work_location || '—'} /></div>}
                  {isMentee && <div className="prof-field"><label>Área o función</label><input disabled value={portalUser?.area_or_function || '—'} /></div>}
                  {isMentee && <div className="prof-field"><label>Carrera</label><input disabled value={portalUser?.career || '—'} /></div>}
                </div>
              </div>
            </div>

            {/* Mentor expertise card (mentor only) */}
            {!isMentee && (portalUser?.mentor_topics?.length > 0 || portalUser?.mentor_objectives?.length > 0 || portalUser?.mentor_style?.length > 0) && (
              <div className="prof-form-card">
                <div className="prof-form-head"><span className="prof-form-title">Expertise de Mentoría</span></div>
                <div className="prof-form-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {portalUser?.mentor_topics?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Temas de valor</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.mentor_topics.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#ecfeff', color: '#0e7490', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {portalUser?.mentor_objectives?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Objetivos que acompaña</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.mentor_objectives.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#f0fdf4', color: '#166534', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {portalUser?.mentor_style?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Estilo de acompañamiento</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.mentor_style.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Experience & preferences card (mentor only) */}
            {!isMentee && (portalUser?.experience_area?.length > 0 || portalUser?.mentee_preference?.length > 0) && (
              <div className="prof-form-card">
                <div className="prof-form-head"><span className="prof-form-title">Experiencia y Preferencias</span></div>
                <div className="prof-form-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {portalUser?.experience_area?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Áreas de experiencia</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.experience_area.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#ede9fe', color: '#5b21b6', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {portalUser?.mentee_preference?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Perfil de mentee preferido</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.mentee_preference.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#fce7f3', color: '#9d174d', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expectations card (mentor only) */}
            {!isMentee && (portalUser?.mentee_outcomes?.length > 0 || portalUser?.session_structure?.length > 0) && (
              <div className="prof-form-card">
                <div className="prof-form-head"><span className="prof-form-title">Expectativas</span></div>
                <div className="prof-form-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {portalUser?.mentee_outcomes?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Lo que espero del mentee</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.mentee_outcomes.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#fff7ed', color: '#c2410c', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {portalUser?.session_structure?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Estructura de sesiones</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.session_structure.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#f0f9ff', color: '#0369a1', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Mentee-specific profile cards ── */}
            {isMentee && (portalUser?.mentee_goals?.length > 0 || portalUser?.mentee_interests?.length > 0) && (
              <div className="prof-form-card">
                <div className="prof-form-head"><span className="prof-form-title">Objetivos de Desarrollo</span></div>
                <div className="prof-form-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {portalUser?.mentee_goals?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Lo que quiero lograr</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.mentee_goals.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#ecfeff', color: '#0e7490', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {portalUser?.mentee_interests?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Áreas de interés</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.mentee_interests.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#f0fdf4', color: '#166534', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isMentee && (portalUser?.experience_area?.length > 0 || portalUser?.mentee_challenges?.length > 0) && (
              <div className="prof-form-card">
                <div className="prof-form-head"><span className="prof-form-title">Experiencia y Contexto</span></div>
                <div className="prof-form-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {portalUser?.experience_area?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Área de desempeño</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.experience_area.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#ede9fe', color: '#5b21b6', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {portalUser?.mentee_challenges?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Desafíos actuales</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.mentee_challenges.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isMentee && (portalUser?.mentee_expectations?.length > 0 || portalUser?.preferred_mentor_style?.length > 0 || portalUser?.session_format_preference?.length > 0) && (
              <div className="prof-form-card">
                <div className="prof-form-head"><span className="prof-form-title">Expectativas del Proceso</span></div>
                <div className="prof-form-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {portalUser?.mentee_expectations?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Lo que espero de mi mentor/a</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.mentee_expectations.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#fff7ed', color: '#c2410c', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {portalUser?.preferred_mentor_style?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Estilo de mentor preferido</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.preferred_mentor_style.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#fce7f3', color: '#9d174d', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {portalUser?.session_format_preference?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: 6 }}>Formato de sesiones preferido</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {portalUser.session_format_preference.map((t: string) => (
                          <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#f0f9ff', color: '#0369a1', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Programs card */}
            {myPrograms.length > 0 && (
              <div className="prof-form-card">
                <div className="prof-form-head"><span className="prof-form-title">Mis Programas</span></div>
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
  };

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

  // ═══════════════════════════════════════════════════════════════
  // RENDER: MIS MENTEES
  // ═══════════════════════════════════════════════════════════════
  const renderMentees = () => {
    if (menteesLoading) return <InlineSpinner />;
    if (myMentees.length === 0) return (
      <div>
        <div className="dash-header"><h1 className="dash-title">Mis Mentees</h1><p className="dash-subtitle">Mentees asignados a ti en tus programas de mentoría</p></div>
        <div className="empty-state">Aún no tienes mentees asignados</div>
      </div>
    );

    if (selectedMentee) {
      const m = selectedMentee;
      return (
        <div>
          <div className="dash-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSelectedMentee(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>← </button>
            <div><h1 className="dash-title">Perfil de {bestName(m)}</h1><p className="dash-subtitle">{m.program_name}</p></div>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, color: '#0891b2', overflow: 'hidden', flexShrink: 0 }}>
                {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : bestName(m, 'M').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>{bestName(m)}</div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{m.headline || m.position || ''}</div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{m.department || ''}</div>
              </div>
            </div>
            {m.bio && <div style={{ marginBottom: 16 }}><div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: 4 }}>Bio</div><p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.6 }}>{m.bio}</p></div>}
            {m.linkedin_url && <div style={{ marginBottom: 16 }}><a href={m.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0891b2', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Ver perfil LinkedIn</a></div>}
            {m.skills?.length > 0 && (
              <div><div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: 8 }}>Habilidades</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{m.skills.map((s: string) => <span key={s} style={{ padding: '4px 12px', borderRadius: 16, background: '#ecfeff', color: '#0e7490', fontSize: '0.75rem', fontWeight: 500 }}>{s}</span>)}</div>
              </div>
            )}
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button onClick={() => { setSessionForm(f => ({ ...f, mentee_id: m.id, program_id: m.program_id })); setShowSessionForm(true); navigate('my-sessions'); }} style={{ padding: '10px 20px', borderRadius: 10, background: '#0891b2', color: '#fff', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Agendar sesión</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="dash-header"><h1 className="dash-title">Mis Mentees</h1><p className="dash-subtitle">{myMentees.length} mentee{myMentees.length !== 1 ? 's' : ''} asignado{myMentees.length !== 1 ? 's' : ''}</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {myMentees.map((m: any) => (
            <div key={m.id} onClick={() => setSelectedMentee(m)} style={{ background: '#fff', borderRadius: 14, padding: 20, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s', border: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#0891b2', overflow: 'hidden', flexShrink: 0 }}>
                  {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : bestName(m, 'M').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{bestName(m)}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{m.position || 'Sin cargo'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{m.program_name}</div>
                </div>
              </div>
              {m.headline && <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#4b5563', lineHeight: 1.4 }}>{m.headline}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: SESIONES DE MENTORÍA
  // ═══════════════════════════════════════════════════════════════
  const handleCreateSession = async () => {
    setSessionFormError('');
    if (!sessionForm.title) { setSessionFormError('El título es obligatorio'); return; }
    if (!sessionForm.scheduled_at) { setSessionFormError('La fecha es obligatoria'); return; }
    if (!sessionForm.mentee_id) { setSessionFormError('Debes seleccionar un mentee'); return; }
    setSessionCreating(true);
    try {
      const r = await apiFetch(`${API_URL}/api/companies/portal/${portalCode}/sessions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionForm),
      });
      if (r.ok) {
        setShowSessionForm(false);
        setSessionForm({ mentee_id: '', program_id: '', title: '', description: '', scheduled_at: '', duration_minutes: 60, meeting_url: '' });
        const res = await apiFetch(`${API_URL}/api/companies/portal/${portalCode}/sessions`);
        if (res.ok) { const d = await res.json(); setMySessions(d.sessions || []); }
      } else {
        const err = await r.text();
        setSessionFormError(`Error al crear sesión: ${err}`);
      }
    } catch (e: any) {
      setSessionFormError('Error de conexión al crear la sesión');
    }
    setSessionCreating(false);
  };

  const handleSaveNotes = async (sessionId: string) => {
    if (isAdminPreview) { blockInPreview(); return; }
    try {
      await apiFetch(`${API_URL}/api/companies/portal/${portalCode}/sessions/${sessionId}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionNotesForm),
      });
      setShowNotesModal(null);
      // Refresh
      const res = await apiFetch(`${API_URL}/api/companies/portal/${portalCode}/sessions`);
      if (res.ok) { const d = await res.json(); setMySessions(d.sessions || []); }
    } catch {}
  };

  const handleAiSuggest = async (sessionId: string) => {
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const r = await apiFetch(`${API_URL}/api/companies/portal/${portalCode}/sessions/${sessionId}/ai-suggest`, { method: 'POST' });
      if (r.ok) { const d = await r.json(); setAiSuggestion(d.suggestion || ''); }
    } catch {}
    setAiLoading(false);
  };

  const handleCompleteSession = async (sessionId: string) => {
    if (isAdminPreview) { blockInPreview(); return; }
    try {
      await apiFetch(`${API_URL}/api/companies/portal/${portalCode}/sessions/${sessionId}/status?status_val=completed`, { method: 'PATCH' });
      const res = await apiFetch(`${API_URL}/api/companies/portal/${portalCode}/sessions`);
      if (res.ok) { const d = await res.json(); setMySessions(d.sessions || []); }
    } catch {}
  };

  const handleCompleteActivity = async (actId: number) => {
    if (isAdminPreview) { blockInPreview(); return; }
    try {
      await apiFetch(`${API_URL}/api/companies/portal/${portalCode}/activities/${actId}/complete`, { method: 'POST' });
      setPortalActivities(prev => prev.map(a => a.id === actId ? { ...a, completed_by_me: true } : a));
    } catch {}
  };

  const renderSessions = () => {
    if (sessionsLoading) return <InlineSpinner />;

    const upcoming = mySessions.filter(s => s.status === 'scheduled');
    const completed = mySessions.filter(s => s.status === 'completed');

    return (
      <div>
        <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div><h1 className="dash-title">Sesiones de Mentoría</h1><p className="dash-subtitle">{mySessions.length} sesiones total</p></div>
          <button onClick={() => setShowSessionForm(true)} style={{ padding: '10px 20px', borderRadius: 10, background: '#0891b2', color: '#fff', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>+ Nueva sesión</button>
        </div>

        {/* New session form modal */}
        {showSessionForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Nueva Sesión de Mentoría</h3>
              {sessionFormError && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: '0.82rem', marginBottom: 14 }}>{sessionFormError}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="prof-field">
                  <label>Mentee *</label>
                  {menteesLoading ? (
                    <div style={{ fontSize: '0.82rem', color: '#6b7280', padding: 8 }}>Cargando participantes...</div>
                  ) : myMentees.length > 0 ? (
                    <select value={sessionForm.mentee_id} onChange={e => { const mt = myMentees.find((m: any) => m.id === e.target.value); setSessionForm(f => ({ ...f, mentee_id: e.target.value, program_id: mt?.program_id || f.program_id })); }} style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid #d1d5db', fontSize: '0.85rem' }}>
                      <option value="">Seleccionar mentee...</option>
                      {myMentees.map((m: any) => <option key={m.id} value={m.id}>{bestName(m)} — {m.program_name}</option>)}
                    </select>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: '#9ca3af', padding: 8, background: '#f9fafb', borderRadius: 10 }}>No hay mentees asignados en tus programas</div>
                  )}
                </div>
                <div className="prof-field"><label>Título *</label><input value={sessionForm.title} onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Sesión de alineación de objetivos" /></div>
                <div className="prof-field"><label>Fecha y hora *</label><input type="datetime-local" value={sessionForm.scheduled_at} onChange={e => setSessionForm(f => ({ ...f, scheduled_at: e.target.value }))} /></div>
                <div className="prof-field"><label>Duración (min)</label><input type="number" value={sessionForm.duration_minutes} onChange={e => setSessionForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))} /></div>
                <div className="prof-field">
                  <label>Enlace de reunión (opcional)</label>
                  <input value={sessionForm.meeting_url} onChange={e => setSessionForm(f => ({ ...f, meeting_url: e.target.value }))} placeholder="Se genera automáticamente un Google Meet si lo dejas vacío" />
                </div>
                <div className="prof-field"><label>Descripción</label><textarea value={sessionForm.description} onChange={e => setSessionForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Temas a tratar..." /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                <button onClick={() => { setShowSessionForm(false); setSessionFormError(''); }} style={{ padding: '10px 20px', borderRadius: 10, background: '#f3f4f6', border: 'none', fontSize: '0.82rem', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleCreateSession} disabled={sessionCreating} style={{ padding: '10px 20px', borderRadius: 10, background: sessionCreating ? '#9ca3af' : '#0891b2', color: '#fff', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: sessionCreating ? 'not-allowed' : 'pointer' }}>{sessionCreating ? 'Creando...' : 'Crear sesión'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Notes modal */}
        {showNotesModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Notas de la sesión</h3>
              <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 16 }}>{showNotesModal.title} — {bestName(showNotesModal.mentee)}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="prof-field"><label>¿De qué se trató esta sesión?</label><textarea value={sessionNotesForm.session_notes} onChange={e => setSessionNotesForm(f => ({ ...f, session_notes: e.target.value }))} rows={4} placeholder="Describe los temas principales y lo que se conversó..." /></div>
                <div className="prof-field"><label>Estado emocional del mentee (1-5)</label>
                  <div style={{ display: 'flex', gap: 8 }}>{[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setSessionNotesForm(f => ({ ...f, mentee_mood: n }))} style={{ width: 40, height: 40, borderRadius: '50%', border: sessionNotesForm.mentee_mood === n ? '2px solid #0891b2' : '1.5px solid #d1d5db', background: sessionNotesForm.mentee_mood === n ? '#ecfeff' : '#fff', fontWeight: 600, cursor: 'pointer' }}>{n}</button>)}</div>
                </div>
                <div className="prof-field"><label>Próximos pasos</label><textarea value={sessionNotesForm.next_steps} onChange={e => setSessionNotesForm(f => ({ ...f, next_steps: e.target.value }))} rows={3} placeholder="Acciones acordadas para la siguiente sesión..." /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                <button onClick={() => setShowNotesModal(null)} style={{ padding: '10px 20px', borderRadius: 10, background: '#f3f4f6', border: 'none', fontSize: '0.82rem', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={() => handleSaveNotes(showNotesModal.id)} style={{ padding: '10px 20px', borderRadius: 10, background: '#0891b2', color: '#fff', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Guardar notas</button>
              </div>

              {/* AI suggestion section */}
              <div style={{ marginTop: 20, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> IA: Diseña tu próxima sesión</div>
                  <button onClick={() => handleAiSuggest(showNotesModal.id)} disabled={aiLoading} style={{ padding: '8px 16px', borderRadius: 10, background: aiLoading ? '#e5e7eb' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: aiLoading ? '#9ca3af' : '#fff', border: 'none', fontSize: '0.78rem', fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
                    {aiLoading ? 'Generando...' : 'Generar sugerencia'}
                  </button>
                </div>
                {aiSuggestion && (
                  <div style={{ background: '#f5f3ff', borderRadius: 12, padding: 16, fontSize: '0.82rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {aiSuggestion}
                  </div>
                )}
                {showNotesModal.ai_suggestion && !aiSuggestion && (
                  <div style={{ background: '#f5f3ff', borderRadius: 12, padding: 16, fontSize: '0.82rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: 6 }}>Sugerencia anterior:</div>
                    {showNotesModal.ai_suggestion}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming sessions */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Próximas sesiones</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcoming.map(s => (
                <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div><div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{s.title}</div><div style={{ fontSize: '0.78rem', color: '#6b7280' }}>con {bestName(s.mentee)} • {s.program_name}</div></div>
                    <span style={{ padding: '4px 10px', borderRadius: 8, background: '#e0f2fe', color: '#0891b2', fontSize: '0.72rem', fontWeight: 600 }}>Programada</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#4b5563', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {new Date(s.scheduled_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} • {s.duration_minutes} min</div>
                  {s.meeting_url && <a href={s.meeting_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: '#0891b2', display: 'inline-flex', alignItems: 'center', gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Unirse a la reunión</a>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => handleCompleteSession(s.id)} style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #10b981', background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Completar</button>
                    <button onClick={() => { setSessionNotesForm({ session_notes: s.session_notes || '', topics_covered: s.topics_covered || [], mentee_mood: s.mentee_mood || 0, next_steps: s.next_steps || '' }); setAiSuggestion(''); setShowNotesModal(s); }} style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #6366f1', background: '#eef2ff', color: '#4338ca', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Notas</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed sessions */}
        {completed.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Sesiones completadas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {completed.map(s => (
                <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div><div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{s.title}</div><div style={{ fontSize: '0.75rem', color: '#6b7280' }}>con {bestName(s.mentee)} • {new Date(s.scheduled_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</div></div>
                    <span style={{ padding: '4px 10px', borderRadius: 8, background: '#ecfdf5', color: '#047857', fontSize: '0.72rem', fontWeight: 600 }}>Completada</span>
                  </div>
                  {s.session_notes && <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: 6, lineHeight: 1.5, borderLeft: '3px solid #e5e7eb', paddingLeft: 12 }}>{s.session_notes.slice(0, 200)}{s.session_notes.length > 200 ? '...' : ''}</div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => { setSessionNotesForm({ session_notes: s.session_notes || '', topics_covered: s.topics_covered || [], mentee_mood: s.mentee_mood || 0, next_steps: s.next_steps || '' }); setAiSuggestion(''); setShowNotesModal(s); }} style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #6366f1', background: '#eef2ff', color: '#4338ca', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> {s.session_notes ? 'Ver notas' : 'Agregar notas'}</span></button>
                    <button onClick={() => { setAiSuggestion(''); setShowNotesModal(s); setTimeout(() => handleAiSuggest(s.id), 200); }} style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #8b5cf6', background: '#f5f3ff', color: '#6d28d9', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg> IA: Próxima sesión</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mySessions.length === 0 && (
          <div className="empty-state">No tienes sesiones aún. ¡Agenda tu primera sesión de mentoría!</div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: MI RED DE INFLUENCIA
  // ═══════════════════════════════════════════════════════════════
  const renderNetwork = () => {
    if (networkLoading) return <InlineSpinner />;
    return (
      <div>
        <div className="dash-header"><h1 className="dash-title">Mi Red de Influencia</h1><p className="dash-subtitle">Perfiles express de las personas en tus programas</p></div>
        {networkPeople.length === 0 ? (
          <div className="empty-state">Aún no hay personas en tu red</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {networkPeople.map((p: any) => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#0891b2', overflow: 'hidden', flexShrink: 0 }}>
                    {p.avatar_url ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : bestName(p, 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{bestName(p)}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{p.position || p.headline || ''}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 8, background: p.role === 'mentor' ? '#ecfdf5' : p.role === 'mentee' ? '#e0f2fe' : '#f3f4f6', color: p.role === 'mentor' ? '#047857' : p.role === 'mentee' ? '#0891b2' : '#6b7280', fontSize: '0.68rem', fontWeight: 600 }}>{p.role}</span>
                    </div>
                  </div>
                </div>
                {p.bio && <p style={{ fontSize: '0.78rem', color: '#4b5563', lineHeight: 1.5, marginBottom: 10 }}>{p.bio.slice(0, 120)}{p.bio.length > 120 ? '...' : ''}</p>}
                {p.linkedin_url && <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0891b2', fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> LinkedIn</a>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: ACTIVIDADES CON COMPLETAR
  // ═══════════════════════════════════════════════════════════════
  const renderPortalActivities = () => {
    if (activitiesLoading) return <InlineSpinner />;
    const total = portalActivities.length;
    const done = portalActivities.filter((a: any) => a.completed_by_me).length;
    const scheduled = portalActivities.filter((a: any) => a.start_date).length;
    const sortedActivities = [...portalActivities].sort((a: any, b: any) => {
      // Pending first, then by date asc, undated last
      if (a.completed_by_me !== b.completed_by_me) return a.completed_by_me ? 1 : -1;
      if (!a.start_date && b.start_date) return 1;
      if (a.start_date && !b.start_date) return -1;
      if (a.start_date && b.start_date) return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      return 0;
    });
    return (
      <div>
        <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="dash-title">Mis Actividades</h1>
            <p className="dash-subtitle">{total} actividades en tus programas · {done} completadas · {scheduled} agendadas</p>
          </div>
          <button onClick={() => { setActivitiesLoading(true); apiFetch(`${API_URL}/api/companies/portal/${portalCode}/activities`).then(r => r.ok ? r.json() : { activities: [] }).then(d => setPortalActivities(d.activities || [])).finally(() => setActivitiesLoading(false)); }}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', fontSize: '0.72rem', fontWeight: 600, color: '#0e7490', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Actualizar
          </button>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #f3f4f6', marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>Tu avance en actividades</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0e7490' }}>{Math.round((done / total) * 100)}%</span>
            </div>
            <div style={{ height: 8, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(done / total) * 100}%`, background: 'linear-gradient(90deg, #0891b2, #06b6d4)', borderRadius: 999, transition: 'width 0.4s' }} />
            </div>
          </div>
        )}

        {portalActivities.length === 0 ? (
          <div className="empty-state">No hay actividades asignadas aún. Cuando tu Project Manager publique el cronograma, aparecerán aquí.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortedActivities.map((a: any) => {
              const date = a.start_date ? new Date(a.start_date) : null;
              const isPast = date && date.getTime() < Date.now();
              const isToday = date && date.toDateString() === new Date().toDateString();
              return (
              <div key={a.id} style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: a.completed_by_me ? '1px solid #d1fae5' : isToday ? '1px solid #fde68a' : '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#111827' }}>{a.name}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 8, background: '#f3f4f6', color: '#6b7280', fontSize: '0.68rem', fontWeight: 600 }}>
                      {a.activity_type === 'training' ? 'Entrenamiento' : a.activity_type === 'event' ? 'Evento' : a.activity_type || 'Actividad'}
                    </span>
                    {isToday && <span style={{ padding: '2px 8px', borderRadius: 8, background: '#fef3c7', color: '#b45309', fontSize: '0.68rem', fontWeight: 700 }}>Hoy</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 6, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontWeight: 500 }}>{a.program_name}</span>
                    {date ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: isPast && !a.completed_by_me ? '#dc2626' : '#0e7490', fontWeight: 600 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span style={{ color: '#d97706', fontStyle: 'italic' }}>Aún no agendada</span>
                    )}
                    {a.modality && <span style={{ color: '#9ca3af' }}>· {a.modality === 'online' ? 'Online' : a.modality === 'presencial' ? 'Presencial' : 'Híbrida'}</span>}
                  </div>
                  {a.description && <div style={{ fontSize: '0.78rem', color: '#4b5563', lineHeight: 1.5 }}>{a.description}</div>}
                  {a.meeting_url && (
                    <a href={a.meeting_url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#0891b2', fontWeight: 600 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                      Unirse a la reunión
                    </a>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  {a.completed_by_me ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, background: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: 700 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Completada
                    </span>
                  ) : (
                    <button onClick={() => handleCompleteActivity(a.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: '0 1px 3px rgba(8,145,178,0.3)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Marcar completa
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Tier accent colors — subtle, only for the small dot/pill
  const tierAccent: Record<number, string> = { 0: '#cbd5e1', 1: '#d97706', 2: '#64748b', 3: '#eab308' };
  const tierLabel: Record<number, string> = { 0: '', 1: 'Bronce', 2: 'Plata', 3: 'Oro' };
  const tierPillBg: Record<number, string> = { 0: 'transparent', 1: '#fef3c7', 2: '#f1f5f9', 3: '#fef9c3' };
  const tierPillText: Record<number, string> = { 0: '#94a3b8', 1: '#b45309', 2: '#475569', 3: '#a16207' };

  const renderBadges = () => {
    if (badgesLoading) return <InlineSpinner />;
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
                  <div key={p.id} className="cht-person" onClick={() => setChatProfileDetail(p)} style={{ cursor: 'pointer' }}>
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
                            <div className="cht-msg-avi" style={{ cursor: 'pointer' }} onClick={() => {
                              const participant = chatParticipants.find((p: any) => p.id === m.sender_id);
                              if (participant) setChatProfileDetail(participant);
                            }}>
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

      {/* Profile Detail Modal */}
      {chatProfileDetail && (
        <div className="cht-profile-overlay" onClick={() => setChatProfileDetail(null)}>
          <div className="cht-profile-card" onClick={e => e.stopPropagation()}>
            <div className="cht-profile-header">
              <button className="cht-profile-close" onClick={() => setChatProfileDetail(null)}>&times;</button>
              <div className="cht-profile-avatar">
                {chatProfileDetail.avatar ? <img src={avatarSrc(chatProfileDetail.avatar)} alt="" /> : chatProfileDetail.name.charAt(0).toUpperCase()}
              </div>
              <div className="cht-profile-name">{chatProfileDetail.name}</div>
              {chatProfileDetail.headline && <div className="cht-profile-headline">{chatProfileDetail.headline}</div>}
              <span className="cht-profile-role-badge">{chatProfileDetail.role || 'Participante'}</span>
            </div>
            <div className="cht-profile-body">
              {/* Program */}
              {(chatProfileDetail.program_name || chatActiveProgram?.name) && (
                <div className="cht-profile-section">
                  <div className="cht-profile-label">Programa</div>
                  <div className="cht-profile-program">
                    <div className="cht-profile-program-icon">{(chatProfileDetail.program_name || chatActiveProgram?.name || '?').charAt(0)}</div>
                    <div>
                      <div className="cht-profile-program-name">{chatProfileDetail.program_name || chatActiveProgram?.name}</div>
                      <div className="cht-profile-program-role">{chatProfileDetail.role || 'Participante'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Position / Department */}
              {(chatProfileDetail.position || chatProfileDetail.department) && (
                <div className="cht-profile-section">
                  <div className="cht-profile-label">Cargo</div>
                  <div className="cht-profile-value">
                    {chatProfileDetail.position}{chatProfileDetail.position && chatProfileDetail.department ? ' · ' : ''}{chatProfileDetail.department}
                  </div>
                </div>
              )}

              {/* Bio */}
              {chatProfileDetail.bio && (
                <div className="cht-profile-section">
                  <div className="cht-profile-label">Acerca de</div>
                  <div className="cht-profile-value">{chatProfileDetail.bio}</div>
                </div>
              )}

              {/* Skills */}
              {chatProfileDetail.skills && chatProfileDetail.skills.length > 0 && (
                <div className="cht-profile-section">
                  <div className="cht-profile-label">Habilidades</div>
                  <div className="cht-profile-skills">
                    {chatProfileDetail.skills.map((s: string, i: number) => (
                      <span key={i} className="cht-profile-skill">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* LinkedIn */}
              {chatProfileDetail.linkedin_url && (
                <div className="cht-profile-section">
                  <div className="cht-profile-label">LinkedIn</div>
                  <div className="cht-profile-value">
                    <a href={chatProfileDetail.linkedin_url} target="_blank" rel="noopener noreferrer">
                      {chatProfileDetail.linkedin_url.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </div>
                </div>
              )}

              {/* Email */}
              {chatProfileDetail.email && !chatProfileDetail.is_me && (
                <div className="cht-profile-section">
                  <div className="cht-profile-label">Email</div>
                  <div className="cht-profile-value">
                    <a href={`mailto:${chatProfileDetail.email}`}>{chatProfileDetail.email}</a>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!chatProfileDetail.bio && (!chatProfileDetail.skills || chatProfileDetail.skills.length === 0) && !chatProfileDetail.linkedin_url && !chatProfileDetail.position && (
                <div className="cht-profile-empty">Este participante aún no ha completado su perfil.</div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: DASHBOARD MENTEE
  // ═══════════════════════════════════════════════════════════════
  const renderMenteeDashboard = () => {
    const upcoming = mySessions.filter(s => s.status === 'scheduled');
    const completed = mySessions.filter(s => s.status === 'completed');

    return (
      <>
        <div className="dash-header">
          <h1 className="dash-title">Hola, {displayName}</h1>
          <p className="dash-subtitle">Tu espacio de mentoría y aprendizaje</p>
        </div>

        {loadingPrograms ? null : myPrograms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: 8 }}>Aún no estás inscrito en un programa</h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Cuando te asignen a un programa, aparecerá aquí.</p>
          </div>
        ) : (
          <>
            {/* Program cards */}
            <div style={{ display: 'grid', gridTemplateColumns: myPrograms.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
              {myPrograms.map(mp => {
                const gradient = THEME_GRADIENTS[mp.theme] || THEME_GRADIENTS.leadership;
                const hasBanner = !!(mp.banner_image || mp.banner_svg);
                return (
                  <div key={mp.id} onClick={() => { setSelectedProgram(mp); navigate('my-modules'); }}
                    style={{ background: hasBanner ? '#111827' : gradient, borderRadius: 16, padding: '28px 28px 20px', cursor: 'pointer', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
                    {mp.banner_image ? (
                      <img src={mp.banner_image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : mp.banner_svg ? (
                      <div className="dash-banner-svg" dangerouslySetInnerHTML={{ __html: mp.banner_svg }} />
                    ) : null}
                    {hasBanner && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'rgba(255,255,255,0.06)', borderRadius: '0 0 0 120px' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', display: 'inline-block' }} />
                        Mentee
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8, lineHeight: 1.3 }}>{mp.name}</div>
                      <div style={{ fontSize: '0.82rem', opacity: 0.8, marginBottom: 16, lineHeight: 1.5 }}>{mp.description?.slice(0, 120)}{(mp.description?.length || 0) > 120 ? '...' : ''}</div>
                      <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', opacity: 0.75 }}>
                        <span>{programTemplate?.modules?.length || mp.modules?.length || 0} módulos</span>
                        <span>{programDetail?.activities?.length || mp.activities?.length || 0} actividades</span>
                      </div>
                      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 600, opacity: 0.9 }}>
                        <span>Ver programa</span>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mentor card */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Tu Mentor
              </h2>
              {mentorLoading ? (
                <div className="empty-state">Cargando...</div>
              ) : myMentor ? (
                <div onClick={() => navigate('my-mentor')} style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                      {myMentor.avatar_url ? <img src={myMentor.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : bestName(myMentor, 'M').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{bestName(myMentor, 'Mentor')}</div>
                      <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>{myMentor.headline || myMentor.position || ''}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{myMentor.program_name}</div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#f9fafb', borderRadius: 14, padding: 20, textAlign: 'center', border: '1px dashed #d1d5db' }}>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>El PM realizará el matching inteligente con tu mentor pronto.</p>
                </div>
              )}
            </div>

            {/* Next session */}
            {upcoming.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Próxima sesión
                </h2>
                <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#111827', marginBottom: 6 }}>{upcoming[0].title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 4 }}>con {bestName(upcoming[0].mentor)}</div>
                  <div style={{ fontSize: '0.82rem', color: '#4b5563', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {new Date(upcoming[0].scheduled_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} • {upcoming[0].duration_minutes} min
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {upcoming[0].meeting_url && (
                      <a href={upcoming[0].meeting_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 10, background: '#0891b2', color: '#fff', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Unirse
                      </a>
                    )}
                    <button onClick={() => navigate('my-sessions')} style={{ padding: '8px 16px', borderRadius: 10, background: '#f3f4f6', border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>Ver todas →</button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
              {[
                { label: 'Programas activos', value: myPrograms.length, change: 'Inscrito como Mentee', stripe: '#0891b2' },
                { label: 'Sesiones programadas', value: upcoming.length, change: 'Próximas sesiones', stripe: '#6366f1' },
                { label: 'Sesiones completadas', value: completed.length, change: 'Total de sesiones: ' + (upcoming.length + completed.length), stripe: '#059669' },
                { label: 'Empresa', value: companyName || '—', change: 'Mentee', stripe: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-card-stripe" style={{ background: s.stripe }} />
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value" style={{ fontSize: typeof s.value === 'string' ? '0.9rem' : undefined }}>{s.value}</div>
                  <div className="stat-change">{s.change}</div>
                </div>
              ))}
            </div>

            {renderProgressSection()}
          </>
        )}
      </>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: SESIONES MENTEE (vista mentee — sin crear, solo ver)
  // ═══════════════════════════════════════════════════════════════
  const renderMenteeSessions = () => {
    if (sessionsLoading) return <InlineSpinner />;

    const upcoming = mySessions.filter(s => s.status === 'scheduled');
    const completed = mySessions.filter(s => s.status === 'completed');

    return (
      <div>
        <div className="dash-header">
          <h1 className="dash-title">Mis Sesiones de Mentoría</h1>
          <p className="dash-subtitle">{mySessions.length} sesiones total • Tu mentor organiza las sesiones</p>
        </div>

        {/* Upcoming sessions */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Próximas sesiones
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcoming.map(s => (
                <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{s.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>con {bestName(s.mentor)} • {s.program_name}</div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 8, background: '#e0f2fe', color: '#0891b2', fontSize: '0.72rem', fontWeight: 600 }}>Programada</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#4b5563', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {new Date(s.scheduled_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} • {s.duration_minutes} min
                  </div>
                  {s.meeting_url && (
                    <a href={s.meeting_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 10, background: '#0891b2', color: '#fff', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Unirse a la reunión
                    </a>
                  )}
                  {s.description && <p style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: 10, lineHeight: 1.5, borderLeft: '3px solid #e0f2fe', paddingLeft: 12 }}>{s.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed sessions */}
        {completed.length > 0 && (
          <div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Sesiones completadas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {completed.map(s => (
                <div key={s.id} style={{ background: '#fff', borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>{s.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>con {bestName(s.mentor)} • {new Date(s.scheduled_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 8, background: '#ecfdf5', color: '#047857', fontSize: '0.72rem', fontWeight: 600 }}>Completada</span>
                  </div>
                  {s.session_notes && <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: 6, lineHeight: 1.5, borderLeft: '3px solid #e5e7eb', paddingLeft: 12 }}>{s.session_notes.slice(0, 200)}{s.session_notes.length > 200 ? '...' : ''}</div>}
                  {s.next_steps && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: '#f0fdfa', borderRadius: 10, border: '1px solid #ccfbf1' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#047857', marginBottom: 4 }}>Próximos pasos</div>
                      <div style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.5 }}>{s.next_steps}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {mySessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f3f4f6', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 6 }}>Aún no tienes sesiones</h3>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Tu mentor agendará las sesiones de mentoría. ¡Pronto recibirás una notificación!</p>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: MI MENTOR (vista mentee)
  // ═══════════════════════════════════════════════════════════════
  const renderMyMentor = () => {
    if (mentorLoading) return <InlineSpinner />;
    if (!myMentor) return (
      <div>
        <div className="dash-header"><h1 className="dash-title">Mi Mentor</h1><p className="dash-subtitle">Tu mentor asignado para el programa</p></div>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f3f4f6', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 6 }}>Aún no tienes un mentor asignado</h3>
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>El PM del programa realizará el matching inteligente pronto.</p>
        </div>
      </div>
    );

    const m = myMentor;
    const upcoming = mySessions.filter(s => s.status === 'scheduled');
    const completed = mySessions.filter(s => s.status === 'completed');

    return (
      <div>
        <div className="dash-header"><h1 className="dash-title">Mi Mentor</h1><p className="dash-subtitle">{m.program_name}</p></div>

        {/* Mentor profile card */}
        <div style={{ background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #0891b2, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
              {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : bestName(m, 'M').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#111827', marginBottom: 4 }}>{bestName(m)}</div>
              <div style={{ fontSize: '0.88rem', color: '#6b7280', marginBottom: 4 }}>{m.headline || m.position || ''}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ padding: '3px 10px', borderRadius: 8, background: '#ecfdf5', color: '#047857', fontSize: '0.72rem', fontWeight: 600 }}>Mentor</span>
                {m.department && <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{m.department}</span>}
              </div>
            </div>
          </div>

          {m.bio && <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.7, marginBottom: 16 }}>{m.bio}</p>}

          {m.mentor_style && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: 6 }}>Estilo de mentoría</div>
              <div style={{ fontSize: '0.85rem', color: '#4b5563', padding: '10px 14px', background: '#f0fdfa', borderRadius: 10, border: '1px solid #ccfbf1' }}>{m.mentor_style}</div>
            </div>
          )}

          {m.mentor_topics?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: 6 }}>Temas de mentoría</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {m.mentor_topics.map((t: string) => <span key={t} style={{ padding: '4px 12px', borderRadius: 16, background: '#e0f2fe', color: '#0e7490', fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>)}
              </div>
            </div>
          )}

          {m.skills?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: 6 }}>Habilidades</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {m.skills.map((s: string) => <span key={s} style={{ padding: '4px 12px', borderRadius: 16, background: '#ecfeff', color: '#0e7490', fontSize: '0.75rem', fontWeight: 500 }}>{s}</span>)}
              </div>
            </div>
          )}

          {m.linkedin_url && (
            <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0891b2', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Ver perfil LinkedIn
            </a>
          )}
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0891b2' }}>{upcoming.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Próximas sesiones</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>{completed.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Sesiones completadas</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1' }}>{upcoming.length + completed.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Total sesiones</div>
          </div>
        </div>

        {/* Next session preview */}
        {upcoming.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Próxima sesión
            </h3>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827', marginBottom: 6 }}>{upcoming[0].title}</div>
            <div style={{ fontSize: '0.82rem', color: '#4b5563', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {new Date(upcoming[0].scheduled_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} • {upcoming[0].duration_minutes} min
            </div>
            {upcoming[0].meeting_url && (
              <a href={upcoming[0].meeting_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 10, background: '#0891b2', color: '#fff', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', marginTop: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Unirse a la reunión
              </a>
            )}
            <div style={{ marginTop: 10 }}>
              <button onClick={() => navigate('my-sessions')} style={{ fontSize: '0.78rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ver todas las sesiones →</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard': return isMentee ? renderMenteeDashboard() : renderDashboard();
      case 'my-modules': return renderModulesPreview();
      case 'my-activities': return renderMyProgram();
      case 'my-participants': return renderMyProgram();
      case 'my-milestones': return renderMyProgram();
      case 'my-ecosystem': return renderMyProgram();
      case 'my-profile': return renderProfile();
      case 'my-badges': return renderBadges();
      case 'my-chat': return renderChat();
      case 'my-mentees': return renderMentees();
      case 'my-mentor': return renderMyMentor();
      case 'my-sessions': return isMentee ? renderMenteeSessions() : renderSessions();
      case 'my-network': return renderNetwork();
      case 'my-portal-activities': return renderPortalActivities();
      default: return isMentee ? renderMenteeDashboard() : renderDashboard();
    }
  };

  const currentNavLabel = navItems.flatMap(s => s.items).find(i => i.id === activeNav)?.label || 'Inicio';

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: styles }} />
      {isAdminPreview && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#0a0a0a', color: '#fff', padding: '9px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontSize: 12.5, fontWeight: 600, letterSpacing: 0.2,
          boxShadow: '0 1px 0 rgba(255,255,255,0.08)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD902', flexShrink: 0 }} />
          Vista previa desde administración — estás viendo el portal de <strong>{fullDisplayName}</strong> ({roleLabel}), solo lectura. No se registra como un acceso real de esta persona.
        </div>
      )}
      <div className="p-layout" style={isAdminPreview ? { paddingTop: 38 } : undefined}>

        {/* SIDEBAR */}
        <aside
          className={`p-sidebar${sidebarExpanded ? ' expanded' : ''}`}
          style={{ width: sidebarExpanded ? SIDEBAR_W_EXPANDED : SIDEBAR_W_COLLAPSED }}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}>
          <div className="p-sidebar-header" style={{ justifyContent: sidebarExpanded ? 'flex-start' : 'center', gap: sidebarExpanded ? 12 : 0 }}>
            <Image src="/images/isologo-amarillo.png" alt="Inspiratoria" width={36} height={36} className="p-sidebar-logo-img" />
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
                {section.items.map(item => {
                  const locked = !isProfileComplete && item.id !== 'my-profile';
                  return (
                  <button key={item.id}
                    className={`p-nav-item ${activeNav === item.id ? 'active' : ''}`}
                    style={{
                      justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                      gap: sidebarExpanded ? 12 : 0,
                      padding: sidebarExpanded ? '10px 14px' : '10px 0',
                      opacity: locked ? 0.35 : 1,
                      cursor: locked ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => !locked && navigate(item.id)}>
                    <span className="nav-icon">{navIcons[item.icon] || navIcons.home}</span>
                    {sidebarExpanded && <span className="p-nav-label">{item.label}</span>}
                    {sidebarExpanded && item.count !== undefined && <span className="p-nav-count" style={{ display: 'inline-block' }}>{item.count}</span>}
                    {sidebarExpanded && locked && <svg style={{ width: 12, height: 12, marginLeft: 'auto', opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>}
                    {!sidebarExpanded && <span className="nav-tooltip">{locked ? `🔒 ${item.label}` : item.label}</span>}
                  </button>
                  );
                })}
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
                  <div className="p-user-name">{fullDisplayName}</div>
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
            {selectedProgram && (
              <button
                onClick={() => reloadProgramData({ silent: true })}
                disabled={refreshing || loadingDetail}
                title={lastSyncedAt ? `Última sincronización: ${lastSyncedAt.toLocaleTimeString('es-CL')}` : 'Sincronizar con el programa'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 8,
                  background: refreshing ? '#f3f4f6' : '#ecfeff', color: refreshing ? '#9ca3af' : '#0e7490',
                  border: '1px solid #cffafe', fontSize: '0.7rem', fontWeight: 600,
                  cursor: refreshing ? 'wait' : 'pointer',
                }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {refreshing ? 'Sincronizando…' : lastSyncedAt ? `Sync ${lastSyncedAt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : 'Sincronizar'}
              </button>
            )}
            <span className="p-topbar-badge p-topbar-badge-role">{roleLabel}</span>
            <span className="p-topbar-badge p-topbar-badge-portal">Portal: {portalCode}</span>
            <div className="p-topbar-divider" />
            <span className="p-topbar-user">{fullDisplayName}</span>
            {portalUser?.id && <span className="p-topbar-id">ID: {portalUser.id}</span>}
            <span className="p-topbar-time">{currentTime}</span>
            <div className="p-topbar-divider" />
            <button className="p-topbar-logout" onClick={handleLogout} title="Cerrar sesión">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>

        {/* MAIN */}
        <main className={`p-main${activeNav === 'my-ecosystem' ? ' p-main-fullscreen' : ''}`} style={{ marginLeft: sidebarExpanded ? SIDEBAR_W_EXPANDED : SIDEBAR_W_COLLAPSED }}>
          {renderContent()}
        </main>
      </div>
    </>
  );
}
