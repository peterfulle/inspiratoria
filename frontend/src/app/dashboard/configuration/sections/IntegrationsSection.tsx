'use client';

import { useState } from 'react';
import { Icons } from '../components/Icons';

// ============================================================================
// TYPES
// ============================================================================
type CategoryId = 'all' | 'recommended' | 'communication' | 'calendar' | 'analytics' | 'ai' | 'payment' | 'storage' | 'hr' | 'erp';

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  recommended: boolean;
  category: CategoryId;
  features: string[];
  docsUrl?: string;
  configFields?: { label: string; type: string; placeholder: string }[];
}

// ============================================================================
// STYLES (Minimalista)
// ============================================================================
const integrationStyles = `
  .int-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .int-count {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .int-count strong {
    color: #1a1a1a;
  }

  .int-search-bar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .int-search-input {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
  }

  .int-search-input input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.8125rem;
    background: transparent;
  }

  .int-search-input svg {
    color: #9ca3af;
    width: 14px;
    height: 14px;
  }

  .int-categories {
    display: flex;
    gap: 0.25rem;
    padding: 0.25rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin-bottom: 1.25rem;
  }

  .int-cat-btn {
    padding: 0.375rem 0.625rem;
    background: transparent;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .int-cat-btn:hover {
    color: #374151;
  }

  .int-cat-btn.active {
    background: white;
    color: #1a1a1a;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .int-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  .int-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.875rem;
    display: flex;
    flex-direction: column;
    transition: all 0.15s ease;
    position: relative;
  }

  .int-card:hover {
    border-color: #d1d5db;
  }

  .int-card.connected {
    border-color: #10b981;
    background: #f0fdf4;
  }

  .int-card-top {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    margin-bottom: 0.5rem;
  }

  .int-logo {
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  .int-logo svg {
    width: 16px;
    height: 16px;
  }

  .int-card-info {
    flex: 1;
    min-width: 0;
  }

  .int-card-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    line-height: 1.2;
  }

  .int-badge {
    font-size: 0.5rem;
    padding: 0.0625rem 0.25rem;
    border-radius: 0.25rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .int-badge.connected {
    background: #d1fae5;
    color: #059669;
  }

  .int-badge.recommended {
    background: #dbeafe;
    color: #2563eb;
  }

  .int-badge.enterprise {
    background: #f3e8ff;
    color: #9333ea;
  }

  .int-card-desc {
    font-size: 0.6875rem;
    color: #6b7280;
    margin-top: 0.25rem;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .int-card-footer {
    display: flex;
    gap: 0.375rem;
    margin-top: auto;
    padding-top: 0.625rem;
  }

  .int-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.375rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .int-btn-primary {
    background: #1a1a1a;
    color: white;
    border: none;
  }

  .int-btn-primary:hover {
    background: #2d2d2d;
  }

  .int-btn-secondary {
    background: transparent;
    color: #374151;
    border: 1px solid #e5e7eb;
  }

  .int-btn-secondary:hover {
    background: #f9fafb;
  }

  /* Modal */
  .int-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .int-modal {
    background: white;
    border-radius: 0.75rem;
    width: 100%;
    max-width: 24rem;
    max-height: 90vh;
    overflow-y: auto;
  }

  .int-modal-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .int-modal-body {
    padding: 1rem;
  }

  .int-modal-footer {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .int-input-group {
    margin-bottom: 0.75rem;
  }

  .int-input-label {
    display: block;
    font-size: 0.6875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }

  .int-input {
    width: 100%;
    padding: 0.5rem 0.625rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    transition: border-color 0.15s ease;
  }

  .int-input:focus {
    outline: none;
    border-color: #1a1a1a;
  }

  .int-empty {
    text-align: center;
    padding: 2rem;
    color: #9ca3af;
    font-size: 0.8125rem;
  }

  @media (max-width: 1280px) {
    .int-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 1024px) {
    .int-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .int-grid { grid-template-columns: 1fr; }
  }
`;

// ============================================================================
// LOGOS (SVG Data URIs - funcionan siempre)
// ============================================================================
const LOGOS: Record<string, { bg: string; icon: React.ReactNode }> = {
  calendly: { bg: '#006bff', icon: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M19.655 14.262c.124-.369.186-.766.186-1.182 0-2.041-1.654-3.695-3.694-3.695-.625 0-1.213.158-1.73.432l-.003-.002a5.14 5.14 0 00-.908-.08c-2.853 0-5.166 2.313-5.166 5.166s2.313 5.166 5.166 5.166c1.208 0 2.319-.415 3.198-1.11.32.072.654.11.996.11 2.04 0 3.694-1.654 3.694-3.695 0-.42-.07-.823-.2-1.2l.46.09z"/></svg> },
  zoom: { bg: '#2d8cff', icon: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M4.585 10.432v3.636c0 .66.535 1.195 1.195 1.195h6.489a.3.3 0 00.3-.3v-3.636a1.195 1.195 0 00-1.195-1.195H5.185a.6.6 0 00-.6.3zm10.629 1.255l3.167-2.196a.6.6 0 01.934.498v4.522a.6.6 0 01-.934.498l-3.167-2.196v-1.126z"/></svg> },
  'google-meet': { bg: '#00897b', icon: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12 11l4 2.5v-5L12 11zm-8-4v10a2 2 0 002 2h8l-1-2H6V7h12v4l2-1.25V7a2 2 0 00-2-2H6a2 2 0 00-2 2z"/></svg> },
  slack: { bg: '#4a154b', icon: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M6.194 14.644c0 1.16-.946 2.106-2.106 2.106S2 15.804 2 14.644s.946-2.107 2.088-2.107h2.106v2.107zm1.061 0c0-1.16.946-2.107 2.106-2.107s2.106.946 2.106 2.107v5.25c0 1.16-.946 2.106-2.106 2.106s-2.106-.946-2.106-2.106v-5.25z"/></svg> },
  linkedin: { bg: '#0a66c2', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  openai: { bg: '#10a37f', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0012 .075 6.018 6.018 0 005.654 4.2 6.054 6.054 0 002.4 7.78a6.043 6.043 0 00.746 7.09 5.985 5.985 0 00.516 4.911 6.046 6.046 0 006.51 2.9A6.06 6.06 0 0012 23.925a6.018 6.018 0 006.346-4.126 6.054 6.054 0 003.254-3.58 6.043 6.043 0 00-.746-7.09zM12 4.576a2.62 2.62 0 012.608 2.394l-2.315 1.34V5.16a2.618 2.618 0 01-.293-.584zm-4.615 3.2a2.618 2.618 0 013.125-.814l-2.315 1.34-1.593-.922a2.618 2.618 0 01.783-.605z"/></svg> },
  gemini: { bg: '#8e44ad', icon: <svg viewBox="0 0 24 24" fill="white" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c3.95.49 7 3.85 7 7.93s-3.05 7.44-7 7.93V4.07z"/></svg> },
  'microsoft-teams': { bg: '#6264a7', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M20.625 8.073h-5.27a.976.976 0 00-.98.979v5.27c0 .54.439.979.98.979h3.127a2.122 2.122 0 002.122-2.123V9.051a.98.98 0 00-.98-.978zM16.5 6.375a1.875 1.875 0 100-3.75 1.875 1.875 0 000 3.75zM11.625 6a2.625 2.625 0 100-5.25 2.625 2.625 0 000 5.25zM13.5 7.125h-5.25a1.5 1.5 0 00-1.5 1.5v6.75a3.375 3.375 0 106.75 0v-6.75a1.5 1.5 0 00-1.5-1.5z"/></svg> },
  whatsapp: { bg: '#25d366', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
  sendgrid: { bg: '#1a82e2', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M15.995 0H8.003v8.003h8.003V.011L15.995 0zM8.003 8.003H.011v7.992h7.992V8.003zM24 .011v7.992h-8.003V.011H24zM8.003 16.006H.011V24h7.992v-7.994zM15.995 8.003H8.003v7.992h7.992V8.003zM24 16.006h-8.003V24H24v-7.994z"/></svg> },
  twilio: { bg: '#f22f46', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 0C5.381 0 0 5.381 0 12s5.381 12 12 12 12-5.381 12-12S18.619 0 12 0zm0 20.16c-4.502 0-8.16-3.658-8.16-8.16S7.498 3.84 12 3.84s8.16 3.658 8.16 8.16-3.658 8.16-8.16 8.16zm3.168-11.328a2.688 2.688 0 110 5.376 2.688 2.688 0 010-5.376zm-6.336 0a2.688 2.688 0 110 5.376 2.688 2.688 0 010-5.376z"/></svg> },
  'google-calendar': { bg: '#4285f4', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM7 12h5v5H7z"/></svg> },
  'outlook-calendar': { bg: '#0078d4', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h11.9q.44 0 .75.3.3.3.3.75V12z"/></svg> },
  'cal-com': { bg: '#292929', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> },
  anthropic: { bg: '#cc785c', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M17.604 3.332L12.001 20.5l-2.882-8.43-8.42-2.9L17.604 3.33zm.689 1.534l-5.59 5.593 5.59 5.592-5.59 5.594V4.866z"/></svg> },
  cohere: { bg: '#39594d', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><circle cx="12" cy="12" r="8"/></svg> },
  pinecone: { bg: '#000000', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.18l5.45 2.73L12 9.64 6.55 6.91 12 4.18zM6 8.27l5 2.5v6.96l-5-2.5V8.27zm12 6.96l-5 2.5v-6.96l5-2.5v6.96z"/></svg> },
  mixpanel: { bg: '#7856ff', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-4h2v4zm4 0h-2v-6h2v6z"/></svg> },
  amplitude: { bg: '#1e61e0', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> },
  segment: { bg: '#52bd94', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M2.13 10.68h7.1a.68.68 0 100-1.36h-7.1a.68.68 0 000 1.36zm9.87 2.64H2.13a.68.68 0 000 1.36H12a.68.68 0 100-1.36zm9.87-2.64h-4.3a.68.68 0 100 1.36h4.3a.68.68 0 100-1.36z"/></svg> },
  hubspot: { bg: '#ff7a59', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984v-.066A2.2 2.2 0 0017.231.835h-.066a2.2 2.2 0 00-2.2 2.199v.066c0 .865.503 1.612 1.231 1.97v2.862a5.91 5.91 0 00-3.54 1.837l-6.2-4.823a2.6 2.6 0 00.092-.663A2.617 2.617 0 003.94 1.67a2.617 2.617 0 00-2.614 2.613 2.617 2.617 0 002.614 2.614c.53 0 1.02-.163 1.432-.435l6.086 4.735a5.906 5.906 0 00-.727 2.84c0 1.062.281 2.06.773 2.924l-2.37 2.37a1.78 1.78 0 00-.54-.09 1.81 1.81 0 00-1.808 1.808 1.81 1.81 0 001.808 1.808 1.81 1.81 0 001.808-1.808c0-.193-.032-.378-.087-.553l2.378-2.378a5.923 5.923 0 009.16-4.963 5.921 5.921 0 00-3.689-5.482z"/></svg> },
  salesforce: { bg: '#00a1e0', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.16 5.22c-.45 0-.87-.06-1.29-.165a3.9 3.9 0 01-3.42 2.025 3.9 3.9 0 01-1.92-.51 4.62 4.62 0 01-4.17 2.64c-2.25 0-4.17-1.62-4.62-3.81a4.02 4.02 0 01-.87.105c-2.19 0-3.96-1.8-3.96-4.02 0-1.71 1.05-3.18 2.55-3.78-.15-.45-.24-.93-.24-1.44 0-2.49 2.01-4.5 4.5-4.5 1.8.03 3.42 1.08 4.14 2.58z"/></svg> },
  workday: { bg: '#0875e1', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><circle cx="12" cy="12" r="10"/></svg> },
  bamboohr: { bg: '#73c41d', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg> },
  personio: { bg: '#ff4d00', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg> },
  deel: { bg: '#2b3d4f', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86z"/></svg> },
  'sap-successfactors': { bg: '#0070f2', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12.7 3.3l7 4c.2.1.3.4.3.7v8c0 .3-.1.5-.3.7l-7 4c-.2.1-.5.1-.7 0l-7-4c-.2-.2-.3-.4-.3-.7V8c0-.3.1-.5.3-.7l7-4c.2-.1.5-.1.7 0z"/></svg> },
  'sap-s4hana': { bg: '#f0ab00', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12.7 3.3l7 4c.2.1.3.4.3.7v8c0 .3-.1.5-.3.7l-7 4c-.2.1-.5.1-.7 0l-7-4c-.2-.2-.3-.4-.3-.7V8c0-.3.1-.5.3-.7l7-4c.2-.1.5-.1.7 0z"/></svg> },
  'oracle-hcm': { bg: '#c74634', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M6 3h12c1.66 0 3 1.34 3 3v12c0 1.66-1.34 3-3 3H6c-1.66 0-3-1.34-3-3V6c0-1.66 1.34-3 3-3zm0 2c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1H6z"/></svg> },
  'microsoft-dynamics': { bg: '#002050', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM3 19V5h8v14H3zm18 0h-8V5h8v14z"/></svg> },
  stripe: { bg: '#635bff', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg> },
  paypal: { bg: '#003087', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 3.72a.774.774 0 01.763-.642h6.143c2.044 0 3.578.36 4.563 1.07 1.035.742 1.475 1.924 1.31 3.515-.045.434-.13.903-.254 1.397a7.465 7.465 0 01-.689 1.807c-.328.582-.74 1.09-1.227 1.512-.513.443-1.103.79-1.758 1.032-.683.253-1.445.381-2.268.381h-2.54a.774.774 0 00-.764.642l-.957 5.903z"/></svg> },
  'aws-s3': { bg: '#ff9900', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> },
  'google-cloud-storage': { bg: '#4285f4', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> },
  'azure-blob': { bg: '#0078d4', icon: <svg viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> },
};

// ============================================================================
// COMPONENT
// ============================================================================
export default function IntegrationsSection() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryId>('all');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const categories: { id: CategoryId; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'recommended', label: 'Recomendadas' },
    { id: 'communication', label: 'Comunicación' },
    { id: 'calendar', label: 'Calendario' },
    { id: 'ai', label: 'IA' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'hr', label: 'RRHH' },
    { id: 'erp', label: 'ERP' },
    { id: 'payment', label: 'Pagos' },
    { id: 'storage', label: 'Storage' },
  ];

  const integrations: Integration[] = [
    // ===== RECOMENDADAS =====
    { id: 'calendly', name: 'Calendly', description: 'Programación automática de sesiones con sincronización de calendarios.', connected: false, recommended: true, category: 'calendar', features: ['Auto-scheduling', 'Timezone sync', 'Reminders'], configFields: [{ label: 'API Key', type: 'password', placeholder: 'eyJhbGciOiJI...' }] },
    { id: 'zoom', name: 'Zoom', description: 'Videollamadas HD con grabación y transcripción automática.', connected: true, recommended: true, category: 'communication', features: ['HD Video', 'Recording', 'Transcription'], configFields: [{ label: 'Client ID', type: 'text', placeholder: 'OAuth Client ID' }, { label: 'Client Secret', type: 'password', placeholder: 'OAuth Secret' }] },
    { id: 'google-meet', name: 'Google Meet', description: 'Videollamadas integradas con Google Workspace.', connected: false, recommended: true, category: 'communication', features: ['Calendar sync', 'Screen share', 'Recording'] },
    { id: 'slack', name: 'Slack', description: 'Notificaciones en tiempo real y comunicación del equipo.', connected: false, recommended: true, category: 'communication', features: ['Webhooks', 'Channels', 'Bot'], configFields: [{ label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/...' }] },
    { id: 'linkedin', name: 'LinkedIn', description: 'Importa perfiles para onboarding inteligente.', connected: true, recommended: true, category: 'ai', features: ['Profile import', 'Skills extraction', 'Auto-match'] },
    { id: 'openai', name: 'OpenAI', description: 'GPT-4 para matching, resúmenes y recomendaciones.', connected: true, recommended: true, category: 'ai', features: ['Smart matching', 'Summaries', 'Insights'], configFields: [{ label: 'API Key', type: 'password', placeholder: 'sk-...' }] },
    { id: 'gemini', name: 'Google Gemini', description: 'IA multimodal de Google para análisis avanzado.', connected: true, recommended: true, category: 'ai', features: ['Multimodal', 'Long context', 'Analysis'], configFields: [{ label: 'API Key', type: 'password', placeholder: 'AIza...' }] },
    // ===== COMUNICACIÓN =====
    { id: 'microsoft-teams', name: 'MS Teams', description: 'Colaboración integrada con Microsoft 365.', connected: false, recommended: false, category: 'communication', features: ['Video calls', 'Chat', 'SSO'], configFields: [{ label: 'Tenant ID', type: 'text', placeholder: 'Azure Tenant ID' }] },
    { id: 'whatsapp', name: 'WhatsApp', description: 'Notificaciones y recordatorios vía WhatsApp.', connected: false, recommended: false, category: 'communication', features: ['Notifications', 'Templates', 'Media'] },
    { id: 'sendgrid', name: 'SendGrid', description: 'Emails transaccionales de alta entrega.', connected: false, recommended: false, category: 'communication', features: ['High deliverability', 'Templates', 'Analytics'], configFields: [{ label: 'API Key', type: 'password', placeholder: 'SG.xxx...' }] },
    { id: 'twilio', name: 'Twilio', description: 'SMS, voz y video multicanal.', connected: false, recommended: false, category: 'communication', features: ['SMS', 'Voice', 'Video'] },
    // ===== CALENDARIO =====
    { id: 'google-calendar', name: 'Google Calendar', description: 'Sincronización bidireccional de eventos.', connected: false, recommended: false, category: 'calendar', features: ['2-way sync', 'Availability', 'Recurring'] },
    { id: 'outlook-calendar', name: 'Outlook', description: 'Calendarios de Microsoft 365 y Exchange.', connected: false, recommended: false, category: 'calendar', features: ['M365 sync', 'Room booking', 'Scheduling'] },
    { id: 'cal-com', name: 'Cal.com', description: 'Alternativa open-source a Calendly.', connected: false, recommended: false, category: 'calendar', features: ['Open source', 'Self-host', 'Workflows'] },
    // ===== IA =====
    { id: 'anthropic', name: 'Claude', description: 'IA de Anthropic para análisis seguro.', connected: false, recommended: false, category: 'ai', features: ['Claude 3', 'Long context', 'Safety'], configFields: [{ label: 'API Key', type: 'password', placeholder: 'sk-ant-...' }] },
    { id: 'cohere', name: 'Cohere', description: 'Embeddings para matching semántico.', connected: false, recommended: false, category: 'ai', features: ['Embeddings', 'Search', 'Rerank'] },
    { id: 'pinecone', name: 'Pinecone', description: 'Base de datos vectorial para similitud.', connected: false, recommended: false, category: 'ai', features: ['Vector DB', 'Real-time', 'Scalable'] },
    // ===== ANALYTICS =====
    { id: 'mixpanel', name: 'Mixpanel', description: 'Analytics de comportamiento de usuarios.', connected: false, recommended: false, category: 'analytics', features: ['Funnels', 'Retention', 'A/B testing'] },
    { id: 'amplitude', name: 'Amplitude', description: 'Insights de producto y comportamiento.', connected: false, recommended: false, category: 'analytics', features: ['Cohorts', 'Experiments', 'CDP'] },
    { id: 'segment', name: 'Segment', description: 'Customer Data Platform centralizada.', connected: false, recommended: false, category: 'analytics', features: ['CDP', 'Data routing', 'Identity'] },
    { id: 'hubspot', name: 'HubSpot', description: 'CRM y marketing automation.', connected: false, recommended: false, category: 'analytics', features: ['CRM', 'Marketing', 'Reports'] },
    { id: 'salesforce', name: 'Salesforce', description: 'CRM empresarial líder.', connected: false, recommended: false, category: 'analytics', features: ['Enterprise CRM', 'Workflows', 'Reports'] },
    // ===== RRHH =====
    { id: 'workday', name: 'Workday', description: 'HCM líder para datos de empleados.', connected: false, recommended: false, category: 'hr', features: ['HCM sync', 'Org chart', 'Skills'] },
    { id: 'bamboohr', name: 'BambooHR', description: 'HRIS para PYMEs.', connected: false, recommended: false, category: 'hr', features: ['Employee DB', 'Time-off', 'Reports'] },
    { id: 'personio', name: 'Personio', description: 'Software de RRHH europeo.', connected: false, recommended: false, category: 'hr', features: ['HR', 'Recruiting', 'Payroll'] },
    { id: 'deel', name: 'Deel', description: 'Equipos remotos y contractors.', connected: false, recommended: false, category: 'hr', features: ['Global payroll', 'Compliance', 'EOR'] },
    // ===== ERP =====
    { id: 'sap-successfactors', name: 'SAP SuccessFactors', description: 'Suite HXM de SAP para talento.', connected: false, recommended: false, category: 'erp', features: ['Learning', 'Performance', 'Recruiting'], configFields: [{ label: 'API URL', type: 'text', placeholder: 'https://api.successfactors.com' }, { label: 'Company ID', type: 'text', placeholder: 'Company ID' }, { label: 'API Key', type: 'password', placeholder: 'API Key' }] },
    { id: 'sap-s4hana', name: 'SAP S/4HANA', description: 'ERP inteligente con datos org.', connected: false, recommended: false, category: 'erp', features: ['Org structure', 'Cost centers', 'Analytics'], configFields: [{ label: 'OData URL', type: 'text', placeholder: 'https://your-sap.com/sap/opu/odata' }, { label: 'Client', type: 'text', placeholder: '100' }] },
    { id: 'oracle-hcm', name: 'Oracle HCM', description: 'Capital humano de Oracle.', connected: false, recommended: false, category: 'erp', features: ['HCM', 'Talent', 'Learning'] },
    { id: 'microsoft-dynamics', name: 'Dynamics 365', description: 'ERP y CRM de Microsoft.', connected: false, recommended: false, category: 'erp', features: ['ERP', 'CRM', 'Power Platform'] },
    // ===== PAGOS =====
    { id: 'stripe', name: 'Stripe', description: 'Pagos y suscripciones empresariales.', connected: false, recommended: false, category: 'payment', features: ['Subscriptions', 'Invoicing', 'Webhooks'], configFields: [{ label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...' }, { label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' }] },
    { id: 'paypal', name: 'PayPal', description: 'Pagos globales múltiples métodos.', connected: false, recommended: false, category: 'payment', features: ['Global payments', 'Invoicing', 'Checkout'] },
    // ===== STORAGE =====
    { id: 'aws-s3', name: 'AWS S3', description: 'Almacenamiento escalable.', connected: false, recommended: false, category: 'storage', features: ['Object storage', 'CDN', 'Versioning'], configFields: [{ label: 'Access Key', type: 'text', placeholder: 'AKIA...' }, { label: 'Secret Key', type: 'password', placeholder: 'wJal...' }, { label: 'Bucket', type: 'text', placeholder: 'my-bucket' }] },
    { id: 'google-cloud-storage', name: 'GCS', description: 'Storage de Google Cloud.', connected: false, recommended: false, category: 'storage', features: ['Multi-region', 'CDN', 'BigQuery'] },
    { id: 'azure-blob', name: 'Azure Blob', description: 'Storage de Microsoft Azure.', connected: false, recommended: false, category: 'storage', features: ['Blob storage', 'CDN', 'Tiers'] },
  ];

  const filteredIntegrations = integrations.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || (category === 'recommended' && i.recommended) || i.category === category;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = integrations.filter(i => i.connected).length;

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowConfig(true);
  };

  return (
    <>
      <style>{integrationStyles}</style>

      {/* Header */}
      <div className="int-header-row">
        <div className="int-count">
          <strong>{connectedCount}</strong> de {integrations.length} conectadas
        </div>
      </div>

      {/* Search */}
      <div className="int-search-bar">
        <div className="int-search-input">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar integraciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="int-categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`int-cat-btn ${category === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="int-grid">
        {filteredIntegrations.map(integration => {
          const logo = LOGOS[integration.id] || { bg: '#6b7280', icon: null };
          return (
            <div key={integration.id} className={`int-card ${integration.connected ? 'connected' : ''}`}>
              <div className="int-card-top">
                <div className="int-logo" style={{ background: logo.bg }}>
                  {logo.icon}
                </div>
                <div className="int-card-info">
                  <div className="int-card-name">
                    {integration.name}
                    {integration.connected && <span className="int-badge connected">ON</span>}
                    {!integration.connected && integration.recommended && <span className="int-badge recommended">★</span>}
                    {integration.category === 'erp' && <span className="int-badge enterprise">ENT</span>}
                  </div>
                  <div className="int-card-desc">{integration.description}</div>
                </div>
              </div>
              <div className="int-card-footer">
                {integration.connected ? (
                  <>
                    <button className="int-btn int-btn-secondary" onClick={() => handleConnect(integration)}>Configurar</button>
                    <button className="int-btn int-btn-secondary">Off</button>
                  </>
                ) : (
                  <button className="int-btn int-btn-primary" onClick={() => handleConnect(integration)}>Conectar</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="int-empty">No se encontraron integraciones</div>
      )}

      {/* Modal */}
      {showConfig && selectedIntegration && (
        <div className="int-modal-overlay" onClick={() => setShowConfig(false)}>
          <div className="int-modal" onClick={e => e.stopPropagation()}>
            <div className="int-modal-header">
              <div className="int-logo" style={{ background: LOGOS[selectedIntegration.id]?.bg || '#6b7280' }}>
                {LOGOS[selectedIntegration.id]?.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a1a1a' }}>
                  {selectedIntegration.name}
                </h3>
                <p style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
                  {selectedIntegration.configFields ? 'Ingresa las credenciales' : 'Autorizar con OAuth'}
                </p>
              </div>
              <button onClick={() => setShowConfig(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem' }}>
                {Icons.x}
              </button>
            </div>
            <div className="int-modal-body">
              {selectedIntegration.configFields ? (
                selectedIntegration.configFields.map(field => (
                  <div className="int-input-group" key={field.label}>
                    <label className="int-input-label">{field.label}</label>
                    <input type={field.type} className="int-input" placeholder={field.placeholder} />
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.8125rem', color: '#374151', textAlign: 'center', padding: '1rem 0' }}>
                  Serás redirigido a {selectedIntegration.name} para autorizar.
                </p>
              )}
            </div>
            <div className="int-modal-footer">
              <button className="int-btn int-btn-secondary" style={{ flex: 1 }} onClick={() => setShowConfig(false)}>Cancelar</button>
              <button className="int-btn int-btn-primary" style={{ flex: 1 }}>{selectedIntegration.connected ? 'Guardar' : 'Conectar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
