'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from "@/lib/api";

// ============================================================================
// ICONS (same style as dashboard)
// ============================================================================
const Icons = {
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  grid: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  list: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  building: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  program: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
  check: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  clock: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pause: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  activity: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  inbox: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  mail: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  ),
};

// ============================================================================
// STYLES (matching dashboard UX exactly)
// ============================================================================
const styles = `
  .acc-container {
    min-height: 100vh;
    background: #ffffff;
    padding: 2rem;
  }

  .acc-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 2rem;
  }

  .acc-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #b08a00;
    margin-bottom: 0.4rem;
  }

  .acc-eyebrow-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #F5C800;
    display: inline-block;
  }

  .acc-title {
    font-size: 1.75rem;
    font-weight: 800;
    color: #0f0f0f;
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin-bottom: 0;
  }

  .acc-subtitle {
    font-size: 0.82rem;
    color: #9a9a9a;
    margin-top: 0.25rem;
  }

  .acc-title-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.6rem;
    background: rgba(245,200,0,0.12);
    color: #7a5900;
    font-size: 0.72rem;
    font-weight: 700;
    border-radius: 999px;
    border: 1px solid rgba(245,200,0,0.3);
    margin-left: 0.6rem;
    vertical-align: middle;
  }

  .acc-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: #0f0f0f;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .acc-btn-primary:hover {
    background: #222;
    box-shadow: 0 4px 14px rgba(0,0,0,0.15);
  }

  /* Stats Cards - same as dashboard */
  .acc-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .acc-stat-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
  }

  .acc-stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .acc-stat-value {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .acc-stat-sub {
    font-size: 0.75rem;
    color: #10b981;
    margin-top: 0.25rem;
  }

  /* Solicitudes Banner */
  .acc-solicitudes {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .acc-solicitudes:hover {
    border-color: #1a1a1a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .acc-solicitudes-icon {
    position: relative;
    width: 2.5rem;
    height: 2.5rem;
    background: #1a1a1a;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .acc-solicitudes-badge {
    position: absolute;
    top: -0.375rem;
    right: -0.375rem;
    width: 1.25rem;
    height: 1.25rem;
    background: #ef4444;
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .acc-solicitudes-info {
    flex: 1;
  }

  .acc-solicitudes-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .acc-solicitudes-desc {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.125rem;
  }

  .acc-solicitudes-arrow {
    color: #9ca3af;
    transition: color 0.15s ease;
  }

  .acc-solicitudes:hover .acc-solicitudes-arrow {
    color: #1a1a1a;
  }

  /* Glass Card - Toolbar */
  .acc-toolbar {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .acc-toolbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .acc-search-container {
    position: relative;
    flex: 1;
    max-width: 320px;
  }

  .acc-search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  .acc-search-input {
    width: 100%;
    padding: 0.5rem 3.5rem 0.5rem 2.25rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: #fafafa;
    transition: all 0.15s ease;
  }

  .acc-search-input:focus {
    outline: none;
    border-color: #1a1a1a;
    background: white;
  }

  .acc-kbd {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.125rem 0.375rem;
    background: #f3f4f6;
    color: #9ca3af;
    font-size: 0.625rem;
    font-family: monospace;
    border-radius: 0.25rem;
  }

  .acc-filter-tabs {
    display: flex;
    gap: 0.25rem;
    background: #f3f4f6;
    padding: 0.25rem;
    border-radius: 0.5rem;
  }

  .acc-filter-tab {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    background: transparent;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .acc-filter-tab:hover {
    color: #1a1a1a;
  }

  .acc-filter-tab.active {
    background: white;
    color: #1a1a1a;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .acc-sort-select {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    color: #6b7280;
    background: #fafafa;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .acc-sort-select:focus {
    outline: none;
    border-color: #1a1a1a;
  }

  .acc-view-toggle {
    display: flex;
    gap: 0.25rem;
    background: #f3f4f6;
    padding: 0.25rem;
    border-radius: 0.5rem;
  }

  .acc-view-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 0.375rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .acc-view-btn:hover {
    color: #1a1a1a;
  }

  .acc-view-btn.active {
    background: white;
    color: #1a1a1a;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }



  .acc-solicitudes-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    color: #6b7280;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .acc-solicitudes-link:hover {
    border-color: #1a1a1a;
    color: #1a1a1a;
  }

  /* Results count */
  .acc-results {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.75rem;
  }

  /* Company List - same as dashboard */
  .acc-company-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .acc-company-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .acc-company-row:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .acc-company-avatar {
    width: 2.5rem;
    height: 2.5rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    color: #1a1a1a;
    flex-shrink: 0;
  }

  .acc-company-info {
    flex: 1;
    min-width: 0;
  }

  .acc-company-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .acc-company-meta {
    font-size: 0.75rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.125rem;
  }

  .acc-company-meta-icon {
    display: inline-flex;
    align-items: center;
    color: #9ca3af;
  }

  .acc-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.625rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    border-radius: 9999px;
  }

  .acc-badge-type-studio {
    background: #ede9fe;
    color: #5b21b6;
  }

  .acc-badge-type-core {
    background: #dbeafe;
    color: #1e40af;
  }

  .acc-badge-plan {
    background: #ede9fe;
    color: #5b21b6;
  }

  .acc-badge-active {
    background: #d1fae5;
    color: #065f46;
  }

  .acc-badge-trial {
    background: #fef3c7;
    color: #92400e;
  }

  .acc-badge-inactive {
    background: #f3f4f6;
    color: #6b7280;
  }

  .acc-company-stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
    min-width: 70px;
  }

  .acc-company-date {
    font-size: 0.75rem;
    color: #9ca3af;
    min-width: 80px;
    text-align: right;
  }

  .acc-pm-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.625rem;
    font-size: 0.6875rem;
    font-weight: 500;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.15s ease;
    min-width: 90px;
    justify-content: center;
  }

  .acc-pm-badge.assigned {
    background: #dbeafe;
    color: #1e40af;
  }

  .acc-pm-badge.assigned:hover {
    background: #bfdbfe;
  }

  .acc-pm-badge.unassigned {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: default;
  }

  .acc-pm-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .acc-pm-dot.on { background: #3b82f6; }
  .acc-pm-dot.off { background: #d1d5db; }

  /* PM Modal */
  .pm-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pmFadeIn 0.15s ease;
  }

  @keyframes pmFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .pm-modal {
    background: white;
    border-radius: 1rem;
    width: 560px;
    max-width: 95vw;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px rgba(0,0,0,0.15);
    animation: pmSlideUp 0.2s ease;
  }

  @keyframes pmSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .pm-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .pm-modal-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .pm-modal-close {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    color: #6b7280;
    font-size: 1rem;
    transition: all 0.15s ease;
  }

  .pm-modal-close:hover {
    background: #e5e7eb;
    color: #1a1a1a;
  }

  .pm-modal-profile {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .pm-modal-avatar {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 0.75rem;
    background: #1a1a1a;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.125rem;
    flex-shrink: 0;
  }

  .pm-modal-info {
    flex: 1;
    min-width: 0;
  }

  .pm-modal-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .pm-modal-role {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.125rem;
  }

  .pm-modal-contact {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .pm-modal-contact-item {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .pm-modal-tabs {
    display: flex;
    gap: 0;
    padding: 0 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .pm-modal-tab {
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #6b7280;
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s ease;
  }

  .pm-modal-tab:hover {
    color: #1a1a1a;
  }

  .pm-modal-tab.active {
    color: #1a1a1a;
    border-bottom-color: #1a1a1a;
  }

  .pm-modal-body {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    flex: 1;
    max-height: 400px;
  }

  .pm-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .pm-stat-card {
    background: #fafafa;
    border: 1px solid #f3f4f6;
    border-radius: 0.625rem;
    padding: 0.875rem;
    text-align: center;
  }

  .pm-stat-value {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .pm-stat-label {
    font-size: 0.6875rem;
    color: #6b7280;
    margin-top: 0.125rem;
  }

  .pm-section-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }

  .pm-account-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .pm-account-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0.875rem;
    background: #fafafa;
    border: 1px solid #f3f4f6;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pm-account-item:hover {
    background: #f3f4f6;
    border-color: #e5e7eb;
  }

  .pm-account-name {
    font-size: 0.8125rem;
    font-weight: 500;
    color: #1a1a1a;
  }

  .pm-account-plan {
    font-size: 0.625rem;
    font-weight: 500;
    text-transform: uppercase;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    background: #ede9fe;
    color: #5b21b6;
  }

  .pm-action-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .pm-action-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.625rem 0;
    border-bottom: 1px solid #f9fafb;
  }

  .pm-action-item:last-child {
    border-bottom: none;
  }

  .pm-action-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d1d5db;
    margin-top: 0.375rem;
    flex-shrink: 0;
  }

  .pm-action-dot.pm_assign { background: #3b82f6; }
  .pm-action-dot.status_change { background: #10b981; }
  .pm-action-dot.plan_change { background: #8b5cf6; }
  .pm-action-dot.info_update { background: #f59e0b; }
  .pm-action-dot.account_created { background: #06b6d4; }
  .pm-action-dot.account_approved { background: #10b981; }
  .pm-action-dot.contract_update { background: #ec4899; }

  .pm-action-content {
    flex: 1;
    min-width: 0;
  }

  .pm-action-desc {
    font-size: 0.8125rem;
    color: #1a1a1a;
  }

  .pm-action-meta {
    font-size: 0.6875rem;
    color: #9ca3af;
    margin-top: 0.125rem;
  }

  .pm-empty {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
    font-size: 0.8125rem;
  }

  .pm-loading {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
    font-size: 0.8125rem;
  }

  .acc-company-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .acc-company-row:hover .acc-company-actions {
    opacity: 1;
  }

  .acc-action-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    border: none;
    border-radius: 0.375rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .acc-action-btn:hover {
    background: #e5e7eb;
    color: #1a1a1a;
  }

  /* Grid View - same as dashboard */
  .acc-company-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .acc-company-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .acc-company-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .acc-card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .acc-card-badges {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .acc-card-stats {
    display: flex;
    gap: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f3f4f6;
  }

  .acc-card-stat {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .acc-card-stat strong {
    color: #1a1a1a;
  }

  /* Summary Section - same as dashboard */
  .acc-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .acc-summary-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
  }

  .acc-summary-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .acc-summary-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .acc-summary-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: #fafafa;
    border-radius: 0.5rem;
  }

  .acc-summary-item-label {
    font-size: 0.875rem;
    color: #374151;
  }

  .acc-summary-item-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .acc-activity-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #fafafa;
    border-radius: 0.5rem;
  }

  .acc-activity-dot {
    width: 0.5rem;
    height: 0.5rem;
    background: #1a1a1a;
    border-radius: 50%;
    margin-top: 0.375rem;
    flex-shrink: 0;
  }

  .acc-activity-content {
    flex: 1;
  }

  .acc-activity-text {
    font-size: 0.875rem;
    color: #374151;
  }

  .acc-activity-time {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.125rem;
  }

  /* Empty State */
  .acc-empty {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  .acc-empty-icon {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 1rem;
    color: #d1d5db;
  }

  /* Loading */
  .acc-loading {
    min-height: 100vh;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .acc-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid #e5e7eb;
    border-top-color: #1a1a1a;
    border-radius: 50%;
    animation: acc-spin 0.6s linear infinite;
  }

  @keyframes acc-spin {
    to { transform: rotate(360deg); }
  }

  .acc-loading-text {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.75rem;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .acc-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .acc-company-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .acc-summary-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .acc-stats-grid {
      grid-template-columns: 1fr;
    }
    .acc-company-grid {
      grid-template-columns: 1fr;
    }
    .acc-toolbar-inner {
      flex-direction: column;
      align-items: stretch;
    }
    .acc-search-container {
      max-width: 100%;
    }
    .acc-modal-body {
      width: 95%;
      max-height: 90vh;
    }
  }

  /* Modal */
  .acc-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: acc-fade-in 0.2s ease;
  }

  @keyframes acc-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .acc-modal-body {
    background: white;
    border-radius: 1rem;
    width: 540px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
    animation: acc-slide-up 0.25s ease;
  }

  @keyframes acc-slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .acc-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .acc-modal-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .acc-modal-badge {
    display: inline-flex;
    padding: 0.125rem 0.5rem;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: #fef3c7;
    color: #92400e;
    border-radius: 9999px;
  }

  .acc-modal-close {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    border: none;
    border-radius: 0.5rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .acc-modal-close:hover {
    background: #e5e7eb;
    color: #1a1a1a;
  }

  .acc-modal-content {
    padding: 1.5rem;
  }

  .acc-modal-progress {
    display: flex;
    gap: 0.375rem;
    margin-bottom: 1.5rem;
  }

  .acc-modal-progress-bar {
    flex: 1;
    height: 0.25rem;
    border-radius: 9999px;
    background: #e5e7eb;
    transition: background 0.3s ease;
  }

  .acc-modal-progress-bar.active {
    background: #1a1a1a;
  }

  .acc-modal-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1.25rem;
  }

  .acc-modal-field {
    margin-bottom: 1rem;
  }

  .acc-modal-label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.375rem;
  }

  .acc-modal-input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: #fafafa;
    transition: all 0.15s ease;
    box-sizing: border-box;
  }

  .acc-modal-input:focus {
    outline: none;
    border-color: #1a1a1a;
    background: white;
  }

  .acc-modal-input.error {
    border-color: #fca5a5;
  }

  .acc-modal-input.valid {
    border-color: #86efac;
  }

  .acc-modal-textarea {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: #fafafa;
    resize: none;
    transition: all 0.15s ease;
    box-sizing: border-box;
    line-height: 1.6;
  }

  .acc-modal-textarea:focus {
    outline: none;
    border-color: #1a1a1a;
    background: white;
  }

  .acc-modal-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .acc-modal-email-hint {
    font-size: 0.75rem;
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .acc-modal-email-hint.err {
    color: #ef4444;
  }

  .acc-modal-email-hint.ok {
    color: #16a34a;
  }

  .acc-modal-country-btn {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: #fafafa;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.15s ease;
  }

  .acc-modal-country-btn:hover {
    border-color: #d1d5db;
  }

  .acc-modal-country-list {
    position: absolute;
    z-index: 50;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 0.25rem;
    max-height: 200px;
    overflow-y: auto;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .acc-modal-country-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    font-size: 0.8125rem;
    text-align: left;
    cursor: pointer;
    transition: background 0.1s ease;
    color: #1a1a1a;
  }

  .acc-modal-country-option:hover {
    background: #f3f4f6;
  }

  .acc-modal-country-option.selected {
    background: #fef3c7;
  }

  .acc-modal-country-dial {
    margin-left: auto;
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .acc-modal-whatsapp-row {
    display: flex;
    gap: 0.5rem;
  }

  .acc-modal-dial-display {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.625rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: #f3f4f6;
    font-size: 0.8125rem;
    color: #6b7280;
    font-weight: 500;
    min-width: 85px;
    justify-content: center;
  }

  .acc-modal-btn {
    width: 100%;
    padding: 0.625rem 1rem;
    background: #1a1a1a;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-top: 0.5rem;
  }

  .acc-modal-btn:hover {
    background: #2d2d2d;
  }

  .acc-modal-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .acc-modal-btn-back {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8125rem;
    color: #9ca3af;
    background: transparent;
    border: none;
    cursor: pointer;
    margin-bottom: 1rem;
    transition: color 0.15s ease;
    padding: 0;
  }

  .acc-modal-btn-back:hover {
    color: #1a1a1a;
  }

  .acc-modal-error {
    padding: 0.625rem 0.875rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    color: #dc2626;
    margin-bottom: 1rem;
  }

  .acc-modal-summary {
    background: #fafafa;
    border: 1px solid #f3f4f6;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .acc-modal-summary-title {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin-bottom: 0.75rem;
  }

  .acc-modal-summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem 1.5rem;
  }

  .acc-modal-summary-label {
    font-size: 0.6875rem;
    color: #9ca3af;
  }

  .acc-modal-summary-value {
    font-size: 0.8125rem;
    font-weight: 500;
    color: #1a1a1a;
  }

  .acc-modal-hint {
    text-align: center;
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.75rem;
  }

  .acc-modal-success {
    text-align: center;
    padding: 1rem 0;
  }

  .acc-modal-success-icon {
    width: 3.5rem;
    height: 3.5rem;
    margin: 0 auto 1rem;
    background: #d1fae5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #059669;
  }

  .acc-modal-success h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.375rem;
  }

  .acc-modal-success p {
    font-size: 0.875rem;
    color: #6b7280;
  }
`;

// ============================================================================
// TYPES
// ============================================================================
interface Stats {
  total_companies: number;
  core: number;
  studio: number;
  pending: number;
  total_users: number;
}

interface CompanyItem {
  id: string;
  name: string;
  account_type: string;
  status: string;
  plan: string;
  contact_name: string;
  contact_email: string;
  created_at: string;
  user_count?: number;
  program_count?: number;
  assigned_pm_id?: string | null;
  assigned_pm_name?: string | null;
  logo_url?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function AccountsPage() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<Stats>({ total_companies: 0, core: 0, studio: 0, pending: 0, total_users: 0 });
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'trial'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // ── Modal state ──
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1=datos personales, 2=empresa/contacto, 3=tu idea, 4=confirmación
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalEmailError, setModalEmailError] = useState('');
  const [modalForm, setModalForm] = useState({ nombre: '', apellido: '', cargo: '', empresa: '', email: '', pais: '', whatsapp: '', idea: '' });
  const [modalCountry, setModalCountry] = useState<{ code: string; name: string; dial: string; phonePlaceholder: string } | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // ── PM Modal state ──
  const [pmModalOpen, setPmModalOpen] = useState(false);
  const [pmModalData, setPmModalData] = useState<any>(null);
  const [pmModalLoading, setPmModalLoading] = useState(false);
  const [pmModalTab, setPmModalTab] = useState<'resumen' | 'cuentas' | 'actividad'>('resumen');

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  // ── Countries & email validation ──
  const COUNTRIES = [
    { code: 'CL', name: 'Chile', dial: '+56', phonePlaceholder: '9 1234 5678' },
    { code: 'MX', name: 'México', dial: '+52', phonePlaceholder: '55 1234 5678' },
    { code: 'CO', name: 'Colombia', dial: '+57', phonePlaceholder: '300 123 4567' },
    { code: 'AR', name: 'Argentina', dial: '+54', phonePlaceholder: '11 1234 5678' },
    { code: 'PE', name: 'Perú', dial: '+51', phonePlaceholder: '912 345 678' },
    { code: 'EC', name: 'Ecuador', dial: '+593', phonePlaceholder: '99 123 4567' },
    { code: 'BR', name: 'Brasil', dial: '+55', phonePlaceholder: '11 91234 5678' },
    { code: 'UY', name: 'Uruguay', dial: '+598', phonePlaceholder: '91 234 567' },
    { code: 'ES', name: 'España', dial: '+34', phonePlaceholder: '612 345 678' },
    { code: 'US', name: 'Estados Unidos', dial: '+1', phonePlaceholder: '(555) 123-4567' },
  ];
  const BLOCKED_DOMAINS = ['gmail.com','hotmail.com','hotmail.es','outlook.com','outlook.es','yahoo.com','yahoo.es','live.com','icloud.com','me.com','mac.com','protonmail.com','proton.me','mail.com','zoho.com','aol.com'];

  const validateCorporateEmail = (email: string) => {
    if (!email.includes('@')) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    return domain ? !BLOCKED_DOMAINS.includes(domain) : false;
  };

  const handleModalEmailChange = (email: string) => {
    setModalForm({ ...modalForm, email });
    if (email && email.includes('@')) {
      const domain = email.split('@')[1]?.toLowerCase();
      if (domain && BLOCKED_DOMAINS.includes(domain)) {
        setModalEmailError('Ingresa un email corporativo. No se aceptan correos personales.');
      } else {
        setModalEmailError('');
      }
    } else {
      setModalEmailError('');
    }
  };

  const resetStudioModal = () => {
    setShowModal(false);
    setModalStep(1);
    setModalLoading(false);
    setModalError('');
    setModalEmailError('');
    setCountryDropdownOpen(false);
    setModalForm({ nombre: '', apellido: '', cargo: '', empresa: '', email: '', pais: '', whatsapp: '', idea: '' });
    setModalCountry(null);
  };

  const normalizeBackendError = (detail: unknown) => {
    const raw = typeof detail === 'string' ? detail : 'Error al crear la cuenta';
    const low = raw.toLowerCase();
    if (low.includes('unique') || low.includes('already exists') || low.includes('ya existe') || low.includes('email')) {
      return 'Ya existe un usuario con ese email. Usa otro correo corporativo.';
    }
    return raw;
  };

  const handleModalSubmit = async () => {
    setModalError('');
    setModalLoading(true);
    try {
      const fullWhatsapp = modalCountry ? `${modalCountry.dial} ${modalForm.whatsapp}` : modalForm.whatsapp;
      const submitData = { ...modalForm, whatsapp: fullWhatsapp };

      // 1) Crea empresa Studio
      const registerRes = await apiFetch(`${API}/api/companies/auth/register-studio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      const registerData = await registerRes.json().catch(() => ({}));
      if (!registerRes.ok || !registerData?.company?.id) {
        throw new Error(normalizeBackendError(registerData?.detail || 'No se pudo crear la empresa Studio'));
      }

      // 2) Crea usuario admin + cuenta Studio (activa, sin revisión manual)
      const adminName = `${modalForm.nombre} ${modalForm.apellido}`.trim();
      const createRes = await apiFetch(`${API}/api/companies/solicitudes/${registerData.company.id}/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_name: adminName,
          admin_email: modalForm.email,
          admin_position: modalForm.cargo || 'Administrador de Programa',
        }),
      });
      const accountData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(normalizeBackendError(accountData?.detail || 'No se pudo crear el usuario administrador'));
      }

      // 3) Enviar credenciales por correo
      const baseUrl = window.location.origin;
      await apiFetch('/api/studio-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_name: adminName,
          admin_email: modalForm.email,
          company_name: modalForm.empresa,
          generated_password: accountData.generated_password,
          access_hash: accountData.access_hash,
          corp_id: accountData.corp_id || registerData.company.corp_id || '',
          plan: accountData.plan || registerData.company.plan || 'trial',
          login_url: `${baseUrl}/login`,
          dashboard_url: `${baseUrl}/studio/${registerData.company.slug || 'studio'}/dashboard`,
        }),
      });

      setModalStep(4);
      // Refresh companies list
      try {
        const res = await apiFetch(`${API}/api/companies/`);
        if (res.ok) {
          const all = await res.json();
          setCompanies(all.filter((c: CompanyItem) => c.status !== 'pending' && c.account_type === 'studio'));
        }
        const sRes = await apiFetch(`${API}/api/companies/stats`);
        if (sRes.ok) setStats(await sRes.json());
      } catch { /* ignore */ }
    } catch (err: any) {
      setModalError(err?.message || 'Error de conexión. Intenta nuevamente.');
    } finally {
      setModalLoading(false);
    }
  };

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fetch data ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, companiesRes] = await Promise.all([
          apiFetch(`${API}/api/companies/stats`),
          apiFetch(`${API}/api/companies/`),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (companiesRes.ok) {
          const all = await companiesRes.json();
          setCompanies(all.filter((c: CompanyItem) => c.status !== 'pending' && c.account_type === 'studio'));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Keyboard shortcut: Cmd+K to focus search ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Filtering & Sorting ──
  const filteredCompanies = companies
    .filter(c => {
      if (filter === 'all') return true;
      return c.status === filter;
    })
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.contact_email?.toLowerCase().includes(q) || c.contact_name?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // ── Helpers ──
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="acc-badge acc-badge-active">{Icons.check} Activa</span>;
      case 'trial':
        return <span className="acc-badge acc-badge-trial">{Icons.clock} Trial</span>;
      default:
        return <span className="acc-badge acc-badge-inactive">{Icons.pause} Inactiva</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    const isStudio = type === 'studio';
    return (
      <span className={`acc-badge ${isStudio ? 'acc-badge-type-studio' : 'acc-badge-type-core'}`}>
        {isStudio ? 'Studio' : 'Core'}
      </span>
    );
  };

  const planLabel = (p: string) => {
    const map: Record<string, string> = { trial: 'Trial', starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' };
    return map[p] || p || '—';
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
    if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
    return `hace ${Math.floor(diffDays / 365)} años`;
  };

  const getInitials = (name: string) => (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // ── PM modal handler ──
  const openPmModal = async (pmId: string) => {
    setPmModalOpen(true);
    setPmModalLoading(true);
    setPmModalTab('resumen');
    try {
      const res = await apiFetch(`${API}/api/companies/pm/${pmId}/activity`);
      if (res.ok) {
        setPmModalData(await res.json());
      }
    } catch { /* ignore */ }
    setPmModalLoading(false);
  };

  const pmTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
    return `hace ${Math.floor(diffDays / 30)} meses`;
  };

  const changeTypeLabel: Record<string, string> = {
    status_change: 'Cambio de Estado',
    plan_change: 'Cambio de Plan',
    pm_assign: 'Asignación PM',
    info_update: 'Datos Actualizados',
    account_created: 'Cuenta Creada',
    account_approved: 'Solicitud Aprobada',
    contract_update: 'Contrato',
  };

  // Plan summary for summary card
  const planSummary = [
    { label: 'Enterprise', count: companies.filter(c => c.plan === 'enterprise').length },
    { label: 'Growth', count: companies.filter(c => c.plan === 'growth').length },
    { label: 'Starter', count: companies.filter(c => c.plan === 'starter').length },
    { label: 'Trial', count: companies.filter(c => c.plan === 'trial').length },
  ];

  // Recent activity from last companies
  const recentActivity = companies.slice(0, 5).map(c => ({
    text: `${c.name} — cuenta ${c.status === 'active' ? 'activa' : c.status}`,
    time: c.created_at ? new Date(c.created_at).toLocaleDateString('es-CL') : 'Reciente',
  }));

  // ── Loading state ──
  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="acc-loading">
          <div style={{ textAlign: 'center' }}>
            <div className="acc-spinner" />
            <p className="acc-loading-text">Cargando cuentas...</p>
          </div>
        </div>
      </>
    );
  }

  // ── Render ──
  return (
    <>
      <style>{styles}</style>
      <div className="acc-container">
        {/* Header */}
        <div className="acc-header">
          <div>
            <div className="acc-eyebrow"><span className="acc-eyebrow-dot" /> Gestión</div>
            <h1 className="acc-title">
              Cuentas Studio
              <span className="acc-title-badge">{stats.studio}</span>
            </h1>
            <p className="acc-subtitle">Gestión de clientes y suscripciones</p>
          </div>
          <button className="acc-btn-primary" onClick={() => { resetStudioModal(); setShowModal(true); }}>
            {Icons.plus}
            Nueva Cuenta
          </button>
        </div>

        {/* Stats */}
        <div className="acc-stats-grid">
          <div className="acc-stat-card">
            <div className="acc-stat-label">Cuentas Studio</div>
            <div className="acc-stat-value">{stats.studio}</div>
            <div className="acc-stat-sub">full service</div>
          </div>
          <div className="acc-stat-card">
            <div className="acc-stat-label">Activas</div>
            <div className="acc-stat-value">{companies.filter(c => c.status === 'active').length}</div>
            <div className="acc-stat-sub">operativas</div>
          </div>
          <div className="acc-stat-card">
            <div className="acc-stat-label">En Prueba</div>
            <div className="acc-stat-value">{companies.filter(c => c.status === 'trial').length}</div>
            <div className="acc-stat-sub">trial activo</div>
          </div>
          <div className="acc-stat-card">
            <div className="acc-stat-label">Usuarios</div>
            <div className="acc-stat-value">{stats.total_users}</div>
            <div className="acc-stat-sub">registrados</div>
          </div>
        </div>

        {/* Solicitudes Banner */}
        {stats.pending > 0 && (
          <div className="acc-solicitudes" onClick={() => router.push('/dashboard/accounts/solicitudes')}>
            <div className="acc-solicitudes-icon">
              {Icons.inbox}
              <span className="acc-solicitudes-badge">{stats.pending}</span>
            </div>
            <div className="acc-solicitudes-info">
              <div className="acc-solicitudes-title">
                {stats.pending} {stats.pending === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
              </div>
              <div className="acc-solicitudes-desc">Nuevas solicitudes Studio requieren tu aprobación</div>
            </div>
            <div className="acc-solicitudes-arrow">{Icons.arrow}</div>
          </div>
        )}

        {/* Toolbar */}
        <div className="acc-toolbar">
          <div className="acc-toolbar-inner">
            <div className="acc-search-container">
              <span className="acc-search-icon">{Icons.search}</span>
              <input
                ref={searchRef}
                type="text"
                className="acc-search-input"
                placeholder="Buscar empresa, contacto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="acc-kbd">⌘K</span>
            </div>

            <div className="acc-filter-tabs">
              {([
                { key: 'all' as const, label: 'Todas' },
                { key: 'active' as const, label: 'Activas' },
                { key: 'trial' as const, label: 'Trial' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  className={`acc-filter-tab ${filter === tab.key ? 'active' : ''}`}
                  onClick={() => setFilter(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              className="acc-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'name' | 'date' | 'status')}
            >
              <option value="date">Más recientes</option>
              <option value="name">Nombre A-Z</option>
              <option value="status">Estado</option>
            </select>

            <div className="acc-view-toggle">
              <button
                className={`acc-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Vista lista"
              >
                {Icons.list}
              </button>
              <button
                className={`acc-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vista grid"
              >
                {Icons.grid}
              </button>
            </div>

            {stats.pending === 0 && (
              <button className="acc-solicitudes-link" onClick={() => router.push('/dashboard/accounts/solicitudes')}>
                {Icons.inbox}
                Solicitudes
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="acc-results">
          {filteredCompanies.length} {filteredCompanies.length === 1 ? 'resultado' : 'resultados'}
          {search && <span> para &ldquo;{search}&rdquo;</span>}
        </div>

        {/* Company List View */}
        {viewMode === 'list' ? (
          <div className="acc-company-list">
            {filteredCompanies.map(company => (
              <div
                key={company.id}
                className="acc-company-row"
                onClick={() => router.push(`/dashboard/accounts/${company.id}`)}
              >
                <div className="acc-company-avatar" style={company.logo_url ? { padding: 0, overflow: 'hidden' } : {}}>
                  {company.logo_url ? <img src={company.logo_url} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(company.name)}
                </div>
                <div className="acc-company-info">
                  <div className="acc-company-name">{company.name}</div>
                  <div className="acc-company-meta">
                    {company.contact_email && (
                      <>
                        <span className="acc-company-meta-icon">{Icons.mail}</span>
                        <span>{company.contact_email}</span>
                      </>
                    )}
                    {!company.contact_email && company.contact_name && (
                      <span>{company.contact_name}</span>
                    )}
                  </div>
                </div>
                <span className="acc-badge acc-badge-plan">{planLabel(company.plan)}</span>
                {getStatusBadge(company.status)}
                {company.assigned_pm_name ? (
                  <span
                    className="acc-pm-badge assigned"
                    title={`PM: ${company.assigned_pm_name}`}
                    onClick={(e) => { e.stopPropagation(); openPmModal(company.assigned_pm_id!); }}
                  >
                    <span className="acc-pm-dot on" />
                    {company.assigned_pm_name.split(' ')[0]}
                  </span>
                ) : (
                  <span className="acc-pm-badge unassigned">
                    <span className="acc-pm-dot off" />
                    Sin PM
                  </span>
                )}
                <div className="acc-company-date" title={new Date(company.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}>
                  {timeAgo(company.created_at)}
                </div>
                <div className="acc-company-actions">
                  <button className="acc-action-btn" title="Ver detalles" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/accounts/${company.id}`); }}>
                    {Icons.eye}
                  </button>
                  <button className="acc-action-btn" title="Editar" onClick={(e) => { e.stopPropagation(); }}>
                    {Icons.edit}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Company Grid View */
          <div className="acc-company-grid">
            {filteredCompanies.map(company => (
              <div
                key={company.id}
                className="acc-company-card"
                onClick={() => router.push(`/dashboard/accounts/${company.id}`)}
              >
                <div className="acc-card-header">
                  <div className="acc-company-avatar" style={company.logo_url ? { padding: 0, overflow: 'hidden' } : {}}>
                    {company.logo_url ? <img src={company.logo_url} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(company.name)}
                  </div>
                  <div className="acc-company-info">
                    <div className="acc-company-name">{company.name}</div>
                    <div className="acc-company-meta">
                      <span>{timeAgo(company.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="acc-card-badges">
                  <span className="acc-badge acc-badge-plan">{planLabel(company.plan)}</span>
                  {getStatusBadge(company.status)}
                  {company.assigned_pm_name ? (
                    <span
                      className="acc-pm-badge assigned"
                      onClick={(e) => { e.stopPropagation(); openPmModal(company.assigned_pm_id!); }}
                    >
                      <span className="acc-pm-dot on" />
                      {company.assigned_pm_name.split(' ')[0]}
                    </span>
                  ) : (
                    <span className="acc-pm-badge unassigned">
                      <span className="acc-pm-dot off" />
                      Sin PM
                    </span>
                  )}
                </div>
                <div className="acc-card-stats">
                  <div className="acc-card-stat">
                    <strong>{company.contact_email || '—'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredCompanies.length === 0 && (
          <div className="acc-empty">
            <div className="acc-empty-icon">{Icons.building}</div>
            <p>No se encontraron cuentas</p>
            {search && <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Intenta con otro término de búsqueda</p>}
          </div>
        )}

        {/* Summary Section */}
        <div className="acc-summary-grid">
          <div className="acc-summary-card">
            <div className="acc-summary-title">
              {Icons.program}
              Por Plan
            </div>
            <div className="acc-summary-list">
              {planSummary.map(plan => (
                <div key={plan.label} className="acc-summary-item">
                  <span className="acc-summary-item-label">{plan.label}</span>
                  <span className="acc-summary-item-value">{plan.count} cuentas</span>
                </div>
              ))}
            </div>
          </div>

          <div className="acc-summary-card">
            <div className="acc-summary-title">
              {Icons.activity}
              Actividad Reciente
            </div>
            <div className="acc-summary-list">
              {recentActivity.map((activity, index) => (
                <div key={index} className="acc-activity-item">
                  <div className="acc-activity-dot" />
                  <div className="acc-activity-content">
                    <div className="acc-activity-text">{activity.text}</div>
                    <div className="acc-activity-time">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODAL: Nueva Cuenta Studio ═══ */}
      {showModal && (() => {
        const inp: React.CSSProperties = { width:'100%', padding:'0.55rem 0.8rem', border:'1.5px solid #ebebeb', borderRadius:10, fontSize:'0.82rem', background:'#fafafa', color:'#0f0f0f', outline:'none', boxSizing:'border-box' as const, transition:'border 0.15s, background 0.15s', fontFamily:'inherit' };
        const lbl: React.CSSProperties = { display:'block', fontSize:'0.72rem', fontWeight:600, color:'#888', marginBottom:'0.4rem' };
        const field: React.CSSProperties = { display:'flex', flexDirection:'column' as const, gap:0 };
        const steps = ['Contacto', 'Empresa', 'Programa'];
        return (
        <div
          style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)', padding:'1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) resetStudioModal(); }}
        >
          <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(14px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}} @keyframes spin2{to{transform:rotate(360deg)}}`}</style>
          <div style={{ background:'#fff', borderRadius:22, boxShadow:'0 32px 72px rgba(0,0,0,0.18)', width:'100%', maxWidth:530, maxHeight:'92vh', overflowY:'auto', animation:'modalIn 0.22s ease' }}>

            {/* ── Header ── */}
            <div style={{ padding:'1.5rem 1.5rem 1rem', borderBottom:'1px solid #f0f0f0' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'#b08a00', marginBottom:'0.15rem' }}>Nueva cuenta</div>
                  <h2 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f0f0f', letterSpacing:'-0.01em', margin:0, display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    Cuenta Studio
                    <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'0.15rem 0.5rem', background:'rgba(245,200,0,0.15)', color:'#7a5900', borderRadius:999, border:'1px solid rgba(245,200,0,0.3)', letterSpacing:'0.05em', textTransform:'uppercase' as const }}>Studio</span>
                  </h2>
                </div>
                <button onClick={resetStudioModal} style={{ width:32, height:32, borderRadius:8, border:'1px solid #ebebeb', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#999', flexShrink:0 }}>
                  <svg style={{ width:13, height:13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Step indicators */}
              {modalStep < 4 && (
                <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', marginTop:'1.1rem' }}>
                  {steps.map((s, i) => {
                    const n = i + 1;
                    const done = modalStep > n;
                    const active = modalStep === n;
                    return (
                      <div key={n} style={{ display:'flex', alignItems:'center', gap:'0.35rem', flex: i < 2 ? 1 : 'none' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexShrink:0 }}>
                          <div style={{ width:24, height:24, borderRadius:'50%', background: done ? '#22c55e' : active ? '#0f0f0f' : '#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
                            {done ? (
                              <svg style={{ width:11, height:11, color:'#fff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            ) : (
                              <span style={{ fontSize:'0.65rem', fontWeight:700, color: active ? '#fff' : '#bbb' }}>{n}</span>
                            )}
                          </div>
                          <span style={{ fontSize:'0.72rem', fontWeight: active ? 700 : 500, color: active ? '#0f0f0f' : done ? '#22c55e' : '#bbb', transition:'color 0.2s' }}>{s}</span>
                        </div>
                        {i < 2 && <div style={{ flex:1, height:1, background: done ? '#22c55e' : '#ebebeb', transition:'background 0.3s' }} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Body ── */}
            <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column' as const, gap:'1.1rem' }}>

              {/* Error */}
              {modalError && (
                <div style={{ padding:'0.7rem 0.9rem', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, fontSize:'0.8rem', color:'#dc2626', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <svg style={{ width:14, height:14, flexShrink:0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {modalError}
                </div>
              )}

              {/* ── Step 1 ── */}
              {modalStep === 1 && (
                <>
                  <p style={{ fontSize:'0.78rem', color:'#aaa', margin:0 }}>Datos del contacto principal de la empresa cliente.</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                    <div style={field}>
                      <label style={lbl}>Nombre <span style={{ color:'#F5C800' }}>*</span></label>
                      <input style={inp} placeholder="Ana" value={modalForm.nombre} onChange={e => setModalForm({ ...modalForm, nombre: e.target.value })}
                        onFocus={e => { e.target.style.borderColor='#0f0f0f'; e.target.style.background='#fff'; }}
                        onBlur={e => { e.target.style.borderColor='#ebebeb'; e.target.style.background='#fafafa'; }} />
                    </div>
                    <div style={field}>
                      <label style={lbl}>Apellido <span style={{ color:'#F5C800' }}>*</span></label>
                      <input style={inp} placeholder="García" value={modalForm.apellido} onChange={e => setModalForm({ ...modalForm, apellido: e.target.value })}
                        onFocus={e => { e.target.style.borderColor='#0f0f0f'; e.target.style.background='#fff'; }}
                        onBlur={e => { e.target.style.borderColor='#ebebeb'; e.target.style.background='#fafafa'; }} />
                    </div>
                  </div>
                  <div style={field}>
                    <label style={lbl}>Cargo <span style={{ color:'#F5C800' }}>*</span></label>
                    <input style={inp} placeholder="Gerente de RRHH, Director de Personas..." value={modalForm.cargo} onChange={e => setModalForm({ ...modalForm, cargo: e.target.value })}
                      onFocus={e => { e.target.style.borderColor='#0f0f0f'; e.target.style.background='#fff'; }}
                      onBlur={e => { e.target.style.borderColor='#ebebeb'; e.target.style.background='#fafafa'; }} />
                  </div>
                  <button
                    disabled={!modalForm.nombre || !modalForm.apellido || !modalForm.cargo}
                    onClick={() => setModalStep(2)}
                    style={{ width:'100%', padding:'0.65rem', fontSize:'0.82rem', fontWeight:700, color:'#fff', background: (!modalForm.nombre || !modalForm.apellido || !modalForm.cargo) ? '#ccc' : '#0f0f0f', border:'none', borderRadius:12, cursor: (!modalForm.nombre || !modalForm.apellido || !modalForm.cargo) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', transition:'background 0.15s' }}>
                    Continuar
                    <svg style={{ width:13, height:13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </>
              )}

              {/* ── Step 2 ── */}
              {modalStep === 2 && (
                <>
                  <button onClick={() => setModalStep(1)} style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'0.75rem', color:'#aaa', background:'none', border:'none', cursor:'pointer', padding:0, width:'fit-content' }}>
                    <svg style={{ width:12, height:12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    Volver
                  </button>
                  <p style={{ fontSize:'0.78rem', color:'#aaa', margin:0 }}>Información de la empresa que será dada de alta.</p>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                    <div style={{ ...field, gridColumn:'1 / -1' }}>
                      <label style={lbl}>Empresa <span style={{ color:'#F5C800' }}>*</span></label>
                      <input style={inp} placeholder="Empresa S.A." value={modalForm.empresa} onChange={e => setModalForm({ ...modalForm, empresa: e.target.value })}
                        onFocus={e => { e.target.style.borderColor='#0f0f0f'; e.target.style.background='#fff'; }}
                        onBlur={e => { e.target.style.borderColor='#ebebeb'; e.target.style.background='#fafafa'; }} />
                    </div>
                    <div style={{ ...field, gridColumn:'1 / -1' }}>
                      <label style={lbl}>Email corporativo <span style={{ color:'#F5C800' }}>*</span></label>
                      <input
                        style={{ ...inp, borderColor: modalEmailError ? '#fca5a5' : (!modalEmailError && modalForm.email && modalForm.email.includes('@') && modalForm.email.split('@')[1]?.length > 2) ? '#86efac' : '#ebebeb' }}
                        placeholder="contacto@empresa.com" type="email"
                        value={modalForm.email} onChange={e => handleModalEmailChange(e.target.value)}
                        onFocus={e => { e.target.style.background='#fff'; }}
                        onBlur={e => { e.target.style.background='#fafafa'; }} />
                      {modalEmailError && <span style={{ fontSize:'0.7rem', color:'#ef4444', marginTop:'0.25rem' }}>{modalEmailError}</span>}
                      {!modalEmailError && modalForm.email && modalForm.email.includes('@') && modalForm.email.split('@')[1]?.length > 2 && (
                        <span style={{ fontSize:'0.7rem', color:'#16a34a', marginTop:'0.25rem', display:'flex', alignItems:'center', gap:'0.25rem' }}>
                          <svg style={{ width:10, height:10 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          Email corporativo válido
                        </span>
                      )}
                    </div>
                  </div>

                  {/* País */}
                  <div style={field} ref={countryDropdownRef}>
                    <label style={lbl}>País <span style={{ color:'#F5C800' }}>*</span></label>
                    <div style={{ position:'relative' }}>
                      <button type="button" onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                        style={{ ...inp, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', textAlign:'left' as const }}>
                        <span style={{ color: modalCountry ? '#0f0f0f' : '#aaa' }}>{modalCountry ? modalCountry.name : 'Selecciona tu país'}</span>
                        <svg style={{ width:14, height:14, color:'#aaa', transform: countryDropdownOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.15s', flexShrink:0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                      </button>
                      {countryDropdownOpen && (
                        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'1px solid #ebebeb', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', zIndex:100, maxHeight:200, overflowY:'auto' as const }}>
                          {COUNTRIES.map(c => (
                            <button key={c.code} type="button"
                              onClick={() => { setModalCountry(c); setModalForm({ ...modalForm, pais: c.name, whatsapp: '' }); setCountryDropdownOpen(false); }}
                              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'0.55rem 0.85rem', border:'none', background: modalCountry?.code === c.code ? 'rgba(245,200,0,0.1)' : 'transparent', fontSize:'0.82rem', cursor:'pointer', color:'#0f0f0f', textAlign:'left' as const }}>
                              <span>{c.name}</span>
                              <span style={{ fontSize:'0.72rem', color:'#aaa' }}>{c.dial}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div style={field}>
                    <label style={lbl}>WhatsApp <span style={{ color:'#F5C800' }}>*</span></label>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <div style={{ padding:'0.55rem 0.75rem', border:'1.5px solid #ebebeb', borderRadius:10, background:'#f5f5f5', fontSize:'0.82rem', color:'#555', fontWeight:600, minWidth:70, textAlign:'center' as const, flexShrink:0 }}>
                        {modalCountry ? modalCountry.dial : '+--'}
                      </div>
                      <input style={{ ...inp, flex:1 }}
                        placeholder={modalCountry?.phonePlaceholder || 'Selecciona un país primero'}
                        value={modalForm.whatsapp}
                        onChange={e => setModalForm({ ...modalForm, whatsapp: e.target.value.replace(/[^0-9\s]/g, '') })}
                        disabled={!modalCountry}
                        onFocus={e => { e.target.style.borderColor='#0f0f0f'; e.target.style.background='#fff'; }}
                        onBlur={e => { e.target.style.borderColor='#ebebeb'; e.target.style.background='#fafafa'; }} />
                    </div>
                  </div>

                  <button
                    disabled={!modalForm.empresa || !modalForm.email || !modalCountry || !modalForm.whatsapp || !!modalEmailError || !validateCorporateEmail(modalForm.email)}
                    onClick={() => setModalStep(3)}
                    style={{ width:'100%', padding:'0.65rem', fontSize:'0.82rem', fontWeight:700, color:'#fff', background: (!modalForm.empresa || !modalForm.email || !modalCountry || !modalForm.whatsapp || !!modalEmailError || !validateCorporateEmail(modalForm.email)) ? '#ccc' : '#0f0f0f', border:'none', borderRadius:12, cursor: (!modalForm.empresa || !modalForm.email || !modalCountry || !modalForm.whatsapp || !!modalEmailError || !validateCorporateEmail(modalForm.email)) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', transition:'background 0.15s' }}>
                    Continuar
                    <svg style={{ width:13, height:13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </>
              )}

              {/* ── Step 3 ── */}
              {modalStep === 3 && (
                <>
                  <button onClick={() => setModalStep(2)} style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'0.75rem', color:'#aaa', background:'none', border:'none', cursor:'pointer', padding:0, width:'fit-content' }}>
                    <svg style={{ width:12, height:12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    Volver
                  </button>
                  <div style={field}>
                    <label style={lbl}>¿Qué programa necesita? <span style={{ color:'#F5C800' }}>*</span></label>
                    <textarea
                      rows={4}
                      placeholder="Ej: Queremos implementar un programa de mentoría para nuestros líderes..."
                      value={modalForm.idea}
                      onChange={e => setModalForm({ ...modalForm, idea: e.target.value })}
                      style={{ ...inp, resize:'vertical' as const, lineHeight:1.6 }}
                      onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor='#0f0f0f'; (e.target as HTMLTextAreaElement).style.background='#fff'; }}
                      onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor='#ebebeb'; (e.target as HTMLTextAreaElement).style.background='#fafafa'; }}
                    />
                  </div>

                  {/* Summary */}
                  <div style={{ background:'#fafafa', border:'1px solid #ebebeb', borderRadius:14, padding:'1rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem 1rem' }}>
                    <div style={{ gridColumn:'1 / -1', fontSize:'0.68rem', fontWeight:700, color:'#aaa', textTransform:'uppercase' as const, letterSpacing:'0.07em', marginBottom:'0.25rem' }}>Resumen</div>
                    {[
                      ['Contacto', `${modalForm.nombre} ${modalForm.apellido}`],
                      ['Cargo',    modalForm.cargo],
                      ['Empresa',  modalForm.empresa],
                      ['Email',    modalForm.email],
                      ['País',     modalForm.pais],
                      ['WhatsApp', `${modalCountry?.dial ?? ''} ${modalForm.whatsapp}`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize:'0.68rem', color:'#bbb', marginBottom:'0.1rem' }}>{k}</div>
                        <div style={{ fontSize:'0.8rem', fontWeight:600, color:'#0f0f0f', wordBreak:'break-word' as const }}>{v || '—'}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'flex', flexDirection:'column' as const, gap:'0.5rem' }}>
                    <button
                      disabled={modalLoading || !modalForm.idea}
                      onClick={handleModalSubmit}
                      style={{ width:'100%', padding:'0.65rem', fontSize:'0.82rem', fontWeight:700, color:'#fff', background: (modalLoading || !modalForm.idea) ? '#ccc' : '#0f0f0f', border:'none', borderRadius:12, cursor: (modalLoading || !modalForm.idea) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', transition:'background 0.15s' }}>
                      {modalLoading ? (
                        <>
                          <svg style={{ width:14, height:14, animation:'spin2 0.7s linear infinite' }} viewBox="0 0 24 24"><circle style={{ opacity:0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path style={{ opacity:0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          Creando cuenta...
                        </>
                      ) : (
                        <>
                          <svg style={{ width:13, height:13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                          Crear Cuenta Studio
                        </>
                      )}
                    </button>
                    <p style={{ textAlign:'center' as const, fontSize:'0.7rem', color:'#bbb', margin:0 }}>Un PM contactará al cliente en menos de 24 horas</p>
                  </div>
                </>
              )}

              {/* ── Step 4: Éxito ── */}
              {modalStep === 4 && (
                <div style={{ textAlign:'center' as const, padding:'1rem 0' }}>
                  <div style={{ width:56, height:56, borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                    <svg style={{ width:26, height:26, color:'#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f0f0f', marginBottom:'0.35rem' }}>¡Cuenta creada!</h3>
                  <p style={{ fontSize:'0.82rem', color:'#888', marginBottom:'1.5rem' }}>Se notificará al PM para contactar a <strong style={{ color:'#0f0f0f' }}>{modalForm.empresa}</strong></p>

                  <div style={{ background:'#fafafa', border:'1px solid #ebebeb', borderRadius:14, padding:'1rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem 1rem', textAlign:'left' as const, marginBottom:'1.25rem' }}>
                    {[
                      ['Contacto', `${modalForm.nombre} ${modalForm.apellido}`],
                      ['Empresa',  modalForm.empresa],
                      ['Email',    modalForm.email],
                      ['WhatsApp', `${modalCountry?.dial ?? ''} ${modalForm.whatsapp}`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize:'0.68rem', color:'#bbb', marginBottom:'0.1rem' }}>{k}</div>
                        <div style={{ fontSize:'0.8rem', fontWeight:600, color:'#0f0f0f' }}>{v || '—'}</div>
                      </div>
                    ))}
                  </div>

                  <button onClick={resetStudioModal}
                    style={{ width:'100%', padding:'0.65rem', fontSize:'0.82rem', fontWeight:700, color:'#fff', background:'#0f0f0f', border:'none', borderRadius:12, cursor:'pointer' }}>
                    Cerrar
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
        );
      })()}

      {/* ═══ MODAL: PM Detail ═══ */}
      {pmModalOpen && (
        <div className="pm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setPmModalOpen(false); setPmModalData(null); } }}>
          <div className="pm-modal">
            <div className="pm-modal-header">
              <div className="pm-modal-title">Project Manager</div>
              <button className="pm-modal-close" onClick={() => { setPmModalOpen(false); setPmModalData(null); }}>✕</button>
            </div>

            {pmModalLoading ? (
              <div className="pm-loading">Cargando información del PM...</div>
            ) : pmModalData ? (
              <>
                {/* Profile Card */}
                <div className="pm-modal-profile">
                  <div className="pm-modal-avatar">
                    {pmModalData.profile.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="pm-modal-info">
                    <div className="pm-modal-name">{pmModalData.profile.full_name}</div>
                    <div className="pm-modal-role">{pmModalData.profile.position || pmModalData.profile.role}</div>
                    <div className="pm-modal-contact">
                      {pmModalData.profile.email && (
                        <span className="pm-modal-contact-item">
                          {Icons.mail}
                          {pmModalData.profile.email}
                        </span>
                      )}
                      {pmModalData.profile.phone && (
                        <span className="pm-modal-contact-item">
                          📞 {pmModalData.profile.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="pm-modal-tabs">
                  <button className={`pm-modal-tab ${pmModalTab === 'resumen' ? 'active' : ''}`} onClick={() => setPmModalTab('resumen')}>Resumen</button>
                  <button className={`pm-modal-tab ${pmModalTab === 'cuentas' ? 'active' : ''}`} onClick={() => setPmModalTab('cuentas')}>Cuentas ({pmModalData.total_managed})</button>
                  <button className={`pm-modal-tab ${pmModalTab === 'actividad' ? 'active' : ''}`} onClick={() => setPmModalTab('actividad')}>Actividad ({pmModalData.total_actions})</button>
                </div>

                {/* Tab Content */}
                <div className="pm-modal-body">
                  {pmModalTab === 'resumen' && (
                    <>
                      <div className="pm-stats-grid">
                        <div className="pm-stat-card">
                          <div className="pm-stat-value">{pmModalData.total_managed}</div>
                          <div className="pm-stat-label">Cuentas</div>
                        </div>
                        <div className="pm-stat-card">
                          <div className="pm-stat-value">{pmModalData.total_actions}</div>
                          <div className="pm-stat-label">Acciones</div>
                        </div>
                        <div className="pm-stat-card">
                          <div className="pm-stat-value" style={{ fontSize: '0.875rem' }}>{pmTimeAgo(pmModalData.profile.last_login_at)}</div>
                          <div className="pm-stat-label">Último acceso</div>
                        </div>
                      </div>

                      <div className="pm-section-title">Información</div>
                      <div className="pm-account-list">
                        <div className="pm-account-item" style={{ cursor: 'default' }}>
                          <span className="pm-account-name">Departamento</span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{pmModalData.profile.department || '—'}</span>
                        </div>
                        <div className="pm-account-item" style={{ cursor: 'default' }}>
                          <span className="pm-account-name">Rol</span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{pmModalData.profile.role}</span>
                        </div>
                        <div className="pm-account-item" style={{ cursor: 'default' }}>
                          <span className="pm-account-name">Se unió</span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{pmModalData.profile.date_joined ? new Date(pmModalData.profile.date_joined).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                        </div>
                        <div className="pm-account-item" style={{ cursor: 'default' }}>
                          <span className="pm-account-name">Último login</span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{pmModalData.profile.last_login_at ? new Date(pmModalData.profile.last_login_at).toLocaleString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Nunca'}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {pmModalTab === 'cuentas' && (
                    <>
                      {pmModalData.managed_accounts.length > 0 ? (
                        <div className="pm-account-list">
                          {pmModalData.managed_accounts.map((acc: any) => (
                            <div
                              key={acc.id}
                              className="pm-account-item"
                              onClick={() => { setPmModalOpen(false); setPmModalData(null); router.push(`/dashboard/accounts/${acc.id}`); }}
                            >
                              <span className="pm-account-name">{acc.name}</span>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span className="pm-account-plan">{acc.plan}</span>
                                <span className={`acc-badge ${acc.status === 'active' ? 'acc-badge-active' : acc.status === 'trial' ? 'acc-badge-trial' : 'acc-badge-inactive'}`} style={{ fontSize: '0.5625rem' }}>
                                  {acc.status === 'active' ? 'Activa' : acc.status === 'trial' ? 'Trial' : acc.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pm-empty">Sin cuentas asignadas</div>
                      )}
                    </>
                  )}

                  {pmModalTab === 'actividad' && (
                    <>
                      {pmModalData.actions.length > 0 ? (
                        <div className="pm-action-list">
                          {pmModalData.actions.map((action: any) => (
                            <div key={action.id} className="pm-action-item">
                              <div className={`pm-action-dot ${action.change_type}`} />
                              <div className="pm-action-content">
                                <div className="pm-action-desc">{action.description}</div>
                                <div className="pm-action-meta">
                                  {changeTypeLabel[action.change_type] || action.change_type} · {action.company_name} · {pmTimeAgo(action.created_at)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pm-empty">Sin actividad registrada</div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="pm-empty">No se pudo cargar la información del PM</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
