"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ProgramTemplate, Resource } from "../../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// ═══════════════════════════════════════════════════════════════════
// SVG ICON COMPONENTS
// ═══════════════════════════════════════════════════════════════════

const I = {
  arrowLeft: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>,
  printer: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  book: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  target: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  paperclip: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
  zap: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  trophy: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2"/><path d="M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 19.24 7 20v2M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 19.24 17 20v2"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  chevDown: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  x: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  filePdf: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 13h4M10 17h4M10 9h1"/></svg>,
  fileVideo: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  fileTemplate: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  fileDoc: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  link: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  gradCap: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>,
  shuffle: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  clipboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  pkg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  expand: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  collapse: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  search: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  play: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  externalLink: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
};

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return null;
}

function getYouTubeThumb(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}

const resIcon: Record<string, JSX.Element> = { pdf: I.filePdf, video: I.fileVideo, template: I.fileTemplate, document: I.fileDoc, link: I.link };
const resColor: Record<string, string> = { pdf: "#DC2626", video: "#2563EB", template: "#D97706", document: "#6B7280", link: "#6366F1" };
const actCfg: Record<string, { label: string; color: string; bg: string }> = {
  exercise: { label: "Ejercicio", color: "#059669", bg: "#ECFDF5" },
  reflection: { label: "Reflexión", color: "#7C3AED", bg: "#F5F3FF" },
  roleplay: { label: "Role Play", color: "#DC2626", bg: "#FEF2F2" },
  assessment: { label: "Evaluación", color: "#2563EB", bg: "#EFF6FF" },
  discussion: { label: "Discusión", color: "#D97706", bg: "#FFFBEB" },
};
const catCfg: Record<string, { label: string; gradient: string }> = {
  leadership: { label: "Liderazgo", gradient: "linear-gradient(135deg,#F59E0B,#D97706)" },
  sales: { label: "Ventas", gradient: "linear-gradient(135deg,#3B82F6,#1D4ED8)" },
  diversity: { label: "Diversidad", gradient: "linear-gradient(135deg,#EC4899,#BE185D)" },
  operations: { label: "Operaciones", gradient: "linear-gradient(135deg,#10B981,#047857)" },
  tech: { label: "Tecnología", gradient: "linear-gradient(135deg,#8B5CF6,#6D28D9)" },
};
const algoLabel: Record<string, string> = { manual: "Manual", auto_skills: "Auto (Skills)", auto_goals: "Auto (Objetivos)", hybrid: "Híbrido" };

function dlRes(r: Resource) {
  if (r.dataUrl) { const a = document.createElement("a"); a.href = r.dataUrl; a.download = r.fileName || `${r.name}.${r.type === "pdf" ? "pdf" : "bin"}`; document.body.appendChild(a); a.click(); a.remove(); }
  else if (r.url) window.open(r.url, "_blank");
}
function hasData(r: Resource) { return !!(r.dataUrl || r.url); }

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

export default function ProgramPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [template, setTemplate] = useState<ProgramTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"overview" | "modules" | "config">("overview");
  const [viewPdf, setViewPdf] = useState<Resource | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [viewVideo, setViewVideo] = useState<Resource | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/program-templates`);
        if (r.ok) { const all: ProgramTemplate[] = await r.json(); setTemplate(all.find(t => t.slug === slug) || null); }
      } catch (e) { console.warn("Fetch error", e); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  const [isPrinting, setIsPrinting] = useState(false);
  const print = useCallback(() => { setIsPrinting(true); setTimeout(() => { window.print(); setIsPrinting(false); }, 200); }, []);

  useEffect(() => {
    if (!viewPdf) { if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); } return; }
    const src = viewPdf.dataUrl || viewPdf.url || "";
    if (src.startsWith("data:")) {
      try {
        const [h, b64] = src.split(",");
        const mime = h.match(/:(.*?);/)?.[1] || "application/pdf";
        const bin = atob(b64); const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        setBlobUrl(URL.createObjectURL(new Blob([arr], { type: mime })));
      } catch { setBlobUrl(src); }
    } else setBlobUrl(src);
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewPdf]);

  useEffect(() => {
    if (!viewVideo) { if (videoBlobUrl) { URL.revokeObjectURL(videoBlobUrl); setVideoBlobUrl(null); } return; }
    const src = viewVideo.dataUrl || "";
    if (src.startsWith("data:")) {
      try {
        const [h, b64] = src.split(",");
        const mime = h.match(/:(.*?);/)?.[1] || "video/mp4";
        const bin = atob(b64); const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        setVideoBlobUrl(URL.createObjectURL(new Blob([arr], { type: mime })));
      } catch { setVideoBlobUrl(null); }
    } else { setVideoBlobUrl(null); }
    return () => { if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewVideo]);

  if (loading) return (
    <div className="pp"><style>{CSS}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}><div className="spinner" /><p className="mt12 muted f14 fw5">Cargando programa...</p></div>
      </div>
    </div>
  );

  if (!template) return (
    <div className="pp"><style>{CSS}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ marginBottom: 24 }}>{I.search}</div>
          <h2 className="f22 fw7 ink mb8">Programa no encontrado</h2>
          <p className="muted f15 mb24">No existe un programa con el identificador &quot;{slug}&quot;</p>
          <button onClick={() => router.push("/dashboard/programs")} className="btn-primary">{I.arrowLeft}<span>Volver a Programas</span></button>
        </div>
      </div>
    </div>
  );

  const cat = catCfg[template.category] || catCfg.leadership;
  const totS = template.modules.reduce((a, m) => a + m.sessions, 0);
  const totR = template.modules.reduce((a, m) => a + m.resources.length, 0);
  const totA = template.modules.reduce((a, m) => a + m.activities.length, 0);

  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const openAll = () => setExpanded(new Set(template.modules.map(m => m.id)));
  const closeAll = () => setExpanded(new Set());

  const stats = [
    { icon: I.calendar, label: "Duración", val: template.duration || "—" },
    { icon: I.book, label: "Módulos", val: template.modules.length },
    { icon: I.target, label: "Sesiones", val: totS },
    { icon: I.paperclip, label: "Recursos", val: totR },
    { icon: I.zap, label: "Actividades", val: totA },
    { icon: I.trophy, label: "Hitos", val: template.milestones.length },
  ];

  return (
    <div className="pp">
      <style>{CSS}</style>

      {/* PDF MODAL */}
      {viewPdf && blobUrl && (
        <div className="modal-bg" onClick={() => setViewPdf(null)}>
          <div className="pdf-modal" onClick={e => e.stopPropagation()}>
            <div className="pdf-hdr">
              <div className="row gap8 ai-c">{I.filePdf}<span className="fw6 f14 ink">{viewPdf.name}</span>{viewPdf.size && <span className="muted f12">({viewPdf.size})</span>}</div>
              <div className="row gap8">
                <button className="btn-ghost" onClick={() => dlRes(viewPdf)}>{I.download}<span>Descargar</span></button>
                <button className="btn-ghost" onClick={() => setViewPdf(null)}>{I.x}</button>
              </div>
            </div>
            <iframe src={blobUrl} style={{ flex: 1, border: "none", width: "100%" }} title={viewPdf.name} />
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {viewVideo && (() => {
        const embedUrl = getVideoEmbedUrl(viewVideo.url || "");
        const hasUploadedVideo = !!videoBlobUrl;
        return (
          <div className="modal-bg" onClick={() => setViewVideo(null)}>
            <div className="video-modal" onClick={e => e.stopPropagation()}>
              <div className="pdf-hdr">
                <div className="row gap8 ai-c">{I.fileVideo}<span className="fw6 f14 ink">{viewVideo.name}</span></div>
                <div className="row gap8">
                  {viewVideo.url && <button className="btn-ghost" onClick={() => window.open(viewVideo.url, "_blank")}>{I.externalLink}<span>Abrir</span></button>}
                  {hasUploadedVideo && <button className="btn-ghost" onClick={() => dlRes(viewVideo)}>{I.download}<span>Descargar</span></button>}
                  <button className="btn-ghost" onClick={() => setViewVideo(null)}>{I.x}</button>
                </div>
              </div>
              {hasUploadedVideo ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", padding: 16 }}>
                  <video src={videoBlobUrl!} controls autoPlay style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8 }} />
                </div>
              ) : embedUrl ? (
                <iframe src={embedUrl} style={{ flex: 1, border: "none", width: "100%" }} title={viewVideo.name} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, color: "#64748b" }}>
                  <div style={{ opacity: .5 }}>{I.fileVideo}</div>
                  <p className="f14">Vista previa no disponible</p>
                  {viewVideo.url && <button className="btn-primary" onClick={() => window.open(viewVideo.url, "_blank")}>{I.externalLink}<span>Abrir en nueva pestaña</span></button>}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* TOP BAR */}
      <header className="topbar no-print">
        <button onClick={() => router.push("/dashboard/programs")} className="btn-ghost">{I.arrowLeft}<span>Programas</span></button>
        <div className="row gap12 ai-c">
          <button onClick={print} className="btn-ghost">{I.printer}<span>Imprimir</span></button>
          <div className={`status-pill ${template.status}`}>{template.status === "published" ? "Publicado" : "Borrador"}</div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero" style={{ background: cat.gradient }}>
        <div className="hero-in">
          <div className="row gap12 ai-c mb20">
            <span className="cat-pill">{cat.label}</span>
            <code className="slug-code">/{template.slug}</code>
          </div>
          <h1 className="hero-title">{template.name}</h1>
          <p className="hero-desc">{template.description}</p>

          <div className="stats-row">
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div><div className="stat-lbl">{s.label}</div><div className="stat-val">{s.val}</div></div>
              </div>
            ))}
          </div>

          {template.tags.length > 0 && (
            <div className="tags-row">
              {template.tags.map(t => <span key={t} className="tag">#{t}</span>)}
            </div>
          )}
        </div>
      </section>

      {/* TABS */}
      <nav className="tabs-bar no-print">
        <div className="tabs-in">
          {([
            { k: "overview" as const, l: "Vista General", i: I.clipboard },
            { k: "modules" as const, l: "Módulos", i: I.book },
            { k: "config" as const, l: "Configuración", i: I.settings },
          ]).map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`tab-btn ${tab === t.k ? "on" : ""}`}>{t.i}<span>{t.l}</span></button>
          ))}
        </div>
      </nav>

      {/* CONTENT */}
      <div className="content">

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="fade-in">
            {/* Milestones */}
            {template.milestones.length > 0 && (
              <section className="sec">
                <SectionHead icon={I.trophy} bg="#FFFBEB" color="#D97706" title="Hitos del Programa" count={template.milestones.length} />
                <div className="timeline">
                  {template.milestones.map((ms, i) => (
                    <div key={ms.id} className="tl-item">
                      <div className="tl-dot">{i + 1}</div>
                      <div className="tl-card">
                        <div className="row jc-sb ai-c mb8"><h3 className="f15 fw6 ink">{ms.name}</h3><span className="badge-n">Semana {ms.week}</span></div>
                        <p className="sec-text mb10">{ms.description}</p>
                        <div className="row gap6 ai-c muted f13">{I.pkg}<span>Entregable: {ms.deliverable}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Module Summary */}
            <section className="sec">
              <SectionHead icon={I.book} bg="#EFF6FF" color="#2563EB" title="Resumen de Módulos" count={template.modules.length} />
              <div className="mod-grid">
                {template.modules.map((m, i) => (
                  <div key={m.id} className="mod-card" onClick={() => { setTab("modules"); setExpanded(new Set([m.id])); }}>
                    <div className="row gap12 ai-c mb14">
                      <div className="mod-num">{i + 1}</div>
                      <div><h3 className="f15 fw6 ink mb2">{m.name}</h3><span className="muted f12">{m.duration} · {m.sessions} sesiones</span></div>
                    </div>
                    <p className="mod-desc">{m.description}</p>
                    <div className="mod-meta"><span>{I.paperclip} {m.resources.length} recursos</span><span>{I.zap} {m.activities.length} actividades</span></div>
                  </div>
                ))}
              </div>
            </section>

            {/* All Resources */}
            <section className="sec">
              <SectionHead icon={I.paperclip} bg="#F5F3FF" color="#7C3AED" title="Todos los Recursos" count={totR} />
              {totR === 0 ? <div className="empty">No hay recursos cargados</div> : (
                <div className="res-list">{template.modules.flatMap(m => m.resources).map(r => <ResRow key={r.id} r={r} onView={setViewPdf} onVideo={setViewVideo} />)}</div>
              )}
            </section>
          </div>
        )}

        {/* MODULES */}
        {tab === "modules" && (
          <div className="fade-in">
            <div className="row jc-end gap8 mb20 no-print">
              <button onClick={openAll} className="btn-ghost">{I.expand}<span>Expandir</span></button>
              <button onClick={closeAll} className="btn-ghost">{I.collapse}<span>Colapsar</span></button>
            </div>
            <div className="acc-list">
              {template.modules.map((m, i) => {
                const open = expanded.has(m.id);
                return (
                  <div key={m.id} className={`acc ${open ? "open" : ""}`}>
                    <div className="acc-hdr" onClick={() => toggle(m.id)}>
                      <div className={`acc-num ${open ? "on" : ""}`}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <h3 className="f16 fw6 ink mb4">{m.name}</h3>
                        <div className="acc-meta">
                          <span>{I.clock} {m.duration}</span><span>{I.target} {m.sessions} sesiones</span>
                          <span>{I.paperclip} {m.resources.length} recursos</span><span>{I.zap} {m.activities.length} act.</span>
                        </div>
                      </div>
                      <div className={`chev ${open ? "rot" : ""}`}>{I.chevDown}</div>
                    </div>
                    {open && (
                      <div className="acc-body">
                        <p className="sec-text mb24" style={{ lineHeight: 1.7 }}>{m.description}</p>

                        {m.objectives.length > 0 && (
                          <div className="blk">
                            <h4 className="blk-title">{I.target} Objetivos</h4>
                            <div className="obj-grid">{m.objectives.map((o, j) => <div key={j} className="obj-item"><div className="chk-icon">{I.check}</div><span>{o}</span></div>)}</div>
                          </div>
                        )}

                        {m.sessions_detail && m.sessions_detail.length > 0 && (
                          <div className="blk">
                            <h4 className="blk-title">{I.calendar} Sesiones</h4>
                            <div className="sess-list">
                              {m.sessions_detail.map((s, si) => (
                                <div key={s.id} className="sess-card">
                                  <div className="sess-hdr">
                                    <div className="row gap10 ai-c"><span className="sess-num">{si + 1}</span><h5 className="f14 fw6 ink">{s.title}</h5></div>
                                    <div className="row gap12 muted f12"><span>Semana {s.week}</span><span>{s.duration} min</span></div>
                                  </div>
                                  <div className="mb12"><span className="lbl-up">Agenda</span><ul className="agenda">{s.agenda.map((a, ai) => <li key={ai}>{a}</li>)}</ul></div>
                                  {s.homework && <div className="hw-card">{I.clipboard}<div><span className="lbl-up" style={{ color: "#92400E" }}>Tarea</span><p className="f13" style={{ color: "#78350F", margin: "2px 0 0" }}>{s.homework}</p></div></div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {m.resources.length > 0 && (
                          <div className="blk">
                            <h4 className="blk-title">{I.paperclip} Recursos</h4>
                            <div className="res-list">{m.resources.map(r => <ResRow key={r.id} r={r} onView={setViewPdf} onVideo={setViewVideo} />)}</div>
                          </div>
                        )}

                        {m.activities.length > 0 && (
                          <div className="blk">
                            <h4 className="blk-title">{I.zap} Actividades</h4>
                            <div className="act-list">
                              {m.activities.map(a => {
                                const ac = actCfg[a.type] || actCfg.exercise;
                                return (
                                  <div key={a.id} className="act-card">
                                    <div className="act-bar" style={{ background: ac.color }} />
                                    <div className="act-body">
                                      <div className="row gap8 ai-c mb6">
                                        <span className="f14 fw6 ink">{a.name}</span>
                                        <span className="act-type" style={{ background: ac.bg, color: ac.color }}>{ac.label}</span>
                                        {a.required && <span className="req-badge">Requerida</span>}
                                      </div>
                                      <p className="sec-text mb8">{a.description}</p>
                                      <div className="row gap6 ai-c muted f12">{I.clock}<span>{a.duration}</span></div>
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
          </div>
        )}

        {/* CONFIG */}
        {tab === "config" && (
          <div className="cfg-grid fade-in">
            <div className="cfg-card">
              <div className="cfg-hdr"><div className="cfg-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}>{I.users}</div><h3>Requisitos Mentor</h3></div>
              <div className="cfg-rows">
                <CfgRow l="Máx. mentees" v={template.mentorRequirements.maxMentees} />
                <CfgRow l="Experiencia mín." v={`${template.mentorRequirements.minExperienceYears} años`} />
                <CfgRow l="Nivel requerido" v={template.mentorRequirements.requiredLevel} />
                <CfgRow l="Perfil obligatorio" v={template.mentorRequirements.requireProfile} />
                <CfgRow l="LinkedIn obligatorio" v={template.mentorRequirements.requireLinkedIn} />
                {template.mentorRequirements.requiredSkills.length > 0 && (
                  <div className="pt8"><span className="lbl-up">Habilidades requeridas</span>
                    <div className="skills-row">{template.mentorRequirements.requiredSkills.map(s => <span key={s} className="skill-tag">{s}</span>)}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="cfg-card">
              <div className="cfg-hdr"><div className="cfg-icon" style={{ background: "#F5F3FF", color: "#7C3AED" }}>{I.gradCap}</div><h3>Requisitos Mentee</h3></div>
              <div className="cfg-rows">
                <CfgRow l="Puede elegir mentor" v={template.menteeRequirements.canSelectMentor} />
                <CfgRow l="Máx. mentores" v={template.menteeRequirements.maxMentors} />
                <CfgRow l="Objetivos obligatorios" v={template.menteeRequirements.requiredGoals} />
                <CfgRow l="Perfil obligatorio" v={template.menteeRequirements.requireProfile} />
                <CfgRow l="Antigüedad mín." v={`${template.menteeRequirements.minTenure} meses`} />
              </div>
            </div>

            <div className="cfg-card">
              <div className="cfg-hdr"><div className="cfg-icon" style={{ background: "#ECFDF5", color: "#059669" }}>{I.shuffle}</div><h3>Reglas de Matching</h3></div>
              <div className="cfg-rows">
                <CfgRow l="Algoritmo" v={algoLabel[template.matchingRules.algorithm] || template.matchingRules.algorithm} />
                <CfgRow l="Permitir preferencias" v={template.matchingRules.allowPreferences} />
                <div className="pt12">
                  <span className="lbl-up mb10 block">Pesos del algoritmo</span>
                  {[
                    { l: "Habilidades", v: template.matchingRules.weighSkills, c: "#059669" },
                    { l: "Objetivos", v: template.matchingRules.weighGoals, c: "#2563EB" },
                    { l: "Departamento", v: template.matchingRules.weighDepartment, c: "#D97706" },
                    { l: "Seniority", v: template.matchingRules.weighSeniority, c: "#7C3AED" },
                  ].map(w => (
                    <div key={w.l} className="wt-row">
                      <span className="wt-lbl">{w.l}</span>
                      <div className="wt-bar-bg"><div className="wt-bar-fill" style={{ width: `${w.v}%`, background: w.c }} /></div>
                      <span className="wt-val">{w.v}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="cfg-card">
              <div className="cfg-hdr"><div className="cfg-icon" style={{ background: "#FFFBEB", color: "#D97706" }}>{I.calendar}</div><h3>Reglas de Sesiones</h3></div>
              <div className="cfg-rows">
                <CfgRow l="Duración" v={`${template.sessionRules.defaultDuration} min`} />
                <CfgRow l="Frecuencia" v={`${template.sessionRules.frequencyPerMonth}x/mes`} />
                <CfgRow l="Permitir reprogramar" v={template.sessionRules.allowReschedule} />
                <CfgRow l="Máx. reprogramaciones" v={template.sessionRules.maxReschedules} />
                <CfgRow l="Recordatorio" v={`${template.sessionRules.reminderDays} días antes`} />
                <CfgRow l="Agenda obligatoria" v={template.sessionRules.requireAgenda} />
                <CfgRow l="Feedback obligatorio" v={template.sessionRules.requireFeedback} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ PRINT DOCUMENT ═══════ */}
      <div className={`print-doc ${isPrinting ? 'force-show' : ''}`}>
        {/* Cover */}
        <div className="pd-cover">
          <div className="pd-logo">INSPIRATORIA</div>
          <h1 className="pd-title">{template.name}</h1>
          <div className="pd-cat">{cat.label}</div>
          <p className="pd-desc">{template.description}</p>
          <div className="pd-stats-table">
            <table>
              <tbody>
                <tr>
                  {stats.map(s => <td key={s.label}><div className="pd-stat-lbl">{s.label}</div><div className="pd-stat-val">{s.val}</div></td>)}
                </tr>
              </tbody>
            </table>
          </div>
          {template.tags.length > 0 && <div className="pd-tags">{template.tags.map(t => <span key={t}>#{t}</span>)}</div>}
          <div className="pd-meta">
            <span>Estado: {template.status === "published" ? "Publicado" : "Borrador"}</span>
            <span>Slug: /{template.slug}</span>
          </div>
        </div>

        {/* Milestones */}
        {template.milestones.length > 0 && (
          <div className="pd-section">
            <h2 className="pd-sec-title">Hitos del Programa</h2>
            <table className="pd-table">
              <thead><tr><th>#</th><th>Hito</th><th>Semana</th><th>Descripción</th><th>Entregable</th></tr></thead>
              <tbody>
                {template.milestones.map((ms, i) => (
                  <tr key={ms.id}><td className="pd-tc">{i + 1}</td><td className="pd-tb">{ms.name}</td><td className="pd-tc">{ms.week}</td><td>{ms.description}</td><td>{ms.deliverable}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modules (all expanded) */}
        {template.modules.map((m, i) => (
          <div key={m.id} className="pd-section pd-module">
            <div className="pd-mod-hdr">
              <div className="pd-mod-num">{i + 1}</div>
              <div>
                <h2 className="pd-mod-title">{m.name}</h2>
                <div className="pd-mod-meta">{m.duration} · {m.sessions} sesiones · {m.resources.length} recursos · {m.activities.length} actividades</div>
              </div>
            </div>
            <p className="pd-mod-desc">{m.description}</p>

            {m.objectives.length > 0 && (
              <div className="pd-block">
                <h3 className="pd-blk-title">Objetivos</h3>
                <ul className="pd-obj-list">{m.objectives.map((o, j) => <li key={j}>{o}</li>)}</ul>
              </div>
            )}

            {m.sessions_detail && m.sessions_detail.length > 0 && (
              <div className="pd-block">
                <h3 className="pd-blk-title">Sesiones</h3>
                {m.sessions_detail.map((s, si) => (
                  <div key={s.id} className="pd-sess">
                    <div className="pd-sess-hdr">
                      <strong>Sesión {si + 1}: {s.title}</strong>
                      <span>Semana {s.week} · {s.duration} min</span>
                    </div>
                    <div className="pd-sess-body">
                      <div><span className="pd-label">Agenda:</span>
                        <ul className="pd-agenda">{s.agenda.map((a, ai) => <li key={ai}>{a}</li>)}</ul>
                      </div>
                      {s.homework && <div className="pd-hw"><span className="pd-label">Tarea:</span> {s.homework}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {m.resources.length > 0 && (
              <div className="pd-block">
                <h3 className="pd-blk-title">Recursos</h3>
                <table className="pd-table pd-table-sm">
                  <thead><tr><th>Nombre</th><th>Tipo</th><th>Descripción</th></tr></thead>
                  <tbody>{m.resources.map(r => <tr key={r.id}><td className="pd-tb">{r.name}</td><td className="pd-tc">{r.type.toUpperCase()}</td><td>{r.description || '—'}</td></tr>)}</tbody>
                </table>
              </div>
            )}

            {m.activities.length > 0 && (
              <div className="pd-block">
                <h3 className="pd-blk-title">Actividades</h3>
                <table className="pd-table pd-table-sm">
                  <thead><tr><th>Actividad</th><th>Tipo</th><th>Duración</th><th>Requerida</th><th>Descripción</th></tr></thead>
                  <tbody>{m.activities.map(a => {
                    const ac = actCfg[a.type] || actCfg.exercise;
                    return <tr key={a.id}><td className="pd-tb">{a.name}</td><td className="pd-tc">{ac.label}</td><td className="pd-tc">{a.duration}</td><td className="pd-tc">{a.required ? 'Sí' : 'No'}</td><td>{a.description}</td></tr>;
                  })}</tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {/* Configuration */}
        <div className="pd-section">
          <h2 className="pd-sec-title">Configuración del Programa</h2>

          <div className="pd-cfg-grid">
            <div className="pd-cfg-block">
              <h3 className="pd-blk-title">Requisitos Mentor</h3>
              <table className="pd-table pd-table-cfg"><tbody>
                <tr><td>Máx. mentees</td><td className="pd-tb">{template.mentorRequirements.maxMentees}</td></tr>
                <tr><td>Experiencia mín.</td><td className="pd-tb">{template.mentorRequirements.minExperienceYears} años</td></tr>
                <tr><td>Nivel requerido</td><td className="pd-tb">{template.mentorRequirements.requiredLevel}</td></tr>
                <tr><td>Perfil obligatorio</td><td className="pd-tb">{template.mentorRequirements.requireProfile ? 'Sí' : 'No'}</td></tr>
                <tr><td>LinkedIn obligatorio</td><td className="pd-tb">{template.mentorRequirements.requireLinkedIn ? 'Sí' : 'No'}</td></tr>
                {template.mentorRequirements.requiredSkills.length > 0 && <tr><td>Habilidades</td><td className="pd-tb">{template.mentorRequirements.requiredSkills.join(', ')}</td></tr>}
              </tbody></table>
            </div>

            <div className="pd-cfg-block">
              <h3 className="pd-blk-title">Requisitos Mentee</h3>
              <table className="pd-table pd-table-cfg"><tbody>
                <tr><td>Puede elegir mentor</td><td className="pd-tb">{template.menteeRequirements.canSelectMentor ? 'Sí' : 'No'}</td></tr>
                <tr><td>Máx. mentores</td><td className="pd-tb">{template.menteeRequirements.maxMentors}</td></tr>
                <tr><td>Objetivos obligatorios</td><td className="pd-tb">{template.menteeRequirements.requiredGoals ? 'Sí' : 'No'}</td></tr>
                <tr><td>Perfil obligatorio</td><td className="pd-tb">{template.menteeRequirements.requireProfile ? 'Sí' : 'No'}</td></tr>
                <tr><td>Antigüedad mín.</td><td className="pd-tb">{template.menteeRequirements.minTenure} meses</td></tr>
              </tbody></table>
            </div>

            <div className="pd-cfg-block">
              <h3 className="pd-blk-title">Reglas de Matching</h3>
              <table className="pd-table pd-table-cfg"><tbody>
                <tr><td>Algoritmo</td><td className="pd-tb">{algoLabel[template.matchingRules.algorithm] || template.matchingRules.algorithm}</td></tr>
                <tr><td>Permitir preferencias</td><td className="pd-tb">{template.matchingRules.allowPreferences ? 'Sí' : 'No'}</td></tr>
                <tr><td>Peso: Habilidades</td><td className="pd-tb">{template.matchingRules.weighSkills}%</td></tr>
                <tr><td>Peso: Objetivos</td><td className="pd-tb">{template.matchingRules.weighGoals}%</td></tr>
                <tr><td>Peso: Departamento</td><td className="pd-tb">{template.matchingRules.weighDepartment}%</td></tr>
                <tr><td>Peso: Seniority</td><td className="pd-tb">{template.matchingRules.weighSeniority}%</td></tr>
              </tbody></table>
            </div>

            <div className="pd-cfg-block">
              <h3 className="pd-blk-title">Reglas de Sesiones</h3>
              <table className="pd-table pd-table-cfg"><tbody>
                <tr><td>Duración</td><td className="pd-tb">{template.sessionRules.defaultDuration} min</td></tr>
                <tr><td>Frecuencia</td><td className="pd-tb">{template.sessionRules.frequencyPerMonth}x/mes</td></tr>
                <tr><td>Permitir reprogramar</td><td className="pd-tb">{template.sessionRules.allowReschedule ? 'Sí' : 'No'}</td></tr>
                <tr><td>Máx. reprogramaciones</td><td className="pd-tb">{template.sessionRules.maxReschedules}</td></tr>
                <tr><td>Recordatorio</td><td className="pd-tb">{template.sessionRules.reminderDays} días antes</td></tr>
                <tr><td>Agenda obligatoria</td><td className="pd-tb">{template.sessionRules.requireAgenda ? 'Sí' : 'No'}</td></tr>
                <tr><td>Feedback obligatorio</td><td className="pd-tb">{template.sessionRules.requireFeedback ? 'Sí' : 'No'}</td></tr>
              </tbody></table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pd-footer">
          <div>Documento generado por <strong>Inspiratoria</strong></div>
          <div className="pd-footer-date">{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function SectionHead({ icon, bg, color, title, count }: { icon: JSX.Element; bg: string; color: string; title: string; count: number }) {
  return (
    <div className="sec-hdr">
      <div className="sec-icon" style={{ background: bg, color }}>{icon}</div>
      <h2 className="sec-title">{title}</h2>
      <span className="sec-count">{count}</span>
    </div>
  );
}

function ResRow({ r, onView, onVideo }: { r: Resource; onView: (r: Resource) => void; onVideo: (r: Resource) => void }) {
  const ic = resIcon[r.type] || I.fileDoc;
  const cl = resColor[r.type] || "#6B7280";

  const renderActions = () => {
    switch (r.type) {
      case "link":
        return (
          <>
            {r.url && (
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="res-url" title={r.url}>
                {I.globe}<span className="res-url-text">{r.url.replace(/^https?:\/\//, "").slice(0, 40)}{r.url.replace(/^https?:\/\//, "").length > 40 ? "…" : ""}</span>
              </a>
            )}
            {r.url && <button className="btn-sm btn-open" onClick={() => window.open(r.url, "_blank")}>{I.externalLink}<span>Abrir</span></button>}
          </>
        );
      case "video": {
        const embedUrl = getVideoEmbedUrl(r.url || "");
        const hasFile = !!r.dataUrl;
        return (
          <>
            {(embedUrl || hasFile) && <button className="btn-sm btn-play" onClick={() => onVideo(r)}>{I.play}<span>Reproducir</span></button>}
            {!embedUrl && !hasFile && r.url && <button className="btn-sm btn-open" onClick={() => window.open(r.url, "_blank")}>{I.externalLink}<span>Abrir</span></button>}
          </>
        );
      }
      case "pdf":
        return (
          <>
            {hasData(r) && <button className="btn-sm btn-view" onClick={() => onView(r)}>{I.eye}<span>Ver</span></button>}
            {hasData(r) && <button className="btn-sm btn-dl" onClick={() => dlRes(r)}>{I.download}<span>Descargar</span></button>}
          </>
        );
      case "document":
        return (
          <>
            {hasData(r) && <button className="btn-sm btn-view" onClick={() => onView(r)}>{I.eye}<span>Ver</span></button>}
            {hasData(r) && <button className="btn-sm btn-dl" onClick={() => dlRes(r)}>{I.download}<span>Descargar</span></button>}
          </>
        );
      case "template":
        return (
          <>
            {hasData(r) && <button className="btn-sm btn-dl" onClick={() => dlRes(r)}>{I.download}<span>Descargar</span></button>}
          </>
        );
      default:
        return hasData(r) ? <button className="btn-sm btn-dl" onClick={() => dlRes(r)}>{I.download}<span>Descargar</span></button> : null;
    }
  };

  /* inline video preview for embeddable URLs */
  const embedUrl = r.type === "video" ? getVideoEmbedUrl(r.url || "") : null;

  return (
    <div className="res-card-wrap">
      <div className="res-card">
        <div className="res-ic" style={{ background: `${cl}10`, color: cl }}>{ic}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="f14 fw5 ink">{r.name}</div>
          {r.description && <div className="muted f12 mt2">{r.description}</div>}
        </div>
        <div className="row gap8 ai-c" style={{ flexShrink: 0, flexWrap: "wrap" }}>
          {r.size && <span className="muted f12">{r.size}</span>}
          <span className="res-type" style={{ color: cl, background: `${cl}12` }}>{r.type.toUpperCase()}</span>
          {renderActions()}
        </div>
      </div>
      {/* inline video thumbnail for embeddable links */}
      {embedUrl && (
        <div className="res-video-preview" onClick={() => onVideo(r)}>
          <div className="res-video-thumb">
            {getYouTubeThumb(r.url || "") && (
              <img src={getYouTubeThumb(r.url || "") || ""}
                alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <div className="res-video-play">{I.play}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CfgRow({ l, v }: { l: string; v: string | number | boolean }) {
  const d = typeof v === "boolean" ? (v ? <span className="bool-y">Sí</span> : <span className="bool-n">No</span>) : String(v);
  return <div className="cfg-row"><span className="cfg-lbl">{l}</span><span className="cfg-val">{d}</span></div>;
}

// ═══════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════

const CSS = `
.pp{min-height:100vh;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#1e293b}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.spinner{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#1e293b;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto}
.fade-in{animation:fadeIn .3s ease-out}

/* utils */
.row{display:flex}.gap6{gap:6px}.gap8{gap:8px}.gap10{gap:10px}.gap12{gap:12px}.ai-c{align-items:center}.jc-sb{justify-content:space-between}.jc-end{justify-content:flex-end}
.mb2{margin-bottom:2px}.mb4{margin-bottom:4px}.mb8{margin-bottom:8px}.mb10{margin-bottom:10px}.mb12{margin-bottom:12px}.mb14{margin-bottom:14px}.mb20{margin-bottom:20px}.mb24{margin-bottom:24px}.mt2{margin-top:2px}.mt12{margin-top:12px}.pt8{padding-top:8px}.pt12{padding-top:12px}.block{display:block}
.f12{font-size:12px}.f13{font-size:13px}.f14{font-size:14px}.f15{font-size:15px}.f16{font-size:16px}.f22{font-size:22px}
.fw5{font-weight:500}.fw6{font-weight:600}.fw7{font-weight:700}
.ink{color:#1e293b}.muted{color:#94a3b8}.sec-text{font-size:14px;color:#64748b;line-height:1.6}

/* btns */
.btn-primary{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;background:#1e293b;color:#fff;border-radius:10px;border:none;cursor:pointer;font-size:14px;font-weight:600;transition:all .15s}
.btn-primary:hover{background:#0f172a;transform:translateY(-1px)}
.btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:transparent;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:#475569;transition:all .15s}
.btn-ghost:hover{background:#f1f5f9;border-color:#cbd5e1}
.btn-sm{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;transition:all .15s}
.btn-sm:hover{background:#f8fafc}
.btn-view{color:#2563eb}.btn-view:hover{border-color:#93c5fd;background:#eff6ff}
.btn-dl{color:#059669}.btn-dl:hover{border-color:#6ee7b7;background:#ecfdf5}

/* status */
.status-pill{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:.02em}
.status-pill.published{background:#dcfce7;color:#166534}
.status-pill.draft{background:#fef9c3;color:#854d0e}

/* topbar */
.topbar{background:#fff;border-bottom:1px solid #e2e8f0;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}

/* hero */
.hero{color:#fff;padding:56px 24px 48px}
.hero-in{max-width:1000px;margin:0 auto}
.hero-title{font-size:40px;font-weight:800;letter-spacing:-.02em;line-height:1.15;margin-bottom:14px}
.hero-desc{font-size:16px;color:rgba(255,255,255,.85);line-height:1.7;max-width:720px}
.cat-pill{padding:5px 16px;border-radius:20px;font-size:13px;font-weight:600;background:rgba(255,255,255,.2);color:#fff;backdrop-filter:blur(4px)}
.slug-code{font-size:13px;color:rgba(255,255,255,.45);font-family:monospace}
.stats-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:36px}
.stat-card{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:14px 18px;transition:background .2s}
.stat-card:hover{background:rgba(255,255,255,.18)}
.stat-icon{opacity:.9}
.stat-lbl{font-size:11px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.stat-val{font-size:22px;font-weight:800;margin-top:2px}
.tags-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}
.tag{padding:4px 14px;border-radius:20px;font-size:13px;font-weight:500;background:rgba(255,255,255,.15);color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.1)}

/* tabs */
.tabs-bar{background:#fff;border-bottom:1px solid #e2e8f0;position:sticky;top:49px;z-index:40}
.tabs-in{max-width:1000px;margin:0 auto;display:flex}
.tab-btn{display:flex;align-items:center;gap:8px;padding:16px 22px;border:none;border-bottom:2px solid transparent;background:transparent;cursor:pointer;font-size:14px;font-weight:500;color:#94a3b8;transition:all .2s}
.tab-btn:hover{color:#64748b}
.tab-btn.on{color:#1e293b;font-weight:600;border-bottom-color:#1e293b}

/* content */
.content{max-width:1000px;margin:0 auto;padding:36px 24px 80px}

/* sections */
.sec{margin-bottom:44px}
.sec-hdr{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.sec-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sec-title{font-size:18px;font-weight:700;color:#1e293b}
.sec-count{background:#f1f5f9;color:#64748b;font-size:12px;font-weight:700;padding:2px 10px;border-radius:20px}

/* timeline */
.timeline{position:relative;padding-left:36px}
.timeline::before{content:'';position:absolute;left:14px;top:8px;bottom:8px;width:2px;background:linear-gradient(to bottom,#e2e8f0,#f1f5f9)}
.tl-item{position:relative;margin-bottom:20px}
.tl-dot{position:absolute;left:-36px;top:4px;width:28px;height:28px;border-radius:50%;background:#1e293b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;z-index:1;box-shadow:0 0 0 4px #f8fafc}
.tl-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;transition:all .15s}
.tl-card:hover{border-color:#cbd5e1;box-shadow:0 2px 8px rgba(0,0,0,.04)}
.badge-n{font-size:12px;font-weight:600;color:#64748b;background:#f1f5f9;padding:4px 12px;border-radius:20px}

/* module cards */
.mod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.mod-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:22px;cursor:pointer;transition:all .2s}
.mod-card:hover{border-color:#cbd5e1;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.06)}
.mod-num{width:36px;height:36px;border-radius:10px;background:#f1f5f9;color:#64748b;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0}
.mod-desc{font-size:13px;color:#64748b;line-height:1.6;margin-bottom:14px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.mod-meta{display:flex;gap:16px;font-size:12px;color:#94a3b8}.mod-meta span{display:flex;align-items:center;gap:4px}

/* resources */
.res-list{display:grid;gap:8px}
.res-card{display:flex;align-items:center;gap:14px;padding:14px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;transition:all .15s}
.res-card:hover{border-color:#cbd5e1;box-shadow:0 2px 8px rgba(0,0,0,.03)}
.res-ic{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.res-type{font-size:10px;font-weight:700;text-transform:uppercase;padding:3px 8px;border-radius:5px;letter-spacing:.04em}
.empty{text-align:center;padding:48px;color:#94a3b8;background:#fff;border:1px dashed #e2e8f0;border-radius:12px;font-size:14px}

/* accordions */
.acc-list{display:grid;gap:12px}
.acc{border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;background:#fff}
.acc.open{box-shadow:0 4px 16px rgba(0,0,0,.05)}
.acc-hdr{display:flex;align-items:center;gap:16px;padding:18px 22px;cursor:pointer;transition:background .15s}
.acc-hdr:hover{background:#f8fafc}
.acc-num{width:44px;height:44px;border-radius:12px;background:#f1f5f9;color:#64748b;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;transition:all .2s;flex-shrink:0}
.acc-num.on{background:#1e293b;color:#fff}
.acc-meta{display:flex;gap:16px;font-size:13px;color:#94a3b8}.acc-meta span{display:flex;align-items:center;gap:4px}
.chev{transition:transform .25s;color:#94a3b8}.chev.rot{transform:rotate(180deg)}
.acc-body{padding:4px 22px 28px;border-top:1px solid #f1f5f9}

/* content blocks */
.blk{margin-bottom:28px}
.blk-title{font-size:14px;font-weight:600;color:#1e293b;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.obj-grid{display:grid;gap:8px}
.obj-item{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:#f8fafc;border-radius:8px;font-size:13px;color:#475569;line-height:1.5}
.chk-icon{color:#059669;flex-shrink:0;margin-top:1px}

/* sessions */
.sess-list{display:grid;gap:14px}
.sess-card{border:1px solid #e2e8f0;border-radius:12px;padding:18px;background:#fff}
.sess-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.sess-num{width:26px;height:26px;border-radius:7px;background:#f1f5f9;color:#64748b;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.lbl-up{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;display:block}
.agenda{margin:8px 0 0 18px;padding:0}.agenda li{font-size:13px;color:#475569;margin-bottom:5px;line-height:1.5}
.hw-card{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;background:#FFFBEB;border-radius:10px;border:1px solid #FEF3C7;color:#92400E;margin-top:10px}

/* activities */
.act-list{display:grid;gap:10px}
.act-card{display:flex;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#fff;transition:all .15s}
.act-card:hover{border-color:#cbd5e1}
.act-bar{width:4px;flex-shrink:0}
.act-body{flex:1;padding:14px 16px}
.act-type{font-size:11px;font-weight:600;padding:2px 10px;border-radius:20px}
.req-badge{font-size:10px;font-weight:700;color:#dc2626;background:#fef2f2;padding:2px 8px;border-radius:4px}

/* config */
.cfg-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media(max-width:768px){.cfg-grid{grid-template-columns:1fr}}
.cfg-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:24px;transition:all .15s}
.cfg-card:hover{box-shadow:0 4px 12px rgba(0,0,0,.04)}
.cfg-hdr{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.cfg-hdr h3{font-size:16px;font-weight:700;color:#1e293b}
.cfg-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center}
.cfg-rows{display:grid;gap:4px}
.cfg-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9}
.cfg-row:last-child{border-bottom:none}
.cfg-lbl{font-size:14px;color:#64748b}
.cfg-val{font-size:14px;font-weight:600;color:#1e293b}
.bool-y{color:#059669;font-weight:600}
.bool-n{color:#dc2626;font-weight:600}
.skills-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.skill-tag{padding:4px 12px;background:#f1f5f9;border-radius:6px;font-size:12px;color:#475569;font-weight:500}
.wt-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.wt-lbl{font-size:13px;color:#64748b;width:100px}
.wt-bar-bg{flex:1;background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden}
.wt-bar-fill{height:100%;border-radius:4px;transition:width .5s ease}
.wt-val{font-size:13px;font-weight:700;color:#475569;width:36px;text-align:right}

/* pdf modal */
.modal-bg{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center}
.pdf-modal{width:92vw;height:90vh;max-width:1200px;background:#fff;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.2)}
.pdf-hdr{padding:14px 22px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between}
.video-modal{width:92vw;height:80vh;max-width:960px;background:#fff;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.2)}

/* resource link/video extras */
.res-card-wrap{display:grid;gap:0}
.res-url{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#6366f1;text-decoration:none;max-width:240px;overflow:hidden}
.res-url:hover{text-decoration:underline;color:#4f46e5}
.res-url-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.btn-open{color:#6366f1}.btn-open:hover{border-color:#a5b4fc;background:#eef2ff}
.btn-play{color:#2563eb}.btn-play:hover{border-color:#93c5fd;background:#eff6ff}
.res-video-preview{padding:8px 16px 14px 70px;cursor:pointer}
.res-video-thumb{position:relative;width:200px;height:112px;border-radius:8px;overflow:hidden;background:#0f172a;border:1px solid #e2e8f0;transition:all .2s}
.res-video-thumb:hover{border-color:#93c5fd;box-shadow:0 4px 16px rgba(37,99,235,.15)}
.res-video-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);color:#fff;transition:background .2s}
.res-video-thumb:hover .res-video-play{background:rgba(0,0,0,.5)}

/* print doc (hidden on screen) */
.print-doc{display:none}
.print-doc.force-show{display:block}

/* print */
@media print{
  body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  *{box-shadow:none!important}
  .no-print,.topbar,.tabs-bar,.modal-bg{display:none!important}
  .hero,.content,.tabs-bar{display:none!important}
  .print-doc,.print-doc.force-show{display:block!important}
  .pp{background:#fff!important;min-height:auto}

  /* Cover */
  .pd-cover{text-align:center;padding:60px 40px 40px;border-bottom:3px solid #1e293b;margin-bottom:0;page-break-after:always}
  .pd-logo{font-size:14px;font-weight:800;letter-spacing:.3em;text-transform:uppercase;color:#94a3b8;margin-bottom:48px}
  .pd-title{font-size:36px;font-weight:800;color:#1e293b;line-height:1.2;margin-bottom:12px}
  .pd-cat{display:inline-block;font-size:13px;font-weight:600;color:#1e293b;border:2px solid #1e293b;border-radius:20px;padding:4px 20px;margin-bottom:24px}
  .pd-desc{font-size:15px;color:#475569;line-height:1.7;max-width:600px;margin:0 auto 36px}
  .pd-stats-table{margin:0 auto 28px;max-width:700px}
  .pd-stats-table table{width:100%;border-collapse:collapse}
  .pd-stats-table td{text-align:center;padding:14px 8px;border:1px solid #e2e8f0}
  .pd-stat-lbl{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em}
  .pd-stat-val{font-size:24px;font-weight:800;color:#1e293b;margin-top:4px}
  .pd-tags{margin-bottom:20px}
  .pd-tags span{display:inline-block;font-size:12px;color:#64748b;margin:0 6px;font-weight:500}
  .pd-meta{font-size:12px;color:#94a3b8;margin-top:20px}
  .pd-meta span{margin:0 12px}

  /* Sections */
  .pd-section{padding:28px 40px;page-break-inside:avoid}
  .pd-sec-title{font-size:22px;font-weight:800;color:#1e293b;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #e2e8f0}

  /* Tables */
  .pd-table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px}
  .pd-table th{text-align:left;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;font-weight:700;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:.03em}
  .pd-table td{padding:10px 12px;border:1px solid #e2e8f0;color:#334155;line-height:1.5;vertical-align:top}
  .pd-table-sm{font-size:12px}
  .pd-table-sm th,.pd-table-sm td{padding:8px 10px}
  .pd-tc{text-align:center;font-weight:600}
  .pd-tb{font-weight:600;color:#1e293b}
  .pd-table-cfg{max-width:100%}
  .pd-table-cfg td:first-child{color:#64748b;width:55%}
  .pd-table-cfg td:last-child{text-align:right}

  /* Modules */
  .pd-module{page-break-inside:avoid;border-top:1px solid #e2e8f0}
  .pd-mod-hdr{display:flex;align-items:center;gap:16px;margin-bottom:14px}
  .pd-mod-num{width:40px;height:40px;border-radius:50%;background:#1e293b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0}
  .pd-mod-title{font-size:20px;font-weight:700;color:#1e293b;margin:0}
  .pd-mod-meta{font-size:12px;color:#94a3b8;margin-top:2px}
  .pd-mod-desc{font-size:14px;color:#475569;line-height:1.7;margin-bottom:20px}

  /* Blocks */
  .pd-block{margin-bottom:20px;page-break-inside:avoid}
  .pd-blk-title{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:10px;text-transform:uppercase;letter-spacing:.03em}
  .pd-obj-list{margin:0 0 0 20px;padding:0}
  .pd-obj-list li{font-size:13px;color:#475569;margin-bottom:6px;line-height:1.5}
  .pd-obj-list li::marker{color:#059669}

  /* Sessions */
  .pd-sess{border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:10px;page-break-inside:avoid}
  .pd-sess-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
  .pd-sess-hdr strong{font-size:14px;color:#1e293b}
  .pd-sess-hdr span{font-size:12px;color:#94a3b8}
  .pd-sess-body{font-size:13px;color:#475569}
  .pd-label{font-weight:700;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  .pd-agenda{margin:6px 0 0 20px;padding:0}
  .pd-agenda li{margin-bottom:4px;line-height:1.5}
  .pd-hw{margin-top:10px;padding:10px 14px;background:#FFFBEB;border:1px solid #FEF3C7;border-radius:6px;font-size:13px}

  /* Config grid */
  .pd-cfg-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
  .pd-cfg-block{page-break-inside:avoid}

  /* Footer */
  .pd-footer{text-align:center;padding:24px 40px;border-top:2px solid #e2e8f0;margin-top:20px;font-size:13px;color:#94a3b8}
  .pd-footer-date{margin-top:4px;font-size:12px}
}

/* responsive */
@media(max-width:640px){.hero-title{font-size:28px}.stats-row{gap:8px}.stat-card{padding:10px 14px}.stat-val{font-size:18px}.mod-grid{grid-template-columns:1fr}.tabs-in{overflow-x:auto}.tab-btn{padding:14px 16px;white-space:nowrap}}
`;
