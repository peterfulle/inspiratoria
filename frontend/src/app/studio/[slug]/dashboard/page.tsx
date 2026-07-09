'use client';
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch } from "@/lib/api";

/**
 * Vista Corporativa — el dashboard de solo lectura que ve la propia empresa
 * cliente (o un admin de Inspiratoria en modo preview vía "Vista Corporativa"
 * desde /studio/[slug]/program/[programId]).
 *
 * Es deliberadamente una página nueva y separada del portal legacy en
 * studio/[slug]/page.tsx (que sigue sirviendo /studio/[slug]/[section] para
 * participantes, ecosistema, facturación, etc.) — Next.js prioriza esta ruta
 * literal sobre el catch-all [section] para /studio/[slug]/dashboard.
 *
 * Reutiliza exactamente los mismos endpoints que la consola admin
 * (/studio/[slug]/program/[programId]) para garantizar paridad de datos en
 * tiempo real, pero sin ningún control de edición.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const ADMIN_ROLES = new Set(['superadmin', 'admin_root', 'inspiratoria_admin', 'coordinator']);
const PARTICIPANT_ROLES = new Set(['facilitator', 'mentor', 'mentee', 'participant_cell', 'participant', 'facilitator_internal']);

// ============================================================================
// TYPES
// ============================================================================
interface ProgramModule {
  id: number; title: string; description: string; order: number;
  duration_minutes: number; is_published: boolean; materials_url: string;
  requires_evaluation: boolean; minimum_score: number;
}
interface ProgramActivity {
  id: number | string; type: string; name: string; description: string; category: string;
  status: string; modality: string; start_date: string | null; end_date: string | null;
  is_certificate_issued: boolean; modules: ProgramModule[];
}
interface CompanyProfile { id: string; name: string; slug: string; plan?: string; status?: string; }
interface ProgramSummary { id: string; name: string; status: string; }
interface ProgramDetail {
  id: string; name: string; description: string; theme: string; status: string;
  company_id: string | null; company: { id: string; name: string; slug: string } | null;
  cohort_year?: number | null;
  activities: ProgramActivity[]; participants_count: number;
  requires_certification: boolean; created_at: string | null; updated_at: string | null;
}
interface Participant {
  id: string;
  user: { full_name: string; email: string; telefono?: string; avatar_url?: string };
  role: string; status: string; invitation_sent_at: string | null;
}
interface AssignedPM { id: string; full_name: string; email: string; avatar_url?: string; position?: string; }
interface CurrentUser { id: string; full_name: string; email: string; role: string; avatar_url?: string; portal_code?: string; }

// ============================================================================
// ICONS (subconjunto — mismo trazo que la consola admin)
// ============================================================================
function SvgBase(children: React.ReactNode) {
  return (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
  );
}
const I = {
  Back:        SvgBase(<path d="M15 18l-6-6 6-6" />),
  Building:    SvgBase(<><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M9 9h.01M9 13h.01M9 17h.01M13 9h.01M13 13h.01M13 17h.01M17 9h.01M17 13h.01M17 17h.01" /></>),
  Sparkles:    SvgBase(<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />),
  Calendar:    SvgBase(<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>),
  Activity:    SvgBase(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />),
  Module:      SvgBase(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>),
  Users:       SvgBase(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  Clock:       SvgBase(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
  Award:       SvgBase(<><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>),
  Globe:       SvgBase(<><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>),
  Check:       SvgBase(<polyline points="20 6 9 17 4 12" />),
  CheckCircle: SvgBase(<><circle cx="12" cy="12" r="10" /><polyline points="9 12 12 15 17 10" /></>),
  Alert:       SvgBase(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>),
  Inbox:       SvgBase(<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>),
  Home:        SvgBase(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>),
  Logout:      SvgBase(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>),
  Layout:      SvgBase(<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></>),
  Target:      SvgBase(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>),
  Swap:        SvgBase(<><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>),
  Lock:        SvgBase(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
};

// ============================================================================
// STATUS META — rampa monocromática ordinal (más oscuro = etapa más avanzada
// o más activa ahora mismo). Sin tono/hue: solo zinc, por pedido explícito de
// una vista "sin colores, profesional" para gerentes.
// ============================================================================
const STATUS_META: Record<string, { label: string; color: string; bg: string; ring: string; dot: string }> = {
  designed:            { label: 'Diseñado',            color: '#71717a', bg: '#fafafa', ring: '#e4e4e7', dot: '#a1a1aa' },
  ready_for_execution: { label: 'Listo para ejecutar', color: '#52525b', bg: '#f4f4f5', ring: '#d4d4d8', dot: '#71717a' },
  in_execution:        { label: 'En ejecución',        color: '#ffffff', bg: '#18181b', ring: '#18181b', dot: '#ffffff' },
  under_review:        { label: 'En revisión',         color: '#3f3f46', bg: '#f4f4f5', ring: '#a1a1aa', dot: '#52525b' },
  closed:              { label: 'Cerrado',             color: '#a1a1aa', bg: '#fafafa', ring: '#e4e4e7', dot: '#d4d4d8' },
  draft:               { label: 'Borrador',            color: '#a1a1aa', bg: '#fafafa', ring: '#e4e4e7', dot: '#d4d4d8' },
  active:              { label: 'Activo',              color: '#ffffff', bg: '#18181b', ring: '#18181b', dot: '#ffffff' },
  paused:              { label: 'Pausado',             color: '#3f3f46', bg: '#f4f4f5', ring: '#a1a1aa', dot: '#52525b' },
  completed:           { label: 'Completado',          color: '#71717a', bg: '#fafafa', ring: '#e4e4e7', dot: '#a1a1aa' },
};
const ACTIVITY_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  created:    { label: 'Creada',     color: '#71717a', bg: '#fafafa' },
  scheduled:  { label: 'Agendada',   color: '#52525b', bg: '#f4f4f5' },
  in_progress:{ label: 'En curso',   color: '#ffffff', bg: '#18181b' },
  completed:  { label: 'Completada', color: '#a1a1aa', bg: '#fafafa' },
  cancelled:  { label: 'Cancelada',  color: '#71717a', bg: '#f4f4f5' },
};
const MODALITY_META: Record<string, { label: string }> = { online: { label: 'Online' }, presencial: { label: 'Presencial' }, hybrid: { label: 'Híbrida' } };
const PARTICIPANT_ROLE_LABEL: Record<string, string> = { mentor: 'Mentor', mentee: 'Mentee', facilitator: 'Facilitador', participant_cell: 'Participante' };
const PARTICIPANT_ROLE_BADGE: Record<string, string> = {
  mentor: 'bg-zinc-900 text-white', mentee: 'bg-zinc-200 text-zinc-800',
  facilitator: 'bg-zinc-100 text-zinc-600 border border-zinc-300', participant_cell: 'bg-zinc-100 text-zinc-600',
};
const WORKFLOW_STEPS = [
  { id: 'designed',            label: 'Diseñado',     desc: 'Estructura definida' },
  { id: 'ready_for_execution', label: 'Listo',        desc: 'Usuarios cargados' },
  { id: 'in_execution',        label: 'En ejecución', desc: 'Programa activo' },
  { id: 'closed',              label: 'Cerrado',      desc: 'Programa finalizado' },
];

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

// ============================================================================
// PRIMITIVOS (mismo lenguaje visual que la consola admin)
// ============================================================================
function CenterPage({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">{children}</div>;
}
function Spinner() { return <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />; }

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-zinc-200/70 overflow-hidden">
      <header className="px-5 py-3.5 border-b border-zinc-100">
        <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-[11.5px] text-zinc-400 mt-0.5">{subtitle}</p>}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
function Empty({ msg, icon }: { msg: string; icon?: React.ReactNode }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3"><span className="w-6 h-6">{icon || <I.Inbox />}</span></div>
      <p className="text-[13px] text-zinc-500">{msg}</p>
    </div>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-900 border border-zinc-200">{children}</span>;
}
function TagSoft({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700">{icon}{children}</span>;
}
function TagAccent({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-900 text-white">{icon}{children}</span>;
}
function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="group bg-white rounded-xl border border-zinc-200/70 px-5 py-4 hover:border-zinc-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{label}</span>
        <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors"><span className="w-3.5 h-3.5">{icon}</span></span>
      </div>
      <div className="text-[28px] font-semibold text-zinc-900 leading-none tracking-tight">{value}</div>
      {sub && <div className="mt-2 text-[11.5px] text-zinc-500">{sub}</div>}
    </div>
  );
}
function ProgressStat({ label, pct, caption }: { label: string; pct: number; caption: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[12px] font-semibold text-zinc-700">{label}</span>
        <span className="text-[22px] font-bold text-zinc-900 leading-none tracking-tight">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${pct}%` }} /></div>
      <div className="text-[11px] text-zinc-400 mt-2">{caption}</div>
    </div>
  );
}
function CompositionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium text-zinc-700">{label}</span>
        <span className="text-[12px] font-semibold text-zinc-900">{count}<span className="text-zinc-400 font-normal"> · {pct}%</span></span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}
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
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold transition ${done ? 'bg-gradient-to-br from-zinc-700 to-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400 border-2 border-zinc-200'} ${current ? 'ring-4 ring-zinc-200' : ''}`}>
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

// ============================================================================
// SIDEBAR (solo lectura — sin tabs de edición)
// ============================================================================
type CorpTab = 'resumen' | 'info' | 'actividades' | 'participantes' | 'duplas';

function Sidebar({ currentUser, onLogout, company, program, activeTab, onTab, isPreview, slug }: {
  currentUser: CurrentUser | null; onLogout: () => void; company: CompanyProfile; program: ProgramDetail | null;
  activeTab: CorpTab; onTab: (t: CorpTab) => void; isPreview: boolean; slug: string;
}) {
  const tabsNav: { id: CorpTab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen', icon: <I.Sparkles /> },
    { id: 'info', label: 'Información', icon: <I.Building /> },
    { id: 'actividades', label: 'Actividades', icon: <I.Activity /> },
    { id: 'participantes', label: 'Participantes', icon: <I.Users /> },
    { id: 'duplas', label: 'Duplas', icon: <I.Swap /> },
  ];
  const initials = (currentUser?.full_name || currentUser?.email || 'C').charAt(0).toUpperCase();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-50/60 border-r border-zinc-200/70 z-40 flex flex-col backdrop-blur-sm">
      <div className="px-4 py-4">
        <Link href={isPreview ? `/studio/${slug}/program` : '/studio'} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center overflow-hidden flex-shrink-0">
            <Image src="/images/logo.png" alt="Inspiratoria" width={32} height={32} className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-zinc-900 leading-tight tracking-tight">Inspiratoria</p>
            <p className="text-[10px] text-zinc-400 font-medium tracking-tight">Vista Corporativa</p>
          </div>
        </Link>
      </div>

      <div className="px-3 pb-3">
        <div className="px-3 py-2.5 rounded-lg bg-white border border-zinc-200/80">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-zinc-400 truncate">{company.name}</p>
          <p className="text-[12.5px] font-semibold text-zinc-900 truncate mt-0.5 leading-snug">{program?.name || 'Sin programa'}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <div className="space-y-0.5">
          {tabsNav.map(t => {
            const active = activeTab === t.id;
            const disabled = !program;
            return (
              <button
                key={t.id}
                disabled={disabled}
                onClick={() => onTab(t.id)}
                className={`group/nav w-full flex items-center gap-2.5 pl-3 pr-2 py-[7px] rounded-lg text-[12.5px] font-medium transition-colors relative disabled:opacity-40 disabled:cursor-not-allowed ${
                  active ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-zinc-200/70' : 'text-zinc-500 hover:bg-white/70 hover:text-zinc-900'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 rounded-r-full" />}
                <span className={`w-[15px] h-[15px] transition-colors ${active ? 'text-blue-600' : 'text-zinc-400 group-hover/nav:text-zinc-600'}`}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-200/70 space-y-0.5">
          <div className="flex items-center gap-2 pl-3 pr-2 py-[7px] rounded-lg text-[11px] text-zinc-400">
            <I.Lock className="w-[13px] h-[13px]" />
            Vista de solo lectura
          </div>
          {isPreview && (
            <Link href="/dashboard" className="w-full flex items-center gap-2.5 pl-3 pr-2 py-[7px] rounded-lg text-[12px] text-zinc-500 hover:bg-white/70 hover:text-zinc-900 transition-colors">
              <I.Home className="w-[15px] h-[15px] text-zinc-400" />
              Inicio admin
            </Link>
          )}
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-zinc-200/70">
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          {currentUser?.avatar_url ? (
            <img src={currentUser.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0">{initials}</div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-zinc-900 truncate leading-tight">{currentUser?.full_name || company.name}</p>
            <p className="text-[10.5px] text-zinc-400 truncate">{isPreview ? 'Vista previa (admin)' : 'Cuenta Studio'}</p>
          </div>
          <button onClick={onLogout} title="Cerrar sesión" className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0">
            <I.Logout className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ============================================================================
// TABS — todas de solo lectura
// ============================================================================
function TabResumen({ program, participants, assignedPM }: { program: ProgramDetail; participants: Participant[]; assignedPM: AssignedPM | null }) {
  const acts = program.activities || [];
  const totalActs = acts.length;
  const completedActs = acts.filter(a => a.status === 'completed').length;
  const totalP = participants.length;
  const mentors = participants.filter(p => p.role === 'mentor').length;
  const mentees = participants.filter(p => p.role === 'mentee').length;
  const others = totalP - mentors - mentees;
  const activated = participants.filter(p => p.invitation_sent_at).length;

  const LIFECYCLE_PCT: Record<string, number> = { draft: 10, designed: 25, ready_for_execution: 55, under_review: 50, in_execution: 80, active: 80, closed: 100, completed: 100, paused: 70 };
  const lifePct = LIFECYCLE_PCT[program.status] ?? 25;
  const actPct = totalActs ? Math.round((completedActs / totalActs) * 100) : 0;
  const activationPct = totalP ? Math.round((activated / totalP) * 100) : 0;
  const stMeta = STATUS_META[program.status] || STATUS_META.draft;

  return (
    <div className="space-y-5">
      <Card title="Progreso del programa" subtitle="Avance general de la cohorte">
        <div className="grid sm:grid-cols-3 gap-6">
          <ProgressStat label="Ciclo de vida" pct={lifePct} caption={stMeta.label} />
          <ProgressStat label="Actividades completadas" pct={actPct} caption={`${completedActs} de ${totalActs} actividades`} />
          <ProgressStat label="Participantes" pct={activationPct} caption={`${activated} de ${totalP} invitados`} />
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Composición de participantes" subtitle={`${totalP} miembros`}>
          {totalP === 0 ? <Empty msg="Aún no hay participantes inscritos" icon={<I.Users />} /> : (
            <div className="space-y-3">
              <CompositionBar label="Mentores" count={mentors} total={totalP} color="#18181b" />
              <CompositionBar label="Mentees" count={mentees} total={totalP} color="#71717a" />
              {others > 0 && <CompositionBar label="Otros roles" count={others} total={totalP} color="#d4d4d8" />}
            </div>
          )}
        </Card>

        <Card title="Workflow del programa" subtitle="Estado actual del ciclo de vida">
          <Workflow currentStatus={program.status} />
        </Card>

        <Card title="Project Manager" subtitle="Responsable del programa para esta cuenta">
          {assignedPM ? (
            <div className="flex items-center gap-3">
              {assignedPM.avatar_url ? (
                <img src={assignedPM.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-zinc-900 flex items-center justify-center text-[14px] font-bold text-white flex-shrink-0">{(assignedPM.full_name || 'PM').charAt(0)}</div>
              )}
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900 truncate">{assignedPM.full_name}</p>
                <p className="text-[11.5px] text-zinc-500 truncate">{assignedPM.email}</p>
              </div>
            </div>
          ) : <Empty msg="Todavía no hay un PM asignado a este programa" icon={<I.Users />} />}
        </Card>

        <Card title="Certificación" subtitle="Requisito del programa">
          <div className="flex items-center gap-2">
            {program.requires_certification ? (
              <TagAccent icon={<I.Award className="w-3 h-3" />}>Este programa emite certificado</TagAccent>
            ) : (
              <TagSoft>Este programa no emite certificado</TagSoft>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TabInfo({ program }: { program: ProgramDetail }) {
  return (
    <Card title="Información del programa" subtitle="Datos generales — solo lectura">
      <div className="grid sm:grid-cols-2 gap-5">
        <div><p className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Nombre</p><p className="text-[14px] text-zinc-900">{program.name}</p></div>
        <div><p className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Tema</p><p className="text-[14px] text-zinc-900">{program.theme}</p></div>
        <div className="sm:col-span-2"><p className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Descripción</p><p className="text-[14px] text-zinc-700 leading-relaxed">{program.description || 'Sin descripción'}</p></div>
        {program.cohort_year && <div><p className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Cohorte</p><p className="text-[14px] text-zinc-900">{program.cohort_year}</p></div>}
        <div><p className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Creado</p><p className="text-[14px] text-zinc-900">{program.created_at ? formatDate(program.created_at) : '—'}</p></div>
        <div><p className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Última actualización</p><p className="text-[14px] text-zinc-900">{program.updated_at ? formatDate(program.updated_at) : '—'}</p></div>
      </div>
    </Card>
  );
}

// Cronograma — timeline horizontal monocromático (sin hue: la escala ordinal
// created→scheduled→in_progress→completed se codifica solo con la intensidad
// del gris, más oscuro = más avanzado; "cancelada" se distingue con textura,
// no color). Etiqueta directa a la izquierda, tooltip al pasar el mouse.
const TIMELINE_LABEL_W = 200;

function timelineShade(status: string): { bg: string; textured?: boolean } {
  if (status === 'completed') return { bg: '#18181b' };
  if (status === 'in_progress') return { bg: '#52525b' };
  if (status === 'scheduled') return { bg: '#a1a1aa' };
  if (status === 'cancelled') return { bg: 'repeating-linear-gradient(45deg, #d4d4d8, #d4d4d8 3px, #f4f4f4 3px, #f4f4f4 7px)', textured: true };
  return { bg: '#e4e4e7' }; // created
}

function ActivityTimeline({ activities }: { activities: ProgramActivity[] }) {
  const [hoverId, setHoverId] = useState<number | string | null>(null);
  const dated = activities.filter(a => a.start_date);
  if (dated.length === 0) return null;

  const DAY = 24 * 60 * 60 * 1000;
  const starts = dated.map(a => new Date(a.start_date!).getTime());
  const ends = dated.map(a => new Date(a.end_date || a.start_date!).getTime());
  const from = Math.min(...starts) - 3 * DAY;
  const to = Math.max(...ends, ...starts) + 3 * DAY;
  const total = Math.max(to - from, DAY);
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - from) / total) * 100));

  // Grilla adaptativa: rangos cortos (la mayoría de los casos — pocas
  // actividades de días/semanas) usan ticks semanales; rangos largos, mensuales.
  // El primer tick siempre se ancla al borde izquierdo (0%) aunque su fecha
  // real caiga antes de `from` — así nunca queda un tramo sin referencia.
  const rangeDays = total / DAY;
  const useWeeks = rangeDays <= 75;
  const ticks: { label: string; pct: number }[] = [];
  const cursor = new Date(from);
  if (useWeeks) {
    const dow = (cursor.getDay() + 6) % 7; // lunes=0
    cursor.setDate(cursor.getDate() - dow);
  } else {
    cursor.setDate(1);
  }
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= to) {
    ticks.push({
      label: cursor.toLocaleDateString('es', useWeeks ? { day: '2-digit', month: 'short' } : { month: 'short', year: '2-digit' }),
      pct: pct(cursor.getTime()),
    });
    if (useWeeks) cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }

  const now = Date.now();
  const showToday = now >= from && now <= to;
  const todayPct = pct(now);

  const sorted = [...dated].sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());
  const rowH = 52;

  return (
    <div className="mb-5">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">Cronograma</h3>
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: `${TIMELINE_LABEL_W}px 1fr` }}>
          <div className="border-b border-zinc-100" />
          <div className="relative h-8 border-b border-zinc-100">
            {ticks.map((t, i) => (
              <div key={i} className="absolute top-0 h-full flex items-center border-l border-zinc-100 pl-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wide" style={{ left: `${t.pct}%` }}>
                {t.label}
              </div>
            ))}
          </div>

          {sorted.map(a => {
            const barFrom = pct(new Date(a.start_date!).getTime());
            const barTo = pct(new Date(a.end_date || a.start_date!).getTime());
            const width = Math.max(barTo - barFrom, 1.5);
            const shade = timelineShade(a.status);
            const aMeta = ACTIVITY_STATUS_META[a.status] || { label: a.status };
            const dateLabel = a.end_date && a.end_date !== a.start_date
              ? `${new Date(a.start_date!).toLocaleDateString('es', { day: '2-digit', month: 'short' })} – ${new Date(a.end_date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}`
              : new Date(a.start_date!).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
            return (
              <React.Fragment key={a.id}>
                <div className="flex flex-col justify-center px-3 border-t border-zinc-50 min-w-0" style={{ height: rowH }}>
                  <span className="text-[12px] font-semibold text-zinc-800 truncate" title={a.name}>{a.name}</span>
                  <span className="text-[10.5px] text-zinc-400 truncate mt-0.5">{dateLabel}</span>
                </div>
                <div className="relative border-t border-zinc-50" style={{ height: rowH }}>
                  {ticks.map((t, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-zinc-100" style={{ left: `${t.pct}%` }} />
                  ))}
                  {showToday && <div className="absolute top-0 bottom-0 border-l border-dashed border-zinc-400 z-10" style={{ left: `${todayPct}%` }} />}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-[18px] rounded shadow-sm"
                    style={{ left: `${barFrom}%`, width: `${width}%`, background: shade.bg }}
                    onMouseEnter={() => setHoverId(a.id)}
                    onMouseLeave={() => setHoverId(null)}
                  >
                    {hoverId === a.id && (
                      <div className="absolute bottom-full mb-2 left-0 z-20 whitespace-nowrap rounded-lg bg-zinc-900 text-white text-[11px] px-3 py-2 shadow-lg">
                        <div className="font-semibold">{a.name}</div>
                        <div className="text-zinc-300 mt-0.5">{dateLabel} · {aMeta.label}</div>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 border-t border-zinc-100 bg-zinc-50/60">
          {[
            { label: 'Creada', bg: '#e4e4e7' },
            { label: 'Agendada', bg: '#a1a1aa' },
            { label: 'En curso', bg: '#52525b' },
            { label: 'Completada', bg: '#18181b' },
          ].map(s => (
            <span key={s.label} className="inline-flex items-center gap-1.5 text-[10.5px] text-zinc-500">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.bg }} />{s.label}
            </span>
          ))}
          {showToday && (
            <span className="inline-flex items-center gap-1.5 text-[10.5px] text-zinc-500 ml-auto">
              <span className="w-3 border-t border-dashed border-zinc-400" />Hoy
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TabActividades({ activities }: { activities: ProgramActivity[] }) {
  const [expandedId, setExpandedId] = useState<number | string | null>(null);
  return (
    <Card title="Actividades" subtitle={`${activities.length} actividades en el programa`}>
      <ActivityTimeline activities={activities} />
      {activities.length === 0 ? <Empty msg="Aún no hay actividades configuradas." icon={<I.Activity />} /> : (
        <div className="space-y-2">
          {activities.map(a => {
            const aMeta = ACTIVITY_STATUS_META[a.status] || { label: a.status, color: '#64748b', bg: '#f1f5f9' };
            const isExpanded = expandedId === a.id;
            const modules = a.modules || [];
            return (
              <div key={a.id} className="rounded-xl bg-white border border-zinc-200 overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : a.id)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-zinc-50/60 transition">
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
                      <span className="inline-flex items-center gap-1"><I.Module className="w-3 h-3" />{modules.length} módulos</span>
                      {a.is_certificate_issued && <span className="inline-flex items-center gap-1 font-semibold text-zinc-700"><I.Award className="w-3 h-3" />Certifica</span>}
                    </div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-zinc-200 bg-zinc-50/60 p-4">
                    {modules.length === 0 ? (
                      <p className="text-[12.5px] text-zinc-500 text-center py-4">Esta actividad todavía no tiene módulos.</p>
                    ) : (
                      <div className="space-y-2">
                        {[...modules].sort((x, y) => x.order - y.order).map((m, i) => (
                          <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-zinc-200">
                            <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[12.5px] font-semibold text-zinc-900 truncate">{m.title}</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${m.is_published ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                                  {m.is_published ? 'Publicado' : 'Borrador'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                                <span className="inline-flex items-center gap-1"><I.Clock className="w-3 h-3" />{m.duration_minutes} min</span>
                                {m.requires_evaluation && <span className="inline-flex items-center gap-1"><I.Award className="w-3 h-3" />Aprobar con {m.minimum_score}%</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function TabParticipantes({ participants }: { participants: Participant[] }) {
  return (
    <Card title="Participantes" subtitle={`${participants.length} personas en el programa`}>
      {participants.length === 0 ? <Empty msg="Aún no hay participantes inscritos." icon={<I.Users />} /> : (
        <div className="space-y-2">
          {participants.map(p => {
            const name = p.user.full_name || p.user.email;
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-200">
                {p.user.avatar_url ? (
                  <img src={p.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">{name.charAt(0).toUpperCase()}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-bold text-zinc-900">{name}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${PARTICIPANT_ROLE_BADGE[p.role] || 'bg-zinc-100 text-zinc-600'}`}>{PARTICIPANT_ROLE_LABEL[p.role] || p.role}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold ${p.status === 'active' ? 'bg-zinc-900 text-white' : p.status === 'pending' ? 'bg-zinc-100 text-zinc-600 border border-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>
                      {p.status === 'active' ? 'Activo' : p.status === 'pending' ? 'Pendiente' : p.status}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-zinc-500 flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>{p.user.email}</span>
                    {p.user.telefono && <><span>·</span><span>{p.user.telefono}</span></>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function TabDuplas({ programId }: { programId: string }) {
  const [vincs, setVincs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    apiFetch(`${API_URL}/api/programs/${programId}/vinculations`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (alive) setVincs(Array.isArray(d) ? d.filter((v: any) => v.status === 'active') : []); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [programId]);

  return (
    <Card title="Duplas vigentes" subtitle={loading ? 'Cargando…' : `${vincs.length} ${vincs.length === 1 ? 'dupla activa' : 'duplas activas'}`}>
      {loading ? (
        <div className="py-8 flex justify-center"><Spinner /></div>
      ) : vincs.length === 0 ? (
        <Empty msg="Todavía no hay duplas mentor-mentee activas." icon={<I.Swap />} />
      ) : (
        <div className="space-y-2">
          {vincs.map((v: any) => {
            const mentorName = v.mentor?.full_name || v.mentor?.email || '—';
            const menteeName = v.mentee?.full_name || v.mentee?.email || '—';
            return (
              <div key={v.id} className="flex items-center gap-4 p-3 rounded-xl bg-white border border-zinc-200">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-zinc-900 truncate">{mentorName}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{v.mentor?.email}</p>
                </div>
                <I.Swap className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-zinc-900 truncate">{menteeName}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{v.mentee?.email}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// PROGRAM PICKER — cuando la empresa tiene más de un programa asignado
// ============================================================================
function ProgramPicker({ programs, onPick }: { programs: ProgramSummary[]; onPick: (id: string) => void }) {
  return (
    <CenterPage>
      <div className="max-w-lg w-full">
        <h1 className="text-[19px] font-semibold text-zinc-900 mb-1 text-center">Elegí un programa</h1>
        <p className="text-[13px] text-zinc-500 mb-6 text-center">Tu cuenta tiene {programs.length} programas asignados.</p>
        <div className="space-y-2">
          {programs.map(p => {
            const meta = STATUS_META[p.status] || STATUS_META.draft;
            return (
              <button key={p.id} onClick={() => onPick(p.id)} className="w-full flex items-center justify-between gap-3 p-4 rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition text-left">
                <span className="text-[13.5px] font-semibold text-zinc-900">{p.name}</span>
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.dot }} />{meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </CenterPage>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function CorpDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [authChecked, setAuthChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [assignedPM, setAssignedPM] = useState<AssignedPM | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CorpTab>('resumen');

  // ── Auth gate ──
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) { router.push('/login'); return; }
      const user: CurrentUser = JSON.parse(userStr);
      setCurrentUser(user);

      if (PARTICIPANT_ROLES.has(user.role)) {
        if (user.portal_code) { router.replace(`/p/${user.portal_code}`); return; }
        setHasAccess(false); setAuthChecked(true); return;
      }

      if (ADMIN_ROLES.has(user.role)) {
        setIsPreview(true); setHasAccess(true); setAuthChecked(true); return;
      }

      const companyStr = localStorage.getItem('company');
      const own = companyStr ? JSON.parse(companyStr) : null;
      setHasAccess(!!own?.slug && own.slug === slug);
      setAuthChecked(true);
    } catch { setHasAccess(false); setAuthChecked(true); }
  }, [router, slug]);

  // ── Company + programs ──
  useEffect(() => {
    if (!authChecked || !hasAccess) return;
    (async () => {
      try {
        const byslugRes = await apiFetch(`${API_URL}/api/companies/by-slug/${slug}`);
        if (!byslugRes.ok) throw new Error('Empresa no encontrada');
        const byslug = await byslugRes.json();
        const fullRes = await apiFetch(`${API_URL}/api/companies/${byslug.id}`);
        const full = fullRes.ok ? await fullRes.json() : byslug;
        setCompany({ id: byslug.id, name: full.name || byslug.name, slug: byslug.slug, plan: full.plan, status: full.status });

        const progsRes = await apiFetch(`${API_URL}/api/programs?company_id=${byslug.id}`);
        const progs = progsRes.ok ? await progsRes.json() : [];
        const list: ProgramSummary[] = (Array.isArray(progs) ? progs : []).map((p: any) => ({ id: p.id, name: p.name, status: p.status }));
        setPrograms(list);
        if (list.length === 1) setSelectedProgramId(list[0].id);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error al cargar la cuenta');
      } finally {
        setLoading(false);
      }
    })();
  }, [authChecked, hasAccess, slug]);

  // ── Program detail ──
  const fetchProgramDetail = useCallback(async (id: string) => {
    try {
      const [progRes, partRes] = await Promise.all([
        apiFetch(`${API_URL}/api/programs/${id}`),
        apiFetch(`${API_URL}/api/programs/${id}/participants`),
      ]);
      if (progRes.ok) {
        const data: ProgramDetail = await progRes.json();
        setProgram(data);
        if (data.company_id) {
          const pmRes = await apiFetch(`${API_URL}/api/companies/company/${data.company_id}/pm`);
          if (pmRes.ok) { const pmData = await pmRes.json(); setAssignedPM(pmData.assigned_pm || null); }
        }
      }
      if (partRes.ok) setParticipants(await partRes.json());
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (selectedProgramId) fetchProgramDetail(selectedProgramId);
  }, [selectedProgramId, fetchProgramDetail]);

  const handleLogout = () => { localStorage.removeItem('user'); localStorage.removeItem('auth_token'); router.push('/login'); };

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

  if (!authChecked || loading) return <CenterPage><Spinner /></CenterPage>;

  if (!hasAccess) {
    return (
      <CenterPage>
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-600 flex items-center justify-center mx-auto mb-4"><I.Lock className="w-7 h-7" /></div>
          <h2 className="text-[17px] font-semibold text-zinc-900 mb-1">No tenés acceso a esta cuenta</h2>
          <p className="text-[13px] text-zinc-500 mb-5">Este dashboard pertenece a otra empresa.</p>
          <button onClick={() => router.push('/login')} className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-[12.5px] font-semibold hover:bg-zinc-800">Volver a iniciar sesión</button>
        </div>
      </CenterPage>
    );
  }

  if (error || !company) {
    return (
      <CenterPage>
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4"><I.Alert className="w-7 h-7" /></div>
          <h2 className="text-[17px] font-semibold text-zinc-900 mb-1">No se pudo cargar la cuenta</h2>
          <p className="text-[13px] text-zinc-500">{error || 'Empresa no encontrada'}</p>
        </div>
      </CenterPage>
    );
  }

  if (programs.length === 0) {
    return (
      <CenterPage>
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-4"><I.Inbox className="w-7 h-7" /></div>
          <h2 className="text-[17px] font-semibold text-zinc-900 mb-1">Todavía no hay programas asignados</h2>
          <p className="text-[13px] text-zinc-500">Cuando Inspiratoria asigne un programa a {company.name}, vas a verlo acá.</p>
        </div>
      </CenterPage>
    );
  }

  if (!selectedProgramId) {
    return <ProgramPicker programs={programs} onPick={setSelectedProgramId} />;
  }

  if (!program) return <CenterPage><Spinner /></CenterPage>;

  const stMeta = STATUS_META[program.status] || STATUS_META.draft;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar currentUser={currentUser} onLogout={handleLogout} company={company} program={program} activeTab={activeTab} onTab={setActiveTab} isPreview={isPreview} slug={slug} />

      <main className="ml-64 flex-1 min-h-screen">
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-zinc-100">
          <div className="px-8 py-3.5 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 min-w-0">
              {programs.length > 1 && (
                <button onClick={() => setSelectedProgramId(null)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition">
                  <I.Back className="w-3.5 h-3.5" /><span>Programas</span>
                </button>
              )}
              <div className="text-[12.5px] text-zinc-500 truncate">
                <span>{company.name}</span>
                <span className="mx-1.5 text-zinc-300">/</span>
                <span className="text-zinc-900 font-semibold">{program.name}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11.5px] font-semibold flex-shrink-0" style={{ background: stMeta.bg, color: stMeta.color, boxShadow: `inset 0 0 0 1px ${stMeta.ring}` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: stMeta.dot }} />{stMeta.label}
            </span>
          </div>
        </header>

        {activeTab === 'resumen' && (
          <section className="px-8 pt-7 pb-6 bg-white border-b border-zinc-100">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Tag>{program.theme}</Tag>
              <TagSoft icon={<I.Building className="w-3 h-3" />}>{company.name}</TagSoft>
              {program.cohort_year ? <TagSoft icon={<I.Calendar className="w-3 h-3" />}>{program.cohort_year}</TagSoft> : null}
              {program.requires_certification && <TagAccent icon={<I.Award className="w-3 h-3" />}>Certificación</TagAccent>}
            </div>
            <h1 className="text-[25px] font-semibold text-zinc-900 tracking-tight leading-tight mb-1.5">{program.name}</h1>
            {program.description && <p className="text-[14px] text-zinc-500 max-w-3xl leading-relaxed mb-6">{program.description}</p>}
            {kpis && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Kpi icon={<I.Users />} label="Participantes" value={program.participants_count} sub={`${kpis.mentors} mentores · ${kpis.mentees} mentees`} />
                <Kpi icon={<I.Activity />} label="Actividades" value={kpis.totalActivities} sub={`${kpis.completed} completadas · ${kpis.inProgress} activas`} />
                <Kpi icon={<I.Module />} label="Módulos" value={kpis.totalModules} sub={`${kpis.totalHours} h de contenido`} />
                <Kpi icon={<I.Target />} label="Estado" value={stMeta.label} sub={program.updated_at ? `Actualizado ${formatDate(program.updated_at)}` : ''} />
              </div>
            )}
          </section>
        )}

        <div className="px-8 py-7 w-full">
          {activeTab === 'resumen' && <TabResumen program={program} participants={participants} assignedPM={assignedPM} />}
          {activeTab === 'info' && <TabInfo program={program} />}
          {activeTab === 'actividades' && <TabActividades activities={program.activities} />}
          {activeTab === 'participantes' && <TabParticipantes participants={participants} />}
          {activeTab === 'duplas' && <TabDuplas programId={program.id} />}
        </div>
      </main>
    </div>
  );
}
