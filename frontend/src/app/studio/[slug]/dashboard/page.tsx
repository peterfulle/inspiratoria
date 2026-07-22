'use client';
/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
interface ModuleResource {
  id: string; name: string; type: 'pdf' | 'video' | 'template' | 'document' | 'link';
  url: string; dataUrl?: string; fileName?: string; size?: string;
}
interface ProgramModule {
  id: number; title: string; description: string; order: number;
  duration_minutes: number; is_published: boolean; materials_url: string;
  requires_evaluation: boolean; minimum_score: number;
  resources: ModuleResource[];
}
interface ProgramActivity {
  id: number | string; type: string; name: string; description: string; category: string;
  status: string; modality: string; start_date: string | null; end_date: string | null;
  is_certificate_issued: boolean; modules: ProgramModule[];
}
interface CompanyProfile { id: string; name: string; slug: string; plan?: string; status?: string; logo_url?: string; }
interface ProgramSummary { id: string; name: string; status: string; }
interface ProgramDetail {
  id: string; name: string; description: string; theme: string; status: string;
  company_id: string | null; company: { id: string; name: string; slug: string } | null;
  cohort_year?: number | null;
  activities: ProgramActivity[]; participants_count: number;
  requires_certification: boolean; created_at: string | null; updated_at: string | null;
  banner_svg?: string | null; banner_image?: string | null;
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
  FileText:    SvgBase(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></>),
  Link:        SvgBase(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>),
  Close:       SvgBase(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>),
  Chat:        SvgBase(<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />),
  Send:        SvgBase(<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>),
  Chart:       SvgBase(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>),
  Shield:      SvgBase(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />),
  Download:    SvgBase(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>),
};

const RESOURCE_TYPE_LABEL: Record<ModuleResource['type'], string> = {
  pdf: 'PDF', video: 'Video', template: 'Template', document: 'Doc', link: 'Link',
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

function ResourceViewerModal({ resource, onClose }: { resource: ModuleResource; onClose: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    const src = resource.dataUrl || resource.url || '';
    const url = src.startsWith('data:') ? dataUrlToBlobUrl(src) : src;
    setBlobUrl(url);
    return () => { if (src.startsWith('data:')) URL.revokeObjectURL(url); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div className="bg-white rounded-xl overflow-hidden flex flex-col w-full max-w-3xl h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
          <span className="text-[13px] font-semibold text-zinc-900">{resource.name}</span>
          <button onClick={onClose} className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100"><I.Close className="w-4 h-4" /></button>
        </div>
        <div className="flex-1">
          {resource.type === 'pdf' && blobUrl && <iframe src={blobUrl} title={resource.name} className="w-full h-full border-0" />}
          {resource.type === 'video' && resource.dataUrl && blobUrl && <video src={blobUrl} controls autoPlay className="w-full h-full bg-zinc-900" />}
          {resource.type === 'video' && !resource.dataUrl && getVideoEmbedUrl(resource.url) && (
            <iframe src={getVideoEmbedUrl(resource.url)!} title={resource.name} className="w-full h-full border-0" allow="autoplay; fullscreen" allowFullScreen />
          )}
        </div>
      </div>
    </div>
  );
}

function ResourceList({ resources }: { resources: ModuleResource[] }) {
  const [viewing, setViewing] = useState<ModuleResource | null>(null);
  if (resources.length === 0) return null;
  return (
    <div className="mt-2.5 pt-2.5 border-t border-zinc-100 space-y-1.5">
      {resources.map(r => {
        const canView = (r.type === 'pdf' || r.type === 'video') && (r.dataUrl || (r.type === 'video' && getVideoEmbedUrl(r.url)));
        const openExternal = () => { if (r.url) window.open(r.url, '_blank'); };
        return (
          <button
            key={r.id}
            onClick={() => canView ? setViewing(r) : openExternal()}
            disabled={!canView && !r.url}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 transition text-left disabled:opacity-50 disabled:cursor-default"
          >
            <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-500 flex items-center justify-center flex-shrink-0">
              {r.type === 'link' ? <I.Link className="w-3.5 h-3.5" /> : <I.FileText className="w-3.5 h-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-zinc-800 truncate">{r.name}</div>
              {r.size && <div className="text-[10.5px] text-zinc-400">{r.size}</div>}
            </div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 flex-shrink-0">{RESOURCE_TYPE_LABEL[r.type]}</span>
          </button>
        );
      })}
      {viewing && <ResourceViewerModal resource={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

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
function TagOnDark({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-white backdrop-blur-sm border border-white/10">{icon}{children}</span>;
}
// Mismo mapeo que Studio (programs/banner_service.py) — degradado de respaldo
// mientras no haya foto/SVG generado.
const HERO_FALLBACK_GRADIENTS: Record<string, string> = {
  leadership: 'linear-gradient(135deg, #0c4a6e 0%, #0e7490 40%, #0891b2 100%)',
  innovation: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 40%, #0ea5e9 100%)',
  diversity: 'linear-gradient(135deg, #134e4a 0%, #0f766e 40%, #14b8a6 100%)',
  onboarding: 'linear-gradient(135deg, #064e3b 0%, #047857 40%, #10b981 100%)',
  technical: 'linear-gradient(135deg, #0c4a6e 0%, #075985 40%, #0284c7 100%)',
  empleabilidad: 'linear-gradient(135deg, #3730a3 0%, #4338ca 40%, #6366f1 100%)',
  general: 'linear-gradient(135deg, #164e63 0%, #155e75 40%, #0891b2 100%)',
};
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
type CorpTab = 'resumen' | 'info' | 'actividades' | 'participantes' | 'duplas' | 'personas' | 'reportes' | 'admin';

function Sidebar({ currentUser, onLogout, company, program, activeTab, onTab, isPreview, slug }: {
  currentUser: CurrentUser | null; onLogout: () => void; company: CompanyProfile; program: ProgramDetail | null;
  activeTab: CorpTab; onTab: (t: CorpTab) => void; isPreview: boolean; slug: string;
}) {
  const canManageAdmins = isPreview || currentUser?.role === CORP_ADMIN_ROLE_VALUE;
  const tabsNav: { id: CorpTab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen', icon: <I.Sparkles /> },
    { id: 'info', label: 'Información', icon: <I.Building /> },
    { id: 'actividades', label: 'Actividades', icon: <I.Activity /> },
    { id: 'participantes', label: 'Participantes', icon: <I.Users /> },
    { id: 'duplas', label: 'Duplas', icon: <I.Swap /> },
    { id: 'personas', label: 'Mentores y Mentees', icon: <I.FileText /> },
    { id: 'reportes', label: 'Reportes', icon: <I.Chart /> },
    ...(canManageAdmins ? [{ id: 'admin' as CorpTab, label: 'Admin', icon: <I.Shield /> }] : []),
  ];
  const initials = (currentUser?.full_name || currentUser?.email || 'C').charAt(0).toUpperCase();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-50/60 border-r border-zinc-200/70 z-40 flex flex-col backdrop-blur-sm">
      <div className="px-4 py-4 border-b border-zinc-200/70">
        <Link href={isPreview ? `/studio/${slug}/program` : '/studio'} className="flex flex-col gap-3 group">
          {company.logo_url ? (
            <div className="w-full h-16 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center overflow-hidden flex-shrink-0 px-3 py-2.5 shadow-sm">
              <img src={company.logo_url} alt={company.name} className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center text-white text-[20px] font-bold flex-shrink-0">
              {company.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[14.5px] font-bold text-zinc-900 leading-tight tracking-tight truncate">{company.name}</p>
            <p className="text-[10px] text-zinc-400 font-medium tracking-tight">Vista Corporativa · Inspiratoria</p>
          </div>
        </Link>
      </div>

      <div className="px-3 pt-3 pb-3">
        <div className="px-3 py-2.5 rounded-lg bg-white border border-zinc-200/80">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-zinc-400 truncate">Programa</p>
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
        <div className="flex items-center justify-center gap-1.5 pt-3 mt-2 border-t border-zinc-200/70">
          <span className="text-[9.5px] text-zinc-400 tracking-tight">Powered by</span>
          <div className="w-4 h-4 rounded bg-zinc-900 flex items-center justify-center overflow-hidden flex-shrink-0">
            <Image src="/images/logo.png" alt="Inspiratoria" width={16} height={16} className="object-cover" />
          </div>
          <span className="text-[9.5px] font-semibold text-zinc-500 tracking-tight">Inspiratoria</span>
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
                          <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-zinc-200">
                            <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[12.5px] font-semibold text-zinc-900 truncate">{m.title}</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${m.is_published ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                                  {m.is_published ? 'Publicado' : 'Borrador'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                                <span className="inline-flex items-center gap-1"><I.Clock className="w-3 h-3" />{m.duration_minutes} min</span>
                                <span className="inline-flex items-center gap-1"><I.FileText className="w-3 h-3" />{(m.resources || []).length} recursos</span>
                                {m.requires_evaluation && <span className="inline-flex items-center gap-1"><I.Award className="w-3 h-3" />Aprobar con {m.minimum_score}%</span>}
                              </div>
                              <ResourceList resources={m.resources || []} />
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
// REPORTES — asistencia, recursos vistos, accesos e insights de IA
// (solo lectura — misma fuente de datos que la consola admin, en tiempo real)
// ============================================================================
interface EngagementRow {
  participant_id: string; name: string; email: string; role: string; status: string;
  joined_at: string | null; last_access_at: string | null;
  access_count: number; sessions_attended: number; sessions_total: number; attendance_pct: number;
  resources_viewed: number; resources_total: number; resources_pct: number; risk: 'high' | 'medium' | 'low';
}
interface EngagementSession { id: number; name: string; date: string | null; attended: number; total: number; attendance_pct: number; }
interface EngagementReportData {
  participants: EngagementRow[];
  sessions: EngagementSession[];
  aggregates: {
    sessions_total: number; resources_total: number;
    avg_attendance_pct: number; avg_access_count: number; avg_resources_pct: number;
    by_role: Record<string, { avg_attendance_pct: number; avg_access_count: number; avg_resources_pct: number }>;
  };
}

const RISK_META: Record<string, { label: string; badge: string; dot: string }> = {
  high:   { label: 'Riesgo alto',  badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  medium: { label: 'A seguir',     badge: 'bg-zinc-200 text-zinc-700', dot: 'bg-zinc-400' },
  low:    { label: 'Saludable',    badge: 'bg-zinc-100 text-zinc-500', dot: 'bg-zinc-300' },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function Avatar({ name, role, size = 9 }: { name: string; role: string; size?: number }) {
  const isMentor = role === 'mentor';
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${isMentor ? 'bg-gradient-to-br from-zinc-800 to-zinc-950' : 'bg-gradient-to-br from-zinc-500 to-zinc-700'}`}
      style={{ width: `${size * 4}px`, height: `${size * 4}px`, fontSize: `${size * 1.2}px` }}
    >
      {initials(name)}
    </div>
  );
}

// ── Métrica clickeable con drill-down ───────────────────────────────────────
type MetricKind = 'attendance' | 'resources' | 'access' | 'risk';

function ReportMetricCard({
  icon, label, value, sub, accent, onClick,
}: { icon: React.ReactNode; label: string; value: string | number; sub: string; accent?: 'amber'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative text-left bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 ${accent === 'amber' ? 'border-amber-200' : 'border-zinc-200/70 hover:border-zinc-300'}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accent === 'amber' ? 'bg-amber-400' : 'bg-zinc-900'}`} />
      <div className="px-5 py-4 pl-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{label}</span>
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${accent === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white'}`}>
            <span className="w-3.5 h-3.5">{icon}</span>
          </span>
        </div>
        <div className="text-[28px] font-semibold text-zinc-900 leading-none tracking-tight">{value}</div>
        <div className="mt-2 text-[11.5px] text-zinc-500">{sub}</div>
        <div className="mt-2.5 flex items-center gap-1 text-[10.5px] font-semibold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Ver detalle <I.Back className="w-2.5 h-2.5 rotate-180" />
        </div>
      </div>
    </button>
  );
}

function MetricDetailModal({ kind, data, onClose, onSelectParticipant }: {
  kind: MetricKind; data: EngagementReportData; onClose: () => void; onSelectParticipant: (r: EngagementRow) => void;
}) {
  const META: Record<MetricKind, { title: string; subtitle: string; sortKey: 'attendance_pct' | 'resources_pct' | 'access_count' }> = {
    attendance: { title: 'Detalle de asistencia', subtitle: 'Participantes ordenados de menor a mayor asistencia', sortKey: 'attendance_pct' },
    resources: { title: 'Detalle de recursos revisados', subtitle: 'Participantes ordenados de menor a mayor revisión', sortKey: 'resources_pct' },
    access: { title: 'Detalle de accesos a la plataforma', subtitle: 'Participantes ordenados de menor a mayor actividad', sortKey: 'access_count' },
    risk: { title: 'Participantes en riesgo', subtitle: 'Asistencia por debajo del 80% requiere seguimiento', sortKey: 'attendance_pct' },
  };
  const meta = META[kind];
  const rows = kind === 'risk'
    ? [...data.participants].filter(p => p.risk !== 'low').sort((a, b) => a.attendance_pct - b.attendance_pct)
    : [...data.participants].sort((a, b) => a[meta.sortKey] - b[meta.sortKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-start justify-between gap-3 flex-shrink-0">
          <div>
            <h3 className="text-[14.5px] font-bold text-zinc-900">{meta.title}</h3>
            <p className="text-[11.5px] text-zinc-400 mt-0.5">{meta.subtitle}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors flex-shrink-0">
            <I.Close className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-2">
          {kind === 'attendance' && (
            <div className="mb-4 pb-4 border-b border-zinc-100">
              <SessionAttendanceChart sessions={data.sessions} />
            </div>
          )}
          {rows.length === 0 ? (
            <Empty msg="Nadie en esta categoría — buenas noticias." icon={<I.CheckCircle />} />
          ) : rows.map(r => (
            <button
              key={r.participant_id}
              onClick={() => onSelectParticipant(r)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors text-left"
            >
              <Avatar name={r.name} role={r.role} size={8} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-semibold text-zinc-900 truncate">{r.name}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${PARTICIPANT_ROLE_BADGE[r.role] || 'bg-zinc-100 text-zinc-600'}`}>{PARTICIPANT_ROLE_LABEL[r.role] || r.role}</span>
                </div>
                <p className="text-[10.5px] text-zinc-400">
                  {kind === 'access' ? `${r.access_count} accesos · últ. ${r.last_access_at ? formatDate(r.last_access_at) : 'nunca'}` : `${r.sessions_attended}/${r.sessions_total} sesiones · ${r.resources_viewed}/${r.resources_total} recursos`}
                </p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold flex-shrink-0 ${RISK_META[r.risk].badge}`}>{RISK_META[r.risk].label}</span>
              <I.Back className="w-3 h-3 text-zinc-300 rotate-180 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Detalle individual (reusa /detail-report, la misma data del PDF) ───────
function ParticipantDetailModal({ programId, participant, onClose }: { programId: string; participant: EngagementRow; onClose: () => void }) {
  const [detail, setDetail] = useState<DetailReportData | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetch(`${API_URL}/api/programs/${programId}/participants/${participant.participant_id}/detail-report`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive) setDetail(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [programId, participant.participant_id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-start justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar name={participant.name} role={participant.role} size={9} />
            <div>
              <h3 className="text-[14.5px] font-bold text-zinc-900">{participant.name}</h3>
              <p className="text-[11.5px] text-zinc-400 mt-0.5">{PARTICIPANT_ROLE_LABEL[participant.role] || participant.role} · {participant.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors flex-shrink-0">
            <I.Close className="w-4 h-4" />
          </button>
        </div>
        {!detail ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-y-auto px-5 py-4 space-y-5">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 rounded-lg bg-zinc-50">
                <p className="text-[16px] font-bold text-zinc-900">{detail.sessions.filter(s => s.attended).length}/{detail.sessions.length}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Sesiones</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-zinc-50">
                <p className="text-[16px] font-bold text-zinc-900">{detail.resources.filter(r => r.viewed).length}/{detail.resources.length}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Recursos</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-zinc-50">
                <p className="text-[16px] font-bold text-zinc-900">{detail.access.total}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Accesos</p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Asistencia a sesiones</p>
              <div className="space-y-1">
                {detail.sessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${s.attended ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                      {s.attended && <I.Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <span className="text-[12px] text-zinc-700 flex-1 min-w-0 truncate">{s.name}</span>
                    <span className="text-[10.5px] text-zinc-400 flex-shrink-0">{s.date ? formatDate(s.date) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Recursos revisados</p>
              <div className="space-y-1">
                {detail.resources.map((r, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${r.viewed ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                      {r.viewed && <I.Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <span className="text-[12px] text-zinc-700 flex-1 min-w-0 truncate">{r.title}</span>
                    <span className="text-[10.5px] text-zinc-400 flex-shrink-0">{r.last_viewed_at ? formatDate(r.last_viewed_at) : 'sin ver'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <p className="text-[10.5px] text-zinc-400">Ingresó {detail.participant.joined_at ? formatDate(detail.participant.joined_at) : '—'} · Último acceso {detail.participant.last_access_at ? formatDate(detail.participant.last_access_at) : 'nunca'}</p>
              <p className="text-[10.5px] text-zinc-400 mt-1">Podés generar el PDF completo de este reporte desde la pestaña <span className="font-semibold text-zinc-500">Mentores y Mentees</span>.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AIInsightsCard({ programId }: { programId: string }) {
  const [insights, setInsights] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    apiFetch(`${API_URL}/api/programs/${programId}/ai-insights`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (alive) setInsights(d.insights); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [programId]);

  const bullets = (insights || '').split(/\n+/).map(l => l.replace(/^[•\-]\s*/, '').trim()).filter(Boolean);

  return (
    <div className="rounded-2xl bg-zinc-900 text-white p-6 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -right-4 top-16 w-24 h-24 rounded-full bg-white/5" />
      <div className="relative flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0"><I.Sparkles className="w-3.5 h-3.5 text-white" /></div>
        <div>
          <p className="text-[13px] font-bold leading-tight">Resumen ejecutivo</p>
          <p className="text-[10.5px] text-zinc-400 leading-tight">Generado por InspiraSQM (IA) a partir de los datos en vivo</p>
        </div>
      </div>
      <div className="relative">
        {error ? (
          <p className="text-[12.5px] text-zinc-400">No se pudo generar el resumen ejecutivo en este momento.</p>
        ) : !insights ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => <div key={i} className="h-3 rounded bg-white/10 animate-pulse" style={{ width: `${85 - i * 12}%` }} />)}
          </div>
        ) : (
          <ul className="space-y-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-zinc-100">
                <span className="w-1 h-1 rounded-full bg-white/60 mt-[7px] flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SessionAttendanceChart({ sessions }: { sessions: EngagementSession[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (sessions.length === 0) return <Empty msg="Sin sesiones realizadas todavía" icon={<I.Activity />} />;
  const avg = Math.round(sessions.reduce((s, x) => s + x.attendance_pct, 0) / sessions.length);
  return (
    <div>
      <div className="relative flex items-end gap-2.5 h-32 px-1 pt-2">
        {/* líneas guía */}
        <div className="absolute inset-x-1 top-2 bottom-0 flex flex-col justify-between pointer-events-none">
          <div className="border-t border-dashed border-zinc-100" />
          <div className="border-t border-dashed border-zinc-100" />
          <div className="border-t border-zinc-200" />
        </div>
        {/* línea de promedio */}
        <div className="absolute left-1 right-1 pointer-events-none" style={{ bottom: `${avg}%` }}>
          <div className="border-t border-dashed border-amber-400" />
        </div>
        {sessions.map((s, i) => (
          <div
            key={s.id}
            className="relative flex-1 h-full flex flex-col items-center justify-end gap-1.5 cursor-pointer z-10"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className={`text-[10.5px] font-bold tabular-nums transition-colors ${hover === i ? 'text-zinc-900' : 'text-zinc-500'}`}>{s.attendance_pct}%</span>
            <div className="w-full max-w-[28px] rounded-t-[4px] bg-zinc-100 relative overflow-hidden" style={{ height: '100%' }}>
              <div
                className={`absolute bottom-0 left-0 right-0 rounded-t-[4px] transition-colors ${s.attendance_pct < 60 ? 'bg-amber-400' : hover === i ? 'bg-zinc-700' : 'bg-zinc-900'}`}
                style={{ height: `${Math.max(s.attendance_pct, 3)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2.5 px-1 mt-2">
        {sessions.map((s, i) => (
          <div key={s.id} className="flex-1 text-center">
            <span className={`text-[9.5px] tabular-nums transition-colors ${hover === i ? 'text-zinc-900 font-semibold' : 'text-zinc-400'}`}>S{i + 1}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-zinc-400 mt-2 text-center min-h-[15px]">
        {hover !== null ? (
          <><span className="font-semibold text-zinc-600">{sessions[hover].name}</span> · {sessions[hover].attended}/{sessions[hover].total} asistentes{sessions[hover].date && <> · {formatDate(sessions[hover].date!)}</>}</>
        ) : (
          <>Promedio <span className="font-semibold text-amber-600">{avg}%</span> · pasá el cursor sobre una barra para ver el detalle</>
        )}
      </p>
    </div>
  );
}

function EngagementLeaderboard({ rows, onSelect }: { rows: EngagementRow[]; onSelect: (r: EngagementRow) => void }) {
  const ranked = [...rows]
    .map(r => ({ ...r, composite: r.attendance_pct * 0.6 + r.resources_pct * 0.4 }))
    .sort((a, b) => b.composite - a.composite)
    .slice(0, 3);

  return (
    <div className="space-y-2.5">
      {ranked.map((r, i) => (
        <button key={r.participant_id} onClick={() => onSelect(r)} className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:border-zinc-300 hover:bg-white transition-colors text-left">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${i === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'}`}>{i + 1}</div>
          <Avatar name={r.name} role={r.role} size={7} />
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-zinc-900 truncate">{r.name}</p>
            <p className="text-[10.5px] text-zinc-400">{PARTICIPANT_ROLE_LABEL[r.role] || r.role} · {r.sessions_attended}/{r.sessions_total} sesiones · {r.resources_viewed}/{r.resources_total} recursos</p>
          </div>
          <span className="text-[13px] font-bold text-zinc-900 tabular-nums flex-shrink-0">{Math.round(r.composite)}</span>
        </button>
      ))}
    </div>
  );
}

function TabReportes({ programId }: { programId: string }) {
  const [data, setData] = useState<EngagementReportData | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'attendance_pct' | 'access_count' | 'resources_pct'>('attendance_pct');
  const [focusMetric, setFocusMetric] = useState<MetricKind | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<EngagementRow | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetch(`${API_URL}/api/programs/${programId}/engagement-report`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (alive) setData(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [programId]);

  if (!data) {
    return (
      <div className="space-y-5">
        <AIInsightsCard programId={programId} />
        <Card title="Engagement por participante" subtitle="Asistencia, recursos revisados y accesos">
          <div className="py-8 flex justify-center"><Spinner /></div>
        </Card>
      </div>
    );
  }

  const rows = [...data.participants].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return b[sortBy] - a[sortBy];
  });
  const riskCount = { high: 0, medium: 0, low: 0 };
  data.participants.forEach(p => { riskCount[p.risk]++; });

  const SortHeader = ({ id, label }: { id: typeof sortBy; label: string }) => (
    <th
      onClick={() => setSortBy(id)}
      className={`px-3 py-2 text-left font-semibold cursor-pointer select-none ${sortBy === id ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
    >
      {label}{sortBy === id && ' ▾'}
    </th>
  );

  return (
    <div className="space-y-5">
      <AIInsightsCard programId={programId} />

      <div className="grid grid-cols-4 gap-3">
        <ReportMetricCard
          icon={<I.Activity />} label="Asistencia promedio" value={`${data.aggregates.avg_attendance_pct}%`}
          sub={`mentores ${data.aggregates.by_role.mentor?.avg_attendance_pct ?? 0}% · mentees ${data.aggregates.by_role.mentee?.avg_attendance_pct ?? 0}%`}
          onClick={() => setFocusMetric('attendance')}
        />
        <ReportMetricCard
          icon={<I.FileText />} label="Recursos revisados" value={`${data.aggregates.avg_resources_pct}%`}
          sub={`mentores ${data.aggregates.by_role.mentor?.avg_resources_pct ?? 0}% · mentees ${data.aggregates.by_role.mentee?.avg_resources_pct ?? 0}%`}
          onClick={() => setFocusMetric('resources')}
        />
        <ReportMetricCard
          icon={<I.Users />} label="Accesos promedio" value={data.aggregates.avg_access_count}
          sub={`mentores ${data.aggregates.by_role.mentor?.avg_access_count ?? 0} · mentees ${data.aggregates.by_role.mentee?.avg_access_count ?? 0}`}
          onClick={() => setFocusMetric('access')}
        />
        <ReportMetricCard
          icon={<I.Alert />} label="Participantes en riesgo" value={riskCount.high + riskCount.medium}
          sub={`${riskCount.high} alto · ${riskCount.medium} a seguir · ${riskCount.low} saludable`}
          accent={riskCount.high + riskCount.medium > 0 ? 'amber' : undefined}
          onClick={() => setFocusMetric('risk')}
        />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <Card title="Asistencia por sesión" subtitle={`${data.aggregates.sessions_total} sesiones realizadas hasta la fecha`}>
          <SessionAttendanceChart sessions={data.sessions} />
        </Card>
        <Card title="Top engagement" subtitle="Asistencia (60%) + recursos revisados (40%)">
          <EngagementLeaderboard rows={data.participants} onSelect={setSelectedParticipant} />
        </Card>
      </div>

      <Card title="Engagement por participante" subtitle={`${data.aggregates.sessions_total} sesiones realizadas · ${data.aggregates.resources_total} recursos publicados · clic en una fila para ver el detalle`}>
        {rows.length === 0 ? <Empty msg="Sin participantes" icon={<I.Users />} /> : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-zinc-200">
                  <SortHeader id="name" label="Participante" />
                  <th className="px-3 py-2 text-left font-semibold text-zinc-400">Últ. acceso</th>
                  <SortHeader id="access_count" label="Accesos" />
                  <SortHeader id="attendance_pct" label="Asistencia" />
                  <SortHeader id="resources_pct" label="Recursos vistos" />
                  <th className="px-3 py-2 text-left font-semibold text-zinc-400">Nivel</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.participant_id} onClick={() => setSelectedParticipant(r)} className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer group">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.name} role={r.role} size={7} />
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 truncate">{r.name}</p>
                          <span className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-wide ${PARTICIPANT_ROLE_BADGE[r.role] || 'bg-zinc-100 text-zinc-600'}`}>{PARTICIPANT_ROLE_LABEL[r.role] || r.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-zinc-500">{r.last_access_at ? formatDate(r.last_access_at) : 'Nunca'}</td>
                    <td className="px-3 py-2.5 text-zinc-700 tabular-nums">{r.access_count}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-zinc-100 overflow-hidden"><div className={`h-full ${r.attendance_pct < 60 ? 'bg-amber-400' : 'bg-zinc-900'}`} style={{ width: `${r.attendance_pct}%` }} /></div>
                        <span className="text-zinc-600 tabular-nums w-20 flex-shrink-0">{r.attendance_pct}% · {r.sessions_attended}/{r.sessions_total}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full bg-zinc-500" style={{ width: `${r.resources_pct}%` }} /></div>
                        <span className="text-zinc-600 tabular-nums w-20 flex-shrink-0">{r.resources_pct}% · {r.resources_viewed}/{r.resources_total}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold ${RISK_META[r.risk].badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${RISK_META[r.risk].dot}`} />{RISK_META[r.risk].label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <I.Back className="w-3.5 h-3.5 text-zinc-300 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {focusMetric && (
        <MetricDetailModal
          kind={focusMetric}
          data={data}
          onClose={() => setFocusMetric(null)}
          onSelectParticipant={(r) => { setFocusMetric(null); setSelectedParticipant(r); }}
        />
      )}
      {selectedParticipant && (
        <ParticipantDetailModal
          programId={programId}
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// MENTORES Y MENTEES — reporte PDF individual en tiempo real + historial
// ============================================================================
interface DetailReportSession { name: string; date: string | null; modality: string; attended: boolean; }
interface DetailReportResource { title: string; viewed: boolean; last_viewed_at: string | null; }
interface DetailReportData {
  participant: { id: string; name: string; email: string; role: string; status: string; joined_at: string | null; last_access_at: string | null };
  program: { name: string; company: string | null };
  sessions: DetailReportSession[];
  resources: DetailReportResource[];
  access: { total: number; first_access: string | null; last_access: string | null; recent: string[] };
}
interface ReportHistoryItem {
  id: string; participant_id: string; participant_name: string; participant_role: string;
  file_name: string; generated_by: string; generated_at: string;
}

function loadImageAsDataUrl(url: string): Promise<string> {
  return fetch(url)
    .then(r => r.blob())
    .then(blob => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

function TabPersonas({ program, participants, company }: { program: ProgramDetail; participants: Participant[]; company: CompanyProfile }) {
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);

  const loadHistory = useCallback(() => {
    apiFetch(`${API_URL}/api/programs/${program.id}/reports`)
      .then(r => r.ok ? r.json() : [])
      .then(setHistory)
      .catch(() => {});
  }, [program.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const generateReport = async (p: Participant) => {
    setGenerating(p.id);
    try {
      const [detailRes, inspiraLogo] = await Promise.all([
        apiFetch(`${API_URL}/api/programs/${program.id}/participants/${p.id}/detail-report`),
        loadImageAsDataUrl('/images/logo.png').catch(() => ''),
      ]);
      if (!detailRes.ok) throw new Error('No se pudo obtener el detalle del participante');
      const detail: DetailReportData = await detailRes.json();

      const jsPDFmod = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDFmod();
      const ink: [number, number, number] = [24, 24, 27];
      const gray: [number, number, number] = [120, 120, 120];

      if (company.logo_url) {
        try { doc.addImage(company.logo_url, 'PNG', 14, 10, 26, 14, undefined, 'FAST'); } catch { /* logo opcional */ }
      }
      doc.setFontSize(15); doc.setTextColor(...ink);
      doc.text('Reporte individual de participante', 105, 17, { align: 'center' });
      doc.setFontSize(9.5); doc.setTextColor(...gray);
      doc.text(`${detail.program.company || company.name}  ·  ${detail.program.name}`, 105, 23, { align: 'center' });
      doc.setFontSize(8); doc.setTextColor(160, 160, 160);
      doc.text(`Generado ${new Date().toLocaleString('es-ES')}`, 196, 15, { align: 'right' });

      let y = 36;
      doc.setFontSize(13); doc.setTextColor(...ink);
      doc.text(detail.participant.name, 14, y);
      y += 6;
      doc.setFontSize(9.5); doc.setTextColor(...gray);
      doc.text(`${PARTICIPANT_ROLE_LABEL[detail.participant.role] || detail.participant.role}  ·  ${detail.participant.email}`, 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [['Dato', 'Valor']],
        body: [
          ['Estado', detail.participant.status === 'active' ? 'Activo' : detail.participant.status === 'pending' ? 'Pendiente' : detail.participant.status],
          ['Ingresó', detail.participant.joined_at ? new Date(detail.participant.joined_at).toLocaleDateString('es-ES') : '—'],
          ['Último acceso', detail.participant.last_access_at ? new Date(detail.participant.last_access_at).toLocaleString('es-ES') : 'Nunca'],
          ['Accesos totales a la plataforma', String(detail.access.total)],
          ['Primer acceso', detail.access.first_access ? new Date(detail.access.first_access).toLocaleDateString('es-ES') : '—'],
        ],
        headStyles: { fillColor: ink, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 9;
      doc.setFontSize(11); doc.setTextColor(...ink);
      doc.text('Asistencia a sesiones', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Sesión', 'Fecha', 'Modalidad', 'Asistió']],
        body: detail.sessions.map(s => [s.name, s.date ? new Date(s.date).toLocaleDateString('es-ES') : '—', s.modality, s.attended ? 'Sí' : 'No']),
        headStyles: { fillColor: ink, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 9;
      doc.setFontSize(11); doc.setTextColor(...ink);
      doc.text('Recursos revisados', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [['Recurso', 'Revisado', 'Última vez visto']],
        body: detail.resources.map(r => [r.title, r.viewed ? 'Sí' : 'No', r.last_viewed_at ? new Date(r.last_viewed_at).toLocaleString('es-ES') : '—']),
        headStyles: { fillColor: ink, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 14, right: 14 },
      });

      const pages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        if (inspiraLogo) {
          try { doc.addImage(inspiraLogo, 'PNG', 14, doc.internal.pageSize.height - 14, 14, 7, undefined, 'FAST'); } catch { /* logo opcional */ }
        }
        doc.setFontSize(8); doc.setTextColor(160, 160, 160);
        doc.text('Inspiratoria', 30, doc.internal.pageSize.height - 9);
        doc.text(`Página ${i} de ${pages}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 9, { align: 'right' });
      }

      const safe = detail.participant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const fileName = `reporte-${safe}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

      const pdfBase64 = doc.output('datauristring').split('base64,').pop() || '';
      await apiFetch(`${API_URL}/api/programs/${program.id}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: p.id, file_name: fileName, pdf_base64: pdfBase64 }),
      });
      loadHistory();
    } catch {
      alert('No se pudo generar el reporte. Probá de nuevo en unos segundos.');
    } finally {
      setGenerating(null);
    }
  };

  const downloadHistoryItem = async (item: ReportHistoryItem) => {
    const res = await apiFetch(`${API_URL}/api/reports/${item.id}/download`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = item.file_name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <Card title="Mentores y Mentees" subtitle={`${participants.length} personas · reporte PDF individual, en tiempo real, con datos reales del programa`}>
        {participants.length === 0 ? <Empty msg="Sin participantes" icon={<I.Users />} /> : (
          <div className="space-y-2">
            {participants.map(p => {
              const name = p.user.full_name || p.user.email;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">{name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-bold text-zinc-900">{name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider ${PARTICIPANT_ROLE_BADGE[p.role] || 'bg-zinc-100 text-zinc-600'}`}>{PARTICIPANT_ROLE_LABEL[p.role] || p.role}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{p.user.email}</p>
                  </div>
                  <button
                    onClick={() => generateReport(p)}
                    disabled={generating === p.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[11.5px] font-semibold hover:bg-zinc-800 disabled:opacity-50 flex-shrink-0 transition-colors"
                  >
                    {generating === p.id ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <I.Download className="w-3.5 h-3.5" />}
                    {generating === p.id ? 'Generando…' : 'Reporte PDF'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Historial de reportes generados" subtitle={`${history.length} ${history.length === 1 ? 'reporte' : 'reportes'}`}>
        {history.length === 0 ? <Empty msg="Todavía no se generó ningún reporte." icon={<I.FileText />} /> : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-3 py-2 text-left font-semibold text-zinc-400">Participante</th>
                  <th className="px-3 py-2 text-left font-semibold text-zinc-400">Archivo</th>
                  <th className="px-3 py-2 text-left font-semibold text-zinc-400">Generado por</th>
                  <th className="px-3 py-2 text-left font-semibold text-zinc-400">Fecha</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-3 py-2.5 font-semibold text-zinc-900">{h.participant_name}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{h.file_name}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{h.generated_by}</td>
                    <td className="px-3 py-2.5 text-zinc-500">{formatDate(h.generated_at)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => downloadHistoryItem(h)} className="text-zinc-400 hover:text-zinc-900 transition-colors" title="Descargar">
                        <I.Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// ADMIN — administradores corporativos con acceso a esta Vista Corporativa
// ============================================================================
interface CorpAdminUser {
  id: string; email: string; full_name: string; role: string; position: string;
  is_active: boolean; avatar_url: string; last_login_at: string | null; is_account_activated?: boolean;
}
// 'corp_admin' es un rol propio de esta vista — deliberadamente NO reusa 'admin'
// (ese valor ya está pisado en otra parte del código como acceso a la consola
// admin de Inspiratoria). Mantenerlo separado evita que invitar a alguien acá
// le abra, sin querer, la puerta a la consola de gestión de programas.
const CORP_ADMIN_ROLE_VALUE = 'corp_admin';
const CORP_ADMIN_ROLES = new Set(['client', CORP_ADMIN_ROLE_VALUE]);
const CORP_ADMIN_ROLE_LABEL: Record<string, string> = { client: 'Visualizador', [CORP_ADMIN_ROLE_VALUE]: 'Administrador' };
const EMPTY_INVITE = { full_name: '', email: '', role: 'client', position: '' };

function TabAdminCorp({ company }: { company: CompanyProfile }) {
  const [users, setUsers] = useState<CorpAdminUser[] | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState(EMPTY_INVITE);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadUsers = useCallback(() => {
    apiFetch(`${API_URL}/api/companies/${company.id}/users`)
      .then(r => r.ok ? r.json() : { users: [] })
      .then(d => setUsers((d.users || []).filter((u: CorpAdminUser) => CORP_ADMIN_ROLES.has(u.role))))
      .catch(() => setUsers([]));
  }, [company.id]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const sendInvite = async () => {
    if (!invite.full_name.trim() || !invite.email.trim()) return;
    setSending(true);
    setFeedback(null);
    try {
      const res = await apiFetch(`${API_URL}/api/companies/${company.id}/corporate-admins/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invite),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'No se pudo enviar la invitación');
      setFeedback({ type: 'success', msg: `Invitación enviada a ${invite.email}` });
      setInvite(EMPTY_INVITE);
      setShowInvite(false);
      loadUsers();
    } catch (e) {
      setFeedback({ type: 'error', msg: e instanceof Error ? e.message : 'No se pudo enviar la invitación' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-900 tracking-tight">Administradores corporativos</h2>
          <p className="text-[12px] text-zinc-400 mt-0.5">Personas de tu empresa con acceso a esta vista de solo lectura</p>
        </div>
        <button
          onClick={() => { setShowInvite(o => !o); setFeedback(null); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[11.5px] font-semibold hover:bg-zinc-800 transition-colors flex-shrink-0"
        >
          <I.Send className="w-3.5 h-3.5" />Invitar administrador
        </button>
      </div>

      {feedback && (
        <div className={`px-4 py-2.5 rounded-lg text-[12.5px] font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedback.msg}
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => !sending && setShowInvite(false)} />
          <div className="relative bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[14.5px] font-bold text-zinc-900">Invitar a la Vista Corporativa</h3>
                <p className="text-[11.5px] text-zinc-400 mt-0.5">Va a recibir un email con acceso a esta cuenta</p>
              </div>
              <button onClick={() => setShowInvite(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors flex-shrink-0">
                <I.Close className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Nombre completo</label>
                <input value={invite.full_name} onChange={e => setInvite(v => ({ ...v, full_name: e.target.value }))} placeholder="Ej: María Pérez" className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] outline-none focus:ring-2 focus:ring-zinc-900/10" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Email</label>
                <input value={invite.email} onChange={e => setInvite(v => ({ ...v, email: e.target.value }))} type="email" placeholder="nombre@empresa.com" className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] outline-none focus:ring-2 focus:ring-zinc-900/10" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Rol</label>
                <select value={invite.role} onChange={e => setInvite(v => ({ ...v, role: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] outline-none focus:ring-2 focus:ring-zinc-900/10 bg-white">
                  {Object.entries(CORP_ADMIN_ROLE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 mb-1 block">Cargo (opcional)</label>
                <input value={invite.position} onChange={e => setInvite(v => ({ ...v, position: e.target.value }))} placeholder="Ej: Gerente de Personas" className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-[13px] outline-none focus:ring-2 focus:ring-zinc-900/10" />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-zinc-100 flex items-center gap-2">
              <button
                onClick={sendInvite}
                disabled={sending || !invite.full_name.trim() || !invite.email.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 text-white text-[12.5px] font-semibold hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                {sending ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <I.Send className="w-3.5 h-3.5" />}
                {sending ? 'Enviando…' : 'Enviar invitación'}
              </button>
              <button onClick={() => setShowInvite(false)} className="px-3.5 py-2 rounded-lg text-[12.5px] font-semibold text-zinc-500 hover:bg-zinc-100 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <Card title="Con acceso actualmente" subtitle={users === null ? undefined : `${users.length} ${users.length === 1 ? 'persona' : 'personas'}`}>
      {users === null ? (
        <div className="py-8 flex justify-center"><Spinner /></div>
      ) : users.length === 0 ? (
        <Empty msg="No hay administradores corporativos registrados todavía." icon={<I.Shield />} />
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-zinc-200">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">{(u.full_name || u.email).charAt(0).toUpperCase()}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-bold text-zinc-900">{u.full_name || u.email}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600">{CORP_ADMIN_ROLE_LABEL[u.role] || u.role}</span>
                  {u.is_account_activated === false && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-50 text-amber-700">Invitación pendiente</span>}
                  {!u.is_active && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-red-50 text-red-600">Inactivo</span>}
                </div>
                <p className="text-[11px] text-zinc-400">{u.email}{u.position ? ` · ${u.position}` : ''}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10.5px] text-zinc-400">Último ingreso</p>
                <p className="text-[11.5px] font-medium text-zinc-600">{u.last_login_at ? formatDate(u.last_login_at) : 'Nunca'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      </Card>
    </div>
  );
}

// ============================================================================
// INSPIRASQM — chatbot de IA (Claude) con contexto real del programa
// ============================================================================
interface ChatMessage { role: 'user' | 'assistant'; content: string; }

function InspiraSQMChat({ programId }: { programId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const history = messages;
    setMessages(m => [...m, { role: 'user', content: text }]);
    setSending(true);
    try {
      const res = await apiFetch(`${API_URL}/api/programs/${programId}/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = res.ok ? await res.json() : null;
      setMessages(m => [...m, { role: 'assistant', content: data?.reply || 'No pude conectarme en este momento. Probá de nuevo en unos segundos.' }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'No pude conectarme en este momento. Probá de nuevo en unos segundos.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="InspiraSQM"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-zinc-900 text-white shadow-lg flex items-center justify-center hover:bg-zinc-800 hover:scale-105 transition-all"
        >
          <I.Chat className="w-6 h-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] bg-white rounded-2xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-800 bg-zinc-900 text-white flex-shrink-0">
            <div className="w-11 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0 px-1">
              <Image src="/images/sqm-logo.png" alt="SQM" width={80} height={42} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold leading-tight">InspiraSQM</p>
              <p className="text-[10.5px] text-zinc-400 leading-tight">Asistente del programa · IA</p>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0">
              <I.Close className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-zinc-50">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center mx-auto mb-3">
                  <I.Sparkles className="w-5 h-5 text-zinc-400" />
                </div>
                <p className="text-[12.5px] text-zinc-500 max-w-[240px] mx-auto leading-relaxed">
                  Preguntame sobre participantes, mentores, mentees, cronograma o avance del programa.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-zinc-900 text-white rounded-br-md' : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-md'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white border border-zinc-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-zinc-100 flex items-center gap-2 flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Escribí tu pregunta..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-100 text-[13px] text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-30 hover:bg-zinc-800 transition-colors"
            >
              <I.Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
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
        setCompany({ id: byslug.id, name: full.name || byslug.name, slug: byslug.slug, plan: full.plan, status: full.status, logo_url: full.logo_url || '' });

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

        {activeTab === 'resumen' && (() => {
          const [titleLine, ...subtitleParts] = program.name.split(' · ');
          const subtitleLine = subtitleParts.join(' · ');
          const fallbackGradient = HERO_FALLBACK_GRADIENTS[(program.theme || '').toLowerCase()] || HERO_FALLBACK_GRADIENTS.general;
          return (
            <section className="px-8 pt-7 pb-6 bg-white border-b border-zinc-100">
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
                <div className="relative z-[1] flex flex-col items-center justify-center text-center h-full px-7 py-10" style={{ minHeight: 240 }}>
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                    <TagOnDark>{program.theme}</TagOnDark>
                    <TagOnDark icon={<I.Building className="w-3 h-3" />}>{company.name}</TagOnDark>
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Kpi icon={<I.Users />} label="Participantes" value={program.participants_count} sub={`${kpis.mentors} mentores · ${kpis.mentees} mentees`} />
                  <Kpi icon={<I.Activity />} label="Actividades" value={kpis.totalActivities} sub={`${kpis.completed} completadas · ${kpis.inProgress} activas`} />
                  <Kpi icon={<I.Module />} label="Módulos" value={kpis.totalModules} sub={`${kpis.totalHours} h de contenido`} />
                  <Kpi icon={<I.Target />} label="Estado" value={stMeta.label} sub={program.updated_at ? `Actualizado ${formatDate(program.updated_at)}` : ''} />
                </div>
              )}
            </section>
          );
        })()}

        <div className="px-8 py-7 w-full">
          {activeTab === 'resumen' && <TabResumen program={program} participants={participants} assignedPM={assignedPM} />}
          {activeTab === 'info' && <TabInfo program={program} />}
          {activeTab === 'actividades' && <TabActividades activities={program.activities} />}
          {activeTab === 'participantes' && <TabParticipantes participants={participants} />}
          {activeTab === 'duplas' && <TabDuplas programId={program.id} />}
          {activeTab === 'personas' && <TabPersonas program={program} participants={participants} company={company} />}
          {activeTab === 'reportes' && <TabReportes programId={program.id} />}
          {activeTab === 'admin' && <TabAdminCorp company={company} />}
        </div>
      </main>

      <InspiraSQMChat programId={program.id} />
    </div>
  );
}
