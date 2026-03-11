"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportButtonProps {
  data: any[];
  filename: string;
  type: "matches" | "participants" | "programs";
  darkMode?: boolean;
}

export default function ExportButton({ data, filename, type, darkMode = false }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("Inspiratoria - Reporte", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 27);
    
    // Prepare table data based on type
    let columns: string[] = [];
    let rows: any[][] = [];
    
    if (type === "matches") {
      columns = ["Mentor", "Mentee", "Programa", "Estado", "Score", "Rating"];
      rows = data.map(match => [
        match.mentor?.full_name || "N/A",
        match.mentee?.full_name || "N/A",
        match.program?.name || "N/A",
        match.status,
        match.match_score ? `${match.match_score}%` : "N/A",
        "★".repeat(match.rating || 0)
      ]);
    } else if (type === "participants") {
      columns = ["Nombre", "Rol", "Headline", "Skills", "Disponibilidad"];
      rows = data.map(p => [
        p.full_name,
        p.role === "mentor" ? "Mentor" : "Mentee",
        p.headline || "N/A",
        p.skills?.join(", ") || "N/A",
        `${p.availability_hours || 0}h/semana`
      ]);
    } else if (type === "programs") {
      columns = ["Programa", "Tema", "Estado", "Descripción"];
      rows = data.map(prog => [
        prog.name,
        prog.theme,
        prog.status,
        prog.description || "N/A"
      ]);
    }
    
    // Generate table
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 35,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [255, 217, 2], // #FFD902
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }
    
    doc.save(`${filename}.pdf`);
    setIsOpen(false);
  };

  const exportToExcel = () => {
    let worksheetData: any[] = [];
    
    if (type === "matches") {
      worksheetData = data.map(match => ({
        Mentor: match.mentor?.full_name || "N/A",
        Mentee: match.mentee?.full_name || "N/A",
        Programa: match.program?.name || "N/A",
        Estado: match.status,
        Score: match.match_score || "N/A",
        Rating: match.rating || 0,
        "Fecha Creación": match.created_at ? new Date(match.created_at).toLocaleDateString("es-ES") : "N/A"
      }));
    } else if (type === "participants") {
      worksheetData = data.map(p => ({
        Nombre: p.full_name,
        Rol: p.role === "mentor" ? "Mentor" : "Mentee",
        Headline: p.headline || "N/A",
        Skills: p.skills?.join(", ") || "N/A",
        Goals: p.goals?.join(", ") || "N/A",
        "Disponibilidad (h/semana)": p.availability_hours || 0,
        Email: p.email || "N/A"
      }));
    } else if (type === "programs") {
      worksheetData = data.map(prog => ({
        Programa: prog.name,
        Tema: prog.theme,
        Estado: prog.status,
        Descripción: prog.description || "N/A",
        "Fecha Creación": prog.created_at ? new Date(prog.created_at).toLocaleDateString("es-ES") : "N/A"
      }));
    }
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    
    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
      wch: Math.min(
        maxWidth,
        Math.max(
          key.length,
          ...worksheetData.map(row => String(row[key] || "").length)
        )
      )
    }));
    worksheet["!cols"] = colWidths;
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold transition ${
          darkMode
            ? "border-gray-600 text-gray-300 hover:border-primary-500 hover:text-primary-500"
            : "border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-500"
        }`}
      >
        📥 Exportar
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className={`absolute right-0 top-full mt-2 z-50 w-48 rounded-lg border shadow-lg ${
            darkMode
              ? "border-gray-700 bg-dark-400"
              : "border-gray-200 bg-white"
          }`}>
            <button
              onClick={exportToPDF}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                darkMode
                  ? "hover:bg-dark-300"
                  : "hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">📄</span>
              <div>
                <p className="font-medium text-sm">Exportar PDF</p>
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Archivo PDF con formato
                </p>
              </div>
            </button>
            
            <div className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`} />
            
            <button
              onClick={exportToExcel}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                darkMode
                  ? "hover:bg-dark-300"
                  : "hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">📊</span>
              <div>
                <p className="font-medium text-sm">Exportar Excel</p>
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Archivo .xlsx editable
                </p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
