"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IndividualLoadView } from "@/components/participants/IndividualLoadView";
import { MasiveLoadView } from "@/components/participants/MasiveLoadView";
import { TableView } from "@/components/participants/TableView";

// ================================================================================
// INTERFACES Y TIPOS
// ================================================================================

interface User {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  created_at?: string;
  programas_activos?: number;
  role?: string;  // Para compatibilidad con componentes
  company?: string;  // Para compatibilidad con componentes
}

interface Participant {
  id: string;
  user: User;
  role: string;
  status: "active" | "pending" | "suspended" | "inactive";
  invitation_sent_at?: string;
  activated_at?: string;
  last_access_at?: string;
  created_at?: string;  // Para TableView
  updated_at?: string;  // Para TableView
  vinculacion?: {
    type: string;
    match_user: User;
    status: string;
  };
}

interface Program {
  id: number;
  name: string;
  company?: {
    id: string;
    name: string;
  };
}

interface ValidationRow {
  row_number: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  vinculation_email?: string;
  errors: string[];
  warnings: string[];
  user_exists: boolean;
  user_id?: string;
}

interface ValidationResult {
  total_rows: number;
  valid_rows: number;
  rows_with_errors: number;
  rows_with_warnings: number;
  details: ValidationRow[];
}

type ViewMode = "dashboard" | "individual" | "masive" | "table";
type IndividualStep = "search" | "found" | "create" | "role" | "vinculation" | "confirm";
type MasiveStep = "download" | "upload" | "validate" | "resolve" | "config" | "confirm";

// ================================================================================
// COMPONENTE PRINCIPAL
// ================================================================================

export default function ParticipantsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  // Estados principales
  const [program, setProgram] = useState<Program | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");

  // Estados para carga individual
  const [individualStep, setIndividualStep] = useState<IndividualStep>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserForm, setNewUserForm] = useState({
    nombre: "",
    apellidos: "",
    email: ""
  });
  const [selectedRole, setSelectedRole] = useState("participant");
  const [requiresVinculation, setRequiresVinculation] = useState(false);
  const [vinculationType, setVinculationType] = useState("mentoria");
  const [vinculationMatch, setVinculationMatch] = useState<User | null>(null);

  // Estados para carga masiva
  const [masiveStep, setMasiveStep] = useState<MasiveStep>("download");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [processingUpload, setProcessingUpload] = useState(false);

  useEffect(() => {
    loadProgram();
    loadParticipants();
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
    }
  };

  const loadParticipants = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(`${apiUrl}/api/programs/${programId}/participants`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch (error) {
      console.error("Error loading participants:", error);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================================
  // FUNCIONES DE BÚSQUEDA
  // ================================================================================

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(
        `${apiUrl}/api/programs/users/search?q=${encodeURIComponent(query)}&exclude_program_id=${programId}`
      );
      if (response.ok) {
        const data = await response.json();
        // Mapear los datos al formato de la interfaz User local
        setSearchResults(data.map((user: any) => ({
          id: user.id,
          nombre: user.first_name,
          apellidos: user.last_name,
          email: user.email,
        })));
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setIndividualStep("found");
  };

  const handleAssociateUser = () => {
    setIndividualStep("role");
  };

  const handleCreateNewUser = () => {
    setSelectedUser(null);
    setIndividualStep("create");
  };

  // ================================================================================
  // FUNCIONES DE CREACIÓN
  // ================================================================================

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const isFormValid = (): boolean => {
    return (
      newUserForm.nombre.length >= 2 &&
      newUserForm.apellidos.length >= 2 &&
      validateEmail(newUserForm.email)
    );
  };

  const handleContinueToRole = () => {
    if (isFormValid()) {
      setIndividualStep("role");
    }
  };

  // ================================================================================
  // FUNCIONES DE ROL Y VINCULACIÓN
  // ================================================================================

  const handleContinueToVinculation = () => {
    setIndividualStep("vinculation");
  };

  const handleContinueToConfirm = () => {
    setIndividualStep("confirm");
  };

  const handleConfirmCreate = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      
      // Si es usuario nuevo, crearlo primero
      let userId = selectedUser?.id;
      if (!selectedUser) {
        const createResponse = await fetch(`${apiUrl}/api/programs/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: newUserForm.email,
            first_name: newUserForm.nombre,
            last_name: newUserForm.apellidos
          })
        });
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          alert(`❌ Error al crear usuario: ${errorData.detail || "Error desconocido"}`);
          return;
        }
        
        const newUser = await createResponse.json();
        userId = newUser.id;
      }

      // Asociar al programa
      const associateResponse = await fetch(`${apiUrl}/api/programs/${programId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          role: selectedRole,
          status: "pending",
          send_invitation: true,
          vinculation_mentor_id: requiresVinculation ? vinculationMatch?.id : null
        })
      });

      if (associateResponse.ok) {
        alert("✅ Participante agregado exitosamente");
        resetIndividualForm();
        setViewMode("dashboard");
        loadParticipants();
      } else {
        const errorData = await associateResponse.json();
        alert(`❌ Error al agregar participante: ${errorData.detail || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error creating participant:", error);
      alert("❌ Error de conexión");
    }
  };

  const resetIndividualForm = () => {
    setIndividualStep("search");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setNewUserForm({ nombre: "", apellidos: "", email: "" });
    setSelectedRole("participant");
    setRequiresVinculation(false);
    setVinculationType("mentoria");
    setVinculationMatch(null);
  };

  // ================================================================================
  // FUNCIONES DE CARGA MASIVA
  // ================================================================================

  const handleDownloadTemplate = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const response = await fetch(`${apiUrl}/api/programs/${programId}/participants/template`);
      
      if (!response.ok) {
        alert("❌ Error al descargar plantilla");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla_participantes.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("❌ Error de conexión");
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setProcessingUpload(true);
    setMasiveStep("validate");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${apiUrl}/api/programs/${programId}/participants/validate-batch`, {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResult(result);
      } else {
        alert("❌ Error al validar archivo");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("❌ Error de conexión");
    } finally {
      setProcessingUpload(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push(`/dashboard/programs/${programId}/manage`)}
            className="text-primary-600 hover:text-primary-700 font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Programa
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Participantes</h1>
        <p className="text-gray-600 mt-1">Programa: {program?.name}</p>
      </div>

      {/* DASHBOARD VIEW */}
      {viewMode === "dashboard" && (
        <DashboardView
          participants={participants}
          onAddIndividual={() => {
            // Ir directo al paso de crear nuevo usuario
            setIndividualStep("create");
            setViewMode("individual");
          }}
          onAddMasive={() => setViewMode("masive")}
          onViewTable={() => setViewMode("table")}
          onSearch={handleSearch}
          searchQuery={searchQuery}
          searchResults={searchResults}
        />
      )}

      {/* INDIVIDUAL LOAD VIEW */}
      {viewMode === "individual" && (
        <IndividualLoadView
          step={individualStep}
          searchQuery={searchQuery}
          searchResults={searchResults.map(u => ({
            id: u.id,
            email: u.email,
            first_name: u.nombre,
            last_name: u.apellidos,
            role: u.role || 'participant',
            company: u.company,
            is_onboarded: true
          }))}
          selectedUser={selectedUser ? {
            id: selectedUser.id,
            email: selectedUser.email,
            first_name: selectedUser.nombre,
            last_name: selectedUser.apellidos,
            role: selectedUser.role || 'participant',
            company: selectedUser.company,
            is_onboarded: true
          } : null}
          newUserForm={newUserForm}
          selectedRole={selectedRole}
          requiresVinculation={requiresVinculation}
          vinculationType={vinculationType}
          vinculationMatch={vinculationMatch ? {
            id: vinculationMatch.id,
            email: vinculationMatch.email,
            first_name: vinculationMatch.nombre,
            last_name: vinculationMatch.apellidos,
            role: vinculationMatch.role || 'participant',
            company: vinculationMatch.company,
            is_onboarded: true
          } : null}
          programId={programId}
          onSearch={handleSearch}
          onSelectUser={(user: { id: string; email: string; first_name: string; last_name: string; role: string; company?: string; is_onboarded: boolean }) => {
            setSelectedUser({
              id: user.id,
              nombre: user.first_name,
              apellidos: user.last_name,
              email: user.email,
              role: user.role,
              company: user.company
            });
            setIndividualStep("found");
          }}
          onAssociateUser={() => setIndividualStep("role")}
          onCreateNew={() => {
            setSelectedUser(null);
            setIndividualStep("create");
          }}
          onUpdateForm={setNewUserForm}
          onContinueToRole={() => setIndividualStep("role")}
          onSelectRole={setSelectedRole}
          onToggleVinculation={setRequiresVinculation}
          onSelectVinculationType={setVinculationType}
          onSelectMatch={(user: { id: string; email: string; first_name: string; last_name: string; role: string; company?: string; is_onboarded: boolean } | null) => {
            if (user) {
              setVinculationMatch({
                id: user.id,
                nombre: user.first_name,
                apellidos: user.last_name,
                email: user.email,
                role: user.role,
                company: user.company
              });
            } else {
              setVinculationMatch(null);
            }
          }}
          onContinueToVinculation={() => setIndividualStep("vinculation")}
          onContinueToConfirm={() => setIndividualStep("confirm")}
          onConfirm={handleConfirmCreate}
          onBack={() => {
            if (individualStep === "search") {
              setViewMode("dashboard");
            } else {
              const stepOrder = ["search", "found", "create", "role", "vinculation", "confirm"];
              const currentIndex = stepOrder.indexOf(individualStep);
              if (currentIndex > 0) {
                setIndividualStep(stepOrder[currentIndex - 1] as any);
              }
            }
          }}
          onCancel={() => {
            resetIndividualForm();
            setViewMode("dashboard");
          }}
        />
      )}

      {/* MASIVE LOAD VIEW */}
      {viewMode === "masive" && (
        <MasiveLoadView
          step={masiveStep}
          programId={programId}
          uploadedFile={uploadedFile}
          validationResult={validationResult}
          processingUpload={processingUpload}
          onDownloadTemplate={handleDownloadTemplate}
          onContinue={() => setMasiveStep("upload")}
          onFileUpload={(file: File) => {
            setUploadedFile(file);
            handleFileUpload(file);
          }}
          onResolveErrors={(updates: any[]) => {
            if (!validationResult) return;
            
            // Aplicar cambios y re-validar localmente
            const updatedDetails = validationResult.details.map(row => {
              const update = updates.find(u => u.row_number === row.row_number);
              if (!update) return row;

              // Re-validar la fila actualizada
              const errors: string[] = [];
              const warnings: string[] = [];

              // Validar email
              if (!update.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update.email)) {
                errors.push('Email inválido');
              }

              // Validar nombre
              if (!update.first_name || update.first_name.trim().length < 2) {
                errors.push('Nombre debe tener al menos 2 caracteres');
              }

              // Validar apellido
              if (!update.last_name || update.last_name.trim().length < 2) {
                errors.push('Apellido debe tener al menos 2 caracteres');
              }

              // Validar rol
              const validRoles = ['participant', 'instructor', 'administrator', 'observer'];
              if (!validRoles.includes(update.role)) {
                errors.push('Rol inválido');
              }

              // Validar vinculación (no puede ser el mismo email)
              if (update.vinculation_email) {
                if (update.vinculation_email === update.email) {
                  errors.push('No puede vincularse consigo mismo');
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update.vinculation_email)) {
                  errors.push('Email de vinculación inválido');
                }
              }

              return {
                ...update,
                errors,
                warnings,
                user_exists: row.user_exists
              };
            });

            // Recalcular estadísticas
            const validRows = updatedDetails.filter(r => r.errors.length === 0).length;
            const rowsWithErrors = updatedDetails.filter(r => r.errors.length > 0).length;
            const rowsWithWarnings = updatedDetails.filter(r => r.warnings.length > 0).length;

            setValidationResult({
              total_rows: updatedDetails.length,
              valid_rows: validRows,
              rows_with_errors: rowsWithErrors,
              rows_with_warnings: rowsWithWarnings,
              details: updatedDetails
            });

            alert('✅ Cambios guardados y validados');
          }}
          onConfirmImport={async () => {
            if (!validationResult) return;
            
            try {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
              const validRows = validationResult.details
                .filter((row: ValidationRow) => row.errors.length === 0)
                .map((row: ValidationRow) => ({
                  email: row.email,
                  first_name: row.first_name,
                  last_name: row.last_name,
                  role: row.role
                }));

              const response = await fetch(`${apiUrl}/api/programs/${programId}/participants/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  rows: validRows,
                  send_invitations: true
                })
              });

              if (response.ok) {
                const result = await response.json();
                alert(`✅ ${result.created_count} participantes importados exitosamente`);
                setMasiveStep("download");
                setUploadedFile(null);
                setValidationResult(null);
                setViewMode("dashboard");
                loadParticipants();
              } else {
                alert('❌ Error al importar participantes');
              }
            } catch (error) {
              console.error('Error importing:', error);
              alert('❌ Error de conexión');
            }
          }}
          onBack={() => {
            if (masiveStep === "download") {
              setViewMode("dashboard");
            } else {
              setMasiveStep("download");
              setUploadedFile(null);
              setValidationResult(null);
            }
          }}
          onCancel={() => {
            setMasiveStep("download");
            setUploadedFile(null);
            setValidationResult(null);
            setViewMode("dashboard");
          }}
        />
      )}

      {/* TABLE VIEW */}
      {viewMode === "table" && (
        <TableView
          participants={participants.map(p => ({
            ...p,
            user: {
              id: p.user.id,
              email: p.user.email,
              first_name: p.user.nombre,
              last_name: p.user.apellidos,
              role: p.user.role || 'participant',
              company: '',
              is_onboarded: true
            },
            program_id: programId,
            configuration: {},
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString()
          }))}
          programId={programId}
          onEdit={async (participantId: string) => {
            // TODO: Implementar modal de edición
            alert(`Editar participante ${participantId}`);
          }}
          onDelete={async (participantId: string) => {
            if (!confirm('¿Seguro que deseas eliminar este participante?')) return;
            
            try {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
              const response = await fetch(
                `${apiUrl}/api/programs/${programId}/participants/${participantId}`,
                { method: 'DELETE' }
              );

              if (response.ok) {
                alert('✅ Participante eliminado');
                loadParticipants();
              } else {
                alert('❌ Error al eliminar');
              }
            } catch (error) {
              console.error('Error deleting:', error);
              alert('❌ Error de conexión');
            }
          }}
          onBack={() => setViewMode("dashboard")}
        />
      )}
    </div>
  );
}

// ================================================================================
// SUB-COMPONENTES
// ================================================================================

function DashboardView({ 
  participants, 
  onAddIndividual, 
  onAddMasive, 
  onViewTable,
  onSearch,
  searchQuery,
  searchResults
}: {
  participants: Participant[];
  onAddIndividual: () => void;
  onAddMasive: () => void;
  onViewTable: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  searchResults: User[];
}) {
  const activeCount = participants.filter(p => p.status === "active").length;
  const pendingCount = participants.filter(p => p.status === "pending").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Resumen General */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Resumen General</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-bold">Total</p>
            <p className="text-3xl font-bold text-blue-600">{participants.length}</p>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-bold">Activos</p>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-bold">Pendientes</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-bold">Nuevos (7d)</p>
            <p className="text-3xl font-bold text-purple-600">0</p>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Acciones Rápidas</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onAddIndividual}
            className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6 text-left hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">👤 Agregar Usuario Individual</h3>
                <p className="text-sm text-gray-600">Para 1-5 usuarios con configuración detallada</p>
                <div className="mt-3 text-primary-600 font-bold flex items-center gap-2">
                  + Nuevo Usuario
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={onAddMasive}
            className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6 text-left hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">📤 Carga Masiva</h3>
                <p className="text-sm text-gray-600">Para 6+ usuarios mediante Excel</p>
                <div className="mt-3 text-primary-600 font-bold flex items-center gap-2">
                  ⬆ Subir Excel
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Vista Previa de Participantes */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">📋 Participantes del Programa</h2>
          <div className="text-sm text-gray-600">
            Total: <span className="font-bold text-gray-900">{participants.length}</span>
          </div>
        </div>

        {/* Buscador de Participantes */}
        <div className="mb-6 relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="🔍 Buscar participante por nombre o email..."
              className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Lista de todos los participantes */}
        {participants.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-600 font-bold mb-2">No hay participantes aún</p>
            <p className="text-sm text-gray-500">Agrega tu primer participante para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {(() => {
              const filteredParticipants = participants.filter(participant => {
                // Si no hay búsqueda, mostrar todos
                if (!searchQuery || searchQuery.length < 2) return true;
                
                // Filtrar por nombre, apellidos o email
                const nombre = participant.user?.nombre?.toLowerCase() || '';
                const apellidos = participant.user?.apellidos?.toLowerCase() || '';
                const email = participant.user?.email?.toLowerCase() || '';
                const query = searchQuery.toLowerCase();
                
                return nombre.includes(query) || 
                       apellidos.includes(query) || 
                       email.includes(query);
              });

              // Si no hay resultados después del filtro
              if (filteredParticipants.length === 0) {
                return (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-600 font-bold">No se encontraron participantes</p>
                    <p className="text-sm text-gray-500 mt-1">con "{searchQuery}"</p>
                  </div>
                );
              }

              return filteredParticipants.map((participant, idx) => {
              const nombre = participant.user?.nombre || '';
              const apellidos = participant.user?.apellidos || '';
              const email = participant.user?.email || '';
              const initials = (nombre[0] || '') + (apellidos[0] || '');
              
              return (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-bold">
                        {initials || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{nombre} {apellidos}</p>
                      <p className="text-sm text-gray-600">{email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {participant.role}
                    </span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      participant.status === "active" 
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {participant.status === "active" ? "🟢 Activo" : "🟡 Pendiente"}
                    </span>
                  </div>
                </div>
              );
            });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
