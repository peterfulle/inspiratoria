'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

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
  status: 'active' | 'trial' | 'suspended' | 'cancelled' | 'inactive';
  account_type: string;
  users: number;
  programs: number;
  onboarding_completed: boolean;
  created_at: string;
  lastActivity: string;
  type: 'internal';
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
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
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
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  internal: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

// ============================================================================
// SAMPLE DATA - Cuentas Internas (gestionadas por Inspiratoria)
// ============================================================================
const sampleInternalCompanies: Company[] = [];

// ============================================================================
// COMPONENT
// ============================================================================
export default function InternalAccountsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: '',
    company_size: '10-50',
    website: '',
    plan: 'starter' as const,
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/companies?account_type=internal`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        const transformed = data.map((c: any) => ({
          ...c,
          users: 0,
          programs: 0,
          lastActivity: c.created_at ? new Date(c.created_at).toLocaleDateString('es-CL') : '-',
          type: 'internal',
        }));
        setCompanies(transformed);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error loading internal companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name.trim()) {
      alert('El nombre de la cuenta es requerido');
      return;
    }
    
    setCreating(true);
    try {
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/companies/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompany.name,
          industry: newCompany.industry,
          company_size: newCompany.company_size,
          website: newCompany.website,
          account_type: 'internal',
        }),
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setNewCompany({ name: '', industry: '', company_size: '10-50', website: '', plan: 'starter' });
        alert('Cuenta interna creada exitosamente');
        loadCompanies();
      } else {
        alert('Error al crear la cuenta');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Error de conexión al crear la cuenta');
    } finally {
      setCreating(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    trial: companies.filter(c => c.status === 'trial').length,
    users: companies.reduce((sum, c) => sum + c.users, 0),
  };

  const getStatusBadge = (status: Company['status']) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{Icons.check} Activa</span>;
      case 'trial':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{Icons.clock} Trial</span>;
      case 'inactive':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{Icons.pause} Inactiva</span>;
    }
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
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Internas</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Cuentas Internas</h1>
        <p className="text-gray-500 text-sm">Cuentas gestionadas directamente por Inspiratoria</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Cuentas</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Activas</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">En Prueba</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.trial}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Usuarios</p>
          <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
        </div>
      </div>

      {/* Filters & Actions */}
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
            {(['all', 'active', 'trial', 'inactive'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  statusFilter === status ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status === 'all' ? 'Todas' : status === 'active' ? 'Activas' : status === 'trial' ? 'Trial' : 'Inactivas'}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            {Icons.plus}
            Nueva Cuenta Interna
          </button>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredCompanies.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>No hay cuentas internas que mostrar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCompanies.map(company => (
              <div key={company.id} className="p-4 hover:bg-gray-50 transition flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {company.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{company.name}</h3>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-medium rounded">INTERNA</span>
                  </div>
                  <p className="text-sm text-gray-500">{company.website} • {company.lastActivity}</p>
                </div>
                {getStatusBadge(company.status)}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  {Icons.users}
                  <span>{company.users} usuarios</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  {Icons.program}
                  <span>{company.programs} programas</span>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Ver">
                    {Icons.eye}
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Editar">
                    {Icons.edit}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Cuenta Interna</h2>
            <p className="text-sm text-gray-500 mb-6">Las cuentas internas son gestionadas directamente por Inspiratoria.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="Ej: Programa Gobierno 2026"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industria</label>
                <input
                  type="text"
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                  placeholder="Ej: Gobierno, Educación"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
                <select
                  value={newCompany.company_size}
                  onChange={(e) => setNewCompany({ ...newCompany, company_size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="1-10">1-10 usuarios</option>
                  <option value="10-50">10-50 usuarios</option>
                  <option value="50-100">50-100 usuarios</option>
                  <option value="100-500">100-500 usuarios</option>
                  <option value="500+">500+ usuarios</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
                <input
                  type="text"
                  value={newCompany.website}
                  onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                  placeholder="Ej: programa.gob.cl"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  value={newCompany.plan}
                  onChange={(e) => setNewCompany({ ...newCompany, plan: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCompany}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear Cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
