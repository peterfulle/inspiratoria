"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { apiFetch } from "@/lib/api";

// Types
interface RegistrationData {
  account_type: "core" | "studio" | "";
  plan_tier: "core_50" | "core_120" | "core_300" | "core_enterprise" | "";
  company_name: string;
  company_industry: string;
  company_size: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
  password: string;
  confirmPassword?: string;
}

const PLAN_TIERS = [
  {
    id: "core_50",
    name: "Core 50",
    participants: "Hasta 50 participantes activos",
    subtext: "mentores + mentees",
    price: "790.000",
    description: "Ideal para equipos pequeños y startups",
    icon: "bolt",
  },
  {
    id: "core_120",
    name: "Core 120",
    participants: "Hasta 120 participantes activos",
    subtext: "mentores + mentees",
    price: "1.290.000",
    popular: true,
    description: "El más elegido por empresas en crecimiento",
    icon: "rocket",
  },
  {
    id: "core_300",
    name: "Core 300",
    participants: "Hasta 300 participantes activos",
    subtext: "mentores + mentees",
    price: "2.490.000",
    description: "Para grandes organizaciones",
    icon: "building",
  },
  {
    id: "core_enterprise",
    name: "Core Enterprise",
    participants: "Más de 300 participantes",
    subtext: "precio personalizado",
    price: "3.500.000",
    custom: true,
    description: "Solución personalizada para corporaciones",
    icon: "globe",
  },
];

const PlanIconSvg = ({ type, className = "h-6 w-6" }: { type: string; className?: string }) => {
  switch (type) {
    case "bolt":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case "rocket":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
          <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );
    case "building":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18Z" />
          <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
          <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </svg>
      );
    case "globe":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
    case "users":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "sparkles":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.962 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.582a.5.5 0 010 .962L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.962 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
          <path d="M4 17v2" />
          <path d="M5 18H3" />
        </svg>
      );
    case "heart":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      );
    default:
      return null;
  }
};

const BLOCKED_EMAIL_DOMAINS = [
  "gmail.com", "hotmail.com", "hotmail.es", "outlook.com", "outlook.es",
  "yahoo.com", "yahoo.es", "live.com", "live.cl", "msn.com",
  "aol.com", "icloud.com", "me.com", "mac.com", "protonmail.com",
  "proton.me", "mail.com", "zoho.com", "yandex.com", "gmx.com",
  "tutanota.com", "fastmail.com",
];

const COUNTRIES = [
  { code: "CL", name: "Chile", dial: "+56", phonePlaceholder: "9 1234 5678" },
  { code: "MX", name: "México", dial: "+52", phonePlaceholder: "55 1234 5678" },
  { code: "CO", name: "Colombia", dial: "+57", phonePlaceholder: "300 123 4567" },
  { code: "AR", name: "Argentina", dial: "+54", phonePlaceholder: "11 1234 5678" },
  { code: "PE", name: "Perú", dial: "+51", phonePlaceholder: "912 345 678" },
  { code: "EC", name: "Ecuador", dial: "+593", phonePlaceholder: "99 123 4567" },
  { code: "BR", name: "Brasil", dial: "+55", phonePlaceholder: "11 91234 5678" },
  { code: "UY", name: "Uruguay", dial: "+598", phonePlaceholder: "91 234 567" },
  { code: "PY", name: "Paraguay", dial: "+595", phonePlaceholder: "981 123 456" },
  { code: "BO", name: "Bolivia", dial: "+591", phonePlaceholder: "71234567" },
  { code: "CR", name: "Costa Rica", dial: "+506", phonePlaceholder: "8123 4567" },
  { code: "PA", name: "Panamá", dial: "+507", phonePlaceholder: "6123 4567" },
  { code: "ES", name: "España", dial: "+34", phonePlaceholder: "612 345 678" },
  { code: "US", name: "Estados Unidos", dial: "+1", phonePlaceholder: "(555) 123-4567" },
  { code: "DO", name: "Rep. Dominicana", dial: "+1", phonePlaceholder: "(809) 123-4567" },
  { code: "GT", name: "Guatemala", dial: "+502", phonePlaceholder: "5123 4567" },
  { code: "VE", name: "Venezuela", dial: "+58", phonePlaceholder: "412 1234567" },
  { code: "HN", name: "Honduras", dial: "+504", phonePlaceholder: "9123 4567" },
  { code: "SV", name: "El Salvador", dial: "+503", phonePlaceholder: "7123 4567" },
  { code: "NI", name: "Nicaragua", dial: "+505", phonePlaceholder: "8123 4567" },
];

/* SVG Country Flags */
const CountryFlag = ({ code, className = "w-6 h-4" }: { code: string; className?: string }) => {
  const flags: Record<string, JSX.Element> = {
    CL: ( // Chile: white top, red bottom, blue canton
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="10" fill="#fff"/><rect y="10" width="32" height="10" fill="#D52B1E"/><rect width="10" height="10" fill="#0039A6"/><polygon points="5,2.5 5.9,5.2 3,3.6 7,3.6 4.1,5.2" fill="#fff"/></svg>
    ),
    MX: ( // Mexico: green/white/red vertical
      <svg viewBox="0 0 32 20" className={className}><rect width="11" height="20" fill="#006847"/><rect x="11" width="10" height="20" fill="#fff"/><rect x="21" width="11" height="20" fill="#CE1126"/><circle cx="16" cy="10" r="2.5" fill="#6D3A1F"/></svg>
    ),
    CO: ( // Colombia: yellow(50%)/blue/red
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="10" fill="#FCD116"/><rect y="10" width="32" height="5" fill="#003893"/><rect y="15" width="32" height="5" fill="#CE1126"/></svg>
    ),
    AR: ( // Argentina: blue/white/blue + sun
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="20" fill="#74ACDF"/><rect y="6.5" width="32" height="7" fill="#fff"/><circle cx="16" cy="10" r="2.2" fill="#F6B40E" stroke="#85340A" strokeWidth="0.3"/></svg>
    ),
    PE: ( // Peru: red/white/red vertical
      <svg viewBox="0 0 32 20" className={className}><rect width="11" height="20" fill="#D91023"/><rect x="11" width="10" height="20" fill="#fff"/><rect x="21" width="11" height="20" fill="#D91023"/></svg>
    ),
    EC: ( // Ecuador: yellow(50%)/blue/red
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="10" fill="#FFD100"/><rect y="10" width="32" height="5" fill="#0072CE"/><rect y="15" width="32" height="5" fill="#CE1126"/></svg>
    ),
    BR: ( // Brazil: green bg + yellow diamond
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="20" fill="#009B3A"/><polygon points="16,2 30,10 16,18 2,10" fill="#FEDF00"/><circle cx="16" cy="10" r="4" fill="#002776"/></svg>
    ),
    UY: ( // Uruguay: white/blue stripes + sun
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="20" fill="#fff"/><rect y="2.2" width="32" height="2.2" fill="#0038A8"/><rect y="6.6" width="32" height="2.2" fill="#0038A8"/><rect y="11" width="32" height="2.2" fill="#0038A8"/><rect y="15.4" width="32" height="2.2" fill="#0038A8"/><rect width="12" height="11" fill="#fff"/><circle cx="6" cy="5.5" r="2.5" fill="#FCD116"/></svg>
    ),
    PY: ( // Paraguay: red/white/blue horizontal
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="6.67" fill="#D52B1E"/><rect y="6.67" width="32" height="6.67" fill="#fff"/><rect y="13.33" width="32" height="6.67" fill="#0038A8"/></svg>
    ),
    BO: ( // Bolivia: red/yellow/green
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="6.67" fill="#D52B1E"/><rect y="6.67" width="32" height="6.67" fill="#F9E300"/><rect y="13.33" width="32" height="6.67" fill="#007934"/></svg>
    ),
    CR: ( // Costa Rica: blue/white/red/white/blue
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="4" fill="#002B7F"/><rect y="4" width="32" height="3" fill="#fff"/><rect y="7" width="32" height="6" fill="#CE1126"/><rect y="13" width="32" height="3" fill="#fff"/><rect y="16" width="32" height="4" fill="#002B7F"/></svg>
    ),
    PA: ( // Panama: quarters white+blue/red+white
      <svg viewBox="0 0 32 20" className={className}><rect width="16" height="10" fill="#fff"/><rect x="16" width="16" height="10" fill="#D21034"/><rect y="10" width="16" height="10" fill="#005EB8"/><rect x="16" y="10" width="16" height="10" fill="#fff"/><polygon points="8,2 9,4.8 6,3.2 10,3.2 7,4.8" fill="#005EB8"/><polygon points="24,12 25,14.8 22,13.2 26,13.2 23,14.8" fill="#D21034"/></svg>
    ),
    ES: ( // Spain: red/yellow/red
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="5" fill="#AA151B"/><rect y="5" width="32" height="10" fill="#F1BF00"/><rect y="15" width="32" height="5" fill="#AA151B"/></svg>
    ),
    US: ( // USA: stripes + blue canton
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="20" fill="#fff"/>{[0,2,4,6,8,10,12].map(i=><rect key={i} y={i*1.54} width="32" height="1.54" fill="#B22234"/>)}<rect width="13" height="10.8" fill="#3C3B6E"/></svg>
    ),
    DO: ( // Dominican Republic: blue/red quarters + white cross
      <svg viewBox="0 0 32 20" className={className}><rect width="16" height="10" fill="#002D62"/><rect x="16" width="16" height="10" fill="#CE1126"/><rect y="10" width="16" height="10" fill="#CE1126"/><rect x="16" y="10" width="16" height="10" fill="#002D62"/><rect x="13" width="6" height="20" fill="#fff"/><rect y="7.5" width="32" height="5" fill="#fff"/></svg>
    ),
    GT: ( // Guatemala: blue/white/blue vertical
      <svg viewBox="0 0 32 20" className={className}><rect width="11" height="20" fill="#4997D0"/><rect x="11" width="10" height="20" fill="#fff"/><rect x="21" width="11" height="20" fill="#4997D0"/></svg>
    ),
    VE: ( // Venezuela: yellow/blue/red + stars
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="6.67" fill="#FCE300"/><rect y="6.67" width="32" height="6.67" fill="#00247D"/><rect y="13.33" width="32" height="6.67" fill="#CF142B"/></svg>
    ),
    HN: ( // Honduras: blue/white/blue + stars
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="6.67" fill="#0073CF"/><rect y="6.67" width="32" height="6.67" fill="#fff"/><rect y="13.33" width="32" height="6.67" fill="#0073CF"/><circle cx="12" cy="10" r="1" fill="#0073CF"/><circle cx="16" cy="8" r="1" fill="#0073CF"/><circle cx="16" cy="12" r="1" fill="#0073CF"/><circle cx="20" cy="10" r="1" fill="#0073CF"/></svg>
    ),
    SV: ( // El Salvador: blue/white/blue
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="6.67" fill="#0F47AF"/><rect y="6.67" width="32" height="6.67" fill="#fff"/><rect y="13.33" width="32" height="6.67" fill="#0F47AF"/></svg>
    ),
    NI: ( // Nicaragua: blue/white/blue
      <svg viewBox="0 0 32 20" className={className}><rect width="32" height="6.67" fill="#0067C6"/><rect y="6.67" width="32" height="6.67" fill="#fff"/><rect y="13.33" width="32" height="6.67" fill="#0067C6"/></svg>
    ),
  };
  return flags[code] || <svg viewBox="0 0 32 20" className={className}><rect width="32" height="20" fill="#e5e7eb" rx="2"/></svg>;
};

const VIDEOS = [
  "/videos/d277079e-dc50-4501-ab94-8c2c6b9eeefe.mp4",
  "/videos/veo-studio-creation (1).mp4",
  "/videos/veo-studio-creation (2).mp4",
];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [studioStep, setStudioStep] = useState(1);
  const [studioForm, setStudioForm] = useState({
    nombre: "",
    apellido: "",
    cargo: "",
    empresa: "",
    email: "",
    pais: "",
    whatsapp: "",
    idea: "",
  });
  const [emailError, setEmailError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<typeof COUNTRIES[number] | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  const validateCorporateEmail = (email: string): boolean => {
    if (!email.includes("@")) return false;
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return false;
    return !BLOCKED_EMAIL_DOMAINS.includes(domain);
  };

  const handleEmailChange = (email: string) => {
    setStudioForm({ ...studioForm, email });
    if (email && email.includes("@")) {
      const domain = email.split("@")[1]?.toLowerCase();
      if (domain && BLOCKED_EMAIL_DOMAINS.includes(domain)) {
        setEmailError("Ingresa un email corporativo. No se aceptan correos personales.");
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode) || null;
    setSelectedCountry(country);
    setStudioForm({ ...studioForm, pais: country?.name || "", whatsapp: "" });
    setCountryDropdownOpen(false);
  };

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [formData, setFormData] = useState<RegistrationData>({
    account_type: "",
    plan_tier: "",
    company_name: "",
    company_industry: "",
    company_size: "",
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    password: "",
    confirmPassword: "",
  });

  // Video rotation - cycle through 3 videos in infinite loop
  const handleVideoEnd = useCallback(() => {
    setCurrentVideoIndex((prev) => (prev + 1) % VIDEOS.length);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideoIndex]);

  // Navigation
  const handleAccountTypeSelect = (type: "core" | "studio") => {
    setFormData({ ...formData, account_type: type });
    if (type === "core") {
      setCurrentStep(2);
    } else {
      setStudioStep(1);
      setCurrentStep(6);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setFormData({ ...formData, plan_tier: planId as RegistrationData["plan_tier"] });
    setCurrentStep(3);
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.company_name && formData.company_industry && formData.company_size) {
      setCurrentStep(4);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await apiFetch(`${apiUrl}/api/companies/auth/register-company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_type: formData.account_type,
          plan_tier: formData.plan_tier,
          company_name: formData.company_name,
          company_industry: formData.company_industry,
          company_size: formData.company_size,
          admin_name: formData.admin_name,
          admin_email: formData.admin_email,
          admin_phone: formData.admin_phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Send welcome email with credentials
        if (formData.account_type === "core") {
          try {
            await apiFetch("/api/core-welcome", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                admin_name: formData.admin_name,
                admin_email: formData.admin_email,
                company_name: formData.company_name,
                plan_tier: formData.plan_tier,
                password: formData.password,
              }),
            });
          } catch {
            // Don't block registration if email fails
          }
        }
        setCurrentStep(5);
        setTimeout(() => {
          if (formData.account_type === "core") {
            router.push("/login");
          }
        }, 5000);
      } else {
        setError(data.detail || "Error al crear la cuenta");
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // Studio form submit - sends email to PM via API AND registers in backend DB
  const handleStudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Build full whatsapp with dial code
      const fullWhatsapp = selectedCountry ? `${selectedCountry.dial} ${studioForm.whatsapp}` : studioForm.whatsapp;
      const submitData = { ...studioForm, whatsapp: fullWhatsapp };

      // 1. Register in backend DB (creates Company record with type='studio')
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      try {
        await apiFetch(`${API_URL}/api/companies/auth/register-studio`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
      } catch {
        // Don't block if backend is unavailable - email will still be sent
      }

      // 2. Send notification emails via internal API
      const response = await apiFetch("/api/studio-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentStep(7);
      } else {
        setError(data.error || "Error al enviar la solicitud. Intenta nuevamente.");
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const getStepNumber = () => {
    if (formData.account_type === "studio") {
      if (currentStep === 1) return 1;
      if (currentStep === 6) return studioStep + 1;
      if (currentStep === 7) return 5;
    }
    return currentStep;
  };

  const getTotalSteps = () => (formData.account_type === "studio" ? 5 : 5);

  const STUDIO_TOTAL_STEPS = 3;

  const CheckIcon = () => (
    <svg className="h-4 w-4 shrink-0 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );

  /* ═══════════════ STUDIO SPLIT-SCREEN EXPERIENCE ═══════════════ */
  if (currentStep === 6 || currentStep === 7) {
    return (
      <div className="flex min-h-screen">
        {/* LEFT SIDE - Video Panel */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted playsInline autoPlay onEnded={handleVideoEnd}
          >
            <source src={VIDEOS[currentVideoIndex]} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />

          <div className="relative z-10 flex flex-col justify-between h-full p-10">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20">
                <span className="text-lg font-bold text-white">I</span>
              </div>
              <span className="text-xl font-bold text-white/90">Inspiratoria</span>
            </div>

            {/* Center info */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                {currentStep === 6 && studioStep === 1 && (
                  <>
                    <h2 className="text-4xl font-bold text-white mb-3 leading-tight">Servicio<br />completo</h2>
                    <p className="text-lg text-white/70 mb-6">Un ejecutivo dedicado gestionará tu programa</p>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-left">
                      <p className="text-sm font-semibold text-white/90 mb-3">Inspiratoria Studio incluye:</p>
                      <ul className="space-y-2 text-sm text-white/80">
                        <li className="flex items-center gap-2"><CheckIcon />Ejecutivo PM dedicado</li>
                        <li className="flex items-center gap-2"><CheckIcon />Diseño completo de programa</li>
                        <li className="flex items-center gap-2"><CheckIcon />Onboarding y capacitación</li>
                        <li className="flex items-center gap-2"><CheckIcon />Reportes y seguimiento continuo</li>
                      </ul>
                    </div>
                  </>
                )}
                {currentStep === 6 && studioStep === 2 && (
                  <>
                    <h2 className="text-4xl font-bold text-white mb-3 leading-tight">Cuéntanos de<br />tu empresa</h2>
                    <p className="text-lg text-white/70">Personalizaremos tu experiencia</p>
                  </>
                )}
                {currentStep === 6 && studioStep === 3 && (
                  <>
                    <h2 className="text-4xl font-bold text-white mb-3 leading-tight">Último paso</h2>
                    <p className="text-lg text-white/70">Cuéntanos qué necesitas y te contactaremos</p>
                  </>
                )}
                {currentStep === 7 && (
                  <>
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-6">
                      <PlanIconSvg type="heart" className="h-10 w-10 text-[#FFD902]" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-3 leading-tight">¡Recibido!</h2>
                    <p className="text-lg text-white/70">Tu ejecutivo te contactará pronto</p>
                  </>
                )}
              </div>
            </div>

            {/* Bottom progress */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                {Array.from({ length: STUDIO_TOTAL_STEPS }).map((_, idx) => (
                  <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${
                    currentStep === 7 || idx + 1 <= studioStep ? "bg-[#FFD902] w-12" : "bg-white/25 w-8"
                  }`} />
                ))}
              </div>
              <p className="text-white/50 text-sm">
                {currentStep === 7 ? "Completado" : `Paso ${studioStep} de ${STUDIO_TOTAL_STEPS}`}
              </p>
            </div>
          </div>

          {/* Video dots */}
          <div className="absolute bottom-10 right-10 z-10 flex gap-1.5">
            {VIDEOS.map((_, idx) => (
              <div key={idx} className={`h-1.5 w-1.5 rounded-full transition-all ${idx === currentVideoIndex ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
        </div>

        {/* RIGHT SIDE - White Form Panel */}
        <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white">
          {/* Mobile Header */}
          <div className="lg:hidden p-6 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD902]">
                <span className="text-lg font-bold text-gray-900">I</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Inspiratoria</span>
            </div>
          </div>

          {/* Scrollable Form Area */}
          <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
            <div className="w-full max-w-lg">
              {/* Error */}
              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                  <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {/* ── STUDIO STEP 1: Datos Personales ── */}
              {currentStep === 6 && studioStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <button
                      onClick={() => { setFormData({ ...formData, account_type: "" }); setCurrentStep(1); }}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Volver
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">Cuéntanos sobre ti</h1>
                      <span className="rounded-full bg-[#FFD902]/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">Studio</span>
                    </div>
                    <p className="text-gray-500">Queremos conocerte para conectarte con tu ejecutivo PM</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre</label>
                      <input
                        type="text"
                        value={studioForm.nombre}
                        onChange={(e) => setStudioForm({ ...studioForm, nombre: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#FFD902] focus:outline-none focus:ring-2 focus:ring-[#FFD902]/20 transition-all"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Apellido</label>
                      <input
                        type="text"
                        value={studioForm.apellido}
                        onChange={(e) => setStudioForm({ ...studioForm, apellido: e.target.value })}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#FFD902] focus:outline-none focus:ring-2 focus:ring-[#FFD902]/20 transition-all"
                        placeholder="Tu apellido"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Cargo</label>
                    <input
                      type="text"
                      value={studioForm.cargo}
                      onChange={(e) => setStudioForm({ ...studioForm, cargo: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#FFD902] focus:outline-none focus:ring-2 focus:ring-[#FFD902]/20 transition-all"
                      placeholder="Ej: Gerente de RRHH"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (studioForm.nombre && studioForm.apellido && studioForm.cargo) setStudioStep(2);
                    }}
                    disabled={!studioForm.nombre || !studioForm.apellido || !studioForm.cargo}
                    className="w-full rounded-xl px-4 py-3.5 font-bold text-gray-900 bg-[#FFD902] hover:bg-[#ffe44d] transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {/* ── STUDIO STEP 2: Empresa y Contacto ── */}
              {currentStep === 6 && studioStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <button
                      onClick={() => setStudioStep(1)}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Volver
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">Tu organización</h1>
                      <span className="rounded-full bg-[#FFD902]/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">Studio</span>
                    </div>
                    <p className="text-gray-500">Para diseñar una propuesta personalizada</p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Empresa</label>
                    <input
                      type="text"
                      value={studioForm.empresa}
                      onChange={(e) => setStudioForm({ ...studioForm, empresa: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#FFD902] focus:outline-none focus:ring-2 focus:ring-[#FFD902]/20 transition-all"
                      placeholder="Mi Empresa S.A."
                    />
                  </div>

                  {/* Email corporativo */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Email corporativo</label>
                    <input
                      type="email"
                      value={studioForm.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                        emailError
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : studioForm.email && !emailError && studioForm.email.includes("@")
                          ? "border-green-300 focus:border-green-400 focus:ring-green-100"
                          : "border-gray-300 focus:border-[#FFD902] focus:ring-[#FFD902]/20"
                      }`}
                      placeholder="tu@empresa.com"
                    />
                    {emailError && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {emailError}
                      </div>
                    )}
                    {!emailError && studioForm.email && studioForm.email.includes("@") && studioForm.email.split("@")[1]?.length > 2 && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-green-600">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Email corporativo válido
                      </div>
                    )}
                  </div>

                  {/* País - Custom dropdown con SVG flags */}
                  <div ref={countryDropdownRef} className="relative">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">País</label>
                    <button
                      type="button"
                      onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-left focus:outline-none focus:ring-2 transition-all flex items-center justify-between ${
                        selectedCountry
                          ? "border-gray-300 text-gray-900 focus:border-[#FFD902] focus:ring-[#FFD902]/20"
                          : "border-gray-300 text-gray-400 focus:border-[#FFD902] focus:ring-[#FFD902]/20"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {selectedCountry ? (
                          <>
                            <CountryFlag code={selectedCountry.code} className="w-7 h-5 rounded-sm shadow-sm" />
                            <span className="text-gray-900">{selectedCountry.name}</span>
                          </>
                        ) : (
                          "Selecciona tu país"
                        )}
                      </span>
                      <svg className={`h-5 w-5 text-gray-400 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {countryDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleCountryChange(c.code)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                              selectedCountry?.code === c.code ? "bg-[#FFD902]/10 font-medium" : ""
                            } ${c.code === COUNTRIES[0].code ? "rounded-t-xl" : ""} ${c.code === COUNTRIES[COUNTRIES.length - 1].code ? "rounded-b-xl" : ""}`}
                          >
                            <CountryFlag code={c.code} className="w-7 h-5 rounded-sm shadow-sm shrink-0" />
                            <span className="text-gray-900">{c.name}</span>
                            <span className="ml-auto text-xs text-gray-400">{c.dial}</span>
                            {selectedCountry?.code === c.code && (
                              <svg className="h-4 w-4 text-[#FFD902] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* WhatsApp con código de área automático */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">WhatsApp</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3 py-3 text-gray-600 text-sm font-medium min-w-[100px] justify-center select-none">
                        {selectedCountry ? (
                          <>
                            <CountryFlag code={selectedCountry.code} className="w-6 h-4 rounded-sm shadow-sm" />
                            <span>{selectedCountry.dial}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">+--</span>
                        )}
                      </div>
                      <input
                        type="tel"
                        value={studioForm.whatsapp}
                        onChange={(e) => setStudioForm({ ...studioForm, whatsapp: e.target.value.replace(/[^0-9\s]/g, "") })}
                        className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#FFD902] focus:outline-none focus:ring-2 focus:ring-[#FFD902]/20 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder={selectedCountry?.phonePlaceholder || "Selecciona un país primero"}
                        disabled={!selectedCountry}
                      />
                    </div>
                    {!selectedCountry && studioForm.whatsapp === "" && (
                      <p className="mt-1.5 text-xs text-gray-400">Selecciona tu país para habilitar este campo</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (studioForm.empresa && studioForm.email && selectedCountry && studioForm.whatsapp && !emailError && validateCorporateEmail(studioForm.email)) setStudioStep(3);
                    }}
                    disabled={!studioForm.empresa || !studioForm.email || !selectedCountry || !studioForm.whatsapp || !!emailError || !validateCorporateEmail(studioForm.email)}
                    className="w-full rounded-xl px-4 py-3.5 font-bold text-gray-900 bg-[#FFD902] hover:bg-[#ffe44d] transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {/* ── STUDIO STEP 3: Tu Idea ── */}
              {currentStep === 6 && studioStep === 3 && (
                <form onSubmit={handleStudioSubmit} className="space-y-6">
                  <div>
                    <button
                      type="button"
                      onClick={() => setStudioStep(2)}
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Volver
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">¿Qué necesitas?</h1>
                      <span className="rounded-full bg-[#FFD902]/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">Studio</span>
                    </div>
                    <p className="text-gray-500">Cuéntanos sobre el programa que te gustaría implementar</p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Tu idea o proyecto</label>
                    <textarea
                      value={studioForm.idea}
                      onChange={(e) => setStudioForm({ ...studioForm, idea: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#FFD902] focus:outline-none focus:ring-2 focus:ring-[#FFD902]/20 transition-all resize-none leading-relaxed"
                      placeholder="Ej: Queremos implementar un programa de mentoría para nuestros líderes, un círculo de aprendizaje para el equipo de innovación..."
                      rows={5}
                      required
                    />
                  </div>

                  {/* Summary card */}
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Resumen de tu solicitud</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                      <p><span className="text-gray-400 text-xs">Nombre</span><br /><span className="text-gray-900 font-medium">{studioForm.nombre} {studioForm.apellido}</span></p>
                      <p><span className="text-gray-400 text-xs">Cargo</span><br /><span className="text-gray-900 font-medium">{studioForm.cargo}</span></p>
                      <p><span className="text-gray-400 text-xs">Empresa</span><br /><span className="text-gray-900 font-medium">{studioForm.empresa}</span></p>
                      <p><span className="text-gray-400 text-xs">Email</span><br /><span className="text-gray-900 font-medium">{studioForm.email}</span></p>
                      <p><span className="text-gray-400 text-xs">País</span><br /><span className="text-gray-900 font-medium">{studioForm.pais}</span></p>
                      <p><span className="text-gray-400 text-xs">WhatsApp</span><br /><span className="text-gray-900 font-medium">{selectedCountry?.dial} {studioForm.whatsapp}</span></p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !studioForm.idea}
                    className="w-full rounded-xl px-4 py-3.5 font-bold text-gray-900 bg-[#FFD902] hover:bg-[#ffe44d] transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Enviando...
                      </span>
                    ) : "Enviar Solicitud"}
                  </button>

                  <p className="text-center text-xs text-gray-400">
                    Un ejecutivo PM de Inspiratoria te contactará en menos de 24 horas
                  </p>
                </form>
              )}

              {/* ── STUDIO: Confirmación ── */}
              {currentStep === 7 && (
                <div className="space-y-6 text-center py-4">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">¡Solicitud enviada!</h2>
                    <p className="text-gray-500">Tu ejecutivo PM te contactará pronto</p>
                  </div>

                  {/* Timeline */}
                  <div className="text-left space-y-0">
                    {[
                      { step: "1", text: "Recibirás un email de confirmación", done: true },
                      { step: "2", text: "Tu ejecutivo PM te contactará en 24 horas", done: false },
                      { step: "3", text: "Demo personalizada de Inspiratoria Studio", done: false },
                      { step: "4", text: "Diseño a medida de tu programa", done: false },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4 relative">
                        {idx < 3 && <div className="absolute left-[15px] top-[36px] w-px h-6 bg-gray-200" />}
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          item.done ? "bg-[#FFD902] text-gray-900" : "bg-gray-100 text-gray-400 border border-gray-200"
                        }`}>
                          {item.done ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : item.step}
                        </div>
                        <p className={`text-sm pt-1.5 ${item.done ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Data sent card */}
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-left">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos enviados</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                      <p><span className="text-gray-400 text-xs">Nombre</span><br /><span className="text-gray-900 font-medium">{studioForm.nombre} {studioForm.apellido}</span></p>
                      <p><span className="text-gray-400 text-xs">Cargo</span><br /><span className="text-gray-900 font-medium">{studioForm.cargo}</span></p>
                      <p><span className="text-gray-400 text-xs">Empresa</span><br /><span className="text-gray-900 font-medium">{studioForm.empresa}</span></p>
                      <p><span className="text-gray-400 text-xs">Email</span><br /><span className="text-gray-900 font-medium">{studioForm.email}</span></p>
                      <p><span className="text-gray-400 text-xs">País</span><br /><span className="text-gray-900 font-medium">{studioForm.pais}</span></p>
                      <p><span className="text-gray-400 text-xs">WhatsApp</span><br /><span className="text-gray-900 font-medium">{selectedCountry?.dial} {studioForm.whatsapp}</span></p>
                    </div>
                    {studioForm.idea && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-gray-400 text-xs mb-1">Idea</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{studioForm.idea}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => router.push("/")}
                    className="w-full rounded-xl px-4 py-3.5 font-bold text-gray-900 bg-[#FFD902] hover:bg-[#ffe44d] transition-all"
                  >
                    Volver al Inicio
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Progress */}
          <div className="lg:hidden p-6 pt-0 flex justify-center gap-2">
            {Array.from({ length: STUDIO_TOTAL_STEPS }).map((_, idx) => (
              <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${
                currentStep === 7 || idx + 1 <= studioStep ? "bg-[#FFD902] w-8" : "bg-gray-200 w-6"
              }`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* LEFT SIDE - Video Panel */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-black">
        {/* Video Background */}
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

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />

        {/* Content Over Video */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md border border-white/20">
              <span className="text-lg font-bold text-white">I</span>
            </div>
            <span className="text-xl font-bold text-white/90">Inspiratoria</span>
          </div>

          {/* Center - Step Info */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              {currentStep === 1 && (
                <>
                  <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
                    Transforma tu<br />organización
                  </h2>
                  <p className="text-lg text-white/70">
                    Programas de mentoría y formación que impulsan el desarrollo de talento
                  </p>
                </>
              )}
              {currentStep === 2 && (
                <>
                  <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
                    Elige el plan<br />perfecto
                  </h2>
                  <p className="text-lg text-white/70 mb-6">
                    Contrato anual · Pago mensual
                  </p>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-left">
                    <p className="text-sm font-semibold text-white/90 mb-3">Todos los planes incluyen:</p>
                    <ul className="space-y-2 text-sm text-white/80">
                      <li className="flex items-center gap-2"><CheckIcon />1 Certificación Core Program Lead</li>
                      <li className="flex items-center gap-2"><CheckIcon />Hasta 2 Admins sin costo</li>
                      <li className="flex items-center gap-2"><CheckIcon />Programas 1:1 y Células de Aprendizaje</li>
                      <li className="flex items-center gap-2"><CheckIcon />Soporte estratégico y actualizaciones</li>
                    </ul>
                  </div>
                </>
              )}
              {currentStep === 3 && (
                <>
                  <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
                    Cuéntanos de<br />tu empresa
                  </h2>
                  <p className="text-lg text-white/70">
                    Personalizaremos tu experiencia
                  </p>
                </>
              )}
              {currentStep === 4 && (
                <>
                  <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
                    Último paso
                  </h2>
                  <p className="text-lg text-white/70">
                    Crea tu cuenta de administrador
                  </p>
                </>
              )}
              {currentStep === 5 && (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-6">
                    <PlanIconSvg type="sparkles" className="h-10 w-10 text-primary-400" />
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
                    ¡Bienvenido!
                  </h2>
                  <p className="text-lg text-white/70">
                    Tu cuenta está lista para empezar
                  </p>
                </>
              )}
              {currentStep === 6 && (
                <>
                  <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
                    Servicio<br />completo
                  </h2>
                  <p className="text-lg text-white/70 mb-6">
                    Un ejecutivo dedicado gestionará tu programa de mentoría
                  </p>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-left">
                    <p className="text-sm font-semibold text-white/90 mb-3">Inspiratoria Studio incluye:</p>
                    <ul className="space-y-2 text-sm text-white/80">
                      <li className="flex items-center gap-2"><CheckIcon />Ejecutivo PM dedicado</li>
                      <li className="flex items-center gap-2"><CheckIcon />Diseño completo de programa</li>
                      <li className="flex items-center gap-2"><CheckIcon />Onboarding y capacitación</li>
                      <li className="flex items-center gap-2"><CheckIcon />Reportes y seguimiento continuo</li>
                    </ul>
                  </div>
                </>
              )}
              {currentStep === 7 && (
                <>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-6">
                    <PlanIconSvg type="heart" className="h-10 w-10 text-purple-400" />
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-3 leading-tight">
                    ¡Recibido!
                  </h2>
                  <p className="text-lg text-white/70">
                    Tu ejecutivo te contactará pronto
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Bottom - Progress */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {Array.from({ length: getTotalSteps() }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx + 1 <= getStepNumber()
                      ? "bg-white w-12"
                      : "bg-white/25 w-8"
                  }`}
                />
              ))}
            </div>
            <p className="text-white/50 text-sm">
              Paso {getStepNumber()} de {getTotalSteps()}
            </p>
          </div>
        </div>

        {/* Video Dots */}
        <div className="absolute bottom-10 right-10 z-10 flex gap-1.5">
          {VIDEOS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                idx === currentVideoIndex ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* RIGHT SIDE - Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-white">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600">
              <span className="text-lg font-bold text-white">I</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Inspiratoria</span>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-lg">
            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* ===================== STEP 1: Tipo de Cuenta ===================== */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido a Inspiratoria</h1>
                  <p className="text-gray-500">Selecciona la solución que mejor se adapta a tu organización</p>
                </div>

                <div className="space-y-4">
                  {/* Studio — Active */}
                  <button
                    onClick={() => handleAccountTypeSelect("studio")}
                    className="group w-full relative rounded-2xl border-2 border-[#FFD902]/40 bg-[#FFD902]/[0.04] p-6 text-left transition-all hover:border-[#FFD902] hover:shadow-lg hover:shadow-[#FFD902]/10 active:scale-[0.99]"
                  >
                    <div className="absolute right-4 top-4">
                      <span className="rounded-full bg-[#FFD902] px-2.5 py-0.5 text-[10px] font-bold text-gray-900 shadow-sm">
                        RECOMENDADO
                      </span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD902] to-amber-500 shadow-lg shadow-[#FFD902]/20">
                        <PlanIconSvg type="sparkles" className="h-7 w-7 text-gray-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">Inspiratoria Studio</h3>
                          <span className="rounded-full bg-[#FFD902]/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                            Full Service
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          Inspiratoria diseña, implementa y gestiona tu programa de mentoría y aprendizaje de principio a fin
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><CheckIcon /> Ejecutivo PM dedicado</span>
                          <span className="flex items-center gap-1"><CheckIcon /> Onboarding personalizado</span>
                          <span className="flex items-center gap-1"><CheckIcon /> Métricas de impacto</span>
                        </div>
                      </div>
                      <svg className="h-5 w-5 text-[#FFD902] mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* Core — Blocked / Próximamente */}
                  <div
                    className="relative w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 p-6 text-left cursor-not-allowed opacity-60"
                  >
                    <div className="absolute right-4 top-4">
                      <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Próximamente
                      </span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-200">
                        <PlanIconSvg type="bolt" className="h-7 w-7 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-400">Inspiratoria Core</h3>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                            Autogestión
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          Diseña y gestiona tus programas de mentoría con autonomía total
                        </p>
                        <p className="text-xs text-gray-300">Contrato anual · Desde CLP $790.000/mes</p>
                      </div>
                      <svg className="h-5 w-5 text-gray-200 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-400">
                  ¿Ya tienes una cuenta?{" "}
                  <a href="/login" className="font-semibold text-primary-600 hover:underline">Iniciar Sesión</a>
                </p>
              </div>
            )}

            {/* ===================== STEP 2: Plan Pricing ===================== */}
            {currentStep === 2 && formData.account_type === "core" && (
              <div className="space-y-6">
                <div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver
                  </button>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Elige tu Plan</h1>
                  <p className="text-gray-500">Contrato anual (12 meses) · Pago mensual</p>
                </div>

                <div className="space-y-3">
                  {PLAN_TIERS.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan.id)}
                      className={`group w-full relative rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md active:scale-[0.99] ${
                        plan.popular
                          ? "border-primary-300 bg-primary-50/40 hover:border-primary-400 hover:shadow-primary-500/10"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-5">
                          <span className="rounded-full bg-primary-500 px-3 py-1 text-xs font-bold text-black shadow-sm">
                            MÁS POPULAR
                          </span>
                        </div>
                      )}
                      {plan.custom && (
                        <div className="absolute -top-3 left-5">
                          <span className="rounded-full bg-gray-800 px-3 py-1 text-xs font-bold text-white shadow-sm">
                            PERSONALIZADO
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400/20 to-primary-600/20">
                          <PlanIconSvg type={plan.icon} className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                          <p className="text-sm text-gray-500">{plan.participants}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-baseline gap-0.5">
                            {plan.custom && <span className="text-xs text-gray-400 mr-1">desde</span>}
                            <span className="text-xs text-gray-400">$</span>
                            <span className="text-xl font-bold text-gray-900">{plan.price}</span>
                          </div>
                          <p className="text-xs text-gray-400">CLP/mes</p>
                        </div>
                        <svg className="h-5 w-5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Included Features - Compact */}
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Incluido en todos los planes</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <CheckIcon />
                      <span>Certificación Core Lead</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckIcon />
                      <span>2 Admins sin costo</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckIcon />
                      <span>Programas 1:1</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckIcon />
                      <span>Células de Aprendizaje</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckIcon />
                      <span>Soporte estratégico</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckIcon />
                      <span>Actualizaciones</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== STEP 3: Datos de Empresa ===================== */}
            {currentStep === 3 && (
              <form onSubmit={handleCompanySubmit} className="space-y-5">
                <div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(formData.account_type === "core" ? 2 : 1)}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver
                  </button>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Tu Empresa</h1>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      formData.account_type === "studio"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-primary-100 text-primary-700"
                    }`}>
                      {formData.account_type === "studio"
                        ? "Studio"
                        : PLAN_TIERS.find(p => p.id === formData.plan_tier)?.name || "Core"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    placeholder="Mi Empresa S.A."
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Industria</label>
                  <select
                    value={formData.company_industry}
                    onChange={(e) => setFormData({ ...formData, company_industry: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    required
                  >
                    <option value="">Selecciona una industria</option>
                    <option value="technology">Tecnología</option>
                    <option value="finance">Finanzas y Banca</option>
                    <option value="retail">Retail y Comercio</option>
                    <option value="healthcare">Salud</option>
                    <option value="manufacturing">Manufactura</option>
                    <option value="mining">Minería</option>
                    <option value="energy">Energía</option>
                    <option value="education">Educación</option>
                    <option value="consulting">Consultoría</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Tamaño</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: "1-50", label: "1-50" },
                      { value: "51-200", label: "51-200" },
                      { value: "201-500", label: "201-500" },
                      { value: "500+", label: "500+" },
                    ].map((size) => (
                      <label
                        key={size.value}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 py-3 text-center transition-all ${
                          formData.company_size === size.value
                            ? formData.account_type === "studio"
                              ? "border-purple-500 bg-purple-50 text-purple-700"
                              : "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="company_size"
                          value={size.value}
                          checked={formData.company_size === size.value}
                          onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                          className="sr-only"
                        />
                        <span className="text-sm font-bold">{size.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!formData.company_name || !formData.company_industry || !formData.company_size}
                  className={`w-full rounded-xl px-4 py-3.5 font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    formData.account_type === "studio"
                      ? "bg-purple-500 text-white hover:bg-purple-600"
                      : "bg-primary-500 text-black hover:bg-primary-400"
                  }`}
                >
                  Continuar
                </button>
              </form>
            )}

            {/* ===================== STEP 4: Admin ===================== */}
            {currentStep === 4 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver
                  </button>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Tu Cuenta</h1>
                  <p className="text-gray-500">
                    Admin principal de <span className="font-semibold text-gray-700">{formData.company_name}</span>
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    placeholder="Juan Pérez González"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Corporativo</label>
                    <input
                      type="email"
                      value={formData.admin_email}
                      onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                      placeholder="juan@empresa.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.admin_phone}
                      onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                      placeholder="+56 9 1234 5678"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Contraseña</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirmar</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                      placeholder="••••••••"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full rounded-xl px-4 py-3.5 font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    formData.account_type === "studio"
                      ? "bg-purple-500 text-white hover:bg-purple-600"
                      : "bg-primary-500 text-black hover:bg-primary-400"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creando...
                    </span>
                  ) : formData.account_type === "studio" ? "Solicitar Contacto" : "Crear Cuenta"}
                </button>
              </form>
            )}

            {/* ===================== STEP 5: Completado Core ===================== */}
            {currentStep === 5 && (
              <div className="space-y-6 text-center py-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="mb-2 text-2xl font-bold text-gray-900">¡Cuenta Creada!</h2>
                  <p className="text-gray-500">Tu cuenta de {formData.company_name} está lista</p>
                </div>
                <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5 text-left">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li><span className="font-semibold">Empresa:</span> {formData.company_name}</li>
                    <li><span className="font-semibold">Plan:</span> {PLAN_TIERS.find(p => p.id === formData.plan_tier)?.name || "Core"}</li>
                    <li><span className="font-semibold">Admin:</span> {formData.admin_name}</li>
                    <li><span className="font-semibold">Email:</span> {formData.admin_email}</li>
                  </ul>
                </div>
                <div className="rounded-xl bg-purple-50 border border-purple-100 p-4 text-left flex items-start gap-3">
                  <svg className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-purple-700">Email de bienvenida enviado</p>
                    <p className="text-xs text-purple-600 mt-1">Revisa tu bandeja de entrada en <strong>{formData.admin_email}</strong> — incluye tus credenciales de acceso</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full rounded-xl px-4 py-3.5 font-bold transition bg-primary-500 text-black hover:bg-primary-400"
                >
                  Ir al Login →
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Mobile Progress */}
        <div className="lg:hidden p-6 pt-0 flex justify-center gap-2">
          {Array.from({ length: getTotalSteps() }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx + 1 <= getStepNumber()
                  ? formData.account_type === "studio"
                    ? "bg-purple-500 w-8"
                    : "bg-primary-500 w-8"
                  : "bg-gray-200 w-6"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
