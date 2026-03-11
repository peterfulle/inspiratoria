"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { companyApi } from "@/lib/api/company";

const VIDEOS = [
  "/videos/d277079e-dc50-4501-ab94-8c2c6b9eeefe.mp4",
  "/videos/veo-studio-creation (1).mp4",
  "/videos/veo-studio-creation (2).mp4",
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  const handleVideoEnd = useCallback(() => {
    setCurrentVideoIndex((prev) => (prev + 1) % VIDEOS.length);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.load();
      v.play().catch(() => {});
    }
  }, [currentVideoIndex]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrorCode("");

    try {
      const response = await companyApi.login({ username, password });

      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      if (response.company) {
        localStorage.setItem("company", JSON.stringify(response.company));
      }

      const dashboardRoute = getDashboardRoute(response.user.role, !!response.company);
      router.push(dashboardRoute);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.message) {
        setError(detail.message);
        setErrorCode(detail.code || "");
      } else if (detail && typeof detail === 'string') {
        setError(detail);
        setErrorCode("unknown");
      } else if (err?.response?.status) {
        // HTTP error but unexpected format
        setError("Error al iniciar sesión. Intenta nuevamente.");
        setErrorCode("unknown");
      } else {
        // Network error (no response at all)
        setError("No se puede conectar con el servidor. Verifica que el servicio esté activo.");
        setErrorCode("connection_error");
      }
    } finally {
      setLoading(false);
    }
  };

  const getDashboardRoute = (role: string, hasCompany: boolean): string => {
    if (role === "admin_root" || role === "inspiratoria_admin" || role === "superadmin") {
      return "/dashboard";
    }
    if (hasCompany) {
      return "/core";
    }
    return "/dashboard";
  };

  return (
    <div className="flex min-h-screen">
      {/* LEFT SIDE - Video Panel */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          autoPlay
          onEnded={handleVideoEnd}
        >
          <source src={VIDEOS[currentVideoIndex]} type="video/mp4" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />

        {/* Content Over Video */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <svg className="h-5 w-5 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.962 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.582a.5.5 0 010 .962L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.962 0z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white/80 tracking-tight">Inspiratoria</span>
          </div>

          {/* Center - Hero */}
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-lg">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-400/15 border border-primary-400/25 px-3.5 py-1.5 mb-6">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
                <span className="text-xs font-medium text-primary-300 tracking-wide">Plataforma activa · 12 empresas conectadas</span>
              </div>

              <h2 className="text-5xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
                Donde el talento<br />
                <span className="bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">encuentra dirección</span>
              </h2>
              <p className="text-base text-white/55 leading-relaxed max-w-sm">
                Conecta mentores y equipos. Mide el impacto en tiempo real con métricas que importan.
              </p>

              {/* Metrics Row */}
              <div className="flex items-center gap-8 mt-10">
                <div>
                  <p className="text-3xl font-bold text-white tracking-tight">500<span className="text-primary-400">+</span></p>
                  <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wider font-medium">Mentores</p>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div>
                  <p className="text-3xl font-bold text-white tracking-tight">2.4k</p>
                  <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wider font-medium">Sesiones</p>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div>
                  <p className="text-3xl font-bold text-white tracking-tight">98<span className="text-primary-400">%</span></p>
                  <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wider font-medium">Satisfacción</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom - Testimonial */}
          <div className="flex items-start gap-4 max-w-lg">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400/30 to-purple-500/20 border border-white/10 text-sm font-bold text-primary-300">
              MC
            </div>
            <div>
              <p className="text-[13px] text-white/60 leading-relaxed">
                &ldquo;Inspiratoria transformó cómo desarrollamos líderes internos. El matching con IA es un game-changer.&rdquo;
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <p className="text-xs font-semibold text-white/80">María Catalina</p>
                <span className="text-white/20">·</span>
                <p className="text-xs text-white/40">VP People & Culture</p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Dots */}
        <div className="absolute bottom-10 right-10 z-10 flex gap-1.5">
          {VIDEOS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentVideoIndex ? "bg-white w-6" : "bg-white/25 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col min-h-screen bg-gray-50/50">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600">
              <span className="text-lg font-bold text-white">I</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Inspiratoria</span>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-10">
              <div className="hidden lg:flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 mb-6 shadow-lg shadow-primary-500/20">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Iniciar sesión</h1>
              <p className="text-sm text-gray-400">Accede a tu plataforma de mentoría</p>
            </div>

            {/* Error */}
            {error && (
              <div className={`mb-6 rounded-xl border px-4 py-3.5 ${
                errorCode === 'user_not_found'
                  ? 'border-amber-200 bg-amber-50'
                  : errorCode === 'account_inactive'
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start gap-3">
                  {errorCode === 'user_not_found' ? (
                    <svg className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  ) : errorCode === 'account_inactive' ? (
                    <svg className="h-5 w-5 shrink-0 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                  ) : errorCode === 'wrong_password' ? (
                    <svg className="h-5 w-5 shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                      <line x1="12" y1="15" x2="12" y2="17" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      errorCode === 'user_not_found' ? 'text-amber-800' 
                      : errorCode === 'account_inactive' ? 'text-gray-700'
                      : 'text-red-700'
                    }`}>
                      {error}
                    </p>
                    {errorCode === 'user_not_found' && (
                      <p className="text-xs text-amber-600/80 mt-1">
                        Verifica tu usuario o{' '}
                        <a href="/register" className="font-semibold underline hover:text-amber-700">crea una cuenta nueva</a>.
                      </p>
                    )}
                    {errorCode === 'wrong_password' && (
                      <p className="text-xs text-red-500/80 mt-1">
                        Intenta nuevamente o{' '}
                        <a href="#" className="font-semibold underline hover:text-red-600">recupera tu contraseña</a>.
                      </p>
                    )}
                    {errorCode === 'account_inactive' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Escribe a <a href="mailto:soporte@inspiratoria.org" className="font-semibold underline">soporte@inspiratoria.org</a> para reactivarla.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Email o usuario</label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <svg className="h-[18px] w-[18px] text-gray-300 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15 transition-all shadow-sm"
                    placeholder="nombre@empresa.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Contraseña</label>
                  <a href="#" className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
                    ¿Olvidaste?
                  </a>
                </div>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <svg className="h-[18px] w-[18px] text-gray-300 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-12 py-3 text-sm text-gray-900 placeholder-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15 transition-all shadow-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center pt-1">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500/30"
                  />
                  <span className="ml-2 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Mantener sesión iniciada</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-sm text-white transition-all hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/15 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98] mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Continuar
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Register CTA */}
            <p className="text-center text-sm text-gray-400 mt-8">
              ¿Primera vez?{" "}
              <a href="/register" className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">Crear una cuenta</a>
            </p>

            {/* Trust Badges */}
            <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-center gap-5">
              <div className="flex items-center gap-1.5 text-gray-300">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-[11px] text-gray-300 font-medium">SSL</span>
              </div>
              <div className="h-3 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 text-gray-300">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span className="text-[11px] text-gray-300 font-medium">AES-256</span>
              </div>
              <div className="h-3 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 text-gray-300">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-[11px] text-gray-300 font-medium">SOC 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
