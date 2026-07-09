"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, CheckCircle, AlertCircle, Copy, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

type ParticipantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  darkMode: boolean;
  companyId?: number;
};

export default function ParticipantModal({ isOpen, onClose, onSubmit, darkMode, companyId }: ParticipantModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    role: "mentee",
    program_id: null as number | null,
  });
  
  const [programs, setPrograms] = useState<any[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load programs when modal opens
  useEffect(() => {
    if (isOpen && companyId) {
      loadPrograms();
    }
  }, [isOpen, companyId]);

  const loadPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const response = await apiFetch(`/api/programs/company/${companyId}`);
      if (!response.ok) throw new Error('Error al cargar programas');
      const data = await response.json();
      setPrograms(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, program_id: data[0].id }));
      }
    } catch (err) {
      console.error('Error loading programs:', err);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      role: "mentee",
      program_id: programs.length > 0 ? programs[0].id : null,
    });
    setSuccess(false);
    setError(null);
    setInvitationToken(null);
    setCopied(false);
  };

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.program_id) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await apiFetch('/api/invitations/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          role: formData.role,
          program_id: formData.program_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al enviar invitación');
      }

      const data = await response.json();
      setInvitationToken(data.token);
      setSuccess(true);
      
      // Call parent onSubmit (optional, for UI updates)
      onSubmit(data);
      
      // Auto-close after 5 seconds if they don't copy the link
      setTimeout(() => {
        handleClose();
      }, 5000);

    } catch (err: any) {
      setError(err.message || 'Error al enviar invitación');
    } finally {
      setSending(false);
    }
  };

  const copyInvitationLink = () => {
    if (invitationToken) {
      const link = `${window.location.origin}/onboarding?token=${invitationToken}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Success view
  if (success && invitationToken) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className={`w-full max-w-lg rounded-xl border p-6 ${
          darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
        }`}>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-black"}`}>
              ¡Invitación Enviada!
            </h2>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Se ha enviado un email a <strong>{formData.email}</strong> con el enlace de onboarding.
            </p>
          </div>

          <div className={`p-4 rounded-lg mb-4 ${darkMode ? "bg-dark-500" : "bg-gray-50"}`}>
            <p className={`text-xs mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Enlace de onboarding (válido por 7 días):
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}/onboarding?token=${invitationToken}`}
                readOnly
                className={`flex-1 px-3 py-2 text-sm rounded border ${
                  darkMode 
                    ? "border-gray-700 bg-dark-600 text-gray-300" 
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              />
              <button
                onClick={copyInvitationLink}
                className={`px-4 py-2 rounded transition ${
                  copied
                    ? "bg-green-500 text-white"
                    : darkMode
                    ? "bg-dark-600 text-gray-300 hover:bg-dark-500"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full rounded-lg bg-primary-500 px-4 py-3 font-bold text-black transition hover:bg-primary-400"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // Form view

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-xl border p-6 ${
        darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
      }`}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
              Enviar Invitación
            </h2>
          </div>
          <button
            onClick={handleClose}
            className={`text-2xl ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"}`}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`mb-2 block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Email del Participante *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                darkMode
                  ? "border-gray-700 bg-dark-500 text-white placeholder-gray-500"
                  : "border-gray-300 bg-white text-black placeholder-gray-400"
              }`}
              placeholder="ejemplo@empresa.com"
              required
            />
            <p className={`mt-1 text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
              Se enviará un email con el enlace de onboarding
            </p>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Rol *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                darkMode
                  ? "border-gray-700 bg-dark-500 text-white"
                  : "border-gray-300 bg-white text-black"
              }`}
            >
              <option value="mentee">Mentee</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>

          <div>
            <label className={`mb-2 block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Programa *
            </label>
            {loadingPrograms ? (
              <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cargando programas...</span>
              </div>
            ) : programs.length > 0 ? (
              <select
                value={formData.program_id || ''}
                onChange={(e) => setFormData({ ...formData, program_id: parseInt(e.target.value) })}
                className={`w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                  darkMode
                    ? "border-gray-700 bg-dark-500 text-white"
                    : "border-gray-300 bg-white text-black"
                }`}
                required
              >
                <option value="">Selecciona un programa</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className={`p-3 rounded-lg border ${
                darkMode ? "border-yellow-900 bg-yellow-900/20 text-yellow-300" : "border-yellow-300 bg-yellow-50 text-yellow-800"
              }`}>
                <p className="text-sm">No hay programas disponibles. Crea un programa primero.</p>
              </div>
            )}
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? "bg-purple-900/20" : "bg-purple-50"}`}>
            <h4 className={`text-sm font-semibold mb-2 ${darkMode ? "text-purple-300" : "text-purple-900"}`}>
              ¿Qué sucederá después?
            </h4>
            <ul className={`text-xs space-y-1 ${darkMode ? "text-purple-200" : "text-purple-800"}`}>
              <li>✓ El participante recibirá un email con un enlace único</li>
              <li>✓ Podrá conectar su perfil de LinkedIn (opcional)</li>
              <li>✓ Nuestra IA extraerá automáticamente su información</li>
              <li>✓ Completará su perfil en un proceso guiado de 6 pasos</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={sending}
              className={`flex-1 rounded-lg border px-4 py-3 font-medium transition ${
                darkMode
                  ? "border-gray-700 text-gray-300 hover:bg-dark-500"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sending || !formData.email || !formData.program_id}
              className="flex-1 rounded-lg bg-primary-500 px-4 py-3 font-bold text-black transition hover:bg-primary-400 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Enviar Invitación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
