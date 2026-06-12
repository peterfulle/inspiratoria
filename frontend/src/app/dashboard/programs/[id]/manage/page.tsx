"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Consola unificada de programa.
 *
 * Antes existían DOS consolas para el mismo Program:
 *   - /dashboard/programs/[id]/manage   (esta)
 *   - /studio/[slug]/program/[programId] (superset: estados, PM, participantes,
 *     invitaciones, matching/vinculaciones, actividades)
 *
 * Para evitar duplicación y tener una sola fuente de verdad, esta ruta ahora
 * resuelve la empresa del programa y redirige a la consola de Studio.
 */
export default function ManageProgramRedirect() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
    (async () => {
      try {
        const res = await fetch(`${API}/api/programs/${programId}`);
        if (!res.ok) throw new Error("No se pudo cargar el programa");
        const data = await res.json();
        const slug = data?.company?.slug;
        if (slug) {
          router.replace(`/studio/${slug}/program/${programId}`);
        } else {
          // Programa sin empresa: no hay contexto de studio, volver al listado
          router.replace("/dashboard/programs?tab=programs");
        }
      } catch (e: any) {
        setError(e.message || "Error al abrir el programa");
      }
    })();
  }, [programId, router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12 }}>
      {error ? (
        <>
          <p style={{ color: "#b91c1c", fontSize: 14 }}>{error}</p>
          <button onClick={() => router.push("/dashboard/programs?tab=programs")} className="btn-primary px-4 py-2 text-[13px]">
            Volver a programas
          </button>
        </>
      ) : (
        <>
          <div style={{ width: 24, height: 24, border: "3px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: "#6b7280", fontSize: 14 }}>Abriendo consola del programa…</span>
        </>
      )}
    </div>
  );
}
