'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

// ─── SVG Icons ───
const IconArrowLeft = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconBolt = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
const IconSparkles = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.962 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.582a.5.5 0 010 .962L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.962 0z" />
  </svg>
);
const IconUser = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconMail = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconPhone = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </svg>
);
const IconBriefcase = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
);
const IconCalendar = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconFileText = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconClock = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconTrash = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);
const IconPin = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1v4.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24z" />
  </svg>
);
const IconSend = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconGlobe = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);
const IconBuilding = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
  </svg>
);
const IconShield = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// Types
interface AccountDetail {
  id: string;
  name: string;
  slug: string;
  corp_id: string;
  account_type: string;
  status: string;
  plan: string;
  is_enabled: boolean;
  is_data_complete: boolean;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_position: string;
  industry: string;
  company_size: string;
  website: string;
  description: string;
  legal_name: string;
  rut: string;
  city: string;
  region: string;
  country: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  contract_start: string | null;
  contract_end: string | null;
  internal_notes: string;
  assigned_pm: { id: string; full_name: string; email: string; role: string; avatar_url: string } | null;
  users_count: number;
  programs_count: number;
  notes_count: number;
  pinned_notes_count: number;
  changelog_count: number;
  plan_limits: { max_users: number; max_programs: number; max_participants: number };
  plan_features: Record<string, any>;
  max_users: number;
  max_programs: number;
  max_participants: number;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  content: string;
  note_type: string;
  is_pinned: boolean;
  author: { id: string; full_name: string; email: string } | null;
  created_at: string;
  updated_at: string;
}

interface ChangeLogEntry {
  id: string;
  change_type: string;
  field_changed: string;
  old_value: string;
  new_value: string;
  description: string;
  changed_by: { id: string; full_name: string } | null;
  created_at: string;
}

interface PM {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string;
}

// Note type config
const NOTE_TYPES: Record<string, { label: string; color: string }> = {
  general: { label: 'Nota', color: 'bg-gray-100 text-gray-600' },
  call: { label: 'Llamada', color: 'bg-blue-50 text-blue-600' },
  meeting: { label: 'Reunión', color: 'bg-purple-50 text-purple-600' },
  email: { label: 'Email', color: 'bg-cyan-50 text-cyan-600' },
  task: { label: 'Tarea', color: 'bg-amber-50 text-amber-600' },
  decision: { label: 'Decisión', color: 'bg-emerald-50 text-emerald-600' },
  milestone: { label: 'Hito', color: 'bg-indigo-50 text-indigo-600' },
  issue: { label: 'Problema', color: 'bg-red-50 text-red-600' },
};

const CHANGE_TYPES: Record<string, { label: string; color: string }> = {
  status_change: { label: 'Estado', color: 'bg-amber-50 text-amber-600' },
  plan_change: { label: 'Plan', color: 'bg-blue-50 text-blue-600' },
  pm_assign: { label: 'PM', color: 'bg-purple-50 text-purple-600' },
  info_update: { label: 'Datos', color: 'bg-gray-100 text-gray-600' },
  account_created: { label: 'Creación', color: 'bg-emerald-50 text-emerald-600' },
  account_approved: { label: 'Aprobación', color: 'bg-green-50 text-green-600' },
  contract_update: { label: 'Contrato', color: 'bg-indigo-50 text-indigo-600' },
};

export default function AccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [changelog, setChangelog] = useState<ChangeLogEntry[]>([]);
  const [pms, setPms] = useState<PM[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'bitacora' | 'changelog'>('overview');
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('general');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [pmDropdownOpen, setPmDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [detailRes, notesRes, changelogRes, pmsRes] = await Promise.all([
        fetch(`${API}/api/companies/account/${companyId}/detail`),
        fetch(`${API}/api/companies/account/${companyId}/bitacora`),
        fetch(`${API}/api/companies/account/${companyId}/changelog`),
        fetch(`${API}/api/companies/pms`),
      ]);
      if (detailRes.ok) setDetail(await detailRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
      if (changelogRes.ok) setChangelog(await changelogRes.json());
      if (pmsRes.ok) setPms(await pmsRes.json());
    } catch (e) {
      console.error('Error loading account:', e);
    } finally {
      setLoading(false);
    }
  }, [API, companyId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Actions ───
  const addNote = async () => {
    if (!newNote.trim()) return;
    setNoteSubmitting(true);
    try {
      const res = await fetch(`${API}/api/companies/account/${companyId}/bitacora`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote, note_type: newNoteType }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes(prev => [note, ...prev]);
        setNewNote('');
        setNewNoteType('general');
      }
    } finally {
      setNoteSubmitting(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('¿Eliminar esta nota?')) return;
    const res = await fetch(`${API}/api/companies/account/${companyId}/bitacora/${noteId}`, { method: 'DELETE' });
    if (res.ok) setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const togglePin = async (noteId: string) => {
    const res = await fetch(`${API}/api/companies/account/${companyId}/bitacora/${noteId}/pin`, { method: 'PATCH' });
    if (res.ok) {
      const data = await res.json();
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_pinned: data.is_pinned } : n));
    }
  };

  const assignPM = async (pmId: string | null) => {
    const res = await fetch(`${API}/api/companies/account/${companyId}/assign-pm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pm_id: pmId }),
    });
    if (res.ok) {
      await fetchAll();
      setPmDropdownOpen(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    const res = await fetch(`${API}/api/companies/account/${companyId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      await fetchAll();
      setStatusDropdownOpen(false);
    }
  };

  // ─── Helpers ───
  const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  };

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    pending: { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
    trial: { label: 'Trial', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400' },
    active: { label: 'Activa', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
    suspended: { label: 'Suspendida', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400' },
    cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  };

  const planConfig: Record<string, string> = {
    trial: 'Trial (14 días)',
    starter: 'Starter — $3,200/año',
    growth: 'Growth — $9,600/año',
    enterprise: 'Enterprise — Custom',
  };

  if (loading || !detail) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const st = statusConfig[detail.status] || statusConfig.active;
  const isStudio = detail.account_type === 'studio';
  const pinnedNotes = notes.filter(n => n.is_pinned);
  const regularNotes = notes.filter(n => !n.is_pinned);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 sm:py-12">

        {/* ═══ Top Navigation ═══ */}
        <button
          onClick={() => router.push('/dashboard/accounts')}
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-900 transition-colors mb-8"
        >
          <IconArrowLeft className="w-4 h-4" />
          Cuentas
        </button>

        {/* ═══ Account Header ═══ */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Icon + Name */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-[#FFD902] shrink-0">
                {isStudio ? <IconSparkles className="w-7 h-7" /> : <IconBolt className="w-7 h-7" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-[24px] sm:text-[28px] font-semibold text-gray-900 tracking-[-0.02em] truncate">
                    {detail.name}
                  </h1>
                  <span className={`shrink-0 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-lg ${
                    isStudio ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {isStudio ? 'Studio' : 'Core'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-400">
                  <span>ID: {detail.corp_id}</span>
                  <span>·</span>
                  <span>Creada {formatDate(detail.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Status + Actions */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Status Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[13px] font-medium transition-colors ${st.color}`}
                >
                  <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                  {st.label}
                  <svg className="w-3.5 h-3.5 ml-1 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {statusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStatusDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-20">
                      {Object.entries(statusConfig).map(([key, cfg]) => (
                        <button
                          key={key}
                          onClick={() => updateStatus(key)}
                          className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                            detail.status === key ? 'font-semibold text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-7 pt-7 border-t border-gray-50">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Plan</p>
              <p className="text-[14px] font-medium text-gray-900">{planConfig[detail.plan] || detail.plan}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Usuarios</p>
              <p className="text-[14px] font-medium text-gray-900">{detail.users_count} <span className="text-gray-300 font-normal">/ {detail.max_users}</span></p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Programas</p>
              <p className="text-[14px] font-medium text-gray-900">{detail.programs_count} <span className="text-gray-300 font-normal">/ {detail.max_programs}</span></p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Suscripción</p>
              <p className="text-[14px] font-medium text-gray-900">
                {detail.is_enabled ? (
                  <span className="text-emerald-600">Activa</span>
                ) : (
                  <span className="text-red-500">Inactiva</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">PM Asignado</p>
              <p className="text-[14px] font-medium text-gray-900">
                {detail.assigned_pm ? detail.assigned_pm.full_name : <span className="text-gray-300">Sin asignar</span>}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Tab Navigation ═══ */}
        <div className="flex items-center gap-1 mb-6 bg-gray-100/60 rounded-xl p-1 w-fit">
          {[
            { key: 'overview' as const, label: 'Información', count: null },
            { key: 'bitacora' as const, label: 'Bitácora', count: notes.length },
            { key: 'changelog' as const, label: 'Historial', count: changelog.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-[13px] font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-1.5 text-[11px] text-gray-300">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ═══════════ TAB: Overview ═══════════ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Col: Client Info */}
            <div className="lg:col-span-2 space-y-6">

              {/* Contact Info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <IconUser className="w-4 h-4 text-gray-400" />
                  Contacto Principal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InfoRow icon={<IconUser className="w-4 h-4" />} label="Nombre" value={detail.contact_name} />
                  <InfoRow icon={<IconMail className="w-4 h-4" />} label="Email" value={detail.contact_email} />
                  <InfoRow icon={<IconPhone className="w-4 h-4" />} label="Teléfono / WhatsApp" value={detail.contact_phone} />
                  <InfoRow icon={<IconBriefcase className="w-4 h-4" />} label="Cargo" value={detail.contact_position} />
                </div>
              </div>

              {/* Company Info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <IconBuilding className="w-4 h-4 text-gray-400" />
                  Información de la Empresa
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InfoRow icon={<IconBuilding className="w-4 h-4" />} label="Industria" value={detail.industry} />
                  <InfoRow icon={<IconUser className="w-4 h-4" />} label="Tamaño" value={detail.company_size} />
                  <InfoRow icon={<IconGlobe className="w-4 h-4" />} label="Sitio Web" value={detail.website} isLink />
                  <InfoRow icon={<IconShield className="w-4 h-4" />} label="Razón Social" value={detail.legal_name} />
                  <InfoRow icon={<IconFileText className="w-4 h-4" />} label="RUT" value={detail.rut} />
                  <InfoRow icon={<IconBuilding className="w-4 h-4" />} label="Ubicación" value={[detail.city, detail.region, detail.country].filter(Boolean).join(', ')} />
                </div>
                {detail.description && (
                  <div className="mt-5 pt-5 border-t border-gray-50">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Descripción del Proyecto</p>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{detail.description}</p>
                  </div>
                )}
              </div>

              {/* Contract */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-5 flex items-center gap-2">
                  <IconCalendar className="w-4 h-4 text-gray-400" />
                  Contrato y Suscripción
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InfoRow icon={<IconCalendar className="w-4 h-4" />} label="Inicio de Contrato" value={detail.contract_start ? formatDate(detail.contract_start) : ''} />
                  <InfoRow icon={<IconCalendar className="w-4 h-4" />} label="Fin de Contrato" value={detail.contract_end ? formatDate(detail.contract_end) : ''} />
                  <InfoRow icon={<IconShield className="w-4 h-4" />} label="Plan" value={planConfig[detail.plan] || detail.plan} />
                  <InfoRow
                    icon={<IconShield className="w-4 h-4" />}
                    label="Estado de Suscripción"
                    value={detail.is_enabled ? 'Activa' : 'Inactiva'}
                    valueColor={detail.is_enabled ? 'text-emerald-600' : 'text-red-500'}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-50">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-[22px] font-light text-gray-900">{detail.max_users}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Máx Usuarios</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-[22px] font-light text-gray-900">{detail.max_programs}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Máx Programas</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-[22px] font-light text-gray-900">{detail.max_participants}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Máx Participantes</p>
                  </div>
                </div>
                {detail.internal_notes && (
                  <div className="mt-5 pt-5 border-t border-gray-50">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Notas Internas</p>
                    <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{detail.internal_notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: PM Assignment + Quick Bitácora */}
            <div className="space-y-6">

              {/* PM Assignment */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Project Manager</h3>

                {detail.assigned_pm ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-[#FFD902] text-[13px] font-bold shrink-0">
                      {detail.assigned_pm.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-gray-900 truncate">{detail.assigned_pm.full_name}</p>
                      <p className="text-[12px] text-gray-400 truncate">{detail.assigned_pm.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl mb-4 text-center">
                    <p className="text-[13px] text-gray-400">Sin PM asignado</p>
                  </div>
                )}

                <div className="relative">
                  <button
                    onClick={() => setPmDropdownOpen(!pmDropdownOpen)}
                    className="w-full px-4 py-2.5 text-[13px] font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {detail.assigned_pm ? 'Cambiar PM' : 'Asignar PM'}
                  </button>
                  {pmDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setPmDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-gray-100 shadow-xl py-1 z-20 max-h-60 overflow-y-auto">
                        {detail.assigned_pm && (
                          <button
                            onClick={() => assignPM(null)}
                            className="w-full px-4 py-3 text-left text-[13px] text-red-500 hover:bg-red-50 transition-colors border-b border-gray-50"
                          >
                            Desasignar PM
                          </button>
                        )}
                        {pms.map(pm => (
                          <button
                            key={pm.id}
                            onClick={() => assignPM(pm.id)}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                              detail.assigned_pm?.id === pm.id ? 'bg-gray-50' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-[#FFD902] text-[11px] font-bold shrink-0">
                              {pm.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-gray-900">{pm.full_name}</p>
                              <p className="text-[11px] text-gray-400">{pm.email}</p>
                            </div>
                            {detail.assigned_pm?.id === pm.id && (
                              <svg className="w-4 h-4 text-emerald-500 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                          </button>
                        ))}
                        {pms.length === 0 && (
                          <p className="px-4 py-3 text-[13px] text-gray-400">No hay PMs disponibles</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <IconPin className="w-4 h-4 text-amber-500" />
                    Notas Fijadas
                  </h3>
                  <div className="space-y-3">
                    {pinnedNotes.slice(0, 3).map(n => (
                      <div key={n.id} className="p-3 bg-amber-50/40 rounded-xl border border-amber-100/60">
                        <p className="text-[13px] text-gray-700 leading-relaxed">{n.content}</p>
                        <p className="text-[11px] text-gray-400 mt-2">{formatTime(n.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Activity */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
                {changelog.length === 0 && notes.length === 0 ? (
                  <p className="text-[13px] text-gray-300 text-center py-4">Sin actividad aún</p>
                ) : (
                  <div className="space-y-3">
                    {[...changelog.slice(0, 3).map(c => ({
                      type: 'change' as const,
                      desc: c.description,
                      time: c.created_at,
                      by: c.changed_by?.full_name,
                      changeType: c.change_type,
                    })), ...notes.slice(0, 2).map(n => ({
                      type: 'note' as const,
                      desc: n.content.slice(0, 80) + (n.content.length > 80 ? '...' : ''),
                      time: n.created_at,
                      by: n.author?.full_name,
                      changeType: n.note_type,
                    }))]
                      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                      .slice(0, 5)
                      .map((item, i) => {
                        const cfg = item.type === 'change'
                          ? (CHANGE_TYPES[item.changeType] || { label: 'Cambio', color: 'bg-gray-100 text-gray-600' })
                          : (NOTE_TYPES[item.changeType] || { label: 'Nota', color: 'bg-gray-100 text-gray-600' });
                        return (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-gray-600 leading-relaxed">{item.desc}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${cfg.color}`}>{cfg.label}</span>
                                <span className="text-[11px] text-gray-300">{formatTime(item.time)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ TAB: Bitácora ═══════════ */}
        {activeTab === 'bitacora' && (
          <div className="max-w-3xl">

            {/* Add Note Form */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Nueva Entrada</h3>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Escribe una nota, registra una llamada, documenta una decisión..."
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-[14px] text-gray-700 placeholder:text-gray-300 border-0 focus:ring-2 focus:ring-gray-900/10 resize-none outline-none"
                rows={3}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(NOTE_TYPES).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setNewNoteType(key)}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                        newNoteType === key
                          ? 'bg-gray-900 text-white'
                          : `${cfg.color} hover:opacity-80`
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={addNote}
                  disabled={!newNote.trim() || noteSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors ml-4 shrink-0"
                >
                  <IconSend className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>
            </div>

            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-3 px-1">
                  Notas Fijadas
                </p>
                <div className="space-y-3">
                  {pinnedNotes.map(n => (
                    <NoteCard key={n.id} note={n} onDelete={deleteNote} onTogglePin={togglePin} formatTime={formatTime} />
                  ))}
                </div>
              </div>
            )}

            {/* All Notes */}
            {regularNotes.length > 0 && (
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-3 px-1">
                  Todas las Notas
                </p>
                <div className="space-y-3">
                  {regularNotes.map(n => (
                    <NoteCard key={n.id} note={n} onDelete={deleteNote} onTogglePin={togglePin} formatTime={formatTime} />
                  ))}
                </div>
              </div>
            )}

            {notes.length === 0 && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <IconFileText className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-[14px] text-gray-400 mb-1">Sin notas aún</p>
                <p className="text-[12px] text-gray-300">Agrega la primera nota para esta cuenta</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ TAB: Changelog ═══════════ */}
        {activeTab === 'changelog' && (
          <div className="max-w-3xl">
            {changelog.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <IconClock className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-[14px] text-gray-400 mb-1">Sin historial de cambios</p>
                <p className="text-[12px] text-gray-300">Los cambios se registrarán automáticamente</p>
              </div>
            ) : (
              <div className="space-y-0">
                {changelog.map((c, i) => {
                  const cfg = CHANGE_TYPES[c.change_type] || { label: 'Cambio', color: 'bg-gray-100 text-gray-600' };
                  return (
                    <div key={c.id} className="flex gap-4">
                      {/* Timeline */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                          i === 0 ? 'bg-gray-900' : 'bg-gray-300'
                        }`} />
                        {i < changelog.length - 1 && <div className="w-px flex-1 bg-gray-100" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5">
                          <div className="flex items-start justify-between mb-2">
                            <span className={`px-2.5 py-1 text-[11px] font-medium rounded-lg ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <span className="text-[11px] text-gray-300">{formatTime(c.created_at)}</span>
                          </div>
                          <p className="text-[13px] text-gray-700 leading-relaxed">{c.description}</p>
                          {(c.old_value || c.new_value) && (
                            <div className="flex items-center gap-2 mt-3 text-[12px]">
                              {c.old_value && (
                                <span className="px-2 py-1 bg-red-50 text-red-500 rounded-md line-through">{c.old_value}</span>
                              )}
                              {c.old_value && c.new_value && (
                                <svg className="w-3 h-3 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                              )}
                              {c.new_value && (
                                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md">{c.new_value}</span>
                              )}
                            </div>
                          )}
                          {c.changed_by && (
                            <p className="text-[11px] text-gray-300 mt-3">por {c.changed_by.full_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Sub-components ───

function InfoRow({ icon, label, value, isLink, valueColor }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLink?: boolean;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-300 mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        {isLink && value ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-blue-600 hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className={`text-[13px] ${valueColor || 'text-gray-700'} truncate`}>{value || '—'}</p>
        )}
      </div>
    </div>
  );
}

function NoteCard({ note, onDelete, onTogglePin, formatTime }: {
  note: Note;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  formatTime: (d: string) => string;
}) {
  const cfg = NOTE_TYPES[note.note_type] || { label: 'Nota', color: 'bg-gray-100 text-gray-600' };
  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${
      note.is_pinned ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'
    }`}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-[11px] font-medium rounded-lg ${cfg.color}`}>{cfg.label}</span>
            {note.is_pinned && (
              <IconPin className="w-3.5 h-3.5 text-amber-500" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onTogglePin(note.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-amber-500 transition-colors" title={note.is_pinned ? 'Desfijar' : 'Fijar'}>
              <IconPin className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(note.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors" title="Eliminar">
              <IconTrash className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
          {note.author && (
            <span className="text-[11px] text-gray-400">{note.author.full_name}</span>
          )}
          <span className="text-[11px] text-gray-300">{formatTime(note.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
