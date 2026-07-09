"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string;
  company_size: string;
  website: string;
  legal_name?: string;
  rut?: string;
  tax_id?: string;
  legal_address?: string;
  city?: string;
  region?: string;
  country?: string;
  postal_code?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_position?: string;
  business_type?: string;
  foundation_year?: number;
  description?: string;
  plan: string;
  status: string;
  is_data_complete: boolean;
  is_enabled: boolean;
  primary_color: string;
  secondary_color: string;
  max_users: number;
  max_programs: number;
  max_participants: number;
  onboarding_completed: boolean;
  created_at: string;
}

const getCompanyInitials = (name: string): string => {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const getCompanyGradient = (name: string): string => {
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-purple-500 to-pink-600",
    "from-cyan-500 to-blue-600",
    "from-rose-500 to-orange-600",
  ];
  return gradients[name.charCodeAt(0) % gradients.length];
};

export default function ClientManagePage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (companyId) loadCompanyData();
  }, [companyId]);

  const loadCompanyData = async () => {
    try {
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      }
    } catch (error) {
      console.error("Error loading company:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (section: string, initialData: any) => {
    setEditingSection(section);
    setEditFormData(initialData);
  };

  const handleSave = async () => {
    if (!company) return;
    setIsSaving(true);
    try {
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      if (response.ok) {
        const updatedCompany = await response.json();
        setCompany(updatedCompany);
        setEditingSection(null);
        setEditFormData({});
        loadCompanyData();
      } else {
        alert("Error al actualizar los datos");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar los datos");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchRUT = async (rut: string | undefined) => {
    if (!rut) {
      alert("Por favor ingresa un RUT válido");
      return;
    }
    const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '');
    setIsSaving(true);
    try {
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/companies/search-rut?rut=${cleanRUT}`);
      if (response.ok) {
        const data = await response.json();
        setEditFormData({
          ...editFormData,
          legal_name: data.razon_social || editFormData.legal_name,
          rut: data.rut || editFormData.rut,
          tax_id: data.rut || editFormData.tax_id,
          business_type: data.tipo_empresa || editFormData.business_type,
          legal_address: data.direccion || editFormData.legal_address,
          city: data.ciudad || editFormData.city,
          region: data.region || editFormData.region,
        });
        alert(`✅ Datos encontrados para: ${data.razon_social}`);
      } else {
        alert("No se encontraron datos para este RUT. Puedes ingresarlos manualmente.");
      }
    } catch (error) {
      console.error("Error buscando RUT:", error);
      alert("Error al buscar datos del RUT.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 font-medium">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg text-red-600 font-bold">Cliente no encontrado</p>
        </div>
      </div>
    );
  }

  const initials = getCompanyInitials(company.name);
  const gradient = getCompanyGradient(company.name);
  
  return (
    <div className="space-y-8 pb-20">
      {/* Header estilo dashboard */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-primary-500/30`}>
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-sm text-gray-500">{company.industry} • {company.company_size} empleados</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${company.is_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${company.is_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {company.is_enabled ? 'Activo' : 'Inactivo'}
          </div>
        </div>
      </div>

      {/* Stats Cards estilo dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Plan */}
        <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5 capitalize">{company.plan}</p>
            </div>
          </div>
        </div>

        {/* Usuarios */}
        <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Usuarios Máx</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{company.max_users}</p>
            </div>
          </div>
        </div>

        {/* Programas */}
        <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-green-200 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Programas Máx</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{company.max_programs}</p>
            </div>
          </div>
        </div>

        {/* Participantes */}
        <div className="group relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Participantes</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{company.max_participants}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido en tarjetas estilo dashboard */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Información del Cliente</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda */}
            <div className="space-y-8">
              {/* Datos Básicos */}
              <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Datos Básicos</h3>
                  </div>
                  <button onClick={() => handleEdit('basicos', { name: company.name, industry: company.industry, company_size: company.company_size, website: company.website })} className="p-2 hover:bg-gray-50 rounded-lg transition-all group">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <DataField 
                    label="Nombre Comercial" 
                    value={company.name} 
                    required={true} 
                    section="basicos" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                  />
                  <DataField 
                    label="Industria" 
                    value={company.industry} 
                    required={true} 
                    section="basicos" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                  />
                  <DataField 
                    label="Tamaño" 
                    value={company.company_size ? `${company.company_size} empleados` : undefined} 
                    required={true}
                    section="basicos" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                  />
                  <DataField 
                    label="Sitio Web" 
                    value={company.website} 
                    link 
                    required={true}
                    section="basicos" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}
                  />
                </div>
              </div>

              {/* Personalidad Jurídica */}
              <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Personalidad Jurídica</h3>
                  </div>
                  <button onClick={() => handleEdit('juridica', { legal_name: company.legal_name, rut: company.rut, tax_id: company.tax_id, business_type: company.business_type, foundation_year: company.foundation_year })} className="p-2 hover:bg-gray-50 rounded-lg transition-all group">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <DataField 
                    label="Razón Social" 
                    value={company.legal_name} 
                    section="juridica" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  />
                  <DataField 
                    label="RUT" 
                    value={company.rut} 
                    monospace 
                    section="juridica" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>}
                  />
                  <DataField 
                    label="Tax ID" 
                    value={company.tax_id} 
                    monospace 
                    section="juridica" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  />
                  <DataField 
                    label="Tipo de Negocio" 
                    value={company.business_type} 
                    section="juridica" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                  />
                  <DataField 
                    label="Año de Fundación" 
                    value={company.foundation_year?.toString()} 
                    section="juridica" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-8">
              {/* Contacto Principal */}
              <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Contacto Principal</h3>
                  </div>
                  <button onClick={() => handleEdit('contacto', { contact_name: company.contact_name, contact_position: company.contact_position, contact_email: company.contact_email, contact_phone: company.contact_phone })} className="p-2 hover:bg-gray-50 rounded-lg transition-all group">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <DataField 
                    label="Nombre Completo" 
                    value={company.contact_name} 
                    required={true}
                    section="contacto" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  />
                  <DataField 
                    label="Cargo" 
                    value={company.contact_position} 
                    required={true}
                    section="contacto" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v6.5m0 0V17a2 2 0 01-2 2H6a2 2 0 01-2-2v-4.5m8 0a5 5 0 11-8 0v6.5a3 3 0 106 0z" /></svg>}
                  />
                  <DataField 
                    label="Email" 
                    value={company.contact_email} 
                    link 
                    required={true}
                    section="contacto" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                  />
                  <DataField 
                    label="Teléfono" 
                    value={company.contact_phone} 
                    required={true}
                    section="contacto" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                  />
                </div>
              </div>

              {/* Dirección Legal */}
              <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Dirección Legal</h3>
                  </div>
                  <button onClick={() => handleEdit('direccion', { legal_address: company.legal_address, city: company.city, region: company.region, country: company.country, postal_code: company.postal_code })} className="p-2 hover:bg-gray-50 rounded-lg transition-all group">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <DataField 
                    label="Dirección" 
                    value={company.legal_address} 
                    multiline 
                    section="direccion" 
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <DataField 
                      label="Ciudad" 
                      value={company.city} 
                      section="direccion" 
                      icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    />
                    <DataField 
                      label="Región" 
                      value={company.region} 
                      section="direccion" 
                      icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DataField 
                      label="País" 
                      value={company.country} 
                      section="direccion" 
                      icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <DataField 
                      label="Código Postal" 
                      value={company.postal_code} 
                      section="direccion" 
                      icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {editingSection && (
        <EditModal
          section={editingSection}
          formData={editFormData}
          isSaving={isSaving}
          onClose={() => setEditingSection(null)}
          onSave={handleSave}
          onFormChange={setEditFormData}
          onSearchRUT={handleSearchRUT}
        />
      )}
    </div>
  );
}

function DataField({ label, value, link, monospace, multiline, required = false, section = '', icon }: any) {
  // Solo mostrar como obligatorio si required=true Y está en sección básicos o contacto
  const showRequired = required && (section === 'basicos' || section === 'contacto');
  
  return (
    <div className="py-2">
      <label className="text-sm font-medium text-gray-600">
        {label}{showRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1">
        {!value ? (
          <p className="text-sm text-gray-400 italic">Sin información</p>
        ) : link ? (
          <a 
            href={value.startsWith('http') ? value : `mailto:${value}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className={`text-sm text-gray-900 ${monospace ? 'font-mono' : ''} ${multiline ? 'leading-relaxed' : ''}`}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function EditModal({ section, formData, isSaving, onClose, onSave, onFormChange, onSearchRUT }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              {section === 'basicos' && 'Editar Datos Básicos'}
              {section === 'juridica' && 'Editar Personalidad Jurídica'}
              {section === 'direccion' && 'Editar Dirección Legal'}
              {section === 'contacto' && 'Editar Contacto Principal'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
            {section === 'basicos' && (
              <>
                <InputField label="Nombre Comercial" value={formData.name || ''} onChange={(e: any) => onFormChange({ ...formData, name: e.target.value })} required />
                <InputField label="Industria" value={formData.industry || ''} onChange={(e: any) => onFormChange({ ...formData, industry: e.target.value })} />
                <SelectField label="Tamaño Empresa" value={formData.company_size || ''} onChange={(e: any) => onFormChange({ ...formData, company_size: e.target.value })} options={[{ value: '', label: 'Seleccionar' }, { value: '1-10', label: '1-10 empleados' }, { value: '11-50', label: '11-50 empleados' }, { value: '51-200', label: '51-200 empleados' }, { value: '201-1000', label: '201-1000 empleados' }, { value: '1000+', label: '1000+ empleados' }]} />
                <InputField label="Sitio Web" type="url" value={formData.website || ''} onChange={(e: any) => onFormChange({ ...formData, website: e.target.value })} placeholder="https://www.ejemplo.cl" />
              </>
            )}
            {section === 'juridica' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">RUT</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.rut || ''} onChange={(e) => onFormChange({ ...formData, rut: e.target.value })} placeholder="12.345.678-9" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                    <button type="button" onClick={() => onSearchRUT(formData.rut)} disabled={!formData.rut || isSaving} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      {isSaving ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">Ingresa el RUT y haz clic en "Buscar" para autocompletar</p>
                </div>
                <InputField label="Razón Social" value={formData.legal_name || ''} onChange={(e: any) => onFormChange({ ...formData, legal_name: e.target.value })} />
                <InputField label="Tipo de Negocio" value={formData.business_type || ''} onChange={(e: any) => onFormChange({ ...formData, business_type: e.target.value })} placeholder="Ej: S.A., SPA, LTDA" />
                <InputField label="Año de Fundación" type="number" value={formData.foundation_year || ''} onChange={(e: any) => onFormChange({ ...formData, foundation_year: parseInt(e.target.value) || null })} placeholder="2020" />
              </>
            )}
            {section === 'direccion' && (
              <>
                <TextAreaField label="Dirección Legal" value={formData.legal_address || ''} onChange={(e: any) => onFormChange({ ...formData, legal_address: e.target.value })} placeholder="Av. Ejemplo 123, Oficina 456" />
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Ciudad" value={formData.city || ''} onChange={(e: any) => onFormChange({ ...formData, city: e.target.value })} />
                  <InputField label="Región" value={formData.region || ''} onChange={(e: any) => onFormChange({ ...formData, region: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="País" value={formData.country || 'Chile'} onChange={(e: any) => onFormChange({ ...formData, country: e.target.value })} />
                  <InputField label="Código Postal" value={formData.postal_code || ''} onChange={(e: any) => onFormChange({ ...formData, postal_code: e.target.value })} />
                </div>
              </>
            )}
            {section === 'contacto' && (
              <>
                <InputField label="Nombre Completo" value={formData.contact_name || ''} onChange={(e: any) => onFormChange({ ...formData, contact_name: e.target.value })} />
                <InputField label="Cargo" value={formData.contact_position || ''} onChange={(e: any) => onFormChange({ ...formData, contact_position: e.target.value })} />
                <InputField label="Email" type="email" value={formData.contact_email || ''} onChange={(e: any) => onFormChange({ ...formData, contact_email: e.target.value })} />
                <InputField label="Teléfono" value={formData.contact_phone || ''} onChange={(e: any) => onFormChange({ ...formData, contact_phone: e.target.value })} placeholder="+56 9 1234 5678" />
              </>
            )}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all text-sm font-semibold disabled:opacity-50">{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", required = false, placeholder = "" }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
      <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required = false }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
      <select value={value} onChange={onChange} required={required} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
        {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 3, required = false, placeholder = "" }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
      <textarea value={value} onChange={onChange} required={required} rows={rows} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
    </div>
  );
}
