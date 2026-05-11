"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Breakdown {
  weight: number;
  earned: number;
  ratio: number;
  matches: string[];
  label: string;
  level_gap?: number | null;
  mentor_level?: string | null;
  mentee_level?: string | null;
}

interface MatchResult {
  score: number;
  raw_score: number;
  attenuation: number;
  mentor_profile_strength: number;
  mentee_profile_strength: number;
  breakdown: Record<string, Breakdown>;
  matched_keywords: string[];
  reasons: string[];
  ai_recommendation?: string;
  mentor: {
    id: string; name: string; email: string; headline: string;
    position: string; department: string;
    skills: string[]; topics: string[]; style: string[];
    experience_level: string; experience_area: string[];
  };
  mentee: {
    id: string; name: string; email: string; headline: string;
    position: string; department: string;
    goals: string[]; interests: string[]; challenges: string[];
    expectations: string[]; preferred_style: string[];
    experience_level: string;
  };
}

interface ApiResponse {
  results: MatchResult[];
  stats: { mentors: number; mentees: number; pairs: number; returned: number; min_score: number };
}

interface Program {
  id: string;
  name: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const scoreColor = (s: number) => {
  if (s >= 70) return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" };
  if (s >= 50) return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", bar: "bg-amber-500" };
  if (s >= 30) return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", bar: "bg-orange-500" };
  return { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", bar: "bg-rose-400" };
};

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
    {children}
  </span>
);

export default function IntelligentMatchPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState<string>("");
  const [topK, setTopK] = useState(10);
  const [minScore, setMinScore] = useState(0);
  const [useAI, setUseAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  // Activación de match → vinculación. Map por par mentor↔mentee.
  type ActivationState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "done"; vinculationId: number; alreadyExisted?: boolean }
    | { status: "error"; message: string };
  const [activations, setActivations] = useState<Record<string, ActivationState>>({});

  const PROGRESS_STEPS = [
    { p: 12, label: "Cargando perfiles enriquecidos de mentores y mentees…", icon: "📥" },
    { p: 28, label: "Tokenizando skills, temas, objetivos y challenges…", icon: "🔤" },
    { p: 45, label: "Cruzando skills × goals y topics × challenges…", icon: "🔗" },
    { p: 62, label: "Evaluando estilo de mentoría y nivel de experiencia…", icon: "🎯" },
    { p: 78, label: "Aplicando ponderación multi-dimensional (6 ejes)…", icon: "⚖️" },
    { p: 90, label: useAI ? "Generando explicación con Gemini…" : "Atenuando por completitud de perfil…", icon: useAI ? "🤖" : "📊" },
    { p: 100, label: "Ranking final listo", icon: "✅" },
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.replace("/login/admin");
      return;
    }
    try {
      const u = JSON.parse(userStr);
      const allowed = ["admin_root", "inspiratoria_admin", "superadmin", "admin", "coordinator"];
      if (!allowed.includes(u.role)) {
        router.replace("/dashboard");
        return;
      }
      setUser(u);
    } catch {
      router.replace("/login/admin");
    }
  }, [router]);

  // Load programs (best effort)
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    fetch(`${API}/api/programs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (Array.isArray(list)) setPrograms(list);
      })
      .catch(() => {});
  }, []);

  const runMatch = async () => {
    setLoading(true);
    setError("");
    setData(null);
    setProgress(0);
    setStepIndex(0);

    // Kick off the real request in parallel with the animated progress
    const fetchPromise = fetch(`${API}/api/matches/intelligent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        program_id: programId || null,
        top_k: topK,
        min_score: minScore,
        use_ai: useAI,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }
        return (await res.json()) as ApiResponse;
      });

    // Animate progress through the first 6 steps (~700ms each)
    try {
      for (let i = 0; i < PROGRESS_STEPS.length - 1; i++) {
        setStepIndex(i);
        setProgress(PROGRESS_STEPS[i].p);
        // small variation: AI step a bit longer
        const delay = PROGRESS_STEPS[i].label.includes("Gemini") ? 1100 : 700;
        await new Promise((r) => setTimeout(r, delay));
      }

      // Wait for the real result if not done yet
      const json = await fetchPromise;

      // Final step
      setStepIndex(PROGRESS_STEPS.length - 1);
      setProgress(100);
      await new Promise((r) => setTimeout(r, 350));

      setData(json);
    } catch (e: any) {
      setError(e?.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const activatePair = async (r: MatchResult) => {
    if (!programId) {
      setActivations((prev) => ({
        ...prev,
        [`${r.mentor.id}-${r.mentee.id}`]: {
          status: "error",
          message: "Selecciona primero un programa para crear la vinculación",
        },
      }));
      return;
    }
    const key = `${r.mentor.id}-${r.mentee.id}`;
    setActivations((prev) => ({ ...prev, [key]: { status: "loading" } }));
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const res = await fetch(`${API}/api/matches/intelligent/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          program_id: programId,
          mentor_user_id: r.mentor.id,
          mentee_user_id: r.mentee.id,
          score: r.score,
          breakdown: r.breakdown,
          matched_keywords: r.matched_keywords,
          reasons: r.reasons,
          ai_recommendation: r.ai_recommendation,
          vinculation_type: "mentoria",
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.detail || `HTTP ${res.status}`);
      }
      setActivations((prev) => ({
        ...prev,
        [key]: {
          status: "done",
          vinculationId: body.vinculation_id,
          alreadyExisted: body.status === "already_exists",
        },
      }));
    } catch (err: any) {
      setActivations((prev) => ({
        ...prev,
        [key]: { status: "error", message: err?.message || "Error al activar" },
      }));
    }
  };

  const stats = data?.stats;
  const results = data?.results || [];

  const summary = useMemo(() => {
    if (!results.length) return null;
    const scores = results.map((r) => r.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const high = scores.filter((s) => s >= 70).length;
    return { avg: avg.toFixed(1), high, total: scores.length };
  }, [results]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Match Inteligente</h1>
            <p className="text-xs text-gray-500">
              Algoritmo multi-dimensional sobre perfiles enriquecidos · skills, temas, estilo, experiencia, objetivos
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            ← Volver al dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* Controls */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Programa (opcional)
              </label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              >
                <option value="">Todos los mentores y mentees activos</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Top K
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={topK}
                onChange={(e) => setTopK(Math.max(1, Math.min(50, Number(e.target.value) || 10)))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Score mínimo
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                IA Gemini
              </label>
              <label className="flex h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Explicación IA
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {stats
                ? `Universo: ${stats.mentors} mentores × ${stats.mentees} mentees = ${stats.pairs} pares`
                : "Pulsa «Generar matches» para ranquear todos los pares posibles."}
            </p>
            <button
              onClick={runMatch}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Analizando perfiles…
                </>
              ) : (
                <>✨ Generar matches</>
              )}
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* AI processing animation */}
        {loading && (
          <section className="overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl text-white shadow-md">
                <span className="animate-pulse">{PROGRESS_STEPS[stepIndex]?.icon || "✨"}</span>
                <span className="absolute inset-0 animate-ping rounded-2xl bg-indigo-400 opacity-20" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">
                    Inspiratoria AI · Motor de matching multi-dimensional
                  </p>
                  <span className="text-xs font-mono text-indigo-600">{progress}%</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-600">
                  {PROGRESS_STEPS[stepIndex]?.label || "Preparando…"}
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-indigo-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <ul className="mt-5 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
              {PROGRESS_STEPS.slice(0, 6).map((s, i) => {
                const done = i < stepIndex || progress === 100;
                const active = i === stepIndex && progress < 100;
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                      done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : active
                        ? "border-indigo-300 bg-white text-indigo-700 shadow-sm"
                        : "border-gray-200 bg-white/50 text-gray-400"
                    }`}
                  >
                    <span className="text-base">{done ? "✓" : active ? s.icon : "•"}</span>
                    <span className="truncate font-medium">{s.label.replace(/…$/, "")}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Summary */}
        {summary && (
          <section className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Suggesties</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{summary.total}</p>
              <p className="text-xs text-gray-500">resultados rankeados</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Score promedio</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{summary.avg}</p>
              <p className="text-xs text-gray-500">de 100</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Match alto (≥70)</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{summary.high}</p>
              <p className="text-xs text-gray-500">recomendados directamente</p>
            </div>
          </section>
        )}

        {/* Results */}
        {results.length > 0 && (
          <section className="space-y-4">
            {results.map((r, idx) => {
              const c = scoreColor(r.score);
              return (
                <div
                  key={`${r.mentor.id}-${r.mentee.id}`}
                  className={`rounded-2xl border ${c.border} bg-white p-5 shadow-sm`}
                >
                  {/* Header row */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-1 items-start gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${c.bg} text-lg font-bold ${c.text}`}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">{r.mentor.name}</span>
                          <span className="text-gray-400">↔</span>
                          <span className="text-base font-semibold text-gray-900">{r.mentee.name}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {r.mentor.position || "Mentor"} · {r.mentor.department || "—"}
                          {"   →   "}
                          {r.mentee.position || "Mentee"} · {r.mentee.department || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`rounded-xl ${c.bg} px-4 py-2 text-right`}>
                        <p className={`text-2xl font-bold ${c.text}`}>{r.score.toFixed(1)}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">/ 100</p>
                      </div>
                      {(() => {
                        const key = `${r.mentor.id}-${r.mentee.id}`;
                        const st = activations[key] || { status: "idle" as const };
                        if (st.status === "done") {
                          return (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                              ✓ {st.alreadyExisted ? "Ya vinculados" : "Vinculación activa"}
                              <span className="text-[10px] font-normal text-emerald-600">#{st.vinculationId}</span>
                            </span>
                          );
                        }
                        if (st.status === "loading") {
                          return (
                            <button disabled className="inline-flex items-center gap-2 rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
                              Activando…
                            </button>
                          );
                        }
                        return (
                          <button
                            onClick={() => activatePair(r)}
                            disabled={!programId}
                            title={!programId ? "Selecciona un programa primero" : "Crear vinculación activa entre estos participantes"}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            ⚡ Activar match
                          </button>
                        );
                      })()}
                      {(() => {
                        const key = `${r.mentor.id}-${r.mentee.id}`;
                        const st = activations[key];
                        if (st?.status === "error") {
                          return <span className="max-w-[180px] text-right text-[11px] text-rose-600">{st.message}</span>;
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Breakdown bars */}
                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {Object.entries(r.breakdown).map(([key, b]) => {
                      const pct = b.weight > 0 ? (b.earned / b.weight) * 100 : 0;
                      const barColor = scoreColor(pct).bar;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-gray-700">{b.label}</span>
                            <span className="text-gray-500">{b.earned.toFixed(1)} / {b.weight}</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                            <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                          {b.matches && b.matches.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {b.matches.slice(0, 4).map((m) => (
                                <Pill key={m}>{m}</Pill>
                              ))}
                              {b.matches.length > 4 && (
                                <span className="text-[11px] text-gray-400">+{b.matches.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Reasons */}
                  {r.reasons && r.reasons.length > 0 && (
                    <div className="mt-5 rounded-xl bg-gray-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Razones</p>
                      <ul className="mt-1.5 space-y-1 text-xs text-gray-700">
                        {r.reasons.map((reason, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-gray-400">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI rec */}
                  {r.ai_recommendation && (
                    <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-700">
                        🤖 Análisis IA (Gemini)
                      </p>
                      <p className="mt-1 text-xs italic text-violet-900">{r.ai_recommendation}</p>
                    </div>
                  )}

                  {/* Profile preview */}
                  <details className="mt-4 group">
                    <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-900">
                      Ver perfiles enfrentados ▾
                    </summary>
                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <ProfileCard title="Mentor" name={r.mentor.name} headline={r.mentor.headline}
                        rows={[
                          { k: "Skills", v: r.mentor.skills },
                          { k: "Temas", v: r.mentor.topics },
                          { k: "Estilo", v: r.mentor.style },
                          { k: "Áreas", v: r.mentor.experience_area },
                          { k: "Nivel", v: r.mentor.experience_level ? [r.mentor.experience_level] : [] },
                        ]}
                      />
                      <ProfileCard title="Mentee" name={r.mentee.name} headline={r.mentee.headline}
                        rows={[
                          { k: "Goals", v: r.mentee.goals },
                          { k: "Intereses", v: r.mentee.interests },
                          { k: "Desafíos", v: r.mentee.challenges },
                          { k: "Expectativas", v: r.mentee.expectations },
                          { k: "Estilo preferido", v: r.mentee.preferred_style },
                          { k: "Nivel", v: r.mentee.experience_level ? [r.mentee.experience_level] : [] },
                        ]}
                      />
                    </div>
                  </details>
                </div>
              );
            })}
          </section>
        )}

        {!loading && data && results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-sm text-gray-500">
              No se encontraron pares en este alcance. Comprueba que existan usuarios con role=mentor y role=mentee.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function ProfileCard({
  title, name, headline, rows,
}: {
  title: string; name: string; headline: string;
  rows: { k: string; v: string[] }[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{title}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{name}</p>
      {headline && <p className="text-xs text-gray-500">{headline}</p>}
      <div className="mt-2 space-y-1.5">
        {rows.filter((r) => r.v && r.v.length > 0).map((r) => (
          <div key={r.k}>
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{r.k}</p>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {r.v.map((x) => (
                <span key={x} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                  {x}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
