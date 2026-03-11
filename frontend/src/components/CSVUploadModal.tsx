"use client";

import { useState } from "react";

type CSVUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: any[]) => void;
  darkMode: boolean;
};

export default function CSVUploadModal({ isOpen, onClose, onUpload, darkMode }: CSVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      
      // Parse CSV preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        const headers = lines[0].split(",");
        const data = lines.slice(1, 4).map(line => {
          const values = line.split(",");
          return headers.reduce((obj: any, header, i) => {
            obj[header.trim()] = values[i]?.trim() || "";
            return obj;
          }, {});
        });
        setPreview(data);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        const headers = lines[0].split(",").map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(",");
          return headers.reduce((obj: any, header, i) => {
            obj[header] = values[i]?.trim() || "";
            return obj;
          }, {});
        });
        onUpload(data);
        setFile(null);
        setPreview([]);
        onClose();
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-xl border p-6 ${
        darkMode ? "border-gray-800 bg-dark-400" : "border-gray-200 bg-white"
      }`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
            Importar Participantes CSV
          </h2>
          <button
            onClick={onClose}
            className={`text-2xl ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-black"}`}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className={`rounded-lg border-2 border-dashed p-8 text-center ${
            darkMode ? "border-gray-700" : "border-gray-300"
          }`}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer"
            >
              <div className="mb-4 text-5xl">📄</div>
              <p className={`mb-2 font-semibold ${darkMode ? "text-white" : "text-black"}`}>
                {file ? file.name : "Selecciona un archivo CSV"}
              </p>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                o arrastra y suelta aquí
              </p>
            </label>
          </div>

          {preview.length > 0 && (
            <div>
              <p className={`mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Vista previa (primeras 3 filas):
              </p>
              <div className={`overflow-x-auto rounded-lg border ${
                darkMode ? "border-gray-700" : "border-gray-300"
              }`}>
                <table className="w-full text-sm">
                  <thead className={darkMode ? "bg-dark-500" : "bg-gray-50"}>
                    <tr>
                      {Object.keys(preview[0] || {}).map(key => (
                        <th key={key} className={`px-4 py-2 text-left font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className={`px-4 py-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className={`rounded-lg border p-4 ${
            darkMode ? "border-gray-700 bg-dark-500" : "border-gray-200 bg-gray-50"
          }`}>
            <p className={`mb-2 text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Formato esperado:
            </p>
            <code className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              full_name,role,headline,skills,goals,availability_hours
            </code>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 rounded-lg border px-4 py-3 font-medium transition ${
                darkMode
                  ? "border-gray-700 text-gray-300 hover:bg-dark-500"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={!file}
              className="flex-1 rounded-lg bg-primary-500 px-4 py-3 font-bold text-black transition hover:bg-primary-400 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Importar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
