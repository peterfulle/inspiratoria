"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

/**
 * "Mi avance" — sección REAL conectada a la BD para el dashboard de mentor/mentee.
 * Lee el usuario logueado de localStorage y trae sus duplas + progreso real
 * (sesiones completadas, asistencia, ánimo, próximas sesiones, temas).
 * Si el usuario no tiene duplas reales, no renderiza nada (deja el resto intacto).
 */
export default function MyProgressSection({ title = "Mi avance" }: { title?: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u?.id) setUid(u.id);
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const r = await apiFetch(`${API}/api/programs/my-progress/${uid}`);
        if (r.ok) setItems(await r.json());
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  if (loading || items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[18px] font-semibold text-zinc-900 tracking-tight">{title}</h2>
        <span className="text-[12px] text-zinc-400">{items.length} {items.length === 1 ? "dupla" : "duplas"} · datos en vivo</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <ProgressCard key={it.vinculation_id} it={it} />
        ))}
      </div>
    </section>
  );
}

function ProgressCard({ it }: { it: any }) {
  const m = it.metrics || {};
  const cp = it.counterpart || {};
  const initial = (cp.name || cp.email || "?").charAt(0).toUpperCase();
  const roleLabel = it.role === "mentor" ? "Tu mentee" : "Tu mentor";

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-[15px] font-semibold text-white flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{roleLabel}</div>
            <div className="text-[14px] font-semibold text-zinc-900 truncate">{cp.name || cp.email}</div>
            <div className="text-[11.5px] text-zinc-400 truncate">{it.program?.name}</div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[24px] font-bold text-blue-600 leading-none">{m.progress ?? 0}%</div>
          <div className="text-[10px] text-zinc-400 mt-1">avance</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden mb-4">
        <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${m.progress ?? 0}%` }} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat value={`${m.completed ?? 0}/${m.total_sessions ?? 0}`} label="sesiones" />
        <Stat value={m.attendance != null ? `${Math.round(m.attendance * 100)}%` : "—"} label="asistencia" />
        <Stat value={m.avg_mood != null ? `${m.avg_mood}/5` : "—"} label="ánimo" />
      </div>

      <div className="flex items-center justify-between text-[11.5px] text-zinc-500 border-t border-zinc-100 pt-3">
        <span>{m.last_session ? `Última: ${fmt(m.last_session)}` : "Sin sesiones aún"}</span>
        {m.next_session ? (
          <span className="font-semibold text-zinc-700">Próxima: {fmt(m.next_session)}</span>
        ) : (
          <span className="text-zinc-400">{m.total_hours ?? 0} h totales</span>
        )}
      </div>

      {Array.isArray(m.topics) && m.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {m.topics.slice(0, 6).map((t: string, i: number) => (
            <span key={i} className="inline-flex px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-zinc-100 text-zinc-600">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center rounded-lg bg-zinc-50 py-2">
      <div className="text-[15px] font-semibold text-zinc-900 leading-none">{value}</div>
      <div className="text-[10px] text-zinc-400 mt-1">{label}</div>
    </div>
  );
}
