"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { initialTemplates } from "../../data";
import { ProgramTemplate, Resource } from "../../types";

// ═══════════════════════════════════════════════════════════════════
// PREVIEW PAGE - Datos reales desde localStorage, no hardcodeados
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = "inspiratoria_programs";

const categoryLabels: Record<string, string> = {
  leadership: "Liderazgo",
  sales: "Ventas",
  diversity: "Diversidad",
  operations: "Operaciones",
  tech: "Tecnología",
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  leadership: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  sales: { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  diversity: { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
  operations: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  tech: { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" },
};

const resourceTypeIcons: Record<string, { icon: string; color: string }> = {
  pdf: { icon: "📄", color: "#DC2626" },
  video: { icon: "🎬", color: "#2563EB" },
  template: { icon: "📋", color: "#D97706" },
  document: { icon: "📝", color: "#6B7280" },
  link: { icon: "🔗", color: "#6366F1" },
};

const activityTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
  exercise: { label: "Ejercicio", icon: "💪", color: "#059669" },
  reflection: { label: "Reflexión", icon: "🪞", color: "#7C3AED" },
  roleplay: { label: "Role Play", icon: "🎭", color: "#DC2626" },
  assessment: { label: "Evaluación", icon: "📊", color: "#2563EB" },
  discussion: { label: "Discusión", icon: "💬", color: "#D97706" },
};

// ── helpers ──
function downloadResource(res: Resource) {
  if (res.dataUrl) {
    const a = document.createElement("a");
    a.href = res.dataUrl;
    a.download = res.fileName || `${res.name}.${res.type === "pdf" ? "pdf" : "bin"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else if (res.url) {
    window.open(res.url, "_blank");
  }
}

function hasFileData(res: Resource): boolean {
  return !!(res.dataUrl || res.url);
}

export default function ProgramPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [template, setTemplate] = useState<ProgramTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"overview" | "modules" | "config">("overview");
  const [viewingPdf, setViewingPdf] = useState<Resource | null>(null);

  // ── Load real data: localStorage first, then fallback to initialTemplates ──
  useEffect(() => {
    let found: ProgramTemplate | undefined;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const all = JSON.parse(stored) as ProgramTemplate[];
        found = all.find((t) => t.slug === slug);
      }
    } catch { /* ignore */ }
    if (!found) {
      found = initialTemplates.find((t) => t.slug === slug);
    }
    setTemplate(found || null);
    setLoading(false);
  }, [slug]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAFA" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #eee", borderTopColor: "#1a1a1a", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#999", fontSize: 14 }}>Cargando programa...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAFA" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Programa no encontrado</h2>
          <p style={{ color: "#666", marginBottom: 24 }}>No existe un programa con el slug &quot;{slug}&quot;</p>
          <button onClick={() => router.push("/dashboard/programs")} style={{ padding: "10px 24px", background: "#1a1a1a", color: "#fff", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            ← Volver a Programas
          </button>
        </div>
      </div>
    );
  }

  const catColor = categoryColors[template.category] || categoryColors.leadership;
  const totalSessions = template.modules.reduce((sum, m) => sum + m.sessions, 0);
  const totalResources = template.modules.reduce((sum, m) => sum + m.resources.length, 0);
  const totalActivities = template.modules.reduce((sum, m) => sum + m.activities.length, 0);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedModules(new Set(template.modules.map((m) => m.id)));
  const collapseAll = () => setExpandedModules(new Set());

  // ── PDF Viewer Modal ──
  const PdfViewer = viewingPdf && (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setViewingPdf(null)}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "90vw", height: "90vh", maxWidth: 1100, background: "#fff", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📄</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{viewingPdf.name}</span>
            {viewingPdf.size && <span style={{ fontSize: 12, color: "#999" }}>({viewingPdf.size})</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => downloadResource(viewingPdf)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "1px solid #e0e0e0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#333" }}>
              ⬇ Descargar
            </button>
            <button onClick={() => setViewingPdf(null)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "1px solid #e0e0e0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#333" }}>
              ✕ Cerrar
            </button>
          </div>
        </div>
        <iframe
          src={viewingPdf.dataUrl || viewingPdf.url}
          style={{ flex: 1, border: "none", width: "100%" }}
          title={viewingPdf.name}
        />
      </div>
    </div>
  );

  // ── Resource row with actions ──
  const ResourceRow = ({ res }: { res: Resource }) => {
    const rt = resourceTypeIcons[res.type] || resourceTypeIcons.document;
    const canView = (res.type === "pdf" || res.type === "document") && hasFileData(res);
    const canDownload = hasFileData(res);

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #f0f0f0", borderRadius: 8, background: "#FAFAFA" }}>
        <span style={{ fontSize: 20 }}>{rt.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{res.name}</div>
          {res.description && <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{res.description}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {res.size && <span style={{ fontSize: 11, color: "#bbb" }}>{res.size}</span>}
          <span style={{ fontSize: 10, fontWeight: 700, color: rt.color, textTransform: "uppercase", padding: "2px 6px", background: `${rt.color}11`, borderRadius: 4 }}>
            {res.type}
          </span>
          {canView && (
            <button
              onClick={() => setViewingPdf(res)}
              style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "1px solid #e0e0e0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#2563EB" }}
            >
              👁 Ver
            </button>
          )}
          {canDownload && (
            <button
              onClick={() => downloadResource(res)}
              style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "1px solid #e0e0e0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#059669" }}
            >
              ⬇ Descargar
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA" }}>
      {PdfViewer}

      {/* Print Styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top Bar */}
      <div className="no-print" style={{ background: "#fff", borderBottom: "1px solid #eee", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <button onClick={() => router.push("/dashboard/programs")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#333" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Volver a Programas
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#333" }}>
            🖨 Imprimir
          </button>
          <span style={{ fontSize: 12, color: "#999", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>Vista previa</span>
          <span style={{
            padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            background: template.status === "published" ? "#D1FAE5" : "#FEF3C7",
            color: template.status === "published" ? "#065F46" : "#92400E",
          }}>
            {template.status === "published" ? "Publicado" : "Borrador"}
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)", color: "#fff", padding: "48px 24px 40px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: catColor.bg, color: catColor.text, border: `1px solid ${catColor.border}` }}>
              {categoryLabels[template.category] || template.category}
            </span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>/{template.slug}</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>{template.name}</h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, maxWidth: 700 }}>{template.description}</p>

          {/* Stats */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginTop: 32 }}>
            {[
              { icon: "📅", label: "Duración", value: template.duration || "—" },
              { icon: "📚", label: "Módulos", value: template.modules.length },
              { icon: "🎯", label: "Sesiones", value: totalSessions },
              { icon: "📎", label: "Recursos", value: totalResources },
              { icon: "⚡", label: "Actividades", value: totalActivities },
              { icon: "🏆", label: "Hitos", value: template.milestones.length },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px" }}>
                <span style={{ fontSize: 20 }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          {template.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
              {template.tags.map((tag) => (
                <span key={tag} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="no-print" style={{ background: "#fff", borderBottom: "1px solid #eee", position: "sticky", top: 53, zIndex: 40 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 0 }}>
          {([
            { key: "overview" as const, label: "Vista General", icon: "📋" },
            { key: "modules" as const, label: "Módulos y Contenido", icon: "📚" },
            { key: "config" as const, label: "Configuración", icon: "⚙️" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "14px 20px", border: "none",
                borderBottom: activeTab === tab.key ? "2px solid #1a1a1a" : "2px solid transparent",
                background: "transparent", cursor: "pointer", fontSize: 14,
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? "#1a1a1a" : "#999",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s ease",
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* ═══════ OVERVIEW TAB ═══════ */}
        {activeTab === "overview" && (
          <div>
            {/* Milestones */}
            {template.milestones.length > 0 && (
              <section style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 20 }}>🏆 Hitos del Programa</h2>
                <div style={{ position: "relative", paddingLeft: 32 }}>
                  <div style={{ position: "absolute", left: 11, top: 4, bottom: 4, width: 2, background: "#e0e0e0" }} />
                  {template.milestones.map((ms, idx) => (
                    <div key={ms.id} style={{ position: "relative", marginBottom: 24 }}>
                      <div style={{ position: "absolute", left: -32, top: 2, width: 24, height: 24, borderRadius: "50%", background: "#1a1a1a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, zIndex: 1 }}>{idx + 1}</div>
                      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>{ms.name}</h3>
                          <span style={{ fontSize: 12, color: "#999", fontWeight: 500, background: "#f5f5f5", padding: "4px 10px", borderRadius: 20 }}>Semana {ms.week}</span>
                        </div>
                        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5, marginBottom: 8 }}>{ms.description}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#999" }}>📦 Entregable: {ms.deliverable}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Module Summary Cards */}
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 20 }}>📚 Resumen de Módulos</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {template.modules.map((mod, idx) => (
                  <div
                    key={mod.id}
                    onClick={() => { setActiveTab("modules"); setExpandedModules(new Set([mod.id])); }}
                    style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 20, cursor: "pointer", transition: "all 0.2s ease" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#ccc"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#eee"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#666" }}>{idx + 1}</div>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{mod.name}</h3>
                        <span style={{ fontSize: 12, color: "#999" }}>{mod.duration} · {mod.sessions} sesiones</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{mod.description}</p>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#999" }}>
                      <span>📎 {mod.resources.length} recursos</span>
                      <span>⚡ {mod.activities.length} actividades</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* All Resources */}
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 20 }}>📎 Todos los Recursos</h2>
              <div style={{ display: "grid", gap: 8 }}>
                {template.modules.flatMap((mod) => mod.resources).length === 0 && (
                  <div style={{ textAlign: "center", padding: 40, color: "#999", background: "#fff", border: "1px solid #eee", borderRadius: 12 }}>No hay recursos cargados</div>
                )}
                {template.modules.flatMap((mod) => mod.resources).map((res) => (
                  <ResourceRow key={res.id} res={res} />
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ═══════ MODULES TAB ═══════ */}
        {activeTab === "modules" && (
          <div>
            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 20 }}>
              <button onClick={expandAll} style={{ padding: "6px 14px", fontSize: 13, border: "1px solid #e0e0e0", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#666" }}>Expandir todo</button>
              <button onClick={collapseAll} style={{ padding: "6px 14px", fontSize: 13, border: "1px solid #e0e0e0", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#666" }}>Colapsar todo</button>
            </div>

            {template.modules.map((mod, modIdx) => {
              const isExpanded = expandedModules.has(mod.id);
              return (
                <div key={mod.id} style={{ marginBottom: 16 }}>
                  <div onClick={() => toggleModule(mod.id)} style={{ background: "#fff", border: "1px solid #eee", borderRadius: isExpanded ? "12px 12px 0 0" : 12, padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all 0.2s ease" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isExpanded ? "#1a1a1a" : "#f5f5f5", color: isExpanded ? "#fff" : "#666", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, transition: "all 0.2s ease" }}>{modIdx + 1}</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{mod.name}</h3>
                      <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#999" }}>
                        <span>⏱ {mod.duration}</span>
                        <span>🎯 {mod.sessions} sesiones</span>
                        <span>📎 {mod.resources.length} recursos</span>
                        <span>⚡ {mod.activities.length} actividades</span>
                      </div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ transition: "transform 0.2s ease", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}><path d="M6 9l6 6 6-6" /></svg>
                  </div>

                  {isExpanded && (
                    <div style={{ background: "#fff", border: "1px solid #eee", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "24px 20px" }}>
                      <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 24 }}>{mod.description}</p>

                      {/* Objectives */}
                      {mod.objectives.length > 0 && (
                        <div style={{ marginBottom: 28 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>🎯 Objetivos del Módulo</h4>
                          <div style={{ display: "grid", gap: 8 }}>
                            {mod.objectives.map((obj, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", background: "#f9f9f9", borderRadius: 8 }}>
                                <span style={{ color: "#059669", fontSize: 16, lineHeight: 1 }}>✓</span>
                                <span style={{ fontSize: 13, color: "#555", lineHeight: 1.4 }}>{obj}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sessions */}
                      {mod.sessions_detail && mod.sessions_detail.length > 0 && (
                        <div style={{ marginBottom: 28 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>📅 Sesiones</h4>
                          <div style={{ display: "grid", gap: 12 }}>
                            {mod.sessions_detail.map((session, sIdx) => (
                              <div key={session.id} style={{ border: "1px solid #f0f0f0", borderRadius: 10, padding: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ width: 24, height: 24, borderRadius: 6, background: "#f5f5f5", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#666" }}>{sIdx + 1}</span>
                                    <h5 style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{session.title}</h5>
                                  </div>
                                  <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#999" }}>
                                    <span>Semana {session.week}</span><span>·</span><span>{session.duration} min</span>
                                  </div>
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.03em" }}>Agenda</span>
                                  <ul style={{ margin: "6px 0 0 16px", padding: 0, listStyle: "disc" }}>
                                    {session.agenda.map((item, aIdx) => (
                                      <li key={aIdx} style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "8px 12px", background: "#FFFBEB", borderRadius: 8, marginTop: 8 }}>
                                  <span style={{ fontSize: 14 }}>📝</span>
                                  <div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: "#92400E", textTransform: "uppercase" }}>Tarea</span>
                                    <p style={{ fontSize: 13, color: "#78350F", margin: "2px 0 0" }}>{session.homework}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resources */}
                      {mod.resources.length > 0 && (
                        <div style={{ marginBottom: 28 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>📎 Recursos</h4>
                          <div style={{ display: "grid", gap: 8 }}>
                            {mod.resources.map((res) => <ResourceRow key={res.id} res={res} />)}
                          </div>
                        </div>
                      )}

                      {/* Activities */}
                      {mod.activities.length > 0 && (
                        <div>
                          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>⚡ Actividades</h4>
                          <div style={{ display: "grid", gap: 8 }}>
                            {mod.activities.map((act) => {
                              const at = activityTypeLabels[act.type] || activityTypeLabels.exercise;
                              return (
                                <div key={act.id} style={{ display: "flex", gap: 12, padding: "12px 14px", border: "1px solid #f0f0f0", borderRadius: 8 }}>
                                  <span style={{ fontSize: 22 }}>{at.icon}</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{act.name}</span>
                                      {act.required && <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 6px", borderRadius: 4 }}>REQUERIDA</span>}
                                    </div>
                                    <p style={{ fontSize: 13, color: "#666", lineHeight: 1.4, marginBottom: 6 }}>{act.description}</p>
                                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#999" }}>
                                      <span>⏱ {act.duration}</span>
                                      <span style={{ color: at.color, fontWeight: 600 }}>{at.label}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════ CONFIG TAB ═══════ */}
        {activeTab === "config" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>👨‍🏫 Requisitos Mentor</h3>
              <div style={{ display: "grid", gap: 12 }}>
                <ConfigRow label="Máx. mentees" value={template.mentorRequirements.maxMentees} />
                <ConfigRow label="Experiencia mín." value={`${template.mentorRequirements.minExperienceYears} años`} />
                <ConfigRow label="Nivel requerido" value={template.mentorRequirements.requiredLevel} />
                <ConfigRow label="Perfil obligatorio" value={template.mentorRequirements.requireProfile ? "Sí" : "No"} />
                <ConfigRow label="LinkedIn obligatorio" value={template.mentorRequirements.requireLinkedIn ? "Sí" : "No"} />
                {template.mentorRequirements.requiredSkills.length > 0 && (
                  <div>
                    <span style={{ fontSize: 12, color: "#999" }}>Habilidades requeridas</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {template.mentorRequirements.requiredSkills.map((s) => (
                        <span key={s} style={{ padding: "2px 8px", background: "#f5f5f5", borderRadius: 4, fontSize: 12, color: "#666" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>👩‍🎓 Requisitos Mentee</h3>
              <div style={{ display: "grid", gap: 12 }}>
                <ConfigRow label="Puede elegir mentor" value={template.menteeRequirements.canSelectMentor ? "Sí" : "No"} />
                <ConfigRow label="Máx. mentores" value={template.menteeRequirements.maxMentors} />
                <ConfigRow label="Objetivos obligatorios" value={template.menteeRequirements.requiredGoals ? "Sí" : "No"} />
                <ConfigRow label="Perfil obligatorio" value={template.menteeRequirements.requireProfile ? "Sí" : "No"} />
                <ConfigRow label="Antigüedad mín." value={`${template.menteeRequirements.minTenure} meses`} />
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>🔗 Reglas de Matching</h3>
              <div style={{ display: "grid", gap: 12 }}>
                <ConfigRow label="Algoritmo" value={template.matchingRules.algorithm} />
                <ConfigRow label="Permitir preferencias" value={template.matchingRules.allowPreferences ? "Sí" : "No"} />
                <div>
                  <span style={{ fontSize: 12, color: "#999", marginBottom: 8, display: "block" }}>Pesos del algoritmo</span>
                  <div style={{ display: "grid", gap: 6 }}>
                    {[
                      { label: "Habilidades", value: template.matchingRules.weighSkills, color: "#059669" },
                      { label: "Objetivos", value: template.matchingRules.weighGoals, color: "#2563EB" },
                      { label: "Departamento", value: template.matchingRules.weighDepartment, color: "#D97706" },
                      { label: "Seniority", value: template.matchingRules.weighSeniority, color: "#7C3AED" },
                    ].map((w) => (
                      <div key={w.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "#666", width: 90 }}>{w.label}</span>
                        <div style={{ flex: 1, background: "#f5f5f5", borderRadius: 4, height: 8, overflow: "hidden" }}>
                          <div style={{ width: `${w.value}%`, height: "100%", background: w.color, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#666", width: 30, textAlign: "right" }}>{w.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>📅 Reglas de Sesiones</h3>
              <div style={{ display: "grid", gap: 12 }}>
                <ConfigRow label="Duración" value={`${template.sessionRules.defaultDuration} min`} />
                <ConfigRow label="Frecuencia" value={`${template.sessionRules.frequencyPerMonth}x/mes`} />
                <ConfigRow label="Permitir reprogramar" value={template.sessionRules.allowReschedule ? "Sí" : "No"} />
                <ConfigRow label="Máx. reprogramaciones" value={template.sessionRules.maxReschedules} />
                <ConfigRow label="Recordatorio" value={`${template.sessionRules.reminderDays} días antes`} />
                <ConfigRow label="Agenda obligatoria" value={template.sessionRules.requireAgenda ? "Sí" : "No"} />
                <ConfigRow label="Feedback obligatorio" value={template.sessionRules.requireFeedback ? "Sí" : "No"} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f5f5f5" }}>
      <span style={{ fontSize: 13, color: "#666" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{String(value)}</span>
    </div>
  );
}
