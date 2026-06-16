'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Company {
  id: string;
  name: string;
  plan: string;
  status: 'active' | 'inactive' | 'trial';
  users: number;
  programs: number;
  created: string;
  lastActivity: string;
}

interface QuickLink {
  id: string;
  title: string;
  description: string;
  href: string;
  count?: number;
}

const styles = `
  .d3-wrap {
    min-height: 100vh;
    background: #ffffff;
    padding: 2rem 2.25rem 4rem;
  }

  /* ── PAGE HEADER ── */
  .d3-header {
    margin-bottom: 2rem;
  }
  .d3-header-top {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 0;
  }
  .d3-title-group {}
  .d3-eyebrow {
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
  .d3-eyebrow-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #F5C800;
    display: inline-block;
  }
  .d3-h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #0f0f0f;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
  .d3-subtitle {
    font-size: 0.82rem;
    color: #9a9a9a;
    margin-top: 0.25rem;
  }
  .d3-header-pills {
    display: flex;
    gap: 0.6rem;
    padding-bottom: 4px;
  }
  .d3-pill {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.85rem;
    border: 1px solid #e8e8e8;
    border-radius: 999px;
    font-size: 0.72rem;
    color: #555;
    background: #fafafa;
  }
  .d3-pill-green {
    background: #f0fdf4;
    border-color: #bbf7d0;
    color: #15803d;
  }
  .d3-status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #22c55e;
    animation: d3-pulse 2s ease-out infinite;
  }
  @keyframes d3-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
    70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
    100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
  }

  /* ── KPI GRID ── */
  .d3-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .d3-kpi {
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 16px;
    padding: 1.35rem 1.4rem 1.2rem;
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.18s, transform 0.18s;
  }
  .d3-kpi:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,0.07);
    transform: translateY(-2px);
  }
  .d3-kpi.featured {
    border-color: #F5C800;
    background: linear-gradient(145deg, #fffef5 0%, #fffbe8 100%);
  }
  .d3-kpi.featured::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: #F5C800;
    border-radius: 16px 16px 0 0;
  }
  .d3-kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  .d3-kpi-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #9a9a9a;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }
  .d3-kpi-chip {
    width: 2rem; height: 2rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .d3-kpi-chip.y  { background: rgba(245,200,0,0.15); color: #8a6800; }
  .d3-kpi-chip.g  { background: #dcfce7; color: #15803d; }
  .d3-kpi-chip.b  { background: #dbeafe; color: #1d4ed8; }
  .d3-kpi-chip.p  { background: #ede9fe; color: #6d28d9; }
  .d3-kpi-num {
    font-size: 2.1rem;
    font-weight: 800;
    color: #0f0f0f;
    line-height: 1;
    letter-spacing: -0.03em;
    margin-bottom: 0.35rem;
  }
  .d3-kpi.featured .d3-kpi-num { color: #6a4f00; }
  .d3-kpi-trend {
    font-size: 0.72rem;
    color: #aaa;
  }
  .d3-kpi-trend .up     { color: #16a34a; font-weight: 600; }
  .d3-kpi-trend .warn   { color: #ca8a04; font-weight: 600; }

  /* ── SECTION DIVIDER ── */
  .d3-section-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #c0c0c0;
    margin-bottom: 0.65rem;
    margin-top: 0.25rem;
  }

  /* ── QUICK LINKS ── */
  .d3-quick-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
  .d3-quick {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.95rem 1.1rem;
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.17s;
    text-decoration: none;
  }
  .d3-quick:hover {
    border-color: #0f0f0f;
    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
    transform: translateY(-1px);
  }
  .d3-quick:hover .d3-quick-ico { background: #F5C800; color: #0f0f0f; }
  .d3-quick-ico {
    width: 2.2rem; height: 2.2rem;
    background: #f5f5f5;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #555;
    flex-shrink: 0;
    transition: background 0.17s, color 0.17s;
  }
  .d3-quick-body { flex: 1; min-width: 0; }
  .d3-quick-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #0f0f0f;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .d3-quick-desc { font-size: 0.7rem; color: #aaa; margin-top: 0.1rem; }
  .d3-quick-count {
    font-size: 1rem;
    font-weight: 700;
    color: #0f0f0f;
    flex-shrink: 0;
  }
  .d3-quick-arrow {
    color: #ccc;
    flex-shrink: 0;
    transition: transform 0.15s, color 0.15s;
  }
  .d3-quick:hover .d3-quick-arrow { transform: translateX(3px); color: #555; }

  /* ── TABLE CARD ── */
  .d3-card {
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }
  .d3-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem 1.35rem;
    border-bottom: 1px solid #f0f0f0;
    flex-wrap: wrap;
  }
  .d3-card-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: #0f0f0f;
  }
  .d3-card-acts { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

  /* inputs & filters */
  .d3-search-wrap { position: relative; }
  .d3-search-ico {
    position: absolute;
    left: 0.6rem;
    top: 50%;
    transform: translateY(-50%);
    color: #bbb;
  }
  .d3-input {
    padding: 0.42rem 0.75rem 0.42rem 2rem;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    font-size: 0.78rem;
    background: #fafafa;
    color: #0f0f0f;
    width: 190px;
    transition: all 0.15s;
  }
  .d3-input:focus {
    outline: none;
    border-color: #0f0f0f;
    background: #fff;
    width: 230px;
  }

  .d3-tabs {
    display: flex;
    gap: 0.15rem;
    background: #f5f5f5;
    padding: 0.18rem;
    border-radius: 8px;
    border: 1px solid #eee;
  }
  .d3-tab {
    padding: 0.28rem 0.65rem;
    font-size: 0.7rem;
    font-weight: 500;
    color: #999;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.12s;
  }
  .d3-tab:hover { color: #333; }
  .d3-tab.on {
    background: #fff;
    color: #0f0f0f;
    font-weight: 700;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }

  .d3-toggle {
    display: flex;
    gap: 0.15rem;
    background: #f5f5f5;
    padding: 0.18rem;
    border-radius: 8px;
    border: 1px solid #eee;
  }
  .d3-ico-btn {
    width: 1.75rem; height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 5px;
    color: #bbb;
    cursor: pointer;
    transition: all 0.12s;
  }
  .d3-ico-btn:hover { color: #555; }
  .d3-ico-btn.on {
    background: #fff;
    color: #0f0f0f;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }

  .d3-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.42rem 0.9rem;
    background: #0f0f0f;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .d3-btn-primary:hover { background: #222; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

  /* ── ROWS ── */
  .d3-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 1.35rem;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: background 0.1s;
  }
  .d3-row:last-child { border-bottom: none; }
  .d3-row:hover { background: #fafafa; }

  .d3-avatar {
    width: 2.1rem; height: 2.1rem;
    background: #0f0f0f;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.75rem;
    color: #F5C800;
    flex-shrink: 0;
  }
  .d3-co-info { flex: 1; min-width: 0; }
  .d3-co-name {
    font-size: 0.83rem;
    font-weight: 600;
    color: #0f0f0f;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .d3-co-meta { font-size: 0.7rem; color: #bbb; margin-top: 0.1rem; }
  .d3-co-stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.72rem;
    color: #888;
    min-width: 85px;
  }
  .d3-row-acts {
    display: flex; gap: 0.2rem;
    opacity: 0; transition: opacity 0.12s;
  }
  .d3-row:hover .d3-row-acts { opacity: 1; }
  .d3-act-btn {
    width: 1.7rem; height: 1.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    color: #999;
    cursor: pointer;
    transition: all 0.12s;
  }
  .d3-act-btn:hover { background: #0f0f0f; border-color: #0f0f0f; color: #fff; }

  /* ── BADGES ── */
  .d3-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.18rem 0.55rem;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    border-radius: 999px;
    white-space: nowrap;
  }
  .d3-badge.active   { background: #dcfce7; color: #15803d; }
  .d3-badge.trial    { background: #fef9c3; color: #854d0e; }
  .d3-badge.inactive { background: #f3f4f6; color: #6b7280; }
  .d3-badge.plan     { background: rgba(245,200,0,0.15); color: #7a5900; border: 1px solid rgba(245,200,0,0.35); }

  /* ── GRID VIEW ── */
  .d3-co-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.85rem;
    padding: 1rem;
  }
  .d3-co-card {
    background: #fafafa;
    border: 1px solid #ebebeb;
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.15s;
  }
  .d3-co-card:hover { border-color: #0f0f0f; background: #fff; }
  .d3-co-card-head { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.75rem; }
  .d3-co-card-stats {
    display: flex;
    gap: 1rem;
    padding-top: 0.65rem;
    border-top: 1px solid #ebebeb;
    font-size: 0.7rem;
    color: #aaa;
  }
  .d3-co-card-stats strong { color: #0f0f0f; }

  /* ── EMPTY ── */
  .d3-empty {
    text-align: center;
    padding: 3.5rem 2rem;
    color: #bbb;
  }
  .d3-empty-ico {
    width: 2.75rem; height: 2.75rem;
    margin: 0 auto 0.85rem;
    background: #f5f5f5;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ccc;
  }
  .d3-empty p   { font-size: 0.85rem; color: #888; margin-bottom: 0.25rem; }
  .d3-empty span { font-size: 0.75rem; color: #bbb; }

  /* ── BOTTOM 2-COL ── */
  .d3-bottom {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
    margin-top: 0.25rem;
  }
  .d3-widget {
    background: #fff;
    border: 1px solid #ebebeb;
    border-radius: 16px;
    overflow: hidden;
  }
  .d3-widget-head {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.85rem 1.2rem;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.8rem;
    font-weight: 700;
    color: #0f0f0f;
  }
  .d3-widget-head-ico { color: #bbb; }

  .d3-plan-row {
    display: flex;
    align-items: center;
    padding: 0.65rem 1.2rem;
    border-bottom: 1px solid #f5f5f5;
    transition: background 0.1s;
    gap: 0.75rem;
  }
  .d3-plan-row:last-child { border-bottom: none; }
  .d3-plan-row:hover { background: #fafafa; }
  .d3-plan-name { font-size: 0.78rem; color: #555; min-width: 88px; }
  .d3-plan-bar-bg {
    flex: 1;
    height: 5px;
    background: #f0f0f0;
    border-radius: 99px;
    overflow: hidden;
  }
  .d3-plan-bar {
    height: 100%;
    background: linear-gradient(90deg, #F5C800 0%, #e6b800 100%);
    border-radius: 99px;
    transition: width 0.5s ease;
  }
  .d3-plan-count { font-size: 0.78rem; font-weight: 700; color: #0f0f0f; min-width: 60px; text-align: right; }

  .d3-act-item {
    display: flex;
    gap: 0.7rem;
    padding: 0.65rem 1.2rem;
    border-bottom: 1px solid #f5f5f5;
    transition: background 0.1s;
  }
  .d3-act-item:last-child { border-bottom: none; }
  .d3-act-item:hover { background: #fafafa; }
  .d3-act-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #F5C800;
    margin-top: 0.3rem;
    flex-shrink: 0;
  }
  .d3-act-text { font-size: 0.78rem; color: #555; line-height: 1.4; }
  .d3-act-time { font-size: 0.68rem; color: #bbb; margin-top: 0.15rem; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1100px) {
    .d3-kpi-grid, .d3-quick-grid { grid-template-columns: repeat(2, 1fr); }
    .d3-co-grid { grid-template-columns: repeat(2, 1fr); }
    .d3-bottom { grid-template-columns: 1fr; }
    .d3-header-top { flex-direction: column; align-items: flex-start; gap: 1rem; }
  }
  @media (max-width: 640px) {
    .d3-wrap { padding: 1rem 1rem 2rem; }
    .d3-kpi-grid, .d3-quick-grid { grid-template-columns: 1fr; }
    .d3-co-grid { grid-template-columns: 1fr; }
    .d3-card-top { flex-direction: column; align-items: stretch; }
    .d3-input { width: 100%; }
  }
`;

/* ── SVG icons ── */
const Ico = {
  spark:    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  building: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
  users:    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
  program:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>,
  settings: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  billing:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
  search:   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
  list:     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>,
  grid:     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>,
  plus:     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>,
  arrow:    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>,
  eye:      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>,
  edit:     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  check:    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>,
  clock:    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  pause:    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6"/></svg>,
  trend:    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const PARTICIPANT_ROLES = ['facilitator', 'mentor', 'mentee', 'participant_cell', 'participant', 'facilitator_internal'];
    try {
      const u = localStorage.getItem('user');
      if (u) {
        const user = JSON.parse(u);
        if (PARTICIPANT_ROLES.includes(user?.role)) {
          const portalCode = user?.portal_code;
          if (portalCode) { router.replace(`/p/${portalCode}`); return; }
          const pp = localStorage.getItem('program_participant');
          if (pp) {
            const d = JSON.parse(pp);
            if (d?.company_slug) { router.replace(`/studio/${d.company_slug}`); return; }
          }
          router.replace('/login/admin');
        }
      }
    } catch {}
  }, [router]);

  const [companies, setCompanies]     = useState<Company[]>([]);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState<'all' | 'active' | 'trial' | 'inactive'>('all');
  const [view, setView]               = useState<'list' | 'grid'>('list');
  const [adminName, setAdminName]     = useState('Admin');
  const [activity, setActivity]       = useState<{ text: string; time: string }[]>([]);
  const [quickLinks, setQuickLinks]   = useState<QuickLink[]>([
    { id: 'accounts', title: 'Cuentas Studio',  description: 'Gestionar empresas',    href: '/dashboard/accounts', count: 0 },
    { id: 'programs', title: 'Programas Studio', description: 'Templates de mentoría', href: '/dashboard/programs', count: 0 },
    { id: 'users',    title: 'Usuarios',          description: 'Administrar usuarios',  href: '/dashboard/users',    count: 0 },
    { id: 'settings', title: 'Configuración',     description: 'Ajustes del sistema',   href: '/dashboard/settings' },
  ]);

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) {
        const p = JSON.parse(u);
        setAdminName(p.full_name?.split(' ')[0] || p.email?.split('@')[0] || 'Admin');
      }
    } catch {}

    (async () => {
      try {
        const [statsRes, companiesRes, templatesRes] = await Promise.all([
          fetch(`${API_URL}/api/companies/stats`).catch(() => null),
          fetch(`${API_URL}/api/companies/`).catch(() => null),
          fetch(`${API_URL}/api/program-templates?light=true`).catch(() => null),
        ]);
        let totalAccounts = 0, totalUsers = 0;
        if (statsRes?.ok) { const s = await statsRes.json(); totalAccounts = s.total_companies || 0; totalUsers = s.total_users || 0; }
        let totalTemplates = 0;
        if (templatesRes?.ok) { const t = await templatesRes.json(); totalTemplates = Array.isArray(t) ? t.length : 0; }
        setQuickLinks([
          { id: 'accounts', title: 'Cuentas Studio',  description: 'Gestionar empresas',    href: '/dashboard/accounts', count: totalAccounts },
          { id: 'programs', title: 'Programas Studio', description: 'Templates de mentoría', href: '/dashboard/programs', count: totalTemplates },
          { id: 'users',    title: 'Usuarios',          description: 'Administrar usuarios',  href: '/dashboard/users',    count: totalUsers },
          { id: 'settings', title: 'Configuración',     description: 'Ajustes del sistema',   href: '/dashboard/settings' },
        ]);
        if (companiesRes?.ok) {
          const all = await companiesRes.json();
          const mapped: Company[] = (Array.isArray(all) ? all : [])
            .filter((c: any) => c.status !== 'pending')
            .map((c: any) => ({
              id: c.id,
              name: c.name || 'Sin nombre',
              plan: (c.plan || 'starter').charAt(0).toUpperCase() + (c.plan || 'starter').slice(1),
              status: c.status === 'active' ? 'active' : c.status === 'trial' ? 'trial' : 'inactive',
              users: c.user_count || c.users || 0,
              programs: c.program_count || c.programs || 0,
              created: c.created_at ? new Date(c.created_at).toLocaleDateString('es-CL') : 'N/A',
              lastActivity: c.updated_at ? new Date(c.updated_at).toLocaleDateString('es-CL') : 'Hoy',
            }));
          setCompanies(mapped);
          setActivity(mapped.slice(0, 5).map(c => ({ text: `${c.name} — cuenta ${c.status === 'active' ? 'activa' : c.status}`, time: c.created })));
        }
      } catch {}
    })();
  }, []);

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    (filter === 'all' || c.status === filter)
  );

  const stats = {
    total:  companies.length,
    active: companies.filter(c => c.status === 'active').length,
    trial:  companies.filter(c => c.status === 'trial').length,
    users:  companies.reduce((s, c) => s + c.users, 0),
  };

  const plans = [
    { label: 'Enterprise',   count: companies.filter(c => c.plan === 'Enterprise').length },
    { label: 'Professional', count: companies.filter(c => c.plan === 'Professional').length },
    { label: 'Starter',      count: companies.filter(c => c.plan === 'Starter').length },
  ];
  const maxPlan = Math.max(...plans.map(p => p.count), 1);

  const quickIco = (id: string) => ({ accounts: Ico.building, programs: Ico.program, users: Ico.users, billing: Ico.billing })[id] ?? Ico.settings;

  const Badge = ({ status }: { status: Company['status'] }) => {
    const m = { active: { cls: 'active', ico: Ico.check, label: 'Activa' }, trial: { cls: 'trial', ico: Ico.clock, label: 'Trial' }, inactive: { cls: 'inactive', ico: Ico.pause, label: 'Inactiva' } };
    const { cls, ico, label } = m[status];
    return <span className={`d3-badge ${cls}`}>{ico}{label}</span>;
  };

  const date = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <style>{styles}</style>
      <div className="d3-wrap">

        {/* ── HEADER ── */}
        <div className="d3-header">
          <div className="d3-header-top">
            <div className="d3-title-group">
              <div className="d3-eyebrow"><span className="d3-eyebrow-dot" /> Vista General</div>
              <h1 className="d3-h1">Hola, {adminName} 👋</h1>
              <p className="d3-subtitle">{date.charAt(0).toUpperCase() + date.slice(1)}</p>
            </div>
            <div className="d3-header-pills">
              <div className="d3-pill d3-pill-green">
                <div className="d3-status-dot" />
                Sistema operativo
              </div>
              <div className="d3-pill">
                {Ico.users}&nbsp;{stats.users} usuarios
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="d3-kpi-grid">
          <div className="d3-kpi featured">
            <div className="d3-kpi-top">
              <div className="d3-kpi-label">Total Cuentas</div>
              <div className="d3-kpi-chip y">{Ico.building}</div>
            </div>
            <div className="d3-kpi-num">{stats.total}</div>
            <div className="d3-kpi-trend"><span className="up">↑ +2</span> este mes</div>
          </div>
          <div className="d3-kpi">
            <div className="d3-kpi-top">
              <div className="d3-kpi-label">Cuentas Activas</div>
              <div className="d3-kpi-chip g">{Ico.check}</div>
            </div>
            <div className="d3-kpi-num">{stats.active}</div>
            <div className="d3-kpi-trend"><span className="warn">{stats.total > 0 ? Math.round((stats.active/stats.total)*100) : 0}%</span> del total</div>
          </div>
          <div className="d3-kpi">
            <div className="d3-kpi-top">
              <div className="d3-kpi-label">En Prueba</div>
              <div className="d3-kpi-chip b">{Ico.clock}</div>
            </div>
            <div className="d3-kpi-num">{stats.trial}</div>
            <div className="d3-kpi-trend"><span className="warn">65%</span> conversión histórica</div>
          </div>
          <div className="d3-kpi">
            <div className="d3-kpi-top">
              <div className="d3-kpi-label">Total Usuarios</div>
              <div className="d3-kpi-chip p">{Ico.users}</div>
            </div>
            <div className="d3-kpi-num">{stats.users}</div>
            <div className="d3-kpi-trend"><span className="up">↑ +48</span> esta semana</div>
          </div>
        </div>

        {/* ── ACCESOS RÁPIDOS ── */}
        <div className="d3-section-label">Accesos rápidos</div>
        <div className="d3-quick-grid">
          {quickLinks.map(l => (
            <div key={l.id} className="d3-quick" onClick={() => window.location.href = l.href}>
              <div className="d3-quick-ico">{quickIco(l.id)}</div>
              <div className="d3-quick-body">
                <div className="d3-quick-title">{l.title}</div>
                <div className="d3-quick-desc">{l.description}</div>
              </div>
              {l.count !== undefined && <div className="d3-quick-count">{l.count}</div>}
              <div className="d3-quick-arrow">{Ico.arrow}</div>
            </div>
          ))}
        </div>

        {/* ── ACCOUNTS TABLE ── */}
        <div className="d3-card">
          <div className="d3-card-top">
            <div className="d3-card-title">Cuentas Studio</div>
            <div className="d3-card-acts">
              <div className="d3-search-wrap">
                <span className="d3-search-ico">{Ico.search}</span>
                <input className="d3-input" type="text" placeholder="Buscar cuentas..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="d3-tabs">
                {(['all','active','trial','inactive'] as const).map(s => (
                  <button key={s} className={`d3-tab ${filter === s ? 'on' : ''}`} onClick={() => setFilter(s)}>
                    {s === 'all' ? 'Todas' : s === 'active' ? 'Activas' : s === 'trial' ? 'Trial' : 'Inactivas'}
                  </button>
                ))}
              </div>
              <div className="d3-toggle">
                <button className={`d3-ico-btn ${view === 'list' ? 'on' : ''}`} onClick={() => setView('list')}>{Ico.list}</button>
                <button className={`d3-ico-btn ${view === 'grid' ? 'on' : ''}`} onClick={() => setView('grid')}>{Ico.grid}</button>
              </div>
              <button className="d3-btn-primary" onClick={() => window.location.href = '/dashboard/accounts'}>{Ico.plus} Nueva Cuenta</button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="d3-empty">
              <div className="d3-empty-ico">{Ico.building}</div>
              <p>No se encontraron cuentas</p>
              <span>Crea la primera cuenta Studio para comenzar</span>
            </div>
          ) : view === 'list' ? (
            filtered.map(c => (
              <div key={c.id} className="d3-row">
                <div className="d3-avatar">{c.name.charAt(0)}</div>
                <div className="d3-co-info">
                  <div className="d3-co-name">{c.name}</div>
                  <div className="d3-co-meta">{c.lastActivity}</div>
                </div>
                <span className="d3-badge plan">{c.plan}</span>
                <Badge status={c.status} />
                <div className="d3-co-stat">{Ico.users}<span>{c.users} usuarios</span></div>
                <div className="d3-co-stat">{Ico.program}<span>{c.programs} programas</span></div>
                <div className="d3-row-acts">
                  <button className="d3-act-btn">{Ico.eye}</button>
                  <button className="d3-act-btn">{Ico.edit}</button>
                </div>
              </div>
            ))
          ) : (
            <div className="d3-co-grid">
              {filtered.map(c => (
                <div key={c.id} className="d3-co-card">
                  <div className="d3-co-card-head">
                    <div className="d3-avatar">{c.name.charAt(0)}</div>
                    <div className="d3-co-info">
                      <div className="d3-co-name">{c.name}</div>
                      <div className="d3-co-meta">{c.lastActivity}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.65rem' }}>
                    <span className="d3-badge plan">{c.plan}</span>
                    <Badge status={c.status} />
                  </div>
                  <div className="d3-co-card-stats">
                    <div><strong>{c.users}</strong> usuarios</div>
                    <div><strong>{c.programs}</strong> programas</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── BOTTOM WIDGETS ── */}
        <div className="d3-bottom">
          <div className="d3-widget">
            <div className="d3-widget-head">
              <span className="d3-widget-head-ico">{Ico.billing}</span>
              Distribución por Plan
            </div>
            {plans.map(p => (
              <div key={p.label} className="d3-plan-row">
                <div className="d3-plan-name">{p.label}</div>
                <div className="d3-plan-bar-bg">
                  <div className="d3-plan-bar" style={{ width: `${(p.count / maxPlan) * 100}%` }} />
                </div>
                <div className="d3-plan-count">{p.count} cuentas</div>
              </div>
            ))}
          </div>

          <div className="d3-widget">
            <div className="d3-widget-head">
              <span className="d3-widget-head-ico">{Ico.trend}</span>
              Actividad Reciente
            </div>
            {activity.length === 0 ? (
              <div className="d3-empty" style={{ padding: '2rem' }}>
                <p>Sin actividad reciente</p>
              </div>
            ) : activity.map((a, i) => (
              <div key={i} className="d3-act-item">
                <div className="d3-act-dot" />
                <div>
                  <div className="d3-act-text">{a.text}</div>
                  <div className="d3-act-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
