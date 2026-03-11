'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// ============================================================================
// TYPES
// ============================================================================
interface Program {
  id: string;
  name: string;
  type: 'one_on_one' | 'group' | 'cell';
  status: 'active' | 'draft' | 'completed';
  mentors: number;
  mentees: number;
  sessions: number;
  progress: number;
  startDate: string;
  endDate: string;
}

// ============================================================================
// PLAN CONFIG
// ============================================================================
const PLAN_CONFIG: Record<string, { name: string; price: string; color: string; participants: number; programs: number }> = {
  core_50: { name: 'Core 50', price: '$790.000/mes', color: '#7c3aed', participants: 50, programs: 3 },
  core_120: { name: 'Core 120', price: '$1.290.000/mes', color: '#6d28d9', participants: 120, programs: 5 },
  core_300: { name: 'Core 300', price: '$2.490.000/mes', color: '#5b21b6', participants: 300, programs: 10 },
  core_enterprise: { name: 'Enterprise', price: '$3.500.000/mes', color: '#4c1d95', participants: 999, programs: 999 },
  starter: { name: 'Core Starter', price: '$790.000/mes', color: '#7c3aed', participants: 50, programs: 3 },
  growth: { name: 'Core Growth', price: '$1.290.000/mes', color: '#6d28d9', participants: 120, programs: 5 },
  enterprise: { name: 'Enterprise', price: '$3.500.000/mes', color: '#4c1d95', participants: 999, programs: 999 },
  trial: { name: 'Trial', price: 'Gratis', color: '#6b7280', participants: 10, programs: 1 },
};

// ============================================================================
// ICONS (inline SVG)
// ============================================================================
const Icons = {
  search: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  grid: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  list: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  program: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  calendar: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  chart: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  settings: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  arrow: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>,
  check: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  clock: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>,
  eye: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  edit: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  activity: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  logout: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  home: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  bell: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  billing: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  download: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  shield: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  star: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  mentor: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  upgrade: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>,
};

// ============================================================================
// STYLES
// ============================================================================
const styles = `
  .core-layout { display: flex; min-height: 100vh; background: #f8f9fb; }

  /* ─── Sidebar ─── */
  .core-sidebar {
    width: 270px; background: #ffffff; border-right: 1px solid #eaedf2;
    display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 40;
  }
  .core-sidebar-header { padding: 20px 18px 16px; border-bottom: 1px solid #eaedf2; }
  .core-sidebar-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .core-sidebar-logo-icon {
    width: 38px; height: 38px; border-radius: 11px; overflow: hidden;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .core-sidebar-logo-icon img { width: 100%; height: 100%; object-fit: cover; }
  .core-sidebar-logo-text { font-size: 15px; font-weight: 700; color: #111827; letter-spacing: -0.01em; }

  .core-plan-badge {
    display: flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, #f5f3ff, #ede9fe);
    border: 1px solid #ddd6fe;
    border-radius: 10px; padding: 10px 12px;
  }
  .core-plan-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    display: flex; align-items: center; justify-content: center;
    color: #fff; flex-shrink: 0;
  }
  .core-plan-info { flex: 1; min-width: 0; }
  .core-plan-name { font-size: 12px; font-weight: 700; color: #4c1d95; text-transform: uppercase; letter-spacing: 0.04em; }
  .core-plan-company { font-size: 11px; color: #6d28d9; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .core-sidebar-nav { flex: 1; padding: 10px 10px; overflow-y: auto; }
  .core-nav-section { margin-bottom: 14px; }
  .core-nav-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.2px; padding: 0 10px; margin-bottom: 4px; }
  .core-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 8px;
    font-size: 13px; font-weight: 500; color: #4b5563;
    cursor: pointer; transition: all 0.15s ease;
    border: none; background: none; width: 100%; text-align: left;
  }
  .core-nav-item:hover { background: #f3f4f6; color: #111827; }
  .core-nav-item.active { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; box-shadow: 0 2px 8px rgba(124,58,237,0.25); }
  .core-nav-item.active svg { color: #ffffff; }
  .core-nav-count {
    margin-left: auto; font-size: 11px; font-weight: 600;
    background: #f3f4f6; color: #6b7280; padding: 1px 8px; border-radius: 10px;
  }
  .core-nav-item.active .core-nav-count { background: rgba(255,255,255,0.2); color: #fff; }

  .core-sidebar-footer { padding: 14px 18px; border-top: 1px solid #eaedf2; }
  .core-sidebar-user { display: flex; align-items: center; gap: 10px; }
  .core-sidebar-avatar {
    width: 34px; height: 34px; background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff;
  }
  .core-sidebar-user-info { flex: 1; min-width: 0; }
  .core-sidebar-user-name { font-size: 13px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .core-sidebar-user-role { font-size: 11px; color: #9ca3af; }

  /* ─── Top Bar ─── */
  .core-topbar {
    height: 56px; background: #ffffff; border-bottom: 1px solid #eaedf2;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; position: fixed; top: 0; left: 270px; right: 0; z-index: 30;
  }
  .core-topbar-left { display: flex; align-items: center; gap: 12px; }
  .core-topbar-title { font-size: 15px; font-weight: 600; color: #111827; }
  .core-topbar-sub { font-size: 12px; color: #9ca3af; margin-left: 8px; }
  .core-topbar-right { display: flex; align-items: center; gap: 8px; }
  .core-topbar-btn {
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    background: #f3f4f6; border: none; border-radius: 8px; color: #6b7280; cursor: pointer; transition: all 0.15s; position: relative;
  }
  .core-topbar-btn:hover { background: #e5e7eb; color: #111827; }
  .core-topbar-badge { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 2px solid #fff; }

  /* ─── Main Content ─── */
  .core-main { margin-left: 270px; margin-top: 56px; padding: 24px; flex: 1; min-height: calc(100vh - 56px); }

  /* ─── Dashboard Cards ─── */
  .dash-header { margin-bottom: 24px; }
  .dash-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin-bottom: 2px; letter-spacing: -0.02em; }
  .dash-subtitle { font-size: 0.875rem; color: #6b7280; }

  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .stat-card {
    background: white; border: 1px solid #eaedf2; border-radius: 14px; padding: 18px 20px;
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .stat-card:hover { border-color: #d1d5db; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
  .stat-card-stripe { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .stat-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; font-weight: 500; }
  .stat-value { font-size: 1.75rem; font-weight: 700; color: #111827; letter-spacing: -0.02em; }
  .stat-change { font-size: 0.75rem; color: #10b981; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
  .stat-change.warn { color: #f59e0b; }

  .quick-links-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .quick-link-card {
    background: white; border: 1px solid #eaedf2; border-radius: 14px; padding: 18px;
    cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 14px;
  }
  .quick-link-card:hover { border-color: #7c3aed; box-shadow: 0 4px 16px rgba(124,58,237,0.08); transform: translateY(-1px); }
  .quick-link-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .quick-link-content { flex: 1; }
  .quick-link-title { font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 2px; }
  .quick-link-desc { font-size: 0.75rem; color: #6b7280; }
  .quick-link-count { font-size: 1.25rem; font-weight: 700; color: #111827; }

  /* ─── Glass Card / Filters ─── */
  .glass-card { background: white; border: 1px solid #eaedf2; border-radius: 14px; padding: 16px 20px; margin-bottom: 16px; }
  .glass-card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .search-container { position: relative; flex: 1; max-width: 320px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
  .input-field { width: 100%; padding: 8px 12px 8px 36px; border: 1px solid #eaedf2; border-radius: 8px; font-size: 0.875rem; background: #f8f9fb; transition: all 0.15s; }
  .input-field:focus { outline: none; border-color: #7c3aed; background: white; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
  .filter-tabs { display: flex; gap: 4px; background: #f3f4f6; padding: 3px; border-radius: 8px; }
  .filter-tab { padding: 6px 14px; font-size: 0.75rem; font-weight: 500; color: #6b7280; background: transparent; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
  .filter-tab:hover { color: #111827; }
  .filter-tab.active { background: white; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .view-toggle { display: flex; gap: 4px; background: #f3f4f6; padding: 3px; border-radius: 8px; }
  .btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 6px; color: #6b7280; cursor: pointer; transition: all 0.15s; }
  .btn-icon:hover { color: #111827; }
  .btn-icon.active { background: white; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.15s; box-shadow: 0 2px 6px rgba(124,58,237,0.2); }
  .btn-primary:hover { background: linear-gradient(135deg, #6d28d9, #5b21b6); box-shadow: 0 4px 12px rgba(124,58,237,0.3); }

  /* ─── Program Items ─── */
  .program-list { display: flex; flex-direction: column; gap: 8px; }
  .program-row { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: white; border: 1px solid #eaedf2; border-radius: 14px; cursor: pointer; transition: all 0.15s; }
  .program-row:hover { border-color: #d1d5db; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
  .program-avatar { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .program-info { flex: 1; min-width: 0; }
  .program-name { font-size: 0.875rem; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .program-meta { font-size: 0.75rem; color: #9ca3af; display: flex; align-items: center; gap: 12px; margin-top: 3px; }
  .program-stat { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #6b7280; min-width: 80px; }
  .program-progress { width: 120px; }
  .program-progress-bar { width: 100%; height: 6px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
  .program-progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .program-progress-text { font-size: 0.7rem; color: #6b7280; margin-top: 2px; text-align: right; }

  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 0.625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; border-radius: 9999px; }
  .badge-active { background: #d1fae5; color: #065f46; }
  .badge-draft { background: #fef3c7; color: #92400e; }
  .badge-completed { background: #e0e7ff; color: #3730a3; }
  .badge-type { background: #f3f4f6; color: #374151; }

  .program-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
  .program-row:hover .program-actions { opacity: 1; }
  .action-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border: none; border-radius: 6px; color: #6b7280; cursor: pointer; transition: all 0.15s; }
  .action-btn:hover { background: #e5e7eb; color: #111827; }

  .program-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .program-card { background: white; border: 1px solid #eaedf2; border-radius: 14px; padding: 20px; cursor: pointer; transition: all 0.15s; }
  .program-card:hover { border-color: #d1d5db; box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
  .program-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .program-card-stats { display: flex; gap: 16px; padding-top: 12px; border-top: 1px solid #f3f4f6; }
  .program-card-stat { font-size: 0.75rem; color: #6b7280; }
  .program-card-stat strong { color: #111827; }
  .program-card-progress { margin: 12px 0; }

  /* ─── Summary ─── */
  .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 24px; }
  .summary-card { background: white; border: 1px solid #eaedf2; border-radius: 14px; padding: 20px; }
  .summary-title { font-size: 0.875rem; font-weight: 600; color: #111827; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .summary-list { display: flex; flex-direction: column; gap: 8px; }
  .summary-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: #f8f9fb; border-radius: 10px; }
  .summary-item-label { font-size: 0.875rem; color: #374151; }
  .summary-item-value { font-size: 0.875rem; font-weight: 600; color: #111827; }
  .activity-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: #f8f9fb; border-radius: 10px; }
  .activity-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .activity-content { flex: 1; }
  .activity-text { font-size: 0.875rem; color: #374151; }
  .activity-time { font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }

  /* ─── Billing Section ─── */
  .billing-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
  .billing-plan-card {
    background: linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95);
    border-radius: 18px; padding: 28px 32px; color: white; margin-bottom: 24px;
    position: relative; overflow: hidden;
  }
  .billing-plan-card::after {
    content: ''; position: absolute; top: -40%; right: -10%; width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(167,139,250,0.15), transparent 60%);
    border-radius: 50%;
  }
  .billing-plan-label { font-size: 12px; font-weight: 600; color: #c4b5fd; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
  .billing-plan-name { font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.02em; }
  .billing-plan-price { font-size: 14px; color: #c4b5fd; margin-top: 4px; }
  .billing-plan-meta { display: flex; gap: 24px; margin-top: 16px; }
  .billing-plan-meta-item { font-size: 13px; color: #ddd6fe; }
  .billing-plan-meta-item strong { color: white; font-weight: 700; }

  .billing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
  .billing-stat {
    background: white; border: 1px solid #eaedf2; border-radius: 14px; padding: 18px 20px;
  }
  .billing-stat-label { font-size: 0.75rem; color: #6b7280; margin-bottom: 6px; font-weight: 500; }
  .billing-stat-value { font-size: 1.25rem; font-weight: 700; color: #111827; }
  .billing-stat-sub { font-size: 0.75rem; color: #9ca3af; margin-top: 4px; }

  .billing-table { width: 100%; border-collapse: collapse; }
  .billing-table th { text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; padding: 10px 16px; border-bottom: 1px solid #eaedf2; }
  .billing-table td { font-size: 0.875rem; color: #374151; padding: 14px 16px; border-bottom: 1px solid #f3f4f6; }
  .billing-table tr:last-child td { border-bottom: none; }
  .billing-status { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
  .billing-status.paid { background: #d1fae5; color: #065f46; }
  .billing-status.pending { background: #fef3c7; color: #92400e; }
  .billing-download-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; font-size: 0.75rem; font-weight: 500; color: #7c3aed; background: #f5f3ff; border: 1px solid #ede9fe; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
  .billing-download-btn:hover { background: #ede9fe; }

  /* ─── Participants ─── */
  .participants-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
  .participant-card { background: white; border: 1px solid #eaedf2; border-radius: 14px; padding: 18px; display: flex; align-items: center; gap: 14px; transition: all 0.15s; }
  .participant-card:hover { border-color: #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .participant-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; color: white; flex-shrink: 0; }
  .participant-info { flex: 1; min-width: 0; }
  .participant-name { font-size: 0.875rem; font-weight: 600; color: #111827; }
  .participant-role-small { font-size: 0.75rem; color: #6b7280; margin-top: 1px; }

  /* ─── Sessions ─── */
  .session-row { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: white; border: 1px solid #eaedf2; border-radius: 14px; margin-bottom: 8px; }
  .session-date { text-align: center; min-width: 48px; }
  .session-date-day { font-size: 1.25rem; font-weight: 700; color: #111827; }
  .session-date-month { font-size: 0.625rem; color: #9ca3af; text-transform: uppercase; font-weight: 600; }
  .session-info { flex: 1; }
  .session-title { font-size: 0.875rem; font-weight: 600; color: #111827; }
  .session-meta { font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }

  /* ─── Settings ─── */
  .settings-section { background: white; border: 1px solid #eaedf2; border-radius: 14px; padding: 24px; margin-bottom: 16px; }
  .settings-section-title { font-size: 1rem; font-weight: 600; color: #111827; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f3f4f6; }
  .settings-row:last-child { border-bottom: none; }
  .settings-label { font-size: 0.875rem; font-weight: 500; color: #374151; }
  .settings-value { font-size: 0.875rem; color: #6b7280; }
  .settings-btn { padding: 6px 14px; font-size: 0.8rem; font-weight: 500; border: 1px solid #eaedf2; border-radius: 6px; background: white; color: #374151; cursor: pointer; transition: all 0.15s; }
  .settings-btn:hover { background: #f3f4f6; }

  .empty-state { text-align: center; padding: 48px; color: #6b7280; }

  @media (max-width: 1024px) {
    .quick-links-grid, .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .program-grid { grid-template-columns: repeat(2, 1fr); }
    .summary-grid { grid-template-columns: 1fr; }
    .billing-grid { grid-template-columns: repeat(2, 1fr); }
    .core-sidebar { display: none; }
    .core-topbar { left: 0; }
    .core-main { margin-left: 0; }
  }
  @media (max-width: 640px) {
    .quick-links-grid, .stats-grid, .billing-grid { grid-template-columns: 1fr; }
    .program-grid { grid-template-columns: 1fr; }
    .glass-card-header { flex-direction: column; align-items: stretch; }
    .search-container { max-width: 100%; }
  }
`;

// ============================================================================
// SAMPLE DATA
// ============================================================================
const samplePrograms: Program[] = [
  { id: '1', name: 'Programa Liderazgo Emergente 2026', type: 'one_on_one', status: 'active', mentors: 12, mentees: 24, sessions: 48, progress: 65, startDate: '2026-01-15', endDate: '2026-07-15' },
  { id: '2', name: 'Células de Innovación Tech', type: 'cell', status: 'active', mentors: 6, mentees: 18, sessions: 32, progress: 40, startDate: '2026-02-01', endDate: '2026-08-01' },
  { id: '3', name: 'Mentoría para Nuevos Talentos', type: 'one_on_one', status: 'draft', mentors: 0, mentees: 0, sessions: 0, progress: 0, startDate: '2026-04-01', endDate: '2026-10-01' },
  { id: '4', name: 'Programa de Desarrollo Directivo', type: 'group', status: 'completed', mentors: 8, mentees: 32, sessions: 96, progress: 100, startDate: '2025-06-01', endDate: '2025-12-01' },
  { id: '5', name: 'Onboarding Mentoría Express', type: 'one_on_one', status: 'active', mentors: 4, mentees: 8, sessions: 12, progress: 80, startDate: '2026-01-01', endDate: '2026-04-01' },
];

const sampleParticipants = [
  { name: 'María López', role: 'Mentora Senior', program: 'Liderazgo Emergente', color: '#7c3aed' },
  { name: 'Pedro Sánchez', role: 'Mentee', program: 'Liderazgo Emergente', color: '#2563eb' },
  { name: 'Carolina Rivera', role: 'Mentee', program: 'Células Innovación', color: '#059669' },
  { name: 'Juan Morales', role: 'Mentor', program: 'Células Innovación', color: '#dc2626' },
  { name: 'Ana Torres', role: 'Mentee', program: 'Liderazgo Emergente', color: '#ea580c' },
  { name: 'Diego Fuentes', role: 'Mentor', program: 'Onboarding Express', color: '#0891b2' },
  { name: 'Laura Guzmán', role: 'Mentora', program: 'Desarrollo Directivo', color: '#7c3aed' },
  { name: 'Roberto Valdés', role: 'Mentee', program: 'Onboarding Express', color: '#4f46e5' },
];

const sampleSessions = [
  { day: '24', month: 'Feb', title: 'Sesión #13 — María López ↔ Pedro Sánchez', meta: 'Liderazgo Emergente · 30 min · Zoom', status: 'upcoming' },
  { day: '25', month: 'Feb', title: 'Kick-off Células de Innovación Q2', meta: 'Células Innovación · 60 min · Presencial', status: 'upcoming' },
  { day: '26', month: 'Feb', title: 'Sesión #5 — Diego ↔ Roberto', meta: 'Onboarding Express · 45 min · Teams', status: 'upcoming' },
  { day: '21', month: 'Feb', title: 'Sesión #12 — María ↔ Pedro', meta: 'Liderazgo Emergente · 30 min · Zoom', status: 'completed' },
  { day: '20', month: 'Feb', title: 'Retrospectiva Desarrollo Directivo', meta: 'Desarrollo Directivo · 90 min · Presencial', status: 'completed' },
  { day: '19', month: 'Feb', title: 'Check-in Carolina ↔ Juan', meta: 'Células Innovación · 20 min · Chat', status: 'completed' },
];

const sampleInvoices = [
  { id: 'INV-2026-002', date: '01 Feb 2026', concept: 'Mensualidad Febrero 2026', amount: '$790.000', status: 'pending' },
  { id: 'INV-2026-001', date: '01 Ene 2026', concept: 'Mensualidad Enero 2026', amount: '$790.000', status: 'paid' },
  { id: 'INV-2025-012', date: '01 Dic 2025', concept: 'Mensualidad Diciembre 2025', amount: '$790.000', status: 'paid' },
  { id: 'INV-2025-011', date: '01 Nov 2025', concept: 'Mensualidad Noviembre 2025', amount: '$790.000', status: 'paid' },
  { id: 'INV-2025-010', date: '01 Oct 2025', concept: 'Mensualidad Octubre 2025', amount: '$790.000', status: 'paid' },
];

const recentActivity = [
  { text: 'María López completó su sesión #12 con Pedro Sánchez', time: 'Hace 1 hora', color: '#7c3aed' },
  { text: 'Nuevo match: Carolina Rivera → Juan Morales', time: 'Hace 3 horas', color: '#059669' },
  { text: 'Programa "Liderazgo Emergente" alcanzó 65% de progreso', time: 'Hace 5 horas', color: '#2563eb' },
  { text: 'Ana Torres completó su evaluación de medio término', time: 'Hace 1 día', color: '#ea580c' },
];

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

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const companyStr = localStorage.getItem('company');
    if (!userStr) {
      router.push('/login');
      return;
    }
    try {
      setUser(JSON.parse(userStr));
      if (companyStr) setCompany(JSON.parse(companyStr));
    } catch {
      router.push('/login');
    }
  }, [router]);

  const filteredPrograms = samplePrograms.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    programs: samplePrograms.length,
    active: samplePrograms.filter(p => p.status === 'active').length,
    participants: samplePrograms.reduce((s, p) => s + p.mentors + p.mentees, 0),
    sessions: samplePrograms.reduce((s, p) => s + p.sessions, 0),
  };

  const getStatusBadge = (status: Program['status']) => {
    switch (status) {
      case 'active': return <span className="badge badge-active">{Icons.check} Activo</span>;
      case 'draft': return <span className="badge badge-draft">{Icons.clock} Borrador</span>;
      case 'completed': return <span className="badge badge-completed">{Icons.check} Completado</span>;
    }
  };

  const getTypeBadge = (type: Program['type']) => {
    const labels = { one_on_one: '1:1', group: 'Grupal', cell: 'Célula' };
    return <span className="badge badge-type">{labels[type]}</span>;
  };

  const getProgressColor = (p: number) => {
    if (p >= 80) return '#10b981';
    if (p >= 50) return '#7c3aed';
    if (p > 0) return '#f59e0b';
    return '#e5e7eb';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('company');
    router.push('/login');
  };

  const companyName = company?.name || user?.company_name || 'Mi Empresa';
  const userName = user?.full_name || user?.username || user?.email || 'Admin';
  const planKey = company?.plan || 'starter';
  const planInfo = PLAN_CONFIG[planKey] || PLAN_CONFIG.starter;

  // Nav items
  const navSections = [
    {
      label: 'Principal',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Icons.home },
        { id: 'programs', label: 'Programas', icon: Icons.program, count: stats.programs },
        { id: 'participants', label: 'Participantes', icon: Icons.users, count: stats.participants },
        { id: 'sessions', label: 'Sesiones', icon: Icons.calendar, count: stats.sessions },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { id: 'analytics', label: 'Analítica', icon: Icons.chart },
        { id: 'billing', label: 'Facturación', icon: Icons.billing },
        { id: 'settings', label: 'Configuración', icon: Icons.settings },
      ],
    },
  ];

  const getTopbarTitle = () => {
    const map: Record<string, [string, string]> = {
      dashboard: ['Dashboard', companyName],
      programs: ['Programas', `${stats.programs} programas registrados`],
      participants: ['Participantes', `${stats.participants} personas activas`],
      sessions: ['Sesiones', `${stats.sessions} sesiones realizadas`],
      analytics: ['Analítica', 'Reportes y métricas'],
      billing: ['Facturación', 'Plan y pagos'],
      settings: ['Configuración', 'Ajustes de cuenta'],
    };
    return map[activeNav] || ['Dashboard', ''];
  };

  const [title, subtitle] = getTopbarTitle();

  // ===== RENDER VIEWS =====

  const renderDashboard = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Bienvenido, {userName.split(' ')[0]}</h1>
        <p className="dash-subtitle">Panel de control de {companyName} — Plan {planInfo.name}</p>
      </div>

      <div className="quick-links-grid">
        {[
          { id: 'programs', title: 'Programas', desc: 'Gestionar programas', icon: Icons.program, count: stats.programs, bg: '#f5f3ff', color: '#7c3aed' },
          { id: 'participants', title: 'Participantes', desc: 'Mentores y mentees', icon: Icons.users, count: stats.participants, bg: '#eff6ff', color: '#2563eb' },
          { id: 'sessions', title: 'Sesiones', desc: 'Calendario y seguimiento', icon: Icons.calendar, count: stats.sessions, bg: '#f0fdf4', color: '#059669' },
          { id: 'billing', title: 'Facturación', desc: 'Plan y pagos', icon: Icons.billing, count: undefined, bg: '#fefce8', color: '#ca8a04' },
        ].map(link => (
          <div key={link.id} className="quick-link-card" onClick={() => setActiveNav(link.id)}>
            <div className="quick-link-icon" style={{ background: link.bg, color: link.color }}>{link.icon}</div>
            <div className="quick-link-content">
              <div className="quick-link-title">{link.title}</div>
              <div className="quick-link-desc">{link.desc}</div>
            </div>
            {link.count !== undefined && <div className="quick-link-count">{link.count}</div>}
            <div style={{ color: '#d1d5db' }}>{Icons.arrow}</div>
          </div>
        ))}
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Programas', value: stats.programs, change: '+1 este mes', stripe: '#7c3aed' },
          { label: 'Programas Activos', value: stats.active, change: `${Math.round((stats.active / stats.programs) * 100)}% del total`, stripe: '#059669' },
          { label: 'Participantes', value: stats.participants, change: '+12 esta semana', stripe: '#2563eb' },
          { label: 'Sesiones Realizadas', value: stats.sessions, change: '+18 esta semana', stripe: '#f59e0b' },
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
          <div className="summary-title">{Icons.program} Por Tipo de Programa</div>
          <div className="summary-list">
            {[
              { label: 'Mentoría 1:1', count: samplePrograms.filter(p => p.type === 'one_on_one').length },
              { label: 'Células de Aprendizaje', count: samplePrograms.filter(p => p.type === 'cell').length },
              { label: 'Grupales', count: samplePrograms.filter(p => p.type === 'group').length },
            ].map((item, i) => (
              <div key={i} className="summary-item">
                <span className="summary-item-label">{item.label}</span>
                <span className="summary-item-value">{item.count} programa{item.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-title">{Icons.activity} Actividad Reciente</div>
          <div className="summary-list">
            {recentActivity.map((a, i) => (
              <div key={i} className="activity-item">
                <div className="activity-dot" style={{ background: a.color }} />
                <div className="activity-content">
                  <div className="activity-text">{a.text}</div>
                  <div className="activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderProgramFiltersAndList = () => (
    <>
      <div className="glass-card">
        <div className="glass-card-header">
          <div className="search-container">
            <span className="search-icon">{Icons.search}</span>
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
            <button className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>{Icons.list}</button>
            <button className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>{Icons.grid}</button>
          </div>
          <button className="btn-primary">{Icons.plus} Nuevo Programa</button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="program-list">
          {filteredPrograms.map(prog => (
            <div key={prog.id} className="program-row">
              <div className="program-avatar" style={{ background: prog.status === 'active' ? '#ede9fe' : prog.status === 'completed' ? '#e0e7ff' : '#f3f4f6' }}>
                {prog.type === 'one_on_one' ? '👥' : prog.type === 'cell' ? '🧬' : '👨‍👩‍👧‍👦'}
              </div>
              <div className="program-info">
                <div className="program-name">{prog.name}</div>
                <div className="program-meta"><span>{prog.startDate} → {prog.endDate}</span></div>
              </div>
              {getTypeBadge(prog.type)}
              {getStatusBadge(prog.status)}
              <div className="program-stat">{Icons.users}<span>{prog.mentors + prog.mentees}</span></div>
              <div className="program-stat">{Icons.calendar}<span>{prog.sessions} ses.</span></div>
              <div className="program-progress">
                <div className="program-progress-bar"><div className="program-progress-fill" style={{ width: `${prog.progress}%`, background: getProgressColor(prog.progress) }} /></div>
                <div className="program-progress-text">{prog.progress}%</div>
              </div>
              <div className="program-actions">
                <button className="action-btn" title="Ver">{Icons.eye}</button>
                <button className="action-btn" title="Editar">{Icons.edit}</button>
              </div>
            </div>
          ))}
          {filteredPrograms.length === 0 && <div className="empty-state">No se encontraron programas</div>}
        </div>
      ) : (
        <div className="program-grid">
          {filteredPrograms.map(prog => (
            <div key={prog.id} className="program-card">
              <div className="program-card-header">
                <div className="program-avatar" style={{ background: prog.status === 'active' ? '#ede9fe' : '#f3f4f6' }}>
                  {prog.type === 'one_on_one' ? '👥' : prog.type === 'cell' ? '🧬' : '👨‍👩‍👧‍👦'}
                </div>
                <div className="program-info">
                  <div className="program-name">{prog.name}</div>
                  <div className="program-meta"><span>{prog.startDate}</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>{getTypeBadge(prog.type)} {getStatusBadge(prog.status)}</div>
              <div className="program-card-progress">
                <div className="program-progress-bar"><div className="program-progress-fill" style={{ width: `${prog.progress}%`, background: getProgressColor(prog.progress) }} /></div>
                <div className="program-progress-text">{prog.progress}% completado</div>
              </div>
              <div className="program-card-stats">
                <div className="program-card-stat"><strong>{prog.mentors}</strong> mentores</div>
                <div className="program-card-stat"><strong>{prog.mentees}</strong> mentees</div>
                <div className="program-card-stat"><strong>{prog.sessions}</strong> sesiones</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderPrograms = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Mis Programas</h1>
        <p className="dash-subtitle">Gestiona tus programas de mentoría — {stats.programs} programas, {stats.active} activos</p>
      </div>
      {renderProgramFiltersAndList()}
    </>
  );

  const renderParticipants = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Participantes</h1>
        <p className="dash-subtitle">{stats.participants} personas activas en tus programas</p>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Total Mentores', value: samplePrograms.reduce((s, p) => s + p.mentors, 0), change: 'En todos los programas', stripe: '#7c3aed' },
          { label: 'Total Mentees', value: samplePrograms.reduce((s, p) => s + p.mentees, 0), change: 'En todos los programas', stripe: '#2563eb' },
          { label: 'Matches Activos', value: samplePrograms.filter(p => p.status === 'active').reduce((s, p) => s + Math.min(p.mentors, p.mentees), 0), change: 'Parejas confirmadas', stripe: '#059669' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-stripe" style={{ background: s.stripe }} />
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>
      <div className="glass-card" style={{ marginBottom: '16px' }}>
        <div className="glass-card-header">
          <div className="search-container">
            <span className="search-icon">{Icons.search}</span>
            <input type="text" className="input-field" placeholder="Buscar participantes..." />
          </div>
          <div className="filter-tabs">
            <button className="filter-tab active">Todos</button>
            <button className="filter-tab">Mentores</button>
            <button className="filter-tab">Mentees</button>
          </div>
        </div>
      </div>
      <div className="participants-grid">
        {sampleParticipants.map((p, i) => (
          <div key={i} className="participant-card">
            <div className="participant-avatar" style={{ background: p.color }}>{p.name.charAt(0)}</div>
            <div className="participant-info">
              <div className="participant-name">{p.name}</div>
              <div className="participant-role-small">{p.role} · {p.program}</div>
            </div>
            <button className="action-btn" title="Ver perfil">{Icons.eye}</button>
          </div>
        ))}
      </div>
    </>
  );

  const renderSessions = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Sesiones</h1>
        <p className="dash-subtitle">Calendario y seguimiento de sesiones de mentoría</p>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Próximas', value: sampleSessions.filter(s => s.status === 'upcoming').length, change: 'Esta semana', stripe: '#f59e0b' },
          { label: 'Completadas', value: sampleSessions.filter(s => s.status === 'completed').length, change: 'Últimos 7 días', stripe: '#059669' },
          { label: 'Total Sesiones', value: stats.sessions, change: 'Todos los programas', stripe: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-stripe" style={{ background: s.stripe }} />
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', margin: '20px 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>{Icons.calendar} Próximas Sesiones</h3>
      {sampleSessions.filter(s => s.status === 'upcoming').map((s, i) => (
        <div key={i} className="session-row">
          <div className="session-date">
            <div className="session-date-day">{s.day}</div>
            <div className="session-date-month">{s.month}</div>
          </div>
          <div className="session-info">
            <div className="session-title">{s.title}</div>
            <div className="session-meta">{s.meta}</div>
          </div>
          <span className="badge badge-draft">{Icons.clock} Pendiente</span>
        </div>
      ))}
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', margin: '24px 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>{Icons.check} Sesiones Completadas</h3>
      {sampleSessions.filter(s => s.status === 'completed').map((s, i) => (
        <div key={i} className="session-row" style={{ opacity: 0.7 }}>
          <div className="session-date">
            <div className="session-date-day">{s.day}</div>
            <div className="session-date-month">{s.month}</div>
          </div>
          <div className="session-info">
            <div className="session-title">{s.title}</div>
            <div className="session-meta">{s.meta}</div>
          </div>
          <span className="badge badge-completed">{Icons.check} Completada</span>
        </div>
      ))}
    </>
  );

  const renderAnalytics = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Analítica</h1>
        <p className="dash-subtitle">Reportes y métricas de tus programas de mentoría</p>
      </div>
      <div className="stats-grid">
        {[
          { label: 'Tasa de Matching', value: '94%', change: '+2% vs mes anterior', stripe: '#059669' },
          { label: 'Satisfacción', value: '4.7/5', change: 'Promedio global', stripe: '#7c3aed' },
          { label: 'Retención', value: '87%', change: 'Participantes activos', stripe: '#2563eb' },
          { label: 'NPS Score', value: '+68', change: 'Promotores netos', stripe: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-stripe" style={{ background: s.stripe }} />
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change">{s.change}</div>
          </div>
        ))}
      </div>
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-title">{Icons.chart} Progreso por Programa</div>
          <div className="summary-list">
            {samplePrograms.filter(p => p.status !== 'draft').map((p, i) => (
              <div key={i} className="summary-item">
                <div style={{ flex: 1 }}>
                  <div className="summary-item-label" style={{ marginBottom: 4 }}>{p.name}</div>
                  <div className="program-progress-bar"><div className="program-progress-fill" style={{ width: `${p.progress}%`, background: getProgressColor(p.progress) }} /></div>
                </div>
                <span className="summary-item-value" style={{ marginLeft: 12 }}>{p.progress}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-title">{Icons.star} Top Mentores</div>
          <div className="summary-list">
            {[
              { name: 'María López', sessions: 12, rating: '4.9' },
              { name: 'Juan Morales', sessions: 10, rating: '4.8' },
              { name: 'Diego Fuentes', sessions: 8, rating: '4.7' },
              { name: 'Laura Guzmán', sessions: 7, rating: '4.6' },
            ].map((m, i) => (
              <div key={i} className="summary-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>{i + 1}</div>
                  <span className="summary-item-label">{m.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{m.sessions} ses. · ⭐ {m.rating}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderBilling = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Facturación</h1>
        <p className="dash-subtitle">Gestiona tu plan, pagos y documentos tributarios</p>
      </div>

      {/* Plan card */}
      <div className="billing-plan-card">
        <div className="billing-plan-label">Tu Plan Actual</div>
        <div className="billing-plan-name">{planInfo.name}</div>
        <div className="billing-plan-price">{planInfo.price} · Facturación mensual</div>
        <div className="billing-plan-meta">
          <div className="billing-plan-meta-item">Hasta <strong>{planInfo.participants}</strong> participantes</div>
          <div className="billing-plan-meta-item">Hasta <strong>{planInfo.programs}</strong> programas</div>
          <div className="billing-plan-meta-item">Soporte <strong>prioritario</strong></div>
        </div>
      </div>

      {/* Billing stats */}
      <div className="billing-grid">
        <div className="billing-stat">
          <div className="billing-stat-label">Uso del Plan</div>
          <div className="billing-stat-value">{stats.participants} / {planInfo.participants}</div>
          <div className="billing-stat-sub">Participantes activos</div>
          <div style={{ marginTop: 8 }}>
            <div className="program-progress-bar">
              <div className="program-progress-fill" style={{ width: `${Math.min(100, (stats.participants / planInfo.participants) * 100)}%`, background: stats.participants > planInfo.participants * 0.8 ? '#f59e0b' : '#7c3aed' }} />
            </div>
          </div>
        </div>
        <div className="billing-stat">
          <div className="billing-stat-label">Próximo Cobro</div>
          <div className="billing-stat-value">01 Mar 2026</div>
          <div className="billing-stat-sub">{planInfo.price}</div>
        </div>
        <div className="billing-stat">
          <div className="billing-stat-label">Método de Pago</div>
          <div className="billing-stat-value">•••• 4242</div>
          <div className="billing-stat-sub">Visa · Exp 12/27</div>
        </div>
      </div>

      {/* Upgrade banner */}
      {planKey !== 'enterprise' && planKey !== 'core_enterprise' && (
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #ddd6fe', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4c1d95', marginBottom: 4 }}>¿Necesitas más capacidad?</div>
              <div style={{ fontSize: '0.8rem', color: '#6d28d9' }}>Actualiza tu plan para más participantes, programas y funciones avanzadas.</div>
            </div>
            <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #4c1d95, #6d28d9)' }}>{Icons.upgrade} Actualizar Plan</button>
          </div>
        </div>
      )}

      {/* Invoices */}
      <div className="summary-card" style={{ marginTop: 0 }}>
        <div className="summary-title">{Icons.billing} Historial de Facturas</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="billing-table">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sampleInvoices.map((inv, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: '#111827' }}>{inv.id}</td>
                  <td>{inv.date}</td>
                  <td>{inv.concept}</td>
                  <td style={{ fontWeight: 600 }}>{inv.amount}</td>
                  <td><span className={`billing-status ${inv.status}`}>{inv.status === 'paid' ? '✓ Pagada' : '⏳ Pendiente'}</span></td>
                  <td><button className="billing-download-btn">{Icons.download} PDF</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderSettings = () => (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Configuración</h1>
        <p className="dash-subtitle">Ajustes de tu cuenta y empresa</p>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{Icons.mentor} Perfil de Administrador</div>
        <div className="settings-row"><span className="settings-label">Nombre</span><span className="settings-value">{userName}</span></div>
        <div className="settings-row"><span className="settings-label">Email</span><span className="settings-value">{user?.email || '—'}</span></div>
        <div className="settings-row"><span className="settings-label">Teléfono</span><span className="settings-value">{user?.phone || '—'}</span></div>
        <div className="settings-row"><span className="settings-label">Contraseña</span><div><button className="settings-btn">Cambiar contraseña</button></div></div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{Icons.shield} Empresa</div>
        <div className="settings-row"><span className="settings-label">Nombre de empresa</span><span className="settings-value">{companyName}</span></div>
        <div className="settings-row"><span className="settings-label">Plan</span><span className="settings-value">{planInfo.name} — {planInfo.price}</span></div>
        <div className="settings-row"><span className="settings-label">Estado</span><span className="badge badge-active" style={{ marginLeft: 'auto' }}>{Icons.check} Activa</span></div>
        <div className="settings-row"><span className="settings-label">Industria</span><span className="settings-value">{company?.industry || '—'}</span></div>
        <div className="settings-row"><span className="settings-label">Tamaño</span><span className="settings-value">{company?.company_size || '—'}</span></div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">{Icons.settings} Preferencias</div>
        <div className="settings-row"><span className="settings-label">Notificaciones por email</span><span className="settings-value">Activadas</span></div>
        <div className="settings-row"><span className="settings-label">Idioma</span><span className="settings-value">Español</span></div>
        <div className="settings-row"><span className="settings-label">Zona horaria</span><span className="settings-value">America/Santiago (CLT)</span></div>
      </div>

      <div className="settings-section" style={{ borderColor: '#fecaca' }}>
        <div className="settings-section-title" style={{ color: '#dc2626' }}>Zona de Peligro</div>
        <div className="settings-row">
          <span className="settings-label">Cancelar suscripción</span>
          <button className="settings-btn" style={{ color: '#dc2626', borderColor: '#fecaca' }}>Cancelar plan</button>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard': return renderDashboard();
      case 'programs': return renderPrograms();
      case 'participants': return renderParticipants();
      case 'sessions': return renderSessions();
      case 'analytics': return renderAnalytics();
      case 'billing': return renderBilling();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="core-layout">

        {/* ═══ SIDEBAR ═══ */}
        <aside className="core-sidebar">
          <div className="core-sidebar-header">
            <div className="core-sidebar-logo">
              <div className="core-sidebar-logo-icon">
                <Image src="/images/logo.png" alt="Inspiratoria" width={38} height={38} style={{ borderRadius: 11 }} />
              </div>
              <span className="core-sidebar-logo-text">Inspiratoria</span>
            </div>
            <div className="core-plan-badge">
              <div className="core-plan-icon">{Icons.star}</div>
              <div className="core-plan-info">
                <div className="core-plan-name">{planInfo.name}</div>
                <div className="core-plan-company">{companyName}</div>
              </div>
            </div>
          </div>

          <nav className="core-sidebar-nav">
            {navSections.map((section, si) => (
              <div key={si} className="core-nav-section">
                <div className="core-nav-label">{section.label}</div>
                {section.items.map(item => (
                  <button
                    key={item.id}
                    className={`core-nav-item ${activeNav === item.id ? 'active' : ''}`}
                    onClick={() => setActiveNav(item.id)}
                  >
                    {item.icon}
                    {item.label}
                    {item.count !== undefined && <span className="core-nav-count">{item.count}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="core-sidebar-footer">
            <div className="core-sidebar-user">
              <div className="core-sidebar-avatar">{userName.charAt(0).toUpperCase()}</div>
              <div className="core-sidebar-user-info">
                <div className="core-sidebar-user-name">{userName}</div>
                <div className="core-sidebar-user-role">Administrador</div>
              </div>
              <button className="action-btn" onClick={handleLogout} title="Cerrar sesión">{Icons.logout}</button>
            </div>
          </div>
        </aside>

        {/* ═══ TOP BAR ═══ */}
        <div className="core-topbar">
          <div className="core-topbar-left">
            <span className="core-topbar-title">{title}</span>
            <span className="core-topbar-sub">{subtitle}</span>
          </div>
          <div className="core-topbar-right">
            <button className="core-topbar-btn" title="Notificaciones">
              {Icons.bell}
              <span className="core-topbar-badge" />
            </button>
            <button className="core-topbar-btn" title="Configuración" onClick={() => setActiveNav('settings')}>
              {Icons.settings}
            </button>
          </div>
        </div>

        {/* ═══ MAIN ═══ */}
        <main className="core-main">
          {renderContent()}
        </main>
      </div>
    </>
  );
}
