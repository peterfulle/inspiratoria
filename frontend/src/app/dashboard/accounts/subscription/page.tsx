'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from "@/lib/api";

// ============================================================================
// TYPES
// ============================================================================
interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string;
  company_size: string;
  website: string;
  plan: 'enterprise' | 'growth' | 'starter' | 'trial';
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  account_type: 'core' | 'studio';
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  users: number;
  programs: number;
  onboarding_completed: boolean;
  created_at: string;
  lastActivity: string;
}

// ============================================================================
// ICONS
// ============================================================================
const Icons = {
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  program: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  check: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  clock: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pause: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  industry: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  activity: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  creditCard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
};

// ============================================================================
// SAMPLE DATA - Removed: now using real API data
// ============================================================================

const recentActivity: { text: string; time: string }[] = [];

// ============================================================================
// COMPONENT
// ============================================================================
export default function SubscriptionAccountsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'core' | 'studio'>('all');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      // Fetch core and studio companies (everything except internal)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const [coreRes, studioRes] = await Promise.all([
        apiFetch(`${API_URL}/api/companies?account_type=core`),
        apiFetch(`${API_URL}/api/companies?account_type=studio`),
      ]);
      
      let allCompanies: Company[] = [];
      
      if (coreRes.ok) {
        const coreData = await coreRes.json();
        allCompanies = [...allCompanies, ...coreData.map((c: any) => ({
          ...c,
          account_type: 'core',
          users: 0,
          programs: 0,
          lastActivity: c.created_at ? new Date(c.created_at).toLocaleDateString('es-CL') : '-',
        }))];
      }
      
      if (studioRes.ok) {
        const studioData = await studioRes.json();
        allCompanies = [...allCompanies, ...studioData.map((c: any) => ({
          ...c,
          account_type: 'studio',
          users: 0,
          programs: 0,
          lastActivity: c.created_at ? new Date(c.created_at).toLocaleDateString('es-CL') : '-',
        }))];
      }
      
      setCompanies(allCompanies);
    } catch (error) {
      console.error('Error loading subscription companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (company.industry || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (company.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'core' && company.account_type === 'core') ||
                          (statusFilter === 'studio' && company.account_type === 'studio') ||
                          company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: companies.length,
    core: companies.filter(c => c.account_type === 'core').length,
    studio: companies.filter(c => c.account_type === 'studio').length,
    active: companies.filter(c => c.status === 'active').length,
    trial: companies.filter(c => c.status === 'trial').length,
  };

  const planSummary = [
    { label: 'Enterprise', count: companies.filter(c => c.plan === 'enterprise').length },
    { label: 'Growth', count: companies.filter(c => c.plan === 'growth').length },
    { label: 'Starter', count: companies.filter(c => c.plan === 'starter').length },
  ];

  const industrySummary = Object.entries(
    companies.reduce((acc, c) => {
      const ind = c.industry || 'Sin especificar';
      acc[ind] = (acc[ind] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).slice(0, 4);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{Icons.check} Activa</span>;
      case 'trial':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{Icons.clock} Trial</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{Icons.pause} {status}</span>;
    }
  };

  const getAccountTypeBadge = (type: string) => {
    if (type === 'studio') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">Studio</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">Core</span>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      enterprise: 'bg-purple-100 text-purple-700',
      growth: 'bg-blue-100 text-blue-700',
      starter: 'bg-gray-100 text-gray-700',
      trial: 'bg-yellow-100 text-yellow-700',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[plan] || 'bg-gray-100 text-gray-700'}`}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
            {Icons.creditCard}
            Suscripción
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Cuentas de Suscripción</h1>
        <p className="text-gray-500 text-sm">Cuentas que se registran por sí mismas en la plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Cuentas</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Core</p>
          <p className="text-2xl font-bold text-green-600">{stats.core}</p>
          <p className="text-xs text-gray-500 mt-1">Auto-registro</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Studio</p>
          <p className="text-2xl font-bold text-purple-600">{stats.studio}</p>
          <p className="text-xs text-gray-500 mt-1">Consultoría</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Activas</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-xs text-gray-500 mt-1">Trial: {stats.trial}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{Icons.search}</span>
            <input
              type="text"
              placeholder="Buscar cuentas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(['all', 'active', 'trial', 'core', 'studio'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  statusFilter === filter ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter === 'all' ? 'Todas' : filter === 'active' ? 'Activas' : filter === 'trial' ? 'Trial' : filter === 'core' ? 'Core' : 'Studio'}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 italic">
            Las cuentas se registran desde /register
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        {filteredCompanies.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No hay cuentas de suscripción que mostrar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCompanies.map(company => (
              <div key={company.id} className="p-4 hover:bg-gray-50 transition flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                  company.account_type === 'studio' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
                }`}>
                  {company.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{company.name}</h3>
                    {getAccountTypeBadge(company.account_type)}
                  </div>
                  <p className="text-sm text-gray-500">
                    {company.contact_name && `${company.contact_name} • `}
                    {company.contact_email || company.website || ''} • {company.lastActivity}
                  </p>
                </div>
                {getPlanBadge(company.plan)}
                {getStatusBadge(company.status)}
                {company.industry && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    {Icons.industry}
                    <span>{company.industry}</span>
                  </div>
                )}
                <div className="flex gap-1">
                  <a href={`/dashboard/clients/${company.slug}`} className="p-2 hover:bg-gray-100 rounded-lg transition" title="Ver detalles">
                    {Icons.eye}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {Icons.industry}
            Por Industria
          </h3>
          <div className="space-y-3">
            {industrySummary.map(([industry, count]) => (
              <div key={industry} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{industry}</span>
                <span className="text-sm font-semibold text-gray-900">{count} cuentas</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {Icons.program}
            Por Plan
          </h3>
          <div className="space-y-3">
            {planSummary.map(plan => (
              <div key={plan.label} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{plan.label}</span>
                <span className="text-sm font-semibold text-gray-900">{plan.count} cuentas</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {Icons.activity}
            Por Tipo de Registro
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Core (Auto-registro)
              </span>
              <span className="text-sm font-semibold text-gray-900">{stats.core} cuentas</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Studio (Consultoría)
              </span>
              <span className="text-sm font-semibold text-gray-900">{stats.studio} cuentas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
