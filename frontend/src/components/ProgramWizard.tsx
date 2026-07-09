"use client";

import { useState } from "react";
import { Sparkles, ChevronRight, ChevronLeft, Check, Loader2, Target, Users, Calendar, Settings, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api";

type ProgramWizardProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  darkMode: boolean;
};

type ProgramData = {
  // Step 1: Información básica
  name: string;
  theme: string;
  description: string;
  
  // Step 2: Objetivos y estructura
  objectives: string[];
  duration_months: number;
  session_frequency: string;
  session_duration: number;
  
  // Step 3: Metodología y áreas
  methodology: string[];
  focus_areas: string[];
  format: string;
  
  // Step 4: Configuración
  status: string;
  max_participants: number;
  matching_criteria: string[];
  
  // AI Generated
  ai_generated: boolean;
};

export default function ProgramWizard({ isOpen, onClose, onSubmit, darkMode }: ProgramWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContext, setAiContext] = useState<string>(""); // Memoria contextual de AI
  const [formData, setFormData] = useState<ProgramData>({
    name: "",
    theme: "Liderazgo Ejecutivo",
    description: "",
    objectives: [],
    duration_months: 6,
    session_frequency: "bi-weekly",
    session_duration: 60,
    methodology: [],
    focus_areas: [],
    format: "one-on-one",
    status: "active",
    max_participants: 50,
    matching_criteria: [],
    ai_generated: false,
  });

  const steps = [
    { number: 1, title: "Información", icon: Target },
    { number: 2, title: "Objetivos", icon: Zap },
    { number: 3, title: "Metodología", icon: Settings },
    { number: 4, title: "Configuración", icon: Users },
  ];

  const themes = [
    "Liderazgo Ejecutivo",
    "Desarrollo Técnico",
    "Desarrollo de Carrera",
    "Emprendimiento",
    "Innovación",
    "Transformación Digital",
    "Gestión del Cambio",
    "Inteligencia Emocional"
  ];

  const sessionFrequencies = [
    { value: "weekly", label: "Semanal" },
    { value: "bi-weekly", label: "Quincenal" },
    { value: "monthly", label: "Mensual" },
  ];

  const formats = [
    { value: "one-on-one", label: "1-a-1 (Mentor-Mentee)" },
    { value: "group", label: "Grupal (1 mentor, varios mentees)" },
    { value: "peer", label: "Entre pares (peer mentoring)" },
  ];

  const methodologies = [
    "Coaching ejecutivo",
    "Establecimiento de OKRs",
    "Design Thinking",
    "Metodologías Ágiles",
    "Feedback 360°",
    "Shadowing",
    "Proyectos prácticos",
    "Casos de estudio"
  ];

  const focusAreas = [
    "Liderazgo estratégico",
    "Gestión del cambio",
    "Comunicación ejecutiva",
    "Toma de decisiones",
    "Inteligencia emocional",
    "Desarrollo de equipos",
    "Innovación",
    "Gestión de conflictos",
    "Pensamiento crítico",
    "Negociación"
  ];

  const matchingCriteriaOptions = [
    "Experiencia en la industria",
    "Habilidades técnicas",
    "Objetivos profesionales",
    "Personalidad y valores",
    "Disponibilidad horaria",
    "Ubicación geográfica"
  ];

  const generateWithAI = async () => {
    // Validar que el nombre tenga al menos 2 palabras
    const words = formData.name.trim().split(/\s+/);
    if (words.length < 2) {
      alert("Por favor ingresa un nombre con al menos 2 palabras");
      return;
    }

    if (!formData.theme) {
      alert("Por favor selecciona un tema para el programa");
      return;
    }

    setAiLoading(true);
    try {
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/ai/generate-program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          theme: formData.theme,
          current_data: formData,
          context: aiContext // Enviar memoria contextual
        })
      });

      if (response.ok) {
        const aiData = await response.json();
        
        // Guardar contexto generado para próximos pasos
        if (aiData.context) {
          setAiContext(aiData.context);
        }
        
        setFormData({
          ...formData,
          description: aiData.description || formData.description,
          objectives: aiData.objectives || formData.objectives,
          focus_areas: aiData.focus_areas || formData.focus_areas,
          methodology: aiData.methodology || formData.methodology,
          ai_generated: true,
        });
      } else {
        // Fallback: generación local
        generateLocalAI();
      }
    } catch (error) {
      console.error("Error generating with AI:", error);
      // Fallback: generación local
      generateLocalAI();
    } finally {
      setAiLoading(false);
    }
  };

  const generateLocalAI = () => {
    const themeDescriptions: Record<string, any> = {
      "Liderazgo Ejecutivo": {
        description: `Programa de mentoría diseñado para desarrollar el liderazgo y las habilidades estratégicas de ejecutivos y gerentes de alto potencial.

Este programa combina coaching ejecutivo personalizado con metodologías probadas de desarrollo de liderazgo, permitiendo a los participantes fortalecer sus competencias directivas y alcanzar su máximo potencial.`,
        objectives: [
          "Desarrollar competencias de liderazgo estratégico",
          "Fortalecer la toma de decisiones complejas",
          "Mejorar habilidades de gestión de equipos",
          "Impulsar el desarrollo de carrera ejecutiva",
          "Crear una red de contactos de alto nivel"
        ],
        focus_areas: ["Liderazgo estratégico", "Gestión del cambio", "Comunicación ejecutiva", "Toma de decisiones", "Inteligencia emocional"],
        methodology: ["Coaching ejecutivo", "Establecimiento de OKRs", "Feedback 360°", "Casos de estudio"]
      },
      "Desarrollo Técnico": {
        description: `Programa enfocado en el desarrollo de habilidades técnicas avanzadas y mejores prácticas de ingeniería de software.

Los participantes trabajarán con mentores experimentados en arquitectura de software, tecnologías emergentes y metodologías ágiles para acelerar su crecimiento técnico.`,
        objectives: [
          "Dominar tecnologías y frameworks avanzados",
          "Aprender arquitectura de software escalable",
          "Implementar mejores prácticas de desarrollo",
          "Desarrollar habilidades de resolución de problemas",
          "Prepararse para roles técnicos senior"
        ],
        focus_areas: ["Pensamiento crítico", "Innovación", "Desarrollo de equipos"],
        methodology: ["Proyectos prácticos", "Shadowing", "Casos de estudio", "Metodologías Ágiles"]
      },
      "Desarrollo de Carrera": {
        description: `Programa integral para acelerar el crecimiento profesional y alcanzar objetivos de carrera ambiciosos.

Combina planificación estratégica de carrera, desarrollo de habilidades clave y construcción de red profesional para maximizar el potencial de cada participante.`,
        objectives: [
          "Definir objetivos de carrera claros",
          "Desarrollar habilidades de autoliderazgo",
          "Construir marca personal profesional",
          "Expandir red de contactos estratégicos",
          "Prepararse para transiciones de carrera"
        ],
        focus_areas: ["Comunicación ejecutiva", "Inteligencia emocional", "Negociación"],
        methodology: ["Coaching ejecutivo", "Establecimiento de OKRs", "Feedback 360°"]
      }
    };

    const themeData = themeDescriptions[formData.theme] || themeDescriptions["Liderazgo Ejecutivo"];
    
    setFormData({
      ...formData,
      description: themeData.description,
      objectives: themeData.objectives,
      focus_areas: themeData.focus_areas,
      methodology: themeData.methodology,
      ai_generated: true,
    });
  };

  const handleNext = () => {
    console.log("⏭️ handleNext llamado, currentStep:", currentStep);
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      console.log("✅ Cambiando a step:", currentStep + 1);
    }
  };

  const handlePrev = () => {
    console.log("⏮️ handlePrev llamado, currentStep:", currentStep);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      console.log("✅ Cambiando a step:", currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🚀 Iniciando creación de programa...");
    console.log("📋 FormData actual:", formData);
    
    // Validaciones antes de enviar
    if (!formData.name || formData.name.trim().split(/\s+/).length < 2) {
      alert("El nombre del programa debe tener al menos 2 palabras");
      return;
    }
    
    if (!formData.description || formData.description.length < 50) {
      alert("Por favor completa la descripción del programa (mínimo 50 caracteres)");
      return;
    }
    
    if (formData.objectives.length === 0) {
      alert("Agrega al menos un objetivo al programa");
      return;
    }
    
    if (formData.methodology.length === 0) {
      alert("Selecciona al menos una metodología");
      return;
    }
    
    if (formData.focus_areas.length === 0) {
      alert("Selecciona al menos un área de enfoque");
      return;
    }
    
    try {
      // Construir el objeto final para enviar al backend
      const programData = {
        name: formData.name,
        theme: formData.theme,
        status: formData.status,
        description: `${formData.description}

Duración: ${formData.duration_months} meses
Frecuencia: ${sessionFrequencies.find(f => f.value === formData.session_frequency)?.label}
Duración de sesiones: ${formData.session_duration} minutos
Formato: ${formats.find(f => f.value === formData.format)?.label}

Objetivos del programa:
${formData.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Áreas de enfoque:
${formData.focus_areas.map(area => `• ${area}`).join('\n')}

Metodología:
${formData.methodology.map(method => `• ${method}`).join('\n')}

Capacidad máxima: ${formData.max_participants} participantes`
      };

      console.log("📦 Datos del programa:", programData);
      
      // Esperar a que onSubmit termine
      await onSubmit(programData);
      
      console.log("✅ Programa creado exitosamente");
      
      // Solo cerrar y resetear si todo salió bien
      resetForm();
      onClose();
    } catch (error) {
      console.error("❌ Error en handleSubmit:", error);
      alert("Error al crear el programa. Por favor intenta de nuevo.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      theme: "Liderazgo Ejecutivo",
      description: "",
      objectives: [],
      duration_months: 6,
      session_frequency: "bi-weekly",
      session_duration: 60,
      methodology: [],
      focus_areas: [],
      format: "one-on-one",
      status: "active",
      max_participants: 50,
      matching_criteria: [],
      ai_generated: false,
    });
    setCurrentStep(1);
  };

  const addObjective = () => {
    if (formData.objectives.length < 8) {
      setFormData({ ...formData, objectives: [...formData.objectives, ""] });
    }
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, objectives: newObjectives });
  };

  const removeObjective = (index: number) => {
    setFormData({ ...formData, objectives: formData.objectives.filter((_, i) => i !== index) });
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col ${
        darkMode ? "bg-dark-400 border border-gray-800" : "bg-white border border-gray-200"
      }`}>
        {/* Header */}
        <div className={`border-b p-6 ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                Crear Programa de Mentoring
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Sistema inteligente con asistencia AI
              </p>
            </div>
            <button
              onClick={onClose}
              className={`rounded-lg p-2 transition ${
                darkMode ? "hover:bg-dark-300" : "hover:bg-gray-100"
              }`}
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep === step.number
                      ? "border-primary-500 bg-primary-500/10 text-primary-500"
                      : currentStep > step.number
                      ? "border-primary-500 bg-primary-500 text-white"
                      : darkMode
                      ? "border-gray-700 text-gray-600"
                      : "border-gray-300 text-gray-400"
                  }`}>
                    {currentStep > step.number ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    currentStep === step.number
                      ? "text-primary-500"
                      : darkMode
                      ? "text-gray-500"
                      : "text-gray-600"
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${
                    currentStep > step.number
                      ? "bg-primary-500"
                      : darkMode
                      ? "bg-gray-800"
                      : "bg-gray-300"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Información Básica */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Información Básica</h3>
                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={aiLoading || !formData.name || formData.name.trim().split(/\s+/).length < 2 || !formData.theme}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    aiLoading || !formData.name || formData.name.trim().split(/\s+/).length < 2 || !formData.theme
                      ? "opacity-50 cursor-not-allowed"
                      : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
                  }`}
                  title={formData.name.trim().split(/\s+/).length < 2 ? "El nombre debe tener al menos 2 palabras" : ""}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generar con AI
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Nombre del Programa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej: Programa de Mentoría Ejecutiva 2025"
                  className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                    darkMode
                      ? "border-gray-700 bg-dark-300 text-white placeholder-gray-500"
                      : "border-gray-300 bg-white text-black placeholder-gray-400"
                  }`}
                />
              </div>

              <div>
                <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Tema Principal *
                </label>
                <select
                  required
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                    darkMode
                      ? "border-gray-700 bg-dark-300 text-white"
                      : "border-gray-300 bg-white text-black"
                  }`}
                >
                  {themes.map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Descripción del Programa *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  placeholder="Describe el propósito, enfoque y valor del programa..."
                  className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                    darkMode
                      ? "border-gray-700 bg-dark-300 text-white placeholder-gray-500"
                      : "border-gray-300 bg-white text-black placeholder-gray-400"
                  }`}
                />
                {formData.ai_generated && (
                  <p className="mt-2 text-xs text-primary-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Contenido generado con AI
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Objetivos y Estructura */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Objetivos y Estructura</h3>
                <button
                  type="button"
                  onClick={async () => {
                    const contextPrompt = (document.getElementById('objectives-prompt') as HTMLTextAreaElement)?.value || '';
                    
                    if (!contextPrompt.trim()) {
                      alert("Por favor ingresa el contexto para generar objetivos personalizados");
                      return;
                    }
                    
                    if (contextPrompt.trim().split(/\s+/).length < 10) {
                      alert("Por favor proporciona más detalles en el contexto (mínimo 10 palabras)");
                      return;
                    }
                    
                    setAiLoading(true);
                    try {
                      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/ai/generate-objectives`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: formData.name,
                          theme: formData.theme,
                          description: formData.description,
                          prompt: contextPrompt,
                          context: aiContext // Enviar memoria contextual del Step 1
                        })
                      });

                      if (response.ok) {
                        const data = await response.json();
                        
                        // Actualizar memoria contextual
                        if (data.context) {
                          setAiContext(data.context);
                        }
                        
                        setFormData({
                          ...formData,
                          objectives: data.objectives || []
                        });
                      } else {
                        alert("Error al generar objetivos con AI");
                      }
                    } catch (error) {
                      console.error("Error:", error);
                      alert("Error al conectar con el servicio de AI");
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  disabled={aiLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    aiLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
                  }`}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando objetivos...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generar Objetivos con AI
                    </>
                  )}
                </button>
              </div>

              {/* AI Prompt para objetivos */}
              <div className={`p-4 rounded-lg border-2 ${
                darkMode ? "border-primary-500/50 bg-dark-300/50" : "border-primary-500/50 bg-primary-50"
              }`}>
                <label className={`mb-2 block text-sm font-semibold flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <span className="text-lg">💡</span>
                  Contexto para generar objetivos (requerido para AI)
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="objectives-prompt"
                  rows={4}
                  required={formData.objectives.length === 0}
                  placeholder={formData.description 
                    ? `Ejemplo basado en tu programa:\n\n"Los participantes son ${formData.theme.toLowerCase()} que buscan ${formData.theme === 'Liderazgo Ejecutivo' ? 'ascender a posiciones C-level' : 'avanzar en sus carreras'}. Buscamos desarrollar habilidades en ${formData.focus_areas.slice(0, 3).join(', ') || 'liderazgo, comunicación y estrategia'}. El programa se enfoca en resultados medibles como ${formData.theme === 'Liderazgo Ejecutivo' ? 'ascensos, mejora en evaluaciones de desempeño y liderazgo de proyectos estratégicos' : 'certificaciones, proyectos completados y aumento de responsabilidades'}."`
                    : "Ej: Los participantes son gerentes de nivel medio que buscan ascender a posiciones ejecutivas. Queremos enfocarnos en habilidades de liderazgo estratégico, gestión de cambio y toma de decisiones complejas. Buscamos resultados medibles como ascensos en 12 meses, mejora del 20% en evaluaciones de liderazgo y participación en iniciativas estratégicas."
                  }
                  className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    darkMode
                      ? "border-gray-600 bg-dark-200 text-white placeholder-gray-500"
                      : "border-gray-300 bg-white text-black placeholder-gray-400"
                  }`}
                />
                <p className={`text-xs mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  <strong>Incluye:</strong> Perfil de participantes, habilidades a desarrollar, resultados esperados y plazos específicos (mínimo 10 palabras)
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Objetivos del Programa {formData.objectives.length > 0 && `(${formData.objectives.length})`}
                  </label>
                  <button
                    type="button"
                    onClick={addObjective}
                    disabled={formData.objectives.length >= 8}
                    className="text-xs text-primary-500 hover:text-primary-600 font-medium disabled:opacity-50"
                  >
                    + Agregar objetivo manualmente
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.objectives.length === 0 ? (
                    <div className={`p-6 rounded-lg border-2 border-dashed text-center ${
                      darkMode ? "border-gray-700 text-gray-500" : "border-gray-300 text-gray-400"
                    }`}>
                      <p className="text-sm">
                        Usa el botón "Generar Objetivos con AI" arriba o agrega objetivos manualmente
                      </p>
                    </div>
                  ) : (
                    formData.objectives.map((objective, index) => (
                      <div key={index} className="flex gap-2">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-semibold text-sm mt-1 ${
                          darkMode ? "bg-primary-500/20 text-primary-400" : "bg-primary-500/10 text-primary-600"
                        }`}>
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={objective}
                          onChange={(e) => updateObjective(index, e.target.value)}
                          placeholder={`Objetivo ${index + 1}`}
                          className={`flex-1 rounded-lg border px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                            darkMode
                              ? "border-gray-700 bg-dark-300 text-white placeholder-gray-500"
                              : "border-gray-300 bg-white text-black placeholder-gray-400"
                          }`}
                        />
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className={`px-3 rounded-lg transition ${
                          darkMode
                            ? "bg-dark-300 hover:bg-red-500/20 text-red-400"
                            : "bg-gray-100 hover:bg-red-50 text-red-500"
                        }`}
                      >
                        ✕
                      </button>
                    </div>
                  ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Duración (meses)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.duration_months}
                    onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
                    className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                      darkMode
                        ? "border-gray-700 bg-dark-300 text-white"
                        : "border-gray-300 bg-white text-black"
                    }`}
                  />
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Frecuencia de Sesiones
                  </label>
                  <select
                    value={formData.session_frequency}
                    onChange={(e) => setFormData({ ...formData, session_frequency: e.target.value })}
                    className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                      darkMode
                        ? "border-gray-700 bg-dark-300 text-white"
                        : "border-gray-300 bg-white text-black"
                    }`}
                  >
                    {sessionFrequencies.map(freq => (
                      <option key={freq.value} value={freq.value}>{freq.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Duración Sesión (min)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    step="15"
                    value={formData.session_duration}
                    onChange={(e) => setFormData({ ...formData, session_duration: parseInt(e.target.value) })}
                    className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                      darkMode
                        ? "border-gray-700 bg-dark-300 text-white"
                        : "border-gray-300 bg-white text-black"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Formato del Programa
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {formats.map(format => (
                    <button
                      key={format.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, format: format.value })}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        formData.format === format.value
                          ? "border-primary-500 bg-primary-500/10"
                          : darkMode
                          ? "border-gray-700 hover:border-gray-600"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <div className="font-medium">{format.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Metodología */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Metodología y Áreas de Enfoque</h3>
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.theme || !formData.description) {
                      alert("Completa los pasos anteriores antes de generar con AI");
                      return;
                    }
                    
                    setAiLoading(true);
                    try {
                      const response = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/ai/generate-methodology`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: formData.name,
                          theme: formData.theme,
                          description: formData.description,
                          objectives: formData.objectives,
                          context: aiContext // Memoria acumulada
                        })
                      });

                      if (response.ok) {
                        const data = await response.json();
                        
                        // Actualizar memoria contextual
                        if (data.context) {
                          setAiContext(data.context);
                        }
                        
                        setFormData({
                          ...formData,
                          methodology: data.methodology || [],
                          focus_areas: data.focus_areas || []
                        });
                      } else {
                        alert("Error al generar metodología con AI");
                      }
                    } catch (error) {
                      console.error("Error:", error);
                      alert("Error al conectar con el servicio de AI");
                    } finally {
                      setAiLoading(false);
                    }
                  }}
                  disabled={aiLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    aiLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
                  }`}
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generar con AI
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className={`mb-3 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Metodologías (selecciona todas las aplicables)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {methodologies.map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData({ ...formData, methodology: toggleArrayItem(formData.methodology, method) })}
                      className={`p-3 rounded-lg border text-sm transition text-left ${
                        formData.methodology.includes(method)
                          ? "border-primary-500 bg-primary-500/10 text-primary-500"
                          : darkMode
                          ? "border-gray-700 hover:border-gray-600 text-gray-300"
                          : "border-gray-300 hover:border-gray-400 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          formData.methodology.includes(method)
                            ? "bg-primary-500 border-primary-500"
                            : darkMode
                            ? "border-gray-600"
                            : "border-gray-400"
                        }`}>
                          {formData.methodology.includes(method) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        {method}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`mb-3 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Áreas de Enfoque (selecciona las principales)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {focusAreas.map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setFormData({ ...formData, focus_areas: toggleArrayItem(formData.focus_areas, area) })}
                      className={`p-3 rounded-lg border text-sm transition text-left ${
                        formData.focus_areas.includes(area)
                          ? "border-primary-500 bg-primary-500/10 text-primary-500"
                          : darkMode
                          ? "border-gray-700 hover:border-gray-600 text-gray-300"
                          : "border-gray-300 hover:border-gray-400 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          formData.focus_areas.includes(area)
                            ? "bg-primary-500 border-primary-500"
                            : darkMode
                            ? "border-gray-600"
                            : "border-gray-400"
                        }`}>
                          {formData.focus_areas.includes(area) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        {area}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Configuración */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
              <h3 className="text-xl font-bold mb-4">Configuración Final</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Estado Inicial
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                      darkMode
                        ? "border-gray-700 bg-dark-300 text-white"
                        : "border-gray-300 bg-white text-black"
                    }`}
                  >
                    <option value="draft">Borrador</option>
                    <option value="active">Activo</option>
                    <option value="paused">Pausado</option>
                  </select>
                </div>

                <div>
                  <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Capacidad Máxima (participantes)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="500"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                    className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                      darkMode
                        ? "border-gray-700 bg-dark-300 text-white"
                        : "border-gray-300 bg-white text-black"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`mb-3 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Criterios de Matching (para el algoritmo de emparejamiento)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {matchingCriteriaOptions.map(criteria => (
                    <button
                      key={criteria}
                      type="button"
                      onClick={() => setFormData({ ...formData, matching_criteria: toggleArrayItem(formData.matching_criteria, criteria) })}
                      className={`p-3 rounded-lg border text-sm transition text-left ${
                        formData.matching_criteria.includes(criteria)
                          ? "border-primary-500 bg-primary-500/10 text-primary-500"
                          : darkMode
                          ? "border-gray-700 hover:border-gray-600 text-gray-300"
                          : "border-gray-300 hover:border-gray-400 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          formData.matching_criteria.includes(criteria)
                            ? "bg-primary-500 border-primary-500"
                            : darkMode
                            ? "border-gray-600"
                            : "border-gray-400"
                        }`}>
                          {formData.matching_criteria.includes(criteria) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        {criteria}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              <div className={`p-4 rounded-lg ${darkMode ? "bg-dark-300" : "bg-gray-50"}`}>
                <h4 className="font-semibold mb-2">Resumen del Programa</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Nombre:</strong> {formData.name}</p>
                  <p><strong>Tema:</strong> {formData.theme}</p>
                  <p><strong>Duración:</strong> {formData.duration_months} meses</p>
                  <p><strong>Objetivos:</strong> {formData.objectives.length}</p>
                  <p><strong>Metodologías:</strong> {formData.methodology.length}</p>
                  <p><strong>Áreas de enfoque:</strong> {formData.focus_areas.length}</p>
                </div>
              </div>
            </div>
          )}

        {/* Footer */}
        <div className={`border-t p-6 flex justify-between ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePrev();
            }}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition ${
              currentStep === 1
                ? "opacity-50 cursor-not-allowed"
                : darkMode
                ? "bg-dark-300 hover:bg-dark-200 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white transition"
            >
              Siguiente
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition"
            >
              <Check className="w-5 h-5" />
              Crear Programa
            </button>
          )}
        </div>
        </form>
      </div>
    </div>
  );
}
