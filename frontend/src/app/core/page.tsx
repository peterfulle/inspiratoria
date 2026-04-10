'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// ============================================================================
// TYPES
// ============================================================================
interface ProgramActivity {
  id: string;
  type: string;
  name: string;
  description: string;
  category: string;
  status: string;
  modality: string;
  start_date: string | null;
  end_date: string | null;
  target_role: string;
  is_mandatory: boolean;
  is_certificate_issued: boolean;
  meeting_url: string;
  location_address: string;
  capacity: number | null;
  confirmed_count: number;
  attendance_count: number;
  created_at: string;
}

interface Program {
  id: string;
  name: string;
  description: string;
  theme: string;
  rawStatus: string;
  status: 'active' | 'draft' | 'completed';
  participants: number;
  activitiesCount: number;
  activities: ProgramActivity[];
  progress: number;
  startDate: string;
  requires_certification: boolean;
}

// ============================================================================
// STYLES
// ============================================================================
const styles = `
  * { box-sizing: border-box; }
  .core-layout { display: flex; min-height: 100vh; background: #f8f9fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

  /* Sidebar */
  .core-sidebar { width: 240px; background: #fff; border-right: 1px solid #eaedf2; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 40; }
  .core-sidebar-header { padding: 18px 16px 14px; border-bottom: 1px solid #eaedf2; }
  .core-sidebar-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .core-sidebar-logo-text { font-size: 1rem; font-weight: 700; color: #1e1b4b; letter-spacing: -0.02em; }
  .core-plan-badge { display: flex; align-items: center; gap: 6px; padding: 5px 10px; background: #f5f3ff; border-radius: 6px; font-size: 0.7rem; font-weight: 600; color: #7c3aed; }

  .core-nav { flex: 1; padding: 12px 8px; overflow-y: auto; }
  .core-nav-section { margin-bottom: 16px; }
  .core-nav-section-title { font-size: 0.65rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; padding: 0 10px; margin-bottom: 6px; }
  .core-nav-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 7px; cursor: pointer; font-size: 0.8rem; font-weight: 500; color: #4b5563; transition: all 0.12s; border: none; background: none; width: 100%; text-align: left; }
  .core-nav-item:hover { background: #f3f4f6; color: #111827; }
  .core-nav-item.active { background: #ede9fe; color: #7c3aed; font-weight: 600; }
  .core-nav-count { margin-left: auto; font-size: 0.7rem; font-weight: 600; background: #e5e7eb; color: #6b7280; padding: 1px 7px; border-radius: 10px; }
  .core-nav-item.active .core-nav-count { background: #ddd6fe; color: #7c3aed; }

  .core-sidebar-footer { padding: 12px 16px; border-top: 1px solid #eaedf2; }
  .core-user-card { display: flex; align-items: center; gap: 10px; }
  .core-user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #ede9fe; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #7c3aed; flex-shrink: 0; }
  .core-user-name { font-size: 0.8rem; font-weight: 600; color: #111827; }
  .core-user-role { font-size: 0.68rem; color: #9ca3af; }

  /* Topbar */
  .core-topbar { position: fixed; top: 0; left: 240px; right: 0; height: 52px; background: #fff; border-bottom: 1px solid #eaedf2; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; z-index: 30; }
  .core-topbar-title { font-size: 0.85rem; font-weight: 600; color: #111827; }
  .core-topbar-sub { font-size: 0.72rem; color: #9ca3af; margin-left: 8px; }

  /* Main */
  .core-main { margin-left: 240px; padding: 68px 28px 40px; max-width: 1100px; transition: all 0.3s ease; }
  .core-main.detail-active { max-width: none; width: calc(100vw - 240px); padding: 52px 0 0; box-sizing: border-box; }

  /* Dashboard */
  .dash-header { margin-bottom: 20px; }
  .dash-title { font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0 0 4px; letter-spacing: -0.02em; }
  .dash-subtitle { font-size: 0.82rem; color: #6b7280; margin: 0; }

  /* Stats */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .stat-card { background: #fff; border-radius: 12px; padding: 18px 16px; border: 1px solid #eaedf2; position: relative; overflow: hidden; }
  .stat-card-stripe { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .stat-label { font-size: 0.72rem; font-weight: 500; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: #111827; letter-spacing: -0.02em; }
  .stat-change { font-size: 0.7rem; color: #9ca3af; margin-top: 4px; }

  /* Quick links */
  .quick-links-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .quick-link-card { background: #fff; border-radius: 10px; padding: 14px 16px; border: 1px solid #eaedf2; cursor: pointer; transition: all 0.12s; display: flex; align-items: center; gap: 12px; }
  .quick-link-card:hover { border-color: #c4b5fd; box-shadow: 0 2px 8px rgba(124,58,237,0.06); }
  .quick-link-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .quick-link-title { font-size: 0.8rem; font-weight: 600; color: #111827; }
  .quick-link-desc { font-size: 0.7rem; color: #9ca3af; }
  .quick-link-count { margin-left: auto; font-size: 1.1rem; font-weight: 700; color: #374151; }

  /* Glass card */
  .glass-card { background: #fff; border-radius: 12px; padding: 14px 16px; border: 1px solid #eaedf2; margin-bottom: 14px; }
  .glass-card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .search-container { position: relative; flex: 1; max-width: 280px; }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; font-size: 0.75rem; }
  .input-field { width: 100%; padding: 7px 12px 7px 28px; border: 1px solid #eaedf2; border-radius: 7px; font-size: 0.8rem; outline: none; background: #f9fafb; }
  .input-field:focus { border-color: #c4b5fd; background: #fff; }
  .filter-tabs { display: flex; gap: 4px; }
  .filter-tab { padding: 5px 12px; border-radius: 6px; border: 1px solid #eaedf2; background: #fff; font-size: 0.75rem; cursor: pointer; color: #6b7280; font-weight: 500; transition: all 0.12s; }
  .filter-tab.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }
  .view-toggle { display: flex; gap: 4px; }

  /* Programs list */
  .program-list { display: flex; flex-direction: column; gap: 6px; }
  .program-row { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: #fff; border-radius: 10px; border: 1px solid #eaedf2; transition: all 0.12s; }
  .program-row:hover { border-color: #c4b5fd; box-shadow: 0 2px 8px rgba(124,58,237,0.05); }
  .program-info { flex: 1; min-width: 0; }
  .program-name { font-size: 0.85rem; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .program-meta { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; }
  .program-stat { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #6b7280; }
  .program-progress { display: flex; align-items: center; gap: 8px; min-width: 100px; }
  .program-progress-bar { height: 4px; background: #f3f4f6; border-radius: 4px; flex: 1; overflow: hidden; }
  .program-progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .program-progress-text { font-size: 0.7rem; font-weight: 600; color: #6b7280; }

  /* Grid */
  .program-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .program-card { background: #fff; border-radius: 12px; padding: 16px; border: 1px solid #eaedf2; cursor: pointer; transition: all 0.12s; }
  .program-card:hover { border-color: #c4b5fd; box-shadow: 0 2px 8px rgba(124,58,237,0.05); }
  .program-card-header { display: flex; gap: 10px; margin-bottom: 10px; }
  .program-card-stats { display: flex; gap: 16px; margin-top: 10px; font-size: 0.75rem; color: #6b7280; }
  .program-card-stat strong { color: #111827; }

  /* Badges */
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; white-space: nowrap; }
  .badge-active { background: #d1fae5; color: #065f46; }
  .badge-draft { background: #f3f4f6; color: #6b7280; }
  .badge-completed { background: #dbeafe; color: #1e40af; }
  .badge-theme { background: #ede9fe; color: #5b21b6; }
  .badge-mandatory { background: #fef3c7; color: #92400e; }

  /* Summary */
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px; }
  .summary-card { background: #fff; border-radius: 12px; border: 1px solid #eaedf2; overflow: hidden; }
  .summary-title { font-size: 0.8rem; font-weight: 600; color: #111827; padding: 14px 16px; border-bottom: 1px solid #f3f4f6; }
  .summary-list > div { border-bottom: 1px solid #f3f4f6; }
  .summary-list > div:last-child { border-bottom: none; }
  .summary-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; font-size: 0.8rem; }
  .summary-item-label { color: #374151; }
  .summary-item-value { color: #6b7280; font-weight: 500; }

  /* Activity item */
  .activity-item { display: flex; align-items: center; gap: 10px; padding: 8px 16px; }
  .activity-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .activity-content { flex: 1; }
  .activity-text { font-size: 0.8rem; color: #374151; }
  .activity-time { font-size: 0.7rem; color: #9ca3af; }

  /* Billing */
  .billing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
  .billing-card { background: #fff; border-radius: 12px; padding: 18px 16px; border: 1px solid #eaedf2; }
  .billing-label { font-size: 0.72rem; font-weight: 500; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
  .billing-value { font-size: 1.1rem; font-weight: 700; color: #111827; }
  .billing-sub { font-size: 0.72rem; color: #9ca3af; margin-top: 2px; }

  /* Settings */
  .settings-section { background: #fff; border-radius: 12px; border: 1px solid #eaedf2; margin-bottom: 14px; overflow: hidden; }
  .settings-section-title { font-size: 0.82rem; font-weight: 600; color: #111827; padding: 14px 16px; border-bottom: 1px solid #f3f4f6; }
  .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
  .settings-row:last-child { border-bottom: none; }
  .settings-label { font-size: 0.82rem; font-weight: 500; color: #374151; }
  .settings-value { font-size: 0.82rem; color: #6b7280; }
  .settings-btn { padding: 6px 14px; font-size: 0.78rem; font-weight: 500; border: 1px solid #eaedf2; border-radius: 6px; background: white; color: #374151; cursor: pointer; transition: all 0.15s; }
  .settings-btn:hover { background: #f3f4f6; }

  .empty-state { text-align: center; padding: 48px; color: #6b7280; }

  /* Detail tabs */
  .detail-tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 1px solid #eaedf2; }
  .detail-tab { padding: 10px 18px; font-size: 0.8rem; font-weight: 500; color: #6b7280; cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; transition: all 0.12s; }
  .detail-tab:hover { color: #374151; }
  .detail-tab.active { color: #7c3aed; border-bottom-color: #7c3aed; font-weight: 600; }

  /* Data table */
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; padding: 10px 14px; text-align: left; border-bottom: 1px solid #eaedf2; }
  .data-table td { font-size: 0.8rem; color: #374151; padding: 12px 14px; border-bottom: 1px solid #f5f5f5; }
  .data-table tr:hover td { background: #fafbfc; }
  .data-table tr:last-child td { border-bottom: none; }

  /* Form */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .form-input { padding: 8px 12px; border-radius: 7px; border: 1px solid #d1d5db; font-size: 0.8rem; outline: none; width: 100%; }
  .form-input:focus { border-color: #7c3aed; }
  .form-select { padding: 8px 12px; border-radius: 7px; border: 1px solid #d1d5db; font-size: 0.8rem; outline: none; background: white; width: 100%; }
  .btn-primary { padding: 8px 20px; border-radius: 7px; border: none; background: #7c3aed; color: white; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
  .btn-primary:hover { background: #6d28d9; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-outline { padding: 8px 16px; border-radius: 7px; border: 1px solid #eaedf2; background: white; color: #374151; font-size: 0.78rem; font-weight: 500; cursor: pointer; }
  .btn-outline:hover { background: #f3f4f6; }
  .btn-danger-sm { padding: 4px 10px; border-radius: 5px; border: 1px solid #fecaca; background: white; color: #dc2626; font-size: 0.7rem; cursor: pointer; }
  .btn-danger-sm:hover { background: #fef2f2; }

  /* Info grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .info-item { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
  .info-label { font-size: 0.7rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px; }
  .info-value { font-size: 0.85rem; font-weight: 500; color: #111827; }

  /* Module card */
  .module-card { background: #fff; border-radius: 12px; border: 1px solid #eaedf2; margin-bottom: 10px; overflow: hidden; }
  .module-header { display: flex; align-items: center; gap: 14px; padding: 14px 16px; cursor: pointer; transition: background 0.12s; }
  .module-header:hover { background: #f9fafb; }
  .module-number { width: 28px; height: 28px; border-radius: 50%; background: #ede9fe; display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 700; color: #7c3aed; flex-shrink: 0; }
  .module-title { flex: 1; font-size: 0.85rem; font-weight: 600; color: #111827; }
  .module-stats { display: flex; gap: 12px; font-size: 0.72rem; color: #6b7280; }
  .module-toggle { font-size: 0.75rem; color: #9ca3af; transition: transform 0.2s; }
  .module-body { padding: 0 16px 14px; border-top: 1px solid #f3f4f6; }
  .module-desc { font-size: 0.8rem; color: #6b7280; margin: 10px 0; line-height: 1.5; }
  .resource-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
  .resource-item:last-child { border-bottom: none; }
  .resource-type { padding: 2px 8px; border-radius: 4px; font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

  /* Tags */
  .tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag-item { padding: 4px 12px; background: #f3f4f6; border-radius: 16px; font-size: 0.75rem; color: #374151; font-weight: 500; }

  /* Milestone */
  .milestone-card { background: #fff; border-radius: 14px; border: 1px solid #eaedf2; padding: 18px 20px; transition: box-shadow 0.2s, transform 0.2s; }
  .milestone-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); transform: translateY(-1px); }
  .milestone-week { width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg, #ede9fe, #ddd6fe); display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
  .milestone-week-label { font-size: 0.6rem; color: #7c3aed; font-weight: 600; text-transform: uppercase; }
  .milestone-week-num { font-size: 1.1rem; font-weight: 800; color: #7c3aed; line-height: 1; }

  /* ═══ PROGRAM DETAIL FULL-WIDTH ═══ */
  .pd-wrapper { background: #f5f3ff; min-height: calc(100vh - 52px); width: 100%; }

  /* Hero */
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

  /* Bubbles animation */
  .pd-bubble { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.06); z-index: 1; }
  .pd-bubble-1 { width: 300px; height: 300px; top: -80px; right: -40px; animation: pd-float 8s ease-in-out infinite; }
  .pd-bubble-2 { width: 200px; height: 200px; bottom: -60px; left: 10%; animation: pd-float 12s ease-in-out infinite reverse; }
  .pd-bubble-3 { width: 150px; height: 150px; top: 30%; right: 20%; animation: pd-float 10s ease-in-out infinite 2s; background: rgba(255,255,255,0.04); }
  .pd-bubble-4 { width: 80px; height: 80px; bottom: 20px; right: 35%; animation: pd-float 7s ease-in-out infinite 1s; background: rgba(255,255,255,0.08); }
  .pd-bubble-5 { width: 120px; height: 120px; top: 10px; left: 30%; animation: pd-float 9s ease-in-out infinite 3s; background: rgba(255,255,255,0.03); }
  @keyframes pd-float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-18px) scale(1.05); } }

  /* Tabs modern */
  .pd-tabs { max-width: 1200px; margin: 0 auto; padding: 0 36px; }
  .pd-tabs-bar { display: flex; gap: 4px; background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); border-radius: 14px; padding: 5px; border: 1px solid rgba(124,58,237,0.08); margin-top: -24px; position: relative; z-index: 10; box-shadow: 0 4px 24px rgba(124,58,237,0.08); }
  .pd-tab { flex: 1; padding: 11px 8px; font-size: 0.8rem; font-weight: 500; color: #6b7280; cursor: pointer; border: none; background: transparent; border-radius: 10px; transition: all 0.2s; text-align: center; }
  .pd-tab:hover { color: #374151; background: rgba(124,58,237,0.04); }
  .pd-tab.active { background: #fff; color: #7c3aed; font-weight: 700; box-shadow: 0 2px 8px rgba(124,58,237,0.1); }

  /* Content area */
  .pd-content { max-width: 1200px; margin: 0 auto; padding: 28px 36px 60px; }

  /* Glass stat cards */
  .pd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .pd-stat { background: #fff; border-radius: 16px; padding: 20px; border: 1px solid rgba(124,58,237,0.06); position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; }
  .pd-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
  .pd-stat-accent { position: absolute; top: 0; left: 0; width: 4px; height: 100%; border-radius: 4px 0 0 4px; }
  .pd-stat-label { font-size: 0.72rem; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .pd-stat-val { font-size: 1.8rem; font-weight: 800; color: #111827; letter-spacing: -0.03em; line-height: 1; }
  .pd-stat-sub { font-size: 0.72rem; color: #9ca3af; margin-top: 6px; }

  /* Section card */
  .pd-section { background: #fff; border-radius: 16px; border: 1px solid rgba(124,58,237,0.06); margin-bottom: 20px; overflow: hidden; transition: box-shadow 0.2s; }
  .pd-section:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
  .pd-section-head { padding: 18px 22px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
  .pd-section-title { font-size: 0.92rem; font-weight: 700; color: #111827; }
  .pd-section-count { font-size: 0.72rem; font-weight: 600; color: #7c3aed; background: #ede9fe; padding: 3px 10px; border-radius: 12px; }
  .pd-section-body { padding: 18px 22px; }

  /* Modern module card */
  .pd-mod { background: #fff; border-radius: 16px; border: 1px solid #eaedf2; overflow: hidden; transition: all 0.2s; }
  .pd-mod:hover { border-color: #c4b5fd; }
  .pd-mod-head { display: flex; align-items: center; gap: 16px; padding: 18px 22px; cursor: pointer; transition: background 0.15s; }
  .pd-mod-head:hover { background: #faf8ff; }
  .pd-mod-num { width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #7c3aed, #a78bfa); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; color: #fff; flex-shrink: 0; }
  .pd-mod-info { flex: 1; }
  .pd-mod-name { font-size: 0.92rem; font-weight: 700; color: #111827; }
  .pd-mod-meta { display: flex; gap: 14px; font-size: 0.72rem; color: #6b7280; margin-top: 3px; }
  .pd-mod-meta span { display: inline-flex; align-items: center; gap: 4px; }
  .pd-mod-toggle { font-size: 0.78rem; color: #9ca3af; padding: 4px 8px; border-radius: 6px; transition: all 0.2s; }
  .pd-mod-head:hover .pd-mod-toggle { background: #ede9fe; color: #7c3aed; }
  .pd-mod-body { border-top: 1px solid #f3f4f6; padding: 20px 22px; background: #faf8ff; }

  /* Resource chip */
  .pd-res { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #fff; border-radius: 10px; border: 1px solid #eaedf2; transition: border-color 0.2s; }
  .pd-res:hover { border-color: #c4b5fd; }
  .pd-res-type { padding: 3px 10px; border-radius: 6px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  .pd-res-name { flex: 1; font-size: 0.82rem; font-weight: 500; color: #1f2937; }
  .pd-res-link { font-size: 0.72rem; color: #7c3aed; font-weight: 600; text-decoration: none; padding: 4px 10px; border-radius: 6px; transition: background 0.15s; }
  .pd-res-link:hover { background: #ede9fe; }

  /* Tag modern */
  .pd-tag { padding: 5px 14px; background: linear-gradient(135deg, #ede9fe, #e0e7ff); border-radius: 20px; font-size: 0.75rem; color: #4c1d95; font-weight: 600; border: 1px solid rgba(124,58,237,0.1); }

  /* Milestone modern */
  .pd-ms { background: #fff; border-radius: 16px; border: 1px solid #eaedf2; padding: 20px 22px; transition: all 0.2s; position: relative; }
  .pd-ms:hover { border-color: #c4b5fd; box-shadow: 0 4px 20px rgba(124,58,237,0.06); transform: translateY(-1px); }
  .pd-ms-week { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #7c3aed, #a78bfa); display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
  .pd-ms-wk-label { font-size: 0.58rem; color: rgba(255,255,255,0.8); font-weight: 600; text-transform: uppercase; }
  .pd-ms-wk-num { font-size: 1.2rem; font-weight: 800; color: #fff; line-height: 1; }
  .pd-ms-title { font-size: 0.92rem; font-weight: 700; color: #111827; margin-bottom: 6px; }
  .pd-ms-desc { font-size: 0.82rem; color: #4b5563; line-height: 1.6; margin-bottom: 8px; }
  .pd-ms-deliverable { font-size: 0.78rem; padding: 8px 14px; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border: 1px solid #bbf7d0; border-radius: 10px; color: #166534; font-weight: 500; }

  /* Info grid modern */
  .pd-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
  .pd-info-item { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; border-right: 1px solid #f3f4f6; }
  .pd-info-item:nth-child(3n) { border-right: none; }
  .pd-info-label { font-size: 0.68rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; font-weight: 600; }
  .pd-info-val { font-size: 0.88rem; font-weight: 600; color: #111827; }

  /* Requirements card */
  .pd-req { background: #fff; border-radius: 16px; border: 1px solid #eaedf2; overflow: hidden; }
  .pd-req-head { padding: 14px 20px; background: #faf8ff; border-bottom: 1px solid #f3f4f6; font-size: 0.82rem; font-weight: 700; color: #374151; }
  .pd-req-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid #f5f5f5; font-size: 0.82rem; }
  .pd-req-row:last-child { border-bottom: none; }
  .pd-req-label { color: #6b7280; font-weight: 500; }
  .pd-req-val { color: #111827; font-weight: 600; }

  @media (max-width: 1024px) {
    .quick-links-grid, .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .program-grid { grid-template-columns: repeat(2, 1fr); }
    .summary-grid { grid-template-columns: 1fr; }
    .billing-grid { grid-template-columns: repeat(2, 1fr); }
    .core-sidebar { display: none; }
    .core-topbar { left: 0; }
    .core-main { margin-left: 0; }
    .core-main.detail-active { width: 100vw; }
    .pd-stats { grid-template-columns: repeat(2, 1fr); }
    .pd-info-grid { grid-template-columns: repeat(2, 1fr); }
    .pd-hero-inner { padding: 28px 20px 24px; }
    .pd-content, .pd-tabs { padding-left: 20px; padding-right: 20px; }
  }
  @media (max-width: 640px) {
    .quick-links-grid, .stats-grid, .billing-grid { grid-template-columns: 1fr; }
    .program-grid { grid-template-columns: 1fr; }
    .glass-card-header { flex-direction: column; align-items: stretch; }
    .search-container { max-width: 100%; }
    .info-grid { grid-template-columns: 1fr; }
    .form-grid { grid-template-columns: 1fr; }
    .pd-stats { grid-template-columns: 1fr; }
    .pd-info-grid { grid-template-columns: 1fr; }
    .pd-info-item { border-right: none; }
    .pd-hero-title { font-size: 1.4rem; }
    .pd-tabs-bar { flex-wrap: wrap; }
  }

  /* PM Badge in topbar */
  .pm-badge { display: flex; align-items: center; gap: 8px; padding: 5px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 500; cursor: default; }
  .pm-badge.assigned { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
  .pm-badge.unassigned { background: #fef9c3; border: 1px solid #fde68a; color: #92400e; }
  .pm-badge-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .pm-badge.assigned .pm-badge-dot { background: #22c55e; }
  .pm-badge.unassigned .pm-badge-dot { background: #f59e0b; }

  /* Soporte nav button */
  .core-nav-soporte { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 7px; cursor: pointer; font-size: 0.8rem; font-weight: 600; color: #7c3aed; transition: all 0.12s; border: 1px solid #ede9fe; background: #f5f3ff; width: 100%; text-align: left; margin-top: 4px; }
  .core-nav-soporte:hover { background: #ede9fe; border-color: #c4b5fd; }

  /* Soporte panel overlay */
  .soporte-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100; display: flex; align-items: center; justify-content: center; }
  .soporte-panel { background: #fff; border-radius: 16px; width: 400px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; }
  .soporte-header { padding: 20px 24px 16px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; }
  .soporte-header h3 { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
  .soporte-close { background: none; border: none; font-size: 1.2rem; color: #9ca3af; cursor: pointer; padding: 4px; border-radius: 6px; }
  .soporte-close:hover { background: #f3f4f6; color: #374151; }
  .soporte-body { padding: 20px 24px 24px; }
  .soporte-pm-card { text-align: center; margin-bottom: 20px; }
  .soporte-pm-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #ede9fe, #ddd6fe); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; color: #7c3aed; margin: 0 auto 12px; }
  .soporte-pm-name { font-size: 1.05rem; font-weight: 700; color: #111827; }
  .soporte-pm-role { font-size: 0.78rem; color: #6b7280; margin-top: 2px; }
  .soporte-info-list { display: flex; flex-direction: column; gap: 10px; }
  .soporte-info-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #f9fafb; border-radius: 10px; }
  .soporte-info-icon { width: 32px; height: 32px; border-radius: 8px; background: #ede9fe; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0; }
  .soporte-info-label { font-size: 0.68rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; }
  .soporte-info-value { font-size: 0.82rem; font-weight: 600; color: #111827; }
  .soporte-empty { text-align: center; padding: 24px; color: #6b7280; font-size: 0.85rem; }
  .soporte-empty-icon { font-size: 2rem; margin-bottom: 8px; }
`;

// ============================================================================
// API helpers
// ============================================================================
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

function mapApiProgram(p: any): Program {
  const statusMap: Record<string, Program['status']> = {
    active: 'active', designed: 'draft', matching: 'active', running: 'active',
    ready_for_execution: 'active', in_execution: 'active',
    completed: 'completed', closed: 'completed', under_review: 'active',
  };
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    theme: p.theme || 'General',
    rawStatus: p.status || 'designed',
    status: statusMap[p.status] || 'draft',
    participants: p.participants_count || 0,
    activitiesCount: p.activities_count || 0,
    activities: (p.activities || []).map((a: any) => ({
      id: String(a.id),
      type: a.type || 'event',
      name: a.name || 'Actividad',
      description: a.description || '',
      category: a.category || '',
      status: a.status || 'created',
      modality: a.modality || 'online',
      start_date: a.start_date || null,
      end_date: a.end_date || null,
      target_role: a.target_role || 'both',
      is_mandatory: a.is_mandatory || false,
      is_certificate_issued: a.is_certificate_issued || false,
      meeting_url: a.meeting_url || '',
      location_address: a.location_address || '',
      capacity: a.capacity || null,
      confirmed_count: a.confirmed_count || 0,
      attendance_count: a.attendance_count || 0,
      created_at: a.created_at || '',
    })),
    progress: p.status === 'active' || p.status === 'running' || p.status === 'in_execution' ? 50 : p.status === 'completed' ? 100 : 0,
    startDate: p.created_at ? new Date(p.created_at).toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL'),
    requires_certification: p.requires_certification || false,
  };
}

function getProgressColor(p: number) {
  return p >= 75 ? '#059669' : p >= 40 ? '#f59e0b' : '#e5e7eb';
}

const LABELS = {
  status: { designed: 'Disenado', active: 'Activo', matching: 'En matching', running: 'En ejecucion', completed: 'Completado', closed: 'Cerrado', draft: 'Borrador', ready_for_execution: 'Listo', in_execution: 'En ejecucion', under_review: 'En revision', created: 'Creada' } as Record<string, string>,
  theme: { leadership: 'Liderazgo', innovation: 'Innovacion', diversity: 'Diversidad', onboarding: 'Onboarding', technical: 'Tecnico', General: 'General' } as Record<string, string>,
  actType: { training: 'Formacion', event: 'Evento', exercise: 'Ejercicio', workshop: 'Taller', session: 'Sesion', assessment: 'Evaluacion' } as Record<string, string>,
  actCategory: { mentoria: 'Mentoria', liderazgo: 'Liderazgo', tecnico: 'Tecnico', general: 'General' } as Record<string, string>,
  targetRole: { both: 'Todos', mentor: 'Mentor', mentee: 'Mentee' } as Record<string, string>,
  partRole: { administrator: 'Admin', instructor: 'Instructor', participant: 'Participante', observer: 'Observador', mentor: 'Mentor', mentee: 'Mentee' } as Record<string, string>,
  modality: { online: 'Online', presencial: 'Presencial', hibrido: 'Hibrido' } as Record<string, string>,
};

const THEME_GRADIENTS: Record<string, string> = {
  leadership: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 60%, #6d28d9 100%)',
  innovation: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 30%, #0284c7 60%, #0ea5e9 100%)',
  diversity: 'linear-gradient(135deg, #701a75 0%, #86198f 30%, #a21caf 60%, #c026d3 100%)',
  onboarding: 'linear-gradient(135deg, #064e3b 0%, #047857 30%, #059669 60%, #10b981 100%)',
  technical: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 30%, #2563eb 60%, #3b82f6 100%)',
  General: 'linear-gradient(135deg, #1f2937 0%, #374151 30%, #4b5563 60%, #6b7280 100%)',
};

// ============================================================================
// COMPONENT
// ============================================================================
export default function CoreDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'participants' | 'activities' | 'modules' | 'milestones'>('overview');
  const [programParticipants, setProgramParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ email: '', first_name: '', last_name: '', role: 'participant' });
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [participantMsg, setParticipantMsg] = useState('');
  const [programDetail, setProgramDetail] = useState<any>(null);
  const [programTemplate, setProgramTemplate] = useState<any>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [pmData, setPmData] = useState<any>(null);
  const [showSoporte, setShowSoporte] = useState(false);

  const selectProgram = (prog: Program) => {
    setSelectedProgram(prog);
    setActiveNav('programs');
    setDetailTab('overview');
    fetchParticipants(prog.id);
    fetchProgramDetail(prog.id);
    fetchProgramTemplate(prog.name);
  };

  const fetchProgramDetail = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/programs/${id}`);
      if (res.ok) { const d = await res.json(); setProgramDetail(d); }
    } catch (err) { console.error(err); }
  };

  const fetchProgramTemplate = async (programName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/program-templates`);
      if (res.ok) {
        const templates = await res.json();
        const match = templates.find((t: any) => t.name === programName);
        setProgramTemplate(match || null);
      }
    } catch (err) { console.error(err); }
  };

  const fetchParticipants = async (id: string) => {
    setLoadingParticipants(true);
    try {
      const res = await fetch(`${API_URL}/api/programs/${id}/participants`);
      if (res.ok) { const d = await res.json(); setProgramParticipants(Array.isArray(d) ? d : (d.participants || [])); }
    } catch (err) { console.error(err); }
    finally { setLoadingParticipants(false); }
  };

  const handleAddParticipant = async () => {
    if (!selectedProgram || !newParticipant.email) return;
    setAddingParticipant(true); setParticipantMsg('');
    try {
      const uRes = await fetch(`${API_URL}/api/programs/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: newParticipant.email, first_name: newParticipant.first_name, last_name: newParticipant.last_name }) });
      if (!uRes.ok) throw new Error((await uRes.json().catch(() => ({}))).detail || 'Error creando usuario');
      const ud = await uRes.json();
      const pRes = await fetch(`${API_URL}/api/programs/${selectedProgram.id}/participants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: ud.id, role: newParticipant.role, status: 'active' }) });
      if (!pRes.ok) throw new Error((await pRes.json().catch(() => ({}))).detail || 'Error agregando participante');
      setParticipantMsg('Participante agregado exitosamente');
      setNewParticipant({ email: '', first_name: '', last_name: '', role: 'participant' });
      setShowAddParticipant(false);
      fetchParticipants(selectedProgram.id);
      refreshPrograms();
    } catch (err: any) { setParticipantMsg(`Error: ${err.message}`); }
    finally { setAddingParticipant(false); }
  };

  const handleRemoveParticipant = async (pid: string) => {
    if (!selectedProgram) return;
    try { await fetch(`${API_URL}/api/programs/${selectedProgram.id}/participants/${pid}`, { method: 'DELETE' }); fetchParticipants(selectedProgram.id); refreshPrograms(); }
    catch (err) { console.error(err); }
  };

  const refreshPrograms = async () => {
    if (!company?.id) return;
    try { const res = await fetch(`${API_URL}/api/programs?company_id=${company.id}`); if (res.ok) { const d = await res.json(); setPrograms((Array.isArray(d) ? d : []).map(mapApiProgram)); } }
    catch (err) { console.error(err); }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const companyStr = localStorage.getItem('company');
    if (!userStr) { router.push('/login'); return; }
    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      if (companyStr) {
        const parsedCompany = JSON.parse(companyStr);
        setCompany(parsedCompany);
        // Fetch PM data
        if (parsedCompany?.id) {
          fetch(`${API_URL}/api/companies/company/${parsedCompany.id}/pm`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setPmData(d.assigned_pm); })
            .catch(() => {});
        }
      }
    } catch { router.push('/login'); }
  }, [router]);

  useEffect(() => {
    if (!company?.id) { setLoadingPrograms(false); return; }
    const f = async () => {
      setLoadingPrograms(true);
      try { const res = await fetch(`${API_URL}/api/programs?company_id=${company.id}`); if (res.ok) { const d = await res.json(); setPrograms((Array.isArray(d) ? d : []).map(mapApiProgram)); } }
      catch (err) { console.error(err); }
      finally { setLoadingPrograms(false); }
    };
    f();
  }, [company?.id]);

  const filteredPrograms = programs.filter(p => {
    const s = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const f = statusFilter === 'all' || p.status === statusFilter;
    return s && f;
  });

  const stats = {
    programs: programs.length,
    active: programs.filter(p => p.status === 'active').length,
    participants: programs.reduce((a, p) => a + p.participants, 0),
    activities: programs.reduce((a, p) => a + p.activitiesCount, 0),
  };

  const userName = user?.full_name || 'Usuario';
  const companyName = company?.name || 'Tu Empresa';
  const planMap: Record<string, { name: string; price: string }> = {
    starter: { name: 'Starter', price: '$49/mes' },
    growth: { name: 'Growth', price: '$149/mes' },
    enterprise: { name: 'Enterprise', price: 'Personalizado' },
  };
  const planInfo = planMap[company?.plan] || planMap.enterprise;

  const getStatusBadge = (s: string) => <span className={`badge ${s === 'active' ? 'badge-active' : s === 'completed' ? 'badge-completed' : 'badge-draft'}`}>{LABELS.status[s] || s}</span>;

  // ── NAV ITEMS ──
  const navItems = [
    { section: 'Principal', items: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'programs', label: 'Programas', count: stats.programs },
      { id: 'participants', label: 'Participantes', count: stats.participants },
      { id: 'activities', label: 'Actividades', count: stats.activities },
    ]},
    { section: 'Gestion', items: [
      { id: 'analytics', label: 'Analitica' },
      { id: 'billing', label: 'Facturacion' },
      { id: 'settings', label: 'Configuracion' },
    ]},
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER SECTIONS
  // ══════════════════════════════════════════════════════════════════════════

  const renderProgramFiltersAndList = () => (
    <>
      <div className="glass-card">
        <div className="glass-card-header">
          <div className="search-container">
            <span className="search-icon">&#x2315;</span>
            <input type="text" className="input-field" placeholder="Buscar programas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="filter-tabs">
            {(['all', 'active', 'draft', 'completed'] as const).map(s => (
              <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : s === 'draft' ? 'Borrador' : 'Completados'}
              </button>
            ))}
          </div>
          <div className="view-toggle">
            <button className={`btn-outline ${viewMode === 'list' ? '' : ''}`} onClick={() => setViewMode('list')} style={{ fontWeight: viewMode === 'list' ? 700 : 400, fontSize: '0.72rem', padding: '4px 10px' }}>Lista</button>
            <button className={`btn-outline`} onClick={() => setViewMode('grid')} style={{ fontWeight: viewMode === 'grid' ? 700 : 400, fontSize: '0.72rem', padding: '4px 10px' }}>Tarjetas</button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="program-list">
          {filteredPrograms.map(prog => (
            <div key={prog.id} className="program-row" onClick={() => selectProgram(prog)} style={{ cursor: 'pointer' }}>
              <div className="program-info">
                <div className="program-name">{prog.name}</div>
                <div className="program-meta">{LABELS.theme[prog.theme] || prog.theme} &middot; Desde {prog.startDate}</div>
              </div>
              <span className="badge badge-theme">{LABELS.theme[prog.theme] || prog.theme}</span>
              {getStatusBadge(prog.rawStatus)}
              <div className="program-stat"><span>{prog.participants} part.</span></div>
              <div className="program-stat"><span>{prog.activitiesCount} act.</span></div>
              <div className="program-progress">
                <div className="program-progress-bar"><div className="program-progress-fill" style={{ width: `${prog.progress}%`, background: getProgressColor(prog.progress) }} /></div>
                <div className="program-progress-text">{prog.progress}%</div>
              </div>
            </div>
          ))}
          {filteredPrograms.length === 0 && <div className="empty-state">No se encontraron programas</div>}
        </div>
      ) : (
        <div className="program-grid">
          {filteredPrograms.map(prog => (
            <div key={prog.id} className="program-card" onClick={() => selectProgram(prog)} style={{ cursor: 'pointer' }}>
              <div className="program-card-header">
                <div className="program-info">
                  <div className="program-name">{prog.name}</div>
                  <div className="program-meta">{prog.startDate}</div>
                </div>
              </div>
              {prog.description && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 8, lineHeight: 1.4 }}>{prog.description.slice(0, 120)}{prog.description.length > 120 ? '...' : ''}</div>}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <span className="badge badge-theme">{LABELS.theme[prog.theme] || prog.theme}</span>
                {getStatusBadge(prog.rawStatus)}
              </div>
              <div className="program-progress" style={{ marginBottom: 8 }}>
                <div className="program-progress-bar"><div className="program-progress-fill" style={{ width: `${prog.progress}%`, background: getProgressColor(prog.progress) }} /></div>
                <div className="program-progress-text">{prog.progress}%</div>
              </div>
              <div className="program-card-stats">
                <div className="program-card-stat"><strong>{prog.participants}</strong> participantes</div>
                <div className="program-card-stat"><strong>{prog.activitiesCount}</strong> actividades</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // ── DASHBOARD ──
  const renderDashboard = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Bienvenido, {userName.split(' ')[0]}</h1>
        <p className="dash-subtitle">Panel de control de {companyName} &mdash; Plan {planInfo.name}</p>
      </div>

      <div className="quick-links-grid">
        {[
          { id: 'programs', title: 'Programas', desc: 'Gestionar programas', count: stats.programs, color: '#7c3aed' },
          { id: 'participants', title: 'Participantes', desc: 'Mentores y mentees', count: stats.participants, color: '#2563eb' },
          { id: 'activities', title: 'Actividades', desc: 'Eventos y formaciones', count: stats.activities, color: '#059669' },
          { id: 'billing', title: 'Facturacion', desc: 'Plan y pagos', count: undefined, color: '#ca8a04' },
        ].map(link => (
          <div key={link.id} className="quick-link-card" onClick={() => setActiveNav(link.id)}>
            <div className="quick-link-dot" style={{ background: link.color }} />
            <div style={{ flex: 1 }}>
              <div className="quick-link-title">{link.title}</div>
              <div className="quick-link-desc">{link.desc}</div>
            </div>
            {link.count !== undefined && <div className="quick-link-count">{link.count}</div>}
          </div>
        ))}
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Programas', value: stats.programs, change: `${stats.programs} asignado${stats.programs !== 1 ? 's' : ''} a tu cuenta`, stripe: '#7c3aed' },
          { label: 'Programas Activos', value: stats.active, change: stats.programs > 0 ? `${Math.round((stats.active / stats.programs) * 100)}% del total` : 'Sin programas', stripe: '#059669' },
          { label: 'Participantes', value: stats.participants, change: stats.participants > 0 ? 'Inscritos en programas' : 'Sin participantes aun', stripe: '#2563eb' },
          { label: 'Actividades', value: stats.activities, change: stats.activities > 0 ? 'Eventos y formaciones' : 'Sin actividades aun', stripe: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-stripe" style={{ background: s.stripe }} />
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>

      {renderProgramFiltersAndList()}

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-title">Por Tema de Programa</div>
          <div className="summary-list">
            {(() => {
              const themes = programs.reduce((acc, p) => { const t = p.theme || 'General'; acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>);
              const entries = Object.entries(themes);
              return entries.length === 0 ? (
                <div className="empty-state" style={{ padding: 20, fontSize: '0.82rem' }}>Sin programas asignados</div>
              ) : entries.map(([theme, count], i) => (
                <div key={i} className="summary-item">
                  <span className="summary-item-label">{LABELS.theme[theme] || theme}</span>
                  <span className="summary-item-value">{count} programa{count !== 1 ? 's' : ''}</span>
                </div>
              ));
            })()}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-title">Actividad Reciente</div>
          <div className="summary-list">
            {programs.length === 0 ? (
              <div className="empty-state" style={{ padding: 20, fontSize: '0.82rem' }}>Sin actividad reciente</div>
            ) : programs.slice(0, 4).map((p, i) => (
              <div key={i} className="activity-item">
                <div className="activity-dot" style={{ background: p.status === 'active' ? '#10b981' : '#7c3aed' }} />
                <div className="activity-content">
                  <div className="activity-text">Programa &ldquo;{p.name}&rdquo; asignado</div>
                  <div className="activity-time">{LABELS.status[p.rawStatus] || p.rawStatus}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  // ── PROGRAM DETAIL ──
  const renderProgramDetail = () => {
    if (!selectedProgram) return null;
    const p = selectedProgram;
    const d = programDetail;
    const heroGradient = THEME_GRADIENTS[p.theme] || THEME_GRADIENTS.leadership;
    const totalSessions = programTemplate?.modules?.reduce((a: number, m: any) => a + (m.sessions || 0), 0) || 0;
    const totalResources = programTemplate?.modules?.reduce((a: number, m: any) => a + (m.resources?.length || 0), 0) || 0;

    return (
      <div className="pd-wrapper">
        {/* ── HERO ── */}
        <section className="pd-hero">
          <div className="pd-hero-bg" style={{ background: heroGradient }}>
            <div className="pd-bubble pd-bubble-1" />
            <div className="pd-bubble pd-bubble-2" />
            <div className="pd-bubble pd-bubble-3" />
            <div className="pd-bubble pd-bubble-4" />
            <div className="pd-bubble pd-bubble-5" />
          </div>
          <div className="pd-hero-inner">
            <button className="pd-back" onClick={() => { setSelectedProgram(null); setProgramDetail(null); }}>
              &larr; Volver a programas
            </button>
            <h1 className="pd-hero-title">{p.name}</h1>
            {p.description && <p className="pd-hero-desc">{p.description}</p>}

            <div className="pd-hero-meta">
              <div className="pd-hero-meta-item"><div className="pd-hero-meta-label">Participantes</div><div className="pd-hero-meta-value">{programParticipants.length}</div></div>
              <div className="pd-hero-meta-item"><div className="pd-hero-meta-label">Actividades</div><div className="pd-hero-meta-value">{p.activitiesCount}</div></div>
              <div className="pd-hero-meta-item"><div className="pd-hero-meta-label">Modulos</div><div className="pd-hero-meta-value">{programTemplate?.modules?.length || 0}</div></div>
              <div className="pd-hero-meta-item"><div className="pd-hero-meta-label">Duracion</div><div className="pd-hero-meta-value">{programTemplate?.duration || '—'}</div></div>
              <div className="pd-hero-meta-item"><div className="pd-hero-meta-label">Creado</div><div className="pd-hero-meta-value">{p.startDate}</div></div>
            </div>

            <div className="pd-hero-pills">
              <span className="pd-pill pd-pill-theme">{LABELS.theme[p.theme] || p.theme}</span>
              <span className="pd-pill pd-pill-status" style={{ background: p.rawStatus === 'active' || p.rawStatus === 'running' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.12)', color: '#fff' }}>{LABELS.status[p.rawStatus] || p.rawStatus}</span>
              {p.requires_certification && <span className="pd-pill" style={{ background: 'rgba(251,191,36,0.25)', color: '#fef3c7', border: '1px solid rgba(251,191,36,0.3)' }}>Certificacion requerida</span>}
              {programTemplate?.tags?.map((tag: string, i: number) => (
                <span key={i} className="pd-pill" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)' }}>#{tag}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── TABS ── */}
        <div className="pd-tabs">
          <div className="pd-tabs-bar">
            {([
              { key: 'overview', label: 'Resumen' },
              { key: 'modules', label: `Modulos (${programTemplate?.modules?.length || 0})` },
              { key: 'participants', label: `Participantes (${programParticipants.length})` },
              { key: 'activities', label: `Actividades (${p.activities.length})` },
              { key: 'milestones', label: `Hitos (${programTemplate?.milestones?.length || 0})` },
            ] as const).map(tab => (
              <button key={tab.key} className={`pd-tab ${detailTab === tab.key ? 'active' : ''}`} onClick={() => setDetailTab(tab.key as any)}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="pd-content">

          {/* ─── TAB: OVERVIEW ─── */}
          {detailTab === 'overview' && (
            <>
              <div className="pd-stats">
                {[
                  { label: 'Participantes', value: programParticipants.length, sub: programParticipants.length > 0 ? 'Inscritos' : 'Sin inscripciones', color: '#7c3aed' },
                  { label: 'Actividades', value: p.activitiesCount, sub: `${p.activities.filter(a => a.status === 'completed').length} completadas`, color: '#059669' },
                  { label: 'Modulos', value: programTemplate?.modules?.length || 0, sub: `${totalSessions} sesiones, ${totalResources} recursos`, color: '#2563eb' },
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
                  <div className="pd-section-title">Informacion del Programa</div>
                </div>
                <div className="pd-info-grid">
                  <div className="pd-info-item"><div className="pd-info-label">Nombre</div><div className="pd-info-val">{p.name}</div></div>
                  <div className="pd-info-item"><div className="pd-info-label">Tema</div><div className="pd-info-val">{LABELS.theme[p.theme] || p.theme}</div></div>
                  <div className="pd-info-item"><div className="pd-info-label">Estado</div><div className="pd-info-val">{LABELS.status[p.rawStatus] || p.rawStatus}</div></div>
                  <div className="pd-info-item"><div className="pd-info-label">Fecha de creacion</div><div className="pd-info-val">{p.startDate}</div></div>
                  <div className="pd-info-item"><div className="pd-info-label">Certificacion</div><div className="pd-info-val">{p.requires_certification ? 'Requerida' : 'No requerida'}</div></div>
                  <div className="pd-info-item"><div className="pd-info-label">Empresa</div><div className="pd-info-val">{companyName}</div></div>
                  {programTemplate?.duration && <div className="pd-info-item"><div className="pd-info-label">Duracion</div><div className="pd-info-val">{programTemplate.duration}</div></div>}
                  {programTemplate?.category && <div className="pd-info-item"><div className="pd-info-label">Categoria</div><div className="pd-info-val">{programTemplate.category}</div></div>}
                  {p.description && <div className="pd-info-item" style={{ gridColumn: '1 / -1' }}><div className="pd-info-label">Descripcion</div><div className="pd-info-val" style={{ fontWeight: 400 }}>{p.description}</div></div>}
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
                    <div className="pd-req-row"><span className="pd-req-label">Max. mentees</span><span className="pd-req-val">{programTemplate.mentorRequirements.maxMentees || '—'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Experiencia minima</span><span className="pd-req-val">{programTemplate.mentorRequirements.minExperienceYears ? `${programTemplate.mentorRequirements.minExperienceYears} anos` : '—'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Nivel requerido</span><span className="pd-req-val">{programTemplate.mentorRequirements.requiredLevel || '—'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Requiere perfil</span><span className="pd-req-val">{programTemplate.mentorRequirements.requireProfile ? 'Si' : 'No'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Requiere LinkedIn</span><span className="pd-req-val">{programTemplate.mentorRequirements.requireLinkedIn ? 'Si' : 'No'}</span></div>
                  </div>
                  <div className="pd-req">
                    <div className="pd-req-head">Requisitos Mentee</div>
                    <div className="pd-req-row"><span className="pd-req-label">Puede elegir mentor</span><span className="pd-req-val">{programTemplate.menteeRequirements?.canSelectMentor ? 'Si' : 'No'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Max. mentores</span><span className="pd-req-val">{programTemplate.menteeRequirements?.maxMentors || '—'}</span></div>
                    <div className="pd-req-row"><span className="pd-req-label">Objetivos requeridos</span><span className="pd-req-val">{programTemplate.menteeRequirements?.requiredGoals ? 'Si' : 'No'}</span></div>
                  </div>
                </div>
              )}

              {/* Activities summary */}
              {p.activities.length > 0 && (
                <div className="pd-section">
                  <div className="pd-section-head">
                    <div className="pd-section-title">Actividades</div>
                    <div className="pd-section-count">{p.activities.length}</div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr><th>Nombre</th><th>Tipo</th><th>Categoria</th><th>Modalidad</th><th>Obligatoria</th><th>Estado</th></tr>
                      </thead>
                      <tbody>
                        {p.activities.map((a, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{a.name}</td>
                            <td>{LABELS.actType[a.type] || a.type}</td>
                            <td>{LABELS.actCategory[a.category] || a.category || '—'}</td>
                            <td>{LABELS.modality[a.modality] || a.modality}</td>
                            <td>{a.is_mandatory ? 'Si' : 'No'}</td>
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

          {/* ─── TAB: PARTICIPANTS ─── */}
          {detailTab === 'participants' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Participantes del Programa</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{programParticipants.length} persona{programParticipants.length !== 1 ? 's' : ''} inscrita{programParticipants.length !== 1 ? 's' : ''}</div>
                </div>
                <button className={showAddParticipant ? 'btn-outline' : 'btn-primary'} onClick={() => { setShowAddParticipant(!showAddParticipant); setParticipantMsg(''); }}>
                  {showAddParticipant ? 'Cancelar' : '+ Agregar Participante'}
                </button>
              </div>

              {showAddParticipant && (
                <div style={{ background: '#faf8ff', borderRadius: 14, padding: 20, marginBottom: 16, border: '1px solid #ede9fe' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827', marginBottom: 10 }}>Nuevo Participante</div>
                  <div className="form-grid">
                    <input className="form-input" placeholder="Nombre" value={newParticipant.first_name} onChange={e => setNewParticipant({ ...newParticipant, first_name: e.target.value })} />
                    <input className="form-input" placeholder="Apellido" value={newParticipant.last_name} onChange={e => setNewParticipant({ ...newParticipant, last_name: e.target.value })} />
                    <input className="form-input" type="email" placeholder="Email (requerido)" value={newParticipant.email} onChange={e => setNewParticipant({ ...newParticipant, email: e.target.value })} />
                    <select className="form-select" value={newParticipant.role} onChange={e => setNewParticipant({ ...newParticipant, role: e.target.value })}>
                      <option value="participant">Participante</option>
                      <option value="instructor">Instructor</option>
                      <option value="administrator">Administrador</option>
                      <option value="observer">Observador</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <button className="btn-primary" onClick={handleAddParticipant} disabled={addingParticipant || !newParticipant.email}>
                      {addingParticipant ? 'Agregando...' : 'Agregar'}
                    </button>
                  </div>
                  {participantMsg && <div style={{ marginTop: 8, fontSize: '0.78rem', color: participantMsg.startsWith('Error') ? '#dc2626' : '#059669' }}>{participantMsg}</div>}
                </div>
              )}

              {loadingParticipants ? (
                <div className="empty-state" style={{ padding: 28 }}>Cargando participantes...</div>
              ) : programParticipants.length === 0 ? (
                <div className="pd-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sin participantes</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 14 }}>Agrega mentores, mentees o participantes a este programa</div>
                  <button className="btn-primary" onClick={() => setShowAddParticipant(true)}>+ Agregar primer participante</button>
                </div>
              ) : (
                <div className="pd-section">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th style={{ width: 60 }}></th></tr>
                      </thead>
                      <tbody>
                        {programParticipants.map((pt: any, i: number) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{pt.user?.full_name || pt.full_name || '—'}</td>
                            <td>{pt.user?.email || pt.email || '—'}</td>
                            <td>{LABELS.partRole[pt.role] || pt.role}</td>
                            <td><span className={`badge ${pt.status === 'active' ? 'badge-active' : 'badge-draft'}`}>{pt.status === 'active' ? 'Activo' : pt.status}</span></td>
                            <td><button className="btn-danger-sm" onClick={() => handleRemoveParticipant(pt.id)}>Quitar</button></td>
                          </tr>
                        ))}
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
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>{p.activities.length} actividad{p.activities.length !== 1 ? 'es' : ''} configurada{p.activities.length !== 1 ? 's' : ''}</div>
              </div>

              {p.activities.length === 0 ? (
                <div className="pd-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sin actividades</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Este programa no tiene actividades configuradas aun</div>
                </div>
              ) : (
                <div className="pd-section">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Nombre</th><th>Tipo</th><th>Categoria</th><th>Modalidad</th><th>Dirigido a</th><th>Obligatoria</th><th>Certificado</th><th>Capacidad</th><th>Confirmados</th><th>Asistencia</th><th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.activities.map((a, i) => (
                          <tr key={i}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{a.name}</div>
                              {a.description && <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 2 }}>{a.description}</div>}
                            </td>
                            <td>{LABELS.actType[a.type] || a.type}</td>
                            <td>{LABELS.actCategory[a.category] || a.category || '—'}</td>
                            <td>{LABELS.modality[a.modality] || a.modality}</td>
                            <td>{LABELS.targetRole[a.target_role] || a.target_role}</td>
                            <td>{a.is_mandatory ? 'Si' : 'No'}</td>
                            <td>{a.is_certificate_issued ? 'Si' : 'No'}</td>
                            <td>{a.capacity || '—'}</td>
                            <td>{a.confirmed_count}</td>
                            <td>{a.attendance_count}</td>
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

          {/* ─── TAB: MODULES ─── */}
          {detailTab === 'modules' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Modulos del Programa</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                    {programTemplate?.modules?.length || 0} modulos — {totalSessions} sesiones — {totalResources} recursos
                  </div>
                </div>
                {programTemplate?.modules?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-outline" style={{ fontSize: '0.72rem', padding: '5px 12px' }} onClick={() => {
                      const allKeys = programTemplate.modules.map((m: any, i: number) => m.id || `mod-${i}`);
                      setExpandedModules(new Set(allKeys));
                    }}>Expandir todo</button>
                    <button className="btn-outline" style={{ fontSize: '0.72rem', padding: '5px 12px' }} onClick={() => setExpandedModules(new Set())}>Colapsar</button>
                  </div>
                )}
              </div>

              {!programTemplate || !programTemplate.modules?.length ? (
                <div className="pd-section" style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Sin modulos</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Este programa no tiene modulos configurados</div>
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
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>Actividades del modulo ({mod.activities.length})</div>
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
        </div>
      </div>
    );
  };

  // ── PROGRAMS ──
  const renderPrograms = () => (
    <>
      {selectedProgram ? renderProgramDetail() : (
        <>
          <div className="dash-header">
            <h1 className="dash-title">Mis Programas</h1>
            <p className="dash-subtitle">Gestiona tus programas de mentoria &mdash; {stats.programs} programa{stats.programs !== 1 ? 's' : ''}, {stats.active} activo{stats.active !== 1 ? 's' : ''}</p>
          </div>
          {renderProgramFiltersAndList()}
        </>
      )}
    </>
  );

  // ── PARTICIPANTS ──
  const renderParticipants = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Participantes</h1>
        <p className="dash-subtitle">{stats.participants} persona{stats.participants !== 1 ? 's' : ''} registrada{stats.participants !== 1 ? 's' : ''} en tus programas</p>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div className="stat-card-stripe" style={{ background: '#7c3aed' }} /><div className="stat-label">Total Participantes</div><div className="stat-value">{stats.participants}</div></div>
        <div className="stat-card"><div className="stat-card-stripe" style={{ background: '#059669' }} /><div className="stat-label">Programas con participantes</div><div className="stat-value">{programs.filter(p => p.participants > 0).length}</div></div>
        <div className="stat-card"><div className="stat-card-stripe" style={{ background: '#2563eb' }} /><div className="stat-label">Promedio por programa</div><div className="stat-value">{stats.programs > 0 ? Math.round(stats.participants / stats.programs) : 0}</div></div>
      </div>
      {programs.length > 0 ? (
        <div className="summary-card">
          <div className="summary-title">Participantes por programa</div>
          <div className="summary-list">
            {programs.map((p, i) => (
              <div key={i} className="summary-item" style={{ cursor: 'pointer' }} onClick={() => selectProgram(p)}>
                <span className="summary-item-label">{p.name}</span>
                <span className="summary-item-value">{p.participants} participante{p.participants !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">Sin programas asignados</div>
      )}
    </>
  );

  // ── ACTIVITIES ──
  const renderActivities = () => {
    const allActivities = programs.flatMap(p => p.activities.map(a => ({ ...a, programName: p.name })));
    return (
      <>
        <div className="dash-header">
          <h1 className="dash-title">Actividades</h1>
          <p className="dash-subtitle">{allActivities.length} actividad{allActivities.length !== 1 ? 'es' : ''} en total</p>
        </div>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card"><div className="stat-card-stripe" style={{ background: '#7c3aed' }} /><div className="stat-label">Total</div><div className="stat-value">{allActivities.length}</div></div>
          <div className="stat-card"><div className="stat-card-stripe" style={{ background: '#059669' }} /><div className="stat-label">Formaciones</div><div className="stat-value">{allActivities.filter(a => a.type === 'training').length}</div></div>
          <div className="stat-card"><div className="stat-card-stripe" style={{ background: '#f59e0b' }} /><div className="stat-label">Ejercicios</div><div className="stat-value">{allActivities.filter(a => a.type === 'exercise').length}</div></div>
          <div className="stat-card"><div className="stat-card-stripe" style={{ background: '#2563eb' }} /><div className="stat-label">Eventos</div><div className="stat-value">{allActivities.filter(a => a.type === 'event').length}</div></div>
        </div>
        {allActivities.length > 0 ? (
          <div className="summary-card">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Nombre</th><th>Programa</th><th>Tipo</th><th>Modalidad</th><th>Estado</th></tr></thead>
                <tbody>
                  {allActivities.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{a.name}</td>
                      <td style={{ fontSize: '0.75rem', color: '#6b7280' }}>{a.programName}</td>
                      <td>{LABELS.actType[a.type] || a.type}</td>
                      <td>{LABELS.modality[a.modality] || a.modality}</td>
                      <td>{getStatusBadge(a.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state">Sin actividades</div>
        )}
      </>
    );
  };

  // ── ANALYTICS ──
  const renderAnalytics = () => {
    const allActs = programs.flatMap(p => p.activities);
    const completed = allActs.filter(a => a.status === 'completed').length;
    const total = allActs.length;
    return (
      <>
        <div className="dash-header">
          <h1 className="dash-title">Analitica</h1>
          <p className="dash-subtitle">Metricas derivadas de tus programas reales</p>
        </div>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card"><div className="stat-card-stripe" style={{ background: '#7c3aed' }} /><div className="stat-label">Programas</div><div className="stat-value">{stats.programs}</div><div className="stat-change">{stats.active} activos</div></div>
          <div className="stat-card"><div className="stat-card-stripe" style={{ background: '#059669' }} /><div className="stat-label">Actividades completadas</div><div className="stat-value">{completed}/{total}</div><div className="stat-change">{total > 0 ? Math.round((completed/total)*100) : 0}% avance</div></div>
          <div className="stat-card"><div className="stat-card-stripe" style={{ background: '#2563eb' }} /><div className="stat-label">Participantes</div><div className="stat-value">{stats.participants}</div><div className="stat-change">En programas activos</div></div>
          <div className="stat-card"><div className="stat-card-stripe" style={{ background: '#f59e0b' }} /><div className="stat-label">Promedio progreso</div><div className="stat-value">{stats.programs > 0 ? Math.round(programs.reduce((a, p) => a + p.progress, 0) / stats.programs) : 0}%</div></div>
        </div>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-title">Progreso por programa</div>
            <div className="summary-list">
              {programs.map((p, i) => (
                <div key={i} className="summary-item">
                  <span className="summary-item-label">{p.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="program-progress-bar" style={{ width: 60 }}><div className="program-progress-fill" style={{ width: `${p.progress}%`, background: getProgressColor(p.progress) }} /></div>
                    <span className="summary-item-value">{p.progress}%</span>
                  </div>
                </div>
              ))}
              {programs.length === 0 && <div className="empty-state" style={{ padding: 20, fontSize: '0.82rem' }}>Sin datos</div>}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-title">Distribucion por estado</div>
            <div className="summary-list">
              {Object.entries(programs.reduce((acc, p) => { acc[p.rawStatus] = (acc[p.rawStatus] || 0) + 1; return acc; }, {} as Record<string, number>)).map(([st, count], i) => (
                <div key={i} className="summary-item">
                  <span className="summary-item-label">{LABELS.status[st] || st}</span>
                  <span className="summary-item-value">{count}</span>
                </div>
              ))}
              {programs.length === 0 && <div className="empty-state" style={{ padding: 20, fontSize: '0.82rem' }}>Sin datos</div>}
            </div>
          </div>
        </div>
      </>
    );
  };

  // ── BILLING ──
  const renderBilling = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Facturacion</h1>
        <p className="dash-subtitle">Gestion del plan y pagos de {companyName}</p>
      </div>
      <div className="billing-grid">
        <div className="billing-card"><div className="billing-label">Plan Actual</div><div className="billing-value">{planInfo.name}</div><div className="billing-sub">{planInfo.price}</div></div>
        <div className="billing-card"><div className="billing-label">Programas</div><div className="billing-value">{stats.programs}</div><div className="billing-sub">Asignados a tu cuenta</div></div>
        <div className="billing-card"><div className="billing-label">Metodo de Pago</div><div className="billing-value">Sin configurar</div><div className="billing-sub">Contacta a tu PM</div></div>
      </div>
      <div className="summary-card">
        <div className="summary-title">Historial de Facturacion</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Estado</th></tr></thead>
            <tbody>
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No hay facturas registradas</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // ── SETTINGS ──
  const renderSettings = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Configuracion</h1>
        <p className="dash-subtitle">Ajustes de tu cuenta y empresa</p>
      </div>
      <div className="settings-section">
        <div className="settings-section-title">Perfil de Administrador</div>
        <div className="settings-row"><span className="settings-label">Nombre</span><span className="settings-value">{userName}</span></div>
        <div className="settings-row"><span className="settings-label">Email</span><span className="settings-value">{user?.email || '—'}</span></div>
        <div className="settings-row"><span className="settings-label">Telefono</span><span className="settings-value">{user?.phone || '—'}</span></div>
        <div className="settings-row"><span className="settings-label">Contrasena</span><div><button className="settings-btn">Cambiar contrasena</button></div></div>
      </div>
      <div className="settings-section">
        <div className="settings-section-title">Empresa</div>
        <div className="settings-row"><span className="settings-label">Nombre</span><span className="settings-value">{companyName}</span></div>
        <div className="settings-row"><span className="settings-label">Plan</span><span className="settings-value">{planInfo.name} &mdash; {planInfo.price}</span></div>
        <div className="settings-row"><span className="settings-label">Estado</span><span className="badge badge-active">Activa</span></div>
        <div className="settings-row"><span className="settings-label">Industria</span><span className="settings-value">{company?.industry || '—'}</span></div>
        <div className="settings-row"><span className="settings-label">Tamano</span><span className="settings-value">{company?.company_size || '—'}</span></div>
      </div>
      <div className="settings-section">
        <div className="settings-section-title">Preferencias</div>
        <div className="settings-row"><span className="settings-label">Notificaciones</span><span className="settings-value">Activadas</span></div>
        <div className="settings-row"><span className="settings-label">Idioma</span><span className="settings-value">Espanol</span></div>
        <div className="settings-row"><span className="settings-label">Zona horaria</span><span className="settings-value">America/Santiago</span></div>
      </div>
      <div className="settings-section" style={{ borderColor: '#fecaca' }}>
        <div className="settings-section-title" style={{ color: '#dc2626' }}>Zona de Peligro</div>
        <div className="settings-row"><span className="settings-label">Cancelar suscripcion</span><button className="settings-btn" style={{ color: '#dc2626', borderColor: '#fecaca' }}>Cancelar plan</button></div>
      </div>
    </>
  );

  // ── CONTENT SWITCH ──
  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard': return renderDashboard();
      case 'programs': return renderPrograms();
      case 'participants': return renderParticipants();
      case 'activities': return renderActivities();
      case 'analytics': return renderAnalytics();
      case 'billing': return renderBilling();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="core-layout">

        {/* SIDEBAR */}
        <aside className="core-sidebar">
          <div className="core-sidebar-header">
            <div className="core-sidebar-logo">
              <Image src="/images/logo.png" alt="Inspiratoria" width={32} height={32} style={{ borderRadius: 8 }} />
              <span className="core-sidebar-logo-text">Inspiratoria</span>
            </div>
            <div className="core-plan-badge">{planInfo.name} &middot; {companyName}</div>
          </div>

          <nav className="core-nav">
            {navItems.map(section => (
              <div key={section.section} className="core-nav-section">
                <div className="core-nav-section-title">{section.section}</div>
                {section.items.map(item => (
                  <button key={item.id} className={`core-nav-item ${activeNav === item.id ? 'active' : ''}`}
                    onClick={() => { setActiveNav(item.id); if (item.id !== 'programs') setSelectedProgram(null); }}>
                    {item.label}
                    {item.count !== undefined && <span className="core-nav-count">{item.count}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="core-sidebar-footer">
            {/* Soporte button */}
            <button className="core-nav-soporte" onClick={() => setShowSoporte(true)}>
              <span>&#x1F4AC;</span> Soporte
            </button>
            <div className="core-user-card" style={{ marginTop: 10 }}>
              <div className="core-user-avatar">{userName.charAt(0).toUpperCase()}</div>
              <div>
                <div className="core-user-name">{userName}</div>
                <div className="core-user-role">Administrador</div>
              </div>
            </div>
          </div>
        </aside>

        {/* TOPBAR */}
        <div className="core-topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="core-topbar-title">{navItems.flatMap(s => s.items).find(i => i.id === activeNav)?.label || 'Dashboard'}</span>
            <span className="core-topbar-sub">{companyName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className={`pm-badge ${pmData ? 'assigned' : 'unassigned'}`} onClick={() => pmData && setShowSoporte(true)} style={{ cursor: pmData ? 'pointer' : 'default' }}>
              <span className="pm-badge-dot" />
              <span style={{ fontWeight: 600 }}>PM:</span>
              <span>{pmData ? pmData.full_name : 'Sin asignación'}</span>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <main className={`core-main${selectedProgram ? ' detail-active' : ''}`}>
          {loadingPrograms ? (
            <div className="empty-state">Cargando datos...</div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* SOPORTE PANEL */}
      {showSoporte && (
        <div className="soporte-overlay" onClick={() => setShowSoporte(false)}>
          <div className="soporte-panel" onClick={e => e.stopPropagation()}>
            <div className="soporte-header">
              <h3>Soporte &mdash; Project Manager</h3>
              <button className="soporte-close" onClick={() => setShowSoporte(false)}>&times;</button>
            </div>
            <div className="soporte-body">
              {pmData ? (
                <>
                  <div className="soporte-pm-card">
                    <div className="soporte-pm-avatar">{pmData.full_name?.charAt(0)?.toUpperCase() || 'P'}</div>
                    <div className="soporte-pm-name">{pmData.full_name}</div>
                    <div className="soporte-pm-role">{pmData.position || 'Project Manager'}</div>
                  </div>
                  <div className="soporte-info-list">
                    <div className="soporte-info-row">
                      <div className="soporte-info-icon">&#x2709;</div>
                      <div>
                        <div className="soporte-info-label">Email</div>
                        <div className="soporte-info-value">{pmData.email}</div>
                      </div>
                    </div>
                    {pmData.phone && (
                      <div className="soporte-info-row">
                        <div className="soporte-info-icon">&#x260E;</div>
                        <div>
                          <div className="soporte-info-label">Teléfono</div>
                          <div className="soporte-info-value">{pmData.phone}</div>
                        </div>
                      </div>
                    )}
                    {pmData.department && (
                      <div className="soporte-info-row">
                        <div className="soporte-info-icon">&#x1F3E2;</div>
                        <div>
                          <div className="soporte-info-label">Departamento</div>
                          <div className="soporte-info-value">{pmData.department}</div>
                        </div>
                      </div>
                    )}
                    <div className="soporte-info-row" style={{ background: '#f0fdf4' }}>
                      <div className="soporte-info-icon" style={{ background: '#dcfce7' }}>&#x2714;</div>
                      <div>
                        <div className="soporte-info-label">Estado</div>
                        <div className="soporte-info-value" style={{ color: '#166534' }}>Asignado a tu cuenta</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="soporte-empty">
                  <div className="soporte-empty-icon">&#x1F4CB;</div>
                  <p><strong>Sin Project Manager asignado</strong></p>
                  <p style={{ fontSize: '0.78rem', marginTop: 4 }}>Tu cuenta aún no tiene un PM asignado. Contacta a Inspiratoria para más información.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
