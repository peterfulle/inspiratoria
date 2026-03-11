"use client";

import { useState } from "react";

type ProgramModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  darkMode: boolean;
};

export default function ProgramModal({ isOpen, onClose, onSubmit, darkMode }: ProgramModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    theme: "Leadership",
    status: "active",
  });
  const [useAI, setUseAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: "", description: "", theme: "Leadership", status: "active" });
    setUseAI(false);
    onClose();
  };

  const generateWithAI = async () => {
    if (!formData.name) {
      alert("Por favor ingresa un nombre para el programa primero");
      return;
    }

    setAiLoading(true);
    try {
      // Simulación de llamada a AI (puedes conectar con tu backend aquí)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const suggestions = {
        Leadership: "Programa diseñado para desarrollar habilidades de liderazgo inclusivo, pensamiento estratégico y gestión de equipos de alto rendimiento. Los participantes aprenderán a inspirar, motivar y guiar a sus equipos hacia el éxito.",
        Technical: "Programa enfocado en el desarrollo de habilidades técnicas avanzadas, mejores prácticas de ingeniería y arquitectura de software. Incluye mentoría en tecnologías emergentes y metodologías ágiles.",
        "Career Development": "Programa integral para acelerar el crecimiento profesional, incluyendo planificación de carrera, desarrollo de habilidades blandas y construcción de red profesional. Ideal para profesionales en transición o buscando ascenso.",
        Entrepreneurship: "Programa para emprendedores que buscan validar ideas de negocio, desarrollar MVP y escalar startups. Incluye mentoría en fundraising, product-market fit y growth hacking.",
        Innovation: "Programa orientado a fomentar la innovación y creatividad en organizaciones. Los participantes aprenderán metodologías de design thinking, innovación abierta y transformación digital.",
      };

      setFormData({
        ...formData,
        description: suggestions[formData.theme as keyof typeof suggestions] || "Descripción generada por InspiraAI basada en las mejores prácticas de mentoring.",
      });
    } catch (error) {
      console.error("Error generating AI description:", error);
      alert("Error al generar descripción con AI");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-xl border shadow-2xl ${
        darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
      }`}>
        <div className={`border-b p-6 ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Crear Nuevo Programa</h2>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Configura un nuevo programa de mentoring
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
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Nombre del Programa *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full rounded-lg border px-4 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                darkMode
                  ? "border-gray-700 bg-dark-300 text-white placeholder-gray-500"
                  : "border-gray-300 bg-white text-black placeholder-gray-400"
              }`}
              placeholder="Ej: Programa de Liderazgo 2025"
              required
            />
          </div>

          <div>
            <label className={`mb-2 block text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Tema / Categoría *
            </label>
            <select
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              className={`w-full rounded-lg border px-4 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                darkMode
                  ? "border-gray-700 bg-dark-300 text-white"
                  : "border-gray-300 bg-white text-black"
              }`}
            >
              <option value="Leadership">🎯 Leadership</option>
              <option value="Technical">💻 Technical</option>
              <option value="Career Development">📈 Career Development</option>
              <option value="Entrepreneurship">🚀 Entrepreneurship</option>
              <option value="Innovation">💡 Innovation</option>
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Descripción *
              </label>
              <button
                type="button"
                onClick={generateWithAI}
                disabled={aiLoading || !formData.name}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  aiLoading || !formData.name
                    ? "cursor-not-allowed opacity-50"
                    : darkMode
                    ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                    : "bg-purple-500/20 text-purple-600 hover:bg-purple-500/30"
                }`}
              >
                {aiLoading ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    🤖 Generar con InspiraAI
                  </>
                )}
              </button>
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full rounded-lg border px-4 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                darkMode
                  ? "border-gray-700 bg-dark-300 text-white placeholder-gray-500"
                  : "border-gray-300 bg-white text-black placeholder-gray-400"
              }`}
              rows={5}
              placeholder="Describe los objetivos, metodología y beneficios del programa..."
              required
            />
            <p className={`mt-1.5 text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
              💡 Tip: Usa InspiraAI para generar una descripción profesional basada en el tema seleccionado
            </p>
          </div>

          <div className={`rounded-lg border p-4 ${
            darkMode ? "border-blue-700 bg-blue-500/10" : "border-blue-300 bg-blue-50"
          }`}>
            <p className={`text-xs ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
              <strong>🤖 InspiraAI - Powered by Neuramorphic</strong>
              <br />
              Utiliza inteligencia artificial para generar descripciones optimizadas y profesionales para tus programas.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-lg border px-4 py-2.5 font-semibold transition ${
                darkMode
                  ? "border-gray-700 text-gray-300 hover:bg-dark-300"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary-500 px-4 py-2.5 font-bold text-black transition hover:bg-primary-400 hover:shadow-lg"
            >
              Crear Programa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
