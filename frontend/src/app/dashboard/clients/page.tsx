"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface Company {
  id: string;
  name: string;
  slug: string;
  corp_id?: string;
  industry: string;
  company_size: string;
  website: string;
  plan: string;
  status: string;
  is_data_complete: boolean;
  is_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

export default function ClientsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    company_size: "",
    website: "",
    plan: "trial",
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/companies`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ name: "", industry: "", company_size: "", website: "", plan: "trial" });
        loadCompanies();
      }
    } catch (error) {
      console.error("Error creating company:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "trial": return "bg-blue-100 text-blue-800 border-blue-200";
      case "suspended": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPlanBadge = (plan: string) => {
    const plans = {
      enterprise: { label: "Enterprise", color: "bg-purple-100 text-purple-800 border-purple-200" },
      growth: { label: "Growth", color: "bg-blue-100 text-blue-800 border-blue-200" },
      startup: { label: "Startup", color: "bg-green-100 text-green-800 border-green-200" },
      trial: { label: "Trial", color: "bg-gray-100 text-gray-800 border-gray-200" },
    };
    const planInfo = plans[plan as keyof typeof plans] || plans.trial;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${planInfo.color}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
        </svg>
        {planInfo.label}
      </span>
    );
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.corp_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "complete" && company.is_data_complete) ||
                         (statusFilter === "incomplete" && !company.is_data_complete) ||
                         (statusFilter === "enabled" && company.is_enabled) ||
                         (statusFilter === "disabled" && !company.is_enabled);
    
    const matchesIndustry = industryFilter === "all" || 
                           company.industry.toLowerCase() === industryFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administración de Cuentas</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-black px-6 py-3 rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Crear Nueva Cuenta</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Clientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{companies.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Datos Incompletos</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {companies.filter(c => !c.is_data_complete).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Avanzados */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Filtros de Búsqueda</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Buscador */}
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Buscar por nombre, ID o slug
            </label>
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro de Estado */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Estado
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="all">Todos los estados</option>
                <option value="complete">Datos completos</option>
                <option value="incomplete">Datos incompletos</option>
                <option value="enabled">Habilitados</option>
                <option value="disabled">No habilitados</option>
              </select>
              {/* Icono SVG dentro del select */}
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {statusFilter === 'all' && (
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
                {statusFilter === 'complete' && (
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {statusFilter === 'incomplete' && (
                  <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                {statusFilter === 'enabled' && (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                )}
                {statusFilter === 'disabled' && (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filtro de Industria */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Industria
            </label>
            <div className="relative">
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="all">Todas las industrias</option>
                <option value="Alimentos y Bebidas">Alimentos y Bebidas</option>
                <option value="Banca y Seguros">Banca y Seguros</option>
                <option value="Construcción e Infraestructura">Construcción e Infraestructura</option>
                <option value="Educación">Educación</option>
                <option value="Energía">Energía</option>
                <option value="Minería">Minería</option>
                <option value="Retail y Comercio">Retail y Comercio</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Telecomunicaciones">Telecomunicaciones</option>
                <option value="Transporte y Logística">Transporte y Logística</option>
                <option value="Otros Servicios">Otros Servicios</option>
              </select>
              {/* Icono de industria */}
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados y Limpiar */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-bold text-gray-900">{filteredCompanies.length}</span> de{" "}
            <span className="font-bold text-gray-900">{companies.length}</span> clientes
          </p>
          {(searchTerm || statusFilter !== "all" || industryFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setIndustryFilter("all");
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-semibold hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  ID CORP
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Website
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Setup
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className={`hover:bg-gray-50 transition-colors ${!company.is_data_complete ? 'bg-yellow-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-gray-900">{company.name}</p>
                      <p className="text-sm text-gray-500">{company.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="text-sm font-mono font-semibold text-gray-900">{company.corp_id || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {company.website ? (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        {company.website.replace(/^https?:\/\//, '').substring(0, 25)}...
                      </a>
                    ) : (
                      <span className="text-red-500 font-bold text-sm">
                        <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                        {' '}Falta
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getPlanBadge(company.plan)}
                  </td>
                  <td className="px-6 py-4">
                    {company.is_enabled ? (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-green-700 font-bold text-sm">HABILITADO</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-red-700 font-bold text-sm">NO HABILITADO</span>
                      </div>
                    )}
                    {!company.is_data_complete && (
                      <p className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                        Completar datos requeridos
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {!company.is_data_complete ? (
                        <button className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border-2 border-yellow-300 rounded-lg font-bold hover:bg-yellow-100 transition-all text-sm">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          Completar Datos
                        </button>
                      ) : (
                        <button
                          onClick={() => window.open(`/dashboard/clients/${company.id}/manage`, '_blank')}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-black rounded-lg font-bold hover:bg-primary-600 transition-all text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Administrar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Crear Nueva Cuenta</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete la información básica de la cuenta empresarial
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCompany} className="p-8 space-y-6">
              {/* Nombre de la Empresa */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:bg-white focus:outline-none transition-all"
                  placeholder="Ej: SQM, Clínica Las Condes, IDEAL"
                />
              </div>

              {/* Grid de 2 columnas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Industria <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="">Seleccionar industria</option>
                    <option value="Alimentos y Bebidas">Alimentos y Bebidas</option>
                    <option value="Banca y Seguros">Banca y Seguros</option>
                    <option value="Construcción e Infraestructura">Construcción e Infraestructura</option>
                    <option value="Educación">Educación</option>
                    <option value="Energía">Energía</option>
                    <option value="Minería">Minería</option>
                    <option value="Retail y Comercio">Retail y Comercio</option>
                    <option value="Tecnología">Tecnología</option>
                    <option value="Telecomunicaciones">Telecomunicaciones</option>
                    <option value="Transporte y Logística">Transporte y Logística</option>
                    <option value="Otros Servicios">Otros Servicios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tamaño <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.company_size}
                    onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="">Seleccionar tamaño</option>
                    <option value="1-10">1-10 empleados</option>
                    <option value="11-50">11-50 empleados</option>
                    <option value="51-200">51-200 empleados</option>
                    <option value="201-1000">201-1000 empleados</option>
                    <option value="1000+">1000+ empleados</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sitio Web <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:bg-white focus:outline-none transition-all"
                  placeholder="https://www.ejemplo.cl"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Plan</label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:bg-white focus:outline-none transition-all"
                >
                  <option value="trial">Trial - Prueba gratuita</option>
                  <option value="startup">Startup - Plan inicial</option>
                  <option value="growth">Growth - Plan crecimiento</option>
                  <option value="enterprise">Enterprise - Plan empresarial</option>
                </select>
              </div>
              
              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-900 mb-2">Información importante</p>
                    <ul className="text-sm text-blue-800 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Todos los campos marcados con <span className="text-red-600 font-semibold">*</span> son obligatorios</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>La cuenta se habilitará automáticamente al crearla</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Podrás completar información adicional después</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-black rounded-lg font-bold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/20"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
