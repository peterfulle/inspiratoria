"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pageStyles } from "../styles";
import { Icon } from "../icons";
import { ProgramTemplate } from "../types";
import { getTemplateCompleteness, programStatusMeta } from "../data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type ProgramInstance = {
  id: string;
  name: string;
  status: string;
  company?: { name: string; slug?: string } | null;
  template?: { name: string; slug?: string } | null;
  activities_count?: number;
  participants_count?: number;
  cohort_year?: number | null;
};

type ActiveCompany = { id: string; name: string; account_type?: string; plan: string; status?: string };

export default function AssignmentsPage() {
  const router = useRouter();

  // ─── Plantillas (solo para el selector del modal de asignación) ───
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // ─── Asignaciones (instancias de programa) ───
  const [programs, setPrograms] = useState<ProgramInstance[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsSearch, setProgramsSearch] = useState("");
  const [programsStatusFilter, setProgramsStatusFilter] = useState<string>("all");

  // ─── Modal "Asignar programa" ───
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [activeCompanies, setActiveCompanies] = useState<ActiveCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({ programId: "", companyId: "", cohortYear: String(new Date().getFullYear()) });
  // Aviso de duplicado devuelto por el backend (409)
  const [assignDuplicate, setAssignDuplicate] = useState<{ message: string; existingId: string } | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/program-templates`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setTemplates(data);
      }
    } catch (e) {
      console.warn("Could not fetch templates", e);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchPrograms = async () => {
    setProgramsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/programs`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPrograms(data);
      }
    } catch (e) {
      console.warn("Could not fetch programs", e);
    } finally {
      setProgramsLoading(false);
    }
  };

  const openAssignModal = async () => {
    setShowAssignModal(true);
    setAssignSuccess(false);
    setAssignError("");
    setAssignDuplicate(null);
    setAssignForm({ programId: "", companyId: "", cohortYear: String(new Date().getFullYear()) });
    setCompaniesLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/api/companies/active-companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCompanies(Array.isArray(data) ? data : (data.companies || []));
      }
    } catch (e) {
      console.warn("Could not fetch active companies", e);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const handleAssignProgram = async (force = false) => {
    if (!assignForm.programId || !assignForm.companyId) {
      setAssignError("Selecciona una plantilla y una empresa");
      return;
    }
    setAssignLoading(true);
    setAssignError("");
    if (!force) setAssignDuplicate(null);
    try {
      const token = localStorage.getItem("auth_token");
      const selectedTemplate = templates.find(t => t.id === assignForm.programId);
      if (!selectedTemplate) throw new Error("Plantilla no encontrada");

      // El backend autoconstruye el nombre ({plantilla} · {empresa} {año}),
      // congela el diseño completo (design_snapshot) y vincula la plantilla.
      const createRes = await fetch(`${API_URL}/api/programs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          company_id: assignForm.companyId,
          cohort_year: assignForm.cohortYear ? Number(assignForm.cohortYear) : undefined,
          status: "designed",
          force,
        }),
      });
      const createData = await createRes.json();

      if (createRes.status === 409) {
        // Plantilla ya asignada a esa empresa: ofrecer confirmar
        const d = createData.detail || {};
        setAssignDuplicate({
          message: d.message || "Esta plantilla ya está asignada a esa empresa.",
          existingId: d.existing_program_id || "",
        });
        return;
      }
      if (!createRes.ok) {
        const detail = createData.detail;
        throw new Error(typeof detail === "string" ? detail : (detail?.message || createData.error || "Error al crear programa"));
      }

      setAssignDuplicate(null);
      setAssignSuccess(true);
      fetchPrograms();
    } catch (err: any) {
      setAssignError(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchPrograms();
  }, []);

  // Deep-link ?assign=1 — usado desde Programas Studio para saltar directo
  // a abrir el modal de asignación al llegar a esta página.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("assign") === "1") {
      openAssignModal();
      router.replace("/dashboard/programs/assignments");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noTemplatesYet = !templatesLoading && templates.length === 0;
  const noCompaniesYet = !companiesLoading && activeCompanies.length === 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <div className="programs-page">
        <header className="programs-header sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="programs-eyebrow">Gestión</div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f0f0f', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  Asignaciones
                </h1>
                <p className="text-neutral-500 text-sm mt-0.5">
                  Instancias asignadas a empresas
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button className="btn-secondary flex items-center gap-2 text-xs sm:text-sm">
                  <Icon.Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
                <button
                  onClick={openAssignModal}
                  className="btn-primary flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Icon.Link className="w-4 h-4" />
                  <span className="hidden sm:inline">Asignar programa</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 w-full">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="stat-card">
              <span className="section-title" style={{ margin: 0 }}>Total</span>
              <p className="text-3xl font-semibold text-neutral-900 mt-2">{programs.length}</p>
              <p className="text-neutral-500 text-xs mt-1">programas</p>
            </div>
            <div className="stat-card">
              <span className="section-title" style={{ margin: 0 }}>En ejecución</span>
              <p className="text-3xl font-semibold text-neutral-900 mt-2">{programs.filter(p => p.status === "in_execution" || p.status === "active").length}</p>
              <p className="text-neutral-500 text-xs mt-1">activos</p>
            </div>
            <div className="stat-card">
              <span className="section-title" style={{ margin: 0 }}>En diseño</span>
              <p className="text-3xl font-semibold text-neutral-900 mt-2">{programs.filter(p => p.status === "designed" || p.status === "ready_for_execution" || p.status === "draft").length}</p>
              <p className="text-neutral-500 text-xs mt-1">por lanzar</p>
            </div>
            <div className="stat-card">
              <span className="section-title" style={{ margin: 0 }}>Participantes</span>
              <p className="text-3xl font-semibold text-neutral-900 mt-2">{programs.reduce((a, p) => a + (p.participants_count || 0), 0)}</p>
              <p className="text-neutral-500 text-xs mt-1">en total</p>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card p-3 sm:p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Icon.Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o empresa..."
                  value={programsSearch}
                  onChange={(e) => setProgramsSearch(e.target.value)}
                  className="input-field pl-11"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {[
                  { id: "all", label: "Todos" },
                  { id: "designed", label: "Diseñado" },
                  { id: "ready_for_execution", label: "Listo" },
                  { id: "in_execution", label: "En ejecución" },
                  { id: "under_review", label: "Revisión" },
                  { id: "closed", label: "Cerrado" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setProgramsStatusFilter(s.id)}
                    className={`filter-btn whitespace-nowrap ${programsStatusFilter === s.id ? "active" : ""}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {programsLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "30vh", gap: 12 }}>
              <div style={{ width: 22, height: 22, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span className="text-neutral-500 text-sm">Cargando asignaciones...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (() => {
            const q = programsSearch.toLowerCase();
            const list = programs.filter(p => {
              const matchesSearch = p.name.toLowerCase().includes(q) || (p.company?.name || "").toLowerCase().includes(q);
              const matchesStatus = programsStatusFilter === "all" || p.status === programsStatusFilter;
              return matchesSearch && matchesStatus;
            });
            if (list.length === 0) {
              return (
                <div className="empty-state">
                  <p className="text-neutral-500 text-sm mb-3">
                    {programs.length === 0 ? "No hay programas asignados todavía." : "Ninguna asignación coincide con los filtros."}
                  </p>
                  {programs.length === 0 && (
                    <button onClick={openAssignModal} className="btn-primary px-4 py-2 text-[13px] inline-flex items-center gap-2">
                      <Icon.Link className="w-4 h-4" /> Asignar una plantilla a una empresa
                    </button>
                  )}
                </div>
              );
            }
            return (
              <div className="space-y-3">
                {list.map(p => {
                  const sm = programStatusMeta(p.status);
                  return (
                    <div key={p.id} className="program-card p-3 sm:p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                        {/* Left: Status + Title + Company */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: sm.color, background: sm.bg, borderRadius: 999, padding: "3px 10px" }}>
                              <span style={{ width: 6, height: 6, borderRadius: 999, background: sm.dot }} />
                              {sm.label}
                            </span>
                            {p.cohort_year ? <span className="badge badge-draft">{p.cohort_year}</span> : null}
                          </div>
                          <h3 className="text-sm sm:text-base font-semibold text-neutral-900 truncate">{p.name}</h3>
                          <p className="text-neutral-500 text-xs sm:text-sm truncate">{p.company?.name || "Sin empresa"}</p>
                        </div>

                        {/* Center: Stats */}
                        <div className="flex items-center gap-4 sm:gap-6 text-center flex-shrink-0">
                          <div className="px-2 sm:px-4">
                            <p className="text-xs sm:text-sm font-semibold text-neutral-900">{p.activities_count ?? 0}</p>
                            <p className="text-xs text-neutral-400">Actividades</p>
                          </div>
                          <div className="px-2 sm:px-4 border-l border-neutral-100">
                            <p className="text-xs sm:text-sm font-semibold text-neutral-900">{p.participants_count ?? 0}</p>
                            <p className="text-xs text-neutral-400">Participantes</p>
                          </div>
                        </div>

                        {/* Right: Template origin - hidden on small screens */}
                        <div className="hidden xl:block text-xs text-neutral-500 flex-shrink-0 w-48">
                          {p.template?.name ? (
                            <p className="truncate">Desde plantilla:<br /><span className="text-neutral-700 font-medium">{p.template.name}</span></p>
                          ) : (
                            <p className="text-neutral-300">Sin plantilla de origen</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0 lg:pl-4 lg:border-l border-neutral-100">
                          {p.template?.name && (
                            <button
                              onClick={() => router.push(`/dashboard/programs/preview/${p.template?.slug || ""}`)}
                              className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
                              title="Ver plantilla de origen"
                            >
                              <Icon.Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Plantilla</span>
                            </button>
                          )}
                          <button
                            onClick={() => window.open(
                              p.company?.slug
                                ? `/studio/${p.company.slug}/program/${p.id}`
                                : `/dashboard/programs/${p.id}/manage`,
                              "_blank",
                              "noopener,noreferrer"
                            )}
                            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
                          >
                            <Icon.Link className="w-4 h-4" />
                            Abrir
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </main>

        {/* ─── ASSIGN PROGRAM MODAL ─── */}
        {showAssignModal && (
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
              {!assignSuccess ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                        <Icon.Link className="w-5 h-5 text-[#FFD902]" />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-semibold text-neutral-900">Asignar programa</h3>
                        <p className="text-[12px] text-neutral-400">Asigna una plantilla a una empresa activa</p>
                      </div>
                    </div>
                    <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                      <Icon.X className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[12px] text-neutral-500 mb-1.5 font-medium">Plantilla de programa</label>
                      {noTemplatesYet ? (
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between gap-3">
                          <p className="text-[12px] text-neutral-500">Todavía no hay plantillas creadas.</p>
                          <button
                            type="button"
                            onClick={() => router.push("/dashboard/programs")}
                            className="text-[12px] font-semibold text-neutral-900 underline whitespace-nowrap"
                          >
                            Crear plantilla
                          </button>
                        </div>
                      ) : (
                        <select
                          value={assignForm.programId}
                          onChange={e => setAssignForm(p => ({ ...p, programId: e.target.value }))}
                          disabled={templatesLoading}
                          className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-[14px] text-neutral-900 focus:outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100"
                        >
                          <option value="">{templatesLoading ? "Cargando plantillas..." : "Seleccionar plantilla..."}</option>
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.status === "published" ? "Publicada" : "Borrador"})</option>
                          ))}
                        </select>
                      )}
                      {assignForm.programId && (() => {
                        const t = templates.find(x => x.id === assignForm.programId);
                        if (!t) return null;
                        const { requiredComplete, percent, steps } = getTemplateCompleteness(t);
                        const missing = steps.filter(s => s.required && !s.complete);
                        if (requiredComplete) {
                          return (
                            <p className="mt-1.5 text-[11px] text-emerald-600 flex items-center gap-1">
                              <Icon.Check className="w-3 h-3" /> Plantilla lista ({percent}% completa)
                            </p>
                          );
                        }
                        return (
                          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                            <Icon.Flag className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-[11.5px] text-amber-800">
                                Falta <b>{missing.map(s => s.label).join(" y ")}</b> ({percent}% completa) — el programa se creará sin actividades reales.
                              </p>
                              <button
                                type="button"
                                onClick={() => router.push(`/dashboard/programs?edit=${t.id}`)}
                                className="text-[11px] font-semibold text-amber-800 underline mt-1"
                              >
                                Completar plantilla ahora
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="block text-[12px] text-neutral-500 mb-1.5 font-medium">Empresa destino</label>
                      {noCompaniesYet ? (
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between gap-3">
                          <p className="text-[12px] text-neutral-500">No hay empresas activas todavía.</p>
                          <button
                            type="button"
                            onClick={() => router.push("/dashboard/accounts")}
                            className="text-[12px] font-semibold text-neutral-900 underline whitespace-nowrap"
                          >
                            Crear cuenta Studio
                          </button>
                        </div>
                      ) : (
                        <select
                          value={assignForm.companyId}
                          onChange={e => setAssignForm(p => ({ ...p, companyId: e.target.value }))}
                          disabled={companiesLoading}
                          className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-[14px] text-neutral-900 focus:outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100"
                        >
                          <option value="">{companiesLoading ? "Cargando empresas..." : "Seleccionar empresa..."}</option>
                          {activeCompanies.map(c => (
                            <option key={c.id} value={c.id}>{c.name} · {c.plan}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-[12px] text-neutral-500 mb-1.5 font-medium">Año de la cohorte</label>
                      <input
                        type="number"
                        value={assignForm.cohortYear}
                        onChange={e => { setAssignForm(p => ({ ...p, cohortYear: e.target.value })); setAssignDuplicate(null); }}
                        className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-[14px] text-neutral-900 focus:outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100"
                        placeholder="2026"
                      />
                    </div>

                    {/* Preview del nombre que se generará */}
                    {assignForm.programId && assignForm.companyId && (() => {
                      const t = templates.find(x => x.id === assignForm.programId);
                      const c = activeCompanies.find(x => x.id === assignForm.companyId);
                      if (!t || !c) return null;
                      const yr = assignForm.cohortYear ? ` ${assignForm.cohortYear}` : "";
                      return (
                        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                          <p className="text-[11px] text-neutral-400 mb-0.5">Se creará el programa</p>
                          <p className="text-[13px] font-semibold text-neutral-900">{t.name} · {c.name}{yr}</p>
                        </div>
                      );
                    })()}
                  </div>

                  {assignDuplicate && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-[12px] text-amber-800 font-medium mb-2">{assignDuplicate.message}</p>
                      <div className="flex items-center gap-2">
                        {assignDuplicate.existingId && (
                          <button
                            onClick={() => router.push(`/dashboard/programs/${assignDuplicate.existingId}/manage`)}
                            className="text-[12px] font-semibold text-amber-800 underline"
                          >
                            Ver el existente
                          </button>
                        )}
                        <button
                          onClick={() => handleAssignProgram(true)}
                          disabled={assignLoading}
                          className="text-[12px] font-semibold text-neutral-700 underline"
                        >
                          Crear otro igual de todos modos
                        </button>
                      </div>
                    </div>
                  )}

                  {assignError && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <p className="text-[12px] text-red-600">{assignError}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 mt-6">
                    <button onClick={() => setShowAssignModal(false)} className="btn-secondary px-4 py-2.5 text-[13px]">
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleAssignProgram(false)}
                      disabled={assignLoading || !assignForm.programId || !assignForm.companyId}
                      className="btn-primary px-5 py-2.5 text-[13px] flex items-center gap-2"
                    >
                      {assignLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Asignando...
                        </>
                      ) : (
                        <>
                          <Icon.Link className="w-4 h-4" />
                          Asignar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto mb-4">
                    <Icon.Check className="w-7 h-7 text-[#FFD902]" />
                  </div>
                  <h3 className="text-[18px] font-semibold text-neutral-900 mb-2">Programa asignado</h3>
                  <p className="text-[13px] text-neutral-400 mb-6">
                    El programa ha sido asignado a la empresa. Ya aparece en esta lista y en su Studio Dashboard.
                  </p>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="btn-primary px-5 py-2.5 text-[13px]"
                  >
                    Ver asignaciones
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
