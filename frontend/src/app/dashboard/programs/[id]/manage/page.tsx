"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Program {
  id: number;
  name: string;
  description: string;
  theme: string;
  status: string;
  company?: {
    id: string;
    name: string;
  };
  activities?: Activity[];
  activities_count?: number;
  participants_count?: number;
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
}

interface ModuleFormData {
  title: string;
  description: string;
  duration_minutes: number;
  requires_evaluation: boolean;
  minimum_score: number;
}

interface TrainingConfig {
  requires_sequential_completion: boolean;
  minimum_attendance_percentage: number;
  certification_requirements: string;
}

interface DayActivitiesData {
  day: number;
  activities: Activity[];
}

export default function ManageProgramPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "training" | "activities" | "participants" | "config" | "reports">("general");
  const [isLaunching, setIsLaunching] = useState(false);
  
  // Estados para editar detalles del programa
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: "",
    description: "",
    theme: ""
  });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDayActivitiesModal, setShowDayActivitiesModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayActivities, setDayActivities] = useState<Activity[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
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
  
  // Training config
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    requires_sequential_completion: false,
    minimum_attendance_percentage: 80,
    certification_requirements: ""
  });

  useEffect(() => {
    loadProgram();
  }, [programId]);

  const loadProgram = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(`${apiUrl}/api/programs/${programId}`);
      if (response.ok) {
        const data = await response.json();
        setProgram(data);
        // Inicializar el formulario con los datos del programa
        setProgramForm({
          name: data.name || "",
          description: data.description || "",
          theme: data.theme || ""
        });
      }
    } catch (error) {
      console.error("Error loading program:", error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para editar detalles del programa
  const handleEditDetails = () => {
    setIsEditingDetails(true);
  };

  const handleCancelEditDetails = () => {
    setIsEditingDetails(false);
    // Restaurar valores originales
    if (program) {
      setProgramForm({
        name: program.name || "",
        description: program.description || "",
        theme: program.theme || ""
      });
    }
  };

  const handleSaveDetails = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(`${apiUrl}/api/programs/${programId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(programForm)
      });

      if (response.ok) {
        const updatedProgram = await response.json();
        setProgram(updatedProgram);
        setIsEditingDetails(false);
        alert("✅ Programa actualizado exitosamente");
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.detail || "No se pudo actualizar el programa"}`);
      }
    } catch (error) {
      console.error("Error updating program:", error);
      alert("❌ Error de conexión");
    }
  };

  // Funciones de módulos
  const handleAddModule = () => {
    setModules([...modules, {
      title: "",
      description: "",
      duration_minutes: 60,
      requires_evaluation: false,
      minimum_score: 70
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

      // Si estamos editando, usar PUT, si no, usar POST
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

  // Función para manejar click en día del calendario
  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    // Filtrar actividades del día seleccionado
    const activitiesForDay = program?.activities?.filter(activity => {
      const activityDate = new Date(activity.start_date);
      return activityDate.getDate() === day;
    }) || [];
    setDayActivities(activitiesForDay);
    setShowDayActivitiesModal(true);
  };

  // Funciones para el dropdown de acciones
  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    // Cargar datos de la actividad en el formulario
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
    
    // Cargar módulos si existen
    if (activity.modules && activity.modules.length > 0) {
      setModules(activity.modules.map(m => ({
        title: m.title,
        description: m.description,
        duration_minutes: m.duration_minutes,
        requires_evaluation: m.requires_evaluation,
        minimum_score: m.minimum_score || 70
      })));
      setWizardStep(1);
    }
    
    setShowModal(true);
    setOpenDropdownId(null);
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

  // Funciones de validación para lanzamiento
  const canLaunchProgram = (): boolean => {
    if (!program) return false;
    const validation = validateProgramConfig();
    return validation.isValid;
  };

  const validateProgramConfig = () => {
    const issues: string[] = [];
    
    // Validar información general
    if (!program?.name || !program?.description) {
      issues.push("Información general incompleta");
    }
    
    // Validar actividades/entrenamientos
    const trainings = program?.activities?.filter(a => a.type === "training") || [];
    const events = program?.activities?.filter(a => a.type === "event") || [];
    
    if (trainings.length === 0 && events.length === 0) {
      issues.push("No hay actividades ni entrenamientos configurados");
    }
    
    // Validar que los entrenamientos tengan módulos
    const trainingsWithoutModules = trainings.filter(t => !t.modules || t.modules.length === 0);
    if (trainingsWithoutModules.length > 0) {
      issues.push(`${trainingsWithoutModules.length} entrenamiento(s) sin módulos configurados`);
    }
    
    // Validar participantes (por ahora solo verificamos que el programa tenga empresa)
    if (!program?.company?.id) {
      issues.push("No hay empresa asignada al programa");
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      stats: {
        hasGeneral: !!program?.name && !!program?.description,
        trainingsCount: trainings.length,
        eventsCount: events.length,
        totalActivities: (trainings.length || 0) + (events.length || 0),
        hasCompany: !!program?.company?.id
      }
    };
  };

  const handleLaunchProgram = async () => {
    const validation = validateProgramConfig();
    
    if (!validation.isValid) {
      const issuesList = validation.issues.map(issue => `• ${issue}`).join('\n');
      alert(`❌ No se puede lanzar el programa. Faltan las siguientes configuraciones:\n\n${issuesList}\n\nPor favor completa todos los requisitos antes de lanzar.`);
      setActiveTab("config"); // Llevar al usuario a la tab de configuración
      return;
    }
    
    if (!confirm("¿Estás seguro de lanzar este programa? Una vez lanzado, el programa será enviado a la empresa y los participantes.")) {
      return;
    }
    
    setIsLaunching(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(`${apiUrl}/api/programs/${programId}/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        alert("✅ ¡Programa lanzado exitosamente! El programa ha sido enviado a la empresa.");
        loadProgram();
      } else {
        const error = await response.json();
        alert(`❌ Error al lanzar el programa: ${error.detail || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error("Error lanzando programa:", error);
      alert("❌ Error de conexión al intentar lanzar el programa");
    } finally {
      setIsLaunching(false);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando programa...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-bold">Programa no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 font-medium">
            Dashboard
          </Link>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/dashboard/programs" className="text-gray-500 hover:text-gray-900 font-medium">
            Programas
          </Link>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-bold">{program.name}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{program.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-gray-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {program.company?.name || "Sin empresa"}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300">
                    {program.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/dashboard/programs')}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a Programas
              </button>
              <button
                onClick={handleLaunchProgram}
                disabled={isLaunching || !canLaunchProgram()}
                className={`px-6 py-2 font-bold rounded-lg transition-all flex items-center gap-2 ${
                  program?.status === 'launched' 
                    ? 'bg-green-500 text-white cursor-default'
                    : canLaunchProgram()
                    ? 'bg-primary-500 text-black hover:bg-primary-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {program?.status === 'launched' ? '✓ Programa Lanzado' : 'Lanzar Programa'}
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            
            {/* TAB: Información General */}
            {activeTab === "general" && (
              <>
                {/* Información del Programa */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Detalles del Programa</h2>
                    {!isEditingDetails ? (
                      <button
                        onClick={handleEditDetails}
                        className="p-2 hover:bg-gray-50 rounded-lg transition-all group"
                        title="Editar detalles"
                      >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelEditDetails}
                          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveDetails}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-all"
                        >
                          Guardar
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nombre</label>
                      {isEditingDetails ? (
                        <input
                          type="text"
                          value={programForm.name}
                          onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                          placeholder="Nombre del programa"
                        />
                      ) : (
                        <p className="text-gray-900">{program.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                      {isEditingDetails ? (
                        <textarea
                          value={programForm.description}
                          onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                          placeholder="Descripción del programa"
                          rows={3}
                        />
                      ) : (
                        <p className="text-gray-900">{program.description}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tema</label>
                        {isEditingDetails ? (
                          <input
                            type="text"
                            value={programForm.theme}
                            onChange={(e) => setProgramForm({ ...programForm, theme: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                            placeholder="Tema del programa"
                          />
                        ) : (
                          <p className="text-gray-900">{program.theme}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Estado</label>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border-2 border-purple-300">
                          {program.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calendario */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Calendario de Actividades</h2>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">
                        ‹ Anterior
                      </button>
                      <button className="px-4 py-1 text-sm font-bold text-gray-900 bg-gray-100 rounded-lg">
                        Diciembre 2025
                      </button>
                      <button className="px-3 py-1 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">
                        Siguiente ›
                      </button>
                    </div>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Headers */}
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                      <div key={day} className="text-center text-xs font-bold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                    {/* Days */}
                    {Array.from({ length: 35 }, (_, i) => {
                      const day = i - 1; // Ajustar para que empiece en día 1
                      const isCurrentMonth = day > 0 && day <= 31;
                      const isToday = day === 26; // Hoy es 26 de diciembre
                      const hasActivities = program?.activities?.some(activity => {
                        const activityDate = new Date(activity.start_date);
                        return activityDate.getDate() === day;
                      });
                      return (
                        <div
                          key={i}
                          onClick={() => isCurrentMonth && handleDayClick(day)}
                          className={`aspect-square flex flex-col items-center justify-center text-sm rounded-lg ${
                            !isCurrentMonth
                              ? "text-gray-300"
                              : isToday
                              ? "bg-primary-500 text-white font-bold cursor-pointer"
                              : "hover:bg-gray-100 cursor-pointer text-gray-900"
                          }`}
                        >
                          {isCurrentMonth && (
                            <>
                              <span>{day}</span>
                              {hasActivities && (
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></span>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t-2 border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-bold">{program.activities_count || 0}</span> actividades programadas este mes
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* TAB: Entrenamientos */}
            {activeTab === "training" && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Programas de Entrenamiento</h2>
                    <p className="text-gray-600 mt-1">Gestiona los entrenamientos con sus módulos y configuración</p>
                  </div>
                  <button 
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Entrenamiento
                  </button>
                </div>

                {program.activities && program.activities.filter(a => a.type === "training").length > 0 ? (
                  <div className="space-y-6">
                    {program.activities.filter(a => a.type === "training").map((training, idx) => (
                      <div key={idx} className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden">
                        {/* Header del Entrenamiento */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                  Entrenamiento
                                </span>
                                {training.is_mandatory && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded border border-red-300">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Obligatorio
                                  </span>
                                )}
                                {training.is_certificate_issued && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded border border-green-300">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                    Certifica
                                  </span>
                                )}
                              </div>
                              <h3 className="text-2xl font-bold text-gray-900">{training.name}</h3>
                              <p className="text-gray-700 mt-2">{training.description}</p>
                            </div>
                            <div className="relative">
                              <button 
                                onClick={() => setOpenDropdownId(openDropdownId === training.id ? null : (training.id || null))}
                                className="p-2 hover:bg-white rounded-lg transition-all"
                              >
                                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                              
                              {openDropdownId === training.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setOpenDropdownId(null)}
                                  ></div>
                                  <div className="absolute right-0 top-12 z-20 w-56 bg-white rounded-lg shadow-2xl border-2 border-gray-200 py-2">
                                    <button
                                      onClick={() => handleEditActivity(training)}
                                      className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-all flex items-center gap-3 text-gray-700 font-bold"
                                    >
                                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDuplicateActivity(training)}
                                      className="w-full px-4 py-2 text-left hover:bg-green-50 transition-all flex items-center gap-3 text-gray-700 font-bold"
                                    >
                                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      Duplicar
                                    </button>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <button
                                      onClick={() => training.id && handleDeleteActivity(training.id)}
                                      className="w-full px-4 py-2 text-left hover:bg-red-50 transition-all flex items-center gap-3 text-red-600 font-bold"
                                    >
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                          <div className="grid grid-cols-4 gap-4 mt-4">
                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                              <p className="text-xs font-bold text-gray-500 uppercase">Categoría</p>
                              <p className="text-sm font-bold text-gray-900 mt-1 capitalize">{training.category}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                              <p className="text-xs font-bold text-gray-500 uppercase">Modalidad</p>
                              <p className="text-sm font-bold text-gray-900 mt-1 capitalize">{training.modality === "online" ? "Online" : training.modality === "in_person" ? "Presencial" : "Híbrida"}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                              <p className="text-xs font-bold text-gray-500 uppercase">Rol Objetivo</p>
                              <p className="text-sm font-bold text-gray-900 mt-1 capitalize">{training.target_role === "both" ? "Ambos" : training.target_role === "mentee" ? "Mentee" : "Mentor"}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                              <p className="text-xs font-bold text-gray-500 uppercase">Módulos</p>
                              <p className="text-sm font-bold text-gray-900 mt-1">{training.modules?.length || 0} módulos</p>
                            </div>
                          </div>

                          {/* Fechas */}
                          <div className="flex items-center gap-6 mt-4">
                            <div className="flex items-center gap-2 text-sm">
                              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-bold text-gray-700">Inicio:</span>
                              <span className="text-gray-900">{new Date(training.start_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-bold text-gray-700">Fin:</span>
                              <span className="text-gray-900">{new Date(training.end_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                          </div>

                          {/* URL o Ubicación */}
                          {training.meeting_url && (
                            <div className="mt-4 bg-white border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-gray-500">Enlace de Reunión</p>
                                <a href={training.meeting_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:underline">
                                  {training.meeting_url}
                                </a>
                              </div>
                            </div>
                          )}
                          {training.location_address && (
                            <div className="mt-4 bg-white border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-gray-500">Ubicación</p>
                                <p className="text-sm font-bold text-gray-900">{training.location_address}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Módulos del Entrenamiento */}
                        {training.modules && training.modules.length > 0 && (
                          <div className="p-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Módulos del Programa ({training.modules.length})
                            </h4>
                            <div className="grid gap-4">
                              {training.modules.sort((a, b) => a.order - b.order).map((module, mIdx) => (
                                <div key={mIdx} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
                                  <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-lg flex-shrink-0">
                                      {module.order}
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="text-lg font-bold text-gray-900">{module.title}</h5>
                                      <p className="text-gray-600 mt-1">{module.description}</p>
                                      <div className="flex items-center gap-6 mt-3">
                                        <div className="flex items-center gap-2 text-sm">
                                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span className="text-gray-700 font-bold">{module.duration_minutes} minutos</span>
                                        </div>
                                        {module.requires_evaluation && (
                                          <div className="flex items-center gap-2 text-sm">
                                            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                            <span className="text-orange-700 font-bold">Requiere evaluación (mín. {module.minimum_score}%)</span>
                                          </div>
                                        )}
                                        {module.is_published && (
                                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Publicado
                                          </span>
                                        )}
                                      </div>
                                      {module.materials_url && (
                                        <div className="mt-3">
                                          <a href={module.materials_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 font-bold hover:underline">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Materiales del módulo
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-12">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No hay entrenamientos creados</h3>
                      <p className="text-gray-600 mb-6">Crea tu primer programa de entrenamiento con módulos estructurados</p>
                      <button 
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-all inline-flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Crear Primer Entrenamiento
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB: Actividades */}
            {activeTab === "activities" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Actividades</h2>
                  <button 
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-primary-500 text-black font-bold rounded-lg hover:bg-primary-600 transition-all"
                  >
                    + Agregar Actividad
                  </button>
                </div>
                {program.activities && program.activities.length > 0 ? (
                  <div className="space-y-3">
                    {program.activities.map((activity, idx) => (
                      <div key={idx} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 relative">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{activity.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold ${
                              activity.type === "event" 
                                ? "bg-purple-100 text-purple-700" 
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {activity.type === "event" ? "Evento" : "Entrenamiento"}
                            </span>
                          </div>
                          <div className="relative">
                            <button 
                              onClick={() => setOpenDropdownId(openDropdownId === activity.id ? null : activity.id || null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            
                            {openDropdownId === activity.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setOpenDropdownId(null)}
                                ></div>
                                <div className="absolute right-0 top-12 z-20 w-56 bg-white rounded-lg shadow-2xl border-2 border-gray-200 py-2">
                                  <button
                                    onClick={() => handleEditActivity(activity)}
                                    className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-all flex items-center gap-3 text-gray-700 font-bold"
                                  >
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateActivity(activity)}
                                    className="w-full px-4 py-2 text-left hover:bg-green-50 transition-all flex items-center gap-3 text-gray-700 font-bold"
                                  >
                                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Duplicar
                                  </button>
                                  <div className="border-t border-gray-200 my-1"></div>
                                  <button
                                    onClick={() => activity.id && handleDeleteActivity(activity.id)}
                                    className="w-full px-4 py-2 text-left hover:bg-red-50 transition-all flex items-center gap-3 text-red-600 font-bold"
                                  >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Eliminar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No hay actividades definidas</p>
                    <p className="text-sm mt-1">Agrega tu primera actividad para comenzar</p>
                  </div>
                )}
              </>
            )}

            {/* TAB: Configuración */}
            {activeTab === "config" && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración del Programa</h2>
                  <p className="text-gray-600">Revisa el estado de configuración antes de lanzar el programa</p>
                </div>

                {(() => {
                  const validation = validateProgramConfig();
                  return (
                    <>
                      {/* Estado General */}
                      <div className={`border-2 rounded-xl p-6 mb-6 ${
                        validation.isValid 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-yellow-50 border-yellow-300'
                      }`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            validation.isValid 
                              ? 'bg-green-500' 
                              : 'bg-yellow-500'
                          }`}>
                            {validation.isValid ? (
                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {validation.isValid 
                                ? '✓ Programa listo para lanzar' 
                                : '⚠️ Configuración incompleta'}
                            </h3>
                            <p className="text-gray-700">
                              {validation.isValid 
                                ? 'Todos los requisitos están completos. Puedes lanzar el programa cuando estés listo.' 
                                : 'Completa los siguientes requisitos antes de lanzar el programa:'}
                            </p>
                            {!validation.isValid && validation.issues.length > 0 && (
                              <ul className="mt-3 space-y-1">
                                {validation.issues.map((issue, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-red-500 font-bold">✗</span>
                                    <span>{issue}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Secciones de Configuración */}
                      <div className="grid grid-cols-1 gap-4">
                        
                        {/* Información General */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                validation.stats.hasGeneral 
                                  ? 'bg-green-100' 
                                  : 'bg-red-100'
                              }`}>
                                {validation.stats.hasGeneral ? (
                                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">Información General</h3>
                                <p className="text-sm text-gray-600">Datos básicos del programa</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setActiveTab("general")}
                              className="text-primary-600 hover:text-primary-700 font-bold text-sm"
                            >
                              Ver →
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Nombre:</span>
                              <p className="font-bold text-gray-900">{program?.name || "Sin definir"}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Empresa:</span>
                              <p className="font-bold text-gray-900">{program?.company?.name || "Sin asignar"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Entrenamientos y Actividades */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                validation.stats.totalActivities > 0 
                                  ? 'bg-green-100' 
                                  : 'bg-red-100'
                              }`}>
                                {validation.stats.totalActivities > 0 ? (
                                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">Actividades</h3>
                                <p className="text-sm text-gray-600">Entrenamientos y eventos del programa</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setActiveTab("activities")}
                              className="text-primary-600 hover:text-primary-700 font-bold text-sm"
                            >
                              Ver →
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <span className="text-gray-600">Entrenamientos</span>
                              <p className="text-2xl font-bold text-blue-600">{validation.stats.trainingsCount}</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                              <span className="text-gray-600">Eventos</span>
                              <p className="text-2xl font-bold text-purple-600">{validation.stats.eventsCount}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <span className="text-gray-600">Total</span>
                              <p className="text-2xl font-bold text-gray-900">{validation.stats.totalActivities}</p>
                            </div>
                          </div>
                        </div>

                        {/* Participantes */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                validation.stats.hasCompany 
                                  ? 'bg-green-100' 
                                  : 'bg-red-100'
                              }`}>
                                {validation.stats.hasCompany ? (
                                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">Participantes</h3>
                                <p className="text-sm text-gray-600">Usuarios asignados al programa</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setActiveTab("participants")}
                              className="text-primary-600 hover:text-primary-700 font-bold text-sm"
                            >
                              Ver →
                            </button>
                          </div>
                          <div className="text-sm">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <span className="text-gray-600">Total participantes</span>
                              <p className="text-2xl font-bold text-green-600">{program?.participants_count || 0}</p>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Botón de Lanzamiento */}
                      <div className="mt-6 bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-300 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">¿Todo listo?</h3>
                            <p className="text-sm text-gray-700">
                              {validation.isValid 
                                ? 'El programa está completamente configurado y listo para ser lanzado a la empresa.'
                                : 'Completa todos los requisitos antes de lanzar el programa.'}
                            </p>
                          </div>
                          <button
                            onClick={handleLaunchProgram}
                            disabled={isLaunching || !validation.isValid}
                            className={`px-8 py-3 font-bold rounded-lg transition-all flex items-center gap-2 ${
                              program?.status === 'launched'
                                ? 'bg-green-500 text-white cursor-default'
                                : validation.isValid
                                ? 'bg-primary-500 text-black hover:bg-primary-600 shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {program?.status === 'launched' ? '✓ Lanzado' : 'Lanzar Programa'}
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Estadísticas</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-gray-600">Actividades</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{program.activities_count || 0}</p>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-gray-600">Participantes</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{program.participants_count || 0}</p>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all text-left flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar Participantes
                </button>
                <button className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all text-left flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Programar Evento
                </button>
                <button className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all text-left flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generar Reporte
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Crear Actividad con Wizard */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {wizardStep === 1 ? "Nueva Actividad" : "Configurar Módulos"}
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
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Actividad *</label>
                        <input
                          type="text"
                          value={activityForm.name}
                          onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                          placeholder="Ej: Sesión de Mentoría 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Actividad *</label>
                        <select
                          value={activityForm.type}
                          onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none bg-white text-gray-900"
                        >
                          <option value="training">Entrenamiento</option>
                          <option value="event">Evento</option>
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
                        placeholder="Describe los objetivos y contenido de la actividad..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        <span className="text-sm font-bold text-gray-700">Actividad Obligatoria</span>
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

                    {/* Configuración de Asistencia (solo para entrenamientos) */}
                    {activityForm.type === "training" && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
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
                    )}
                  </div>
                )}

                {/* PASO 2: Módulos y Configuración (solo para training) */}
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
                    ✓ Crear Actividad
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Actividades del Día */}
        {showDayActivitiesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Actividades del {selectedDay} de Diciembre
                </h2>
                <button 
                  onClick={() => setShowDayActivitiesModal(false)} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {dayActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 font-bold">No hay actividades programadas para este día</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dayActivities.map((activity, idx) => (
                      <div key={idx} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{activity.name}</h3>
                            <p className="text-gray-600 text-sm mt-1">{activity.description}</p>
                          </div>
                          <span className={`ml-3 px-3 py-1 rounded-full text-xs font-bold ${
                            activity.type === "event"
                              ? "bg-purple-100 text-purple-700 border border-purple-300"
                              : "bg-blue-100 text-blue-700 border border-blue-300"
                          }`}>
                            {activity.type === "event" ? "Evento" : "Entrenamiento"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700">
                              {new Date(activity.start_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {new Date(activity.end_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="text-gray-700 capitalize">{activity.category}</span>
                          </div>
                        </div>

                        {activity.meeting_url && (
                          <div className="mt-3 flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <a href={activity.meeting_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">
                              Unirse a la reunión
                            </a>
                          </div>
                        )}

                        {activity.location_address && (
                          <div className="mt-3 flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-green-700 font-bold">{activity.location_address}</span>
                          </div>
                        )}

                        {activity.is_mandatory && (
                          <div className="mt-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded border border-red-300">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Obligatoria
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
