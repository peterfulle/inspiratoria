"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const VIDEOS = [
  "/videos/d277079e-dc50-4501-ab94-8c2c6b9eeefe.mp4",
  "/videos/veo-studio-creation (1).mp4",
  "/videos/veo-studio-creation (2).mp4",
];

type Step = "email" | "otp";

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailLocked, setEmailLocked] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Pre-fill email from URL param (from email link)
  // Si viene con ?email=, el usuario ya tiene un OTP (enviado al crear la cuenta)
  // → ir directo al paso OTP sin generar uno nuevo
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
      setEmailLocked(true);
      setStep("otp");
      setTimeout(() => otpRefs[0].current?.focus(), 200);
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Session expiry check
  useEffect(() => {
    const checkSession = () => {
      const expiresAt = localStorage.getItem("session_expires_at");
      if (expiresAt && new Date() > new Date(expiresAt)) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        localStorage.removeItem("company");
        localStorage.removeItem("session_expires_at");
      }
    };
    checkSession();
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, []);

  // Video
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

  // ─── STEP 1: Request OTP ───
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.post(`${API_URL}/api/companies/auth/request-otp`, { email: email.trim() });
      setStep("otp");
      setEmailLocked(true);
      setResendCooldown(60);
      setSuccess("Código enviado a tu correo");
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") setError(detail);
      else if (err?.response?.status === 404) setError("No existe una cuenta con ese email");
      else if (err?.response?.status === 403) setError("Cuenta desactivada. Contacta al administrador.");
      else setError("Error al enviar el código. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 2: Verify OTP ───
  const handleVerifyOTP = async (digits: string[] = otpDigits) => {
    const code = digits.join("");
    if (code.length !== 4) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post(`${API_URL}/api/companies/auth/login-otp`, {
        email: email.trim(),
        otp: code,
        remember,
      });

      const data = res.data;

      // Save session
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.company) localStorage.setItem("company", JSON.stringify(data.company));
      if (data.expires_at) localStorage.setItem("session_expires_at", data.expires_at);

      setSuccess("¡Bienvenido!");
      setTimeout(() => {
        const role = data.user?.role;
        if (role === "admin_root" || role === "inspiratoria_admin" || role === "superadmin") {
          router.push("/dashboard");
        } else if (data.company) {
          router.push("/core");
        } else {
          router.push("/dashboard");
        }
      }, 600);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") setError(detail);
      else setError("Código incorrecto. Intenta nuevamente.");
      setOtpDigits(["", "", "", ""]);
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // OTP input handling
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setError("");

    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 filled
    if (value && index === 3 && newDigits.every((d) => d)) {
      handleVerifyOTP(newDigits);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      const digits = pasted.split("");
      setOtpDigits(digits);
      otpRefs[3].current?.focus();
      handleVerifyOTP(digits);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axios.post(`${API_URL}/api/companies/auth/request-otp`, { email: email.trim() });
      setResendCooldown(60);
      setOtpDigits(["", "", "", ""]);
      setSuccess("Nuevo código enviado");
      setTimeout(() => otpRefs[0].current?.focus(), 100);
    } catch {
      setError("Error al reenviar. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Go back to email step
  const handleChangeEmail = () => {
    setStep("email");
    setEmailLocked(false);
    setOtpDigits(["", "", "", ""]);
    setError("");
    setSuccess("");
  };

  return (
    <div className="flex min-h-screen">
      {/* ═══ LEFT: Video Panel ═══ */}
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />

        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
              <svg className="h-5 w-5 text-[#FFD902]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.962 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.582a.5.5 0 010 .962L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.962 0z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white/80 tracking-tight">Inspiratoria</span>
          </div>

          {/* Center Hero */}
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFD902]/15 border border-[#FFD902]/25 px-3.5 py-1.5 mb-6">
                <div className="h-1.5 w-1.5 rounded-full bg-[#FFD902] animate-pulse" />
                <span className="text-xs font-medium text-[#FFD902] tracking-wide">Acceso seguro · Verificación por email</span>
              </div>

              <h2 className="text-5xl font-bold text-white mb-5 leading-[1.1] tracking-tight">
                Accede a tu<br />
                <span className="text-[#FFD902]">Plataforma</span>
              </h2>
              <p className="text-base text-white/55 leading-relaxed max-w-sm">
                Ingresa con tu email y te enviaremos un código de verificación para acceder de forma segura.
              </p>

              {/* Features */}
              <div className="flex items-center gap-8 mt-10">
                <div className="text-center">
                  <svg className="h-7 w-7 mx-auto text-[#FFD902]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <p className="text-[11px] text-white/40 mt-2 uppercase tracking-wider font-medium">Seguro</p>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="text-center">
                  <svg className="h-7 w-7 mx-auto text-[#FFD902]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <p className="text-[11px] text-white/40 mt-2 uppercase tracking-wider font-medium">Sin contraseña</p>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="text-center">
                  <svg className="h-7 w-7 mx-auto text-[#FFD902]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[11px] text-white/40 mt-2 uppercase tracking-wider font-medium">Código al email</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-start gap-4 max-w-lg">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFD902]/20 border border-white/10 text-sm font-bold text-[#FFD902]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <p className="text-[13px] text-white/60 leading-relaxed">
                Tu sesión se mantendrá activa. Si no accedes en 72 horas, se cerrará automáticamente por seguridad.
              </p>
            </div>
          </div>
        </div>

        {/* Video Dots */}
        <div className="absolute bottom-10 right-10 z-10 flex gap-1.5">
          {VIDEOS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentVideoIndex ? "bg-[#FFD902] w-6" : "bg-white/25 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ═══ RIGHT: Login Form ═══ */}
      <div className="w-full lg:w-[45%] flex flex-col min-h-screen bg-white">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0a0a]">
              <span className="text-lg font-bold text-[#FFD902]">I</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Inspiratoria</span>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-8">
              <div className="hidden lg:flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a0a0a] mb-6 shadow-lg shadow-black/10">
                {step === "email" ? (
                  <svg className="h-6 w-6 text-[#FFD902]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-[#FFD902]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                )}
              </div>

              {step === "email" ? (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Ingresa tu email</h1>
                  <p className="text-sm text-gray-400">Te enviaremos un código de 4 dígitos para verificar tu identidad</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Verifica tu código</h1>
                  <p className="text-sm text-gray-400">
                    Ingresa el código de 4 dígitos enviado a
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-semibold text-[#0a0a0a]">{email}</span>
                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      className="text-xs text-gray-400 hover:text-[#0a0a0a] transition-colors underline underline-offset-2"
                    >
                      Cambiar
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step === "email" || step === "otp" ? "bg-[#0a0a0a]" : "bg-gray-200"}`} />
              <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step === "otp" ? "bg-[#0a0a0a]" : "bg-gray-200"}`} />
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && !error && (
              <div className="mb-5 rounded-xl border border-[#FFD902]/30 bg-[#FFD902]/10 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-[#0a0a0a]">{success}</p>
                </div>
              </div>
            )}

            {/* ─── EMAIL STEP ─── */}
            {step === "email" && (
              <form onSubmit={handleRequestOTP} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <svg className="h-[18px] w-[18px] text-gray-300 group-focus-within:text-[#0a0a0a] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      readOnly={emailLocked}
                      className={`w-full rounded-xl border bg-white pl-10 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-300 focus:border-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 transition-all shadow-sm ${
                        emailLocked
                          ? "border-[#FFD902]/50 bg-[#FFD902]/5 cursor-default"
                          : "border-gray-200"
                      }`}
                      placeholder="tu@email.com"
                      required
                      autoFocus
                    />
                    {emailLocked && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
                        <svg className="h-4 w-4 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full rounded-xl bg-[#0a0a0a] px-4 py-3.5 text-sm font-semibold text-[#FFD902] shadow-lg shadow-black/10 hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando código…
                    </span>
                  ) : (
                    "Continuar"
                  )}
                </button>

                <div className="text-center pt-2">
                  <a href="/login" className="text-xs text-gray-400 hover:text-[#0a0a0a] transition-colors">
                    ← Volver al login principal
                  </a>
                </div>
              </form>
            )}

            {/* ─── OTP STEP ─── */}
            {step === "otp" && (
              <div className="space-y-6">
                {/* OTP Inputs */}
                <div>
                  <label className="mb-3 block text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Código de verificación
                  </label>
                  <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={otpRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`h-16 w-14 rounded-xl border-2 text-center text-2xl font-bold transition-all duration-200 shadow-sm focus:outline-none ${
                          digit
                            ? "border-[#0a0a0a] bg-[#FFD902]/10 text-[#0a0a0a] shadow-[#FFD902]/20"
                            : "border-gray-200 bg-white text-gray-900 focus:border-[#0a0a0a] focus:ring-2 focus:ring-[#0a0a0a]/10"
                        }`}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Remember session */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="h-5 w-5 rounded-md border-2 border-gray-200 bg-white peer-checked:border-[#0a0a0a] peer-checked:bg-[#0a0a0a] transition-all duration-200 flex items-center justify-center">
                      {remember && (
                        <svg className="h-3 w-3 text-[#FFD902]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                      Mantener sesión activa
                    </span>
                    <p className="text-[11px] text-gray-400">Se cerrará automáticamente tras 72h de inactividad</p>
                  </div>
                </label>

                {/* Verify button */}
                <button
                  onClick={() => handleVerifyOTP()}
                  disabled={loading || otpDigits.some((d) => !d)}
                  className="w-full rounded-xl bg-[#0a0a0a] px-4 py-3.5 text-sm font-semibold text-[#FFD902] shadow-lg shadow-black/10 hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verificando…
                    </span>
                  ) : (
                    "Verificar e Ingresar"
                  )}
                </button>

                {/* Resend */}
                <div className="text-center space-y-3">
                  <p className="text-xs text-gray-400">
                    ¿No recibiste el código?
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className={`text-sm font-medium transition-all duration-200 ${
                      resendCooldown > 0
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-[#0a0a0a] hover:text-[#0a0a0a]/70 hover:underline underline-offset-2"
                    }`}
                  >
                    {resendCooldown > 0
                      ? `Reenviar en ${resendCooldown}s`
                      : "Reenviar código"}
                  </button>
                </div>

                {/* Change email */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="text-xs text-gray-400 hover:text-[#0a0a0a] transition-colors"
                  >
                    ← Usar otro email
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-gray-100">
              <p className="text-[11px] text-gray-300 text-center leading-relaxed">
                Acceso seguro con verificación por email.
                <br />
                Sin contraseñas, solo tu correo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}><div style={{ color: "#FFD902", fontSize: "1.25rem" }}>Cargando...</div></div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
