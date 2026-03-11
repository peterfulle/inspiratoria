"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

// ═══════════════════════════════════════════════════════════════════
// FLOATING ANIMATION STYLES
// ═══════════════════════════════════════════════════════════════════

const floatStyles = `
@keyframes float0 {
  0%, 100% { transform: translate(-50%, -50%) translateY(0px) translateX(0px); }
  25% { transform: translate(-50%, -50%) translateY(-8px) translateX(4px); }
  50% { transform: translate(-50%, -50%) translateY(-4px) translateX(-4px); }
  75% { transform: translate(-50%, -50%) translateY(-10px) translateX(2px); }
}
@keyframes float1 {
  0%, 100% { transform: translate(-50%, -50%) translateY(0px) translateX(0px); }
  33% { transform: translate(-50%, -50%) translateY(-6px) translateX(-5px); }
  66% { transform: translate(-50%, -50%) translateY(-12px) translateX(3px); }
}
@keyframes float2 {
  0%, 100% { transform: translate(-50%, -50%) translateY(0px) translateX(0px); }
  50% { transform: translate(-50%, -50%) translateY(-10px) translateX(-3px); }
}
`;

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface Person {
  id: number;
  name: string;
  role: "mentor" | "mentee";
  avatar: string;
  photo: string;
  company: string;
  position: string;
  influence: number;
  connections: number[];
}

interface AIInsight {
  id: number;
  type: "trend" | "warning" | "opportunity";
  title: string;
  description: string;
  persons: string[];
}

// ═══════════════════════════════════════════════════════════════════
// SVG ICONS
// ═══════════════════════════════════════════════════════════════════

const Icon = {
  Network: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="5" r="3"/>
      <circle cx="5" cy="19" r="3"/>
      <circle cx="19" cy="19" r="3"/>
      <path d="M12 8v3M8.5 17l2.5-4M15.5 17l-2.5-4"/>
    </svg>
  ),
  Sparkle: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  TrendUp: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M23 6l-9.5 9.5-5-5L1 18"/>
      <path d="M17 6h6v6"/>
    </svg>
  ),
  Warning: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 9v4M12 17h.01"/>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    </svg>
  ),
  Lightbulb: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21h6M12 3a6 6 0 00-3.92 10.56A3 3 0 009 15.93V17a1 1 0 001 1h4a1 1 0 001-1v-1.07a3 3 0 00.92-2.37A6 6 0 0012 3z"/>
    </svg>
  ),
  Refresh: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M23 4v6h-6M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
    </svg>
  ),
  Back: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  ),
  Info: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════
// GEMINI API SERVICE
// ═══════════════════════════════════════════════════════════════════

const GEMINI_API_KEY = "AIzaSyDhdNKyJgGNLVRC41VqE3EuCJZ4z0iGCCo";

async function getGeminiInsights(people: Person[]): Promise<AIInsight[]> {
  try {
    const prompt = `Analiza esta red de mentores y mentees y proporciona 3 insights estratégicos breves.

Personas:
${people.map(p => `- ${p.name} (${p.role}, ${p.position}, influencia: ${p.influence}%)`).join("\n")}

Responde SOLO en JSON (sin markdown):
[
  {"type": "trend", "title": "título 5 palabras max", "description": "1 línea", "persons": ["nombre1"]},
  {"type": "warning", "title": "título 5 palabras max", "description": "1 línea", "persons": ["nombre1"]},
  {"type": "opportunity", "title": "título 5 palabras max", "description": "1 línea", "persons": ["nombre1", "nombre2"]}
]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]).map((insight: any, i: number) => ({ id: i + 1, ...insight }));
    }
    return [];
  } catch (error) {
    console.error("Gemini error:", error);
    return [
      { id: 1, type: "trend", title: "Crecimiento en red", description: "Los mentores están expandiendo su influencia positiva.", persons: ["Ana Mentor"] },
      { id: 2, type: "opportunity", title: "Conexión potencial", description: "Carlos y María pueden colaborar en liderazgo.", persons: ["Carlos", "María"] },
      { id: 3, type: "warning", title: "Baja conectividad", description: "Laura necesita más interacciones con la red.", persons: ["Laura"] },
    ];
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function EcosystemPage() {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [filter, setFilter] = useState<"all" | "mentors" | "mentees">("all");
  const [selectedBackground, setSelectedBackground] = useState("fondo1.jpeg");
  const [showInsightsPanel, setShowInsightsPanel] = useState(true);

  // Demo Data with profile photos
  const allPeople: Person[] = [
    // Mentors - positioned around center
    { id: 1, name: "Ana Mentor", role: "mentor", avatar: "AM", photo: "https://randomuser.me/api/portraits/women/44.jpg", company: "Inspiratoria", position: "Lead Mentor", influence: 95, connections: [5, 6, 7] },
    { id: 2, name: "Roberto Guía", role: "mentor", avatar: "RG", photo: "https://randomuser.me/api/portraits/men/32.jpg", company: "TechCorp", position: "Senior Mentor", influence: 88, connections: [8, 9] },
    { id: 3, name: "Carmen Experta", role: "mentor", avatar: "CE", photo: "https://randomuser.me/api/portraits/women/68.jpg", company: "DesignLab", position: "Design Mentor", influence: 82, connections: [6, 10] },
    { id: 4, name: "Miguel Líder", role: "mentor", avatar: "ML", photo: "https://randomuser.me/api/portraits/men/75.jpg", company: "DataFlow", position: "Tech Mentor", influence: 78, connections: [7, 8] },
    // Mentees
    { id: 5, name: "Carlos Rodríguez", role: "mentee", avatar: "CR", photo: "https://randomuser.me/api/portraits/men/22.jpg", company: "TechCorp", position: "Software Engineer", influence: 68, connections: [1] },
    { id: 6, name: "María García", role: "mentee", avatar: "MG", photo: "https://randomuser.me/api/portraits/women/33.jpg", company: "DesignLab", position: "Product Designer", influence: 45, connections: [1, 3] },
    { id: 7, name: "Pedro Sánchez", role: "mentee", avatar: "PS", photo: "https://randomuser.me/api/portraits/men/45.jpg", company: "DataFlow", position: "Data Scientist", influence: 82, connections: [1, 4] },
    { id: 8, name: "Laura Fernández", role: "mentee", avatar: "LF", photo: "https://randomuser.me/api/portraits/women/55.jpg", company: "TechCorp", position: "Backend Dev", influence: 35, connections: [2, 4] },
    { id: 9, name: "Diego Martín", role: "mentee", avatar: "DM", photo: "https://randomuser.me/api/portraits/men/67.jpg", company: "StartupX", position: "Full Stack", influence: 55, connections: [2] },
    { id: 10, name: "Sofia Torres", role: "mentee", avatar: "ST", photo: "https://randomuser.me/api/portraits/women/21.jpg", company: "DesignLab", position: "UX Researcher", influence: 62, connections: [3] },
  ];

  // Filter people
  const filteredPeople = filter === "all" 
    ? allPeople 
    : allPeople.filter(p => p.role === (filter === "mentors" ? "mentor" : "mentee"));

  // Calculate positions in a beautiful orbital pattern
  const getNodePosition = (person: Person) => {
    const mentors = allPeople.filter(p => p.role === "mentor");
    const mentees = allPeople.filter(p => p.role === "mentee");
    
    if (person.role === "mentor") {
      // Mentors in inner ring
      const mentorIndex = mentors.findIndex(m => m.id === person.id);
      const angle = (mentorIndex / mentors.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 20;
      return {
        left: `${50 + Math.cos(angle) * radius}%`,
        top: `${50 + Math.sin(angle) * radius}%`,
      };
    } else {
      // Mentees in outer ring
      const menteeIndex = mentees.findIndex(m => m.id === person.id);
      const angle = (menteeIndex / mentees.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 36;
      return {
        left: `${50 + Math.cos(angle) * radius}%`,
        top: `${50 + Math.sin(angle) * radius}%`,
      };
    }
  };

  // Fetch AI insights
  const fetchInsights = useCallback(async () => {
    setIsLoadingInsights(true);
    const newInsights = await getGeminiInsights(allPeople);
    setInsights(newInsights);
    setIsLoadingInsights(false);
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Get connections for SVG lines
  const getConnections = () => {
    const connections: { from: Person; to: Person }[] = [];
    allPeople.forEach(person => {
      person.connections.forEach(connId => {
        const target = allPeople.find(p => p.id === connId);
        if (target && !connections.some(c => 
          (c.from.id === person.id && c.to.id === target.id) ||
          (c.from.id === target.id && c.to.id === person.id)
        )) {
          connections.push({ from: person, to: target });
        }
      });
    });
    return connections;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Inject floating animation styles */}
      <style dangerouslySetInnerHTML={{ __html: floatStyles }} />
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={`/sqmentors/${selectedBackground}`}
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay for better visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-black/50" />
      </div>

      {/* Header */}
      <header className="relative z-20 backdrop-blur-md bg-white/10 border-b border-white/20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a 
              href="/dashboard" 
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
            >
              <Icon.Back className="w-5 h-5" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3 drop-shadow-lg">
                <Icon.Network className="w-7 h-7 text-primary-500" />
                Ecosistema de Influencia
              </h1>
              <p className="text-white/70 text-sm">Red de mentores y mentees de tu empresa</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Background Selector */}
            <div className="flex gap-2 mr-4">
              {["fondo1.jpeg", "fondo2.jpeg", "publico.jpeg"].map((bg) => (
                <button
                  key={bg}
                  onClick={() => setSelectedBackground(bg)}
                  className={`w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedBackground === bg ? "border-primary-500 scale-110" : "border-white/30 hover:border-white/60"
                  }`}
                >
                  <Image src={`/sqmentors/${bg}`} alt={bg} width={48} height={32} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Filter */}
            <div className="flex rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-1">
              {[
                { id: "all", label: "Todos" },
                { id: "mentors", label: "Mentores" },
                { id: "mentees", label: "Mentees" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as "all" | "mentors" | "mentees")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === f.id
                      ? "bg-primary-500 text-dark-500"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Toggle Insights */}
            <button
              onClick={() => setShowInsightsPanel(!showInsightsPanel)}
              className={`p-2.5 rounded-xl backdrop-blur-sm border transition-all ${
                showInsightsPanel 
                  ? "bg-primary-500 text-dark-500 border-primary-500" 
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }`}
            >
              <Icon.Sparkle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex h-[calc(100vh-73px)]">
        {/* Network Visualization */}
        <div className="flex-1 relative">
          {/* Center Logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-24 h-24 rounded-full bg-primary-500 shadow-2xl shadow-primary-500/50 flex items-center justify-center">
              <Image src="/images/logo.png" alt="Inspiratoria" width={60} height={60} className="object-contain" />
            </div>
            <p className="text-center mt-2 text-white font-semibold text-sm drop-shadow-lg">Inspiratoria</p>
          </div>

          {/* Connection Lines SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="mentorLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFD902" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#FFD902" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="menteeLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.3" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {getConnections().map((conn, i) => {
              const fromPos = getNodePosition(conn.from);
              const toPos = getNodePosition(conn.to);
              const isMentorConnection = conn.from.role === "mentor";
              
              return (
                <line
                  key={i}
                  x1={fromPos.left}
                  y1={fromPos.top}
                  x2={toPos.left}
                  y2={toPos.top}
                  stroke={`url(#${isMentorConnection ? "mentorLine" : "menteeLine"})`}
                  strokeWidth="2"
                  filter="url(#glow)"
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>

          {/* Orbital Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] aspect-square border-2 border-primary-500/30 rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72%] aspect-square border-2 border-blue-400/20 rounded-full" />

          {/* Nodes */}
          {filteredPeople.map((person, i) => {
            const pos = getNodePosition(person);
            const nodeSize = person.role === "mentor" ? 72 : 58;
            const isSelected = selectedPerson?.id === person.id;
            const bgColor = person.role === "mentor" ? "#FFD902" : "#60A5FA";
            
            // Animación flotante única para cada nodo
            const floatDelay = (i * 0.3) % 3;
            const floatDuration = 3 + (i % 3);

            return (
              <div
                key={person.id}
                onClick={() => setSelectedPerson(isSelected ? null : person)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group ${
                  isSelected ? "z-30 scale-110" : "z-20 hover:scale-105"
                }`}
                style={{ 
                  left: pos.left, 
                  top: pos.top,
                  animation: isSelected ? 'none' : `float${i % 3} ${floatDuration}s ease-in-out ${floatDelay}s infinite`
                }}
              >
                {/* Glow ring */}
                <div 
                  className={`absolute inset-0 rounded-full blur-xl transition-opacity ${isSelected ? "opacity-80" : "opacity-40 group-hover:opacity-60"}`}
                  style={{ 
                    width: nodeSize + 20, 
                    height: nodeSize + 20, 
                    marginLeft: -10, 
                    marginTop: -10,
                    backgroundColor: bgColor 
                  }}
                />

                {/* Influence ring */}
                <svg
                  className="absolute"
                  style={{ width: nodeSize + 14, height: nodeSize + 14, marginLeft: -7, marginTop: -7 }}
                >
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="48%"
                    fill="none"
                    stroke={bgColor}
                    strokeWidth="3"
                    strokeDasharray={`${person.influence * 3.14} 314`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${(nodeSize + 14) / 2} ${(nodeSize + 14) / 2})`}
                  />
                </svg>

                {/* Node with Photo */}
                <div
                  className={`relative rounded-full overflow-hidden shadow-2xl transition-all ${
                    isSelected ? "ring-4 ring-white/50" : ""
                  }`}
                  style={{ 
                    width: nodeSize, 
                    height: nodeSize,
                    border: `3px solid ${bgColor}`
                  }}
                >
                  <Image
                    src={person.photo}
                    alt={person.name}
                    width={nodeSize}
                    height={nodeSize}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Label */}
                <div 
                  className={`absolute left-1/2 -translate-x-1/2 text-center transition-all duration-300 whitespace-nowrap ${
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  style={{ top: nodeSize + 10 }}
                >
                  <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20">
                    <p className="text-white text-sm font-semibold">{person.name}</p>
                    <p className="text-white/60 text-xs">{person.position}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-xl">
            <p className="text-white text-sm font-semibold mb-3">Leyenda</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#FFD902] shadow-lg shadow-[#FFD902]/30" />
                <span className="text-white/80 text-sm">Mentores ({allPeople.filter(p => p.role === "mentor").length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#60A5FA] shadow-lg shadow-[#60A5FA]/30" />
                <span className="text-white/80 text-sm">Mentees ({allPeople.filter(p => p.role === "mentee").length})</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-500">{allPeople.length}</p>
                <p className="text-white/60 text-xs">Personas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">{getConnections().length}</p>
                <p className="text-white/60 text-xs">Conexiones</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Insights */}
        {showInsightsPanel && (
          <aside className="w-96 bg-black/50 backdrop-blur-xl border-l border-white/20 overflow-y-auto">
            {selectedPerson ? (
              /* Person Detail */
              <div className="p-6">
                <button 
                  onClick={() => setSelectedPerson(null)}
                  className="mb-4 text-sm text-white/60 hover:text-white transition-all flex items-center gap-1"
                >
                  <Icon.Back className="w-4 h-4" /> Volver
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl"
                    style={{ 
                      border: `3px solid ${selectedPerson.role === "mentor" ? "#FFD902" : "#60A5FA"}`
                    }}
                  >
                    <Image
                      src={selectedPerson.photo}
                      alt={selectedPerson.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedPerson.name}</h2>
                    <p className="text-white/60">{selectedPerson.position}</p>
                    <span 
                      className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: selectedPerson.role === "mentor" ? "#FFD90230" : "#60A5FA30",
                        color: selectedPerson.role === "mentor" ? "#FFD902" : "#60A5FA",
                      }}
                    >
                      {selectedPerson.role === "mentor" ? "🎓 Mentor" : "📚 Mentee"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                    <p className="text-xs text-white/60">Influencia</p>
                    <p className="text-2xl font-bold text-primary-500">{selectedPerson.influence}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                    <p className="text-xs text-white/60">Conexiones</p>
                    <p className="text-2xl font-bold text-white">{selectedPerson.connections.length}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-3">Conexiones directas</h3>
                  <div className="space-y-2">
                    {selectedPerson.connections.map(connId => {
                      const connPerson = allPeople.find(p => p.id === connId);
                      if (!connPerson) return null;
                      return (
                        <div 
                          key={connId}
                          onClick={() => setSelectedPerson(connPerson)}
                          className="p-3 rounded-xl bg-white/10 border border-white/10 cursor-pointer hover:bg-white/20 transition-all flex items-center gap-3"
                        >
                          <div 
                            className="w-10 h-10 rounded-lg overflow-hidden"
                            style={{ 
                              border: `2px solid ${connPerson.role === "mentor" ? "#FFD902" : "#60A5FA"}`
                            }}
                          >
                            <Image
                              src={connPerson.photo}
                              alt={connPerson.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-white">{connPerson.name}</p>
                            <p className="text-xs text-white/60">{connPerson.position}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* AI Insights */
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Icon.Sparkle className="w-6 h-6 text-primary-500" />
                    <h2 className="text-xl font-bold text-white">AI Insights</h2>
                  </div>
                  <button 
                    onClick={fetchInsights}
                    disabled={isLoadingInsights}
                    className={`p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all ${isLoadingInsights ? "animate-spin" : ""}`}
                  >
                    <Icon.Refresh className="w-5 h-5 text-white" />
                  </button>
                </div>

                <p className="text-sm text-white/60 mb-6">
                  Análisis en tiempo real con Gemini AI
                </p>

                {isLoadingInsights ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 rounded-xl bg-white/10 border border-white/10 animate-pulse">
                        <div className="h-4 w-24 rounded bg-white/20 mb-2" />
                        <div className="h-3 w-full rounded bg-white/10" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insights.map((insight) => (
                      <div 
                        key={insight.id}
                        className={`p-4 rounded-xl border transition-all ${
                          insight.type === "trend" 
                            ? "bg-green-500/20 border-green-500/40" 
                            : insight.type === "warning"
                            ? "bg-amber-500/20 border-amber-500/40"
                            : "bg-blue-500/20 border-blue-500/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {insight.type === "trend" && <Icon.TrendUp className="w-5 h-5 text-green-400" />}
                          {insight.type === "warning" && <Icon.Warning className="w-5 h-5 text-amber-400" />}
                          {insight.type === "opportunity" && <Icon.Lightbulb className="w-5 h-5 text-blue-400" />}
                          <span className="font-semibold text-sm text-white">{insight.title}</span>
                        </div>
                        <p className="text-sm text-white/70 mb-3">{insight.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {insight.persons.map((person, i) => (
                            <span key={i} className="px-2 py-1 rounded-md text-xs bg-white/10 text-white/80">
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Network Stats */}
                <div className="mt-8 p-4 rounded-xl bg-white/10 border border-white/10">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Icon.Info className="w-4 h-4 text-primary-500" />
                    Estadísticas de Red
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-white/60">Total Personas</p>
                      <p className="text-xl font-bold text-white">{allPeople.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Conexiones</p>
                      <p className="text-xl font-bold text-white">{getConnections().length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Mentores</p>
                      <p className="text-xl font-bold text-[#FFD902]">
                        {allPeople.filter(p => p.role === "mentor").length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Mentees</p>
                      <p className="text-xl font-bold text-[#60A5FA]">
                        {allPeople.filter(p => p.role === "mentee").length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 p-4 rounded-xl bg-white/10 border border-white/10">
                  <h3 className="font-semibold text-white mb-4">Acciones rápidas</h3>
                  <div className="space-y-2">
                    <button className="w-full p-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-dark-500 font-medium text-sm transition-all">
                      📊 Generar reporte completo
                    </button>
                    <button className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/10">
                      📧 Enviar resumen por email
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
