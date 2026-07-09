"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// ─── SVG Icons ───
const IconProgram = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);
const IconUsers = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconKey = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);
const IconCalendar = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconCopy = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);
const IconArrowRight = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

interface StudioDashboardData {
  company: {
    id: string;
    name: string;
    corp_id: string;
    plan: string;
    status: string;
    industry: string;
    city: string;
    country: string;
  };
  studio_account: {
    id: string;
    access_hash: string;
    status: string;
    valid_from: string;
    valid_until: string | null;
    login_count: number;
    generated_email: string;
  };
  programs: Array<{
    id: string;
    name: string;
    status: string;
    category: string;
    duration: string;
    description: string;
  }>;
  admin: {
    full_name: string;
    email: string;
  };
}

const STATUS_MAP: Record<string, string> = {
  active: "Activo",
  in_execution: "En ejecución",
  designed: "Diseñado",
  draft: "Borrador",
  paused: "Pausado",
  completed: "Completado",
};

export default function StudioDashboard() {
  const [data, setData] = useState<StudioDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const studioStr = localStorage.getItem("studio_user");
      if (!studioStr) return;
      const studio = JSON.parse(studioStr);
      const hash = studio.access_hash;
      if (!hash) return;

      const res = await apiFetch(`${API_URL}/api/companies/studio/dashboard/${hash}`);
      if (!res.ok) throw new Error("Error al cargar datos");
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <IconKey className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Error al cargar</h2>
          <p className="text-[13px] text-gray-400 mb-4">{error || "No se encontraron datos de la cuenta"}</p>
          <button onClick={fetchDashboard} className="px-4 py-2 bg-gray-900 text-white text-[13px] rounded-xl hover:bg-gray-800 transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Programas asignados", value: data.programs.length, icon: IconProgram },
    { label: "Accesos al dashboard", value: data.studio_account.login_count, icon: IconUsers },
    { label: "Estado de cuenta", value: data.studio_account.status === "active" ? "Activa" : "Inactiva", icon: IconKey },
    { label: "Válido desde", value: formatDate(data.studio_account.valid_from), icon: IconCalendar },
  ];

  return (
    <div className="px-8 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">{data.company.name}</h1>
            <p className="text-[14px] text-gray-400 mt-1">
              Bienvenido a tu Dashboard Studio — Gestiona tus programas de mentoría
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-gray-100 text-[12px] font-mono text-gray-500 rounded-lg">{data.company.corp_id}</span>
            <span className="px-3 py-1.5 bg-gray-900 text-[12px] font-medium text-[#FFD902] rounded-lg uppercase">{data.company.plan}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
                  <Icon className="w-[18px] h-[18px] text-gray-400" />
                </div>
                <p className="text-[12px] text-gray-400 font-medium">{kpi.label}</p>
              </div>
              <p className="text-[24px] font-bold text-gray-900 tracking-tight">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Programs (2/3) */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <IconProgram className="w-4 h-4 text-gray-400" />
                <h2 className="text-[14px] font-semibold text-gray-900">Programas asignados</h2>
              </div>
              <span className="text-[12px] text-gray-400">{data.programs.length} programa{data.programs.length !== 1 ? "s" : ""}</span>
            </div>

            {data.programs.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <IconProgram className="w-7 h-7 text-gray-300" />
                </div>
                <h3 className="text-[15px] font-medium text-gray-900 mb-1">Sin programas asignados</h3>
                <p className="text-[13px] text-gray-400">Tu Program Manager asignará programas a tu cuenta pronto.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.programs.map((prog) => (
                  <div key={prog.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[14px] font-medium text-gray-900">{prog.name}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-[10px] text-gray-500 font-medium rounded-md uppercase">{STATUS_MAP[prog.status] || prog.status}</span>
                        </div>
                        <p className="text-[12px] text-gray-400 line-clamp-1">{prog.description || "Sin descripción"}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                          {prog.category && <span className="capitalize">{prog.category}</span>}
                          {prog.duration && <span>· {prog.duration}</span>}
                        </div>
                      </div>
                      <button className="p-2 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                        <IconArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Account Info (1/3) */}
        <div className="space-y-4">
          {/* Account Details */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-[14px] font-semibold text-gray-900">Datos de cuenta</h2>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Corp ID", value: data.company.corp_id, copyable: true },
                { label: "Hash", value: data.studio_account.access_hash, copyable: true, mono: true, truncate: true },
                { label: "Email", value: data.studio_account.generated_email, copyable: true },
                { label: "Plan", value: data.company.plan?.toUpperCase() || "—" },
                { label: "Industria", value: data.company.industry || "—" },
                { label: "Ubicación", value: [data.company.city, data.company.country].filter(Boolean).join(", ") || "—" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-400">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[12px] text-gray-700 ${item.mono ? "font-mono" : ""} ${item.truncate ? "max-w-[120px] truncate" : ""}`}>
                      {item.value}
                    </span>
                    {item.copyable && (
                      <button
                        onClick={() => copyToClipboard(String(item.value), item.label)}
                        className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
                        title="Copiar"
                      >
                        {copied === item.label ? (
                          <svg className="w-3.5 h-3.5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <IconCopy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validity */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-[14px] font-semibold text-gray-900">Vigencia</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-400">Estado</span>
                <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-700">
                  <span className={`w-1.5 h-1.5 rounded-full ${data.studio_account.status === "active" ? "bg-gray-900" : "bg-gray-300"}`} />
                  {data.studio_account.status === "active" ? "Activa" : data.studio_account.status === "suspended" ? "Suspendida" : "Expirada"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-400">Desde</span>
                <span className="text-[12px] text-gray-700">{formatDate(data.studio_account.valid_from)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-400">Hasta</span>
                <span className="text-[12px] text-gray-700">{data.studio_account.valid_until ? formatDate(data.studio_account.valid_until) : "Sin vencimiento"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-400">Accesos</span>
                <span className="text-[12px] text-gray-700 font-medium">{data.studio_account.login_count} veces</span>
              </div>
            </div>
          </div>

          {/* Admin Info */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-[14px] font-semibold text-gray-900">Administrador</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[14px] font-semibold text-gray-500">
                  {data.admin.full_name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-900">{data.admin.full_name}</p>
                  <p className="text-[12px] text-gray-400">{data.admin.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
