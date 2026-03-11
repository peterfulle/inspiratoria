"use client";

import React, { useState } from "react";

// ================================================================================
// TIPOS
// ================================================================================

export type MasiveStep = "download" | "upload" | "validate" | "resolve" | "config" | "confirm";

export interface ValidationRow {
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

export interface ValidationResult {
  total_rows: number;
  valid_rows: number;
  rows_with_errors: number;
  rows_with_warnings: number;
  details: ValidationRow[];
}

export interface MasiveLoadViewProps {
  step: MasiveStep;
  programId: string;
  uploadedFile: File | null;
  validationResult: ValidationResult | null;
  processingUpload: boolean;
  onDownloadTemplate: () => void;
  onFileUpload: (file: File) => void;
  onResolveErrors: (updates: any[]) => void;
  onConfirmImport: () => void;
  onContinue?: () => void;  // Para avanzar al siguiente paso
  onBack: () => void;
  onCancel: () => void;
}

// ================================================================================
// COMPONENTE PRINCIPAL
// ================================================================================

export function MasiveLoadView(props: MasiveLoadViewProps) {
  const {
    step,
    programId,
    uploadedFile,
    validationResult,
    processingUpload,
    onDownloadTemplate,
    onFileUpload,
    onResolveErrors,
    onConfirmImport,
    onContinue,
    onBack,
    onCancel,
  } = props;

  const [editingRows, setEditingRows] = useState<Map<number, ValidationRow>>(new Map());

  // ================================================================================
  // PASO 1: DESCARGAR PLANTILLA
  // ================================================================================

  if (step === "download") {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📥 Paso 1: Descargar Plantilla</h2>
          <p className="text-gray-600">
            Descarga la plantilla Excel, complétala con los datos de los participantes y súbela en el siguiente paso
          </p>
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Instrucciones</h3>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>Descarga la plantilla Excel haciendo clic en el botón de abajo</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>
                Completa los siguientes campos en cada fila:
                <ul className="mt-2 ml-6 space-y-1 text-sm">
                  <li>• <strong>email</strong>: Email corporativo del participante</li>
                  <li>• <strong>first_name</strong>: Nombre del participante</li>
                  <li>• <strong>last_name</strong>: Apellido(s) del participante</li>
                  <li>• <strong>role</strong>: Rol en el programa (participant, instructor, administrator, observer)</li>
                  <li>• <strong>vinculation_email</strong> (opcional): Email del mentor/tutor</li>
                </ul>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>Guarda el archivo y súbelo en el siguiente paso</span>
            </li>
          </ol>
        </div>

        {/* Botón de descarga */}
        <div className="text-center p-8 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl mb-6">
          <svg
            className="w-20 h-20 mx-auto text-green-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Plantilla Excel</h3>
          <p className="text-gray-600 mb-6">Archivo listo para completar con los datos de participantes</p>
          <button
            onClick={onDownloadTemplate}
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg inline-flex items-center gap-3 shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Descargar Plantilla
          </button>
        </div>

        {/* Información adicional */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <p className="text-sm text-yellow-800">
            <strong>💡 Tip:</strong> No modifiques los nombres de las columnas ni el formato del archivo. El sistema
            validará automáticamente los datos cuando lo subas.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t-2 border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={onContinue}
              className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold flex items-center gap-2 shadow-lg"
            >
              Siguiente: Subir Archivo
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================================================================================
  // PASO 2: SUBIR ARCHIVO
  // ================================================================================

  if (step === "upload") {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileUpload(file);
      }
    };

    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">📤 Paso 2: Subir Archivo</h2>
          <p className="text-gray-600">Selecciona el archivo Excel completado para validar los datos</p>
        </div>

        {/* Zona de carga */}
        <div className="border-4 border-dashed border-gray-300 rounded-xl p-12 text-center mb-6 hover:border-primary-400 transition-all">
          {!uploadedFile ? (
            <>
              <svg
                className="w-20 h-20 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Arrastra tu archivo aquí</h3>
              <p className="text-gray-600 mb-4">o haz clic para seleccionarlo</p>
              <label className="cursor-pointer">
                <span className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Seleccionar Archivo
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-4">Formatos aceptados: .xlsx, .xls</p>
            </>
          ) : (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 inline-block">
              <svg
                className="w-16 h-16 mx-auto text-green-600 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{uploadedFile.name}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {(uploadedFile.size / 1024).toFixed(2)} KB
              </p>
              <label className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-700 font-bold text-sm">
                  Cambiar archivo
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Procesando */}
        {processingUpload && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <div>
                <p className="font-bold text-gray-900">Validando archivo...</p>
                <p className="text-sm text-gray-600">Por favor espera mientras procesamos los datos</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
          <button
            onClick={onBack}
            disabled={processingUpload}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>
          <button
            onClick={onCancel}
            disabled={processingUpload}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ================================================================================
  // PASO 3: RESULTADOS DE VALIDACIÓN
  // ================================================================================

  if (step === "validate" && validationResult) {
    const hasErrors = validationResult.rows_with_errors > 0;
    const hasWarnings = validationResult.rows_with_warnings > 0;

    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">✅ Paso 3: Resultados de Validación</h2>
          <p className="text-gray-600">Revisa los resultados de la validación del archivo</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-bold mb-1">Total Filas</p>
            <p className="text-3xl font-bold text-blue-600">{validationResult.total_rows}</p>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-bold mb-1">Válidas</p>
            <p className="text-3xl font-bold text-green-600">{validationResult.valid_rows}</p>
          </div>
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-bold mb-1">Con Errores</p>
            <p className="text-3xl font-bold text-red-600">{validationResult.rows_with_errors}</p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-bold mb-1">Advertencias</p>
            <p className="text-3xl font-bold text-yellow-600">{validationResult.rows_with_warnings}</p>
          </div>
        </div>

        {/* Mensaje según estado */}
        {hasErrors ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>❌ Hay errores que deben corregirse</strong> antes de continuar. Revisa las filas marcadas
              en rojo y corrige los datos en el archivo Excel o editando las filas aquí.
            </p>
          </div>
        ) : hasWarnings ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Hay advertencias</strong> que deberías revisar. Puedes continuar pero te recomendamos
              verificar las filas marcadas en amarillo.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>✅ ¡Perfecto!</strong> Todos los datos están correctos y listos para importar.
            </p>
          </div>
        )}

        {/* Tabla de detalles con editor inline */}
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden mb-6">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Fila</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase w-64">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase w-48">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase w-48">Apellido</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase w-40">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase w-64">Vinculación</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase w-24">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {validationResult.details.map((row) => {
                  const isEditing = editingRows.has(row.row_number);
                  const editedRow = isEditing ? editingRows.get(row.row_number)! : row;

                  return (
                    <tr
                      key={row.row_number}
                      className={`${
                        row.errors.length > 0
                          ? "bg-red-50"
                          : row.warnings.length > 0
                          ? "bg-yellow-50"
                          : "bg-white"
                      } hover:bg-gray-50 transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.row_number}</td>
                      
                      {/* Email - Editable */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="email"
                            value={editedRow.email}
                            onChange={(e) => {
                              const updated = { ...editedRow, email: e.target.value };
                              setEditingRows(new Map(editingRows.set(row.row_number, updated)));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="ejemplo@email.com"
                          />
                        ) : (
                          <span className="text-sm text-gray-700">{row.email}</span>
                        )}
                      </td>

                      {/* Nombre - Editable */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedRow.first_name}
                            onChange={(e) => {
                              const updated = { ...editedRow, first_name: e.target.value };
                              setEditingRows(new Map(editingRows.set(row.row_number, updated)));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Nombre"
                          />
                        ) : (
                          <span className="text-sm text-gray-700">{row.first_name}</span>
                        )}
                      </td>

                      {/* Apellido - Editable */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedRow.last_name}
                            onChange={(e) => {
                              const updated = { ...editedRow, last_name: e.target.value };
                              setEditingRows(new Map(editingRows.set(row.row_number, updated)));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Apellido"
                          />
                        ) : (
                          <span className="text-sm text-gray-700">{row.last_name}</span>
                        )}
                      </td>

                      {/* Rol - Select */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editedRow.role}
                            onChange={(e) => {
                              const updated = { ...editedRow, role: e.target.value };
                              setEditingRows(new Map(editingRows.set(row.row_number, updated)));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="participant">Participant</option>
                            <option value="instructor">Instructor</option>
                            <option value="administrator">Administrator</option>
                            <option value="observer">Observer</option>
                          </select>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                            {row.role}
                          </span>
                        )}
                      </td>

                      {/* Vinculación - Editable */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="email"
                            value={editedRow.vinculation_email || ''}
                            onChange={(e) => {
                              const updated = { ...editedRow, vinculation_email: e.target.value };
                              setEditingRows(new Map(editingRows.set(row.row_number, updated)));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="mentor@email.com (opcional)"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">
                            {row.vinculation_email || '-'}
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3 text-sm">
                        {row.errors.length > 0 ? (
                          <div className="text-red-600">
                            {row.errors.map((err, idx) => (
                              <div key={idx} className="text-xs mb-1">❌ {err}</div>
                            ))}
                          </div>
                        ) : row.warnings.length > 0 ? (
                          <div className="text-yellow-600">
                            {row.warnings.map((warn, idx) => (
                              <div key={idx} className="text-xs mb-1">⚠️ {warn}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-600 font-bold text-xs">✓ OK</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                // Guardar cambios
                                const updates = Array.from(editingRows.values());
                                onResolveErrors(updates);
                                setEditingRows(new Map());
                              }}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-bold"
                              title="Guardar"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                const newMap = new Map(editingRows);
                                newMap.delete(row.row_number);
                                setEditingRows(newMap);
                              }}
                              className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 font-bold"
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingRows(new Map(editingRows.set(row.row_number, { ...row })));
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-bold"
                            title="Editar"
                          >
                            ✎
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Subir Otro Archivo
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
            >
              Cancelar
            </button>
            {!hasErrors && (
              <button
                onClick={onConfirmImport}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Confirmar e Importar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
