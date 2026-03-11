"use client";

import React, { useState } from "react";
import { backendUrl } from "@/lib/api";

interface MigrationRecord {
  row: number;
  full_name: string;
  email?: string;
  role: "mentor" | "mentee";
  headline?: string;
  skills?: string[];
  goals?: string[];
  availability_hours?: number;
  timezone?: string;
  status: "pending" | "valid" | "error";
  errors?: string[];
}

interface DataMigrationProps {
  darkMode?: boolean;
}

export default function DataMigration({ darkMode = false }: DataMigrationProps) {
  const [records, setRecords] = useState<MigrationRecord[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "complete">("upload");
  const [stats, setStats] = useState({ valid: 0, errors: 0, total: 0 });

  React.useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${backendUrl}/api/programs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.filter((p: any) => p.status === "active"));
      }
    } catch (error) {
      console.error("Error loading programs:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());
    
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const parsed: MigrationRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const record: any = { row: i + 1, status: "pending", errors: [] };
      
      headers.forEach((header, idx) => {
        const value = values[idx]?.trim();
        
        if (header === "full_name" || header === "name" || header === "nombre") {
          record.full_name = value;
        } else if (header === "email" || header === "correo") {
          record.email = value;
        } else if (header === "role" || header === "rol") {
          record.role = value?.toLowerCase() === "mentor" ? "mentor" : "mentee";
        } else if (header === "headline" || header === "titulo" || header === "title") {
          record.headline = value;
        } else if (header === "skills" || header === "habilidades") {
          record.skills = value ? value.split(";").map((s: string) => s.trim()) : [];
        } else if (header === "goals" || header === "objetivos") {
          record.goals = value ? value.split(";").map((g: string) => g.trim()) : [];
        } else if (header === "availability_hours" || header === "disponibilidad") {
          record.availability_hours = parseInt(value) || 2;
        } else if (header === "timezone" || header === "zona_horaria") {
          record.timezone = value || "UTC";
        }
      });
      
      if (!record.full_name) {
        record.errors.push("Nombre completo requerido");
      }
      if (!record.role || !["mentor", "mentee"].includes(record.role)) {
        record.errors.push("Rol debe ser 'mentor' o 'mentee'");
      }
      if (record.email && !record.email.includes("@")) {
        record.errors.push("Email inválido");
      }
      
      record.status = record.errors.length > 0 ? "error" : "valid";
      parsed.push(record);
    }
    
    setRecords(parsed);
    const validCount = parsed.filter(r => r.status === "valid").length;
    const errorCount = parsed.filter(r => r.status === "error").length;
    setStats({ valid: validCount, errors: errorCount, total: parsed.length });
    setStep("preview");
    setLoading(false);
  };

  const executeImport = async () => {
    if (!selectedProgram) {
      alert("Por favor selecciona un programa");
      return;
    }

    setImporting(true);
    const validRecords = records.filter(r => r.status === "valid");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${backendUrl}/api/participants/bulk-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          program_id: selectedProgram,
          participants: validRecords.map(r => ({
            full_name: r.full_name,
            email: r.email,
            role: r.role,
            headline: r.headline || "",
            skills: r.skills || [],
            goals: r.goals || [],
            availability_hours: r.availability_hours || 2,
            timezone: r.timezone || "UTC",
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setStep("complete");
        console.log("Import result:", result);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || "Error al importar"}`);
      }
    } catch (error) {
      console.error("Error importing:", error);
      alert("Error al conectar con el servidor");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "full_name,email,role,headline,skills,goals,availability_hours,timezone\n" +
      "John Doe,john@example.com,mentor,Senior Developer,Python;Django;React,,,3,UTC\n" +
      "Jane Smith,jane@example.com,mentee,Junior Developer,,Learn Python;Build APIs,5,America/New_York";
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_migration.csv";
    a.click();
  };

  const headerBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const iconBg = darkMode ? "bg-blue-500/10" : "bg-blue-50";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-400" : "text-gray-600";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-xl border p-6 ${headerBg} shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${iconBg}`}>
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textPrimary}`}>
                Migración de Datos
              </h1>
              <p className={`text-sm ${textSecondary}`}>
                Importación masiva de participantes desde CSV/Excel
              </p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar Plantilla
          </button>
        </div>
      </div>

      {/* Steps Progress */}
      <div className={`rounded-xl border p-4 ${headerBg} shadow-sm`}>
        <div className="flex items-center justify-center gap-2">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            step === "upload" ? "bg-blue-500 text-white" : darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"
          }`}>
            <span className="font-bold">1</span>
            <span className="text-sm">Cargar</span>
          </div>
          <svg className={`w-4 h-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            step === "preview" ? "bg-purple-500 text-white" : darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"
          }`}>
            <span className="font-bold">2</span>
            <span className="text-sm">Previsualizar</span>
          </div>
          <svg className={`w-4 h-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            step === "complete" ? "bg-green-500 text-white" : darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-600"
          }`}>
            <span className="font-bold">3</span>
            <span className="text-sm">Completado</span>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className={`rounded-xl border p-6 ${headerBg} shadow-sm`}>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Selecciona el Programa
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode 
                  ? "bg-gray-700 border-gray-600 text-white" 
                  : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
            >
              <option value="">-- Selecciona un programa --</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className={`rounded-xl border-2 border-dashed p-12 text-center ${
            !selectedProgram ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={!selectedProgram || loading}
            />
            <label htmlFor="file-upload" className={!selectedProgram ? "pointer-events-none" : "cursor-pointer"}>
              {loading ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className={`text-lg font-medium ${textPrimary}`}>
                    Procesando archivo...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <svg className={`w-16 h-16 mx-auto ${darkMode ? "text-gray-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <p className={`text-lg font-medium ${textPrimary}`}>
                      Arrastra tu archivo aquí o haz clic para seleccionar
                    </p>
                    <p className={`text-sm mt-1 ${textSecondary}`}>
                      CSV, XLSX o XLS (máx. 5MB)
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>

          <div className={`rounded-xl border p-6 ${
            darkMode ? "border-blue-500/20 bg-blue-500/5" : "border-blue-200 bg-blue-50"
          }`}>
            <h3 className={`font-bold mb-3 ${darkMode ? "text-blue-400" : "text-blue-700"}`}>
              Formato Requerido
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className={`font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Campos Obligatorios:
                </p>
                <ul className={`space-y-1 ${textSecondary}`}>
                  <li>• full_name - Nombre completo</li>
                  <li>• role - mentor o mentee</li>
                </ul>
              </div>
              <div>
                <p className={`font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Campos Opcionales:
                </p>
                <ul className={`space-y-1 ${textSecondary}`}>
                  <li>• email, headline, skills</li>
                  <li>• goals, availability_hours, timezone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {step === "preview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className={`rounded-xl border p-6 ${headerBg} shadow-sm`}>
              <p className={`text-sm font-medium mb-1 ${textSecondary}`}>
                Total Registros
              </p>
              <p className="text-3xl font-bold text-blue-500">{stats.total}</p>
            </div>
            <div className={`rounded-xl border p-6 ${headerBg} shadow-sm`}>
              <p className={`text-sm font-medium mb-1 ${textSecondary}`}>
                Válidos
              </p>
              <p className="text-3xl font-bold text-green-500">{stats.valid}</p>
            </div>
            <div className={`rounded-xl border p-6 ${headerBg} shadow-sm`}>
              <p className={`text-sm font-medium mb-1 ${textSecondary}`}>
                Con Errores
              </p>
              <p className="text-3xl font-bold text-red-500">{stats.errors}</p>
            </div>
          </div>

          <div className={`rounded-xl border ${headerBg} shadow-sm overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Fila</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Nombre</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Email</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Rol</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Estado</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Errores</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {records.map((record) => (
                    <tr key={record.row} className={record.status === "error" ? (darkMode ? "bg-red-900/20" : "bg-red-50") : ""}>
                      <td className={`px-4 py-3 text-sm ${textSecondary}`}>{record.row}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${textPrimary}`}>{record.full_name}</td>
                      <td className={`px-4 py-3 text-sm ${textSecondary}`}>{record.email || "-"}</td>
                      <td className={`px-4 py-3 text-sm`}>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.role === "mentor" 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-green-100 text-green-700"
                        }`}>
                          {record.role}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm`}>
                        {record.status === "valid" ? "✅" : "❌"}
                      </td>
                      <td className={`px-4 py-3 text-sm text-red-600`}>
                        {record.errors?.join(", ") || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setStep("upload");
                setRecords([]);
              }}
              className={`flex-1 py-3 rounded-lg font-semibold ${
                darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              ← Volver
            </button>
            <button
              onClick={executeImport}
              disabled={importing || stats.valid === 0}
              className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? "Importando..." : `Importar ${stats.valid} Registros →`}
            </button>
          </div>
        </div>
      )}

      {/* Complete Section */}
      {step === "complete" && (
        <div className={`rounded-xl border p-12 text-center ${headerBg} shadow-sm`}>
          <div className="text-6xl mb-4">✅</div>
          <h2 className={`text-2xl font-bold mb-2 ${textPrimary}`}>
            ¡Importación Completada!
          </h2>
          <p className={`text-lg mb-8 ${textSecondary}`}>
            Se importaron exitosamente <strong>{stats.valid}</strong> participantes
          </p>
          <button
            onClick={() => {
              setStep("upload");
              setRecords([]);
              setStats({ valid: 0, errors: 0, total: 0 });
            }}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
          >
            Nueva Importación
          </button>
        </div>
      )}
    </div>
  );
}
