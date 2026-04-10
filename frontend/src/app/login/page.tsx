"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const VIDEOS = [
  "/videos/d277079e-dc50-4501-ab94-8c2c6b9eeefe.mp4",
  "/videos/veo-studio-creation (1).mp4",
  "/videos/veo-studio-creation (2).mp4",
];

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'totp'>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [totpCode, setTotpCode] = useState(["", "", "", "", "", ""]);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [hasTOTP, setHasTOTP] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const getDashboardRoute = (role: string, hasCompany: boolean): string => {
    if (role === "admin_root" || role === "inspiratoria_admin" || role === "superadmin") {
      return "/dashboard";
    }
    if (hasCompany) return "/core";
    return "/dashboard";
  };

  // Step 1: Check TOTP status, then request OTP or go to TOTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrorCode("");

    try {
      // First check if user has TOTP enabled
      const checkRes = await fetch(`${API}/api/companies/auth/totp/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!checkRes.ok) {
        const data = await checkRes.json();
        setError(data.detail || "Error al verificar cuenta");
        if (checkRes.status === 404) setErrorCode("user_not_found");
        else if (checkRes.status === 403) setErrorCode("account_inactive");
        setLoading(false);
        return;
      }

      const checkData = await checkRes.json();

      if (checkData.totp_enabled) {
        // User has authenticator app configured → go to TOTP step
        setHasTOTP(true);
        setStep('totp');
        setTotpCode(["", "", "", "", "", ""]);
        setTimeout(() => totpRefs.current[0]?.focus(), 100);
        setLoading(false);
        return;
      }

      // No TOTP → send email OTP
      const res = await fetch(`${API}/api/companies/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setHasTOTP(false);
        setStep('otp');
        setResendCooldown(60);
        setOtp(["", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        const data = await res.json();
        setError(data.detail || "Error al enviar el código");
        if (res.status === 404) setErrorCode("user_not_found");
        else if (res.status === 403) setErrorCode("account_inactive");
      }
    } catch {
      setError("No se puede conectar con el servidor. Verifica que el servicio esté activo.");
      setErrorCode("connection_error");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Login
  const handleVerifyOTP = async (code?: string) => {
    const otpCode = code || otp.join("");
    if (otpCode.length !== 4) return;

    setLoading(true);
    setError("");
    setErrorCode("");

    try {
      const res = await fetch(`${API}/api/companies/auth/login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode, remember }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.company) {
          localStorage.setItem("company", JSON.stringify(data.company));
        }
        if (data.expires_at) {
          localStorage.setItem("session_expires_at", data.expires_at);
        }
        const route = getDashboardRoute(data.user.role, !!data.company);
        router.push(route);
      } else {
        const data = await res.json();
        setError(data.detail || "Código incorrecto");
        if (data.detail?.includes("expirado")) {
          setErrorCode("otp_expired");
        } else {
          setErrorCode("wrong_otp");
          setOtp(["", "", "", ""]);
          setTimeout(() => otpRefs.current[0]?.focus(), 50);
        }
      }
    } catch {
      setError("No se puede conectar con el servidor.");
      setErrorCode("connection_error");
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3) {
      const fullCode = newOtp.join("");
      if (fullCode.length === 4) {
        handleVerifyOTP(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      otpRefs.current[3]?.focus();
      handleVerifyOTP(pasted);
    }
  };

  // TOTP (Authenticator App) handlers
  const handleTotpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...totpCode];
    newCode[index] = value.slice(-1);
    setTotpCode(newCode);

    if (value && index < 5) {
      totpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleVerifyTOTP(fullCode);
      }
    }
  };

  const handleTotpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !totpCode[index] && index > 0) {
      totpRefs.current[index - 1]?.focus();
    }
  };

  const handleTotpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setTotpCode(newCode);
      totpRefs.current[5]?.focus();
      handleVerifyTOTP(pasted);
    }
  };

  // Verify TOTP code from authenticator app
  const handleVerifyTOTP = async (code?: string) => {
    const totpVal = code || totpCode.join("");
    if (totpVal.length !== 6) return;

    setLoading(true);
    setError("");
    setErrorCode("");

    try {
      const res = await fetch(`${API}/api/companies/auth/login-totp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, totp_code: totpVal, remember }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.company) {
          localStorage.setItem("company", JSON.stringify(data.company));
        }
        if (data.expires_at) {
          localStorage.setItem("session_expires_at", data.expires_at);
        }
        const route = getDashboardRoute(data.user.role, !!data.company);
        router.push(route);
      } else {
        const data = await res.json();
        setError(data.detail || "Código incorrecto");
        setErrorCode("wrong_totp");
        setTotpCode(["", "", "", "", "", ""]);
        setTimeout(() => totpRefs.current[0]?.focus(), 50);
      }
    } catch {
      setError("No se puede conectar con el servidor.");
      setErrorCode("connection_error");
    } finally {
      setLoading(false);
    }
  };

  // Switch from TOTP to email OTP
  const handleSwitchToEmailOTP = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/companies/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep('otp');
        setResendCooldown(60);
        setOtp(["", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        const data = await res.json();
        setError(data.detail || "Error al enviar código por email");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/companies/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setResendCooldown(60);
        setOtp(["", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else {
        const data = await res.json();
        setError(data.detail || "Error al reenviar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
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
                {step === 'email' ? (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                ) : step === 'totp' ? (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
              </div>

              {step === 'email' ? (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Iniciar sesión</h1>
                  <p className="text-sm text-gray-400">Te enviaremos un código de verificación a tu email</p>
                </>
              ) : step === 'totp' ? (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Autenticador</h1>
                  <p className="text-sm text-gray-400">
                    Ingresa el código de 6 dígitos de tu app autenticadora para{' '}
                    <span className="font-medium text-gray-600">{email}</span>
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Verifica tu identidad</h1>
                  <p className="text-sm text-gray-400">
                    Ingresa el código de 4 dígitos enviado a{' '}
                    <span className="font-medium text-gray-600">{email}</span>
                  </p>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className={`mb-6 rounded-xl border px-4 py-3.5 ${
                errorCode === 'user_not_found'
                  ? 'border-amber-200 bg-amber-50'
                  : errorCode === 'account_inactive'
                  ? 'border-gray-300 bg-gray-50'
                  : errorCode === 'otp_expired'
                  ? 'border-amber-200 bg-amber-50'
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
                      : errorCode === 'otp_expired' ? 'text-amber-800'
                      : 'text-red-700'
                    }`}>
                      {error}
                    </p>
                    {errorCode === 'user_not_found' && (
                      <p className="text-xs text-amber-600/80 mt-1">
                        Verifica tu email o{' '}
                        <a href="/register" className="font-semibold underline hover:text-amber-700">crea una cuenta nueva</a>.
                      </p>
                    )}
                    {errorCode === 'account_inactive' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Escribe a <a href="mailto:soporte@inspiratoria.org" className="font-semibold underline">soporte@inspiratoria.org</a> para reactivarla.
                      </p>
                    )}
                    {errorCode === 'otp_expired' && (
                      <p className="text-xs text-amber-600/80 mt-1">
                        <button onClick={handleResend} className="font-semibold underline hover:text-amber-700">Solicita un nuevo código</button>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <svg className="h-[18px] w-[18px] text-gray-300 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15 transition-all shadow-sm"
                      placeholder="nombre@empresa.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-sm text-white transition-all hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/15 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98] mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enviando código...
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
            )}

            {/* STEP 2: OTP */}
            {step === 'otp' && (
              <div className="space-y-6">
                {/* OTP Inputs */}
                <div>
                  <label className="mb-3 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Código de verificación</label>
                  <div className="flex gap-3 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className={`w-14 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all shadow-sm focus:outline-none ${
                          digit
                            ? 'border-primary-500 bg-primary-50/50 text-gray-900'
                            : 'border-gray-200 bg-white text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15'
                        }`}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500/30"
                    />
                    <span className="ml-2 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                      Mantener sesión iniciada
                      <span className="text-gray-300 ml-1">(72 horas)</span>
                    </span>
                  </label>
                </div>

                {/* Verify button */}
                <button
                  onClick={() => handleVerifyOTP()}
                  disabled={loading || otp.join("").length !== 4}
                  className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-sm text-white transition-all hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/15 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verificando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Verificar e ingresar
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </span>
                  )}
                </button>

                {/* Resend & Change email */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => { setStep('email'); setError(''); setErrorCode(''); setOtp(["","","",""]); }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Cambiar email
                  </button>

                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className={`text-xs font-medium transition-colors ${
                      resendCooldown > 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-primary-500 hover:text-primary-600'
                    }`}
                  >
                    {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2b: TOTP (Authenticator App) */}
            {step === 'totp' && (
              <div className="space-y-6">
                {/* App icons hint */}
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200">
                    <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-[10px] font-medium text-gray-500">Google</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200">
                    <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.4 24H0V12.6L11.4 24zM24 24H12.6l-6-6H18V6.6l6 6V24zM24 0v11.4L12.6 0H24zM0 0h11.4l6 6H6v11.4L0 11.4V0z"/>
                    </svg>
                    <span className="text-[10px] font-medium text-gray-500">Microsoft</span>
                  </div>
                </div>

                {/* TOTP 6-digit inputs */}
                <div>
                  <label className="mb-3 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Código del autenticador</label>
                  <div className="flex gap-2 justify-center">
                    {totpCode.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { totpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleTotpChange(i, e.target.value)}
                        onKeyDown={(e) => handleTotpKeyDown(i, e)}
                        onPaste={i === 0 ? handleTotpPaste : undefined}
                        className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all shadow-sm focus:outline-none ${
                          digit
                            ? 'border-primary-500 bg-primary-50/50 text-gray-900'
                            : 'border-gray-200 bg-white text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15'
                        }`}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500/30"
                    />
                    <span className="ml-2 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                      Mantener sesión iniciada
                      <span className="text-gray-300 ml-1">(72 horas)</span>
                    </span>
                  </label>
                </div>

                {/* Verify button */}
                <button
                  onClick={() => handleVerifyTOTP()}
                  disabled={loading || totpCode.join("").length !== 6}
                  className="w-full rounded-xl bg-gray-900 px-4 py-3 font-semibold text-sm text-white transition-all hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/15 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verificando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Verificar e ingresar
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </span>
                  )}
                </button>

                {/* Switch to email OTP & Change email */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => { setStep('email'); setError(''); setErrorCode(''); setTotpCode(["","","","","",""]); }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Cambiar email
                  </button>

                  <button
                    onClick={handleSwitchToEmailOTP}
                    disabled={loading}
                    className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors"
                  >
                    Usar código por email
                  </button>
                </div>
              </div>
            )}

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
