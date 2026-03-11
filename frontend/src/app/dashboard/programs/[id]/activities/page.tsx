"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Program {
  id: string;
  name: string;
  activities_count: number;
  participants_count: number;
  activities?: Activity[];
}

interface Activity {
  id?: number;
  name: string;
  description: string;
  type: string;
  category: string;
  start_date: string;
  end_date: string;
  modality: string;
  target_role: string;
  is_mandatory: boolean;
  is_certificate_issued: boolean;
  meeting_url?: string;
  location_address?: string;
  modules?: Module[];
}

interface Module {
  id?: number;
  title: string;
  description: string;
  duration_minutes: number;
  requires_evaluation: boolean;
  minimum_score?: number;
  order: number;
  is_published?: boolean;
  materials_url?: string;
  start_date?: string;
  end_date?: string;
}

interface ModuleFormData {
  title: string;
  description: string;
  duration_minutes: number;
  requires_evaluation: boolean;
  minimum_score: number;
  start_date: string;
  end_date: string;
}

export default function ProgramActivitiesPage() {
  const params = useParams();
  const programId = params?.id as string;
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Activity form state
  const [activityForm, setActivityForm] = useState({
    name: "",
    description: "",
    type: "event",
    category: "mentoria",
    start_date: "",
    end_date: "",
    modality: "online",
    target_role: "mentee",
    is_mandatory: false,
    is_certificate_issued: false,
    location_address: "",
    meeting_url: ""
  });

  // Module management
  const [modules, setModules] = useState<ModuleFormData[]>([]);

  useEffect(() => {
    if (programId) {
      loadProgram();
    }
  }, [programId]);

  const loadProgram = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/programs/${programId}`
      );
      if (response.ok) {
        const data = await response.json();
        setProgram(data);
      }
    } catch (error) {
      console.error("Error loading program:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (activity?: Activity) => {
    if (activity) {
      setEditingActivity(activity);
      setActivityForm({
        name: activity.name,
        description: activity.description,
        type: activity.type,
        category: activity.category,
        start_date: activity.start_date,
        end_date: activity.end_date,
        modality: activity.modality,
        target_role: activity.target_role,
        is_mandatory: activity.is_mandatory,
        is_certificate_issued: activity.is_certificate_issued,
        location_address: activity.location_address || "",
        meeting_url: activity.meeting_url || ""
      });
      if (activity.modules) {
        setModules(activity.modules.map(m => ({
          title: m.title,
          description: m.description,
          duration_minutes: m.duration_minutes,
          requires_evaluation: m.requires_evaluation,
          minimum_score: m.minimum_score || 70,
          start_date: m.start_date || "",
          end_date: m.end_date || ""
        })));
      }
    } else {
      setEditingActivity(null);
    }
    setShowModal(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setWizardStep(1);
    setEditingActivity(null);
    setActivityForm({
      name: "",
      description: "",
      type: "event",
      category: "mentoria",
      start_date: "",
      end_date: "",
      modality: "online",
      target_role: "mentee",
      is_mandatory: false,
      is_certificate_issued: false,
      location_address: "",
      meeting_url: ""
    });
    setModules([]);
  };

  const handleCreateActivity = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      
      const payload: any = {
        name: activityForm.name,
        description: activityForm.description,
        type: activityForm.type,
        category: activityForm.category,
        start_date: activityForm.start_date,
        end_date: activityForm.end_date,
        modality: activityForm.modality,
        target_role: activityForm.target_role,
        is_mandatory: activityForm.is_mandatory,
        is_certificate_issued: activityForm.is_certificate_issued,
        program_id: programId
      };

      if (activityForm.modality === "in_person" && activityForm.location_address) {
        payload.location_address = activityForm.location_address;
      }

      if (activityForm.modality === "online" && activityForm.meeting_url) {
        payload.meeting_url = activityForm.meeting_url;
      }

      if (activityForm.type === "training" && modules.length > 0) {
        payload.modules = modules.map((m, idx) => ({
          ...m,
          order: idx + 1
        }));
      }

      const url = editingActivity 
        ? `${apiUrl}/api/activities/${editingActivity.id}`
        : `${apiUrl}/api/activities/create`;
      
      const method = editingActivity ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(editingActivity ? "✅ Evento actualizado exitosamente" : "✅ Evento creado exitosamente");
        resetModal();
        loadProgram();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.detail || "No se pudo guardar el evento"}`);
      }
    } catch (error) {
      console.error("Error guardando evento:", error);
      alert("❌ Error de conexión");
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm("¿Estás seguro de eliminar este evento?")) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(`${apiUrl}/api/activities/${activityId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        alert("✅ Evento eliminado");
        loadProgram();
      } else {
        alert("❌ Error al eliminar evento");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error de conexión");
    }
  };

  const handleAddModule = () => {
    setModules([...modules, {
      title: "",
      description: "",
      duration_minutes: 60,
      requires_evaluation: false,
      minimum_score: 70,
      start_date: "",
      end_date: ""
    }]);
  };

  const handleRemoveModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const handleModuleChange = (index: number, field: keyof ModuleFormData, value: any) => {
    const updatedModules = [...modules];
    updatedModules[index] = { ...updatedModules[index], [field]: value };
    setModules(updatedModules);
  };

  const handleNextStep = () => {
    if (wizardStep === 1 && activityForm.type === "training") {
      setWizardStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (wizardStep === 2) {
      setWizardStep(1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const activities = program?.activities || [];

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600 mt-2">Gestiona todos los eventos del programa</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-black px-6 py-3 rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/30"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear Evento
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No hay eventos definidos</h3>
          <p className="text-gray-600">Agrega tu primer evento para comenzar</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-primary-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{activity.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      activity.type === "training" ? "bg-blue-100 text-blue-700" :
                      activity.type === "event" ? "bg-green-100 text-green-700" :
                      "bg-purple-100 text-purple-700"
                    }`}>
                      {activity.type === "training" ? "Entrenamiento" :
                       activity.type === "event" ? "Evento" : "Reunión"}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      activity.modality === "online" ? "bg-indigo-100 text-indigo-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {activity.modality === "online" ? "Online" : "Presencial"}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{activity.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(activity.start_date).toLocaleDateString()} - {new Date(activity.end_date).toLocaleDateString()}
                    </div>
                    {activity.modules && activity.modules.length > 0 && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {activity.modules.length} módulos
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(activity)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => activity.id && handleDeleteActivity(activity.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Crear/Editar Evento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-8 py-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingActivity ? "Editar Evento" : 
                 wizardStep === 1 ? "Nuevo Evento" : "Configurar Módulos"}
              </h2>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8">
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nombre del Evento *
                    </label>
                    <input
                      type="text"
                      value={activityForm.name}
                      onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ej: Sesión de Networking"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      value={activityForm.description}
                      onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Describe el evento..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Tipo *
                      </label>
                      <select
                        value={activityForm.type}
                        onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="event">Evento</option>
                        <option value="training">Entrenamiento</option>
                        <option value="meeting">Reunión</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Modalidad *
                      </label>
                      <select
                        value={activityForm.modality}
                        onChange={(e) => setActivityForm({ ...activityForm, modality: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="online">Online</option>
                        <option value="in_person">Presencial</option>
                        <option value="hybrid">Híbrido</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Fecha Inicio *
                      </label>
                      <input
                        type="date"
                        value={activityForm.start_date}
                        onChange={(e) => setActivityForm({ ...activityForm, start_date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Fecha Fin *
                      </label>
                      <input
                        type="date"
                        value={activityForm.end_date}
                        onChange={(e) => setActivityForm({ ...activityForm, end_date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {activityForm.modality === "online" && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        URL de Reunión
                      </label>
                      <input
                        type="url"
                        value={activityForm.meeting_url}
                        onChange={(e) => setActivityForm({ ...activityForm, meeting_url: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  )}

                  {activityForm.modality === "in_person" && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={activityForm.location_address}
                        onChange={(e) => setActivityForm({ ...activityForm, location_address: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Dirección del evento"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activityForm.is_mandatory}
                        onChange={(e) => setActivityForm({ ...activityForm, is_mandatory: e.target.checked })}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Obligatorio</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activityForm.is_certificate_issued}
                        onChange={(e) => setActivityForm({ ...activityForm, is_certificate_issued: e.target.checked })}
                        className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Emite Certificado</span>
                    </label>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Módulos del Entrenamiento</h3>
                    <button
                      onClick={handleAddModule}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar Módulo
                    </button>
                  </div>

                  {modules.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <p className="text-gray-600">No hay módulos. Agrega el primer módulo.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {modules.map((module, index) => (
                        <div key={index} className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-lg font-bold text-gray-900">Módulo {index + 1}</h4>
                            <button
                              onClick={() => handleRemoveModule(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Título *
                              </label>
                              <input
                                type="text"
                                value={module.title}
                                onChange={(e) => handleModuleChange(index, "title", e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Título del módulo"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Descripción
                              </label>
                              <textarea
                                value={module.description}
                                onChange={(e) => handleModuleChange(index, "description", e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Descripción del módulo"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Duración (minutos)
                              </label>
                              <input
                                type="number"
                                value={module.duration_minutes}
                                onChange={(e) => handleModuleChange(index, "duration_minutes", parseInt(e.target.value) || 60)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                min="1"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Puntaje Mínimo
                              </label>
                              <input
                                type="number"
                                value={module.minimum_score}
                                onChange={(e) => handleModuleChange(index, "minimum_score", parseInt(e.target.value) || 70)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                min="0"
                                max="100"
                                disabled={!module.requires_evaluation}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Fecha Inicio
                              </label>
                              <input
                                type="date"
                                value={module.start_date}
                                onChange={(e) => handleModuleChange(index, "start_date", e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Fecha Fin
                              </label>
                              <input
                                type="date"
                                value={module.end_date}
                                onChange={(e) => handleModuleChange(index, "end_date", e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={module.requires_evaluation}
                                  onChange={(e) => handleModuleChange(index, "requires_evaluation", e.target.checked)}
                                  className="w-5 h-5 text-primary-500 rounded focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Requiere Evaluación</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-8 py-6 flex items-center justify-between">
              <button
                onClick={wizardStep === 2 ? handlePreviousStep : resetModal}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {wizardStep === 2 ? "← Anterior" : "Cancelar"}
              </button>

              {activityForm.type === "training" && wizardStep === 1 ? (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-black rounded-xl font-bold hover:from-primary-600 hover:to-primary-700 transition-all"
                >
                  Siguiente: Módulos →
                </button>
              ) : (
                <button
                  onClick={handleCreateActivity}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingActivity ? "Actualizar Evento" : "Crear Evento"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
