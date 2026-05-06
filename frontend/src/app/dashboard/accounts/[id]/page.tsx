'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
const IconSettings = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const IconCamera = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
  </svg>
);
const IconEdit = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
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

interface CompanyProgram {
  id: string;
  name: string;
  description: string;
  theme: string;
  status: string;
  activities_count: number;
  participants_count: number;
  activities: { id: string; type: string; name: string; description: string; status: string; start_date: string | null; modality: string; meeting_url: string | null; location_address: string | null }[];
  stats?: { total: number; active: number; pending: number; by_role: Record<string, number> };
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

interface TemplateLite {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  duration: string;
  status: string;
  modules: any[];
  milestones: any[];
  tags: string[];
}

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

  const [programs, setPrograms] = useState<CompanyProgram[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'bitacora' | 'changelog' | 'programas' | 'ajustes'>('overview');

  // ─── Asignar plantilla (programas vigentes) ───
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [templates, setTemplates] = useState<TemplateLite[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [assigningTemplateId, setAssigningTemplateId] = useState<string | null>(null);
  const [assignBanner, setAssignBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('general');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [pmDropdownOpen, setPmDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deletedName, setDeletedName] = useState('');

  // ─── Ajustes (Settings) state ───
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editFields, setEditFields] = useState({
    industry: '', company_size: '', website: '', legal_name: '', rut: '',
    city: '', region: '', country: '', description: '',
  });
  const [savingInfo, setSavingInfo] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [detailRes, notesRes, changelogRes, pmsRes, programsRes] = await Promise.all([
        fetch(`${API}/api/companies/account/${companyId}/detail`),
        fetch(`${API}/api/companies/account/${companyId}/bitacora`),
        fetch(`${API}/api/companies/account/${companyId}/changelog`),
        fetch(`${API}/api/companies/pms`),
        fetch(`${API}/api/programs?company_id=${companyId}`),
      ]);
      if (detailRes.ok) setDetail(await detailRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
      if (changelogRes.ok) setChangelog(await changelogRes.json());
      if (pmsRes.ok) setPms(await pmsRes.json());
      if (programsRes.ok) {
        const progs: CompanyProgram[] = await programsRes.json();
        // Fetch participant stats for each program in parallel
        const withStats = await Promise.all(
          progs.map(async (p) => {
            try {
              const statsRes = await fetch(`${API}/api/programs/${p.id}/participants/stats`);
              if (statsRes.ok) p.stats = await statsRes.json();
            } catch {}
            return p;
          })
        );
        setPrograms(withStats);
      }
    } catch (e) {
      console.error('Error loading account:', e);
    } finally {
      setLoading(false);
    }
  }, [API, companyId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAssignModal = useCallback(async () => {
    setShowAssignModal(true);
    setAssignBanner(null);
    setTemplateSearch('');
    if (templates.length === 0) {
      setTemplatesLoading(true);
      try {
        const res = await fetch(`${API}/api/program-templates`);
        if (res.ok) {
          const data = await res.json();
          setTemplates(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Error cargando plantillas:', e);
      } finally {
        setTemplatesLoading(false);
      }
    }
  }, [API, templates.length]);

  const assignTemplate = useCallback(async (templateId: string, name?: string) => {
    setAssigningTemplateId(templateId);
    setAssignBanner(null);
    try {
      const res = await fetch(`${API}/api/companies/account/${companyId}/assign-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || 'No fue posible asignar la plantilla');
      setAssignBanner({ kind: 'ok', text: `Programa "${json?.program?.name || name || ''}" asignado correctamente.` });
      await fetchAll();
      setTimeout(() => { setShowAssignModal(false); setAssignBanner(null); }, 1200);
    } catch (e: any) {
      setAssignBanner({ kind: 'err', text: e?.message || 'Error inesperado' });
    } finally {
      setAssigningTemplateId(null);
    }
  }, [API, companyId, fetchAll]);

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

  const deleteCompany = async () => {
    setDeleting(true);
    try {
      // Get current user info
      let deletedByName = 'Desconocido';
      let deletedByEmail = '';
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          deletedByName = user.full_name || user.email || 'Desconocido';
          deletedByEmail = user.email || '';
        }
      } catch {}

      // Get client IP
      let clientIp = '';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          clientIp = ipData.ip || '';
        }
      } catch {}

      const res = await fetch(`${API}/api/companies/${companyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deleted_by_name: deletedByName,
          deleted_by_email: deletedByEmail,
          client_ip: clientIp,
        }),
      });
      if (res.ok || res.status === 204) {
        setDeletedName(detail?.name || '');
        setShowDeleteModal(false);
        setDeleted(true);
      } else {
        alert('Error al eliminar la cuenta');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Settings Actions ───
  const saveCompanyName = async () => {
    if (!editName.trim() || editName.trim() === detail?.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const res = await fetch(`${API}/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) { await fetchAll(); setEditingName(false); }
      else alert('Error al guardar');
    } catch { alert('Error de conexión'); }
    finally { setSavingName(false); }
  };

  const startEditInfo = () => {
    if (!detail) return;
    setEditFields({
      industry: detail.industry || '', company_size: detail.company_size || '',
      website: detail.website || '', legal_name: detail.legal_name || '',
      rut: detail.rut || '', city: detail.city || '', region: detail.region || '',
      country: detail.country || '', description: detail.description || '',
    });
    setEditingInfo(true);
  };

  const saveCompanyInfo = async () => {
    setSavingInfo(true);
    try {
      const res = await fetch(`${API}/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFields),
      });
      if (res.ok) { await fetchAll(); setEditingInfo(false); }
      else alert('Error al guardar');
    } catch { alert('Error de conexión'); }
    finally { setSavingInfo(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch(`${API}/api/companies/${companyId}/logo`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) await fetchAll();
      else { const err = await res.json().catch(() => null); alert(err?.detail || 'Error al subir logo'); }
    } catch { alert('Error de conexión'); }
    finally { setLogoUploading(false); if (logoInputRef.current) logoInputRef.current.value = ''; }
  };

  const deleteLogo = async () => {
    try {
      const res = await fetch(`${API}/api/companies/${companyId}/logo`, { method: 'DELETE' });
      if (res.ok) await fetchAll();
    } catch { alert('Error de conexión'); }
  };

  // ─── Helpers ───
  const avatarSrc = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http')) return url;
    return `${API}${url}`;
  };

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

  if (deleted) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 className="text-[22px] font-semibold text-gray-900 mb-2">Cuenta eliminada</h2>
          <p className="text-[14px] text-gray-500 mb-1">
            La cuenta <span className="font-semibold text-gray-700">{deletedName}</span> ha sido eliminada exitosamente.
          </p>
          <p className="text-[13px] text-gray-400 mb-8">
            Todos los datos asociados fueron removidos permanentemente.
          </p>
          <button
            onClick={() => router.push('/dashboard/accounts')}
            className="w-full px-6 py-3 bg-gray-900 text-white text-[14px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            Continuar
          </button>
        </div>
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
              {detail.logo_url ? (
                <img src={detail.logo_url} alt={detail.name} className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-[#FFD902] shrink-0">
                  {isStudio ? <IconSparkles className="w-7 h-7" /> : <IconBolt className="w-7 h-7" />}
                </div>
              )}
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
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => { setStatusDropdownOpen(false); setShowDeleteModal(true); }}
                        className="w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <IconTrash className="w-3.5 h-3.5" />
                        Eliminar cuenta
                      </button>
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
            { key: 'programas' as const, label: 'Programas', count: programs.length },
            { key: 'changelog' as const, label: 'Historial', count: changelog.length },
            { key: 'ajustes' as const, label: 'Ajustes', count: null },
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
                    {detail.assigned_pm.avatar_url ? (
                      <img src={avatarSrc(detail.assigned_pm.avatar_url)} alt={detail.assigned_pm.full_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-[#FFD902] text-[13px] font-bold shrink-0">
                        {detail.assigned_pm.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                    )}
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
                            {pm.avatar_url ? (
                              <img src={avatarSrc(pm.avatar_url)} alt={pm.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-[#FFD902] text-[11px] font-bold shrink-0">
                                {pm.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                              </div>
                            )}
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

        {/* ═══════════ TAB: Programas ═══════════ */}
        {activeTab === 'programas' && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">Programas vigentes</h3>
                <p className="text-[12px] text-gray-400">Plantillas instanciadas y operando para esta cuenta.</p>
              </div>
              <button
                onClick={openAssignModal}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-black"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Asignar programa
              </button>
            </div>

            {programs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <IconBriefcase className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-[15px] font-medium text-gray-400 mb-1">Sin programas asignados</p>
                <p className="text-[13px] text-gray-300">Esta empresa aún no tiene programas vinculados.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {programs.map(prog => {
                  const statusMap: Record<string, { label: string; color: string; bg: string; dot: string; border: string }> = {
                    designed: { label: 'Diseñado', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-400', border: 'border-amber-200' },
                    ready_for_execution: { label: 'Listo para Ejecución', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-400', border: 'border-blue-200' },
                    in_execution: { label: 'En Ejecución', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-400', border: 'border-emerald-200' },
                    under_review: { label: 'Revisión', color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-400', border: 'border-purple-200' },
                    closed: { label: 'Cerrado', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400', border: 'border-gray-200' },
                    draft: { label: 'Borrador', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400', border: 'border-gray-200' },
                    active: { label: 'Activo', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-400', border: 'border-emerald-200' },
                    paused: { label: 'Pausado', color: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-400', border: 'border-orange-200' },
                    completed: { label: 'Completado', color: 'text-sky-700', bg: 'bg-sky-50', dot: 'bg-sky-400', border: 'border-sky-200' },
                  };
                  const themeMap: Record<string, string> = {
                    leadership: 'Liderazgo', inclusion: 'Inclusión', innovation: 'Innovación',
                    wellbeing: 'Bienestar', development: 'Desarrollo', onboarding: 'Onboarding',
                  };
                  const actStatusMap: Record<string, { label: string; color: string; bg: string }> = {
                    created: { label: 'Creada', color: 'text-gray-500', bg: 'bg-gray-50' },
                    scheduled: { label: 'Programada', color: 'text-blue-700', bg: 'bg-blue-50' },
                    rescheduled: { label: 'Reprogramada', color: 'text-orange-700', bg: 'bg-orange-50' },
                    completed: { label: 'Completada', color: 'text-emerald-700', bg: 'bg-emerald-50' },
                    closed: { label: 'Cerrada', color: 'text-gray-500', bg: 'bg-gray-50' },
                  };
                  const modalityMap: Record<string, string> = {
                    online: 'Online', in_person: 'Presencial', hybrid: 'Híbrido',
                  };
                  const roleLabels: Record<string, string> = {
                    administrator: 'Admins', instructor: 'Instructores',
                    participant: 'Participantes', observer: 'Observadores',
                    mentor: 'Mentores', mentee: 'Mentees', facilitator: 'Facilitadores',
                    client: 'Clientes',
                  };
                  const st = statusMap[prog.status] || { label: prog.status, color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400', border: 'border-gray-200' };
                  const stats = prog.stats;
                  const completedActs = prog.activities.filter(a => a.status === 'completed').length;
                  const progressPct = prog.activities_count > 0 ? Math.round((completedActs / prog.activities_count) * 100) : 0;

                  return (
                    <div key={prog.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

                      {/* ── Header: nombre + estado + acción ── */}
                      <div className="px-6 pt-6 pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-[17px] font-bold text-gray-900 truncate">{prog.name}</h3>
                              <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${st.bg} ${st.color} ${st.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                {st.label}
                              </span>
                            </div>
                            {prog.description && (
                              <p className="text-[13px] text-gray-400 leading-relaxed">{prog.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const slug = detail.slug || 'studio';
                              window.open(`/studio/${slug}/program/${prog.id}`, '_blank');
                            }}
                            className="shrink-0 px-4 py-2 text-[13px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
                          >
                            Gestionar
                          </button>
                        </div>
                      </div>

                      {/* ── Resumen rápido: línea de metadata ── */}
                      <div className="px-6 pb-4">
                        <div className="flex items-center gap-5 text-[12px] text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <IconSparkles className="w-3.5 h-3.5" />
                            {themeMap[prog.theme] || prog.theme}
                          </span>
                          <span className="w-px h-3 bg-gray-200" />
                          <span>{prog.activities_count} {prog.activities_count === 1 ? 'actividad' : 'actividades'}</span>
                          <span className="w-px h-3 bg-gray-200" />
                          <span>{stats?.total ?? prog.participants_count} participantes</span>
                          {completedActs > 0 && (
                            <>
                              <span className="w-px h-3 bg-gray-200" />
                              <span className="text-emerald-600 font-medium">{completedActs}/{prog.activities_count} completadas</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* ── Barra de progreso ── */}
                      <div className="mx-6 mb-5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Progreso general</span>
                          <span className="text-[12px] font-bold text-gray-700">{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* ── KPIs en grid ── */}
                      <div className="mx-6 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Participantes */}
                        <div className="bg-gray-50/80 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                            </svg>
                            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Participantes</span>
                          </div>
                          <p className="text-[22px] font-bold text-gray-900">{stats?.total ?? prog.participants_count}</p>
                        </div>
                        {/* Activos */}
                        <div className="bg-gray-50/80 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Activos</span>
                          </div>
                          <p className="text-[22px] font-bold text-emerald-600">{stats?.active ?? 0}</p>
                        </div>
                        {/* Pendientes */}
                        <div className="bg-gray-50/80 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Pendientes</span>
                          </div>
                          <p className="text-[22px] font-bold text-amber-600">{stats?.pending ?? 0}</p>
                        </div>
                        {/* Actividades */}
                        <div className="bg-gray-50/80 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            <span className="text-[11px] text-gray-400 uppercase tracking-wider">Actividades</span>
                          </div>
                          <p className="text-[22px] font-bold text-indigo-600">{prog.activities_count}</p>
                        </div>
                      </div>

                      {/* ── Distribución por rol ── */}
                      {stats && Object.keys(stats.by_role).length > 0 && (
                        <div className="mx-6 mb-5">
                          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2.5">Equipo por rol</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(stats.by_role).map(([role, count]) => (
                              <span key={role} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[12px] text-gray-600 shadow-sm">
                                <IconUser className="w-3 h-3 text-gray-400" />
                                <span className="font-medium text-gray-800">{count}</span>
                                {roleLabels[role] || role}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Tabla de actividades ── */}
                      {prog.activities.length > 0 && (
                        <div className="border-t border-gray-100">
                          <div className="px-6 py-4">
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-[13px] font-semibold text-gray-700">Actividades del Programa</p>
                              <span className="text-[11px] text-gray-400">{prog.activities.length} {prog.activities.length === 1 ? 'actividad' : 'actividades'}</span>
                            </div>
                            <div className="overflow-x-auto -mx-6">
                              <table className="w-full min-w-[600px]">
                                <thead>
                                  <tr className="bg-gray-50/60">
                                    <th className="text-left pl-6 pr-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                                    <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actividad</th>
                                    <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">Tipo</th>
                                    <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">Modalidad</th>
                                    <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">Fecha</th>
                                    <th className="text-left px-3 pr-6 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">Estado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {prog.activities.map((act, idx) => {
                                    const as2 = actStatusMap[act.status] || { label: act.status, color: 'text-gray-500', bg: 'bg-gray-50' };
                                    const typeLabel: Record<string, string> = {
                                      training: 'Capacitación', event: 'Evento', exercise: 'Ejercicio',
                                      workshop: 'Taller', talk: 'Charla', meeting: 'Reunión',
                                    };
                                    return (
                                      <tr key={act.id} className="border-t border-gray-50 hover:bg-gray-50/40 transition-colors">
                                        <td className="pl-6 pr-3 py-3.5">
                                          <span className="text-[12px] font-mono text-gray-300">{String(idx + 1).padStart(2, '0')}</span>
                                        </td>
                                        <td className="px-3 py-3.5">
                                          <p className="text-[13px] font-medium text-gray-800 leading-tight">{act.name}</p>
                                          {act.description && <p className="text-[11px] text-gray-400 mt-0.5 leading-tight line-clamp-1">{act.description}</p>}
                                        </td>
                                        <td className="px-3 py-3.5">
                                          <span className="text-[12px] text-gray-500">{typeLabel[act.type] || act.type}</span>
                                        </td>
                                        <td className="px-3 py-3.5">
                                          <span className="text-[12px] text-gray-500">{modalityMap[act.modality] || act.modality || '—'}</span>
                                        </td>
                                        <td className="px-3 py-3.5">
                                          <span className="text-[12px] text-gray-500">
                                            {act.start_date ? new Date(act.start_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : <span className="text-gray-300">Sin programar</span>}
                                          </span>
                                        </td>
                                        <td className="px-3 pr-6 py-3.5">
                                          <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded-md ${as2.bg} ${as2.color}`}>{as2.label}</span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ TAB: Ajustes ═══════════ */}
        {activeTab === 'ajustes' && (
          <div className="max-w-3xl space-y-6">

            {/* ── Logo ── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <IconCamera className="w-4 h-4 text-gray-400" />
                Logo de la Empresa
              </h3>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  {detail.logo_url ? (
                    <img
                      src={detail.logo_url}
                      alt="Logo"
                      className="w-24 h-24 rounded-2xl object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <IconBuilding className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  {logoUploading && (
                    <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
                  >
                    {detail.logo_url ? 'Cambiar logo' : 'Subir logo'}
                  </button>
                  {detail.logo_url && (
                    <button
                      onClick={deleteLogo}
                      className="block text-[12px] text-red-500 hover:text-red-600 transition-colors"
                    >
                      Eliminar logo
                    </button>
                  )}
                  <p className="text-[11px] text-gray-400">JPG, PNG o WebP. Máx 3 MB. Se recomienda formato cuadrado.</p>
                </div>
              </div>
            </div>

            {/* ── Nombre de la empresa ── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <IconBuilding className="w-4 h-4 text-gray-400" />
                  Nombre de la Empresa
                </h3>
                {!editingName && (
                  <button
                    onClick={() => { setEditName(detail.name); setEditingName(true); }}
                    className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <IconEdit className="w-3.5 h-3.5" />
                    Editar
                  </button>
                )}
              </div>
              {editingName ? (
                <div className="flex items-center gap-3">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-[14px] text-gray-700 border border-gray-200 focus:ring-2 focus:ring-gray-900/10 outline-none"
                  />
                  <button
                    onClick={saveCompanyName}
                    disabled={savingName || !editName.trim()}
                    className="px-4 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  >
                    {savingName ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="px-4 py-2.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <p className="text-[16px] text-gray-900 font-medium">{detail.name}</p>
              )}
            </div>

            {/* ── Admin Root / Administrador de Cuenta ── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <IconShield className="w-4 h-4 text-gray-400" />
                Administrador de Cuenta
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoRow icon={<IconUser className="w-4 h-4" />} label="Contacto" value={detail.contact_name} />
                <InfoRow icon={<IconMail className="w-4 h-4" />} label="Email" value={detail.contact_email} />
                <InfoRow icon={<IconPhone className="w-4 h-4" />} label="Teléfono" value={detail.contact_phone} />
                <InfoRow icon={<IconBriefcase className="w-4 h-4" />} label="Cargo" value={detail.contact_position} />
              </div>
            </div>

            {/* ── Información de la empresa (editable) ── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <IconFileText className="w-4 h-4 text-gray-400" />
                  Información de la Empresa
                </h3>
                {!editingInfo && (
                  <button
                    onClick={startEditInfo}
                    className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <IconEdit className="w-3.5 h-3.5" />
                    Editar
                  </button>
                )}
              </div>
              {editingInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {([
                      { key: 'industry', label: 'Industria' },
                      { key: 'company_size', label: 'Tamaño' },
                      { key: 'website', label: 'Sitio Web' },
                      { key: 'legal_name', label: 'Razón Social' },
                      { key: 'rut', label: 'RUT' },
                      { key: 'city', label: 'Ciudad' },
                      { key: 'region', label: 'Región' },
                      { key: 'country', label: 'País' },
                    ] as { key: keyof typeof editFields; label: string }[]).map(f => (
                      <div key={f.key}>
                        <label className="block text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">{f.label}</label>
                        <input
                          value={editFields[f.key]}
                          onChange={e => setEditFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-[13px] text-gray-700 border border-gray-200 focus:ring-2 focus:ring-gray-900/10 outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 uppercase tracking-wider mb-1.5">Descripción</label>
                    <textarea
                      value={editFields.description}
                      onChange={e => setEditFields(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2.5 bg-gray-50 rounded-xl text-[13px] text-gray-700 border border-gray-200 focus:ring-2 focus:ring-gray-900/10 outline-none resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={saveCompanyInfo}
                      disabled={savingInfo}
                      className="px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors"
                    >
                      {savingInfo ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      onClick={() => setEditingInfo(false)}
                      className="px-4 py-2.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InfoRow icon={<IconBuilding className="w-4 h-4" />} label="Industria" value={detail.industry} />
                  <InfoRow icon={<IconUser className="w-4 h-4" />} label="Tamaño" value={detail.company_size} />
                  <InfoRow icon={<IconGlobe className="w-4 h-4" />} label="Sitio Web" value={detail.website} isLink />
                  <InfoRow icon={<IconShield className="w-4 h-4" />} label="Razón Social" value={detail.legal_name} />
                  <InfoRow icon={<IconFileText className="w-4 h-4" />} label="RUT" value={detail.rut} />
                  <InfoRow icon={<IconBuilding className="w-4 h-4" />} label="Ciudad" value={detail.city} />
                  <InfoRow icon={<IconBuilding className="w-4 h-4" />} label="Región" value={detail.region} />
                  <InfoRow icon={<IconGlobe className="w-4 h-4" />} label="País" value={detail.country} />
                  {detail.description && (
                    <div className="sm:col-span-2 pt-3 border-t border-gray-50">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">Descripción</p>
                      <p className="text-[13px] text-gray-600 leading-relaxed">{detail.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Contrato y Suscripción ── */}
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
            </div>

            {/* ── Generación de Contrato ── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <IconFileText className="w-4 h-4 text-gray-400" />
                Generación de Contrato
              </h3>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <IconClock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-700">Estado: Pendiente</p>
                    <p className="text-[11px] text-gray-400">No se ha generado un contrato aún</p>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full px-4 py-2.5 text-[13px] font-medium text-gray-400 bg-gray-200 rounded-xl cursor-not-allowed"
                >
                  Generar contrato (próximamente)
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ═══ Assign Template Modal ═══ */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[16px] font-semibold text-gray-900">Asignar programa a {detail?.name}</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">Selecciona una plantilla del catálogo. Al asignarla se instancia como un programa nuevo para esta cuenta.</p>
              </div>
              <button
                onClick={() => { setShowAssignModal(false); setAssignBanner(null); }}
                className="text-gray-400 hover:text-gray-700"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-3 border-b border-gray-100">
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Buscar plantilla por nombre, categoría o tag…"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none"
              />
            </div>

            {assignBanner && (
              <div className={`mx-6 mt-3 rounded-lg px-3 py-2 text-[12px] ${assignBanner.kind === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {assignBanner.text}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {templatesLoading ? (
                <div className="text-center py-12 text-[13px] text-gray-400">Cargando plantillas…</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[14px] text-gray-500 mb-2">No hay plantillas creadas todavía.</p>
                  <a href="/dashboard/programs" className="text-[12px] text-gray-900 underline">Crear una en /dashboard/programs →</a>
                </div>
              ) : (
                <ul className="space-y-2">
                  {templates
                    .filter(t => {
                      if (!templateSearch.trim()) return true;
                      const q = templateSearch.toLowerCase();
                      return (
                        t.name.toLowerCase().includes(q) ||
                        (t.category || '').toLowerCase().includes(q) ||
                        (t.tags || []).some(tg => (tg || '').toLowerCase().includes(q))
                      );
                    })
                    .map((t) => {
                      const alreadyAssigned = programs.some(p => (p.name || '').trim().toLowerCase() === t.name.trim().toLowerCase());
                      const busy = assigningTemplateId === t.id;
                      return (
                        <li key={t.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-900/30 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[14px] font-semibold text-gray-900">{t.name}</span>
                                <span className={`inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${t.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{t.status}</span>
                                {t.category && (
                                  <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.category}</span>
                                )}
                                {t.duration && (
                                  <span className="text-[11px] text-gray-400">· {t.duration}</span>
                                )}
                              </div>
                              {t.description && (
                                <p className="text-[12px] text-gray-500 mt-1 line-clamp-2">{t.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                                <span>{(t.modules || []).length} módulos</span>
                                <span>·</span>
                                <span>{(t.milestones || []).length} hitos</span>
                                {(t.tags || []).slice(0, 3).map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-500">#{tag}</span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => assignTemplate(t.id, t.name)}
                              disabled={busy || alreadyAssigned}
                              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              {busy ? 'Asignando…' : alreadyAssigned ? 'Ya asignada' : 'Asignar'}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>Catálogo en /dashboard/programs · {templates.length} plantillas disponibles</span>
              <button
                onClick={() => { setShowAssignModal(false); setAssignBanner(null); }}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-600 hover:bg-gray-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Delete Confirmation Modal ═══ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <IconTrash className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-[17px] font-semibold text-gray-900">Eliminar cuenta</h3>
            </div>
            <p className="text-[14px] text-gray-600 mb-2">
              Esta acción es <span className="font-semibold text-red-600">irreversible</span>. Se eliminarán permanentemente todos los datos de la empresa, incluyendo usuarios, programas y toda la información asociada.
            </p>
            <p className="text-[13px] text-gray-500 mb-4">
              Para confirmar, escribe el nombre de la empresa: <span className="font-semibold text-gray-900">{detail.name}</span>
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={e => setDeleteConfirmName(e.target.value)}
              placeholder={detail.name}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-[14px] text-gray-700 placeholder:text-gray-300 border border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-300 outline-none mb-5"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmName(''); }}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={deleteCompany}
                disabled={deleteConfirmName !== detail.name || deleting}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                {deleting ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

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
