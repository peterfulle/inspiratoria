'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Program {
  id: string;
  name: string;
  description: string;
  theme: string;
  status: string;
  company?: { id: string; name: string; slug?: string };
  company_name?: string;
  created_at: string;
  updated_at: string;
  participants_count?: number;
  activities_count?: number;
}

interface ProgramStats {
  total: number;
  active: number;
  completed: number;
  draft: number;
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  designed: 'Diseñado',
  ready_for_execution: 'Listo',
  in_execution: 'En Ejecución',
  under_review: 'En Revisión',
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Completado',
  closed: 'Cerrado',
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  designed: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  ready_for_execution: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-400' },
  in_execution: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  under_review: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
  paused: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  completed: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' },
  closed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
};

export default function ManageProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<ProgramStats>({ total: 0, active: 0, completed: 0, draft: 0 });

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API}/api/programs`);
        if (res.ok) {
          const data = await res.json();
          const programList = Array.isArray(data) ? data : data.results || [];
          setPrograms(programList);

          // Calculate stats
          const activeStatuses = ['active', 'in_execution', 'ready_for_execution'];
          const draftStatuses = ['draft', 'designed'];
          const completedStatuses = ['completed', 'closed'];
          setStats({
            total: programList.length,
            active: programList.filter((p: Program) => activeStatuses.includes(p.status)).length,
            completed: programList.filter((p: Program) => completedStatuses.includes(p.status)).length,
            draft: programList.filter((p: Program) => draftStatuses.includes(p.status)).length,
          });
        }
      } catch (error) {
        console.error('Error loading programs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API]);

  const filtered = programs.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.company_name || p.company?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.theme.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && ['active', 'in_execution', 'ready_for_execution'].includes(p.status)) ||
      (statusFilter === 'completed' && ['completed', 'closed'].includes(p.status)) ||
      (statusFilter === 'draft' && ['draft', 'designed'].includes(p.status));
    return matchesSearch && matchesStatus;
  });

  const statCards = [
    { label: 'Total Programas', value: stats.total, color: 'text-gray-900', bg: 'bg-white', sub: 'instancias activas' },
    { label: 'En Ejecución', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'operativos' },
    { label: 'Completados', value: stats.completed, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'finalizados' },
    { label: 'Borrador', value: stats.draft, color: 'text-gray-500', bg: 'bg-gray-50', sub: 'por lanzar' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando programas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestionar Programas</h1>
        <p className="text-sm text-gray-500 mt-1">Programas activos asignados a cuentas Studio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.bg} border border-gray-200 rounded-xl p-5`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, empresa o temática..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'active', label: 'Activos' },
            { id: 'completed', label: 'Completados' },
            { id: 'draft', label: 'Borrador' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Programs Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium text-gray-500">No se encontraron programas</p>
          <p className="text-xs text-gray-400 mt-1">Intenta cambiar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Programa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Temática</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((prog, i) => {
                const sc = statusColors[prog.status] || statusColors.draft;
                const companyName = prog.company_name || prog.company?.name || '—';
                return (
                  <tr
                    key={prog.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/dashboard/accounts/${prog.company?.id || ''}`)}
                  >
                    <td className="px-5 py-4 text-xs text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">{prog.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{prog.description || 'Sin descripción'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700 font-medium">{companyName}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{prog.theme || 'General'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {statusLabels[prog.status] || prog.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {prog.created_at ? new Date(prog.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const slug = prog.company?.slug || 'studio';
                          window.open(`/studio/${slug}?program=${prog.id}`, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors border border-primary-200 opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Ver en Studio
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
