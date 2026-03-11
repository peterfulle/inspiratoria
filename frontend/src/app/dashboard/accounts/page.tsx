'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ─── SVG Icons ───
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
const IconInbox = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
  </svg>
);
const IconArrow = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IconUsers = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const IconBuilding = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
  </svg>
);
const IconSearch = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconCalendar = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconMail = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
  </svg>
);
const IconChevronRight = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconPlus = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

interface Stats {
  total_companies: number;
  core: number;
  studio: number;
  pending: number;
  total_users: number;
}

interface CompanyItem {
  id: string;
  name: string;
  account_type: string;
  status: string;
  plan: string;
  contact_name: string;
  contact_email: string;
  created_at: string;
}

export default function AccountsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ total_companies: 0, core: 0, studio: 0, pending: 0, total_users: 0 });
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'core' | 'studio'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('date');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const searchRef = useRef<HTMLInputElement>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, companiesRes] = await Promise.all([
          fetch(`${API}/api/companies/stats`),
          fetch(`${API}/api/companies/`),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (companiesRes.ok) {
          const all = await companiesRes.json();
          setCompanies(all.filter((c: CompanyItem) => c.status !== 'pending'));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Keyboard shortcut: Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredCompanies = companies
    .filter(c => {
      if (filter === 'all') return true;
      return c.account_type === filter;
    })
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.contact_email?.toLowerCase().includes(q) || c.contact_name?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const statusConfig = (s: string) => {
    const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
      active: { label: 'Activa', bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-900' },
      trial: { label: 'Trial', bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
      suspended: { label: 'Suspendida', bg: 'bg-gray-50', text: 'text-gray-400', dot: 'bg-gray-300' },
      cancelled: { label: 'Cancelada', bg: 'bg-gray-50', text: 'text-gray-400', dot: 'bg-gray-200' },
    };
    return map[s] || { label: s, bg: 'bg-gray-50', text: 'text-gray-400', dot: 'bg-gray-300' };
  };

  const planLabel = (p: string) => {
    const map: Record<string, string> = { trial: 'Trial', starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' };
    return map[p] || p || '—';
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
    if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
    return `hace ${Math.floor(diffDays / 365)} años`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Cargando cuentas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 sm:py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[28px] sm:text-[32px] font-semibold text-gray-900 tracking-[-0.02em]">
                Cuentas
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 tabular-nums">
                {stats.total_companies}
              </span>
            </div>
            <p className="text-[14px] text-gray-400 font-light">
              Gestión de clientes y suscripciones
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/register')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              <IconPlus className="w-4 h-4" />
              Nueva cuenta
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: IconBuilding, label: 'Total Cuentas', value: stats.total_companies, sub: 'activas' },
            { icon: IconBolt, label: 'Core', value: stats.core, sub: 'autogestión' },
            { icon: IconSparkles, label: 'Studio', value: stats.studio, sub: 'full service' },
            { icon: IconUsers, label: 'Usuarios', value: stats.total_users, sub: 'registrados' },
          ].map((kpi, idx) => (
            <div key={idx} className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <kpi.icon className="w-[17px] h-[17px] text-gray-500" />
                </div>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{kpi.label}</span>
              </div>
              <p className="text-[36px] font-extralight text-gray-900 leading-none tabular-nums tracking-tight">{kpi.value}</p>
              <p className="text-[12px] text-gray-300 mt-1.5 font-light">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Solicitudes Banner */}
        {stats.pending > 0 && (
          <button
            onClick={() => router.push('/dashboard/accounts/solicitudes')}
            className="group w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm hover:border-gray-300 transition-all duration-200 mb-6"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white shrink-0">
                <IconInbox className="w-[18px] h-[18px]" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                {stats.pending}
              </div>
            </div>
            <div className="flex-1 text-left min-w-0">
              <h3 className="text-[14px] font-medium text-gray-900">
                {stats.pending} {stats.pending === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}
              </h3>
              <p className="text-[13px] text-gray-400">
                Nuevas solicitudes Studio requieren tu aprobación
              </p>
            </div>
            <div className="flex items-center gap-1 text-gray-400 group-hover:text-gray-600 transition-colors">
              <span className="text-[13px] font-medium hidden sm:inline">Revisar</span>
              <IconArrow className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        )}

        {/* Toolbar: Search + Filters + View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empresa, contacto..."
              className="w-full pl-10 pr-16 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder-gray-300 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded font-mono">
              ⌘K
            </kbd>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1">
            {[
              { key: 'all' as const, label: 'Todas' },
              { key: 'core' as const, label: 'Core' },
              { key: 'studio' as const, label: 'Studio' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3.5 py-1.5 text-[12px] font-medium rounded-lg transition-all ${
                  filter === tab.key
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'name' | 'date' | 'status')}
            className="px-3 py-2.5 bg-white border border-gray-100 rounded-xl text-[12px] text-gray-500 focus:outline-none cursor-pointer"
          >
            <option value="date">Más recientes</option>
            <option value="name">Nombre A-Z</option>
            <option value="status">Estado</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-gray-100 text-gray-700' : 'text-gray-300 hover:text-gray-500'}`}
              title="Vista tabla"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-gray-100 text-gray-700' : 'text-gray-300 hover:text-gray-500'}`}
              title="Vista tarjetas"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><rect x="3" y="3" width="18" height="7" rx="1" /><rect x="3" y="14" width="18" height="7" rx="1" /></svg>
            </button>
          </div>

          {/* Solicitudes link when no pending */}
          {stats.pending === 0 && (
            <button
              onClick={() => router.push('/dashboard/accounts/solicitudes')}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-[12px] text-gray-400 hover:text-gray-600 border border-gray-100 rounded-xl bg-white hover:bg-gray-50 transition-all"
            >
              <IconInbox className="w-3.5 h-3.5" />
              Solicitudes
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] text-gray-400">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? 'resultado' : 'resultados'}
            {search && <span> para &ldquo;{search}&rdquo;</span>}
          </p>
        </div>

        {/* ─── TABLE VIEW ─── */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-wider font-medium bg-gray-50/50">
              <div className="col-span-4 sm:col-span-4">Empresa</div>
              <div className="col-span-2 hidden sm:block">Tipo</div>
              <div className="col-span-2 hidden sm:block">Plan</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2 text-right">Fecha</div>
            </div>

            {/* Table Rows */}
            {filteredCompanies.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <IconSearch className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-[14px] text-gray-400 font-medium mb-1">Sin resultados</p>
                <p className="text-[13px] text-gray-300">
                  {search ? 'Intenta con otro término de búsqueda' : 'No hay cuentas en esta categoría'}
                </p>
              </div>
            ) : (
              filteredCompanies.map((c, idx) => {
                const st = statusConfig(c.status);
                const isStudio = c.account_type === 'studio';
                return (
                  <button
                    key={c.id}
                    onClick={() => router.push(`/dashboard/accounts/${c.id}`)}
                    className={`w-full grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-all text-left group ${
                      idx % 2 === 0 ? '' : 'bg-gray-50/20'
                    }`}
                  >
                    {/* Company */}
                    <div className="col-span-4 sm:col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-semibold bg-gray-100 text-gray-600">
                        {getInitials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-gray-900 truncate group-hover:text-gray-700 transition-colors">{c.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {c.contact_email && <IconMail className="w-3 h-3 text-gray-300 shrink-0" />}
                          <p className="text-[12px] text-gray-400 truncate">{c.contact_email || c.contact_name || '—'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Type */}
                    <div className="col-span-2 hidden sm:flex items-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider rounded-lg bg-gray-100 text-gray-500">
                        {isStudio ? 'Studio' : 'Core'}
                      </span>
                    </div>

                    {/* Plan */}
                    <div className="col-span-2 hidden sm:block">
                      <span className="text-[13px] text-gray-500">{planLabel(c.plan)}</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-gray-50 text-gray-500">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className="text-[12px] text-gray-400" title={new Date(c.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}>
                        {timeAgo(c.created_at)}
                      </span>
                      <IconChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* ─── CARDS VIEW ─── */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 px-6 py-20 text-center bg-white rounded-2xl border border-gray-100">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <IconSearch className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-[14px] text-gray-400 font-medium mb-1">Sin resultados</p>
                <p className="text-[13px] text-gray-300">
                  {search ? 'Intenta con otro término de búsqueda' : 'No hay cuentas en esta categoría'}
                </p>
              </div>
            ) : (
              filteredCompanies.map((c) => {
                const st = statusConfig(c.status);
                const isStudio = c.account_type === 'studio';
                return (
                  <button
                    key={c.id}
                    onClick={() => router.push(`/dashboard/accounts/${c.id}`)}
                    className="group bg-white rounded-2xl border border-gray-100 p-5 text-left hover:border-gray-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[14px] font-semibold bg-gray-100 text-gray-600">
                        {getInitials(c.name)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-md bg-gray-100 text-gray-500">
                          {isStudio ? 'Studio' : 'Core'}
                        </span>
                        <IconChevronRight className="w-4 h-4 text-gray-200 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>

                    <h3 className="text-[15px] font-semibold text-gray-900 mb-1 truncate group-hover:text-gray-700">{c.name}</h3>

                    {c.contact_email && (
                      <div className="flex items-center gap-1.5 mb-4">
                        <IconMail className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <p className="text-[12px] text-gray-400 truncate">{c.contact_email}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-md bg-gray-50 text-gray-500">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <IconCalendar className="w-3 h-3" />
                        <span className="text-[11px]">{timeAgo(c.created_at)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-12">
          <div className="h-px w-8 bg-gray-200" />
          <p className="text-[11px] text-gray-300 tracking-wide">
            Inspiratoria · Panel de administración
          </p>
          <div className="h-px w-8 bg-gray-200" />
        </div>

      </div>
    </div>
  );
}
