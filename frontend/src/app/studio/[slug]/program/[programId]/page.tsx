'use client';
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const ADMIN_ROLES = new Set(['superadmin', 'admin_root', 'inspiratoria_admin', 'admin']);

// ============================================================================
// TYPES
// ============================================================================
interface ProgramModule {
  id: number; title: string; description: string; order: number;
  duration_minutes: number; is_published: boolean; materials_url: string;
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
  activities: ProgramActivity[]; activities_count: number; participants_count: number;
  requires_certification: boolean; created_at: string | null; updated_at: string | null;
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
  const [activeTab, setActiveTab] = useState<'resumen' | 'info' | 'cronograma' | 'actividades' | 'participantes' | 'duplas' | 'gobierno'>('resumen');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

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
        fetch(`${API_URL}/api/programs/${programId}`),
        fetch(`${API_URL}/api/programs/${programId}/participants`),
        fetch(`${API_URL}/api/companies/pms`),
      ]);
      if (!progRes.ok) throw new Error('No se pudo cargar el programa');
      const progData: ProgramDetail = await progRes.json();
      setProgram(progData);
      if (partRes.ok) setParticipants(await partRes.json());
      if (pmsRes.ok) setPms(await pmsRes.json());
      if (progData.company_id) {
        const pmRes = await fetch(`${API_URL}/api/companies/company/${progData.company_id}/pm`);
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

  const transitionStatus = async (newStatus: string) => {
    if (!program) return;
    try {
      const res = await fetch(`${API_URL}/api/programs/${programId}/status?status=${newStatus}`, { method: 'PATCH' });
      if (!res.ok) throw new Error(await res.text());
      setProgram({ ...program, status: newStatus });
      showToast(`Programa movido a "${STATUS_META[newStatus]?.label ?? newStatus}"`);
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
  };

  const launchProgram = async () => {
    if (!program) return;
    try {
      const res = await fetch(`${API_URL}/api/programs/${programId}/launch`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'No se pudo lanzar');
      showToast('Programa lanzado en producción');
      fetchProgram();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error al lanzar', 'error'); }
  };

  const patchInfo = async (patch: Partial<{ name: string; description: string; theme: string; requires_certification: boolean }>) => {
    if (!program) return;
    try {
      const res = await fetch(`${API_URL}/api/programs/${programId}`, {
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
      const res = await fetch(`${API_URL}/api/companies/account/${program.company_id}/assign-pm`, {
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
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <I.Lock className="w-7 h-7" />
          </div>
          <h2 className="text-[17px] font-semibold text-gray-900 mb-1">Acceso restringido</h2>
          <p className="text-[13px] text-gray-500 mb-5">Esta consola solo está disponible para el Project Manager o administradores de Inspiratoria.</p>
          <div className="flex gap-2 justify-center">
            <Link href="/login" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-[12.5px] font-semibold hover:bg-gray-800">Iniciar sesión</Link>
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-[12.5px] font-semibold hover:bg-gray-200">Volver</button>
          </div>
        </div>
      </CenterPage>
    );
  }

  if (loading) return <CenterPage><Spinner /></CenterPage>;

  if (error || !program) {
    return (
      <CenterPage>
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <I.Alert className="w-7 h-7" />
          </div>
          <h2 className="text-[17px] font-semibold text-gray-900 mb-1">No se pudo cargar el programa</h2>
          <p className="text-[13px] text-gray-500 mb-5">{error || 'Programa no encontrado'}</p>
          <button onClick={() => router.push(`/dashboard/accounts`)} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-[12.5px] font-semibold hover:bg-gray-800">Volver a cuentas</button>
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        program={program}
        slug={slug}
        activeTab={activeTab}
        onTab={(t) => setActiveTab(t)}
      />

      <main className="ml-64 flex-1 min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-gray-100">
          <div className="px-8 py-3.5 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push(`/dashboard/accounts/${program.company_id}`)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
              >
                <I.Back className="w-3.5 h-3.5" /><span>Cuenta</span>
              </button>
              <span className="text-gray-300 text-[12px]">/</span>
              <div className="text-[12.5px] text-gray-500 truncate">
                <Link href={`/dashboard/accounts/${program.company_id}`} className="hover:text-gray-900">{program.company?.name || slug}</Link>
                <span className="mx-1.5 text-gray-300">/</span>
                <span className="text-gray-900 font-semibold">{program.name}</span>
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

        {/* Hero */}
        <section className="px-8 pt-8 pb-2 bg-white border-b border-gray-100">
          <div className="max-w-6xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Tag>{program.theme}</Tag>
              <TagSoft icon={<I.Building className="w-3 h-3" />}>{program.company?.name || 'Sin cuenta'}</TagSoft>
              {program.requires_certification && <TagAccent icon={<I.Award className="w-3 h-3" />}>Certificación</TagAccent>}
            </div>
            <h1 className="text-[30px] font-bold text-gray-900 tracking-tight leading-tight mb-2">{program.name}</h1>
            {program.description && <p className="text-[14.5px] text-gray-600 max-w-3xl leading-relaxed mb-7">{program.description}</p>}

            {kpis && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <Kpi icon={<I.Users />} label="Participantes" value={program.participants_count} sub={`${kpis.mentors} mentores · ${kpis.mentees} mentees`} accent="indigo" />
                <Kpi icon={<I.Activity />} label="Actividades" value={kpis.totalActivities} sub={`${kpis.completed} completadas · ${kpis.inProgress} activas`} accent="emerald" />
                <Kpi icon={<I.Module />} label="Módulos" value={kpis.totalModules} sub={`${kpis.totalHours} h de contenido`} accent="amber" />
                <Kpi icon={<I.Target />} label="Estado" value={stMeta.label} sub={program.updated_at ? `Actualizado ${formatDate(program.updated_at)}` : ''} accent="violet" />
              </div>
            )}
          </div>

          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {[
              { id: 'resumen', label: 'Resumen', icon: <I.Sparkles /> },
              { id: 'info', label: 'Información', icon: <I.Edit /> },
              { id: 'cronograma', label: 'Cronograma', icon: <I.Calendar /> },
              { id: 'actividades', label: 'Actividades', icon: <I.Activity /> },
              { id: 'participantes', label: 'Participantes', icon: <I.Users /> },
              { id: 'duplas', label: 'Duplas', icon: <I.Bot /> },
              { id: 'gobierno', label: 'Gobierno', icon: <I.Settings /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-[12.5px] font-semibold border-b-2 transition whitespace-nowrap ${
                  activeTab === t.id
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                <span className="w-3.5 h-3.5">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
        </section>

        <div className="px-8 py-7 max-w-6xl">
          {activeTab === 'resumen' && <TabResumen program={program} participants={participants} assignedPM={assignedPM} pms={pms} onAssignPM={assignPM} />}
          {activeTab === 'info' && <TabInfo program={program} onSave={patchInfo} />}
          {activeTab === 'cronograma' && <TabCronograma programId={programId} activities={program.activities} onChange={fetchProgram} showToast={showToast} />}
          {activeTab === 'actividades' && <TabActividades programId={programId} activities={program.activities} onChange={fetchProgram} showToast={showToast} />}
          {activeTab === 'participantes' && <TabParticipantes participants={participants} programId={programId} onChange={fetchProgram} showToast={showToast} />}
          {activeTab === 'duplas' && <TabDuplas programId={programId} participants={participants} showToast={showToast} />}
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
      `}</style>
    </div>
  );
}

// ============================================================================
// SIDEBAR
// ============================================================================
function Sidebar({ currentUser, onLogout, program, slug, activeTab, onTab }: {
  currentUser: CurrentUser | null;
  onLogout: () => void;
  program: ProgramDetail;
  slug: string;
  activeTab: string;
  onTab: (t: 'resumen' | 'info' | 'cronograma' | 'actividades' | 'participantes' | 'duplas' | 'gobierno') => void;
}) {
  const tabsNav: { id: 'resumen' | 'info' | 'cronograma' | 'actividades' | 'participantes' | 'duplas' | 'gobierno'; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen', icon: <I.Sparkles /> },
    { id: 'info', label: 'Información', icon: <I.Edit /> },
    { id: 'cronograma', label: 'Cronograma', icon: <I.Calendar /> },
    { id: 'actividades', label: 'Actividades', icon: <I.Activity /> },
    { id: 'participantes', label: 'Participantes', icon: <I.Users /> },
    { id: 'duplas', label: 'Duplas', icon: <I.Bot /> },
    { id: 'gobierno', label: 'Gobierno', icon: <I.Settings /> },
  ];

  const initials = (currentUser?.full_name || currentUser?.email || 'A').charAt(0).toUpperCase();
  const roleLabel = ROLE_LABELS[currentUser?.role || ''] || currentUser?.role || '';

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 z-40 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center overflow-hidden flex-shrink-0">
            <Image src="/images/logo.png" alt="Inspiratoria" width={36} height={36} className="object-cover" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900 leading-tight">Inspiratoria</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">PM Console</p>
          </div>
        </Link>
      </div>

      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 px-1">
          {currentUser?.avatar_url ? (
            <img src={currentUser.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate">{currentUser?.full_name || 'Admin'}</p>
            <p className="text-[10.5px] text-gray-500 truncate uppercase tracking-wider font-medium">{roleLabel}</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="En línea" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-5 pt-2 pb-2 text-[10px] text-gray-400 uppercase tracking-wider font-bold">Programa actual</p>
        <div className="mx-3 mb-2 px-3 py-2.5 rounded-lg bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 truncate">{program.company?.name || slug}</p>
          <p className="text-[12.5px] font-semibold text-gray-900 truncate mt-0.5">{program.name}</p>
        </div>
        <div className="px-3 space-y-0.5">
          {tabsNav.map(t => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition relative ${
                  active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-violet-400 rounded-r-full" />}
                <span className={`w-4 h-4 ${active ? 'text-violet-300' : 'text-gray-400'}`}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-gray-100 space-y-1">
        <Link
          href={`/studio/${slug}`}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
        >
          <I.Layout className="w-4 h-4" />
          Vista de Studio
        </Link>
        <Link
          href="/dashboard"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition"
        >
          <I.Home className="w-4 h-4" />
          Inicio admin
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
        >
          <I.Logout className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

// ============================================================================
// SHARED PRIMITIVES
// ============================================================================
function CenterPage({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">{children}</div>;
}
function Spinner() {
  return <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />;
}

function ActionBtn({ children, onClick, icon, variant, title }: { children: React.ReactNode; onClick: () => void; icon: React.ReactNode; variant: 'primary' | 'ghost' | 'danger' | 'disabled'; title?: string }) {
  const cls = {
    primary: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm',
    ghost: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100',
    disabled: 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed',
  }[variant];
  return (
    <button onClick={onClick} title={title} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${cls}`}>
      <span className="w-3.5 h-3.5">{icon}</span>{children}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100">{children}</span>;
}
function TagSoft({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">{icon}{children}</span>;
}
function TagAccent({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">{icon}{children}</span>;
}

const KPI_ACCENTS: Record<string, { bg: string; fg: string }> = {
  indigo:  { bg: 'bg-indigo-50',  fg: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50',   fg: 'text-amber-600' },
  violet:  { bg: 'bg-violet-50',  fg: 'text-violet-600' },
};
function Kpi({ icon, label, value, sub, accent = 'indigo' }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: 'indigo' | 'emerald' | 'amber' | 'violet' }) {
  const a = KPI_ACCENTS[accent];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:border-gray-200 transition">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={`w-8 h-8 rounded-lg ${a.bg} ${a.fg} flex items-center justify-center`}>
          <span className="w-4 h-4">{icon}</span>
        </div>
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      </div>
      <div className="text-[26px] font-bold text-gray-900 leading-none tracking-tight">{value}</div>
      {sub && <div className="mt-1.5 text-[11.5px] text-gray-500">{sub}</div>}
    </div>
  );
}

function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-[14px] font-bold text-gray-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11.5px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function Empty({ msg, icon }: { msg: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
        <span className="w-6 h-6">{icon || <I.Inbox />}</span>
      </div>
      <p className="text-[13px] text-gray-500">{msg}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition";

// ============================================================================
// TABS
// ============================================================================
function TabResumen({ program, participants, assignedPM, pms, onAssignPM }: { program: ProgramDetail; participants: Participant[]; assignedPM: AssignedPM | null; pms: PM[]; onAssignPM: (id: string | null) => void }) {
  const upcoming = (program.activities || [])
    .filter(a => a.start_date && new Date(a.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
    .slice(0, 4);

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card title="Workflow del programa" subtitle="Estado actual y siguientes pasos">
        <Workflow currentStatus={program.status} />
      </Card>

      <PMCard assignedPM={assignedPM} pms={pms} onAssignPM={onAssignPM} />

      <Card title="Próximas actividades" subtitle={`${upcoming.length} agendadas`}>
        {upcoming.length === 0 ? <Empty msg="No hay actividades agendadas a futuro" icon={<I.Calendar />} /> : (
          <div className="space-y-2">
            {upcoming.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-violet-50 transition">
                <div className="w-12 text-center bg-white rounded-lg py-1.5 border border-gray-200 flex-shrink-0">
                  <div className="text-[18px] font-bold text-gray-900 leading-none">{new Date(a.start_date!).getDate()}</div>
                  <div className="text-[9px] font-bold text-violet-600 uppercase mt-0.5">{new Date(a.start_date!).toLocaleString('es', { month: 'short' })}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-gray-900 truncate">{a.name}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><I.Globe className="w-3 h-3" />{MODALITY_META[a.modality]?.label || a.modality}</span>
                    <span className="inline-flex items-center gap-1"><I.Clock className="w-3 h-3" />{new Date(a.start_date!).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Roster reciente" subtitle={`${participants.length} miembros`}>
        {participants.length === 0 ? <Empty msg="Aún no hay participantes inscritos" icon={<I.Users />} /> : (
          <div className="grid grid-cols-2 gap-2">
            {participants.slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50">
                {p.user.avatar_url ? (
                  <img src={p.user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {(p.user.full_name || p.user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-gray-900 truncate">{p.user.full_name || p.user.email}</div>
                  <div className="text-[10px] text-gray-500 capitalize">{p.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PMCard({ assignedPM, pms, onAssignPM }: { assignedPM: AssignedPM | null; pms: PM[]; onAssignPM: (id: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = pms.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card title="Project Manager asignado" subtitle="Responsable del programa para esta cuenta" action={
      <button onClick={() => setOpen(o => !o)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-[11.5px] font-semibold hover:bg-gray-800 transition">
        <I.Edit className="w-3 h-3" />{assignedPM ? 'Cambiar' : 'Asignar'}
      </button>
    }>
      {assignedPM ? (
        <div className="flex items-start gap-4">
          {assignedPM.avatar_url ? (
            <img src={assignedPM.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[18px] font-bold text-white flex-shrink-0">
              {assignedPM.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-gray-900">{assignedPM.full_name}</div>
            {assignedPM.position && <div className="text-[12px] text-gray-600 mt-0.5">{assignedPM.position}</div>}
            <div className="text-[12px] text-gray-500 mt-1.5 inline-flex items-center gap-1.5"><I.Mail className="w-3 h-3" />{assignedPM.email}</div>
            {assignedPM.phone && <div className="text-[12px] text-gray-500 mt-1 inline-flex items-center gap-1.5"><I.Pin className="w-3 h-3" />{assignedPM.phone}</div>}
            <button onClick={() => onAssignPM(null)} className="mt-3 text-[11.5px] text-red-600 hover:text-red-700 font-semibold">Quitar PM</button>
          </div>
        </div>
      ) : (
        <Empty msg="No hay PM asignado a este programa" icon={<I.User />} />
      )}

      {open && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <div className="relative mb-3">
            <I.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text" placeholder="Buscar PM por nombre o email…"
              value={search} onChange={e => setSearch(e.target.value)}
              className={`${inputCls} pl-9`}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-[12px] text-gray-500 text-center py-4">No hay PMs disponibles</p>
            ) : filtered.map(p => (
              <button
                key={p.id}
                onClick={() => { onAssignPM(p.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-violet-50 transition text-left ${assignedPM?.id === p.id ? 'bg-violet-50 ring-1 ring-violet-200' : ''}`}
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-gray-900 truncate">{p.full_name}</div>
                  <div className="text-[10.5px] text-gray-500 truncate">{p.email} · {ROLE_LABELS[p.role] || p.role}</div>
                </div>
                {assignedPM?.id === p.id && <I.Check className="w-4 h-4 text-violet-600 flex-shrink-0" />}
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
              done ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white' : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
            } ${current ? 'ring-4 ring-violet-100' : ''}`}>
              {i < adjustedIdx ? <I.Check className="w-4 h-4" /> : i + 1}
            </div>
            <div className="mt-2.5">
              <div className={`text-[11.5px] font-bold ${done ? 'text-gray-900' : 'text-gray-500'}`}>{s.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{s.desc}</div>
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

        <label className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition cursor-pointer">
          <span className="relative flex-shrink-0 mt-0.5">
            <input type="checkbox" checked={requiresCert} onChange={e => setRequiresCert(e.target.checked)} className="sr-only peer" />
            <div className="w-10 bg-gray-300 rounded-full peer-checked:bg-violet-600 transition" style={{ height: '22px' }} />
            <div className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition ${requiresCert ? 'translate-x-[18px]' : ''}`} />
          </span>
          <div>
            <div className="text-[13px] font-semibold text-gray-900">Requiere certificación al finalizar</div>
            <div className="text-[11.5px] text-gray-500 mt-0.5">Los participantes recibirán un certificado al completar todas las actividades obligatorias.</div>
          </div>
        </label>

        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <button onClick={handleSave} disabled={!dirty || saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[12.5px] font-semibold hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
            <I.Save className="w-3.5 h-3.5" />{saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {!dirty && <span className="text-[11.5px] text-gray-400">Sin cambios pendientes</span>}
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
  const res = await fetch(`${API_URL}/api/activities/${a.id}`, {
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
      <div className={`rounded-2xl border p-5 ${undated.length === 0 && activities.length > 0 ? 'bg-emerald-50 border-emerald-200' : activities.length === 0 ? 'bg-gray-50 border-gray-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${undated.length === 0 && activities.length > 0 ? 'bg-emerald-500' : activities.length === 0 ? 'bg-gray-400' : 'bg-amber-500'}`}>
              {undated.length === 0 && activities.length > 0 ? <I.CheckCircle className="w-5 h-5" /> : <I.Alert className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-gray-900">
                {activities.length === 0 ? 'Sin actividades' :
                  undated.length === 0 ? 'Todas las actividades están programadas' :
                  `${undated.length} de ${activities.length} actividad${undated.length === 1 ? '' : 'es'} sin fecha`}
              </div>
              <p className="text-[12px] text-gray-600 mt-0.5">
                {activities.length === 0
                  ? 'Crea actividades en la pestaña Actividades para poder calendarizarlas.'
                  : undated.length === 0
                    ? 'Puedes pasar el programa a "Listo para ejecutar" desde la barra superior.'
                    : 'Calendariza todas las actividades antes de marcar el programa como listo.'}
              </p>
            </div>
          </div>
          {activities.length > 0 && (
            <button onClick={() => setWizardOpen(o => !o)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-[12px] font-semibold hover:bg-gray-800 transition flex-shrink-0">
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
                <button onClick={runWizard} className="w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[12px] font-semibold hover:from-violet-700 hover:to-indigo-700 transition">
                  Programar {wizard.overwrite ? activities.length : undated.length}
                </button>
              </div>
            </div>
            <label className="mt-3 inline-flex items-center gap-2 text-[12px] text-gray-700 cursor-pointer">
              <input type="checkbox" checked={wizard.overwrite} onChange={e => setWizard({ ...wizard, overwrite: e.target.checked })} className="w-4 h-4 accent-violet-600" />
              Sobrescribir fechas existentes (re-programar todas)
            </label>
            <p className="text-[11px] text-gray-500 mt-2">
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
                <div key={a.id} className={`p-4 rounded-xl border transition ${hasDate ? 'bg-white border-gray-200' : 'bg-amber-50/40 border-amber-200'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${hasDate ? 'bg-violet-50 text-violet-600' : 'bg-amber-100 text-amber-700'}`}>
                      {hasDate ? <I.Calendar className="w-5 h-5" /> : <I.Alert className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold text-gray-900">{a.name}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1"><I.Globe className="w-3 h-3" />{MODALITY_META[a.modality]?.label || a.modality}</span>
                        <span className="inline-flex items-center gap-1"><I.Module className="w-3 h-3" />{a.modules?.length || 0} módulos</span>
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
                        className="px-3 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[12px] font-semibold hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition inline-flex items-center gap-1.5"
                      >
                        <I.Save className="w-3.5 h-3.5" />
                        {isBusy ? '…' : 'Guardar'}
                      </button>
                      {hasDate && (
                        <button onClick={() => clearSingle(a)} disabled={isBusy} className="px-3 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-[12px] font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-40 transition">
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
                    <div className="text-[22px] font-bold text-gray-900 leading-none">{date.getDate()}</div>
                    <div className="text-[9.5px] font-bold text-violet-600 uppercase mt-1 tracking-widest">{date.toLocaleString('es', { month: 'short' })}</div>
                    <div className="text-[10.5px] text-gray-500 mt-1">{date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="relative flex flex-col items-center pt-3">
                    <div className="w-3 h-3 rounded-full ring-4 flex-shrink-0" style={{ background: aMeta.color, boxShadow: `0 0 0 3px ${aMeta.bg}` }} />
                    {i < sorted.length - 1 && <div className="flex-1 w-[2px] bg-gradient-to-b from-violet-200 to-transparent mt-1" />}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-violet-200 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-bold text-gray-900">{a.name}</div>
                        {a.description && <div className="text-[12px] text-gray-500 mt-1 leading-relaxed">{a.description}</div>}
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0" style={{ background: aMeta.bg, color: aMeta.color }}>{aMeta.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 mt-2">
                      <span className="inline-flex items-center gap-1"><I.Globe className="w-3 h-3" />{MODALITY_META[a.modality]?.label || a.modality}</span>
                      <span className="inline-flex items-center gap-1"><I.Module className="w-3 h-3" />{a.modules?.length || 0} módulos</span>
                      {a.is_certificate_issued && <span className="inline-flex items-center gap-1 text-amber-600"><I.Award className="w-3 h-3" />Certifica</span>}
                      {a.meeting_url && <a href={a.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700"><I.Link className="w-3 h-3" />Sala</a>}
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
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      showToast(editingId ? 'Actividad actualizada' : 'Actividad creada');
      cancel(); onChange();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (id: number | string) => {
    if (!confirm('¿Eliminar esta actividad?')) return;
    try {
      const res = await fetch(`${API_URL}/api/activities/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      showToast('Actividad eliminada'); onChange();
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Error', 'error'); }
  };

  return (
    <Card title="Gestión de actividades" subtitle={`${activities.length} actividades en el programa`} action={
      !showForm ? (
        <button onClick={startCreate} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[12px] font-semibold hover:from-violet-700 hover:to-indigo-700 transition">
          <I.Plus className="w-3.5 h-3.5" />Nueva actividad
        </button>
      ) : null
    }>
      {showForm && (
        <div className="mb-5 p-5 rounded-xl bg-violet-50/40 border border-violet-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-gray-900">{editingId ? 'Editar actividad' : 'Nueva actividad'}</h3>
            <button onClick={cancel} className="p-1.5 rounded-md text-gray-500 hover:bg-white"><I.Close className="w-4 h-4" /></button>
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
              <label className="inline-flex items-center gap-2.5 text-[12.5px] text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_certificate_issued} onChange={e => setForm({ ...form, is_certificate_issued: e.target.checked })} className="w-4 h-4 accent-violet-600" />
                Emite certificado al completar
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-violet-100">
            <button onClick={cancel} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-[12px] font-semibold hover:bg-gray-50">Cancelar</button>
            <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[12px] font-semibold disabled:opacity-50">{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear actividad'}</button>
          </div>
        </div>
      )}

      {activities.length === 0 && !showForm ? (
        <Empty msg="Aún no hay actividades. Crea la primera." icon={<I.Activity />} />
      ) : (
        <div className="space-y-2">
          {activities.map(a => {
            const aMeta = ACTIVITY_STATUS_META[a.status] || { label: a.status, color: '#64748b', bg: '#f1f5f9' };
            return (
              <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-violet-200 hover:shadow-sm transition">
                <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                  {a.type === 'training' ? <I.Module className="w-5 h-5" /> : <I.Calendar className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[13.5px] font-bold text-gray-900">{a.name}</div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: aMeta.bg, color: aMeta.color }}>{aMeta.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-gray-500">
                    {a.start_date && <span className="inline-flex items-center gap-1"><I.Calendar className="w-3 h-3" />{new Date(a.start_date).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                    <span className="inline-flex items-center gap-1"><I.Globe className="w-3 h-3" />{MODALITY_META[a.modality]?.label || a.modality}</span>
                    <span className="inline-flex items-center gap-1"><I.Module className="w-3 h-3" />{a.modules?.length || 0} módulos</span>
                    {a.is_certificate_issued && <span className="inline-flex items-center gap-1 text-amber-600"><I.Award className="w-3 h-3" />Certifica</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(a)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"><I.Edit className="w-4 h-4" /></button>
                  <button onClick={() => remove(a.id)} className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition"><I.Trash className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
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
  mentor: 'bg-violet-50 text-violet-700',
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
      const res = await fetch(`${API_URL}/api/programs/${programId}/participants/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      showToast('Participante removido'); onChange();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Error', 'error');
    } finally { setBusyId(null); }
  };

  const resend = async (id: string, email: string) => {
    try {
      setBusyId(id);
      const res = await fetch(`${API_URL}/api/programs/${programId}/participants/${id}/resend-invitation`, { method: 'POST' });
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
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50/60 p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-violet-100 flex items-center justify-center text-violet-600">
          <I.Link className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-violet-900 uppercase tracking-wider">Link de auto-inscripción</div>
          <div className="text-[11.5px] text-gray-600 mt-0.5">Compártelo para que cualquier persona pueda registrarse al programa por sí misma.</div>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={enrollLink} className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-white border border-violet-100 text-[12px] text-gray-700 font-mono" />
            <button onClick={copyEnrollLink} className="px-3 py-1.5 rounded-lg bg-gray-900 text-yellow-300 text-[12px] font-semibold hover:bg-gray-800 transition flex-shrink-0">Copiar</button>
            <a href={enrollLink} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[12px] font-semibold text-gray-700 hover:border-gray-300 transition flex-shrink-0">Abrir</a>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Mentores', value: stats.mentors, color: 'text-violet-700' },
          { label: 'Mentees', value: stats.mentees, color: 'text-sky-700' },
          { label: 'Facilitadores', value: stats.facilitators, color: 'text-amber-700' },
          { label: 'Pendientes', value: stats.pending, color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3">
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-[10.5px] uppercase tracking-wider text-gray-500 font-semibold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <Card
        title="Participantes"
        subtitle={`${stats.total} miembros · ${stats.active} activos · ${stats.pending} pendientes de activar`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <I.Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar nombre o email…"
                className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-violet-500 w-48"
              />
            </div>
            <div className="inline-flex p-1 bg-gray-100 rounded-lg">
              {([
                { key: 'all', label: 'Todos' },
                { key: 'mentor', label: 'Mentores' },
                { key: 'mentee', label: 'Mentees' },
                { key: 'facilitator', label: 'Facilit.' },
                { key: 'participant_cell', label: 'Particip.' },
              ] as const).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-yellow-300 text-[12px] font-semibold hover:bg-gray-800 transition">
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
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-violet-200 transition">
                  {p.user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-bold text-gray-900">{name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${PARTICIPANT_ROLE_BADGE[p.role] || 'bg-gray-100 text-gray-600'}`}>
                        {PARTICIPANT_ROLE_LABEL[p.role] || p.role}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                        p.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        p.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status === 'active' ? 'Activo' : p.status === 'pending' ? 'Pendiente' : p.status}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-gray-500 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span>{p.user.email}</span>
                      {p.user.telefono && <><span>·</span><span>{p.user.telefono}</span></>}
                      {p.invitation_sent_at && (
                        <><span>·</span><span>Invitado {new Date(p.invitation_sent_at).toLocaleDateString('es-CL')}</span></>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => resend(p.id, p.user.email)}
                      disabled={busyId === p.id}
                      title="Reenviar invitación por email"
                      className="p-2 rounded-lg text-gray-400 hover:bg-violet-50 hover:text-violet-600 transition disabled:opacity-40"
                    >
                      <I.Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      disabled={busyId === p.id}
                      title="Quitar del programa"
                      className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
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
        const res = await fetch(`${API_URL}/api/programs/users/search?q=${encodeURIComponent(query.trim())}&exclude_program_id=${programId}&limit=10`);
        if (res.ok) setHits(await res.json());
      } finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [query, tab, programId]);

  const enroll = async (userId: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/api/programs/${programId}/participants`, {
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
      const userRes = await fetch(`${API_URL}/api/programs/users`, {
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
      <div className="bg-white rounded-2xl border border-gray-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Agregar participante</h3>
            <p className="text-[11.5px] text-gray-500 mt-0.5">Busca un usuario existente o crea uno nuevo.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"><I.Close className="w-4 h-4" /></button>
        </div>

        <div className="px-5 pt-4">
          <div className="inline-flex p-1 bg-gray-100 rounded-lg w-full">
            {(['search', 'create'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[12.5px] font-semibold transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Rol en el programa</label>
            <div className="grid grid-cols-2 gap-2">
              {(['mentor', 'mentee', 'facilitator', 'participant_cell'] as ParticipantRole[]).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)} className={`px-3 py-2 rounded-lg text-[12px] font-semibold border transition ${role === r ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                  {PARTICIPANT_ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          {/* email invitation toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
            <input type="checkbox" checked={sendInvitation} onChange={e => setSendInvitation(e.target.checked)} className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500" />
            <div className="flex-1">
              <div className="text-[12.5px] font-semibold text-gray-900">Enviar invitación por email</div>
              <div className="text-[11px] text-gray-500">Recibirá un código OTP de 4 dígitos y un link para activar su cuenta.</div>
            </div>
          </label>

          {tab === 'search' ? (
            <div className="space-y-3">
              <div className="relative">
                <I.Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Email, nombre o apellido…"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              {searching && <div className="text-[12px] text-gray-400">Buscando…</div>}
              {!searching && query.trim().length >= 2 && hits.length === 0 && (
                <div className="text-[12px] text-gray-500 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  No encontramos usuarios. Cambia a <button onClick={() => { setTab('create'); setEmail(query.includes('@') ? query.trim() : ''); }} className="text-violet-600 font-semibold hover:underline">Crear nuevo</button>.
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
                      className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50/30 transition disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                        {hitName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-semibold text-gray-900 truncate">{hitName}</div>
                        <div className="text-[11px] text-gray-500 truncate">{h.email}{h.company ? ` · ${h.company}` : ''}</div>
                      </div>
                      <span className="text-[11px] text-violet-600 font-semibold flex-shrink-0">Agregar →</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={createAndEnroll} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="persona@correo.com" className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre</label>
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Apellido</label>
                  <input required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-gray-900 text-yellow-300 text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-60">
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
function TabDuplas({ programId, participants, showToast }: { programId: string; participants: Participant[]; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [vincs, setVincs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [matchLoading, setMatchLoading] = React.useState(false);
  const [matchResults, setMatchResults] = React.useState<any[]>([]);
  const [matchRan, setMatchRan] = React.useState(false);
  const [matchError, setMatchError] = React.useState('');
  const [useAI, setUseAI] = React.useState(true);
  const [activations, setActivations] = React.useState<Record<string, 'loading' | 'done' | 'error'>>({});
  const [expandedAI, setExpandedAI] = React.useState<Record<string, boolean>>({});

  const loadVincs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/programs/${programId}/vinculations`);
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
      await fetch(`${API_URL}/api/programs/${programId}/vinculations/${vid}`, { method: 'DELETE' });
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
      const res = await fetch(`${API_URL}/api/matches/intelligent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId, top_k: 20, min_score: 0, use_ai: useAI }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setMatchResults(data.results || []);
      setMatchRan(true);
    } catch (e: any) { setMatchError(e.message || 'Error al generar matches'); }
    setMatchLoading(false);
  };

  const activatePair = async (mentor_user_id: string, mentee_user_id: string, score: number, ai_rec?: string) => {
    const key = `${mentor_user_id}-${mentee_user_id}`;
    setActivations(p => ({ ...p, [key]: 'loading' }));
    try {
      const res = await fetch(`${API_URL}/api/matches/intelligent/activate`, {
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
            <h2 className="text-[18px] font-bold text-gray-900">Duplas vigentes</h2>
            <p className="text-[12.5px] text-gray-500 mt-0.5">{loading ? '…' : `${vincs.length} ${vincs.length === 1 ? 'dupla activa' : 'duplas activas'}`}</p>
          </div>
          <button onClick={loadVincs} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:bg-gray-50 transition disabled:opacity-40">
            {loading ? '…' : '↺ Actualizar'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 rounded-2xl border border-gray-100 bg-white"><Spinner /></div>
        ) : vincs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <I.Bot className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-[14px] font-semibold text-gray-700">Sin duplas activas</p>
            <p className="text-[12px] text-gray-400 mt-1">Genera matches con IA en la sección de abajo para crear vinculaciones.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mentor</span>
              <span />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mentee</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Score</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Origen</span>
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
                <div key={v.id} className={`grid grid-cols-[1fr_auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-gray-50' : ''} hover:bg-gray-50/50 transition`}>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{mentorName}</p>
                    <p className="text-[11px] text-gray-400 truncate">{mentorEmail}</p>
                  </div>
                  <span className="text-gray-300 text-[18px] flex-shrink-0">↔</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{menteeName}</p>
                    <p className="text-[11px] text-gray-400 truncate">{menteeEmail}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {c ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: c.bg, color: c.color }}>{Number(score).toFixed(0)} pts</span>
                    ) : <span className="text-[11px] text-gray-300">—</span>}
                  </div>
                  <div className="flex-shrink-0">
                    {isAI
                      ? <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(245,200,0,0.15)', color: '#7a5900' }}>✨ IA</span>
                      : <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500">Manual</span>}
                  </div>
                  <button onClick={() => removeVinc(v.id)} title="Desvincular"
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[17px] text-gray-300 hover:bg-red-50 hover:text-red-500 transition">×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative py-1 mb-7">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center"><span className="bg-gray-50 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">Generar con IA</span></div>
      </div>

      {/* ══ SECCIÓN 2: SUGERENCIAS ══ */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900">Sugerencias de match</h2>
            <p className="text-[12.5px] text-gray-500 mt-0.5">
              {mentors.length} mentor{mentors.length !== 1 ? 'es' : ''} · {mentees.length} mentee{mentees.length !== 1 ? 's' : ''} · Motor potenciado con Claude
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="flex items-center gap-2 text-[12px] cursor-pointer select-none text-gray-600">
              <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="h-3.5 w-3.5 rounded border-gray-300" />
              ✨ Claude
            </label>
            <button onClick={runMatch} disabled={matchLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-gray-800 transition disabled:opacity-60">
              {matchLoading
                ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>Analizando…</>
                : <>✨ Generar matches</>}
            </button>
          </div>
        </div>

        {matchError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700 mb-4">{matchError}</div>}

        {!matchRan && !matchLoading && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
            <p className="text-[13px] text-gray-500">Pulsa «✨ Generar matches» para ver sugerencias de duplas.</p>
          </div>
        )}

        {matchResults.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_auto] items-center gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">#</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mentor</span>
              <span />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mentee</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Score</span>
              <span />
            </div>
            {matchResults.map((r: any, idx: number) => {
              const key = `${r.mentor?.id}-${r.mentee?.id}`;
              const act = activations[key];
              const alreadyActive = vincs.some((v: any) => (v.mentor?.id === r.mentor?.id) && (v.mentee?.id === r.mentee?.id));
              const c = sc(r.score || 0);
              const expanded = expandedAI[key];
              return (
                <div key={key} className={`${idx > 0 ? 'border-t border-gray-50' : ''}`}>
                  <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_auto] items-center gap-3 px-5 py-4 hover:bg-gray-50/40 transition">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: c.bg, color: c.color }}>{idx + 1}</div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{r.mentor?.name || '—'}</p>
                      <p className="text-[11px] text-gray-400 truncate">{r.mentor?.email || ''}</p>
                    </div>
                    <span className="text-gray-300 flex-shrink-0">↔</span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{r.mentee?.name || '—'}</p>
                      <p className="text-[11px] text-gray-400 truncate">{r.mentee?.email || ''}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold flex-shrink-0" style={{ background: c.bg, color: c.color }}>{(r.score || 0).toFixed(0)} pts</span>
                    <div className="flex-shrink-0">
                      {alreadyActive || act === 'done' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700 ring-1 ring-emerald-200 whitespace-nowrap">✓ Activa</span>
                      ) : act === 'loading' ? (
                        <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      ) : (
                        <button onClick={() => activatePair(r.mentor?.id, r.mentee?.id, r.score, r.ai_recommendation)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-gray-800 transition whitespace-nowrap">⚡ Vincular</button>
                      )}
                    </div>
                  </div>
                  {r.ai_recommendation && (
                    <div className="px-5 pb-3">
                      <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(245,200,0,0.06)', borderLeft: '2.5px solid rgba(245,200,0,0.5)' }}>
                        <p className={`text-[11.5px] text-gray-600 leading-relaxed ${expanded ? '' : 'line-clamp-1'}`}>{r.ai_recommendation}</p>
                        <button onClick={() => setExpandedAI(p => ({ ...p, [key]: !p[key] }))}
                          className="text-[10.5px] font-semibold mt-1" style={{ color: '#7a5900' }}>{expanded ? 'Ver menos ▴' : 'Ver análisis ▾'}</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
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
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-left transition ${active ? 'cursor-default' : 'bg-white border-gray-200 hover:border-violet-300 hover:bg-violet-50/30 cursor-pointer'}`}
                style={active ? { background: meta.bg, borderColor: meta.ring, boxShadow: `0 0 0 2px ${meta.ring}` } : {}}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.dot }} />
                <span className="text-[12px] font-semibold flex-1" style={{ color: active ? meta.color : '#1f2937' }}>{meta.label}</span>
                {active && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: meta.color, color: '#fff' }}>Actual</span>}
              </button>
            );
          })}
        </div>
      </Card>

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
        <div className="divide-y divide-gray-100 rounded-xl bg-gray-50 overflow-hidden">
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
    <Link href={href} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50/30 transition group">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
        <span className="w-5 h-5">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold text-gray-900 group-hover:text-violet-700">{title}</div>
        <div className="text-[11.5px] text-gray-500 mt-0.5">{sub}</div>
      </div>
      <I.ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 mt-1.5 flex-shrink-0" />
    </Link>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-white">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <span className={`text-[12px] text-gray-900 text-right break-all ${mono ? 'font-mono text-[11px] text-violet-700' : ''}`}>{value}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}
