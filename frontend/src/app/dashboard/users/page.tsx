"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// ============ TYPES ============
interface UserData {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  company_id: string | null;
  company_name: string | null;
  position: string;
  department: string;
  phone: string;
  is_active: boolean;
  is_account_activated: boolean;
  is_onboarded: boolean;
  view_permissions: string[];
  created_at: string | null;
  avatar_url: string | null;
}

interface CompanyOption {
  id: string;
  name: string;
}

// ============ CONSTANTS ============
const ROLE_OPTIONS = [
  { value: "admin_root", label: "Admin Root", color: "bg-red-100 text-red-700" },
  { value: "coordinator", label: "Coordinador", color: "bg-cyan-100 text-cyan-700" },
  { value: "project_manager", label: "Project Manager", color: "bg-purple-100 text-purple-700" },
  { value: "billing", label: "Facturación", color: "bg-amber-100 text-amber-700" },
];

const getRoleStyle = (role: string) => {
  return ROLE_OPTIONS.find((r) => r.value === role)?.color || "bg-gray-100 text-gray-600";
};

const getRoleLabel = (role: string) => {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
};

const VIEW_PERMISSIONS_OPTIONS = [
  { key: "dashboard", label: "Vista General" },
  { key: "accounts", label: "Cuentas Studio" },
  { key: "programs", label: "Programas Studio" },
  { key: "programs-assignments", label: "Asignaciones" },
  { key: "intelligent-match", label: "Match Inteligente" },
  { key: "billing", label: "Facturación" },
  { key: "users", label: "Usuarios" },
  { key: "analytics", label: "Analytics (Pronto)" },
  { key: "ecosystem", label: "Ecosistema" },
  { key: "team-chat", label: "Chat de Equipo" },
  { key: "configuration", label: "Configuración" },
  { key: "notifications", label: "Notificaciones" },
];

const ALL_VIEW_KEYS = VIEW_PERMISSIONS_OPTIONS.map((v) => v.key);

// ============ API HELPERS ============
function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${API_URL}/api/companies${path}`, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Error ${res.status}`);
  }
  return res.json();
}

// ============ MAIN COMPONENT ============
export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [viewType, setViewType] = useState<"all" | "internal" | "company">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Internal = Inspiratoria team roles (no company context)
  const INTERNAL_ROLES = ["admin_root", "coordinator", "project_manager", "billing"];
  // Company = users belonging to studio accounts
  const COMPANY_ROLES = ["mentor", "mentee", "facilitator", "facilitator_internal", "admin", "participant", "participant_cell"];

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    email: "",
    full_name: "",
    role: "coordinator",
    position: "",
    view_permissions: [...ALL_VIEW_KEYS],
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "",
    position: "",
    is_active: true,
    view_permissions: [] as string[],
  });

  // ============ AUTH CHECK ============
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    const adminRoles = ["superadmin", "admin_root", "inspiratoria_admin"];
    if (!adminRoles.includes(user.role)) {
      router.push("/dashboard");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  // ============ FETCH DATA ============
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const data = await apiFetch(`/admin/users?${params.toString()}`);
      let filtered = data.users || [];

      if (statusFilter === "active") filtered = filtered.filter((u: UserData) => u.is_active && u.is_account_activated);
      else if (statusFilter === "inactive") filtered = filtered.filter((u: UserData) => !u.is_active);
      else if (statusFilter === "pending") filtered = filtered.filter((u: UserData) => !u.is_account_activated);

      setUsers(filtered);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setActionMessage({ type: "error", text: err.message || "Error cargando usuarios" });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  const fetchCompanies = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await apiFetch(`${API_URL}/api/companies/admin/companies-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : data.companies || []);
      }
    } catch {
      // Companies list not critical
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchCompanies();
    }
  }, [currentUser, fetchUsers, fetchCompanies]);

  // ============ ACTIONS ============
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);
    try {
      await apiFetch("/admin/create-user", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      setActionMessage({ type: "success", text: `Usuario creado. OTP enviado a ${createForm.email}` });
      setShowCreateModal(false);
      setCreateForm({ email: "", full_name: "", role: "coordinator", position: "", view_permissions: [...ALL_VIEW_KEYS] });
      fetchUsers();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Error creando usuario" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await apiFetch(`/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });

      // If editing the currently logged-in user, update localStorage & notify sidebar
      if (currentUser && selectedUser.id === currentUser.id) {
        try {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          stored.view_permissions = editForm.view_permissions;
          localStorage.setItem("user", JSON.stringify(stored));
          window.dispatchEvent(new Event("viewPermissionsUpdated"));
        } catch {}
      }

      setActionMessage({ type: "success", text: "Usuario actualizado correctamente" });
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Error actualizando usuario" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await apiFetch(`/admin/users/${selectedUser.id}`, { method: "DELETE" });
      setActionMessage({ type: "success", text: "Usuario eliminado correctamente" });
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Error eliminando usuario" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendOTP = async (userId: string) => {
    setActionMessage(null);
    try {
      await apiFetch(`/admin/resend-otp/${userId}`, { method: "POST" });
      setActionMessage({ type: "success", text: "OTP reenviado correctamente" });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Error reenviando OTP" });
    }
  };

  const handleToggleActive = async (user: UserData) => {
    try {
      await apiFetch(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      fetchUsers();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Error actualizando estado" });
    }
  };

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || "",
      role: user.role || "",
      position: user.position || "",
      is_active: user.is_active,
      view_permissions: user.view_permissions || [],
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (user: UserData) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  // ============ DERIVED DATA ============
  const internalUsers = users.filter(u => INTERNAL_ROLES.includes(u.role) || (!u.company_id && !COMPANY_ROLES.includes(u.role)));
  const companyUsers  = users.filter(u => u.company_id || COMPANY_ROLES.includes(u.role));
  const displayedUsers = viewType === 'internal' ? internalUsers : viewType === 'company' ? companyUsers : users;

  const INTERNAL_ROLE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
    admin_root:      { label: 'Admin Root',      bg: '#fef3c7', text: '#92400e' },
    coordinator:     { label: 'Coordinador',     bg: '#dbeafe', text: '#1e40af' },
    project_manager: { label: 'Project Manager', bg: '#ede9fe', text: '#5b21b6' },
    billing:         { label: 'Facturación',     bg: '#fef9c3', text: '#854d0e' },
  };

  const COMPANY_ROLE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
    mentor:              { label: 'Mentor',       bg: '#dcfce7', text: '#15803d' },
    mentee:              { label: 'Mentee',       bg: '#e0f2fe', text: '#0369a1' },
    facilitator:         { label: 'Facilitador',  bg: '#fce7f3', text: '#9d174d' },
    facilitator_internal:{ label: 'Facilitador',  bg: '#fce7f3', text: '#9d174d' },
    admin:               { label: 'Admin',        bg: '#fef3c7', text: '#92400e' },
    participant:         { label: 'Participante', bg: '#f3f4f6', text: '#374151' },
    participant_cell:    { label: 'Participante', bg: '#f3f4f6', text: '#374151' },
  };

  const getRoleBadge = (role: string, hasCompany: boolean) => {
    const style = hasCompany
      ? (COMPANY_ROLE_STYLES[role] || { label: role, bg: '#f3f4f6', text: '#374151' })
      : (INTERNAL_ROLE_STYLES[role] || { label: role, bg: '#f3f4f6', text: '#374151' });
    return (
      <span style={{ display:'inline-flex', alignItems:'center', padding:'0.2rem 0.6rem', borderRadius:999, fontSize:'0.68rem', fontWeight:700, background: style.bg, color: style.text, whiteSpace:'nowrap' as const }}>
        {style.label}
      </span>
    );
  };

  // ============ RENDER ============
  if (!currentUser) return null;

  return (
    <div className="p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#b08a00', marginBottom:'0.4rem' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#F5C800', display:'inline-block' }} />
            Gestión
          </div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800, color:'#0f0f0f', letterSpacing:'-0.02em', lineHeight:1.15, margin:0 }}>Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">{total} usuarios registrados en la plataforma</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all hover:shadow-lg hover:shadow-gray-900/10 active:scale-[0.98]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear Usuario
        </button>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className={`mb-4 rounded-xl border px-4 py-3 flex items-center justify-between ${
          actionMessage.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-current opacity-50 hover:opacity-100">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* ── VIEW TYPE TABS ── */}
      <div style={{ display:'flex', gap:'0.25rem', background:'#f5f5f5', border:'1px solid #ebebeb', borderRadius:10, padding:'0.2rem', width:'fit-content', marginBottom:'1.5rem' }}>
        {([
          { id: 'all',      label: `Todos`,                  count: users.length },
          { id: 'internal', label: `Equipo Inspiratoria`,    count: internalUsers.length },
          { id: 'company',  label: `Usuarios de Empresa`,    count: companyUsers.length },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setViewType(t.id)}
            style={{
              padding:'0.35rem 0.85rem', borderRadius:8, border:'none', cursor:'pointer', transition:'all 0.12s',
              background: viewType === t.id ? '#0f0f0f' : 'transparent',
              color: viewType === t.id ? '#fff' : '#888',
              fontSize:'0.78rem', fontWeight: viewType === t.id ? 700 : 500,
              display:'flex', alignItems:'center', gap:'0.4rem',
            }}>
            {t.label}
            <span style={{
              fontSize:'0.65rem', padding:'0.05rem 0.4rem', borderRadius:999,
              background: viewType === t.id ? 'rgba(255,255,255,0.2)' : '#e0e0e0',
              color: viewType === t.id ? '#fff' : '#888', fontWeight:700,
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── CONTEXTUAL INFO BANNER ── */}
      {viewType === 'internal' && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.75rem 1rem', background:'rgba(245,200,0,0.08)', border:'1px solid rgba(245,200,0,0.25)', borderLeft:'3px solid #F5C800', borderRadius:10, marginBottom:'1.25rem', fontSize:'0.78rem', color:'#7a5900' }}>
          <svg style={{ width:14, height:14, flexShrink:0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span><strong>Equipo Inspiratoria</strong> — Usuarios internos con acceso al panel de administración. Pueden gestionar cuentas, programas y configuración.</span>
        </div>
      )}
      {viewType === 'company' && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.75rem 1rem', background:'#f0f9ff', border:'1px solid #bae6fd', borderLeft:'3px solid #0ea5e9', borderRadius:10, marginBottom:'1.25rem', fontSize:'0.78rem', color:'#0369a1' }}>
          <svg style={{ width:14, height:14, flexShrink:0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg>
          <span><strong>Usuarios de Empresa</strong> — Mentores, mentees y facilitadores pertenecientes a cuentas Studio. Se crean automáticamente al onboardear una empresa.</span>
        </div>
      )}

      {/* ── SEARCH + FILTERS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={viewType === 'company' ? 'Buscar por nombre, email o empresa...' : 'Buscar por nombre, email...'}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 py-2.5 text-sm placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none transition-all" />
          </div>
          {viewType !== 'company' && (
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 focus:outline-none transition-all">
              <option value="">Todos los roles</option>
              {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          )}
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 focus:outline-none transition-all">
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="pending">Pendiente OTP</option>
          </select>
        </div>
      </div>

      {/* ── KPI CARDS (contextual) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {viewType === 'company' ? (<>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-900">{companyUsers.length}</p>
            <p className="text-xs text-gray-400 mt-1">Usuarios de empresa</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-green-600">{companyUsers.filter(u => u.is_active && u.is_account_activated).length}</p>
            <p className="text-xs text-gray-400 mt-1">Activos</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold" style={{ color:'#8b5cf6' }}>{companyUsers.filter(u => u.role === 'mentor').length}</p>
            <p className="text-xs text-gray-400 mt-1">Mentores</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold" style={{ color:'#0ea5e9' }}>{companyUsers.filter(u => u.role === 'mentee').length}</p>
            <p className="text-xs text-gray-400 mt-1">Mentees</p>
          </div>
        </>) : viewType === 'internal' ? (<>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4" style={{ borderLeft:'3px solid #F5C800' }}>
            <p className="text-2xl font-bold text-gray-900">{internalUsers.length}</p>
            <p className="text-xs text-gray-400 mt-1">Equipo Inspiratoria</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-green-600">{internalUsers.filter(u => u.is_active && u.is_account_activated).length}</p>
            <p className="text-xs text-gray-400 mt-1">Activos</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-amber-500">{internalUsers.filter(u => !u.is_account_activated).length}</p>
            <p className="text-xs text-gray-400 mt-1">Pendiente OTP</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-red-500">{internalUsers.filter(u => !u.is_active).length}</p>
            <p className="text-xs text-gray-400 mt-1">Inactivos</p>
          </div>
        </>) : (<>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-400 mt-1">Total Usuarios</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active && u.is_account_activated).length}</p>
            <p className="text-xs text-gray-400 mt-1">Activos</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-amber-500">{users.filter(u => !u.is_account_activated).length}</p>
            <p className="text-xs text-gray-400 mt-1">Pendiente OTP</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-2xl font-bold text-red-500">{users.filter(u => !u.is_active).length}</p>
            <p className="text-xs text-gray-400 mt-1">Inactivos</p>
          </div>
        </>)}
      </div>

      {/* ── USERS TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
              <span className="text-sm">Cargando usuarios...</span>
            </div>
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            <p className="text-sm font-medium">No se encontraron usuarios</p>
            <p className="text-xs mt-1">Ajusta los filtros o crea un nuevo usuario</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Usuario</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Rol</th>
                  {viewType === 'company' && <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Empresa</th>}
                  {viewType !== 'company' && <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Cargo</th>}
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Estado</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 hidden xl:table-cell">Fecha</th>
                  <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    {/* User info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-xs font-bold text-gray-500">
                          {user.full_name ? user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.full_name || user.username}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getRoleStyle(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    {/* Cargo */}
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{user.position || "\u2014"}</span>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {!user.is_account_activated ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                            <svg className="h-3 w-3 animate-pulse" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                            Pendiente OTP
                          </span>
                          <button
                            onClick={() => handleResendOTP(user.id)}
                            title="Reenviar OTP"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-amber-100 text-amber-500 transition-all"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          </button>
                        </div>
                      ) : user.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-[11px] font-semibold text-green-600">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                          Inactivo
                        </span>
                      )}
                    </td>
                    {/* Date */}
                    <td className="px-5 py-3.5 hidden xl:table-cell">
                      <span className="text-xs text-gray-400">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) : "\u2014"}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle active */}
                        <button
                          onClick={() => handleToggleActive(user)}
                          title={user.is_active ? "Desactivar" : "Activar"}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          {user.is_active ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          )}
                        </button>
                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(user)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => openDeleteConfirm(user)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-400">Página {page} de {totalPages}</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============ CREATE USER MODAL ============ */}
      {showCreateModal && (
        <div
          style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)', padding:'1rem' }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{ background:'#fff', borderRadius:20, boxShadow:'0 32px 64px rgba(0,0,0,0.18)', width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto', animation:'modalIn 0.22s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`@keyframes modalIn { from { opacity:0; transform:translateY(16px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>

            {/* Header */}
            <div style={{ padding:'1.5rem 1.5rem 1.25rem', borderBottom:'1px solid #f0f0f0' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:'#0f0f0f', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg style={{ width:18, height:18, color:'#F5C800' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#b08a00', marginBottom:'0.15rem' }}>Nuevo usuario</div>
                    <h2 style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f0f0f', letterSpacing:'-0.01em', margin:0 }}>Crear Usuario</h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{ width:32, height:32, borderRadius:8, border:'1px solid #ebebeb', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#999', flexShrink:0 }}
                >
                  <svg style={{ width:14, height:14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>

              {/* Email + Nombre — 2 columns */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'#888', marginBottom:'0.4rem' }}>Email corporativo <span style={{ color:'#F5C800' }}>*</span></label>
                  <input
                    type="email" required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="usuario@empresa.com"
                    style={{ width:'100%', padding:'0.55rem 0.75rem', border:'1.5px solid #ebebeb', borderRadius:10, fontSize:'0.82rem', background:'#fafafa', color:'#0f0f0f', outline:'none', boxSizing:'border-box', transition:'border 0.15s, background 0.15s' }}
                    onFocus={(e) => { e.target.style.borderColor='#0f0f0f'; e.target.style.background='#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor='#ebebeb'; e.target.style.background='#fafafa'; }}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'#888', marginBottom:'0.4rem' }}>Nombre completo <span style={{ color:'#F5C800' }}>*</span></label>
                  <input
                    type="text" required
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                    placeholder="Nombre Apellido"
                    style={{ width:'100%', padding:'0.55rem 0.75rem', border:'1.5px solid #ebebeb', borderRadius:10, fontSize:'0.82rem', background:'#fafafa', color:'#0f0f0f', outline:'none', boxSizing:'border-box', transition:'border 0.15s, background 0.15s' }}
                    onFocus={(e) => { e.target.style.borderColor='#0f0f0f'; e.target.style.background='#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor='#ebebeb'; e.target.style.background='#fafafa'; }}
                  />
                </div>
              </div>

              {/* Cargo */}
              <div>
                <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'#888', marginBottom:'0.4rem' }}>Cargo <span style={{ fontSize:'0.65rem', color:'#bbb', fontWeight:400 }}>(opcional)</span></label>
                <input
                  type="text"
                  value={createForm.position}
                  onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                  placeholder="Director, Gerente, Coordinador..."
                  style={{ width:'100%', padding:'0.55rem 0.75rem', border:'1.5px solid #ebebeb', borderRadius:10, fontSize:'0.82rem', background:'#fafafa', color:'#0f0f0f', outline:'none', boxSizing:'border-box', transition:'border 0.15s, background 0.15s' }}
                  onFocus={(e) => { e.target.style.borderColor='#0f0f0f'; e.target.style.background='#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor='#ebebeb'; e.target.style.background='#fafafa'; }}
                />
              </div>

              {/* Role — card selector */}
              <div>
                <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, color:'#888', marginBottom:'0.6rem' }}>Rol <span style={{ color:'#F5C800' }}>*</span></label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                  {ROLE_OPTIONS.map((r) => {
                    const active = createForm.role === r.value;
                    const roleColors: Record<string,{bg:string,border:string,dot:string}> = {
                      admin_root:     { bg:'#fff8e1', border:'#F5C800', dot:'#F5C800' },
                      coordinator:    { bg:'#e0f2fe', border:'#0ea5e9', dot:'#0ea5e9' },
                      project_manager:{ bg:'#f3e8ff', border:'#a855f7', dot:'#a855f7' },
                      billing:        { bg:'#fef3c7', border:'#f59e0b', dot:'#f59e0b' },
                    };
                    const rc = roleColors[r.value] || { bg:'#f5f5f5', border:'#ccc', dot:'#999' };
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setCreateForm({ ...createForm, role: r.value })}
                        style={{
                          display:'flex', alignItems:'center', gap:'0.6rem',
                          padding:'0.65rem 0.85rem',
                          border: active ? `2px solid ${rc.border}` : '2px solid #ebebeb',
                          borderRadius:12,
                          background: active ? rc.bg : '#fafafa',
                          cursor:'pointer',
                          transition:'all 0.15s',
                          textAlign:'left',
                        }}
                      >
                        <div style={{ width:8, height:8, borderRadius:'50%', background: active ? rc.dot : '#ccc', flexShrink:0, transition:'background 0.15s' }} />
                        <span style={{ fontSize:'0.8rem', fontWeight: active ? 700 : 500, color: active ? '#0f0f0f' : '#888', transition:'all 0.15s' }}>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop:'1px solid #f0f0f0', marginTop:'0.25rem' }} />

              {/* Permissions */}
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.6rem' }}>
                  <label style={{ fontSize:'0.72rem', fontWeight:600, color:'#888' }}>Acceso al dashboard</label>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = createForm.view_permissions.length === ALL_VIEW_KEYS.length;
                      setCreateForm({ ...createForm, view_permissions: allSelected ? [] : [...ALL_VIEW_KEYS] });
                    }}
                    style={{ fontSize:'0.7rem', color:'#aaa', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}
                  >
                    {createForm.view_permissions.length === ALL_VIEW_KEYS.length ? "Quitar todas" : "Seleccionar todas"}
                  </button>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                  {VIEW_PERMISSIONS_OPTIONS.map((view) => {
                    const checked = createForm.view_permissions.includes(view.key);
                    return (
                      <button
                        key={view.key}
                        type="button"
                        onClick={() => {
                          const perms = checked
                            ? createForm.view_permissions.filter((p) => p !== view.key)
                            : [...createForm.view_permissions, view.key];
                          setCreateForm({ ...createForm, view_permissions: perms });
                        }}
                        style={{
                          display:'inline-flex', alignItems:'center', gap:'0.3rem',
                          padding:'0.3rem 0.65rem',
                          borderRadius:999,
                          border: checked ? '1.5px solid #0f0f0f' : '1.5px solid #e0e0e0',
                          background: checked ? '#0f0f0f' : '#fafafa',
                          color: checked ? '#fff' : '#888',
                          fontSize:'0.72rem', fontWeight: checked ? 600 : 400,
                          cursor:'pointer', transition:'all 0.15s',
                        }}
                      >
                        {checked && (
                          <svg style={{ width:10, height:10 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        )}
                        {view.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OTP Banner */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'0.85rem 1rem', background:'rgba(245,200,0,0.08)', border:'1px solid rgba(245,200,0,0.35)', borderLeft:'3px solid #F5C800', borderRadius:12 }}>
                <svg style={{ width:16, height:16, color:'#b08a00', flexShrink:0, marginTop:2 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <div>
                  <p style={{ fontSize:'0.78rem', fontWeight:600, color:'#7a5900', margin:0 }}>Se enviará un código OTP por email</p>
                  <p style={{ fontSize:'0.72rem', color:'#a07000', margin:'0.15rem 0 0' }}>El usuario recibirá un código de 4 dígitos para activar su cuenta.</p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:'0.6rem', paddingTop:'0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex:1, padding:'0.65rem', fontSize:'0.82rem', fontWeight:600, color:'#555', background:'#f5f5f5', border:'none', borderRadius:12, cursor:'pointer', transition:'background 0.15s' }}
                  onMouseOver={(e) => (e.currentTarget.style.background='#ebebeb')}
                  onMouseOut={(e) => (e.currentTarget.style.background='#f5f5f5')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ flex:2, padding:'0.65rem', fontSize:'0.82rem', fontWeight:700, color:'#fff', background: actionLoading ? '#555' : '#0f0f0f', border:'none', borderRadius:12, cursor: actionLoading ? 'not-allowed':'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}
                  onMouseOver={(e) => { if (!actionLoading) e.currentTarget.style.background='#222'; }}
                  onMouseOut={(e) => { if (!actionLoading) e.currentTarget.style.background='#0f0f0f'; }}
                >
                  {actionLoading ? (
                    <>
                      <svg style={{ width:14, height:14, animation:'spin 0.7s linear infinite' }} viewBox="0 0 24 24"><circle style={{ opacity:0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path style={{ opacity:0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      Creando usuario...
                    </>
                  ) : (
                    <>
                      <svg style={{ width:14, height:14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                      Crear y Enviar OTP
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ EDIT USER MODAL ============ */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Editar Usuario</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{selectedUser.email}</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Rol</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cargo</label>
                <input
                  type="text"
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
                />
              </div>

              {/* View Permissions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Vistas del Dashboard</label>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = editForm.view_permissions.length === ALL_VIEW_KEYS.length;
                      setEditForm({ ...editForm, view_permissions: allSelected ? [] : [...ALL_VIEW_KEYS] });
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {editForm.view_permissions.length === ALL_VIEW_KEYS.length ? "Quitar todas" : "Seleccionar todas"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {VIEW_PERMISSIONS_OPTIONS.map((view) => {
                    const checked = editForm.view_permissions.includes(view.key);
                    return (
                      <label
                        key={view.key}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                          checked
                            ? "border-gray-900 bg-gray-900/5 text-gray-900"
                            : "border-gray-200 text-gray-400 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const perms = checked
                              ? editForm.view_permissions.filter((p) => p !== view.key)
                              : [...editForm.view_permissions, view.key];
                            setEditForm({ ...editForm, view_permissions: perms });
                          }}
                          className="sr-only"
                        />
                        <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          checked ? "border-gray-900 bg-gray-900" : "border-gray-300"
                        }`}>
                          {checked && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs font-medium">{view.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Usuario activo</p>
                  <p className="text-xs text-gray-400">Permite al usuario acceder a la plataforma</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${editForm.is_active ? "bg-green-500" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editForm.is_active ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {actionLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ DELETE CONFIRMATION ============ */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
                <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Eliminar Usuario</h3>
              <p className="text-sm text-gray-500 mb-6">
                ¿Estás seguro de eliminar a <span className="font-semibold text-gray-700">{selectedUser.full_name || selectedUser.email}</span>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {actionLoading ? "Eliminando..." : "Sí, Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
