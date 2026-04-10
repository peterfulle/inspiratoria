"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type Step = "loading" | "otp" | "qr" | "done" | "error";

export default function ActivatePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [step, setStep] = useState<Step>("loading");
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // OTP
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // TOTP QR
  const [qrData, setQrData] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState("");

  // Validate token on load
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/companies/auth/activate/validate-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.detail || "Token inválido");
          setStep("error");
          return;
        }
        const data = await res.json();
        setUserName(data.full_name);
        setUserEmail(data.email);
        if (data.otp_expired) {
          setError("Tu código de activación ha expirado. Contacta al administrador para que te reenvíe uno nuevo.");
          setStep("error");
          return;
        }
        setStep("otp");
        setTimeout(() => otpRefs[0].current?.focus(), 200);
      } catch {
        setError("Error de conexión");
        setStep("error");
      }
    })();
  }, [token]);

  // ─── OTP handlers ───
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setError("");
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
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

  const handleVerifyOTP = async (digits: string[] = otpDigits) => {
    const code = digits.join("");
    if (code.length !== 4) return;
    setOtpLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/companies/auth/activate/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Código incorrecto");
        setOtpDigits(["", "", "", ""]);
        setTimeout(() => otpRefs[0].current?.focus(), 100);
        setOtpLoading(false);
        return;
      }
      // OTP OK → show QR
      setQrData(data.qr_code);
      setTotpSecret(data.secret);
      setStep("qr");
    } catch {
      setError("Error de conexión");
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── TOTP Confirm ───
  const handleConfirmTOTP = async () => {
    if (totpCode.length !== 6) return;
    setTotpLoading(true);
    setTotpError("");

    try {
      const res = await fetch(`${API_URL}/api/companies/auth/activate/confirm-totp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTotpError(data.detail || "Código incorrecto");
        setTotpLoading(false);
        return;
      }
      // Save session
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.company) localStorage.setItem("company", JSON.stringify(data.company));
      if (data.expires_at) localStorage.setItem("session_expires_at", data.expires_at);

      setStep("done");
      setTimeout(() => {
        const role = data.user?.role;
        if (role === "admin_root" || role === "inspiratoria_admin" || role === "superadmin") {
          router.push("/dashboard");
        } else if (data.company) {
          router.push("/core");
        } else {
          router.push("/dashboard");
        }
      }, 2000);
    } catch {
      setTotpError("Error de conexión");
    } finally {
      setTotpLoading(false);
    }
  };

  const firstName = userName.split(" ")[0] || "usuario";

  // ─── RENDER ───
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a0a0a] mb-4">
            <svg className="h-6 w-6 text-[#FFD902]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.962 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.582a.5.5 0 010 .962L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.962 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Inspiratoria</h2>
        </div>

        {/* ── LOADING ── */}
        {step === "loading" && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
            <p className="mt-4 text-sm text-gray-400">Verificando enlace...</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <div className="text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
              <svg className="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No se puede activar</h3>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <a
              href="/login"
              className="inline-block rounded-xl bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-[#FFD902] hover:bg-[#1a1a1a] transition-colors"
            >
              Ir al login
            </a>
          </div>
        )}

        {/* ── STEP 1: OTP ── */}
        {step === "otp" && (
          <div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 flex-1 rounded-full bg-[#0a0a0a]" />
              <div className="h-1 flex-1 rounded-full bg-gray-200" />
              <div className="h-1 flex-1 rounded-full bg-gray-200" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Hola, {firstName}</h1>
            <p className="text-sm text-gray-400 mb-1">
              Ingresa el código de 4 dígitos que recibiste por email
            </p>
            <p className="text-xs text-gray-300 mb-6">
              {userEmail}
            </p>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* OTP Inputs */}
            <div className="flex justify-center gap-3 mb-8">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  className="h-16 w-14 rounded-xl border-2 border-gray-200 bg-gray-50 text-center text-2xl font-bold text-gray-900 focus:border-[#0a0a0a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 transition-all"
                />
              ))}
            </div>

            <button
              onClick={() => handleVerifyOTP()}
              disabled={otpLoading || otpDigits.some((d) => !d)}
              className="w-full rounded-xl bg-[#0a0a0a] px-4 py-3.5 text-sm font-semibold text-[#FFD902] shadow-lg shadow-black/10 hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {otpLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : (
                "Verificar código"
              )}
            </button>
          </div>
        )}

        {/* ── STEP 2: QR TOTP Setup ── */}
        {step === "qr" && (
          <div>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 flex-1 rounded-full bg-[#0a0a0a]" />
              <div className="h-1 flex-1 rounded-full bg-[#0a0a0a]" />
              <div className="h-1 flex-1 rounded-full bg-gray-200" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Configura tu autenticador</h1>
            <p className="text-sm text-gray-400 mb-6">
              Escanea el código QR con Google Authenticator o Microsoft Authenticator
            </p>

            {/* QR Code */}
            <div className="flex justify-center mb-5">
              <div className="rounded-2xl border border-gray-200 p-3 bg-white shadow-sm">
                <img
                  src={`data:image/png;base64,${qrData}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* App logos */}
            <div className="flex justify-center gap-6 mb-5">
              <div className="flex items-center gap-1.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="#4285F4"/><path d="M12 2L2 7l10 5 10-5L12 2z" fill="#34A853"/><path d="M2 7v10l10 5V12L2 7z" fill="#FBBC05"/><path d="M22 7L12 12v10l10-5V7z" fill="#EA4335"/></svg>
                <span className="text-xs text-gray-400">Google</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="18" height="18" viewBox="0 0 23 23"><rect width="11" height="11" fill="#0078D4"/><rect x="12" width="11" height="11" fill="#0078D4"/><rect y="12" width="11" height="11" fill="#0078D4"/><rect x="12" y="12" width="11" height="11" fill="#0078D4" opacity="0.5"/></svg>
                <span className="text-xs text-gray-400">Microsoft</span>
              </div>
            </div>

            {/* Steps */}
            <ol className="text-sm text-gray-500 mb-5 space-y-1.5 pl-5 list-decimal">
              <li>Abre tu app de autenticación</li>
              <li>Escanea el código QR de arriba</li>
              <li>Ingresa abajo el código de 6 dígitos que genera</li>
            </ol>

            {/* Manual key */}
            {totpSecret && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 mb-5">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Clave manual</p>
                <code className="text-sm font-bold text-gray-900 tracking-wider break-all">{totpSecret}</code>
              </div>
            )}

            {totpError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{totpError}</p>
              </div>
            )}

            {/* Code input */}
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Código de verificación
            </label>
            <div className="flex gap-3 items-center mb-5">
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-40 rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3.5 text-center text-xl font-bold text-gray-900 tracking-[0.35em] focus:border-[#0a0a0a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0a0a0a]/10 transition-all"
                />
                {totpCode.length > 0 && totpCode.length < 6 && (
                  <span className="absolute -right-8 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{totpCode.length}/6</span>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirmTOTP}
              disabled={totpLoading || totpCode.length !== 6}
              className="w-full rounded-xl bg-[#0a0a0a] px-4 py-3.5 text-sm font-semibold text-[#FFD902] shadow-lg shadow-black/10 hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {totpLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : (
                "Activar cuenta"
              )}
            </button>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div className="text-center py-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0a0a0a] mb-5">
              <svg className="h-8 w-8 text-[#FFD902]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta activada!</h2>
            <p className="text-sm text-gray-400 mb-2">
              Tu autenticador está configurado. Redirigiendo...
            </p>
            <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900 mt-4" />
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[11px] text-gray-300">
            Plataforma segura · Inspiratoria
          </p>
        </div>
      </div>
    </div>
  );
}
