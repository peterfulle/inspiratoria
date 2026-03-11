'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ─── SVG Icons ───
const IconArrowLeft = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconTrash = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);
const IconCheck = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
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
const IconUser = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconBriefcase = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
);
const IconFileText = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconSparkles = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.962 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.582a.5.5 0 010 .962L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.962 0z" />
  </svg>
);
const IconBolt = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
const IconX = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconKey = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

interface Solicitud {
  id: string;
  name: string;
  account_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_position: string;
  description: string;
  plan: string;
  created_at: string;
}

interface CreateAccountModal {
  open: boolean;
  solicitud: Solicitud | null;
  adminName: string;
  adminEmail: string;
  adminPosition: string;
  loading: boolean;
  success: boolean;
  result: any;
  error: string;
}

export default function SolicitudesPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<CreateAccountModal>({
    open: false,
    solicitud: null,
    adminName: '',
    adminEmail: '',
    adminPosition: 'Administrador de Programa',
    loading: false,
    success: false,
    result: null,
    error: '',
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  const fetchSolicitudes = async () => {
    try {
      const response = await fetch(`${API}/api/companies/solicitudes`);
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSolicitudes(); }, []);

  // Open the create account modal
  const openCreateModal = (s: Solicitud) => {
    setModal({
      open: true,
      solicitud: s,
      adminName: s.contact_name || '',
      adminEmail: s.contact_email || '',
      adminPosition: s.contact_position || 'Administrador de Programa',
      loading: false,
      success: false,
      result: null,
      error: '',
    });
  };

  const closeModal = () => {
    if (modal.success) {
      // Refresh list after successful creation
      setSolicitudes(prev => prev.filter(s => s.id !== modal.solicitud?.id));
    }
    setModal(prev => ({ ...prev, open: false, success: false, result: null, error: '' }));
  };

  const handleCreateAccount = async () => {
    if (!modal.solicitud) return;
    if (!modal.adminName.trim() || !modal.adminEmail.trim()) {
      setModal(prev => ({ ...prev, error: 'Nombre y email son obligatorios' }));
      return;
    }

    setModal(prev => ({ ...prev, loading: true, error: '' }));

    try {
      // 1. Create account in backend
      const res = await fetch(`${API}/api/companies/solicitudes/${modal.solicitud.id}/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_name: modal.adminName,
          admin_email: modal.adminEmail,
          admin_position: modal.adminPosition,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al crear cuenta');
      }

      const accountData = await res.json();

      // 2. Send credentials email
      const baseUrl = window.location.origin;
      await fetch('/api/studio-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_name: modal.adminName,
          admin_email: modal.adminEmail,
          company_name: modal.solicitud.name,
          generated_password: accountData.generated_password,
          access_hash: accountData.access_hash,
          corp_id: accountData.corp_id || '',
          plan: accountData.plan || 'trial',
          login_url: `${baseUrl}/login`,
          dashboard_url: `${baseUrl}/studio/dashboard`,
        }),
      });

      setModal(prev => ({
        ...prev,
        loading: false,
        success: true,
        result: accountData,
      }));

    } catch (error: any) {
      setModal(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al crear la cuenta',
      }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/api/companies/solicitudes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSolicitudes(prev => prev.filter(s => s.id !== id));
        setExpandedId(null);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (hours < 1) return 'Hace unos minutos';
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">

        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => router.push('/dashboard/accounts')}
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-900 transition-colors mb-6"
          >
            <IconArrowLeft className="w-4 h-4" />
            Cuentas
          </button>
          <h1 className="text-[28px] sm:text-[32px] font-semibold text-gray-900 tracking-[-0.02em]">
            Solicitudes
          </h1>
          <p className="text-[15px] text-gray-400 mt-1 font-light">
            {solicitudes.length} solicitudes pendientes de revisión
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && solicitudes.length === 0 && (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <IconCheck className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-[15px] text-gray-400 mb-1">Sin solicitudes pendientes</p>
            <p className="text-[13px] text-gray-300">Las nuevas solicitudes aparecerán aquí</p>
          </div>
        )}

        {/* Solicitudes List */}
        {!loading && solicitudes.length > 0 && (
          <div className="space-y-3">
            {solicitudes.map((s) => {
              const isExpanded = expandedId === s.id;
              const isStudio = s.account_type === 'studio';
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-shadow hover:shadow-sm">
                  {/* Row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="w-full px-5 py-4 sm:px-6 sm:py-5 flex items-center gap-4 text-left"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isStudio ? 'bg-gray-900 text-[#FFD902]' : 'bg-gray-900 text-[#FFD902]'
                    }`}>
                      {isStudio ? <IconSparkles className="w-4 h-4" /> : <IconBolt className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-[14px] font-semibold text-gray-900 truncate">{s.name}</h3>
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${
                          isStudio
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {isStudio ? 'Studio' : 'Core'}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-400 truncate">
                        {s.contact_name} · {s.contact_email}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-300 shrink-0 hidden sm:block">
                      {formatDate(s.created_at)}
                    </span>
                    <svg className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 border-t border-gray-50">
                      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">

                        <div className="flex items-start gap-2.5">
                          <IconUser className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-300 uppercase tracking-wider mb-0.5">Contacto</p>
                            <p className="text-[13px] text-gray-700">{s.contact_name || '—'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <IconBriefcase className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-300 uppercase tracking-wider mb-0.5">Cargo</p>
                            <p className="text-[13px] text-gray-700">{s.contact_position || '—'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <IconMail className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-300 uppercase tracking-wider mb-0.5">Email</p>
                            <p className="text-[13px] text-gray-700">{s.contact_email || '—'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <IconPhone className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] text-gray-300 uppercase tracking-wider mb-0.5">WhatsApp</p>
                            <p className="text-[13px] text-gray-700">{s.contact_phone || '—'}</p>
                          </div>
                        </div>

                        {s.description && (
                          <div className="sm:col-span-2 flex items-start gap-2.5">
                            <IconFileText className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[11px] text-gray-300 uppercase tracking-wider mb-0.5">Descripción del proyecto</p>
                              <p className="text-[13px] text-gray-600 leading-relaxed">{s.description}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                        <button
                          onClick={() => openCreateModal(s)}
                          disabled={actionLoading === s.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          <IconKey className="w-3.5 h-3.5" />
                          Crear cuenta
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/accounts/${s.id}`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-gray-600 text-[13px] font-medium rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <IconFileText className="w-3.5 h-3.5" />
                          Gestionar
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={actionLoading === s.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-red-500 text-[13px] font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                        <span className="text-[11px] text-gray-300 ml-auto hidden sm:block">
                          {formatDate(s.created_at)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ─── CREATE ACCOUNT MODAL ─── */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
                  <IconKey className="w-5 h-5 text-[#FFD902]" />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-gray-900">Crear cuenta Studio</h2>
                  <p className="text-[12px] text-gray-400">{modal.solicitud?.name}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {!modal.success ? (
              <div className="px-6 py-5">
                <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
                  Se creará un usuario administrador para esta empresa. Las credenciales se enviarán automáticamente por email.
                </p>

                {/* Solicitud Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2 font-medium">Datos de la solicitud</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Empresa</span>
                      <span className="text-gray-900 font-medium">{modal.solicitud?.name}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Contacto</span>
                      <span className="text-gray-700">{modal.solicitud?.contact_name}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Email</span>
                      <span className="text-gray-700">{modal.solicitud?.contact_email}</span>
                    </div>
                    {modal.solicitud?.contact_phone && (
                      <div className="flex justify-between text-[13px]">
                        <span className="text-gray-400">WhatsApp</span>
                        <span className="text-gray-700">{modal.solicitud.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">Nombre del administrador</label>
                    <input
                      type="text"
                      value={modal.adminName}
                      onChange={e => setModal(prev => ({ ...prev, adminName: e.target.value, error: '' }))}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">Email de acceso</label>
                    <input
                      type="email"
                      value={modal.adminEmail}
                      onChange={e => setModal(prev => ({ ...prev, adminEmail: e.target.value, error: '' }))}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
                      placeholder="admin@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-1.5 font-medium">Cargo</label>
                    <input
                      type="text"
                      value={modal.adminPosition}
                      onChange={e => setModal(prev => ({ ...prev, adminPosition: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
                      placeholder="Administrador de Programa"
                    />
                  </div>
                </div>

                {/* Info Note */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-[12px] text-gray-400 leading-relaxed">
                    Se generará una contraseña aleatoria segura. El administrador recibirá un email con sus credenciales, hash de acceso y enlace al dashboard Studio.
                  </p>
                </div>

                {/* Error */}
                {modal.error && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-[12px] text-red-600">{modal.error}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Success State */
              <div className="px-6 py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-4">
                  <IconCheck className="w-7 h-7 text-[#FFD902]" />
                </div>
                <h3 className="text-[18px] font-semibold text-gray-900 mb-2">Cuenta creada exitosamente</h3>
                <p className="text-[13px] text-gray-400 mb-6">Las credenciales han sido enviadas a {modal.adminEmail}</p>

                <div className="bg-gray-50 rounded-xl p-4 text-left mb-4">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-3 font-medium">Datos de la cuenta</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">ID Corporativo</span>
                      <span className="text-gray-900 font-mono font-medium">{modal.result?.corp_id}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Hash de acceso</span>
                      <span className="text-gray-700 font-mono text-[11px]">{modal.result?.access_hash}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Email</span>
                      <span className="text-gray-700">{modal.result?.generated_email}</span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Estado</span>
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                        Activa
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-400">Dashboard</span>
                      <span className="text-gray-700 font-mono text-[11px]">/studio/dashboard</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              {!modal.success ? (
                <>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateAccount}
                    disabled={modal.loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {modal.loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <IconKey className="w-4 h-4" />
                        Crear cuenta y enviar credenciales
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
