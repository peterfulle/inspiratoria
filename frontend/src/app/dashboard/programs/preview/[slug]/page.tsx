"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ProgramTemplate } from "../../types";
import { apiFetch } from "@/lib/api";
import ProgramPreviewView from "../ProgramPreviewView";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const search = <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const arrowLeft = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>;

export default function ProgramPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [template, setTemplate] = useState<ProgramTemplate | null>(null);
  const [assignedPrograms, setAssignedPrograms] = useState<Array<{ id: string; name: string; status: string; company?: { name: string; slug?: string } | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch(`${API_URL}/api/program-templates?include_files=true`);
        if (r.ok) {
          const all: ProgramTemplate[] = await r.json();
          const found = all.find(t => t.slug === slug) || null;
          setTemplate(found);
          // Programas reales instanciados desde esta plantilla
          if (found?.id) {
            try {
              const pr = await apiFetch(`${API_URL}/api/programs?template_id=${found.id}`);
              if (pr.ok) setAssignedPrograms(await pr.json());
            } catch {}
          }
        }
      } catch (e) { console.warn("Fetch error", e); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#1e293b", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto" }} />
        <p style={{ marginTop: 12, color: "#94a3b8", fontSize: 14, fontWeight: 500 }}>Cargando programa...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (!template) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ marginBottom: 24 }}>{search}</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Programa no encontrado</h2>
        <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 24 }}>No existe un programa con el identificador &quot;{slug}&quot;</p>
        <button onClick={() => router.push("/dashboard/programs")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", background: "#1e293b", color: "#fff", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>{arrowLeft}<span>Volver a Programas</span></button>
      </div>
    </div>
  );

  return (
    <ProgramPreviewView
      template={template}
      assignedPrograms={assignedPrograms}
      onBack={() => router.push("/dashboard/programs")}
    />
  );
}
