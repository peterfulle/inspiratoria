'use client';
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const ADMIN_ROLES = new Set(['superadmin', 'admin_root', 'inspiratoria_admin']);

// ============================================================================
// TYPES
// ============================================================================
interface ModuleResource {
  id: string; name: string; type: 'pdf' | 'video' | 'template' | 'document' | 'link';
  url: string; dataUrl?: string; fileName?: string; size?: string;
}
interface ProgramModule {
  id: number; title: string; description: string; order: number;
  duration_minutes: number; is_published: boolean; materials_url: string;
  requires_evaluation: boolean; minimum_score: number;
  start_date: string | null; end_date: string | null;
  resources: ModuleResource[];
}
interface ProgramActivity {
  id: number | string; type: string; name: string; description: string; category: string;
  status: string; modality: string; start_date: string | null; end_date: string | null;
  target_role: string; is_mandatory: boolean; is_certificate_issued: boolean;
  meeting_url: string; location_address: string; modules: ProgramModule[];
  confirmed_count: number; attendance_count: number; created_at: string;
}
interface CompanyLite { id: string; name: string; slug: string; }
interface ProgramDetail {
  id: string; name: string; description: string; theme: string; status: string;
  company_id: string | null; company: CompanyLite | null;
  template?: { id: string; name: string; slug: string } | null;
  cohort_year?: number | null;
  design_snapshot?: Record<string, any> | null;
  activities: ProgramActivity[]; activities_count: number; participants_count: number;
  requires_certification: boolean; created_at: string | null; updated_at: string | null;
  banner_svg?: string | null;
  banner_image?: string | null;
}
interface Participant {
  id: string;
  user: { id: string; nombre: string; apellidos: string; full_name: string; email: string; telefono: string; avatar_url: string; headline: string; };
  role: string; status: string; invitation_sent_at: string | null; activated_at: string | null; created_at: string | null;
}
interface PM { id: string; full_name: string; email: string; role: string; avatar_url: string; }
interface AssignedPM { id: string; full_name: string; email: string; role: string; avatar_url: string; phone?: string; position?: string; }
interface CurrentUser { id: string; full_name: string; email: string; role: string; avatar_url?: string; }

// ============================================================================
// STATUS META
// ============================================================================
const STATUS_META: Record<string, { label: string; color: string; bg: string; ring: string; dot: string }> = {
  designed:            { label: 'Diseñado',            color: '#7c3aed', bg: '#f5f3ff', ring: '#ddd6fe', dot: '#a78bfa' },
  ready_for_execution: { label: 'Listo para ejecutar', color: '#0369a1', bg: '#f0f9ff', ring: '#bae6fd', dot: '#38bdf8' },
  in_execution:        { label: 'En ejecución',        color: '#047857', bg: '#ecfdf5', ring: '#a7f3d0', dot: '#10b981' },
  under_review:        { label: 'En revisión',         color: '#b45309', bg: '#fffbeb', ring: '#fde68a', dot: '#f59e0b' },
  closed:              { label: 'Cerrado',             color: '#475569', bg: '#f1f5f9', ring: '#cbd5e1', dot: '#94a3b8' },
  draft:               { label: 'Borrador',            color: '#64748b', bg: '#f8fafc', ring: '#e2e8f0', dot: '#94a3b8' },
  active:              { label: 'Activo',              color: '#047857', bg: '#ecfdf5', ring: '#a7f3d0', dot: '#10b981' },
  paused:              { label: 'Pausado',             color: '#b45309', bg: '#fffbeb', ring: '#fde68a', dot: '#f59e0b' },
  completed:           { label: 'Completado',          color: '#4338ca', bg: '#eef2ff', ring: '#c7d2fe', dot: '#6366f1' },
};
const ACTIVITY_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  created:    { label: 'Creada',     color: '#475569', bg: '#f1f5f9' },
  scheduled:  { label: 'Agendada',   color: '#0369a1', bg: '#f0f9ff' },
  in_progress:{ label: 'En curso',   color: '#047857', bg: '#ecfdf5' },
  completed:  { label: 'Completada', color: '#4338ca', bg: '#eef2ff' },
  cancelled:  { label: 'Cancelada',  color: '#b91c1c', bg: '#fef2f2' },
};
const MODALITY_META: Record<string, { label: string }> = {
  online: { label: 'Online' }, presencial: { label: 'Presencial' }, hybrid: { label: 'Híbrida' },
};

// ============================================================================
// SVG ICONS — all icons defined as components
// ============================================================================
type IconProps = { className?: string };
const SvgBase = (path: React.ReactNode, vb = '0 0 24 24') => {
  const Comp = ({ className = 'w-4 h-4' }: IconProps) => (
    <svg className={className} viewBox={vb} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{path}</svg>
  );
  Comp.displayName = 'Icon';
  return Comp;
};
const I = {
  Back:        SvgBase(<path d="M15 18l-6-6 6-6" />),
  Edit:        SvgBase(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>),
  Save:        SvgBase(<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>),
  Rocket:      SvgBase(<><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /></>),
  Plus:        SvgBase(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>),
  Trash:       SvgBase(<><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></>),
  User:        SvgBase(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  Users:       SvgBase(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  Calendar:    SvgBase(<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>),
  Sparkles:    SvgBase(<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />),
  Check:       SvgBase(<polyline points="20 6 9 17 4 12" />),
  CheckCircle: SvgBase(<><circle cx="12" cy="12" r="10" /><polyline points="9 12 12 15 17 10" /></>),
  Close:       SvgBase(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>),
  Eye:         SvgBase(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>),
  Link:        SvgBase(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>),
  Alert:       SvgBase(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>),
  Lock:        SvgBase(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  Search:      SvgBase(<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>),
  Logout:      SvgBase(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>),
  Building:    SvgBase(<><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M9 9h.01M9 13h.01M9 17h.01M13 9h.01M13 13h.01M13 17h.01M17 9h.01M17 13h.01M17 17h.01" /></>),
  Settings:    SvgBase(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  Layers:      SvgBase(<><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>),
  Clock:       SvgBase(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
  Award:       SvgBase(<><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>),
  Globe:       SvgBase(<><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>),
  Pin:         SvgBase(<><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14l-1.68-9.24a2 2 0 0 0-1.97-1.66H8.65a2 2 0 0 0-1.97 1.66L5 17z" /></>),
  Mail:        SvgBase(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>),
  Inbox:       SvgBase(<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>),
  ArrowRight:  SvgBase(<><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>),
  Activity:    SvgBase(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />),
  Module:      SvgBase(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>),
  Target:      SvgBase(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>),
  Bot:         SvgBase(<><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></>),
  Layout:      SvgBase(<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></>),
  Home:        SvgBase(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>),
  Chart:       SvgBase(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>),
  FileText:    SvgBase(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></>),
  Download:    SvgBase(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>),
  Upload:      SvgBase(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>),
  Refresh:     SvgBase(<><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>),
  Swap:        SvgBase(<><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>),
  Zap:         SvgBase(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />),
  Chevron:     SvgBase(<polyline points="6 9 12 15 18 9" />),
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  admin_root: 'Admin Root',
  inspiratoria_admin: 'PM · Admin',
  admin: 'Administrador',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ProgramManagerConsole() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const programId = params?.programId as string;

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [assignedPM, setAssignedPM] = useState<AssignedPM | null>(null);
  const [pms, setPms] = useState<PM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'info' | 'cronograma' | 'actividades' | 'participantes' | 'duplas' | 'gobierno' | 'reportes'>('resumen');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('studioSidebarCollapsed') : null;
    if (saved === 'true') setSidebarCollapsed(true);
  }, []);
  const toggleSidebar = () => {
    setSidebarCollapsed(c => {
      localStorage.setItem('studioSidebarCollapsed', String(!c));
      return !c;
    });
  };

  // Deep-link ?tab=<id> — usado por las redirecciones legacy (ex /activities, /participants, etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tab = new URLSearchParams(window.location.search).get('tab');
    const valid = ['resumen', 'info', 'cronograma', 'actividades', 'participantes', 'duplas', 'gobierno', 'reportes'];
    if (tab && valid.includes(tab)) setActiveTab(tab as typeof activeTab);
  }, []);

  // ── Auth gate ──
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) { setAuthChecked(true); setHasAccess(false); return; }
      const user: CurrentUser = JSON.parse(userStr);
      setCurrentUser(user);
      setHasAccess(ADMIN_ROLES.has(user.role));
    } catch {
      setHasAccess(false);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  // ── Data fetch ──
  const fetchProgram = useCallback(async () => {
    try {
      const [progRes, partRes, pmsRes] = await Promise.all([
        apiFetch(`${API_URL}/api/programs/${programId}`),
        apiFetch(`${API_URL}/api/programs/${programId}/participants`),
        apiFetch(`${API_URL}/api/companies/pms`),
      ]);
      if (!progRes.ok) throw new Error('No se pudo cargar el programa');
      const progData: ProgramDetail = await progRes.json();
      setProgram(progData);
      if (partRes.ok) setParticipants(await partRes.json());
      if (pmsRes.ok) setPms(await pmsRes.json());
      if (progData.company_id) {
        const pmRes = await apiFetch(`${API_URL}/api/companies/company/${progData.company_id}/pm`);
        if (pmRes.ok) {
          const pmData = await pmRes.json();
          setAssignedPM(pmData.assigned_pm || null);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    if (!authChecked) return;
    if (hasAccess) fetchProgram();
    else setLoading(false);
  }, [fetchProgram, authChecked, hasAccess]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const [generatingBanner, setGeneratingBanner] = useState(false);
  const generateBanner = async () => {
    setGeneratingBanner(true);
    try {
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/generate-banner`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProgram(prev => prev ? { ...prev, banner_svg: data.banner_svg } : prev);
      showToast('Fondo generado');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'No se pudo generar el fondo', 'error');
    } finally {
      setGeneratingBanner(false);
    }
  };

  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);
  const bannerImageInputRef = useRef<HTMLInputElement>(null);
  const uploadBannerImage = async (file: File) => {
    if (file.size > 3 * 1024 * 1024) { showToast('La imagen no debe superar 3 MB', 'error'); return; }
    setUploadingBannerImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/banner-image`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProgram(prev => prev ? { ...prev, banner_image: data.banner_image } : prev);
      showToast('Foto actualizada');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'No se pudo subir la imagen', 'error');
    } finally {
      setUploadingBannerImage(false);
    }
  };
  const removeBannerImage = async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/banner-image`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setProgram(prev => prev ? { ...prev, banner_image: null } : prev);
      showToast('Foto quitada');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'No se pudo quitar la imagen', 'error');
    }
  };

  const transitionStatus = async (newStatus: string) => {
    if (!program) return;
    try {
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/status?status=${newStatus}`, { method: 'PATCH' });
      if (!res.ok) throw new Error(await res.text());
      setProgram({ ...program, status: newStatus });
      showToast(`Programa movido a "${STATUS_META[newStatus]?.label ?? newStatus}"`);
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
  };

  const launchProgram = async () => {
    if (!program) return;
    try {
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/launch`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'No se pudo lanzar');
      showToast('Programa lanzado en producción');
      fetchProgram();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error al lanzar', 'error'); }
  };

  const patchInfo = async (patch: Partial<{ name: string; description: string; theme: string; requires_certification: boolean }>) => {
    if (!program) return;
    try {
      const res = await apiFetch(`${API_URL}/api/programs/${programId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProgram({ ...program, ...data });
      showToast('Cambios guardados');
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error al guardar', 'error'); }
  };

  const assignPM = async (pmId: string | null) => {
    if (!program?.company_id) return;
    try {
      const res = await apiFetch(`${API_URL}/api/companies/account/${program.company_id}/assign-pm`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pm_id: pmId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAssignedPM(data.assigned_pm || null);
      showToast(pmId ? 'PM asignado' : 'PM removido');
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('user'); localStorage.removeItem('auth_token'); router.push('/login');
  };

  const kpis = useMemo(() => {
    if (!program) return null;
    const acts = program.activities || [];
    const mentors = participants.filter(p => p.role === 'mentor').length;
    const mentees = participants.filter(p => p.role === 'mentee').length;
    const completed = acts.filter(a => a.status === 'completed').length;
    const inProgress = acts.filter(a => a.status === 'in_progress' || a.status === 'scheduled').length;
    const totalModules = acts.reduce((acc, a) => acc + (a.modules?.length || 0), 0);
    const totalMinutes = acts.reduce((acc, a) => acc + (a.modules || []).reduce((s, m) => s + (m.duration_minutes || 0), 0), 0);
    return { mentors, mentees, completed, inProgress, totalActivities: acts.length, totalModules, totalHours: Math.round(totalMinutes / 60) };
  }, [program, participants]);

  if (!authChecked) return <CenterPage><Spinner /></CenterPage>;

  if (!hasAccess) {
    return (
      <CenterPage>
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <I.Lock className="w-7 h-7" />
          </div>
          <h2 className="text-[17px] font-semibold text-zinc-900 mb-1">Acceso restringido</h2>
          <p className="text-[13px] text-zinc-500 mb-5">Esta consola solo está disponible para el Project Manager o administradores de Inspiratoria.</p>
          <div className="flex gap-2 justify-center">
            <Link href="/login" className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-[12.5px] font-semibold hover:bg-zinc-800">Iniciar sesión</Link>
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-700 text-[12.5px] font-semibold hover:bg-zinc-200">Volver</button>
          </div>
        </div>
      </CenterPage>
    );
  }

  if (loading) return <CenterPage><Spinner /></CenterPage>;

  if (error || !program) {
    return (
      <CenterPage>
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <I.Alert className="w-7 h-7" />
          </div>
          <h2 className="text-[17px] font-semibold text-zinc-900 mb-1">No se pudo cargar el programa</h2>
          <p className="text-[13px] text-zinc-500 mb-5">{error || 'Programa no encontrado'}</p>
          <button onClick={() => router.push(`/dashboard/accounts`)} className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-[12.5px] font-semibold hover:bg-zinc-800">Volver a cuentas</button>
        </div>
      </CenterPage>
    );
  }

  const stMeta = STATUS_META[program.status] || STATUS_META.draft;
  const undatedCount = (program.activities || []).filter(a => !a.start_date).length;
  const totalActs = (program.activities || []).length;
  const canMarkReady = totalActs > 0 && undatedCount === 0;

  const tryMarkReady = () => {
    if (!canMarkReady) {
      if (totalActs === 0) showToast('Crea al menos una actividad antes de marcar listo', 'error');
      else showToast(`Faltan ${undatedCount} actividad${undatedCount === 1 ? '' : 'es'} por calendarizar`, 'error');
      setActiveTab('cronograma');
      return;
    }
    transitionStatus('ready_for_execution');
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        program={program}
        slug={slug}
        activeTab={activeTab}
        onTab={(t) => setActiveTab(t)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
      />

      <main className={`flex-1 min-h-screen transition-[margin] duration-200 ${sidebarCollapsed ? 'ml-[76px]' : 'ml-64'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-zinc-100">
          <div className="px-8 py-3.5 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push(`/dashboard/accounts/${program.company_id}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition"
              >
                <I.Back className="w-3.5 h-3.5" /><span>Cuenta</span>
              </button>
              <span className="text-zinc-300 text-[12px]">/</span>
              <div className="text-[12.5px] text-zinc-500 truncate">
                <Link href={`/dashboard/accounts/${program.company_id}`} className="hover:text-zinc-900">{program.company?.name || slug}</Link>
                <span className="mx-1.5 text-zinc-300">/</span>
                <span className="text-zinc-900 font-semibold">{program.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11.5px] font-semibold" style={{ background: stMeta.bg, color: stMeta.color, boxShadow: `inset 0 0 0 1px ${stMeta.ring}` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: stMeta.dot }} />
                {stMeta.label}
              </span>
              {(program.status === 'designed' || program.status === 'draft') && (
                <ActionBtn
                  onClick={tryMarkReady}
                  icon={<I.Check />}
                  variant={canMarkReady ? 'ghost' : 'disabled'}
                  title={canMarkReady ? 'Pasar el programa a Listo para ejecutar' : `Calendariza todas las actividades primero (${undatedCount} sin fecha)`}
                >
                  Marcar lista{!canMarkReady && totalActs > 0 ? ` · ${undatedCount} sin fecha` : ''}
                </ActionBtn>
              )}
              {program.status === 'ready_for_execution' && (
                <ActionBtn onClick={launchProgram} icon={<I.Rocket />} variant="primary">Lanzar programa</ActionBtn>
              )}
              {(program.status === 'in_execution' || program.status === 'active') && (
                <ActionBtn onClick={() => transitionStatus('under_review')} icon={<I.Alert />} variant="ghost">A revisión</ActionBtn>
              )}
              {(program.status === 'in_execution' || program.status === 'active' || program.status === 'under_review') && (
                <ActionBtn onClick={() => transitionStatus('closed')} icon={<I.Close />} variant="danger">Cerrar</ActionBtn>
              )}
            </div>
          </div>
        </header>

        {/* Hero — solo en la pestaña Resumen */}
        {activeTab === 'resumen' && (() => {
          const [titleLine, ...subtitleParts] = program.name.split(' · ');
          const subtitleLine = subtitleParts.join(' · ');
          const fallbackGradient = HERO_FALLBACK_GRADIENTS[(program.theme || '').toLowerCase()] || HERO_FALLBACK_GRADIENTS.general;
          return (
            <section className="px-8 pt-7 bg-white border-b border-zinc-100">
              <div className="w-full">
                {/* Banner: foto propia si hay una, si no el fondo generado por IA, si no un degradado */}
                <div className="relative w-full rounded-2xl overflow-hidden mb-6" style={{ minHeight: 240, background: fallbackGradient }}>
                  {program.banner_image ? (
                    <img src={program.banner_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : program.banner_svg ? (
                    <div
                      className="absolute inset-0 w-full h-full [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: program.banner_svg }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-black/35" />

                  <input
                    ref={bannerImageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadBannerImage(f); e.target.value = ''; }}
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    {program.banner_image && (
                      <button
                        onClick={removeBannerImage}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-[11.5px] font-semibold transition"
                      >
                        <I.Close className="w-3.5 h-3.5" />
                        Quitar foto
                      </button>
                    )}
                    <button
                      onClick={() => bannerImageInputRef.current?.click()}
                      disabled={uploadingBannerImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-[11.5px] font-semibold transition disabled:opacity-60"
                    >
                      <I.Upload className="w-3.5 h-3.5" />
                      {uploadingBannerImage ? 'Subiendo…' : 'Subir foto'}
                    </button>
                    <button
                      onClick={generateBanner}
                      disabled={generatingBanner}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-[11.5px] font-semibold transition disabled:opacity-60"
                    >
                      <I.Sparkles className="w-3.5 h-3.5" />
                      {generatingBanner ? 'Generando…' : program.banner_svg ? 'Regenerar fondo' : 'Generar fondo con IA'}
                    </button>
                  </div>

                  <div className="relative z-[1] flex flex-col items-center justify-center text-center h-full px-7 py-10" style={{ minHeight: 240 }}>
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                      <TagOnDark>{program.theme}</TagOnDark>
                      <TagOnDark icon={<I.Building className="w-3 h-3" />}>{program.company?.name || 'Sin cuenta'}</TagOnDark>
                      {program.cohort_year ? <TagOnDark icon={<I.Calendar className="w-3 h-3" />}>{program.cohort_year}</TagOnDark> : null}
                      {program.requires_certification && <TagOnDark icon={<I.Award className="w-3 h-3" />}>Certificación</TagOnDark>}
                    </div>
                    <h1 className="text-[26px] font-semibold text-white tracking-tight leading-tight mb-1">{titleLine}</h1>
                    {subtitleLine && <p className="text-[14px] text-white/75 font-medium">{subtitleLine}</p>}
                  </div>
                </div>

                {program.description && (
                  <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-5 mb-6">
                    <p className="text-[13.5px] text-zinc-600 leading-relaxed max-w-3xl">{program.description}</p>
                  </div>
                )}

                {kpis && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pb-6">
                    <Kpi icon={<I.Users />} label="Participantes" value={program.participants_count} sub={`${kpis.mentors} mentores · ${kpis.mentees} mentees`} />
                    <Kpi icon={<I.Activity />} label="Actividades" value={kpis.totalActivities} sub={`${kpis.completed} completadas · ${kpis.inProgress} activas`} />
                    <Kpi icon={<I.Module />} label="Módulos" value={kpis.totalModules} sub={`${kpis.totalHours} h de contenido`} />
                    <Kpi icon={<I.Target />} label="Estado" value={stMeta.label} sub={program.updated_at ? `Actualizado ${formatDate(program.updated_at)}` : ''} />
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        <div className="px-8 py-7 w-full">
          {activeTab === 'resumen' && <TabResumen program={program} participants={participants} assignedPM={assignedPM} pms={pms} onAssignPM={assignPM} onTab={setActiveTab} />}
          {activeTab === 'info' && <TabInfo program={program} onSave={patchInfo} />}
          {activeTab === 'cronograma' && <TabCronograma programId={programId} activities={program.activities} onChange={fetchProgram} showToast={showToast} />}
          {activeTab === 'actividades' && <TabActividades programId={programId} activities={program.activities} onChange={fetchProgram} showToast={showToast} />}
          {activeTab === 'participantes' && <TabParticipantes participants={participants} programId={programId} onChange={fetchProgram} showToast={showToast} />}
          {activeTab === 'duplas' && <TabDuplas programId={programId} participants={participants} showToast={showToast} />}
          {activeTab === 'reportes' && <TabReportes program={program} participants={participants} assignedPM={assignedPM} showToast={showToast} />}
          {activeTab === 'gobierno' && <TabGobierno program={program} slug={slug} assignedPM={assignedPM} pms={pms} onTransition={transitionStatus} onAssignPM={assignPM} />}
        </div>
      </main>

      {toast && (
        <div className={`fixed bottom-6 right-6 inline-flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold border z-50 animate-slideup ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast.type === 'success' ? <I.CheckCircle className="w-4 h-4" /> : <I.Alert className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <style jsx global>{`
        @keyframes slideup { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideup { animation: slideup .25s ease-out; }
        @media print {
          aside, header.sticky { display: none !important; }
          main { margin-left: 0 !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// SIDEBAR
// ============================================================================
function Sidebar({ currentUser, onLogout, program, slug, activeTab, onTab, collapsed, onToggleCollapsed }: {
  currentUser: CurrentUser | null;
  onLogout: () => void;
  program: ProgramDetail;
  slug: string;
  activeTab: string;
  onTab: (t: 'resumen' | 'info' | 'cronograma' | 'actividades' | 'participantes' | 'duplas' | 'gobierno' | 'reportes') => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  type TabId = 'resumen' | 'info' | 'cronograma' | 'actividades' | 'participantes' | 'duplas' | 'gobierno' | 'reportes';
  const NAV_GROUPS: { label: string | null; items: { id: TabId; label: string; icon: React.ReactNode }[] }[] = [
    { label: null, items: [{ id: 'resumen', label: 'Resumen', icon: <I.Sparkles /> }] },
    {
      label: 'Programa',
      items: [
        { id: 'info', label: 'Información', icon: <I.Edit /> },
        { id: 'cronograma', label: 'Cronograma', icon: <I.Calendar /> },
        { id: 'actividades', label: 'Módulos', icon: <I.Module /> },
        { id: 'participantes', label: 'Participantes', icon: <I.Users /> },
        { id: 'duplas', label: 'Duplas', icon: <I.Bot /> },
      ],
    },
    {
      label: 'Gestión',
      items: [
        { id: 'reportes', label: 'Reportes', icon: <I.Chart /> },
        { id: 'gobierno', label: 'Gobierno', icon: <I.Settings /> },
      ],
    },
  ];

  const initials = (currentUser?.full_name || currentUser?.email || 'A').charAt(0).toUpperCase();
  const roleLabel = ROLE_LABELS[currentUser?.role || ''] || currentUser?.role || '';

  const NavItem = ({ id, label, icon }: { id: TabId; label: string; icon: React.ReactNode }) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => onTab(id)}
        title={collapsed ? label : undefined}
        className={`group/nav w-full flex items-center gap-2.5 rounded-lg text-[12.5px] font-medium transition-all relative ${
          collapsed ? 'justify-center px-0 py-2' : 'pl-3 pr-2 py-[7px]'
        } ${active ? 'bg-primary-50 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900'}`}
      >
        <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary-500 transition-all ${active ? 'h-5 opacity-100' : 'h-5 opacity-0'}`} />
        <span className={`w-[15px] h-[15px] flex-shrink-0 transition-colors ${active ? 'text-primary-700' : 'text-zinc-400 group-hover/nav:text-zinc-600'}`}>{icon}</span>
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    );
  };

  return (
    <aside className={`fixed left-0 top-0 bottom-0 bg-white border-r border-zinc-100 z-40 flex flex-col transition-[width] duration-200 ${collapsed ? 'w-[76px]' : 'w-64'}`}>
      {/* Marca */}
      <div className={`flex items-center h-16 flex-shrink-0 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
        <Link href="/dashboard" className="flex items-center gap-2.5 group min-w-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center overflow-hidden flex-shrink-0">
            <Image src="/images/logo.png" alt="Inspiratoria" width={32} height={32} className="object-cover" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-zinc-900 leading-tight tracking-tight">Inspiratoria</p>
              <p className="text-[10px] text-zinc-400 font-medium tracking-tight">Studio</p>
            </div>
          )}
        </Link>
        {!collapsed && (
          <button onClick={onToggleCollapsed} title="Colapsar" className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600 transition flex-shrink-0">
            <I.Back className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Contexto del programa */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="px-3 py-2.5 rounded-lg bg-zinc-50">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-zinc-400 truncate">{program.company?.name || slug}</p>
            <p className="text-[12.5px] font-semibold text-zinc-900 truncate mt-0.5 leading-snug">{program.name}</p>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center pb-3">
          <div title={program.name} className="w-9 h-9 rounded-lg bg-zinc-50 flex items-center justify-center text-[11px] font-bold text-zinc-500">
            {(program.company?.name || slug).charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 pt-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {group.label && !collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{group.label}</p>
            )}
            {group.label && collapsed && <div className="mx-2 mb-2 border-t border-zinc-100" />}
            <div className="space-y-0.5">
              {group.items.map(t => <NavItem key={t.id} {...t} />)}
            </div>
          </div>
        ))}

        <div className="mt-4 pt-3 border-t border-zinc-100 space-y-0.5">
          <Link href={`/studio/${slug}/dashboard`} title={collapsed ? 'Vista Corporativa' : undefined}
            className={`w-full flex items-center gap-2.5 rounded-lg text-[12px] text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 transition-colors ${collapsed ? 'justify-center px-0 py-2' : 'pl-3 pr-2 py-[7px]'}`}>
            <I.Layout className="w-[15px] h-[15px] text-zinc-400 flex-shrink-0" />
            {!collapsed && 'Vista Corporativa'}
          </Link>
          <Link href="/dashboard" title={collapsed ? 'Inicio admin' : undefined}
            className={`w-full flex items-center gap-2.5 rounded-lg text-[12px] text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900 transition-colors ${collapsed ? 'justify-center px-0 py-2' : 'pl-3 pr-2 py-[7px]'}`}>
            <I.Home className="w-[15px] h-[15px] text-zinc-400 flex-shrink-0" />
            {!collapsed && 'Inicio admin'}
          </Link>
          {collapsed && (
            <button onClick={onToggleCollapsed} title="Expandir" className="w-full flex items-center justify-center py-2 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition">
              <I.Back className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>
      </nav>

      {/* Usuario */}
      <div className={`py-3 border-t border-zinc-100 ${collapsed ? 'px-0 flex justify-center' : 'px-3'}`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? '' : 'px-1.5 py-1'}`}>
          {currentUser?.avatar_url ? (
            <img src={currentUser.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div title={collapsed ? (currentUser?.full_name || 'Admin') : undefined} className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0">
              {initials}
            </div>
          )}
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-zinc-900 truncate leading-tight">{currentUser?.full_name || 'Admin'}</p>
                <p className="text-[10.5px] text-zinc-400 truncate">{roleLabel}</p>
              </div>
              <button onClick={onLogout} title="Cerrar sesión" className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0">
                <I.Logout className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

// ============================================================================
// SHARED PRIMITIVES
// ============================================================================
function CenterPage({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">{children}</div>;
}
function Spinner() {
  return <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />;
}

function ActionBtn({ children, onClick, icon, variant, title }: { children: React.ReactNode; onClick: () => void; icon: React.ReactNode; variant: 'primary' | 'ghost' | 'danger' | 'disabled'; title?: string }) {
  const cls = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm',
    ghost: 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
    disabled: 'bg-zinc-50 text-zinc-400 border border-zinc-200 cursor-not-allowed',
  }[variant];
  return (
    <button onClick={onClick} title={title} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${cls}`}>
      <span className="w-3.5 h-3.5">{icon}</span>{children}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-900 border border-zinc-200">{children}</span>;
}
function TagSoft({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700">{icon}{children}</span>;
}
function TagAccent({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">{icon}{children}</span>;
}
function TagOnDark({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-white backdrop-blur-sm border border-white/10">{icon}{children}</span>;
}

// Degradado de respaldo del banner mientras no se generó (o falló) el SVG por IA —
// misma paleta por tema que usa el backend (programs/banner_service.py) para que
// combine si más tarde se genera el fondo real.
const HERO_FALLBACK_GRADIENTS: Record<string, string> = {
  leadership: 'linear-gradient(135deg, #0c4a6e 0%, #0e7490 40%, #0891b2 100%)',
  innovation: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 40%, #0ea5e9 100%)',
  diversity: 'linear-gradient(135deg, #134e4a 0%, #0f766e 40%, #14b8a6 100%)',
  onboarding: 'linear-gradient(135deg, #064e3b 0%, #047857 40%, #10b981 100%)',
  technical: 'linear-gradient(135deg, #0c4a6e 0%, #075985 40%, #0284c7 100%)',
  empleabilidad: 'linear-gradient(135deg, #3730a3 0%, #4338ca 40%, #6366f1 100%)',
  general: 'linear-gradient(135deg, #164e63 0%, #155e75 40%, #0891b2 100%)',
};

const KPI_ACCENTS: Record<string, { bg: string; fg: string }> = {
  indigo:  { bg: 'bg-zinc-100',  fg: 'text-zinc-800' },
  emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50',   fg: 'text-amber-600' },
  violet:  { bg: 'bg-zinc-100',  fg: 'text-zinc-800' },
};
function Kpi({ icon, label, value, sub, accent = 'indigo' }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: 'indigo' | 'emerald' | 'amber' | 'violet' }) {
  return (
    <div className="group bg-white rounded-xl border border-zinc-200/70 px-5 py-4 hover:border-zinc-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{label}</span>
        <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
          <span className="w-3.5 h-3.5">{icon}</span>
        </span>
      </div>
      <div className="text-[28px] font-semibold text-zinc-900 leading-none tracking-tight">{value}</div>
      {sub && <div className="mt-2 text-[11.5px] text-zinc-500">{sub}</div>}
    </div>
  );
}

function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-zinc-200/70 overflow-hidden">
      <header className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-zinc-100">
        <div>
          <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11.5px] text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Empty({ msg, icon }: { msg: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
        <span className="w-6 h-6">{icon || <I.Inbox />}</span>
      </div>
      <p className="text-[13px] text-zinc-500">{msg}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-lg text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition";

// ============================================================================
// TABS
// ============================================================================
// Barra de progreso etiquetada (porcentaje grande + barra + caption)
const PROGRESS_COLORS: Record<string, { bar: string; txt: string }> = {
  violet:  { bar: 'bg-blue-600', txt: 'text-zinc-900' },
  emerald: { bar: 'bg-blue-600', txt: 'text-zinc-900' },
  indigo:  { bar: 'bg-blue-600', txt: 'text-zinc-900' },
};
function ProgressStat({ label, pct, caption, color }: { label: string; pct: number; caption: string; color: 'violet' | 'emerald' | 'indigo' }) {
  const c = PROGRESS_COLORS[color];
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[12px] font-semibold text-zinc-700">{label}</span>
        <span className={`text-[22px] font-bold ${c.txt} leading-none tracking-tight`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div className={`h-full rounded-full ${c.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[11px] text-zinc-400 mt-2">{caption}</div>
    </div>
  );
}

// Barra de composición (rol -> conteo + %)
function CompositionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium text-zinc-700">{label}</span>
        <span className="text-[12px] font-semibold text-zinc-900">{count}<span className="text-zinc-400 font-normal"> · {pct}%</span></span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

type StudioTab = 'resumen' | 'info' | 'cronograma' | 'actividades' | 'participantes' | 'duplas' | 'gobierno' | 'reportes';

function TabResumen({ program, participants, assignedPM, pms, onAssignPM, onTab }: { program: ProgramDetail; participants: Participant[]; assignedPM: AssignedPM | null; pms: PM[]; onAssignPM: (id: string | null) => void; onTab: (t: StudioTab) => void }) {
  const acts = program.activities || [];
  const totalActs = acts.length;
  const completedActs = acts.filter(a => a.status === 'completed').length;
  const upcoming = acts
    .filter(a => a.start_date && new Date(a.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
    .slice(0, 4);

  const totalP = participants.length;
  const mentors = participants.filter(p => p.role === 'mentor').length;
  const mentees = participants.filter(p => p.role === 'mentee').length;
  const others = totalP - mentors - mentees;
  const activated = participants.filter(p => p.activated_at).length;
  const invited = participants.filter(p => p.invitation_sent_at).length;

  // Progreso del ciclo de vida según el estado
  const LIFECYCLE_PCT: Record<string, number> = {
    draft: 10, designed: 25, ready_for_execution: 55, under_review: 50,
    in_execution: 80, active: 80, closed: 100, completed: 100, paused: 70,
  };
  const lifePct = LIFECYCLE_PCT[program.status] ?? 25;
  const actPct = totalActs ? Math.round((completedActs / totalActs) * 100) : 0;
  const activationPct = totalP ? Math.round((activated / totalP) * 100) : 0;
  const stMeta = STATUS_META[program.status] || STATUS_META.draft;

  // Diseño congelado desde la plantilla (datos en BD que normalmente no se ven)
  const snap: any = program.design_snapshot || {};
  const snapModules: any[] = Array.isArray(snap.modules) ? snap.modules : [];
  const snapMilestones: any[] = Array.isArray(snap.milestones) ? snap.milestones : [];

  const QUICK_ACTIONS: { tab: StudioTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'info', label: 'Editar información', icon: <I.Edit className="w-4 h-4" /> },
    { tab: 'actividades', label: 'Módulos', icon: <I.Module className="w-4 h-4" /> },
    { tab: 'participantes', label: 'Participantes', icon: <I.Users className="w-4 h-4" /> },
    { tab: 'duplas', label: 'Duplas', icon: <I.Link className="w-4 h-4" /> },
    { tab: 'gobierno', label: 'Estado y PM', icon: <I.Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Acciones rápidas — a dónde ir para editar cada cosa */}
      <Card title="Gestionar este programa" subtitle="Esta vista es solo de lectura — edita desde acá">
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.tab}
              onClick={() => onTab(a.tab)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-700 text-[12.5px] font-semibold transition"
            >
              {a.icon}{a.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Progreso general (full width) */}
      <Card title="Progreso del programa" subtitle="Avance general de la cohorte">
        <div className="grid sm:grid-cols-3 gap-6">
          <ProgressStat label="Ciclo de vida" pct={lifePct} caption={stMeta.label} color="violet" />
          <ProgressStat label="Actividades completadas" pct={actPct} caption={`${completedActs} de ${totalActs} actividades`} color="emerald" />
          <ProgressStat label="Participantes activados" pct={activationPct} caption={`${activated} de ${totalP} activados`} color="indigo" />
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Composición de participantes */}
        <Card title="Composición de participantes" subtitle={`${totalP} miembros · ${invited} invitados`}>
          {totalP === 0 ? <Empty msg="Aún no hay participantes inscritos" icon={<I.Users />} /> : (
            <div className="space-y-4">
              <div className="space-y-3">
                <CompositionBar label="Mentores" count={mentors} total={totalP} color="#6366f1" />
                <CompositionBar label="Mentees" count={mentees} total={totalP} color="#8b5cf6" />
                {others > 0 && <CompositionBar label="Otros roles" count={others} total={totalP} color="#94a3b8" />}
              </div>
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-zinc-100">
                <div className="text-center"><div className="text-[18px] font-bold text-zinc-900 leading-none">{totalP}</div><div className="text-[10px] text-zinc-400 mt-1">Total</div></div>
                <div className="text-center"><div className="text-[18px] font-bold text-zinc-900 leading-none">{invited}</div><div className="text-[10px] text-zinc-400 mt-1">Invitados</div></div>
                <div className="text-center"><div className="text-[18px] font-bold text-emerald-600 leading-none">{activated}</div><div className="text-[10px] text-zinc-400 mt-1">Activados</div></div>
              </div>
            </div>
          )}
        </Card>

        <Card title="Workflow del programa" subtitle="Estado actual y siguientes pasos">
          <Workflow currentStatus={program.status} />
        </Card>

        <PMCard assignedPM={assignedPM} pms={pms} onAssignPM={onAssignPM} />

        <Card title="Próximas actividades" subtitle={`${upcoming.length} agendadas`}>
          {upcoming.length === 0 ? <Empty msg="No hay actividades agendadas a futuro" icon={<I.Calendar />} /> : (
            <div className="space-y-2">
              {upcoming.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-50 transition">
                  <div className="w-12 text-center bg-white rounded-lg py-1.5 border border-zinc-200 flex-shrink-0">
                    <div className="text-[18px] font-bold text-zinc-900 leading-none">{new Date(a.start_date!).getDate()}</div>
                    <div className="text-[9px] font-bold text-zinc-800 uppercase mt-0.5">{new Date(a.start_date!).toLocaleString('es', { month: 'short' })}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-zinc-900 truncate">{a.name}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1"><I.Globe className="w-3 h-3" />{MODALITY_META[a.modality]?.label || a.modality}</span>
                      <span className="inline-flex items-center gap-1"><I.Clock className="w-3 h-3" />{new Date(a.start_date!).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Roster reciente" subtitle={`${participants.length} miembros`}>
          {participants.length === 0 ? <Empty msg="Aún no hay participantes inscritos" icon={<I.Users />} /> : (
            <div className="grid grid-cols-2 gap-2">
              {participants.slice(0, 6).map(p => (
                <div key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-50">
                  {p.user.avatar_url ? (
                    <img src={p.user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                      {(p.user.full_name || p.user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-zinc-900 truncate">{p.user.full_name || p.user.email}</div>
                    <div className="text-[10px] text-zinc-500 capitalize">{p.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Diseño del programa (snapshot de la plantilla) */}
        <Card
          title="Diseño del programa"
          subtitle={program.template?.name ? `Desde «${program.template.name}»` : 'Estructura del programa'}
          action={program.template?.slug ? (
            <a href={`/dashboard/programs/preview/${program.template.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-[11.5px] font-semibold hover:bg-zinc-200 transition">
              <I.Layout className="w-3 h-3" />Plantilla
            </a>
          ) : undefined}
        >
          {(snapModules.length > 0 || snapMilestones.length > 0) ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-amber-50 px-4 py-3">
                  <div className="text-[22px] font-bold text-amber-700 leading-none">{snapModules.length}</div>
                  <div className="text-[11px] text-amber-700/70 mt-1 font-medium">Módulos diseñados</div>
                </div>
                <div className="rounded-xl bg-zinc-100 px-4 py-3">
                  <div className="text-[22px] font-bold text-zinc-900 leading-none">{snapMilestones.length}</div>
                  <div className="text-[11px] text-zinc-900/70 mt-1 font-medium">Hitos</div>
                </div>
              </div>
              {snapModules.length > 0 && (
                <div className="space-y-1.5">
                  {snapModules.slice(0, 5).map((m, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-50">
                      <span className="w-5 h-5 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-500 flex-shrink-0">{i + 1}</span>
                      <span className="text-[12.5px] font-medium text-zinc-800 truncate">{m.name || m.title || `Módulo ${i + 1}`}</span>
                    </div>
                  ))}
                  {snapModules.length > 5 && <div className="text-[11px] text-zinc-400 px-3">+{snapModules.length - 5} módulos más</div>}
                </div>
              )}
            </div>
          ) : (
            <Empty msg="Este programa no tiene diseño desde una plantilla" icon={<I.Module />} />
          )}
        </Card>
      </div>
    </div>
  );
}

function PMCard({ assignedPM, pms, onAssignPM }: { assignedPM: AssignedPM | null; pms: PM[]; onAssignPM: (id: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = pms.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card title="Project Manager asignado" subtitle="Responsable del programa para esta cuenta" action={
      <button onClick={() => setOpen(o => !o)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[11.5px] font-semibold hover:bg-zinc-800 transition">
        <I.Edit className="w-3 h-3" />{assignedPM ? 'Cambiar' : 'Asignar'}
      </button>
    }>
      {assignedPM ? (
        <div className="flex items-start gap-4">
          {assignedPM.avatar_url ? (
            <img src={assignedPM.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-[18px] font-bold text-white flex-shrink-0">
              {assignedPM.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-zinc-900">{assignedPM.full_name}</div>
            {assignedPM.position && <div className="text-[12px] text-zinc-600 mt-0.5">{assignedPM.position}</div>}
            <div className="text-[12px] text-zinc-500 mt-1.5 inline-flex items-center gap-1.5"><I.Mail className="w-3 h-3" />{assignedPM.email}</div>
            {assignedPM.phone && <div className="text-[12px] text-zinc-500 mt-1 inline-flex items-center gap-1.5"><I.Pin className="w-3 h-3" />{assignedPM.phone}</div>}
            <button onClick={() => onAssignPM(null)} className="mt-3 text-[11.5px] text-red-600 hover:text-red-700 font-semibold">Quitar PM</button>
          </div>
        </div>
      ) : (
        <Empty msg="No hay PM asignado a este programa" icon={<I.User />} />
      )}

      {open && (
        <div className="mt-5 pt-5 border-t border-zinc-100">
          <div className="relative mb-3">
            <I.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text" placeholder="Buscar PM por nombre o email…"
              value={search} onChange={e => setSearch(e.target.value)}
              className={`${inputCls} pl-9`}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-[12px] text-zinc-500 text-center py-4">No hay PMs disponibles</p>
            ) : filtered.map(p => (
              <button
                key={p.id}
                onClick={() => { onAssignPM(p.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 transition text-left ${assignedPM?.id === p.id ? 'bg-zinc-100 ring-1 ring-zinc-300' : ''}`}
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-zinc-900 truncate">{p.full_name}</div>
                  <div className="text-[10.5px] text-zinc-500 truncate">{p.email} · {ROLE_LABELS[p.role] || p.role}</div>
                </div>
                {assignedPM?.id === p.id && <I.Check className="w-4 h-4 text-zinc-800 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

const WORKFLOW_STEPS = [
  { id: 'designed',            label: 'Diseñado',     desc: 'Estructura definida' },
  { id: 'ready_for_execution', label: 'Listo',        desc: 'Usuarios cargados' },
  { id: 'in_execution',        label: 'En ejecución', desc: 'Programa activo' },
  { id: 'closed',              label: 'Cerrado',      desc: 'Programa finalizado' },
];
function Workflow({ currentStatus }: { currentStatus: string }) {
  const idx = WORKFLOW_STEPS.findIndex(s => s.id === currentStatus);
  const adjustedIdx = idx === -1 ? (currentStatus === 'active' ? 2 : currentStatus === 'completed' ? 3 : 0) : idx;
  return (
    <div className="flex items-start gap-1">
      {WORKFLOW_STEPS.map((s, i) => {
        const done = i <= adjustedIdx;
        const current = i === adjustedIdx;
        return (
          <div key={s.id} className="flex-1 relative flex flex-col items-center text-center">
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold transition ${
              done ? 'bg-gradient-to-br from-zinc-700 to-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400 border-2 border-zinc-200'
            } ${current ? 'ring-4 ring-zinc-200' : ''}`}>
              {i < adjustedIdx ? <I.Check className="w-4 h-4" /> : i + 1}
            </div>
            <div className="mt-2.5">
              <div className={`text-[11.5px] font-bold ${done ? 'text-zinc-900' : 'text-zinc-500'}`}>{s.label}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{s.desc}</div>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div className="absolute top-[18px] left-[calc(50%+18px)] right-[calc(-50%+18px)] h-[2px]" style={{ background: done ? 'linear-gradient(90deg, #7c3aed, #a78bfa)' : '#e5e7eb' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TabInfo({ program, onSave }: { program: ProgramDetail; onSave: (p: Partial<{ name: string; description: string; theme: string; requires_certification: boolean }>) => Promise<void> }) {
  const [name, setName] = useState(program.name);
  const [desc, setDesc] = useState(program.description);
  const [theme, setTheme] = useState(program.theme);
  const [requiresCert, setRequiresCert] = useState(program.requires_certification);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(program.name); setDesc(program.description); setTheme(program.theme); setRequiresCert(program.requires_certification);
  }, [program]);

  const dirty = name !== program.name || desc !== program.description || theme !== program.theme || requiresCert !== program.requires_certification;

  const handleSave = async () => { setSaving(true); await onSave({ name, description: desc, theme, requires_certification: requiresCert }); setSaving(false); };

  return (
    <Card title="Información del programa" subtitle="Datos públicos y configuración general">
      <div className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Nombre del programa">
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Tema / categoría">
            <input value={theme} onChange={e => setTheme(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Descripción">
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={5} className={inputCls} />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Cuenta cliente">
            <input value={program.company?.name || '—'} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
          </Field>
          <Field label="ID del programa">
            <input value={program.id} disabled className={`${inputCls} opacity-60 cursor-not-allowed font-mono text-[11px]`} />
          </Field>
        </div>

        <label className="flex items-start gap-3 p-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition cursor-pointer">
          <span className="relative flex-shrink-0 mt-0.5">
            <input type="checkbox" checked={requiresCert} onChange={e => setRequiresCert(e.target.checked)} className="sr-only peer" />
            <div className="w-10 bg-zinc-300 rounded-full peer-checked:bg-zinc-900 transition" style={{ height: '22px' }} />
            <div className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition ${requiresCert ? 'translate-x-[18px]' : ''}`} />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-zinc-900">Requiere certificación al finalizar</div>
            <div className="text-[11.5px] text-zinc-500 mt-0.5">Los participantes recibirán un certificado al completar todas las actividades obligatorias.</div>
          </div>
        </label>

        <div className="flex items-center gap-3 pt-3 border-t border-zinc-100">
          <button onClick={handleSave} disabled={!dirty || saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-[12.5px] font-semibold hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition">
            <I.Save className="w-3.5 h-3.5" />{saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {!dirty && <span className="text-[11.5px] text-zinc-400">Sin cambios pendientes</span>}
        </div>
      </div>
    </Card>
  );
}

type WizardState = {
  startDate: string; time: string;
  cadence: 'weekly' | 'biweekly' | 'monthly';
  durationMin: number; overwrite: boolean;
};
const CADENCE_LABELS: Record<WizardState['cadence'], string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };

async function patchActivityDates(programId: string, a: ProgramActivity, start: Date | null, end: Date | null): Promise<void> {
  const res = await apiFetch(`${API_URL}/api/activities/${a.id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      program_id: programId, name: a.name, description: a.description,
      type: a.type, category: a.category, modality: a.modality,
      start_date: start ? start.toISOString() : null,
      end_date: end ? end.toISOString() : null,
      is_mandatory: a.is_mandatory, is_certificate_issued: a.is_certificate_issued,
      meeting_url: a.meeting_url, location_address: a.location_address,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

function TabCronograma({ programId, activities, onChange, showToast }: { programId: string; activities: ProgramActivity[]; onChange: () => void; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizard, setWizard] = useState<WizardState>({
    startDate: new Date().toISOString().slice(0, 10),
    time: '10:00', cadence: 'weekly', durationMin: 90, overwrite: false,
  });
  const [busy, setBusy] = useState<Record<string | number, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string | number, { start: string; end: string }>>({});

  const dated = activities.filter(a => a.start_date);
  const undated = activities.filter(a => !a.start_date);
  const sorted = [...dated].sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());

  const setBusyFor = (id: string | number, v: boolean) => setBusy(prev => ({ ...prev, [id]: v }));
  const setDraft = (id: string | number, patch: Partial<{ start: string; end: string }>) => {
    setDrafts(prev => ({ ...prev, [id]: { start: prev[id]?.start ?? '', end: prev[id]?.end ?? '', ...patch } }));
  };

  const saveSingle = async (a: ProgramActivity) => {
    const d = drafts[a.id];
    const startStr = d?.start ?? (a.start_date ? a.start_date.slice(0, 16) : '');
    if (!startStr) { showToast('Define una fecha de inicio', 'error'); return; }
    const start = new Date(startStr);
    const endStr = d?.end ?? (a.end_date ? a.end_date.slice(0, 16) : '');
    const end = endStr ? new Date(endStr) : new Date(start.getTime() + 90 * 60000);
    if (end <= start) { showToast('La fecha de fin debe ser posterior al inicio', 'error'); return; }
    setBusyFor(a.id, true);
    try {
      await patchActivityDates(programId, a, start, end);
      setDrafts(prev => { const n = { ...prev }; delete n[a.id]; return n; });
      showToast('Fecha guardada');
      onChange();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
    finally { setBusyFor(a.id, false); }
  };

  const clearSingle = async (a: ProgramActivity) => {
    setBusyFor(a.id, true);
    try {
      await patchActivityDates(programId, a, null, null);
      setDrafts(prev => { const n = { ...prev }; delete n[a.id]; return n; });
      showToast('Fecha removida');
      onChange();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
    finally { setBusyFor(a.id, false); }
  };

  const runWizard = async () => {
    const targets = wizard.overwrite ? activities : undated;
    if (targets.length === 0) { showToast('No hay actividades para programar', 'error'); return; }
    if (!wizard.startDate || !wizard.time) { showToast('Define fecha y hora de inicio', 'error'); return; }
    const [hh, mm] = wizard.time.split(':').map(Number);
    const cadenceDays = wizard.cadence === 'weekly' ? 7 : wizard.cadence === 'biweekly' ? 14 : 0;
    const baseStr = `${wizard.startDate}T${wizard.time}:00`;
    const baseDate = new Date(baseStr);
    if (Number.isNaN(baseDate.getTime())) { showToast('Fecha inválida', 'error'); return; }

    let success = 0;
    for (let i = 0; i < targets.length; i++) {
      const a = targets[i];
      const start = new Date(baseDate);
      if (wizard.cadence === 'monthly') start.setMonth(start.getMonth() + i);
      else start.setDate(start.getDate() + i * cadenceDays);
      start.setHours(hh, mm, 0, 0);
      const end = new Date(start.getTime() + wizard.durationMin * 60000);
      try { await patchActivityDates(programId, a, start, end); success++; }
      catch { /* keep going */ }
    }
    showToast(`${success}/${targets.length} actividades programadas`);
    setWizardOpen(false);
    onChange();
  };

  return (
    <div className="space-y-5">
      {/* Status banner + Auto-schedule wizard */}
      <div className={`rounded-2xl border p-5 ${undated.length === 0 && activities.length > 0 ? 'bg-emerald-50 border-emerald-200' : activities.length === 0 ? 'bg-zinc-50 border-zinc-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${undated.length === 0 && activities.length > 0 ? 'bg-emerald-500' : activities.length === 0 ? 'bg-zinc-400' : 'bg-amber-500'}`}>
              {undated.length === 0 && activities.length > 0 ? <I.CheckCircle className="w-5 h-5" /> : <I.Alert className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-zinc-900">
                {activities.length === 0 ? 'Sin actividades' :
                  undated.length === 0 ? 'Todas las actividades están programadas' :
                  `${undated.length} de ${activities.length} actividad${undated.length === 1 ? '' : 'es'} sin fecha`}
              </div>
              <p className="text-[12px] text-zinc-600 mt-0.5">
                {activities.length === 0
                  ? 'Crea actividades en la pestaña Módulos para poder calendarizarlas.'
                  : undated.length === 0
                    ? 'Puedes pasar el programa a "Listo para ejecutar" desde la barra superior.'
                    : 'Calendariza todas las actividades antes de marcar el programa como listo.'}
              </p>
            </div>
          </div>
          {activities.length > 0 && (
            <button onClick={() => setWizardOpen(o => !o)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 transition flex-shrink-0">
              <I.Sparkles className="w-3.5 h-3.5" />
              {wizardOpen ? 'Cerrar asistente' : 'Asistente automático'}
            </button>
          )}
        </div>

        {wizardOpen && (
          <div className="mt-4 pt-4 border-t border-amber-200/60">
            <div className="grid md:grid-cols-5 gap-3">
              <Field label="Primera fecha">
                <input type="date" value={wizard.startDate} onChange={e => setWizard({ ...wizard, startDate: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Hora">
                <input type="time" value={wizard.time} onChange={e => setWizard({ ...wizard, time: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Cadencia">
                <select value={wizard.cadence} onChange={e => setWizard({ ...wizard, cadence: e.target.value as WizardState['cadence'] })} className={inputCls}>
                  {(Object.keys(CADENCE_LABELS) as WizardState['cadence'][]).map(k => <option key={k} value={k}>{CADENCE_LABELS[k]}</option>)}
                </select>
              </Field>
              <Field label="Duración (min)">
                <input type="number" min={15} step={15} value={wizard.durationMin} onChange={e => setWizard({ ...wizard, durationMin: Number(e.target.value) || 90 })} className={inputCls} />
              </Field>
              <div className="flex items-end">
                <button onClick={runWizard} className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 transition">
                  Programar {wizard.overwrite ? activities.length : undated.length}
                </button>
              </div>
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-[12px] text-zinc-700 cursor-pointer">
              <input type="checkbox" checked={wizard.overwrite} onChange={e => setWizard({ ...wizard, overwrite: e.target.checked })} className="w-4 h-4 accent-blue-600" />
              Sobrescribir fechas existentes (re-programar todas)
            </label>
            <p className="text-[11px] text-zinc-500 mt-2">
              Distribuirá las actividades comenzando el {wizard.startDate} a las {wizard.time} con cadencia {CADENCE_LABELS[wizard.cadence].toLowerCase()} y {wizard.durationMin} min de duración cada una.
            </p>
          </div>
        )}
      </div>

      {/* Per-activity scheduler */}
      {activities.length > 0 && (
        <Card title="Programar actividades" subtitle="Define manualmente la fecha y hora de cada actividad">
          <div className="space-y-2">
            {[...activities].sort((a, b) => {
              if (!a.start_date && !b.start_date) return 0;
              if (!a.start_date) return -1;
              if (!b.start_date) return 1;
              return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
            }).map(a => {
              const draft = drafts[a.id];
              const startVal = draft ? draft.start : (a.start_date ? a.start_date.slice(0, 16) : '');
              const endVal = draft ? draft.end : (a.end_date ? a.end_date.slice(0, 16) : '');
              const hasDate = !!a.start_date;
              const dirty = !!draft;
              const isBusy = !!busy[a.id];
              return (
                <div key={a.id} className={`p-4 rounded-xl border transition ${hasDate ? 'bg-white border-zinc-200' : 'bg-amber-50/40 border-amber-200'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${hasDate ? 'bg-zinc-100 text-zinc-800' : 'bg-amber-100 text-amber-700'}`}>
                      {hasDate ? <I.Calendar className="w-5 h-5" /> : <I.Alert className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold text-zinc-900">{a.name}</div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1"><I.Globe className="w-3 h-3" />{MODALITY_META[a.modality]?.label || a.modality}</span>
                        <span className="inline-flex items-center gap-1"><I.Module className="w-3 h-3" />{a.modules?.length || 0} recursos</span>
                        {hasDate && !dirty && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <I.CheckCircle className="w-3 h-3" />
                            {new Date(a.start_date!).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        )}
                        {!hasDate && !dirty && <span className="inline-flex items-center gap-1 text-amber-700 font-semibold"><I.Alert className="w-3 h-3" />Sin programar</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <Field label="Inicio">
                      <input type="datetime-local" value={startVal} onChange={e => setDraft(a.id, { start: e.target.value, end: drafts[a.id]?.end ?? endVal })} className={inputCls} />
                    </Field>
                    <Field label="Fin">
                      <input type="datetime-local" value={endVal} onChange={e => setDraft(a.id, { start: drafts[a.id]?.start ?? startVal, end: e.target.value })} className={inputCls} />
                    </Field>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveSingle(a)}
                        disabled={isBusy || (!dirty && hasDate)}
                        className="px-3 py-2.5 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center gap-1.5"
                      >
                        <I.Save className="w-3.5 h-3.5" />
                        {isBusy ? '…' : 'Guardar'}
                      </button>
                      {hasDate && (
                        <button onClick={() => clearSingle(a)} disabled={isBusy} className="px-3 py-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 text-[12px] font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-40 transition">
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Existing timeline */}
      {sorted.length > 0 && (
        <Card title="Línea de tiempo" subtitle={`${sorted.length} actividades programadas`}>
          <div className="space-y-1">
            {sorted.map((a, i) => {
              const date = new Date(a.start_date!);
              const aMeta = ACTIVITY_STATUS_META[a.status] || { label: a.status, color: '#64748b', bg: '#f1f5f9' };
              return (
                <div key={a.id} className="grid grid-cols-[80px_28px_1fr] gap-3 items-stretch py-2">
                  <div className="text-right pt-2">
                    <div className="text-[22px] font-bold text-zinc-900 leading-none">{date.getDate()}</div>
                    <div className="text-[9.5px] font-bold text-zinc-800 uppercase mt-1 tracking-widest">{date.toLocaleString('es', { month: 'short' })}</div>
                    <div className="text-[10.5px] text-zinc-500 mt-1">{date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="relative flex flex-col items-center pt-3">
                    <div className="w-3 h-3 rounded-full ring-4 flex-shrink-0" style={{ background: aMeta.color, boxShadow: `0 0 0 3px ${aMeta.bg}` }} />
                    {i < sorted.length - 1 && <div className="flex-1 w-[2px] bg-gradient-to-b from-zinc-200 to-transparent mt-1" />}
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-200 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-bold text-zinc-900">{a.name}</div>
                        {a.description && <div className="text-[12px] text-zinc-500 mt-1 leading-relaxed">{a.description}</div>}
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ background: aMeta.bg, color: aMeta.color }}>{aMeta.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 mt-2">
                      <span className="inline-flex items-center gap-1"><I.Globe className="w-3 h-3" />{MODALITY_META[a.modality]?.label || a.modality}</span>
                      <span className="inline-flex items-center gap-1"><I.Module className="w-3 h-3" />{a.modules?.length || 0} recursos</span>
                      {a.is_certificate_issued && <span className="inline-flex items-center gap-1 text-amber-600"><I.Award className="w-3 h-3" />Certifica</span>}
                      {a.meeting_url && <a href={a.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-zinc-800 hover:text-zinc-900"><I.Link className="w-3 h-3" />Sala</a>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

type ActivityFormState = {
  name: string; description: string; type: 'training' | 'event'; category: string; modality: string;
  start_date: string; end_date: string; is_certificate_issued: boolean; meeting_url: string; location_address: string;
};
const EMPTY_ACTIVITY: ActivityFormState = {
  name: '', description: '', type: 'training', category: 'mentoria', modality: 'online',
  start_date: '', end_date: '', is_certificate_issued: false, meeting_url: '', location_address: '',
};

function TabActividades({ programId, activities, onChange, showToast }: { programId: string; activities: ProgramActivity[]; onChange: () => void; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [form, setForm] = useState<ActivityFormState>(EMPTY_ACTIVITY);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  // Menú "Agregar módulo / Agregar recurso / Agregar actividad" del botón principal
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showModuloForm, setShowModuloForm] = useState(false);
  const [moduloForm, setModuloForm] = useState<ModuleFormState>(EMPTY_MODULE);
  const [savingModulo, setSavingModulo] = useState(false);

  // "Agregar recurso" por fila: despliega EL módulo sobre el que se hizo clic
  // (no uno por defecto) y le pide a su ModuleManager que abra el formulario
  // de "Nuevo recurso" automáticamente.
  const [pendingAutoCreate, setPendingAutoCreate] = useState<number | string | null>(null);
  const addResourceTo = (id: number | string) => {
    setExpandedId(id);
    setPendingAutoCreate(id);
  };

  const startEdit = (a: ProgramActivity) => {
    setEditingId(a.id);
    setForm({
      name: a.name, description: a.description, type: (a.type === 'training' ? 'training' : 'event') as 'training' | 'event',
      category: a.category || 'mentoria', modality: a.modality || 'online',
      start_date: a.start_date ? a.start_date.slice(0, 16) : '', end_date: a.end_date ? a.end_date.slice(0, 16) : '',
      is_certificate_issued: a.is_certificate_issued, meeting_url: a.meeting_url || '', location_address: a.location_address || '',
    });
    setShowForm(true);
  };
  const startCreate = () => { setEditingId(null); setForm(EMPTY_ACTIVITY); setShowForm(true); };
  const cancel = () => { setShowForm(false); setEditingId(null); };

  const startCreateModulo = () => {
    setShowCreateMenu(false);
    setModuloForm({ ...EMPTY_MODULE, title: `Módulo ${activities.length + 1}` });
    setShowModuloForm(true);
  };
  const cancelModulo = () => setShowModuloForm(false);
  const submitModulo = async () => {
    if (!moduloForm.title.trim()) { showToast('El título del módulo es obligatorio', 'error'); return; }
    setSavingModulo(true);
    try {
      // 1) Crea el contenedor (Activity) de forma transparente, usando el título del módulo
      const actRes = await apiFetch(`${API_URL}/api/activities/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId, name: moduloForm.title, description: moduloForm.description,
          type: 'training', category: 'mentoria', modality: 'online', is_certificate_issued: false,
        }),
      });
      if (!actRes.ok) throw new Error(await actRes.text());
      const activity = await actRes.json();
      // 2) Crea el módulo (Content) dentro de esa actividad
      const modRes = await apiFetch(`${API_URL}/api/activities/${activity.id}/modules`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: moduloForm.title, description: moduloForm.description, duration_minutes: moduloForm.duration_minutes,
          requires_evaluation: moduloForm.requires_evaluation, minimum_score: moduloForm.minimum_score,
          resources: moduloForm.resources,
        }),
      });
      if (!modRes.ok) throw new Error(await modRes.text());
      showToast('Módulo creado');
      cancelModulo(); onChange();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
    finally { setSavingModulo(false); }
  };

  const submit = async () => {
    if (!form.name.trim()) { showToast('El nombre es obligatorio', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        program_id: programId, name: form.name, description: form.description, type: form.type, category: form.category, modality: form.modality,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        is_mandatory: false, is_certificate_issued: form.is_certificate_issued, meeting_url: form.meeting_url, location_address: form.location_address,
      };
      const url = editingId ? `${API_URL}/api/activities/${editingId}` : `${API_URL}/api/activities/create`;
      const res = await apiFetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      showToast(editingId ? 'Actividad actualizada' : 'Actividad creada');
      cancel(); onChange();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (id: number | string) => {
    if (!confirm('¿Eliminar esta actividad?')) return;
    try {
      const res = await apiFetch(`${API_URL}/api/activities/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      showToast('Actividad eliminada'); onChange();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
  };

  return (
    <Card title="Módulos" subtitle={`${activities.length} actividad${activities.length === 1 ? '' : 'es'} en el programa`} action={
      !showForm && !showModuloForm ? (
        <div className="relative">
          <button onClick={() => setShowCreateMenu(o => !o)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 transition">
            <I.Plus className="w-3.5 h-3.5" />Agregar
          </button>
          {showCreateMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowCreateMenu(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-lg bg-white border border-zinc-200 shadow-lg z-20 overflow-hidden">
                <button onClick={startCreateModulo} className="w-full text-left px-3.5 py-2.5 text-[12.5px] font-semibold text-zinc-800 hover:bg-zinc-50 transition">
                  Agregar módulo nuevo
                </button>
                <div className="w-full text-left px-3.5 py-2.5 text-[12.5px] font-semibold text-zinc-400 flex items-center justify-between cursor-not-allowed">
                  Agregar actividad
                  <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-400">Próximamente</span>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null
    }>
      {showModuloForm && (
        <div className="mb-5 p-5 rounded-xl bg-zinc-100/40 border border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-zinc-900">Nuevo módulo</h3>
            <button onClick={cancelModulo} className="p-1.5 rounded-md text-zinc-500 hover:bg-white"><I.Close className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2"><Field label="Título"><input className={inputCls} value={moduloForm.title} onChange={e => setModuloForm({ ...moduloForm, title: e.target.value })} /></Field></div>
            <div className="md:col-span-2"><Field label="Descripción"><textarea className={inputCls} rows={2} value={moduloForm.description} onChange={e => setModuloForm({ ...moduloForm, description: e.target.value })} /></Field></div>
            <Field label="Duración (minutos)"><input type="number" min={1} className={inputCls} value={moduloForm.duration_minutes} onChange={e => setModuloForm({ ...moduloForm, duration_minutes: Number(e.target.value) })} /></Field>
            <Field label="Puntaje mínimo de aprobación (%)"><input type="number" min={0} max={100} className={inputCls} value={moduloForm.minimum_score} onChange={e => setModuloForm({ ...moduloForm, minimum_score: Number(e.target.value) })} disabled={!moduloForm.requires_evaluation} /></Field>
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2.5 text-[12.5px] text-zinc-700 cursor-pointer">
                <input type="checkbox" checked={moduloForm.requires_evaluation} onChange={e => setModuloForm({ ...moduloForm, requires_evaluation: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                Requiere evaluación para aprobar
              </label>
            </div>
          </div>
          <div className="border-t border-zinc-100">
            <ResourceManager resources={moduloForm.resources} onChange={(resources) => setModuloForm({ ...moduloForm, resources })} />
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-200">
            <button onClick={cancelModulo} className="px-3.5 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-[12px] font-semibold hover:bg-zinc-50">Cancelar</button>
            <button onClick={submitModulo} disabled={savingModulo} className="px-3.5 py-2 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold disabled:opacity-50">{savingModulo ? 'Guardando…' : 'Crear módulo'}</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mb-5 p-5 rounded-xl bg-zinc-100/40 border border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-zinc-900">{editingId ? 'Editar actividad' : 'Nueva actividad'}</h3>
            <button onClick={cancel} className="p-1.5 rounded-md text-zinc-500 hover:bg-white"><I.Close className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Nombre"><input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Tipo">
              <select className={inputCls} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'training' | 'event' })}>
                <option value="training">Entrenamiento</option><option value="event">Evento</option>
              </select>
            </Field>
            <Field label="Categoría">
              <select className={inputCls} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="mentoria">Mentoría</option><option value="taller">Taller</option><option value="webinar">Webinar</option>
                <option value="masterclass">Masterclass</option><option value="charla">Charla</option><option value="conferencia">Conferencia</option>
              </select>
            </Field>
            <Field label="Modalidad">
              <select className={inputCls} value={form.modality} onChange={e => setForm({ ...form, modality: e.target.value })}>
                <option value="online">Online</option><option value="presencial">Presencial</option><option value="hybrid">Híbrida</option>
              </select>
            </Field>
            <Field label="Inicio"><input type="datetime-local" className={inputCls} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="Fin"><input type="datetime-local" className={inputCls} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></Field>
            <div className="md:col-span-2"><Field label="Descripción"><textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field></div>
            {form.modality !== 'presencial' && (
              <div className="md:col-span-2"><Field label="URL de la sala (Meet se autogenera si se deja vacío)"><input className={inputCls} value={form.meeting_url} onChange={e => setForm({ ...form, meeting_url: e.target.value })} placeholder="https://meet.google.com/..." /></Field></div>
            )}
            {form.modality !== 'online' && (
              <div className="md:col-span-2"><Field label="Dirección"><input className={inputCls} value={form.location_address} onChange={e => setForm({ ...form, location_address: e.target.value })} /></Field></div>
            )}
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2.5 text-[12.5px] text-zinc-700 cursor-pointer">
                <input type="checkbox" checked={form.is_certificate_issued} onChange={e => setForm({ ...form, is_certificate_issued: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                Emite certificado al completar
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-zinc-200">
            <button onClick={cancel} className="px-4 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-[12px] font-semibold hover:bg-zinc-50">Cancelar</button>
            <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold disabled:opacity-50">{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear actividad'}</button>
          </div>
        </div>
      )}

      {activities.length === 0 && !showForm ? (
        <Empty msg="Aún no hay actividades. Crea la primera." icon={<I.Activity />} />
      ) : (
        <div className="space-y-2">
          {activities.map(a => {
            const aMeta = ACTIVITY_STATUS_META[a.status] || { label: a.status, color: '#64748b', bg: '#f1f5f9' };
            const isExpanded = expandedId === a.id;
            return (
              <div key={a.id} className="rounded-xl bg-white border border-zinc-200 hover:shadow-sm transition overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center flex-shrink-0">
                    {a.type === 'training' ? <I.Module className="w-5 h-5" /> : <I.Calendar className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[13.5px] font-bold text-zinc-900">{a.name}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: aMeta.bg, color: aMeta.color }}>{aMeta.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-zinc-500">
                      {a.start_date && <span className="inline-flex items-center gap-1"><I.Calendar className="w-3 h-3" />{new Date(a.start_date).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                      <span className="inline-flex items-center gap-1"><I.Globe className="w-3 h-3" />{MODALITY_META[a.modality]?.label || a.modality}</span>
                      <span className="inline-flex items-center gap-1"><I.Module className="w-3 h-3" />{a.modules?.length || 0} recursos</span>
                      {a.is_certificate_issued && <span className="inline-flex items-center gap-1 text-amber-600"><I.Award className="w-3 h-3" />Certifica</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {a.type !== 'event' && (
                      <>
                        <button
                          onClick={() => addResourceTo(a.id)}
                          title="Agregar recurso a este módulo"
                          className="px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition inline-flex items-center gap-1.5 text-[12px] font-semibold"
                        >
                          <I.Plus className="w-3.5 h-3.5" />
                          Recurso
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                          className="px-3 py-2 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition inline-flex items-center gap-1.5 text-[12px] font-semibold"
                        >
                          <I.Layers className="w-3.5 h-3.5" />
                          Recursos
                          <I.Chevron className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </>
                    )}
                    <button onClick={() => startEdit(a)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"><I.Edit className="w-4 h-4" /></button>
                    <button onClick={() => remove(a.id)} className="p-2 rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600 transition"><I.Trash className="w-4 h-4" /></button>
                  </div>
                </div>
                {isExpanded && a.type !== 'event' && (
                  <ModuleManager
                    activityId={a.id}
                    modules={a.modules || []}
                    onChange={onChange}
                    showToast={showToast}
                    autoOpenCreate={pendingAutoCreate === a.id}
                    onAutoOpenConsumed={() => setPendingAutoCreate(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

interface ModuleFormState {
  title: string; description: string; duration_minutes: number;
  requires_evaluation: boolean; minimum_score: number;
  start_date: string; end_date: string; resources: ModuleResource[];
}
const EMPTY_MODULE: ModuleFormState = {
  title: '', description: '', duration_minutes: 60,
  requires_evaluation: false, minimum_score: 70,
  start_date: '', end_date: '', resources: [],
};

const RESOURCE_TYPE_META: Record<ModuleResource['type'], { label: string; icon: keyof typeof I; color: string; bg: string; accept: string }> = {
  pdf: { label: 'PDF', icon: 'FileText', color: '#dc2626', bg: '#fef2f2', accept: '.pdf' },
  video: { label: 'Video', icon: 'Activity', color: '#2563eb', bg: '#eff6ff', accept: '.mp4,.mov,.avi,.webm,.mkv' },
  template: { label: 'Template', icon: 'Layout', color: '#d97706', bg: '#fffbeb', accept: '.doc,.docx,.xlsx,.xls,.pptx,.ppt,.csv' },
  document: { label: 'Doc', icon: 'FileText', color: '#525252', bg: '#f5f5f5', accept: '.doc,.docx,.txt,.rtf,.xlsx,.xls,.pptx,.ppt,.csv,.pdf' },
  link: { label: 'Link', icon: 'Link', color: '#4f46e5', bg: '#eef2ff', accept: '' },
};

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return null;
}

function dataUrlToBlobUrl(dataUrl: string): string {
  const [head, b64] = dataUrl.split(',');
  const mime = head.match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([arr], { type: mime }));
}

function ResourceManager({ resources, onChange }: { resources: ModuleResource[]; onChange: (r: ModuleResource[]) => void }) {
  const [curType, setCurType] = useState<ModuleResource['type']>('pdf');
  const [linkInput, setLinkInput] = useState('');
  const [linkNameInput, setLinkNameInput] = useState('');
  const [videoMode, setVideoMode] = useState<'url' | 'file'>('url');
  const [viewing, setViewing] = useState<ModuleResource | null>(null);
  const [viewBlobUrl, setViewBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!viewing) { if (viewBlobUrl) URL.revokeObjectURL(viewBlobUrl); setViewBlobUrl(null); return; }
    const src = viewing.dataUrl || viewing.url || '';
    setViewBlobUrl(src.startsWith('data:') ? dataUrlToBlobUrl(src) : src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing]);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Promise.all(Array.from(files).map((file) => new Promise<ModuleResource>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: curType,
        url: '',
        dataUrl: reader.result as string,
        fileName: file.name,
        size: file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
      reader.readAsDataURL(file);
    }))).then((added) => onChange([...resources, ...added]));
  };

  const addLinkResource = () => {
    const url = linkInput.trim();
    if (!url) return;
    const name = linkNameInput.trim() || url.replace(/^https?:\/\//, '').split('/')[0];
    onChange([...resources, { id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, type: curType, url }]);
    setLinkInput(''); setLinkNameInput('');
  };

  const updateName = (id: string, name: string) => onChange(resources.map(r => r.id === id ? { ...r, name } : r));
  const remove = (id: string) => onChange(resources.filter(r => r.id !== id));

  const openFilePicker = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true;
    input.accept = RESOURCE_TYPE_META[curType].accept;
    input.onchange = (ev) => handleFileUpload((ev.target as HTMLInputElement).files);
    input.click();
  };

  const canView = (r: ModuleResource) => (r.type === 'pdf' || r.type === 'video') && (r.dataUrl || (r.type === 'video' && getVideoEmbedUrl(r.url)));

  return (
    <div className="pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-zinc-700">Archivos adjuntos ({resources.length})</span>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1.5 mb-2.5 flex-wrap">
        {(Object.keys(RESOURCE_TYPE_META) as ModuleResource['type'][]).map((t) => {
          const meta = RESOURCE_TYPE_META[t];
          const TIcon = I[meta.icon];
          const active = curType === t;
          return (
            <button key={t} type="button" onClick={() => setCurType(t)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold border transition"
              style={active ? { background: meta.bg, color: meta.color, borderColor: meta.color } : { background: '#fff', color: '#71717a', borderColor: '#e5e7eb' }}>
              <TIcon className="w-3.5 h-3.5" />{meta.label}
            </button>
          );
        })}
      </div>

      {/* Input area per type */}
      {curType === 'link' ? (
        <div className="flex gap-2 mb-2.5">
          <input type="text" placeholder="Nombre (opcional)" value={linkNameInput} onChange={e => setLinkNameInput(e.target.value)} className={inputCls + ' flex-1'} />
          <input type="url" placeholder="https://..." value={linkInput} onChange={e => setLinkInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLinkResource(); } }} className={inputCls + ' flex-1'} />
          <button onClick={addLinkResource} disabled={!linkInput.trim()} className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold disabled:opacity-40">Agregar</button>
        </div>
      ) : curType === 'video' ? (
        <div className="mb-2.5">
          <div className="flex gap-2 mb-2">
            <button type="button" onClick={() => setVideoMode('url')} className={`flex-1 text-[11.5px] font-semibold py-1.5 rounded-lg border ${videoMode === 'url' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-zinc-200 text-zinc-500'}`}>URL de video</button>
            <button type="button" onClick={() => setVideoMode('file')} className={`flex-1 text-[11.5px] font-semibold py-1.5 rounded-lg border ${videoMode === 'file' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-zinc-200 text-zinc-500'}`}>Subir archivo</button>
          </div>
          {videoMode === 'url' ? (
            <div className="flex gap-2">
              <input type="text" placeholder="Nombre (opcional)" value={linkNameInput} onChange={e => setLinkNameInput(e.target.value)} className={inputCls + ' flex-1'} />
              <input type="url" placeholder="https://youtube.com/watch?v=..." value={linkInput} onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLinkResource(); } }} className={inputCls + ' flex-1'} />
              <button onClick={addLinkResource} disabled={!linkInput.trim()} className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold disabled:opacity-40">Agregar</button>
            </div>
          ) : (
            <div onClick={openFilePicker} className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 p-4 text-center cursor-pointer hover:bg-blue-50 transition">
              <I.Activity className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
              <p className="text-[12px] text-blue-600 font-medium">Haz clic para subir video</p>
            </div>
          )}
        </div>
      ) : (
        <div onClick={openFilePicker} className="rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition mb-2.5"
          style={{ borderColor: RESOURCE_TYPE_META[curType].color + '55', background: RESOURCE_TYPE_META[curType].bg, color: RESOURCE_TYPE_META[curType].color }}>
          <I.FileText className="w-5 h-5 mx-auto mb-1.5" />
          <p className="text-[12px] text-zinc-600">Haz clic para subir {RESOURCE_TYPE_META[curType].label}</p>
        </div>
      )}

      {/* Resource list */}
      {resources.length > 0 && (
        <div className="space-y-1.5">
          {resources.map((r) => {
            const meta = RESOURCE_TYPE_META[r.type];
            const RIcon = I[meta.icon];
            return (
              <div key={r.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-zinc-200 group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>
                  <RIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => canView(r) ? setViewing(r) : (r.url && window.open(r.url, '_blank'))}>
                  <input type="text" value={r.name} onChange={e => updateName(r.id, e.target.value)} onClick={e => e.stopPropagation()}
                    className="text-[12.5px] font-semibold text-zinc-900 bg-transparent border-none outline-none w-full p-0" />
                  <p className="text-[11px] text-zinc-400 truncate">{r.fileName || r.url || 'Sin archivo'}{r.size && ` • ${r.size}`}</p>
                </div>
                <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                <button onClick={() => remove(r.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"><I.Trash className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}

      {/* Viewer modal */}
      {viewing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-6" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl overflow-hidden flex flex-col w-full max-w-3xl h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <span className="text-[13px] font-semibold text-zinc-900">{viewing.name}</span>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100"><I.Close className="w-4 h-4" /></button>
            </div>
            <div className="flex-1">
              {viewing.type === 'pdf' && viewBlobUrl && (
                <iframe src={viewBlobUrl} title={viewing.name} className="w-full h-full border-0" />
              )}
              {viewing.type === 'video' && viewing.dataUrl && viewBlobUrl && (
                <video src={viewBlobUrl} controls autoPlay className="w-full h-full bg-zinc-900" />
              )}
              {viewing.type === 'video' && !viewing.dataUrl && getVideoEmbedUrl(viewing.url) && (
                <iframe src={getVideoEmbedUrl(viewing.url)!} title={viewing.name} className="w-full h-full border-0" allow="autoplay; fullscreen" allowFullScreen />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleManager({ activityId, modules, onChange, showToast, autoOpenCreate, onAutoOpenConsumed }: { activityId: number | string; modules: ProgramModule[]; onChange: () => void; showToast: (m: string, t?: 'success' | 'error') => void; autoOpenCreate?: boolean; onAutoOpenConsumed?: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ModuleFormState>(EMPTY_MODULE);
  const [saving, setSaving] = useState(false);

  const startCreate = () => { setEditingId(null); setForm(EMPTY_MODULE); setShowForm(true); };

  // Al llegar acá vía el botón "Recurso" de la fila del módulo, abrir directo
  // el formulario de "Nuevo recurso" — el módulo ya se desplegó solo.
  useEffect(() => {
    if (autoOpenCreate) {
      startCreate();
      onAutoOpenConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenCreate]);

  const startEdit = (m: ProgramModule) => {
    setEditingId(m.id);
    setForm({
      title: m.title, description: m.description, duration_minutes: m.duration_minutes,
      requires_evaluation: m.requires_evaluation, minimum_score: m.minimum_score,
      start_date: m.start_date ? m.start_date.slice(0, 16) : '', end_date: m.end_date ? m.end_date.slice(0, 16) : '',
      resources: m.resources || [],
    });
    setShowForm(true);
  };
  const cancel = () => { setShowForm(false); setEditingId(null); };

  const submit = async () => {
    if (!form.title.trim()) { showToast('El título del recurso es obligatorio', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title, description: form.description, duration_minutes: form.duration_minutes,
        requires_evaluation: form.requires_evaluation, minimum_score: form.minimum_score,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        resources: form.resources,
      };
      const url = editingId ? `${API_URL}/api/modules/${editingId}` : `${API_URL}/api/activities/${activityId}/modules`;
      const res = await apiFetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      showToast(editingId ? 'Recurso actualizado' : 'Recurso creado');
      cancel(); onChange();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar este recurso? Esta acción no se puede deshacer.')) return;
    try {
      const res = await apiFetch(`${API_URL}/api/modules/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      showToast('Recurso eliminado'); onChange();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
  };

  const togglePublish = async (m: ProgramModule) => {
    try {
      const res = await apiFetch(`${API_URL}/api/modules/${m.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_published: !m.is_published }),
      });
      if (!res.ok) throw new Error(await res.text());
      showToast(m.is_published ? 'Recurso despublicado' : 'Recurso publicado'); onChange();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
  };

  const sorted = [...modules].sort((a, b) => a.order - b.order);

  return (
    <div className="border-t border-zinc-200 bg-zinc-50/60 p-4">
      {showForm && (
        <div className="mb-4 p-4 rounded-xl bg-white border border-zinc-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[13px] font-bold text-zinc-900">{editingId ? 'Editar recurso' : 'Nuevo recurso'}</h4>
            <button onClick={cancel} className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100"><I.Close className="w-4 h-4" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2"><Field label="Título"><input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field></div>
            <div className="md:col-span-2"><Field label="Descripción"><textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field></div>
            <Field label="Duración (minutos)"><input type="number" min={1} className={inputCls} value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></Field>
            <Field label="Puntaje mínimo de aprobación (%)"><input type="number" min={0} max={100} className={inputCls} value={form.minimum_score} onChange={e => setForm({ ...form, minimum_score: Number(e.target.value) })} disabled={!form.requires_evaluation} /></Field>
            <Field label="Inicio"><input type="datetime-local" className={inputCls} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></Field>
            <Field label="Fin"><input type="datetime-local" className={inputCls} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></Field>
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2.5 text-[12.5px] text-zinc-700 cursor-pointer">
                <input type="checkbox" checked={form.requires_evaluation} onChange={e => setForm({ ...form, requires_evaluation: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                Requiere evaluación para aprobar
              </label>
            </div>
          </div>

          <div className="border-t border-zinc-100">
            <ResourceManager resources={form.resources} onChange={(resources) => setForm({ ...form, resources })} />
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-200">
            <button onClick={cancel} className="px-3.5 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-[12px] font-semibold hover:bg-zinc-50">Cancelar</button>
            <button onClick={submit} disabled={saving} className="px-3.5 py-2 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold disabled:opacity-50">{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear recurso'}</button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !showForm ? (
        <div className="text-center py-6">
          <p className="text-[12.5px] text-zinc-500 mb-3">Este módulo todavía no tiene recursos.</p>
          <button onClick={startCreate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 transition">
            <I.Plus className="w-3.5 h-3.5" />Agregar recurso
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {sorted.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-zinc-200">
                <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-semibold text-zinc-900 truncate">{m.title}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${m.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                      {m.is_published ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                    <span className="inline-flex items-center gap-1"><I.Clock className="w-3 h-3" />{m.duration_minutes} min</span>
                    <span className="inline-flex items-center gap-1"><I.FileText className="w-3 h-3" />{(m.resources || []).length} archivos</span>
                    {m.requires_evaluation && <span className="inline-flex items-center gap-1"><I.Award className="w-3 h-3" />Aprobar con {m.minimum_score}%</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => togglePublish(m)} className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition" title={m.is_published ? 'Despublicar' : 'Publicar'}><I.Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => startEdit(m)} className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"><I.Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(m.id)} className="p-1.5 rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-600 transition"><I.Trash className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          {!showForm && (
            <button onClick={startCreate} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-[12px] font-semibold hover:bg-zinc-50 transition">
              <I.Plus className="w-3.5 h-3.5" />Agregar recurso
            </button>
          )}
        </>
      )}
    </div>
  );
}

type ParticipantRole = 'mentor' | 'mentee' | 'facilitator' | 'participant_cell';

const PARTICIPANT_ROLE_LABEL: Record<string, string> = {
  mentor: 'Mentor',
  mentee: 'Mentee',
  facilitator: 'Facilitador',
  participant_cell: 'Participante',
};

const PARTICIPANT_ROLE_BADGE: Record<string, string> = {
  mentor: 'bg-zinc-100 text-zinc-900',
  mentee: 'bg-sky-50 text-sky-700',
  facilitator: 'bg-amber-50 text-amber-700',
  participant_cell: 'bg-slate-100 text-slate-700',
};

interface UserSearchHit {
  id: string; email: string; nombre?: string; apellidos?: string;
  first_name?: string; last_name?: string; role: string; company: string | null; is_onboarded: boolean;
}

function TabParticipantes({ participants, programId, onChange, showToast }: { participants: Participant[]; programId: string; onChange: () => void; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [filter, setFilter] = useState<'all' | ParticipantRole>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [enrollLink, setEnrollLink] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const viewAsParticipant = async (p: Participant) => {
    setPreviewingId(p.id);
    try {
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/participants/${p.id}/preview-portal`);
      if (!res.ok) throw new Error('No se pudo abrir la vista previa');
      const data = await res.json();
      if (!data.portal_code) throw new Error('Esta persona todavía no tiene portal asignado');
      window.open(`/p/${data.portal_code}?preview=admin`, '_blank', 'noopener');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'No se pudo abrir la vista previa', 'error');
    } finally {
      setPreviewingId(null);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEnrollLink(`${window.location.origin}/enroll/${programId}`);
    }
  }, [programId]);

  const stats = {
    total: participants.length,
    mentors: participants.filter(p => p.role === 'mentor').length,
    mentees: participants.filter(p => p.role === 'mentee').length,
    facilitators: participants.filter(p => p.role === 'facilitator').length,
    others: participants.filter(p => !['mentor', 'mentee', 'facilitator'].includes(p.role)).length,
    pending: participants.filter(p => p.status === 'pending').length,
    active: participants.filter(p => p.status === 'active').length,
  };

  const filtered = participants.filter(p => {
    if (filter !== 'all' && p.role !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (p.user.full_name || `${p.user.nombre || ''} ${p.user.apellidos || ''}`).toLowerCase();
      if (!name.includes(q) && !p.user.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const remove = async (id: string) => {
    if (!confirm('¿Quitar este participante del programa?')) return;
    try {
      setBusyId(id);
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/participants/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      showToast('Participante removido'); onChange();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    } finally { setBusyId(null); }
  };

  const resend = async (id: string, email: string) => {
    try {
      setBusyId(id);
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/participants/${id}/resend-invitation`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      showToast(`Invitación reenviada a ${email}`);
      onChange();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    } finally { setBusyId(null); }
  };

  const copyEnrollLink = async () => {
    try {
      await navigator.clipboard.writeText(enrollLink);
      showToast('Link de inscripción copiado al portapapeles');
    } catch {
      showToast('No se pudo copiar el link', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Self-enroll link banner */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-800">
          <I.Link className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-zinc-900 uppercase tracking-wider">Link de auto-inscripción</div>
          <div className="text-[11.5px] text-zinc-600 mt-0.5">Compártelo para que cualquier persona pueda registrarse al programa por sí misma.</div>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={enrollLink} className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-[12px] text-zinc-700 font-mono" />
            <button onClick={copyEnrollLink} className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 transition flex-shrink-0">Copiar</button>
            <a href={enrollLink} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-[12px] font-semibold text-zinc-700 hover:border-zinc-300 transition flex-shrink-0">Abrir</a>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Total', value: stats.total, color: 'text-zinc-900' },
          { label: 'Mentores', value: stats.mentors, color: 'text-zinc-900' },
          { label: 'Mentees', value: stats.mentees, color: 'text-sky-700' },
          { label: 'Facilitadores', value: stats.facilitators, color: 'text-amber-700' },
          { label: 'Pendientes', value: stats.pending, color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-xl p-3">
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-[10.5px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <Card
        title="Participantes"
        subtitle={`${stats.total} miembros · ${stats.active} activos · ${stats.pending} pendientes de activar`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <I.Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar nombre o email…"
                className="pl-7 pr-3 py-1.5 rounded-lg border border-zinc-200 text-[12px] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 w-48"
              />
            </div>
            <div className="inline-flex p-1 bg-zinc-100 rounded-lg">
              {([
                { key: 'all', label: 'Todos' },
                { key: 'mentor', label: 'Mentores' },
                { key: 'mentee', label: 'Mentees' },
                { key: 'facilitator', label: 'Facilit.' },
                { key: 'participant_cell', label: 'Particip.' },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${filter === f.key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold hover:bg-zinc-800 transition">
              <I.Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <Empty msg={participants.length === 0 ? 'Aún no hay participantes. Agrega el primero o comparte el link de inscripción.' : 'Sin participantes en esta categoría'} icon={<I.Users />} />
        ) : (
          <div className="space-y-2">
            {filtered.map(p => {
              const name = p.user.full_name || `${p.user.nombre || ''} ${p.user.apellidos || ''}`.trim() || p.user.email;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/40 transition-colors">
                  {p.user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-bold text-zinc-900">{name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${PARTICIPANT_ROLE_BADGE[p.role] || 'bg-zinc-100 text-zinc-600'}`}>
                        {PARTICIPANT_ROLE_LABEL[p.role] || p.role}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                        p.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        p.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                        'bg-zinc-100 text-zinc-600'
                      }`}>
                        {p.status === 'active' ? 'Activo' : p.status === 'pending' ? 'Pendiente' : p.status}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-zinc-500 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span>{p.user.email}</span>
                      {p.user.telefono && <><span>·</span><span>{p.user.telefono}</span></>}
                      {p.invitation_sent_at && (
                        <><span>·</span><span>Invitado {new Date(p.invitation_sent_at).toLocaleDateString('es-CL')}</span></>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {(p.role === 'mentor' || p.role === 'mentee') && (
                      <button
                        onClick={() => viewAsParticipant(p)}
                        disabled={previewingId === p.id}
                        title="Ver como este participante — vista previa de solo lectura, no cuenta como acceso real"
                        className="p-2 rounded-lg text-zinc-400 hover:bg-blue-50 hover:text-blue-600 transition disabled:opacity-40"
                      >
                        {previewingId === p.id ? <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin inline-block" /> : <I.Eye className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => resend(p.id, p.user.email)}
                      disabled={busyId === p.id}
                      title="Reenviar invitación por email"
                      className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition disabled:opacity-40"
                    >
                      <I.Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      disabled={busyId === p.id}
                      title="Quitar del programa"
                      className="p-2 rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
                    >
                      <I.Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showAdd && (
        <AddParticipantModal
          programId={programId}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); onChange(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function AddParticipantModal({ programId, onClose, onAdded, showToast }: { programId: string; onClose: () => void; onAdded: () => void; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [tab, setTab] = useState<'search' | 'create'>('search');
  const [role, setRole] = useState<ParticipantRole>('mentee');
  const [sendInvitation, setSendInvitation] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // search
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<UserSearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  // create
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (tab !== 'search') return;
    if (query.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiFetch(`${API_URL}/api/programs/users/search?q=${encodeURIComponent(query.trim())}&exclude_program_id=${programId}&limit=10`);
        if (res.ok) setHits(await res.json());
      } finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [query, tab, programId]);

  const enroll = async (userId: string) => {
    try {
      setSubmitting(true);
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role, status: sendInvitation ? 'pending' : 'active', send_invitation: sendInvitation }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || 'No pudimos agregar el participante');
      }
      showToast(sendInvitation ? 'Participante agregado · Email enviado' : 'Participante agregado');
      onAdded();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    } finally { setSubmitting(false); }
  };

  const createAndEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const userRes = await apiFetch(`${API_URL}/api/programs/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), first_name: firstName.trim(), last_name: lastName.trim(), role }),
      });
      if (!userRes.ok) {
        const err = await userRes.json().catch(() => ({}));
        throw new Error(err?.detail || 'No pudimos crear el usuario');
      }
      const user = await userRes.json();
      await enroll(user.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-zinc-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Agregar participante</h3>
            <p className="text-[11.5px] text-zinc-500 mt-0.5">Busca un usuario existente o crea uno nuevo.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"><I.Close className="w-4 h-4" /></button>
        </div>

        <div className="px-5 pt-4">
          <div className="inline-flex p-1 bg-zinc-100 rounded-lg w-full">
            {(['search', 'create'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[12.5px] font-semibold transition ${tab === t ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                {t === 'search' ? <I.Search className="w-3.5 h-3.5" /> : <I.Plus className="w-3.5 h-3.5" />}
                {t === 'search' ? 'Buscar existente' : 'Crear nuevo'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* role selector */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Rol en el programa</label>
            <div className="grid grid-cols-2 gap-2">
              {(['mentor', 'mentee', 'facilitator', 'participant_cell'] as ParticipantRole[]).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)} className={`px-3 py-2 rounded-lg text-[12px] font-semibold border transition ${role === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'}`}>
                  {PARTICIPANT_ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          {/* email invitation toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200 cursor-pointer">
            <input type="checkbox" checked={sendInvitation} onChange={e => setSendInvitation(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
            <div className="flex-1">
              <div className="text-[12.5px] font-semibold text-zinc-900">Enviar invitación por email</div>
              <div className="text-[11px] text-zinc-500">Recibirá un código OTP de 4 dígitos y un link para activar su cuenta.</div>
            </div>
          </label>

          {tab === 'search' ? (
            <div className="space-y-3">
              <div className="relative">
                <I.Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Email, nombre o apellido…"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>
              {searching && <div className="text-[12px] text-zinc-400">Buscando…</div>}
              {!searching && query.trim().length >= 2 && hits.length === 0 && (
                <div className="text-[12px] text-zinc-500 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                  No encontramos usuarios. Cambia a <button onClick={() => { setTab('create'); setEmail(query.includes('@') ? query.trim() : ''); }} className="text-zinc-800 font-semibold hover:underline">Crear nuevo</button>.
                </div>
              )}
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {hits.map(h => {
                  const hitName = `${h.nombre || h.first_name || ''} ${h.apellidos || h.last_name || ''}`.trim() || h.email;
                  return (
                    <button
                      key={h.id}
                      onClick={() => enroll(h.id)}
                      disabled={submitting}
                      className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/30 transition disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                        {hitName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-semibold text-zinc-900 truncate">{hitName}</div>
                        <div className="text-[11px] text-zinc-500 truncate">{h.email}{h.company ? ` · ${h.company}` : ''}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold flex-shrink-0">Agregar<I.ArrowRight className="w-3 h-3" /></span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={createAndEnroll} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="persona@correo.com" className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre</label>
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Apellido</label>
                  <input required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition disabled:opacity-60">
                {submitting ? 'Creando…' : 'Crear y agregar al programa'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB DUPLAS — vinculaciones activas con matching IA inline
// ============================================================================
// Lista de chips (skills, keywords, etc.)
function ChipRow({ items, tone = 'zinc', max = 14 }: { items?: string[]; tone?: 'blue' | 'zinc' | 'emerald'; max?: number }) {
  if (!items || items.length === 0) return <span className="text-[11px] text-zinc-300">—</span>;
  const cls = tone === 'blue' ? 'bg-blue-50 text-blue-700' : tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600';
  return (
    <div className="flex flex-wrap gap-1">
      {items.slice(0, max).map((x, i) => (
        <span key={i} className={`inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-medium ${cls}`}>{x}</span>
      ))}
      {items.length > max && <span className="text-[10.5px] text-zinc-400 px-1 py-0.5">+{items.length - max}</span>}
    </div>
  );
}

// Barra de una dimensión del breakdown del matching
function DimensionBar({ label, earned, weight, matches }: { label: string; earned: number; weight: number; matches?: string[] }) {
  const pct = weight ? Math.round((earned / weight) * 100) : 0;
  const color = pct >= 66 ? '#16a34a' : pct >= 33 ? '#2563eb' : '#a1a1aa';
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[11px] text-zinc-600">{label}</span>
        <span className="text-[11px] font-semibold text-zinc-900">{(earned ?? 0).toFixed(1)}<span className="text-zinc-400 font-normal">/{weight}</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      {matches && matches.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {matches.slice(0, 6).map((mm, i) => (
            <span key={i} className="text-[9.5px] px-1.5 py-0.5 rounded bg-white text-zinc-500 border border-zinc-200">{mm}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniProfileRow({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="text-[10.5px] leading-snug mb-1">
      <span className="text-zinc-400">{label}: </span>
      <span className="text-zinc-700">{items.slice(0, 6).join(' · ')}</span>
    </div>
  );
}

// Panel expandible con el análisis completo del match (datos reales del motor)
function MatchDetail({ r }: { r: any }) {
  const bd: Record<string, any> = r.breakdown || {};
  const dims = Object.values(bd);
  const mStrength = Math.round((r.mentor_profile_strength ?? 0) * 100);
  const eStrength = Math.round((r.mentee_profile_strength ?? 0) * 100);
  return (
    <div className="px-5 pb-4">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 grid lg:grid-cols-2 gap-x-6 gap-y-4">
        {/* Compatibilidad por dimensión */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.07em] text-zinc-400 mb-3">Compatibilidad por dimensión</div>
          <div className="space-y-3">
            {dims.length > 0 ? dims.map((d: any, i: number) => (
              <DimensionBar key={i} label={d.label} earned={d.earned} weight={d.weight} matches={d.matches} />
            )) : <span className="text-[11px] text-zinc-400">Sin desglose disponible</span>}
          </div>
        </div>

        {/* Afinidad + perfiles */}
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.07em] text-zinc-400 mb-2">Afinidad detectada</div>
            <ChipRow items={r.matched_keywords} tone="blue" max={16} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-white border border-zinc-200 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Mentor</span>
                <span className="text-[9.5px] text-zinc-400">perfil {mStrength}%</span>
              </div>
              <div className="text-[12px] font-semibold text-zinc-900 truncate">{r.mentor?.name}</div>
              {r.mentor?.headline && <div className="text-[10.5px] text-zinc-500 mb-1.5 truncate">{r.mentor.headline}</div>}
              <MiniProfileRow label="Skills" items={r.mentor?.skills} />
              <MiniProfileRow label="Temas" items={r.mentor?.topics} />
              <MiniProfileRow label="Estilo" items={r.mentor?.style} />
              {r.mentor?.experience_level && <MiniProfileRow label="Experiencia" items={[r.mentor.experience_level]} />}
            </div>
            <div className="rounded-lg bg-white border border-zinc-200 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Mentee</span>
                <span className="text-[9.5px] text-zinc-400">perfil {eStrength}%</span>
              </div>
              <div className="text-[12px] font-semibold text-zinc-900 truncate">{r.mentee?.name}</div>
              {r.mentee?.headline && <div className="text-[10.5px] text-zinc-500 mb-1.5 truncate">{r.mentee.headline}</div>}
              <MiniProfileRow label="Objetivos" items={r.mentee?.goals} />
              <MiniProfileRow label="Intereses" items={r.mentee?.interests} />
              <MiniProfileRow label="Desafíos" items={r.mentee?.challenges} />
              <MiniProfileRow label="Estilo pref." items={r.mentee?.preferred_style} />
            </div>
          </div>
        </div>

        {/* Razones */}
        {r.reasons && r.reasons.length > 0 && (
          <div className="lg:col-span-2">
            <div className="text-[10px] font-bold uppercase tracking-[0.07em] text-zinc-400 mb-2">Por qué este match</div>
            <ul className="space-y-1">
              {r.reasons.slice(0, 6).map((x: string, i: number) => (
                <li key={i} className="text-[11.5px] text-zinc-600 flex gap-2"><span className="text-blue-500 mt-px">›</span><span>{x}</span></li>
              ))}
            </ul>
          </div>
        )}

        {/* Análisis IA */}
        {r.ai_recommendation && (
          <div className="lg:col-span-2 rounded-lg px-3.5 py-3" style={{ background: 'rgba(37,99,235,0.05)', borderLeft: '2.5px solid rgba(37,99,235,0.4)' }}>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1.5"><I.Sparkles className="w-3 h-3" />Análisis de Claude</div>
            <p className="text-[11.5px] text-zinc-700 leading-relaxed">{r.ai_recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Modal moderno con el detalle completo del match (mismo contenido que el panel expandible)
function MatchPreviewModal({ r, onClose }: { r: any; onClose: () => void }) {
  const s = r.score || 0;
  const c = s >= 65 ? { color: '#16a34a', bg: '#dcfce7' } : s >= 45 ? { color: '#d97706', bg: '#fef3c7' } : { color: '#dc2626', bg: '#fee2e2' };
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold flex-shrink-0" style={{ background: c.bg, color: c.color }}>{s.toFixed(0)} pts</span>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-zinc-900 truncate">{r.mentor?.name || '—'} <span className="text-zinc-300 font-normal mx-0.5">↔</span> {r.mentee?.name || '—'}</h3>
              <p className="text-[11.5px] text-zinc-500 mt-0.5">Vista previa del match · análisis completo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition flex-shrink-0"><I.Close className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto">
          <MatchDetail r={r} />
        </div>
      </div>
    </div>
  );
}

function TabDuplas({ programId, participants, showToast }: { programId: string; participants: Participant[]; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [vincs, setVincs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [matchLoading, setMatchLoading] = React.useState(false);
  const [matchResults, setMatchResults] = React.useState<any[]>([]);
  const [matchRan, setMatchRan] = React.useState(false);
  const [matchError, setMatchError] = React.useState('');
  const [matchStats, setMatchStats] = React.useState<any>(null);
  const [progressFor, setProgressFor] = React.useState<any>(null);
  const [useAI, setUseAI] = React.useState(true);
  const [activations, setActivations] = React.useState<Record<string, 'loading' | 'done' | 'error'>>({});
  const [expandedAI, setExpandedAI] = React.useState<Record<string, boolean>>({});
  const [previewMatch, setPreviewMatch] = React.useState<any>(null);

  const loadVincs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/vinculations`);
      if (res.ok) {
        const data = await res.json();
        setVincs(Array.isArray(data) ? data.filter((v: any) => v.status === 'active') : []);
      }
    } catch {}
    setLoading(false);
  }, [programId]);

  React.useEffect(() => { loadVincs(); }, [loadVincs]);

  const removeVinc = async (vid: number) => {
    if (!confirm('¿Desvincular esta dupla?')) return;
    try {
      await apiFetch(`${API_URL}/api/programs/${programId}/vinculations/${vid}`, { method: 'DELETE' });
      setVincs(prev => prev.filter((v: any) => v.id !== vid));
      showToast('Dupla desvinculada');
    } catch { showToast('Error al desvincular', 'error'); }
  };

  const runMatch = async () => {
    setMatchLoading(true);
    setMatchError('');
    setMatchResults([]);
    setActivations({});
    try {
      const res = await apiFetch(`${API_URL}/api/matches/intelligent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId, top_k: 20, min_score: 0, use_ai: useAI }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setMatchResults(data.results || []);
      setMatchStats(data.stats || null);
      setMatchRan(true);
    } catch (e: any) { setMatchError(e.message || 'Error al generar matches'); }
    setMatchLoading(false);
  };

  const activatePair = async (mentor_user_id: string, mentee_user_id: string, score: number, ai_rec?: string) => {
    const key = `${mentor_user_id}-${mentee_user_id}`;
    setActivations(p => ({ ...p, [key]: 'loading' }));
    try {
      const res = await apiFetch(`${API_URL}/api/matches/intelligent/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId, mentor_user_id, mentee_user_id, score, ai_recommendation: ai_rec, vinculation_type: 'mentoria' }),
      });
      if (!res.ok) throw new Error();
      setActivations(p => ({ ...p, [key]: 'done' }));
      showToast('Dupla activada');
      await loadVincs(); // BUG FIX: await para refrescar la lista de inmediato
    } catch { setActivations(p => ({ ...p, [key]: 'error' })); showToast('Error al activar', 'error'); }
  };

  const sc = (s: number) => s >= 65 ? { color: '#16a34a', bg: '#dcfce7' } : s >= 45 ? { color: '#d97706', bg: '#fef3c7' } : { color: '#dc2626', bg: '#fee2e2' };
  const mentors = participants.filter(p => p.role === 'mentor');
  const mentees = participants.filter(p => p.role === 'mentee');

  return (
    <div>
      {/* ══ SECCIÓN 1: DUPLAS VIGENTES ══ */}
      <div className="mb-9">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-bold text-zinc-900">Duplas vigentes</h2>
            <p className="text-[12.5px] text-zinc-500 mt-0.5">{loading ? '…' : `${vincs.length} ${vincs.length === 1 ? 'dupla activa' : 'duplas activas'}`}</p>
          </div>
          <button onClick={loadVincs} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-[12px] font-medium text-zinc-500 hover:bg-zinc-50 transition disabled:opacity-40">
            <I.Refresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 rounded-2xl border border-zinc-100 bg-white"><Spinner /></div>
        ) : vincs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
              <I.Bot className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-[14px] font-semibold text-zinc-700">Sin duplas activas</p>
            <p className="text-[12px] text-zinc-400 mt-1">Genera matches con IA en la sección de abajo para crear vinculaciones.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-2.5 bg-zinc-50 border-b border-zinc-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mentor</span>
              <span />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mentee</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Score</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Origen</span>
              <span />
              <span />
            </div>
            {vincs.map((v: any, i: number) => {
              const mentorName = v.mentor?.full_name || v.mentor?.email || '—';
              const mentorEmail = v.mentor?.email || '';
              const menteeName = v.mentee?.full_name || v.mentee?.email || '—';
              const menteeEmail = v.mentee?.email || '';
              const isAI = !!(v.ai_recommendation || v.metadata?.ai_recommendation);
              const score = v.score ?? v.metadata?.score ?? v.match_score;
              const c = score != null ? sc(Number(score)) : null;
              return (
                <div key={v.id} className={`grid grid-cols-[1fr_auto_1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-zinc-50' : ''} hover:bg-zinc-50/50 transition`}>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900 truncate">{mentorName}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{mentorEmail}</p>
                  </div>
                  <span className="text-zinc-300 flex-shrink-0"><I.Swap className="w-4 h-4" /></span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-900 truncate">{menteeName}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{menteeEmail}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {c ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: c.bg, color: c.color }}>{Number(score).toFixed(0)} pts</span>
                    ) : <span className="text-[11px] text-zinc-300">—</span>}
                  </div>
                  <div className="flex-shrink-0">
                    {isAI
                      ? <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700"><I.Sparkles className="w-3 h-3" />IA</span>
                      : <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-zinc-100 text-zinc-500">Manual</span>}
                  </div>
                  <button onClick={() => setProgressFor(v)} title="Ver avance de la dupla"
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-blue-50 hover:text-blue-600 transition"><I.Activity className="w-4 h-4" /></button>
                  <button onClick={() => removeVinc(v.id)} title="Desvincular"
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[17px] text-zinc-300 hover:bg-red-50 hover:text-red-500 transition"><I.Close className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative py-1 mb-7">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
        <div className="relative flex justify-center"><span className="bg-zinc-50 px-4 text-[11px] font-bold uppercase tracking-wider text-zinc-400">Generar con IA</span></div>
      </div>

      {/* ══ SECCIÓN 2: SUGERENCIAS ══ */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[18px] font-bold text-zinc-900">Sugerencias de match</h2>
            <p className="text-[12.5px] text-zinc-500 mt-0.5">
              {mentors.length} mentor{mentors.length !== 1 ? 'es' : ''} · {mentees.length} mentee{mentees.length !== 1 ? 's' : ''} · Motor potenciado con Claude
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="flex items-center gap-2 text-[12px] cursor-pointer select-none text-zinc-600">
              <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="h-3.5 w-3.5 rounded border-zinc-300" />
              <I.Sparkles className="w-3.5 h-3.5 text-blue-600" />Claude
            </label>
            <button onClick={runMatch} disabled={matchLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-zinc-800 transition disabled:opacity-60">
              {matchLoading
                ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>Analizando…</>
                : <><I.Sparkles className="w-4 h-4" />Generar matches</>}
            </button>
          </div>
        </div>

        {matchError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700 mb-4">{matchError}</div>}

        {!matchRan && !matchLoading && (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white py-12 text-center">
            <p className="text-[13px] text-zinc-500">Pulsa «Generar matches» para ver sugerencias de duplas.</p>
          </div>
        )}

        {matchRan && !matchLoading && matchResults.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-center">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <I.Alert className="w-5 h-5" />
            </div>
            <p className="text-[13px] font-semibold text-amber-900 mb-1">No se pudieron generar duplas</p>
            <p className="text-[12.5px] text-amber-800 max-w-md mx-auto">
              {matchStats?.reason || 'No se encontraron candidatos compatibles.'}
            </p>
            {matchStats && (
              <p className="text-[11.5px] text-amber-700/80 mt-2">
                En este programa: <b>{matchStats.mentors ?? 0}</b> mentor(es) · <b>{matchStats.mentees ?? 0}</b> mentee(s).
                Asigná roles en la pestaña <b>Participantes</b>.
              </p>
            )}
          </div>
        )}

        {matchResults.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_auto_auto] items-center gap-3 px-5 py-2.5 bg-zinc-50 border-b border-zinc-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">#</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mentor</span>
              <span />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Mentee</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Score</span>
              <span />
              <span />
            </div>
            {matchResults.map((r: any, idx: number) => {
              const key = `${r.mentor?.id}-${r.mentee?.id}`;
              const act = activations[key];
              const alreadyActive = vincs.some((v: any) => (v.mentor?.id === r.mentor?.id) && (v.mentee?.id === r.mentee?.id));
              const c = sc(r.score || 0);
              const expanded = expandedAI[key];
              return (
                <div key={key} className={`${idx > 0 ? 'border-t border-zinc-50' : ''}`}>
                  <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_auto_auto] items-center gap-3 px-5 py-4 hover:bg-zinc-50/40 transition">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: c.bg, color: c.color }}>{idx + 1}</div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-900 truncate">{r.mentor?.name || '—'}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{r.mentor?.headline || r.mentor?.email || ''}</p>
                    </div>
                    <span className="text-zinc-300 flex-shrink-0"><I.Swap className="w-4 h-4" /></span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-zinc-900 truncate">{r.mentee?.name || '—'}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{r.mentee?.headline || r.mentee?.email || ''}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold flex-shrink-0" style={{ background: c.bg, color: c.color }}>{(r.score || 0).toFixed(0)} pts</span>
                    <div className="flex-shrink-0">
                      {alreadyActive || act === 'done' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700 ring-1 ring-emerald-200 whitespace-nowrap"><I.Check className="w-3 h-3" />Activa</span>
                      ) : act === 'loading' ? (
                        <svg className="h-4 w-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setPreviewMatch(r)} title="Vista previa del match"
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition whitespace-nowrap"><I.Sparkles className="w-3.5 h-3.5" />Preview</button>
                          <button onClick={() => activatePair(r.mentor?.id, r.mentee?.id, r.score, r.ai_recommendation)}
                            className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-zinc-800 transition whitespace-nowrap"><I.Zap className="w-3.5 h-3.5" />Vincular</button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setExpandedAI(p => ({ ...p, [key]: !p[key] }))} title="Ver detalle del match"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition flex-shrink-0">
                      <I.Chevron className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  {expanded && <MatchDetail r={r} />}
                </div>
              );
            })}
          </div>
        )}

        {previewMatch && <MatchPreviewModal r={previewMatch} onClose={() => setPreviewMatch(null)} />}
        {progressFor && <PairProgressModal programId={programId} vinc={progressFor} onClose={() => setProgressFor(null)} showToast={showToast} />}
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESO DE LA DUPLA (bitácora de sesiones + métricas + export)
// ============================================================================
const SESSION_STATUS_META: Record<string, { label: string; color: string; bg: string }> = { completed: { label: 'Completada', color: '#047857', bg: '#ecfdf5' }, scheduled: { label: 'Agendada', color: '#0369a1', bg: '#f0f9ff' }, cancelled: { label: 'Cancelada', color: '#b91c1c', bg: '#fef2f2' }, no_show: { label: 'No asistió', color: '#b45309', bg: '#fffbeb' } };

function ProgMetric({ label, value, sub, strong }: { label: string; value: string | number; sub?: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white px-3.5 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">{label}</div>
      <div className={`mt-1 leading-none tracking-tight text-[20px] font-semibold ${strong ? 'text-blue-600' : 'text-zinc-900'}`}>{value}</div>
      {sub && <div className="mt-1 text-[10.5px] text-zinc-400">{sub}</div>}
    </div>
  );
}

function PairProgressModal({ programId, vinc, onClose, showToast }: { programId: string; vinc: any; onClose: () => void; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const mentor = vinc.mentor || {};
  const mentee = vinc.mentee || {};
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const empty = { title: 'Sesión de mentoría', date: '', duration: '60', status: 'completed', mood: '', topics: '', notes: '', next_steps: '' };
  const [form, setForm] = React.useState(empty);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch(`${API_URL}/api/programs/${programId}/pair-progress?mentor_id=${mentor.id}&mentee_id=${mentee.id}`);
      if (r.ok) setData(await r.json());
    } catch {} finally { setLoading(false); }
  }, [programId, mentor.id, mentee.id]);
  React.useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date) { showToast('Indicá la fecha de la sesión', 'error'); return; }
    setSaving(true);
    try {
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/sessions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentor_id: mentor.id, mentee_id: mentee.id, title: form.title || 'Sesión de mentoría',
          scheduled_at: new Date(form.date).toISOString(), duration_minutes: Number(form.duration) || 60,
          status: form.status, mentee_mood: form.mood ? Number(form.mood) : null,
          topics_covered: form.topics.split(',').map(t => t.trim()).filter(Boolean),
          session_notes: form.notes, next_steps: form.next_steps,
        }),
      });
      if (!res.ok) throw new Error();
      showToast('Sesión registrada'); setShowForm(false); setForm(empty); await load();
    } catch { showToast('Error al registrar la sesión', 'error'); } finally { setSaving(false); }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();
      const ink: [number, number, number] = [24, 24, 27];
      const m = data?.metrics || {};
      doc.setFontSize(16); doc.setTextColor(17, 17, 17);
      doc.text('Avance de la dupla', 14, 18);
      doc.setFontSize(11); doc.setTextColor(60, 60, 60);
      doc.text(`${mentor.full_name || mentor.email}  ↔  ${mentee.full_name || mentee.email}`, 14, 26);
      doc.setFontSize(9); doc.setTextColor(120, 120, 120);
      doc.text(`Generado ${new Date().toLocaleDateString('es-ES')}`, 14, 32);
      autoTable(doc, {
        startY: 38, head: [['Indicador', 'Valor']],
        body: [
          ['Progreso', `${m.progress ?? 0}%`],
          ['Sesiones completadas', `${m.completed ?? 0} de ${m.total_sessions ?? 0}`],
          ['Asistencia', m.attendance != null ? `${Math.round(m.attendance * 100)}%` : '—'],
          ['Horas de mentoría', `${m.total_hours ?? 0} h`],
          ['Ánimo promedio del mentee', m.avg_mood != null ? `${m.avg_mood}/5` : '—'],
          ['Última sesión', m.last_session ? new Date(m.last_session).toLocaleDateString('es-ES') : '—'],
          ['Temas cubiertos', (m.topics || []).join(', ') || '—'],
          ['Próximos pasos', m.next_steps || '—'],
        ],
        headStyles: { fillColor: ink, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }, alternateRowStyles: { fillColor: [245, 245, 246] },
      });
      const sessions = data?.sessions || [];
      if (sessions.length) {
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 8,
          head: [['Fecha', 'Sesión', 'Estado', 'Ánimo', 'Temas', 'Notas']],
          body: sessions.map((x: any) => [
            x.scheduled_at ? new Date(x.scheduled_at).toLocaleDateString('es-ES') : '—',
            x.title, SESSION_STATUS_META[x.status]?.label || x.status,
            x.mentee_mood ? `${x.mentee_mood}/5` : '—',
            (x.topics_covered || []).join(', '), x.session_notes || '',
          ]),
          headStyles: { fillColor: ink, textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2 }, columnStyles: { 5: { cellWidth: 50 } },
        });
      }
      doc.save(`avance-dupla.pdf`);
      showToast('PDF generado');
    } catch { showToast('No se pudo generar el PDF', 'error'); } finally { setExporting(false); }
  };

  const m = data?.metrics;
  const sessions = data?.sessions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-zinc-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-zinc-100">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-zinc-900">Avance de la dupla</h3>
            <p className="text-[12px] text-zinc-500 mt-0.5 truncate">{mentor.full_name || mentor.email} <span className="text-zinc-300">↔</span> {mentee.full_name || mentee.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ActionBtn onClick={exportPDF} icon={<I.Download />} variant={exporting ? 'disabled' : 'ghost'}>{exporting ? 'PDF…' : 'PDF'}</ActionBtn>
            <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"><I.Close className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2"><Spinner /><span className="text-[13px] text-zinc-400">Cargando avance…</span></div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ProgMetric label="Progreso" value={`${m?.progress ?? 0}%`} sub={`meta ${m?.target_sessions ?? 6} sesiones`} strong />
                <ProgMetric label="Sesiones" value={`${m?.completed ?? 0}/${m?.total_sessions ?? 0}`} sub="completadas" />
                <ProgMetric label="Asistencia" value={m?.attendance != null ? `${Math.round(m.attendance * 100)}%` : '—'} sub={`${m?.no_show ?? 0} no-show`} />
                <ProgMetric label="Ánimo mentee" value={m?.avg_mood != null ? `${m.avg_mood}/5` : '—'} sub={`${m?.total_hours ?? 0} h totales`} />
              </div>

              {/* Barra de progreso */}
              <div>
                <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${m?.progress ?? 0}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-zinc-400">
                  <span>{m?.last_session ? `Última sesión: ${new Date(m.last_session).toLocaleDateString('es-ES')}` : 'Sin sesiones completadas'}</span>
                  {m?.next_session && <span>Próxima: {new Date(m.next_session).toLocaleDateString('es-ES')}</span>}
                </div>
              </div>

              {/* Temas + próximos pasos */}
              {(m?.topics?.length > 0 || m?.next_steps) && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-200 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Temas cubiertos</div>
                    {m?.topics?.length ? <div className="flex flex-wrap gap-1">{m.topics.map((t: string, i: number) => <span key={i} className="inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-zinc-100 text-zinc-600">{t}</span>)}</div> : <span className="text-[11px] text-zinc-300">—</span>}
                  </div>
                  <div className="rounded-xl border border-zinc-200 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Próximos pasos</div>
                    <p className="text-[11.5px] text-zinc-600 leading-relaxed">{m?.next_steps || '—'}</p>
                  </div>
                </div>
              )}

              {/* Bitácora */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[12px] font-semibold text-zinc-900">Bitácora de sesiones</span>
                  <button onClick={() => setShowForm(v => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-zinc-800 transition"><I.Plus className="w-3.5 h-3.5" />Registrar sesión</button>
                </div>

                {showForm && (
                  <form onSubmit={submit} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 mb-3 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Título</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} /></div>
                      <div><label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Fecha y hora</label><input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} /></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div><label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Estado</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                          <option value="completed">Completada</option><option value="scheduled">Agendada</option><option value="cancelled">Cancelada</option><option value="no_show">No asistió</option>
                        </select></div>
                      <div><label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Duración (min)</label><input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className={inputCls} /></div>
                      <div><label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Ánimo mentee (1-5)</label><input type="number" min={1} max={5} value={form.mood} onChange={e => setForm({ ...form, mood: e.target.value })} className={inputCls} /></div>
                    </div>
                    <div><label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Temas (separados por coma)</label><input value={form.topics} onChange={e => setForm({ ...form, topics: e.target.value })} placeholder="Liderazgo, Comunicación" className={inputCls} /></div>
                    <div><label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Notas de la sesión</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} /></div>
                    <div><label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Próximos pasos</label><input value={form.next_steps} onChange={e => setForm({ ...form, next_steps: e.target.value })} className={inputCls} /></div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-[12px] font-semibold text-zinc-600 hover:bg-zinc-100 transition">Cancelar</button>
                      <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar sesión'}</button>
                    </div>
                  </form>
                )}

                {sessions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center">
                    <p className="text-[12.5px] text-zinc-500">Aún no hay sesiones registradas.</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Registrá la primera para empezar a medir el avance.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.slice().reverse().map((x: any) => {
                      const st = SESSION_STATUS_META[x.status] || SESSION_STATUS_META.scheduled;
                      return (
                        <div key={x.id} className="rounded-xl border border-zinc-200 p-3">
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[12.5px] font-semibold text-zinc-900 truncate">{x.title}</span>
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                            </div>
                            <span className="text-[11px] text-zinc-400 flex-shrink-0">{x.scheduled_at ? new Date(x.scheduled_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} · {x.duration_minutes}m{x.mentee_mood ? ` · ánimo ${x.mentee_mood}/5` : ''}</span>
                          </div>
                          {x.topics_covered?.length > 0 && <div className="flex flex-wrap gap-1 mb-1.5">{x.topics_covered.map((t: string, i: number) => <span key={i} className="inline-flex px-1.5 py-0.5 rounded text-[9.5px] bg-zinc-50 text-zinc-500 border border-zinc-100">{t}</span>)}</div>}
                          {x.session_notes && <p className="text-[11.5px] text-zinc-600 leading-relaxed">{x.session_notes}</p>}
                          {x.next_steps && <p className="text-[11px] text-zinc-500 mt-1"><span className="font-semibold">Próximos pasos:</span> {x.next_steps}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB REPORTES — reporte ejecutivo enlazado a la BD + export PDF/CSV
// ============================================================================
function ReportTile({ label, value, sub, strong }: { label: string; value: string | number; sub?: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white px-4 py-3.5">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-zinc-400">{label}</div>
      <div className={`mt-1.5 leading-none tracking-tight ${strong ? 'text-[26px] text-blue-600' : 'text-[26px] text-zinc-900'} font-semibold`}>{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-zinc-400">{sub}</div>}
    </div>
  );
}
function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-zinc-100 last:border-0">
      <span className="text-[12px] text-zinc-500">{label}</span>
      <span className="text-[12.5px] font-medium text-zinc-900 text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}
function BreakdownRow({ label, count, total, color = '#2563eb' }: { label: string; count: number; total: number; color?: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 text-[12px] text-zinc-600 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-16 text-right text-[12px] font-semibold text-zinc-900 flex-shrink-0">{count} · {pct}%</span>
    </div>
  );
}

function TabReportes({ program, participants, assignedPM, showToast }: { program: ProgramDetail; participants: Participant[]; assignedPM: AssignedPM | null; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [stats, setStats] = React.useState<any>(null);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch(`${API_URL}/api/stats/programs/${program.id}`);
        if (r.ok) setStats(await r.json());
      } catch {}
    })();
  }, [program.id]);

  const stMeta = STATUS_META[program.status] || STATUS_META.draft;
  const acts = program.activities || [];
  const totalActs = acts.length;
  const completedActs = acts.filter(a => a.status === 'completed').length;
  const actByStatus: Record<string, number> = {};
  acts.forEach(a => { actByStatus[a.status] = (actByStatus[a.status] || 0) + 1; });

  const totalP = participants.length;
  const mentors = participants.filter(p => p.role === 'mentor').length;
  const mentees = participants.filter(p => p.role === 'mentee').length;
  const others = totalP - mentors - mentees;
  const activated = participants.filter(p => p.activated_at).length;
  const invited = participants.filter(p => p.invitation_sent_at).length;

  const matchesTotal = stats?.matches?.total ?? 0;
  const matchesActive = stats?.matches?.active ?? 0;
  const avgScore = Math.round(stats?.matches?.avg_score ?? 0);

  const LIFECYCLE_PCT: Record<string, number> = { draft: 10, designed: 25, ready_for_execution: 55, under_review: 50, in_execution: 80, active: 80, closed: 100, completed: 100, paused: 70 };
  const lifePct = LIFECYCLE_PCT[program.status] ?? 25;
  const actPct = totalActs ? Math.round((completedActs / totalActs) * 100) : 0;
  const activationPct = totalP ? Math.round((activated / totalP) * 100) : 0;

  const safe = (program.name || 'programa').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50);

  const exportCSV = () => {
    const header = ['Participante', 'Email', 'Rol', 'Estado', 'Invitado', 'Activado'];
    const rows = participants.map(p => [
      p.user.full_name || '', p.user.email || '', PARTICIPANT_ROLE_LABEL[p.role] || p.role,
      p.status || '', p.invitation_sent_at ? 'sí' : 'no', p.activated_at ? 'sí' : 'no',
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `participantes-${safe}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV descargado', 'success');
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();
      const ink: [number, number, number] = [24, 24, 27];

      doc.setFontSize(17); doc.setTextColor(17, 17, 17);
      doc.text('Reporte de programa', 14, 20);
      doc.setFontSize(11); doc.setTextColor(60, 60, 60);
      doc.text(program.name, 14, 28);
      doc.setFontSize(9); doc.setTextColor(120, 120, 120);
      doc.text(`${program.company?.name || 'Sin cuenta'}  ·  Estado: ${stMeta.label}  ·  Generado ${new Date().toLocaleDateString('es-ES')}`, 14, 34);

      autoTable(doc, {
        startY: 40,
        head: [['Indicador', 'Valor']],
        body: [
          ['Participantes', `${totalP}`],
          ['Mentores / Mentees', `${mentors} / ${mentees}`],
          ['Invitados / Activados', `${invited} / ${activated} (${activationPct}%)`],
          ['Actividades', `${totalActs}`],
          ['Actividades completadas', `${completedActs} (${actPct}%)`],
          ['Duplas activas', `${matchesActive} de ${matchesTotal}`],
          ['Score promedio de matching', `${avgScore}%`],
          ['Avance del ciclo de vida', `${lifePct}%`],
        ],
        headStyles: { fillColor: ink, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 245, 246] },
      });

      if (participants.length) {
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 8,
          head: [['Participante', 'Rol', 'Estado', 'Activación']],
          body: participants.map(p => [
            p.user.full_name || p.user.email,
            PARTICIPANT_ROLE_LABEL[p.role] || p.role,
            p.status || '—',
            p.activated_at ? 'Activado' : p.invitation_sent_at ? 'Invitado' : 'Pendiente',
          ]),
          headStyles: { fillColor: ink, textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2.5 },
          alternateRowStyles: { fillColor: [245, 245, 246] },
        });
      }

      const pages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(160, 160, 160);
        doc.text(`Inspiratoria · ${program.name}`, 14, doc.internal.pageSize.height - 8);
        doc.text(`Página ${i} de ${pages}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 8, { align: 'right' });
      }
      doc.save(`reporte-${safe}.pdf`);
      showToast('PDF generado', 'success');
    } catch (e: any) {
      showToast('No se pudo generar el PDF', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-900 tracking-tight">Reporte ejecutivo</h2>
          <p className="text-[12px] text-zinc-400 mt-0.5">Generado {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} · datos en vivo</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionBtn onClick={exportCSV} icon={<I.Download />} variant="ghost">CSV</ActionBtn>
          <ActionBtn onClick={() => window.print()} icon={<I.FileText />} variant="ghost">Imprimir</ActionBtn>
          <ActionBtn onClick={exportPDF} icon={<I.Download />} variant={exporting ? 'disabled' : 'primary'}>{exporting ? 'Generando…' : 'Exportar PDF'}</ActionBtn>
        </div>
      </div>

      {/* Indicadores clave */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReportTile label="Participantes" value={totalP} sub={`${mentors} mentores · ${mentees} mentees`} />
        <ReportTile label="Activación" value={`${activationPct}%`} sub={`${activated} de ${totalP} activados`} strong />
        <ReportTile label="Actividades" value={totalActs} sub={`${completedActs} completadas`} />
        <ReportTile label="Duplas" value={matchesTotal} sub={`${matchesActive} activas · score ${avgScore}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Resumen ejecutivo */}
        <Card title="Resumen ejecutivo" subtitle="Identidad y estado del programa">
          <div>
            <MetaItem label="Programa" value={program.name} />
            <MetaItem label="Empresa" value={program.company?.name || '—'} />
            <MetaItem label="Estado" value={stMeta.label} />
            {program.cohort_year ? <MetaItem label="Cohorte" value={String(program.cohort_year)} /> : null}
            <MetaItem label="Plantilla de origen" value={program.template?.name || 'Sin plantilla'} />
            <MetaItem label="Project Manager" value={assignedPM?.full_name || 'Sin asignar'} />
            <MetaItem label="Certificación" value={program.requires_certification ? 'Sí' : 'No'} />
            <MetaItem label="Creado" value={program.created_at ? formatDate(program.created_at) : '—'} />
            <MetaItem label="Última actualización" value={program.updated_at ? formatDate(program.updated_at) : '—'} />
          </div>
        </Card>

        {/* Progreso */}
        <Card title="Progreso e indicadores" subtitle="Avance general de la cohorte">
          <div className="space-y-5">
            <ProgressStat label="Ciclo de vida" pct={lifePct} caption={stMeta.label} color="violet" />
            <ProgressStat label="Actividades completadas" pct={actPct} caption={`${completedActs} de ${totalActs} actividades`} color="emerald" />
            <ProgressStat label="Participantes activados" pct={activationPct} caption={`${activated} de ${totalP} activados`} color="indigo" />
          </div>
        </Card>

        {/* Desglose de participantes */}
        <Card title="Desglose de participantes" subtitle={`${totalP} miembros`}>
          {totalP === 0 ? <Empty msg="Sin participantes" icon={<I.Users />} /> : (
            <div>
              <BreakdownRow label="Mentores" count={mentors} total={totalP} color="#2563eb" />
              <BreakdownRow label="Mentees" count={mentees} total={totalP} color="#60a5fa" />
              {others > 0 && <BreakdownRow label="Otros roles" count={others} total={totalP} color="#a1a1aa" />}
              <div className="mt-3 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-3">
                <div className="text-center"><div className="text-[18px] font-semibold text-zinc-900 leading-none">{invited}</div><div className="text-[10.5px] text-zinc-400 mt-1">Invitados</div></div>
                <div className="text-center"><div className="text-[18px] font-semibold text-blue-600 leading-none">{activated}</div><div className="text-[10.5px] text-zinc-400 mt-1">Activados</div></div>
              </div>
            </div>
          )}
        </Card>

        {/* Desglose de actividades */}
        <Card title="Desglose de actividades" subtitle={`${totalActs} actividades`}>
          {totalActs === 0 ? <Empty msg="Sin actividades" icon={<I.Activity />} /> : (
            <div>
              {Object.entries(actByStatus).map(([st, n]) => (
                <BreakdownRow key={st} label={ACTIVITY_STATUS_META[st]?.label || st} count={n} total={totalActs} color="#2563eb" />
              ))}
            </div>
          )}
        </Card>
      </div>

      <EngagementReport programId={program.id} />
    </div>
  );
}

// ============================================================================
// REPORTE DE ENGAGEMENT — asistencia, recursos vistos y accesos por participante
// ============================================================================
interface EngagementRow {
  participant_id: string; name: string; email: string; role: string; status: string;
  joined_at: string | null; activated_at: string | null; last_access_at: string | null;
  access_count: number; sessions_attended: number; sessions_total: number; attendance_pct: number;
  resources_viewed: number; resources_total: number; resources_pct: number;
}
interface EngagementReportData {
  participants: EngagementRow[];
  aggregates: {
    sessions_total: number; resources_total: number;
    avg_attendance_pct: number; avg_access_count: number; avg_resources_pct: number;
    by_role: Record<string, { avg_attendance_pct: number; avg_access_count: number; avg_resources_pct: number }>;
  };
}

function EngagementReport({ programId }: { programId: string }) {
  const [data, setData] = React.useState<EngagementReportData | null>(null);
  const [sortBy, setSortBy] = React.useState<'name' | 'attendance_pct' | 'access_count' | 'resources_pct'>('attendance_pct');

  React.useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch(`${API_URL}/api/programs/${programId}/engagement-report`);
        if (r.ok) setData(await r.json());
      } catch {}
    })();
  }, [programId]);

  if (!data) {
    return (
      <Card title="Engagement por participante" subtitle="Asistencia, recursos revisados y accesos a la plataforma">
        <div className="flex items-center justify-center py-8 gap-2"><Spinner /><span className="text-[12px] text-zinc-400">Cargando engagement…</span></div>
      </Card>
    );
  }

  const rows = [...data.participants].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return b[sortBy] - a[sortBy];
  });

  const SortHeader = ({ id, label }: { id: typeof sortBy; label: string }) => (
    <th
      onClick={() => setSortBy(id)}
      className={`px-3 py-2 text-left font-semibold cursor-pointer select-none ${sortBy === id ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
    >
      {label}{sortBy === id && ' ▾'}
    </th>
  );

  return (
    <Card title="Engagement por participante" subtitle={`Asistencia a ${data.aggregates.sessions_total} sesiones realizadas · ${data.aggregates.resources_total} recursos publicados`}>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <ReportTile label="Asistencia promedio" value={`${data.aggregates.avg_attendance_pct}%`} sub={`mentores ${data.aggregates.by_role.mentor?.avg_attendance_pct ?? 0}% · mentees ${data.aggregates.by_role.mentee?.avg_attendance_pct ?? 0}%`} strong />
        <ReportTile label="Recursos revisados" value={`${data.aggregates.avg_resources_pct}%`} sub={`mentores ${data.aggregates.by_role.mentor?.avg_resources_pct ?? 0}% · mentees ${data.aggregates.by_role.mentee?.avg_resources_pct ?? 0}%`} />
        <ReportTile label="Accesos promedio" value={data.aggregates.avg_access_count} sub={`mentores ${data.aggregates.by_role.mentor?.avg_access_count ?? 0} · mentees ${data.aggregates.by_role.mentee?.avg_access_count ?? 0}`} />
      </div>

      {rows.length === 0 ? <Empty msg="Sin participantes" icon={<I.Users />} /> : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-zinc-200">
                <SortHeader id="name" label="Participante" />
                <th className="px-3 py-2 text-left font-semibold text-zinc-400">Rol</th>
                <th className="px-3 py-2 text-left font-semibold text-zinc-400">Ingresó</th>
                <th className="px-3 py-2 text-left font-semibold text-zinc-400">Últ. acceso</th>
                <SortHeader id="access_count" label="Accesos" />
                <SortHeader id="attendance_pct" label="Asistencia" />
                <SortHeader id="resources_pct" label="Recursos vistos" />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.participant_id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-3 py-2.5 font-semibold text-zinc-900">{r.name}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${r.role === 'mentor' ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>{r.role}</span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500">{r.joined_at ? formatDate(r.joined_at) : '—'}</td>
                  <td className="px-3 py-2.5 text-zinc-500">{r.last_access_at ? formatDate(r.last_access_at) : 'Nunca'}</td>
                  <td className="px-3 py-2.5 text-zinc-700">{r.access_count}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full bg-zinc-900" style={{ width: `${r.attendance_pct}%` }} /></div>
                      <span className="text-zinc-600 tabular-nums">{r.sessions_attended}/{r.sessions_total}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${r.resources_pct}%` }} /></div>
                      <span className="text-zinc-600 tabular-nums">{r.resources_viewed}/{r.resources_total}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// FEED DE AUDITORÍA (bitácora del ciclo de vida del curso)
// ============================================================================
const AUDIT_ACTION_META: Record<string, { label: string; dot: string }> = {
  program_created:        { label: 'Curso creado',       dot: '#10b981' },
  program_updated:        { label: 'Curso editado',      dot: '#3b82f6' },
  program_status_changed: { label: 'Cambio de estado',   dot: '#8b5cf6' },
  program_launched:       { label: 'Curso lanzado',      dot: '#f59e0b' },
  program_deleted:        { label: 'Curso eliminado',    dot: '#ef4444' },
  participant_added:      { label: 'Participante agregado', dot: '#10b981' },
  participant_removed:    { label: 'Participante removido', dot: '#ef4444' },
  vinculation_created:    { label: 'Dupla creada',        dot: '#0ea5e9' },
  vinculation_removed:    { label: 'Dupla removida',      dot: '#ef4444' },
  match_activated:        { label: 'Match activado',      dot: '#0ea5e9' },
  session_created:        { label: 'Sesión registrada',  dot: '#6366f1' },
};

function auditDetail(action: string, d: any): string {
  d = d || {};
  if (action === 'program_status_changed') return `${d.from ?? '—'} → ${d.to ?? '—'}`;
  if (action === 'program_created') return [d.company, d.template && `desde «${d.template}»`, d.cohort_year].filter(Boolean).join(' · ');
  if (action === 'program_updated') {
    if (d.changes) return `${Object.keys(d.changes).join(', ')} modificado`;
    return 'Datos actualizados';
  }
  if (action === 'program_launched') return `${d.total_activities ?? 0} actividades · ${d.trainings ?? 0} entrenamientos`;
  if (action === 'program_deleted') return d.name || '';
  if (action === 'participant_added') return `${d.user ?? ''}${d.role ? ` · ${d.role}` : ''}`;
  if (action === 'participant_removed') return `${d.user ?? ''}${d.role ? ` · ${d.role}` : ''}`;
  if (action === 'vinculation_created' || action === 'match_activated') return `${d.mentor ?? '—'} ↔ ${d.mentee ?? '—'}${d.score != null ? ` · ${Math.round(d.score)} pts` : ''}`;
  if (action === 'vinculation_removed') return `${d.p1 ?? '—'} ↔ ${d.p2 ?? '—'}`;
  if (action === 'session_created') return d.title || d.mentee || '';
  return '';
}

function AuditFeed({ programId }: { programId: string }) {
  const [logs, setLogs] = React.useState<any[] | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch(`${API_URL}/api/programs/${programId}/audit-logs?limit=100`);
        setLogs(r.ok ? await r.json() : []);
      } catch { setLogs([]); }
    })();
  }, [programId]);

  return (
    <Card title="Bitácora de auditoría" subtitle="Quién hizo qué y cuándo — trazabilidad completa del curso">
      {logs === null ? (
        <div className="flex items-center justify-center py-8 gap-2"><Spinner /><span className="text-[12px] text-zinc-400">Cargando bitácora…</span></div>
      ) : logs.length === 0 ? (
        <Empty msg="Sin eventos de auditoría todavía" icon={<I.FileText />} />
      ) : (
        <div className="relative pl-4">
          <div className="absolute left-[6px] top-1 bottom-1 w-px bg-zinc-200" />
          <div className="space-y-3.5">
            {logs.map((l: any) => {
              const meta = AUDIT_ACTION_META[l.action] || { label: l.action, dot: '#a1a1aa' };
              const detail = auditDetail(l.action, l.details);
              const when = l.created_at ? new Date(l.created_at) : null;
              return (
                <div key={l.id} className="relative">
                  <span className="absolute -left-4 top-1 w-[9px] h-[9px] rounded-full ring-2 ring-white" style={{ background: meta.dot }} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-zinc-900">{meta.label}</div>
                      {detail && <div className="text-[11.5px] text-zinc-500 mt-0.5 break-words">{detail}</div>}
                      <div className="text-[11px] text-zinc-400 mt-0.5">por {l.actor || 'sistema'}</div>
                    </div>
                    {when && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-[11px] text-zinc-500">{when.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-[10.5px] text-zinc-400">{when.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function TabGobierno({ program, slug, assignedPM, pms, onTransition, onAssignPM }: { program: ProgramDetail; slug: string; assignedPM: AssignedPM | null; pms: PM[]; onTransition: (s: string) => void; onAssignPM: (id: string | null) => void }) {
  return (
    <div className="space-y-5">
      {/* ── Estado del programa ── */}
      <Card title="Estado del programa" subtitle="Cambia manualmente el estado del programa">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {['designed', 'ready_for_execution', 'in_execution', 'under_review', 'closed'].map(s => {
            const meta = STATUS_META[s];
            const active = program.status === s;
            return (
              <button key={s} onClick={() => onTransition(s)} disabled={active}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-left transition ${active ? 'cursor-default' : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/30 cursor-pointer'}`}
                style={active ? { background: meta.bg, borderColor: meta.ring, boxShadow: `0 0 0 2px ${meta.ring}` } : {}}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.dot }} />
                <span className="text-[12px] font-semibold flex-1" style={{ color: active ? meta.color : '#1f2937' }}>{meta.label}</span>
                {active && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: meta.color, color: '#fff' }}>Actual</span>}
              </button>
            );
          })}
        </div>
      </Card>

      <AuditFeed programId={program.id} />

      <PMCard assignedPM={assignedPM} pms={pms} onAssignPM={onAssignPM} />

      {/* ── Acciones ── */}
      <Card title="Acciones rápidas" subtitle="Atajos a herramientas relacionadas">
        <div className="grid md:grid-cols-2 gap-3">
          <QuickAction href={`/studio/${slug}`} icon={<I.Layout />} title="Vista Studio" sub="Ver todos los programas de la cuenta" />
          {program.company_id && (
            <QuickAction href={`/dashboard/accounts/${program.company_id}`} icon={<I.Building />} title="Cuenta cliente" sub={`Ir a ${program.company?.name}`} />
          )}
          {program.template?.slug && (
            <QuickAction href={`/dashboard/programs/preview/${program.template.slug}`} icon={<I.Layout />} title="Plantilla de origen" sub={program.template.name} />
          )}
        </div>
      </Card>

      <Card title="Metadatos" subtitle="Identificadores técnicos del programa">
        <div className="divide-y divide-zinc-100 rounded-xl bg-zinc-50 overflow-hidden">
          <MetaRow label="Program ID" value={program.id} mono />
          <MetaRow label="Company ID" value={program.company_id || '—'} mono />
          <MetaRow label="Creado" value={program.created_at ? formatDate(program.created_at) : '—'} />
          <MetaRow label="Última actualización" value={program.updated_at ? formatDate(program.updated_at) : '—'} />
        </div>
      </Card>
    </div>
  );
}

function QuickAction({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/30 transition group">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 text-white flex items-center justify-center flex-shrink-0">
        <span className="w-5 h-5">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-zinc-900 group-hover:text-zinc-900">{title}</div>
        <div className="text-[11.5px] text-zinc-500 mt-0.5">{sub}</div>
      </div>
      <I.ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-700 mt-1.5 flex-shrink-0" />
    </Link>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-white">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      <span className={`text-[12px] text-zinc-900 text-right break-all ${mono ? 'font-mono text-[11px] text-zinc-900' : ''}`}>{value}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}
