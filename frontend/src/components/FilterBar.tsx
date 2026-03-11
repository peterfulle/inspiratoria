"use client";

import { useState, useEffect } from "react";

type FilterBarProps = {
  onFilterChange: (filters: FilterState) => void;
  darkMode: boolean;
  showRoleFilter?: boolean;
  showStatusFilter?: boolean;
};

export type FilterState = {
  search: string;
  role: string;
  status: string;
};

export default function FilterBar({ 
  onFilterChange, 
  darkMode, 
  showRoleFilter = true, 
  showStatusFilter = true 
}: FilterBarProps) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({ search, role, status });
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [search, role, status, onFilterChange]);

  return (
    <div className={`flex flex-wrap gap-3 rounded-lg border p-4 ${
      darkMode ? "border-gray-800 bg-dark-500" : "border-gray-200 bg-gray-50"
    }`}>
      {/* Search Bar */}
      <div className="flex-1 min-w-[250px]">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar por nombre..."
            className={`w-full rounded-lg border px-4 py-2 pl-10 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
              darkMode
                ? "border-gray-700 bg-dark-400 text-white placeholder-gray-500"
                : "border-gray-300 bg-white text-black placeholder-gray-400"
            }`}
          />
          <svg
            className={`absolute left-3 top-2.5 h-5 w-5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Role Filter */}
      {showRoleFilter && (
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={`rounded-lg border px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
            darkMode
              ? "border-gray-700 bg-dark-400 text-white"
              : "border-gray-300 bg-white text-black"
          }`}
        >
          <option value="all">Todos los roles</option>
          <option value="mentor">🎓 Mentores</option>
          <option value="mentee">🎯 Mentees</option>
        </select>
      )}

      {/* Status Filter */}
      {showStatusFilter && (
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`rounded-lg border px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
            darkMode
              ? "border-gray-700 bg-dark-400 text-white"
              : "border-gray-300 bg-white text-black"
          }`}
        >
          <option value="all">Todos los estados</option>
          <option value="active">✅ Activos</option>
          <option value="pending">⏳ Pendientes</option>
          <option value="completed">🎉 Completados</option>
        </select>
      )}

      {/* Clear Filters */}
      {(search || role !== "all" || status !== "all") && (
        <button
          onClick={() => {
            setSearch("");
            setRole("all");
            setStatus("all");
          }}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            darkMode
              ? "border-gray-700 text-gray-300 hover:border-red-500 hover:text-red-500"
              : "border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500"
          }`}
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
