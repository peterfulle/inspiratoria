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

  // Manual pairing
  type ParticipantOpt = { id: string; user_id: string; name: string; email: string; role: string };
  const [participants, setParticipants] = useState<ParticipantOpt[]>([]);
  const [manualMentorId, setManualMentorId] = useState<string>("");
  const [manualMenteeId, setManualMenteeId] = useState<string>("");
  const [manualState, setManualState] = useState<ActivationState>({ status: "idle" });

  const PROGRESS_STEPS = [
    { p: 12, label: "Cargando perfiles enriquecidos de mentores y mentees…", icon: "📥" },
    { p: 28, label: "Tokenizando skills, temas, objetivos y challenges…", icon: "🔤" },
    { p: 45, label: "Cruzando skills × goals y topics × challenges…", icon: "🔗" },
    { p: 62, label: "Evaluando estilo de mentoría y nivel de experiencia…", icon: "🎯" },
    { p: 78, label: "Aplicando ponderación multi-dimensional (6 ejes)…", icon: "⚖️" },
    { p: 90, label: useAI ? "Generando análisis semántico con Claude…" : "Atenuando por completitud de perfil…", icon: useAI ? "✨" : "📊" },
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

  // Cargar participantes cada vez que cambia el programa
  useEffect(() => {
    if (!programId) {
      setParticipants([]);
      setManualMentorId("");
      setManualMenteeId("");
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    fetch(`${API}/api/programs/${programId}/participants?limit=500`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: any[]) => {
        if (!Array.isArray(list)) return;
        setParticipants(
          list.map((p) => ({
            id: p.id,
            user_id: p.user.id,
            name: `${p.user.nombre || ""} ${p.user.apellidos || ""}`.trim() || p.user.email,
            email: p.user.email,
            role: p.role,
          })),
        );
      })
      .catch(() => setParticipants([]));
    setManualMentorId("");
    setManualMenteeId("");
    setManualState({ status: "idle" });
  }, [programId]);

  const manualMentorOptions = useMemo(
    () => participants.filter((p) => p.role === "mentor" || p.role === "participant_cell"),
    [participants],
  );
  const manualMenteeOptions = useMemo(
    () => participants.filter((p) => p.role === "mentee" || p.role === "participant_cell"),
    [participants],
  );

  const activateManual = async () => {
    if (!programId || !manualMentorId || !manualMenteeId) return;
    if (manualMentorId === manualMenteeId) {
      setManualState({ status: "error", message: "Mentor y mentee no pueden ser la misma persona" });
      return;
    }
    setManualState({ status: "loading" });
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
          mentor_user_id: manualMentorId,
          mentee_user_id: manualMenteeId,
          vinculation_type: "mentoria",
          breakdown: { manual: true },
          reasons: ["Vinculación manual creada por el administrador"],
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.detail || `HTTP ${res.status}`);
      setManualState({
        status: "done",
        vinculationId: body.vinculation_id,
        alreadyExisted: body.status === "already_exists",
      });
    } catch (err: any) {
      setManualState({ status: "error", message: err?.message || "Error al vincular" });
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
    <div className="min-h-screen bg-white">
      <div className="px-8 pt-8 pb-2 flex items-end justify-between">
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#b08a00', marginBottom:'0.4rem' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#F5C800', display:'inline-block' }} />
            IA · Matching
          </div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800, color:'#0f0f0f', letterSpacing:'-0.02em', lineHeight:1.15, margin:0 }}>Match Inteligente</h1>
          <p style={{ fontSize:'0.82rem', color:'#9a9a9a', marginTop:'0.25rem' }}>
            Motor multi-dimensional · skills, temas, estilo, experiencia y objetivos · potenciado con Claude
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          style={{ padding:'0.45rem 0.9rem', fontSize:'0.78rem', fontWeight:600, color:'#555', background:'#f5f5f5', border:'none', borderRadius:10, cursor:'pointer' }}
        >
          ← Dashboard
        </button>
      </div>

      <main className="space-y-6 px-8 py-6">
        {/* Controls */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">Programa (opcional)</label>
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
            <label className="flex h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm whitespace-nowrap">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              ✨ Análisis Claude
            </label>
            <button
              onClick={runMatch}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Analizando…
                </>
              ) : <>✨ Generar matches</>}
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {stats
                ? `${stats.mentors} mentores × ${stats.mentees} mentees = ${stats.pairs} pares analizados`
                : "Selecciona un programa o analiza todos los perfiles activos."}
            </p>
            <details className="text-xs text-gray-400">
              <summary className="cursor-pointer hover:text-gray-700">Opciones avanzadas ▾</summary>
              <div className="mt-2 flex gap-3 flex-wrap">
                <label className="flex items-center gap-1">
                  <span>Top K:</span>
                  <input type="number" min={1} max={50} value={topK}
                    onChange={(e) => setTopK(Math.max(1, Math.min(50, Number(e.target.value) || 10)))}
                    className="w-14 rounded border border-gray-200 px-2 py-0.5 text-xs" />
                </label>
                <label className="flex items-center gap-1">
                  <span>Score mín:</span>
                  <input type="number" min={0} max={100} value={minScore}
                    onChange={(e) => setMinScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-14 rounded border border-gray-200 px-2 py-0.5 text-xs" />
                </label>
              </div>
            </details>
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

                  {/* Claude AI rec — featured */}
                  {r.ai_recommendation && (
                    <div className="mt-3 rounded-xl p-3" style={{ background:'rgba(245,200,0,0.07)', border:'1px solid rgba(245,200,0,0.25)', borderLeft:'3px solid #F5C800' }}>
                      <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color:'#7a5900' }}>✨ Análisis Claude</p>
                      <p className="text-xs" style={{ color:'#5a4200', lineHeight:1.6 }}>{r.ai_recommendation}</p>
                    </div>
                  )}

                  {/* Score breakdown — collapsed by default */}
                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-[11px] font-medium text-gray-400 hover:text-gray-700 select-none">
                      Ver desglose técnico ▾
                    </summary>
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                      {Object.entries(r.breakdown).map(([key, b]) => {
                        const pct = b.weight > 0 ? (b.earned / b.weight) * 100 : 0;
                        const barColor = scoreColor(pct).bar;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-gray-600">{b.label}</span>
                              <span className="text-gray-400">{b.earned.toFixed(0)}/{b.weight}</span>
                            </div>
                            <div className="mt-1 h-1 w-full rounded-full bg-gray-100">
                              <div className={`h-1 rounded-full ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {r.matched_keywords && r.matched_keywords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.matched_keywords.slice(0, 8).map((m) => <Pill key={m}>{m}</Pill>)}
                      </div>
                    )}
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
