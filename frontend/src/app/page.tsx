"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

// Videos: hero carousel + featured section
const HERO_VIDEOS = [
  "/videos/d277079e-dc50-4501-ab94-8c2c6b9eeefe.mp4",
  "/videos/veo-studio-creation (1).mp4",
  "/videos/veo-studio-creation (2).mp4",
];
const FEATURED_VIDEO = "/home/veo-studio-creation (9).mp4";

const NAV_LINKS = [
  { label: "Nosotros", href: "#nosotros" },
  { label: "Servicios", href: "#servicios" },
  { label: "Plataforma", href: "#plataforma" },
  { label: "Impacto", href: "#impacto" },
  { label: "Contacto", href: "#contacto" },
];

// ─── SVG Icons ───
const IconBolt = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
);
const IconUsers = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
);
const IconTarget = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
);
const IconChart = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
);
const IconSparkles = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 008.5 14.063l-6.135-1.582a.5.5 0 010-.962L8.5 9.936A2 2 0 009.937 8.5l1.582-6.135a.5.5 0 01.962 0L14.063 8.5A2 2 0 0015.5 9.937l6.135 1.582a.5.5 0 010 .962L15.5 14.063a2 2 0 00-1.437 1.437l-1.582 6.135a.5.5 0 01-.962 0z" /></svg>
);
const IconGlobe = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
);
const IconHeart = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
);
const IconArrowRight = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);
const IconCheck = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const IconMail = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);
const IconMapPin = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const IconPhone = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
);
const IconPlay = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const IconQuote = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
);
const IconStar = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
);

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [shuffledLogos] = useState(() => Array.from({ length: 19 }, (_, i) => i + 1));
  const videoRef = useRef<HTMLVideoElement>(null);
  const macarenaVideoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnd = useCallback(() => {
    setCurrentVideoIndex((prev) => (prev + 1) % HERO_VIDEOS.length);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (v) { v.load(); v.play().catch(() => {}); }
  }, [currentVideoIndex]);

  useEffect(() => {
    const mv = macarenaVideoRef.current;
    if (mv) { mv.playbackRate = 0.4; mv.play().catch(() => {}); }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  // Smooth scroll
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      {/* ═══════════════ HEADER ═══════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-gray-950 border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center">
              <Image
                src="/home/inspiratoria_negro-negro-300x68.png"
                alt="Inspiratoria"
                width={160}
                height={36}
                className="transition-all duration-300 brightness-0 invert"
                priority
              />
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`px-4 py-2 text-[13px] font-medium rounded-full transition-all duration-200 ${
                    scrolled
                      ? "text-white/70 hover:text-white hover:bg-white/10"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className={`px-5 py-2 text-[13px] font-medium rounded-full transition-all duration-200 ${
                  scrolled
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="px-6 py-2.5 text-[13px] font-bold rounded-full transition-all duration-200 bg-[#FFD902] text-gray-900 hover:bg-[#ffe44d] shadow-lg shadow-[#FFD902]/25 hover:shadow-[#FFD902]/40 active:scale-[0.97]"
              >
                Solicitar un Demo
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl transition-colors ${scrolled ? "text-white hover:bg-white/10" : "text-white hover:bg-white/10"}`}
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="bg-gray-950 border-t border-white/10 shadow-2xl px-6 py-5 space-y-1">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={(e) => { handleNavClick(e, link.href); setMobileMenuOpen(false); }} className="block px-4 py-3 text-white/70 font-medium rounded-xl hover:bg-white/10 transition-colors">
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <Link href="/login" className="block w-full text-center px-4 py-3 text-white font-medium rounded-xl border border-white/20 hover:bg-white/10 transition-colors">
                Iniciar Sesión
              </Link>
              <Link href="/register" className="block w-full text-center px-4 py-3.5 bg-[#FFD902] text-gray-900 font-bold rounded-xl hover:bg-[#ffe44d] transition-colors shadow-sm">
                Solicitar un Demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover scale-105"
          muted playsInline autoPlay onEnded={handleVideoEnd}
        >
          <source src={HERO_VIDEOS[currentVideoIndex]} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-black/75" />

        {/* Decorative yellow accent */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FFD902]/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-32 lg:py-0 w-full">
          <div className="max-w-3xl">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 px-5 py-2.5 mb-10 animate-[fadeInUp_0.6s_ease-out]">
              <div className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#FFD902] opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#FFD902]" />
              </div>
              <span className="text-sm font-medium text-white/90">Academia de Habilidades Sociales</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-extrabold text-white leading-[1.02] tracking-tight animate-[fadeInUp_0.6s_ease-out_0.1s_both]">
              Potenciamos<br />
              talento humano<br />
              <span className="relative inline-block">
                <span className="text-[#FFD902]">que transforma organizaciones</span>
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#FFD902]/30" preserveAspectRatio="none" viewBox="0 0 200 8"><path d="M0 7c50-4 100-4 200 0" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
              </span>
            </h1>

            <p className="mt-8 text-lg lg:text-xl text-white/50 leading-relaxed max-w-xl animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
              Diseñamos experiencias de aprendizaje, mentoría y formación que movilizan personas, equipos y culturas organizacionales. Porque sin diversidad, no hay innovación.
            </p>

            <div className="mt-12 flex flex-wrap gap-4 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
              <Link href="/register" className="group inline-flex items-center gap-2.5 px-8 py-4 bg-[#FFD902] text-gray-900 font-bold rounded-2xl hover:bg-[#ffe44d] transition-all shadow-[0_8px_30px_rgba(255,217,2,0.35)] hover:shadow-[0_12px_40px_rgba(255,217,2,0.5)] active:scale-[0.97]">
                Solicitar un Demo
                <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-2xl border border-white/15 hover:bg-white/20 transition-all active:scale-[0.97]">
                Ya tengo cuenta
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-16 flex items-center gap-6 animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
              <div className="flex -space-x-3">
                {[
                  "bg-gradient-to-br from-yellow-400 to-amber-500",
                  "bg-gradient-to-br from-rose-400 to-pink-500",
                  "bg-gradient-to-br from-blue-400 to-indigo-500",
                  "bg-gradient-to-br from-emerald-400 to-teal-500",
                  "bg-gradient-to-br from-purple-400 to-violet-500"
                ].map((bg, i) => (
                  <div key={i} className={`flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-black/40 ${bg} text-[10px] font-bold text-white shadow-lg`}>
                    {["MS", "VG", "PF", "AS", "IG"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map((i) => <IconStar key={i} className="h-3.5 w-3.5 text-[#FFD902]" />)}
                </div>
                <p className="text-sm font-semibold text-white/80">+500 profesionales impactados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Video dots */}
        <div className="absolute bottom-10 right-10 z-10 flex gap-2">
          {HERO_VIDEOS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentVideoIndex(idx)}
              className={`rounded-full transition-all duration-500 ${idx === currentVideoIndex ? "bg-[#FFD902] w-8 h-2" : "bg-white/30 w-2 h-2 hover:bg-white/50"}`}
            />
          ))}
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 hidden lg:flex flex-col items-center gap-3">
          <div className="w-5 h-8 rounded-full border-2 border-white/25 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-white/60 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════════ LOGO CAROUSEL ═══════════════ */}
      <section className="py-16 bg-gray-50/60 border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-12">
            Grandes corporaciones que confían en Inspiratoria
          </p>
        </div>
        <div className="relative w-full">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50/90 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50/90 to-transparent z-10 pointer-events-none" />
          {/* Scrolling track */}
          <div className="flex animate-logo-scroll hover:[animation-play-state:paused]">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex shrink-0 items-center gap-16 px-8">
                {shuffledLogos.map((num) => (
                  <div key={`${setIndex}-${num}`} className="flex-shrink-0 w-[240px] h-[120px] relative group cursor-pointer">
                    <Image
                      src={`/logo/${num}.png`}
                      alt={`Partner ${num}`}
                      fill
                      className="object-contain filter grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                      sizes="240px"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ EL PROBLEMA ═══════════════ */}
      <section className="py-28 lg:py-36" data-animate id="el-problema">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className={`text-center max-w-3xl mx-auto mb-20 transition-all duration-1000 ${isVisible("el-problema") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-rose-400" />
              <span className="text-xs font-bold text-rose-500 uppercase tracking-[0.2em]">El desafío</span>
              <div className="h-px w-8 bg-rose-400" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900">
              Las empresas están<br /><span className="text-gray-300">perdiendo talento</span>
            </h2>
            <p className="mt-5 text-lg text-gray-500 leading-relaxed">
              El desarrollo del talento y del liderazgo aún ocurre de forma dispersa en muchas organizaciones, sin estructuras que permitan transferir experiencia y formar nuevos líderes de manera consistente.
            </p>
          </div>

          <div className={`grid md:grid-cols-3 gap-8 transition-all duration-1000 delay-200 ${isVisible("el-problema") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {[
              { stat: "76%", problem: "de profesionales quiere mentoría, pero solo 37% la tiene.", source: "Fuente: Forbes, 2024", color: "border-rose-200 bg-rose-50/50", iconColor: "text-rose-500", icon: <IconUsers className="h-6 w-6" /> },
              { stat: "2.5x", problem: "más rotación en empresas sin programas de desarrollo de talento.", source: "Fuente: Deloitte", color: "border-amber-200 bg-amber-50/50", iconColor: "text-amber-500", icon: <IconChart className="h-6 w-6" /> },
              { stat: "24%", problem: "de los cargos de liderazgo en LATAM son ocupados por mujeres.", source: "Fuente: OIT, 2024", color: "border-purple-200 bg-purple-50/50", iconColor: "text-purple-500", icon: <IconTarget className="h-6 w-6" /> },
            ].map((item) => (
              <div key={item.stat} className={`rounded-[1.75rem] border ${item.color} p-10 text-center`}>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white ${item.iconColor} mx-auto mb-6 shadow-sm`}>
                  {item.icon}
                </div>
                <p className="text-5xl font-extrabold text-gray-900 tracking-tight">{item.stat}</p>
                <p className="mt-4 text-gray-600 leading-relaxed">{item.problem}</p>
                <p className="mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.source}</p>
              </div>
            ))}
          </div>

          <div className={`mt-16 text-center transition-all duration-1000 delay-400 ${isVisible("el-problema") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-3 bg-[#FFD902]/10 rounded-2xl px-8 py-5 border border-[#FFD902]/20">
              <IconBolt className="h-6 w-6 text-[#FFD902] shrink-0" />
              <p className="text-left">
                <span className="font-bold text-gray-900">La solución existe.</span>
                <span className="text-gray-500 ml-1">Inspiratoria combina mentoría, aprendizaje colaborativo y tecnología para desarrollar talento, fortalecer el liderazgo y medir impacto en las organizaciones.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MACARENA — FUNDADORA ═══════════════ */}
      <section className="py-28 lg:py-36 overflow-hidden bg-gray-50/60" id="nosotros" data-animate>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className={`grid lg:grid-cols-2 gap-16 lg:gap-24 items-center transition-all duration-1000 ${isVisible("nosotros") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {/* Video side */}
            <div className="relative group">
              <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl shadow-gray-300/30">
                <video
                  ref={macarenaVideoRef}
                  src="/home/veo-studio-creation%20(10).mp4"
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20 mb-3">
                    <IconHeart className="h-4 w-4 text-[#FFD902]" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">Fundadora</span>
                  </div>
                  <p className="text-2xl font-bold text-white">Macarena Salosny</p>
                  <p className="text-white/60 text-sm mt-1">CEO & Fundadora de Inspiratoria</p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#FFD902]/20 rounded-2xl -z-10 rotate-6" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#FFD902]/10 rounded-full -z-10" />
            </div>

            {/* Quote side */}
            <div>
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="h-px w-8 bg-[#FFD902]" />
                <span className="text-xs font-bold text-[#FFD902] uppercase tracking-[0.2em]">¿Qué nos motiva?</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-[1.1]">
                Sin diversidad,<br />
                <span className="text-gray-300">no hay innovación</span>
              </h2>

              <div className="relative mt-10">
                <IconQuote className="h-12 w-12 text-[#FFD902]/20 absolute -top-4 -left-2" />
                <blockquote className="relative text-xl lg:text-2xl text-gray-700 leading-relaxed font-medium italic pl-8 border-l-4 border-[#FFD902]">
                  Me motiva diseñar experiencias interactivas y lúdicas donde las personas puedan compartir su historia, aprender unas de otras y ampliar sus perspectivas.
                </blockquote>
              </div>

              <p className="mt-8 text-gray-500 leading-relaxed text-lg">
                Salir de nuestros círculos de referencia es clave para el aprendizaje y la innovación. Por eso en Inspiratoria diseñamos experiencias y programas de desarrollo que fortalecen el liderazgo, la colaboración y el talento humano en las organizaciones.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-4">
                {[
                  { value: "2,400+", label: "Profesionales capacitados" },
                  { value: "18+", label: "Empresas partner" },
                  { value: "98%", label: "Satisfacción" },
                  { value: "10+", label: "Años de experiencia" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link href="/register" className="group inline-flex items-center gap-2 text-gray-900 font-bold hover:text-[#b39700] transition-colors">
                  Conoce más sobre Inspiratoria
                  <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ VIDEO SHOWCASE ═══════════════ */}
      <section className="relative py-32 lg:py-40 overflow-hidden" data-animate id="video-showcase">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          muted playsInline autoPlay loop
        >
          <source src={FEATURED_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/60" />

        <div className={`relative z-10 max-w-7xl mx-auto px-6 lg:px-10 transition-all duration-1000 ${isVisible("video-showcase") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 bg-[#FFD902]/20 backdrop-blur-xl rounded-full px-5 py-2 border border-[#FFD902]/30 mb-8">
              <IconPlay className="h-4 w-4 text-[#FFD902]" />
              <span className="text-sm font-semibold text-[#FFD902]">Transformando realidades</span>
            </div>

            <h2 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.05]">
              Cada historia<br />
              <span className="text-[#FFD902]">merece ser contada</span>
            </h2>

            <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-lg">
              Nuestras experiencias no solo enseñan: conectan personas, amplían perspectivas y activan comunidades capaces de generar cambio real en las organizaciones.
            </p>

            <div className="mt-10 flex flex-wrap gap-8">
              {[
                { icon: <IconHeart className="h-5 w-5 text-[#FFD902]" />, text: "Perspectivas diversas" },
                { icon: <IconUsers className="h-5 w-5 text-[#FFD902]" />, text: "Aprendizaje colaborativo" },
                { icon: <IconSparkles className="h-5 w-5 text-[#FFD902]" />, text: "Liderazgo que inspira" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5">
                  {item.icon}
                  <span className="text-sm font-semibold text-white">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Link href="/register" className="group inline-flex items-center gap-2.5 px-8 py-4 bg-[#FFD902] text-gray-900 font-bold rounded-2xl hover:bg-[#ffe44d] transition-all shadow-[0_8px_30px_rgba(255,217,2,0.35)] active:scale-[0.97]">
                En metodologías que transforman vidas
                <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SERVICIOS ═══════════════ */}
      <section className="py-28 lg:py-36 bg-gray-50/60" id="servicios" data-animate>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className={`text-center max-w-2xl mx-auto mb-20 transition-all duration-1000 ${isVisible("servicios") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#FFD902]" />
              <span className="text-xs font-bold text-[#FFD902] uppercase tracking-[0.2em]">Servicios</span>
              <div className="h-px w-8 bg-[#FFD902]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900">
              Experiencias que desarrollan<br /><span className="text-gray-300">talento y liderazgo</span>
            </h2>
            <p className="mt-5 text-lg text-gray-500 leading-relaxed">
              Diseñamos experiencias de aprendizaje que fortalecen el liderazgo, activan conversaciones significativas y generan impacto real en personas y organizaciones.
            </p>
          </div>

          <div className={`grid md:grid-cols-3 gap-8 transition-all duration-1000 delay-200 ${isVisible("servicios") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {[
              {
                icon: <IconBolt className="h-7 w-7" />,
                title: "Experiencias Corporativas",
                description: "Charlas, workshops y programas diseñados para desarrollar liderazgo, comunicación estratégica y colaboración en equipos.",
                accent: "bg-[#FFD902]",
                hoverBg: "group-hover:bg-[#FFD902]/5",
              },
              {
                icon: <IconSparkles className="h-7 w-7" />,
                title: "RNDM Inspiratoria",
                description: "Metodología lúdica que activa conversaciones profundas, amplía perspectivas y fortalece el aprendizaje colectivo.",
                accent: "bg-rose-500",
                hoverBg: "group-hover:bg-rose-50",
              },
              {
                icon: <IconTarget className="h-7 w-7" />,
                title: "Plataforma Inspiratoria",
                description: "Interfaz diseñada para gestionar programas de mentoría y aprendizaje organizacional dentro de las empresas.",
                accent: "bg-emerald-500",
                hoverBg: "group-hover:bg-emerald-50",
              },
            ].map((service) => (
              <div key={service.title} className={`group relative rounded-[1.75rem] bg-white border border-gray-100 p-10 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-500 hover:-translate-y-2 ${service.hoverBg}`}>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${service.accent} text-white mb-8 shadow-lg`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-8">{service.description}</p>
                <a href="#contacto" onClick={(e) => handleNavClick(e, "#contacto")} className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-900 group-hover:text-[#b39700] transition-colors">
                  Saber más
                  <IconArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PLATAFORMA ═══════════════ */}
      <section className="py-28 lg:py-36" id="plataforma" data-animate>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className={`text-center max-w-2xl mx-auto mb-20 transition-all duration-1000 ${isVisible("plataforma") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#FFD902]" />
              <span className="text-xs font-bold text-[#FFD902] uppercase tracking-[0.2em]">Plataforma</span>
              <div className="h-px w-8 bg-[#FFD902]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900">
              Gestiona programas<br /><span className="text-gray-300">de mentoría y aprendizaje a escala</span>
            </h2>
            <p className="mt-5 text-lg text-gray-500">
              Nuestra plataforma permite implementar y administrar programas de mentoría y aprendizaje organizacional con matching inteligente, seguimiento automatizado y métricas de impacto en tiempo real.
            </p>
          </div>

          <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-200 ${isVisible("plataforma") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {[
              { icon: <IconUsers className="h-6 w-6" />, title: "Match con IA", desc: "Conecta participantes según habilidades, objetivos y disponibilidad para crear duplas o células de aprendizaje efectivas.", color: "text-[#FFD902]", bg: "bg-[#FFD902]/10" },
              { icon: <IconChart className="h-6 w-6" />, title: "Métricas de impacto", desc: "Visualiza avances del programa con indicadores en tiempo real sobre participación, progreso y resultados.", color: "text-rose-500", bg: "bg-rose-50" },
              { icon: <IconBolt className="h-6 w-6" />, title: "Nudges & Momentum", desc: "Recordatorios, hitos y contenidos contextuales que mantienen activo el aprendizaje entre participantes.", color: "text-emerald-500", bg: "bg-emerald-50" },
              { icon: <IconGlobe className="h-6 w-6" />, title: "White-label", desc: "Personaliza la plataforma con la identidad de tu organización y gestiona programas bajo tu propia marca.", color: "text-blue-500", bg: "bg-blue-50" },
            ].map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-gray-100 bg-white p-7 hover:border-[#FFD902]/30 hover:shadow-xl hover:shadow-[#FFD902]/5 transition-all duration-300 hover:-translate-y-1">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color} mb-5`}>
                  {feature.icon}
                </div>
                <h3 className="font-extrabold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center">
            <Link href="/register" className="group inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/15 active:scale-[0.97]">
              Solicitar un Demo
              <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>

          </div>
        </div>
      </section>

      {/* ═══════════════ CÓMO FUNCIONA ═══════════════ */}
      <section className="py-28 lg:py-36 bg-gray-50/60" data-animate id="como-funciona">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className={`text-center max-w-2xl mx-auto mb-20 transition-all duration-1000 ${isVisible("como-funciona") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#FFD902]" />
              <span className="text-xs font-bold text-[#FFD902] uppercase tracking-[0.2em]">Proceso simple</span>
              <div className="h-px w-8 bg-[#FFD902]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900">
              De cero a impacto<br /><span className="text-gray-300">en 4 pasos</span>
            </h2>
            <p className="mt-5 text-lg text-gray-500">
              Implementar un programa de mentoría con Inspiratoria es más simple de lo que crees.
            </p>
          </div>

          <div className={`grid md:grid-cols-4 gap-0 transition-all duration-1000 delay-200 ${isVisible("como-funciona") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {[
              { step: "01", title: "Solicita tu Demo", desc: "Conoce Inspiratoria Studio y descubre cómo implementar programas de mentoría y aprendizaje en tu organización.", icon: <IconGlobe className="h-6 w-6" />, color: "text-[#FFD902]" },
              { step: "02", title: "Match IA", desc: "Nuestro algoritmo combina participantes por habilidades, metas y compatibilidad para crear duplas efectivas.", icon: <IconSparkles className="h-6 w-6" />, color: "text-rose-500" },
              { step: "03", title: "Aprendizaje activo", desc: "Las duplas trabajan con nudges automáticos, hitos y contenido contextualizado para mantener el momentum.", icon: <IconUsers className="h-6 w-6" />, color: "text-emerald-500" },
              { step: "04", title: "Mide impacto", desc: "Dashboard con métricas de participación, progreso, satisfacción y desarrollo de habilidades en tiempo real.", icon: <IconChart className="h-6 w-6" />, color: "text-blue-500" },
            ].map((item, idx) => (
              <div key={item.step} className="relative text-center px-6 py-10">
                {/* connector line */}
                {idx < 3 && <div className="hidden md:block absolute top-1/3 right-0 w-full h-px bg-gradient-to-r from-gray-200 via-gray-200 to-transparent translate-x-1/2 z-0" />}
                <div className="relative z-10">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-gray-100 ${item.color} mx-auto mb-6 shadow-lg shadow-gray-100`}>
                    {item.icon}
                  </div>
                  <div className="text-[11px] font-extrabold text-gray-300 uppercase tracking-[0.3em] mb-2">Paso {item.step}</div>
                  <h3 className="text-xl font-extrabold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/register" className="group inline-flex items-center gap-2 px-8 py-4 bg-[#FFD902] text-gray-900 font-bold rounded-2xl hover:bg-[#ffe44d] transition-all shadow-[0_8px_30px_rgba(255,217,2,0.25)] active:scale-[0.97]">
              Solicitar una reunión
              <IconArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ CASO DE ÉXITO EXPANDIDO ═══════════════ */}
      <section className="py-28 lg:py-36" data-animate id="caso-exito">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${isVisible("caso-exito") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {/* Metrics side */}
            <div>
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="h-px w-8 bg-emerald-400" />
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em]">Caso de éxito</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-[1.1]">
                Ideal redujo rotación<br /><span className="text-emerald-400">en un 32%</span>
              </h2>
              <p className="mt-6 text-lg text-gray-500 leading-relaxed">
                Con un programa de mentoría estructurado en Inspiratoria, Ideal logró retener talento clave y desarrollar liderazgo femenino en toda la organización.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-6">
                {[
                  { before: "18%", after: "6%", label: "Rotación de talento" },
                  { before: "12%", after: "41%", label: "Mujeres en liderazgo" },
                  { before: "62", after: "94", label: "NPS empleados" },
                ].map((metric) => (
                  <div key={metric.label} className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-sm text-gray-400 line-through">{metric.before}</span>
                      <IconArrowRight className="h-3 w-3 text-emerald-400" />
                      <span className="text-2xl font-extrabold text-emerald-500">{metric.after}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{metric.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD902] to-amber-400 text-sm font-bold text-gray-900 shrink-0">
                  VM
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">&ldquo;El matching con IA nos permitió crear duplas que realmente funcionan. El impacto en retención fue inmediato.&rdquo;</p>
                  <p className="text-xs text-gray-400 mt-1">Verónica Maldonado · Jefa DO, Ideal</p>
                </div>
              </div>
            </div>

            {/* Visual side - Before / After */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                    <svg className="h-4 w-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </div>
                  <span className="text-sm font-bold text-rose-600 uppercase tracking-wider">Sin Inspiratoria</span>
                </div>
                <ul className="space-y-3">
                  {[
                    "Matching manual — semanas de coordinación",
                    "Sin métricas de impacto real",
                    "Programas que mueren tras el kickoff",
                    "Sesiones sin seguimiento ni estructura",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="text-rose-400 mt-0.5">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <IconCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">Con Inspiratoria</span>
                </div>
                <ul className="space-y-3">
                  {[
                    "Match con IA en segundos — basado en data real",
                    "Dashboard con ROI, NPS y engagement en vivo",
                    "Nudges automáticos que mantienen el momentum",
                    "Sesiones guiadas con milestones y feedback",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <IconCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ IMPACTO / STATS ═══════════════ */}
      <section className="relative py-28 lg:py-36 bg-gray-950 overflow-hidden" id="impacto" data-animate>
        {/* Decorative arcs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#FFD902]/5 rounded-full blur-[120px] -translate-y-1/2" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
          <div className={`text-center mb-20 transition-all duration-1000 ${isVisible("impacto") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#FFD902]/40" />
              <span className="text-xs font-bold text-[#FFD902]/60 uppercase tracking-[0.2em]">Nuestro impacto</span>
              <div className="h-px w-8 bg-[#FFD902]/40" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white">
              Experiencias que hablan<br /><span className="text-white/20">por sí solas</span>
            </h2>
          </div>

          <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-1000 delay-300 ${isVisible("impacto") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {[
              { value: "250+", label: "Duplas de mentoría activadas", icon: <IconUsers className="h-6 w-6" /> },
              { value: "120+", label: "Círculos de aprendizaje facilitados", icon: <IconSparkles className="h-6 w-6" /> },
              { value: "2,400+", label: "Sesiones de aprendizaje realizadas", icon: <IconGlobe className="h-6 w-6" /> },
              { value: "40+", label: "Programas implementados en organizaciones", icon: <IconHeart className="h-6 w-6" /> },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFD902]/10 text-[#FFD902] mx-auto mb-5 group-hover:bg-[#FFD902]/20 transition-colors">
                  {stat.icon}
                </div>
                <p className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">{stat.value}</p>
                <p className="text-sm text-white/30 mt-3 uppercase tracking-wider font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="py-28 lg:py-36 bg-gray-50/60" data-animate id="faq">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible("faq") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#FFD902]" />
              <span className="text-xs font-bold text-[#FFD902] uppercase tracking-[0.2em]">Preguntas frecuentes</span>
              <div className="h-px w-8 bg-[#FFD902]" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900">
              Resolvemos<br /><span className="text-gray-300">tus dudas</span>
            </h2>
          </div>

          <div className={`space-y-4 transition-all duration-1000 delay-200 ${isVisible("faq") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {[
              { q: "¿Qué es Inspiratoria Studio?", a: "Inspiratoria Studio es nuestra plataforma white-label para implementar y gestionar programas de mentoría y aprendizaje organizacional. Incluye matching con IA, métricas de impacto en tiempo real, nudges automáticos y personalización completa con tu marca." },
              { q: "¿Cuánto tarda implementar Inspiratoria Studio?", a: "En menos de una semana tu programa está activo. Configuramos el entorno, subimos participantes y la IA genera los matches automáticamente. Incluimos onboarding guiado y soporte dedicado durante todo el proceso." },
              { q: "¿Se integra con nuestras herramientas existentes?", a: "Sí. Inspiratoria Studio se integra con SSO corporativo, Microsoft Teams, Google Workspace y Slack. La API permite conectar con tu HRIS o LMS existente. Además, la plataforma es completamente white-label: tu marca, tu dominio." },
              { q: "¿Cómo funciona el matching con IA?", a: "Nuestro algoritmo analiza habilidades, objetivos de desarrollo, disponibilidad, área de expertise y preferencias de cada participante para crear duplas o células de aprendizaje con alta compatibilidad. El matching tiene un 98% de satisfacción." },
              { q: "¿Qué diferencia a Inspiratoria de otras plataformas?", a: "Combinamos tecnología (IA, nudges, analytics) con más de 10 años de experiencia diseñando experiencias de aprendizaje, mentoría y desarrollo de talento en organizaciones de Latinoamérica. No solo ofrecemos una plataforma: diseñamos programas completos que generan impacto medible." },
            ].map((faq, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-100 bg-white overflow-hidden transition-all hover:border-[#FFD902]/30">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex items-center justify-between w-full text-left px-8 py-6 gap-4"
                >
                  <span className="font-bold text-gray-900">{faq.q}</span>
                  <svg className={`h-5 w-5 text-gray-400 shrink-0 transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="px-8 pb-6 text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-gray-950 border-t border-white/5" id="contacto">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-14">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Image
                src="/home/inspiratoria_negro-negro-300x68.png"
                alt="Inspiratoria"
                width={140}
                height={32}
                className="brightness-0 invert mb-6"
              />
              <p className="text-sm text-white/70 leading-relaxed">
                Diseñamos experiencias de aprendizaje, mentoría y formación que movilizan personas, equipos y culturas organizacionales.
              </p>
              <div className="flex items-center gap-3 mt-6">
                {[
                  { href: "https://www.linkedin.com/company/inspiratoria", icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg> },
                  { href: "https://www.instagram.com/inspiratoria.cl", icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg> },
                  { href: "https://www.youtube.com/channel/UCLT7gjXqoNBSiD3OeH5CFdA", icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> },
                ].map((social) => (
                  <a key={social.href} href={social.href} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/30 hover:bg-[#FFD902]/10 hover:text-[#FFD902] transition-all">
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Plataforma */}
            <div>
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-[0.15em] mb-6">Plataforma</h4>
              <ul className="space-y-3.5">
                {[
                  { label: "Inspiratoria Core", href: "/register" },
                  { label: "Inspiratoria Studio", href: "/register" },
                  { label: "Iniciar Sesión", href: "/login" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/70 hover:text-[#FFD902] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-[0.15em] mb-6">Empresa</h4>
              <ul className="space-y-3.5">
                {[
                  { label: "Servicios", href: "#servicios" },
                  { label: "Nosotros", href: "#nosotros" },
                  { label: "Blog", href: "https://inspiratoria.cl/blog" },
                  { label: "Web Corporativa", href: "https://inspiratoria.cl" },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="text-sm text-white/70 hover:text-[#FFD902] transition-colors" target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-[0.15em] mb-6">Contacto</h4>
              <ul className="space-y-4">
                <li>
                  <a href="mailto:macarena@inspiratoria.org" className="flex items-center gap-3 text-sm text-white/70 hover:text-[#FFD902] transition-colors group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 group-hover:bg-[#FFD902]/10 transition-colors">
                      <IconMail className="h-3.5 w-3.5" />
                    </div>
                    macarena@inspiratoria.org
                  </a>
                </li>
                <li>
                  <a href="tel:+56945704011" className="flex items-center gap-3 text-sm text-white/70 hover:text-[#FFD902] transition-colors group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 group-hover:bg-[#FFD902]/10 transition-colors">
                      <IconPhone className="h-3.5 w-3.5" />
                    </div>
                    +569 4570 4011
                  </a>
                </li>
                <li>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                      <IconMapPin className="h-3.5 w-3.5" />
                    </div>
                    Lastarria #90, Santiago
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} Inspiratoria. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-white/50 hover:text-white/80 transition-colors">Privacidad</a>
              <a href="#" className="text-xs text-white/50 hover:text-white/80 transition-colors">Términos</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════ CSS ANIMATIONS ═══════════════ */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
