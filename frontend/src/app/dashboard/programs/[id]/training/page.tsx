"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Program {
  id: string;
  name: string;
  description: string;
  theme: string;
  status: string;
  company?: {
    id: string;
    name: string;
  };
  activities?: Activity[];
  activities_count: number;
  participants_count: number;
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

interface TrainingConfig {
  requires_sequential_completion: boolean;
  minimum_attendance_percentage: number;
  certification_requirements: string;
}

export default function ProgramTrainingPage() {
  const params = useParams();
  const programId = params?.id as string;
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [openModuleDropdown, setOpenModuleDropdown] = useState<string | null>(null);
  const [showModuleEditModal, setShowModuleEditModal] = useState(false);
  const [showModuleContentModal, setShowModuleContentModal] = useState(false);
  const [showModuleConfigModal, setShowModuleConfigModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [currentTrainingId, setCurrentTrainingId] = useState<number | null>(null);
  
  // Activity form state
  const [activityForm, setActivityForm] = useState({
    name: "",
    description: "",
    type: "training",
    category: "mentoria",
    start_date: "",
    end_date: "",
    modality: "online",
    target_role: "mentee",
    is_mandatory: false,
    is_certificate_issued: false,
    location_address: ""
  });
  
  // Module management
  const [modules, setModules] = useState<ModuleFormData[]>([]);
  
  // Single module form state (for modal)
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({
    title: "",
    description: "",
    duration_minutes: 60,
    requires_evaluation: false,
    minimum_score: 70,
    start_date: "",
    end_date: ""
  });
  
  // Training config
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    requires_sequential_completion: false,
    minimum_attendance_percentage: 80,
    certification_requirements: ""
  });

  useEffect(() => {
    if (programId) {
      loadProgram();
    }
  }, [programId]);

  const loadProgram = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(`${apiUrl}/api/programs/${programId}`);
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

  // Funciones de módulos
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

  // Funciones de wizard
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

  const resetModal = () => {
    setShowModal(false);
    setWizardStep(1);
    setEditingActivity(null);
    setActivityForm({
      name: "",
      description: "",
      type: "training",
      category: "mentoria",
      start_date: "",
      end_date: "",
      modality: "online",
      target_role: "mentee",
      is_mandatory: false,
      is_certificate_issued: false,
      location_address: ""
    });
    setModules([]);
    setTrainingConfig({
      requires_sequential_completion: false,
      minimum_attendance_percentage: 80,
      certification_requirements: ""
    });
  };

  // Función para crear o editar actividad
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

      if (activityForm.type === "training" && modules.length > 0) {
        payload.modules = modules.map((m, idx) => ({
          ...m,
          order: idx + 1
        }));
        payload.training_config = trainingConfig;
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
        alert(editingActivity ? "✅ Actividad actualizada exitosamente" : "✅ Actividad creada exitosamente");
        resetModal();
        loadProgram();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.detail || "No se pudo guardar la actividad"}`);
      }
    } catch (error) {
      console.error("Error guardando actividad:", error);
      alert("❌ Error de conexión");
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setActivityForm({
      name: activity.name,
      description: activity.description,
      type: activity.type,
      category: activity.category,
      start_date: activity.start_date?.substring(0, 16) || "",
      end_date: activity.end_date?.substring(0, 16) || "",
      modality: activity.modality,
      target_role: activity.target_role,
      is_mandatory: activity.is_mandatory,
      is_certificate_issued: activity.is_certificate_issued,
      location_address: activity.location_address || ""
    });
    
    if (activity.modules && activity.modules.length > 0) {
      setModules(activity.modules.map(m => ({
        title: m.title,
        description: m.description,
        duration_minutes: m.duration_minutes,
        requires_evaluation: m.requires_evaluation,
        minimum_score: m.minimum_score || 70,
        start_date: m.start_date || "",
        end_date: m.end_date || ""
      })));
      setWizardStep(1);
    }
    
    setShowModal(true);
    setOpenDropdownId(null);
  };

  // Module management handlers
  const handleEditModule = (trainingId: number, module: Module) => {
    // Populate form with module data
    setModuleForm({
      title: module.title || "",
      description: module.description || "",
      duration_minutes: module.duration_minutes || 60,
      requires_evaluation: module.requires_evaluation || false,
      minimum_score: module.minimum_score || 70,
      start_date: module.start_date || "",
      end_date: module.end_date || ""
    });
    
    setEditingModule(module);
    setCurrentTrainingId(trainingId);
    setOpenModuleDropdown(null);
    setShowModuleEditModal(true);
  };

  const handleAddContentToModule = (trainingId: number, module: Module) => {
    setEditingModule(module);
    setCurrentTrainingId(trainingId);
    setOpenModuleDropdown(null);
    setShowModuleContentModal(true);
  };

  const handleConfigureModule = (trainingId: number, module: Module) => {
    setEditingModule(module);
    setCurrentTrainingId(trainingId);
    setOpenModuleDropdown(null);
    setShowModuleConfigModal(true);
  };

  const handleAddNewModule = (trainingId: number) => {
    // Crear un módulo vacío para agregar
    const newModule: Module = {
      title: "",
      description: "",
      duration_minutes: 60,
      requires_evaluation: false,
      minimum_score: 70,
      order: 0, // Se calculará en el backend
      is_published: false,
      materials_url: "",
      start_date: "",
      end_date: ""
    };
    
    // Reset form
    setModuleForm({
      title: "",
      description: "",
      duration_minutes: 60,
      requires_evaluation: false,
      minimum_score: 70,
      start_date: "",
      end_date: ""
    });
    
    setEditingModule(newModule);
    setCurrentTrainingId(trainingId);
    setShowModuleEditModal(true);
  };

  const handleSaveModule = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      
      // Validar campos requeridos
      if (!moduleForm.title || moduleForm.title.trim() === "") {
        alert("El título del módulo es requerido");
        return;
      }
      
      // Preparar payload
      const payload = {
        title: moduleForm.title,
        description: moduleForm.description,
        duration_minutes: moduleForm.duration_minutes,
        requires_evaluation: moduleForm.requires_evaluation,
        minimum_score: moduleForm.minimum_score,
        start_date: moduleForm.start_date || null,
        end_date: moduleForm.end_date || null,
      };
      
      let response;
      
      // Si el módulo ya existe (tiene id real), actualizar
      if (editingModule?.id && !String(editingModule.id).startsWith('temp-')) {
        response = await fetch(`${apiUrl}/api/modules/${editingModule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } 
      // Si es un módulo nuevo, crear
      else if (currentTrainingId) {
        response = await fetch(`${apiUrl}/api/activities/${currentTrainingId}/modules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        alert("Error: No se puede guardar el módulo sin una actividad asociada");
        return;
      }
      
      if (response.ok) {
        alert("Módulo guardado correctamente");
        setShowModuleEditModal(false);
        loadProgram(); // Recargar datos del programa
      } else {
        const error = await response.json();
        alert(`Error al guardar módulo: ${error.detail || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error saving module:", error);
      alert("Error al guardar el módulo");
    }
  };

  const handlePublishModule = async (trainingId: number, moduleId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(`${apiUrl}/api/modules/${moduleId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        alert("Estado de publicación actualizado correctamente");
        loadProgram();
      }
    } catch (error) {
      console.error("Error al actualizar publicación:", error);
      alert("Error al actualizar el estado de publicación");
    }
    setOpenModuleDropdown(null);
  };

  const handleDeleteModule = async (trainingId: number, moduleId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este módulo? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(`${apiUrl}/api/modules/${moduleId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        alert("Módulo eliminado correctamente");
        loadProgram();
      }
    } catch (error) {
      console.error("Error al eliminar módulo:", error);
      alert("Error al eliminar el módulo");
    }
    setOpenModuleDropdown(null);
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm("¿Estás seguro de eliminar esta actividad? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(`${apiUrl}/api/activities/${activityId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        alert("✅ Actividad eliminada exitosamente");
        loadProgram();
      } else {
        alert("❌ Error al eliminar la actividad");
      }
    } catch (error) {
      console.error("Error eliminando actividad:", error);
      alert("❌ Error de conexión");
    } finally {
      setOpenDropdownId(null);
    }
  };

  const handleDuplicateActivity = async (activity: Activity) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      
      const payload: any = {
        name: `${activity.name} (Copia)`,
        description: activity.description,
        type: activity.type,
        category: activity.category,
        start_date: activity.start_date,
        end_date: activity.end_date,
        modality: activity.modality,
        target_role: activity.target_role,
        is_mandatory: activity.is_mandatory,
        is_certificate_issued: activity.is_certificate_issued,
        program_id: programId,
        location_address: activity.location_address
      };

      if (activity.modules && activity.modules.length > 0) {
        payload.modules = activity.modules.map((m, idx) => ({
          title: m.title,
          description: m.description,
          duration_minutes: m.duration_minutes,
          requires_evaluation: m.requires_evaluation,
          minimum_score: m.minimum_score,
          order: idx + 1
        }));
      }

      const response = await fetch(`${apiUrl}/api/activities/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("✅ Actividad duplicada exitosamente");
        loadProgram();
      } else {
        alert("❌ Error al duplicar la actividad");
      }
    } catch (error) {
      console.error("Error duplicando actividad:", error);
      alert("❌ Error de conexión");
    } finally {
      setOpenDropdownId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mejorado */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Entrenamientos</h1>
              <p className="text-base text-gray-600 mt-2">Gestiona los programas de formación con módulos estructurados</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo entrenamiento
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">

      {/* Filtrar solo entrenamientos */}
      {(() => {
        const trainings = program?.activities?.filter(a => a.type === "training") || [];

        return trainings.length > 0 ? (
          <div className="space-y-6">
            {trainings.map((training) => (
              <div key={training.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-xl transition-all duration-200">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center flex-wrap gap-2 mb-4">
                        {training.is_mandatory && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-200">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Obligatoria
                          </span>
                        )}
                        {training.is_certificate_issued && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Certificado
                          </span>
                        )}
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full capitalize">
                          {training.category}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-700 transition-colors leading-tight">{training.name}</h3>
                      <p className="text-base text-gray-600 leading-relaxed max-w-3xl">{training.description}</p>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === training.id ? null : (training.id || null))}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      {openDropdownId === training.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenDropdownId(null)}
                          ></div>
                          <div className="absolute right-0 top-12 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            <button
                              onClick={() => handleEditActivity(training)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-700"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar
                            </button>
                            <button
                              onClick={() => handleDuplicateActivity(training)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm text-gray-700"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Duplicar
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => training.id && handleDeleteActivity(training.id)}
                              className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-2 text-sm text-red-600"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Modalidad</p>
                      <p className="text-sm font-semibold text-gray-900">{training.modality === "online" ? "Online" : training.modality === "in_person" ? "Presencial" : "Híbrida"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dirigido a</p>
                      <p className="text-sm font-semibold text-gray-900">{training.target_role === "both" ? "Todos" : training.target_role === "mentee" ? "Mentees" : "Mentores"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Módulos</p>
                      <p className="text-sm font-semibold text-gray-900">{training.modules?.length || 0} módulos</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duración total</p>
                      <p className="text-sm font-semibold text-gray-900">{training.modules?.reduce((acc, m) => acc + m.duration_minutes, 0) || 0} min</p>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="flex items-center gap-4 mt-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{new Date(training.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-medium">{new Date(training.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* URL o Ubicación */}
                  {training.meeting_url && (
                    <div className="mt-5">
                      <a href={training.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Unirse a reunión
                      </a>
                    </div>
                  )}
                  {training.location_address && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {training.location_address}
                    </div>
                  )}
                </div>

                {/* Módulos del Entrenamiento */}
                {training.modules && training.modules.length > 0 && (
                  <div className="px-8 pb-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-900 rounded-lg">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Módulos del programa</h4>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">{training.modules.length}</span>
                      </div>
                      <button
                        onClick={() => handleAddNewModule(training.id || 0)}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-black font-bold rounded-lg transition-all flex items-center gap-2 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo Módulo
                      </button>
                    </div>
                    <div className="space-y-3">
                      {training.modules.sort((a, b) => a.order - b.order).map((module, mIdx) => {
                        const moduleKey = `${training.id}-${module.id || mIdx}`;
                        return (
                        <div key={mIdx} className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                              {module.order}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="text-base font-semibold text-gray-900">{module.title}</h5>
                                <div className="relative ml-2">
                                  <button 
                                    onClick={() => setOpenModuleDropdown(openModuleDropdown === moduleKey ? null : moduleKey)}
                                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shadow-sm border border-gray-200"
                                  >
                                    <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                                      <circle cx="12" cy="5" r="2" />
                                      <circle cx="12" cy="12" r="2" />
                                      <circle cx="12" cy="19" r="2" />
                                    </svg>
                                  </button>
                                  
                                  {openModuleDropdown === moduleKey && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setOpenModuleDropdown(null)}
                                      ></div>
                                      <div className="absolute right-0 top-10 z-20 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
                                        <button
                                          onClick={() => handleEditModule(training.id || 0, module)}
                                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm text-gray-700"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                          Editar módulo
                                        </button>
                                        <button
                                          onClick={() => handleAddContentToModule(training.id || 0, module)}
                                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm text-gray-700"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                          </svg>
                                          Agregar contenido
                                        </button>
                                        <button
                                          onClick={() => handleConfigureModule(training.id || 0, module)}
                                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm text-gray-700"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          </svg>
                                          Configurar módulo
                                        </button>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                          onClick={() => module.id && handlePublishModule(training.id || 0, module.id)}
                                          className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm text-gray-700"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                          {module.is_published ? "Despublicar" : "Publicar"}
                                        </button>
                                        <button
                                          onClick={() => module.id && handleDeleteModule(training.id || 0, module.id)}
                                          className="w-full px-4 py-2.5 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-sm text-red-600"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                          Eliminar módulo
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{module.description}</p>
                              <div className="flex items-center gap-3 mt-4">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {module.duration_minutes} min
                                </div>
                                {module.requires_evaluation && (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Evaluación · mín. {module.minimum_score}%
                                  </div>
                                )}
                                {module.is_published && (
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Publicado
                                  </div>
                                )}
                              </div>
                              {module.materials_url && (
                                <a href={module.materials_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Descargar materiales
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-20 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sin entrenamientos todavía</h3>
            <p className="text-base text-gray-600 mb-8 max-w-md mx-auto">Comienza creando tu primer programa de formación con módulos estructurados</p>
            <button 
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Crear primer entrenamiento
            </button>
          </div>
        );
      })()}

      {/* Modal: Crear/Editar Entrenamiento con Wizard */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {wizardStep === 1 ? "Nuevo Entrenamiento" : "Configurar Módulos"}
              </h2>
              <button onClick={resetModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Wizard Stepper */}
            {activityForm.type === "training" && (
              <div className="px-6 py-4 border-b-2 border-gray-200">
                <div className="flex items-center justify-center gap-4">
                  <div className={`flex items-center gap-2 ${wizardStep === 1 ? "text-primary-600" : "text-gray-400"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${wizardStep === 1 ? "bg-primary-500 text-white" : "bg-gray-200"}`}>
                      1
                    </div>
                    <span className="font-bold">Información Básica</span>
                  </div>
                  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className={`flex items-center gap-2 ${wizardStep === 2 ? "text-primary-600" : "text-gray-400"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${wizardStep === 2 ? "bg-primary-500 text-white" : "bg-gray-200"}`}>
                      2
                    </div>
                    <span className="font-bold">Módulos y Configuración</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6">
              {/* PASO 1: Información Básica */}
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Entrenamiento *</label>
                      <input
                        type="text"
                        value={activityForm.name}
                        onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                        placeholder="Ej: Liderazgo Transformacional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Categoría *</label>
                      <select
                        value={activityForm.category}
                        onChange={(e) => setActivityForm({ ...activityForm, category: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                      >
                        <option value="mentoria">Mentoría</option>
                        <option value="capacitacion">Capacitación</option>
                        <option value="networking">Networking</option>
                        <option value="evaluacion">Evaluación</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                    <textarea
                      value={activityForm.description}
                      onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                      rows={3}
                      placeholder="Describe los objetivos y contenido del entrenamiento..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Rol Objetivo *</label>
                      <select
                        value={activityForm.target_role}
                        onChange={(e) => setActivityForm({ ...activityForm, target_role: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                      >
                        <option value="mentee">Mentee</option>
                        <option value="mentor">Mentor</option>
                        <option value="both">Ambos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Modalidad *</label>
                      <select
                        value={activityForm.modality}
                        onChange={(e) => setActivityForm({ ...activityForm, modality: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                      >
                        <option value="online">Online</option>
                        <option value="in_person">Presencial</option>
                        <option value="hybrid">Híbrida</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Inicio *</label>
                      <input
                        type="datetime-local"
                        value={activityForm.start_date}
                        onChange={(e) => setActivityForm({ ...activityForm, start_date: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Fin *</label>
                      <input
                        type="datetime-local"
                        value={activityForm.end_date}
                        onChange={(e) => setActivityForm({ ...activityForm, end_date: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                      />
                    </div>
                  </div>

                  {(activityForm.modality === "in_person" || activityForm.modality === "hybrid") && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Dirección / Ubicación {activityForm.modality === "in_person" ? "*" : ""}
                      </label>
                      <input
                        type="text"
                        value={activityForm.location_address}
                        onChange={(e) => setActivityForm({ ...activityForm, location_address: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                        placeholder="Ej: Av. Principal 123, Edificio Torre A, Piso 5"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activityForm.is_mandatory}
                        onChange={(e) => setActivityForm({ ...activityForm, is_mandatory: e.target.checked })}
                        className="w-5 h-5 text-primary-500 border-2 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-bold text-gray-700">Entrenamiento Obligatorio</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activityForm.is_certificate_issued}
                        onChange={(e) => setActivityForm({ ...activityForm, is_certificate_issued: e.target.checked })}
                        className="w-5 h-5 text-primary-500 border-2 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-bold text-gray-700">Emitir Certificado al Completar</span>
                    </label>
                  </div>

                  {/* Configuración de Asistencia */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Configuración de Asistencia
                    </h4>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Porcentaje Mínimo de Asistencia (%)
                      </label>
                      <input
                        type="number"
                        value={trainingConfig.minimum_attendance_percentage}
                        onChange={(e) => setTrainingConfig({ ...trainingConfig, minimum_attendance_percentage: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                        min="0"
                        max="100"
                        placeholder="80"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Este porcentaje se calculará en base al total de módulos del entrenamiento
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: Módulos y Configuración */}
              {wizardStep === 2 && activityForm.type === "training" && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Módulos del Entrenamiento</h3>
                      <button
                        onClick={handleAddModule}
                        className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-all"
                      >
                        + Agregar Módulo
                      </button>
                    </div>

                    {modules.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-gray-600">No hay módulos agregados</p>
                        <p className="text-sm text-gray-500 mt-1">Agrega módulos para estructurar el contenido</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {modules.map((module, idx) => (
                          <div key={idx} className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-gray-900">Módulo {idx + 1}</h4>
                              <button
                                onClick={() => handleRemoveModule(idx)}
                                className="text-red-500 hover:text-red-700 font-bold"
                              >
                                Eliminar
                              </button>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Título *</label>
                                <input
                                  type="text"
                                  value={module.title}
                                  onChange={(e) => handleModuleChange(idx, "title", e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                                  placeholder="Ej: Introducción al Liderazgo"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
                                <textarea
                                  value={module.description}
                                  onChange={(e) => handleModuleChange(idx, "description", e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                                  rows={2}
                                  placeholder="Describe el contenido del módulo..."
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Duración (min)</label>
                                  <input
                                    type="number"
                                    value={module.duration_minutes}
                                    onChange={(e) => handleModuleChange(idx, "duration_minutes", parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Requiere evaluación</label>
                                  <input
                                    type="checkbox"
                                    checked={module.requires_evaluation}
                                    onChange={(e) => handleModuleChange(idx, "requires_evaluation", e.target.checked)}
                                    className="w-5 h-5 mt-2 text-primary-500 border-2 border-gray-300 rounded"
                                  />
                                </div>
                                {module.requires_evaluation && (
                                  <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Puntaje Mín (%)</label>
                                    <input
                                      type="number"
                                      value={module.minimum_score}
                                      onChange={(e) => handleModuleChange(idx, "minimum_score", parseInt(e.target.value) || 0)}
                                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                                      min="0"
                                      max="100"
                                    />
                                  </div>
                                )}
                              </div>
                              
                              {/* Campos de fechas */}
                              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                                <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de inicio</label>
                                  <input
                                    type="date"
                                    value={module.start_date || ""}
                                    onChange={(e) => handleModuleChange(idx, "start_date", e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de fin</label>
                                  <input
                                    type="date"
                                    value={module.end_date || ""}
                                    onChange={(e) => handleModuleChange(idx, "end_date", e.target.value)}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t-2 border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Configuración del Entrenamiento</h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trainingConfig.requires_sequential_completion}
                          onChange={(e) => setTrainingConfig({ ...trainingConfig, requires_sequential_completion: e.target.checked })}
                          className="w-5 h-5 text-primary-500 border-2 border-gray-300 rounded"
                        />
                        <div>
                          <p className="font-bold text-gray-700">Requiere completar módulos en orden</p>
                          <p className="text-sm text-gray-500">Los participantes deben completar cada módulo antes de avanzar al siguiente</p>
                        </div>
                      </label>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Requisitos para Certificación
                        </label>
                        <textarea
                          value={trainingConfig.certification_requirements}
                          onChange={(e) => setTrainingConfig({ ...trainingConfig, certification_requirements: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
                          rows={3}
                          placeholder="Ej: Completar todos los módulos con puntaje mínimo de 70%..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer con Botones */}
            <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              {wizardStep === 2 && (
                <button
                  onClick={handlePreviousStep}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all"
                >
                  ← Anterior
                </button>
              )}
              <button
                onClick={resetModal}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancelar
              </button>
              {wizardStep === 1 && activityForm.type === "training" ? (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-primary-500 text-black font-bold rounded-lg hover:bg-primary-600 transition-all"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  onClick={handleCreateActivity}
                  className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-all"
                >
                  ✓ {editingActivity ? "Actualizar" : "Crear"} Entrenamiento
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Módulo */}
      {showModuleEditModal && editingModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Editar Módulo</h2>
              </div>
              <button onClick={() => setShowModuleEditModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Título del módulo *</label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Ej: Introducción a la mentoría"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  rows={3}
                  placeholder="Describe el contenido del módulo..."
                />
              </div>
              
              {/* Grid con campos de duración y evaluación */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Duración (minutos) *</label>
                  <input
                    type="number"
                    min="1"
                    value={moduleForm.duration_minutes}
                    onChange={(e) => setModuleForm({ ...moduleForm, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Evaluación</label>
                  <div className="flex items-center gap-2 h-[42px]">
                    <input
                      type="checkbox"
                      checked={moduleForm.requires_evaluation}
                      onChange={(e) => setModuleForm({ ...moduleForm, requires_evaluation: e.target.checked })}
                      className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Requiere evaluación</span>
                  </div>
                </div>
              </div>
              
              {/* Campo condicional de puntuación mínima */}
              {moduleForm.requires_evaluation && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Puntuación mínima para aprobar (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={moduleForm.minimum_score}
                    onChange={(e) => setModuleForm({ ...moduleForm, minimum_score: parseInt(e.target.value) || 70 })}
                    className="w-32 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">Los participantes deben alcanzar esta puntuación para aprobar el módulo</p>
                </div>
              )}
              
              {/* Campos de fechas */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de inicio</label>
                  <input
                    type="date"
                    value={moduleForm.start_date}
                    onChange={(e) => setModuleForm({ ...moduleForm, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de fin</label>
                  <input
                    type="date"
                    value={moduleForm.end_date}
                    onChange={(e) => setModuleForm({ ...moduleForm, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowModuleEditModal(false)}
                className="px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveModule}
                disabled={!moduleForm.title || moduleForm.title.trim() === ""}
                className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agregar Contenido */}
      {showModuleContentModal && editingModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Agregar Contenido</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{editingModule.title}</p>
                </div>
              </div>
              <button onClick={() => setShowModuleContentModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Tipo de contenido</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button className="p-5 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-all group">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-900 transition-colors">
                      <svg className="w-6 h-6 text-gray-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Documento</h3>
                    <p className="text-xs text-gray-500">PDF, Word, etc.</p>
                  </button>
                  <button className="p-5 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-all group">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-900 transition-colors">
                      <svg className="w-6 h-6 text-gray-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Video</h3>
                    <p className="text-xs text-gray-500">YouTube, Vimeo</p>
                  </button>
                  <button className="p-5 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50 transition-all group">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-900 transition-colors">
                      <svg className="w-6 h-6 text-gray-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Enlace</h3>
                    <p className="text-xs text-gray-500">URL externa</p>
                  </button>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Contenido actual</h3>
                {editingModule.materials_url ? (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Material adjunto</p>
                      <p className="text-xs text-gray-500">{editingModule.materials_url}</p>
                    </div>
                    <button className="text-red-600 hover:text-red-700">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">No hay contenido agregado aún</p>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end rounded-b-xl">
              <button
                onClick={() => setShowModuleContentModal(false)}
                className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración de Módulo */}
      {showModuleConfigModal && editingModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Configurar Módulo</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{editingModule.title}</p>
                </div>
              </div>
              <button onClick={() => setShowModuleConfigModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Evaluación</h3>
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    defaultChecked={editingModule.requires_evaluation}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-700">Este módulo requiere evaluación para avanzar</span>
                </label>
                {editingModule.requires_evaluation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Puntaje mínimo requerido (%)</label>
                    <input
                      type="number"
                      defaultValue={editingModule.minimum_score || 70}
                      min="0"
                      max="100"
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                    />
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Visibilidad</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={editingModule.is_published}
                    className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-700">Módulo visible para los participantes</span>
                </label>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Orden en el programa</h3>
                <p className="text-sm text-gray-600 mb-3">Define la posición de este módulo en la secuencia</p>
                <input
                  type="number"
                  defaultValue={editingModule.order}
                  min="1"
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                onClick={() => setShowModuleConfigModal(false)}
                className="px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert("Configuración guardada (funcionalidad en desarrollo)");
                  setShowModuleConfigModal(false);
                }}
                className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Guardar configuración
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
