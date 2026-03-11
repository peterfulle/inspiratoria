"use client";

import { useState } from "react";
import { pageStyles } from "./styles";
import { Icon } from "./icons";
import { 
  ProgramTemplate, Module, Resource, Activity, Milestone,
  MentorRequirements, MenteeRequirements, MatchingRules, SessionRules,
  ViewMode, ConfigTab, SessionDetail 
} from "./types";
import { 
  initialTemplates, 
  defaultMentorReqs, defaultMenteeReqs, defaultMatchingRules, defaultSessionRules,
  getCategoryLabel, getAlgorithmLabel, getTotalSessions, getTotalResources, getTotalActivities,
  getNextMonday, formatDateSpanish, generateModuleContent, generateSessionPlan
} from "./data";

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function ProgramsPage() {
  const [templates, setTemplates] = useState<ProgramTemplate[]>(initialTemplates);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  
  // Modals
  const [selectedTemplate, setSelectedTemplate] = useState<ProgramTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Assign Program Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [activeCompanies, setActiveCompanies] = useState<Array<{id: string; name: string; corp_id: string; plan: string; status: string}>>([]);
  const [assignForm, setAssignForm] = useState({ programId: "", companyId: "" });
  
  // Edit tabs
  const [editTab, setEditTab] = useState<ConfigTab>("general");
  
  // Expanded modules
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<Partial<ProgramTemplate>>({
    name: "",
    description: "",
    category: "leadership",
    duration: "",
    status: "draft",
    modules: [],
    milestones: [],
    tags: [],
    mentorRequirements: { ...defaultMentorReqs },
    menteeRequirements: { ...defaultMenteeReqs },
    matchingRules: { ...defaultMatchingRules },
    sessionRules: { ...defaultSessionRules },
  });

  // Stats
  const publishedCount = templates.filter(t => t.status === "published").length;
  const draftCount = templates.filter(t => t.status === "draft").length;
  const totalModules = templates.reduce((acc, t) => acc + t.modules.length, 0);

  // Filtered templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  // Handlers
  const handleCreate = () => {
    const newTemplate: ProgramTemplate = {
      id: `tpl-${Date.now()}`,
      name: formData.name || "",
      description: formData.description || "",
      category: formData.category || "leadership",
      duration: formData.duration || "",
      status: formData.status || "draft",
      modules: formData.modules || [],
      milestones: formData.milestones || [],
      tags: formData.tags || [],
      mentorRequirements: formData.mentorRequirements || { ...defaultMentorReqs },
      menteeRequirements: formData.menteeRequirements || { ...defaultMenteeReqs },
      matchingRules: formData.matchingRules || { ...defaultMatchingRules },
      sessionRules: formData.sessionRules || { ...defaultSessionRules },
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setTemplates([...templates, newTemplate]);
    setShowCreateModal(false);
    resetForm();
  };

  const handleSave = () => {
    if (!selectedTemplate) return;
    setTemplates(templates.map(t => 
      t.id === selectedTemplate.id ? { ...t, ...formData, updatedAt: new Date().toISOString().split('T')[0] } as ProgramTemplate : t
    ));
    setShowEditModal(false);
    setSelectedTemplate(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleDuplicate = (template: ProgramTemplate) => {
    const newTemplate: ProgramTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      name: `${template.name} (Copia)`,
      status: "draft",
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setTemplates([...templates, newTemplate]);
  };

  const openEditModal = (template: ProgramTemplate) => {
    setSelectedTemplate(template);
    setFormData({ ...template });
    setEditTab("general");
    setExpandedModules([]);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "leadership",
      duration: "",
      status: "draft",
      modules: [],
      milestones: [],
      tags: [],
      mentorRequirements: { ...defaultMentorReqs },
      menteeRequirements: { ...defaultMenteeReqs },
      matchingRules: { ...defaultMatchingRules },
      sessionRules: { ...defaultSessionRules },
    });
    setEditTab("general");
    setExpandedModules([]);
  };

  // Module handlers
  const addModule = () => {
    const newModule: Module = {
      id: `mod-${Date.now()}`,
      name: "",
      duration: "",
      sessions: 1,
      description: "",
      objectives: [],
      resources: [],
      activities: [],
    };
    setFormData({ ...formData, modules: [...(formData.modules || []), newModule] });
    setExpandedModules([...expandedModules, newModule.id]);
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setFormData({
      ...formData,
      modules: (formData.modules || []).map(m => m.id === moduleId ? { ...m, ...updates } : m)
    });
  };

  const deleteModule = (moduleId: string) => {
    setFormData({
      ...formData,
      modules: (formData.modules || []).filter(m => m.id !== moduleId)
    });
  };

  // Resource handlers
  const addResource = (moduleId: string) => {
    const newResource: Resource = {
      id: `res-${Date.now()}`,
      name: "",
      type: "pdf",
      url: "",
    };
    setFormData({
      ...formData,
      modules: (formData.modules || []).map(m => 
        m.id === moduleId ? { ...m, resources: [...m.resources, newResource] } : m
      )
    });
  };

  const updateResource = (moduleId: string, resourceId: string, updates: Partial<Resource>) => {
    setFormData({
      ...formData,
      modules: (formData.modules || []).map(m => 
        m.id === moduleId ? {
          ...m,
          resources: m.resources.map(r => r.id === resourceId ? { ...r, ...updates } : r)
        } : m
      )
    });
  };

  const deleteResource = (moduleId: string, resourceId: string) => {
    setFormData({
      ...formData,
      modules: (formData.modules || []).map(m => 
        m.id === moduleId ? { ...m, resources: m.resources.filter(r => r.id !== resourceId) } : m
      )
    });
  };

  // Activity handlers
  const addActivity = (moduleId: string) => {
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      name: "",
      type: "exercise",
      duration: "",
      description: "",
    };
    setFormData({
      ...formData,
      modules: (formData.modules || []).map(m => 
        m.id === moduleId ? { ...m, activities: [...m.activities, newActivity] } : m
      )
    });
  };

  const updateActivity = (moduleId: string, activityId: string, updates: Partial<Activity>) => {
    setFormData({
      ...formData,
      modules: (formData.modules || []).map(m => 
        m.id === moduleId ? {
          ...m,
          activities: m.activities.map(a => a.id === activityId ? { ...a, ...updates } : a)
        } : m
      )
    });
  };

  const deleteActivity = (moduleId: string, activityId: string) => {
    setFormData({
      ...formData,
      modules: (formData.modules || []).map(m => 
        m.id === moduleId ? { ...m, activities: m.activities.filter(a => a.id !== activityId) } : m
      )
    });
  };

  // Milestone handlers
  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: `ms-${Date.now()}`,
      name: "",
      week: 1,
      description: "",
      deliverable: "",
    };
    setFormData({ ...formData, milestones: [...(formData.milestones || []), newMilestone] });
  };

  const updateMilestone = (milestoneId: string, updates: Partial<Milestone>) => {
    setFormData({
      ...formData,
      milestones: (formData.milestones || []).map(m => m.id === milestoneId ? { ...m, ...updates } : m)
    });
  };

  const deleteMilestone = (milestoneId: string) => {
    setFormData({
      ...formData,
      milestones: (formData.milestones || []).filter(m => m.id !== milestoneId)
    });
  };

  // ─── ASSIGN PROGRAM HANDLERS ───
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  const openAssignModal = async () => {
    setShowAssignModal(true);
    setAssignSuccess(false);
    setAssignError("");
    setAssignForm({ programId: "", companyId: "" });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/companies/active-companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCompanies(data.companies || []);
      }
    } catch {}
  };

  const handleAssignProgram = async () => {
    if (!assignForm.programId || !assignForm.companyId) {
      setAssignError("Selecciona un programa y una empresa");
      return;
    }
    setAssignLoading(true);
    setAssignError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/companies/programs/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ program_id: assignForm.programId, company_id: assignForm.companyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Error al asignar");
      setAssignSuccess(true);
    } catch (err: any) {
      setAssignError(err.message);
    } finally {
      setAssignLoading(false);
    }
  };


  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <div className="programs-page">
        {/* Header */}
        <header className="programs-header sticky top-0 z-20">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">Plantillas de Programas</h1>
                <p className="text-neutral-500 text-sm mt-0.5">Catálogo white-label para clientes</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="btn-secondary flex items-center gap-2">
                  <Icon.Download className="w-4 h-4" />
                  Exportar
                </button>
                <button
                  onClick={openAssignModal}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Icon.Link className="w-4 h-4" />
                  Asignar programa
                </button>
                <button 
                  onClick={() => { resetForm(); setShowCreateModal(true); }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Icon.Plus className="w-4 h-4" />
                  Nueva Plantilla
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          {/* Info Banner */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-700">
              <strong>White-Label:</strong> Estas son plantillas base. Cada empresa las agrega a su dashboard donde gestiona sus propios mentores, mentees y sesiones.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="stat-card">
              <span className="section-title" style={{ margin: 0 }}>Total</span>
              <p className="text-3xl font-semibold text-neutral-900 mt-2">{templates.length}</p>
              <p className="text-neutral-500 text-xs mt-1">plantillas</p>
            </div>
            <div className="stat-card">
              <span className="section-title" style={{ margin: 0 }}>Publicadas</span>
              <p className="text-3xl font-semibold text-neutral-900 mt-2">{publishedCount}</p>
              <p className="text-neutral-500 text-xs mt-1">disponibles</p>
            </div>
            <div className="stat-card">
              <span className="section-title" style={{ margin: 0 }}>Borradores</span>
              <p className="text-3xl font-semibold text-neutral-900 mt-2">{draftCount}</p>
              <p className="text-neutral-500 text-xs mt-1">en desarrollo</p>
            </div>
            <div className="stat-card">
              <span className="section-title" style={{ margin: 0 }}>Módulos</span>
              <p className="text-3xl font-semibold text-neutral-900 mt-2">{totalModules}</p>
              <p className="text-neutral-500 text-xs mt-1">en total</p>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Icon.Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-11"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex gap-2 overflow-x-auto">
                  {["all", "leadership", "tech", "sales", "diversity", "operations"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`filter-btn whitespace-nowrap ${filterCategory === cat ? "active" : ""}`}
                    >
                      {cat === "all" ? "Todos" : getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 border-l border-neutral-200 pl-4">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`btn-icon ${viewMode === "grid" ? "active" : ""}`}
                    title="Vista cuadrícula"
                  >
                    <Icon.Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`btn-icon ${viewMode === "list" ? "active" : ""}`}
                    title="Vista lista"
                  >
                    <Icon.List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Grid View - Compact Horizontal Cards */}
          {viewMode === "grid" && (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="program-card p-4">
                  <div className="flex items-center gap-6">
                    {/* Left: Badges + Title + Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge badge-${template.category}`}>
                          {getCategoryLabel(template.category)}
                        </span>
                        <span className={`badge badge-${template.status}`}>
                          {template.status === "published" ? "Publicada" : "Borrador"}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-neutral-900">{template.name}</h3>
                      <p className="text-neutral-500 text-sm truncate">{template.description}</p>
                    </div>

                    {/* Center: Stats */}
                    <div className="flex items-center gap-6 text-center flex-shrink-0">
                      <div className="px-4">
                        <p className="text-sm font-semibold text-neutral-900">{template.duration}</p>
                        <p className="text-xs text-neutral-400">Duración</p>
                      </div>
                      <div className="px-4 border-l border-neutral-100">
                        <p className="text-sm font-semibold text-neutral-900">{template.modules.length}</p>
                        <p className="text-xs text-neutral-400">Módulos</p>
                      </div>
                      <div className="px-4 border-l border-neutral-100">
                        <p className="text-sm font-semibold text-neutral-900">{getTotalSessions(template.modules)}</p>
                        <p className="text-xs text-neutral-400">Sesiones</p>
                      </div>
                    </div>

                    {/* Right: Config Summary */}
                    <div className="text-xs text-neutral-500 flex-shrink-0 w-48">
                      <p>• Máx {template.mentorRequirements.maxMentees} mentees/mentor</p>
                      <p>• {template.sessionRules.frequencyPerMonth} sesiones/mes ({template.sessionRules.defaultDuration} min)</p>
                      <p>• Matching: {getAlgorithmLabel(template.matchingRules.algorithm)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 pl-4 border-l border-neutral-100">
                      <button
                        onClick={() => openEditModal(template)}
                        className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
                      >
                        <Icon.Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button onClick={() => handleDuplicate(template)} className="btn-ghost" title="Duplicar">
                        <Icon.Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(template.id)}
                        className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50"
                        title="Eliminar"
                      >
                        <Icon.Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Templates List View */}
          {viewMode === "list" && (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="program-row">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge badge-${template.category}`}>
                        {getCategoryLabel(template.category)}
                      </span>
                      <span className={`badge badge-${template.status}`}>
                        {template.status === "published" ? "Publicada" : "Borrador"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate">{template.name}</h3>
                      <p className="text-sm text-neutral-500 truncate">{template.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 flex-shrink-0 text-center">
                    <div>
                      <p className="font-semibold text-neutral-900">{template.duration}</p>
                      <p className="text-xs text-neutral-500">Duración</p>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">{template.modules.length}</p>
                      <p className="text-xs text-neutral-500">Módulos</p>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">{getTotalSessions(template.modules)}</p>
                      <p className="text-xs text-neutral-500">Sesiones</p>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">{getTotalResources(template.modules)}</p>
                      <p className="text-xs text-neutral-500">Recursos</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(template)}
                      className="btn-primary flex items-center gap-2 text-sm py-2"
                    >
                      <Icon.Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button onClick={() => handleDuplicate(template)} className="btn-ghost" title="Duplicar">
                      <Icon.Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(template.id)}
                      className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Icon.Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredTemplates.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Icon.Grid className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No hay plantillas</h3>
              <p className="text-neutral-500 mb-6">
                {searchTerm || filterCategory !== "all"
                  ? "No se encontraron plantillas con los filtros seleccionados"
                  : "Comienza creando tu primera plantilla de programa"
                }
              </p>
              {!searchTerm && filterCategory === "all" && (
                <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="btn-primary">
                  Crear Plantilla
                </button>
              )}
            </div>
          )}
        </main>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-neutral-900">Nueva Plantilla</h2>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                    <Icon.X className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej. Leadership Accelerator"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Descripción *</label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe el programa..."
                    className="textarea-field"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Categoría *</label>
                    <select
                      value={formData.category || "leadership"}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as ProgramTemplate["category"] })}
                      className="select-field"
                    >
                      <option value="leadership">Leadership</option>
                      <option value="tech">Tech</option>
                      <option value="sales">Sales</option>
                      <option value="diversity">Diversity</option>
                      <option value="operations">Operations</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Duración *</label>
                    <input
                      type="text"
                      value={formData.duration || ""}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="ej. 6 meses"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-sm text-neutral-600">
                    Después de crear, podrás agregar módulos, recursos, actividades y configurar requisitos.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button
                    onClick={handleCreate}
                    disabled={!formData.name || !formData.description || !formData.duration}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    Crear Plantilla
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal - Full Editor */}
        {showEditModal && selectedTemplate && (
          <div className="modal-overlay" onClick={() => { setShowEditModal(false); setSelectedTemplate(null); }}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-900">{formData.name}</h2>
                    <p className="text-sm text-neutral-500">Editor completo de plantilla</p>
                  </div>
                  <button
                    onClick={() => { setShowEditModal(false); setSelectedTemplate(null); }}
                    className="p-2 hover:bg-neutral-100 rounded-lg"
                  >
                    <Icon.X className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="tab-nav -mx-6 px-0">
                  {[
                    { id: "general", label: "General", icon: Icon.Settings },
                    { id: "modules", label: "Módulos", icon: Icon.Book },
                    { id: "milestones", label: "Hitos", icon: Icon.Flag },
                    { id: "mentors", label: "Mentores", icon: Icon.Award },
                    { id: "mentees", label: "Mentees", icon: Icon.Users },
                    { id: "matching", label: "Matching", icon: Icon.Link },
                    { id: "sessions", label: "Sesiones", icon: Icon.Calendar },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setEditTab(tab.id as ConfigTab)}
                      className={`tab-btn flex items-center gap-2 ${editTab === tab.id ? "active" : ""}`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* General Tab */}
                {editTab === "general" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Nombre *</label>
                        <input
                          type="text"
                          value={formData.name || ""}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Duración *</label>
                        <input
                          type="text"
                          value={formData.duration || ""}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Descripción *</label>
                      <textarea
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="textarea-field"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Categoría</label>
                        <select
                          value={formData.category || "leadership"}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value as ProgramTemplate["category"] })}
                          className="select-field"
                        >
                          <option value="leadership">Leadership</option>
                          <option value="tech">Tech</option>
                          <option value="sales">Sales</option>
                          <option value="diversity">Diversity</option>
                          <option value="operations">Operations</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Estado</label>
                        <select
                          value={formData.status || "draft"}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as ProgramTemplate["status"] })}
                          className="select-field"
                        >
                          <option value="draft">Borrador</option>
                          <option value="published">Publicada</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Tags (separados por coma)</label>
                      <input
                        type="text"
                        value={(formData.tags || []).join(", ")}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                        placeholder="liderazgo, soft skills, managers"
                        className="input-field"
                      />
                    </div>
                  </div>
                )}

                {/* Modules Tab */}
                {editTab === "modules" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-neutral-900">Módulos ({(formData.modules || []).length})</h3>
                        <p className="text-sm text-neutral-500">Contenido, recursos y actividades</p>
                      </div>
                      <button onClick={addModule} className="btn-primary flex items-center gap-2 text-sm">
                        <Icon.Plus className="w-4 h-4" />
                        Agregar Módulo
                      </button>
                    </div>

                    {(formData.modules || []).length === 0 && (
                      <div className="empty-state">
                        <Icon.Book className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500">No hay módulos aún</p>
                        <button onClick={addModule} className="btn-secondary mt-4">
                          Agregar primer módulo
                        </button>
                      </div>
                    )}

                    {(formData.modules || []).map((module, idx) => (
                      <div key={module.id} className={`module-item ${expandedModules.includes(module.id) ? "expanded" : ""}`}>
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleModule(module.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-neutral-900">
                                {module.name || "Módulo sin nombre"}
                              </p>
                              <p className="text-sm text-neutral-500">
                                {module.sessions} sesiones • {module.resources.length} recursos • {module.activities.length} actividades
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteModule(module.id); }}
                              className="btn-ghost text-red-500 hover:bg-red-50"
                            >
                              <Icon.Trash className="w-4 h-4" />
                            </button>
                            {expandedModules.includes(module.id) ? (
                              <Icon.ChevronUp className="w-5 h-5 text-neutral-400" />
                            ) : (
                              <Icon.ChevronDown className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>
                        </div>

                        {expandedModules.includes(module.id) && (
                          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4">
                            {/* Module Basic Info */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2">
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Nombre del módulo</label>
                                <input
                                  type="text"
                                  value={module.name}
                                  onChange={(e) => updateModule(module.id, { name: e.target.value })}
                                  className="input-field text-sm"
                                  placeholder="Ej: Fundamentos del Liderazgo"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Duración</label>
                                <input
                                  type="text"
                                  value={module.duration}
                                  onChange={(e) => updateModule(module.id, { duration: e.target.value })}
                                  className="input-field text-sm"
                                  placeholder="4 semanas"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Descripción</label>
                                <textarea
                                  value={module.description}
                                  onChange={(e) => updateModule(module.id, { description: e.target.value })}
                                  className="input-field text-sm"
                                  rows={2}
                                  placeholder="Descripción del módulo..."
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">Número de sesiones</label>
                                <input
                                  type="number"
                                  value={module.sessions}
                                  onChange={(e) => updateModule(module.id, { sessions: Number(e.target.value) })}
                                  className="input-field text-sm"
                                  min="1"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-neutral-600 mb-1">Objetivos (uno por línea)</label>
                              <textarea
                                value={(module.objectives || []).join("\n")}
                                onChange={(e) => updateModule(module.id, { objectives: e.target.value.split("\n").filter(Boolean) })}
                                className="input-field text-sm"
                                rows={3}
                                placeholder="Objetivo 1&#10;Objetivo 2&#10;Objetivo 3"
                              />
                            </div>

                            {/* Resources */}
                            <div className="pt-4 border-t border-neutral-100">
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-neutral-700">Recursos ({module.resources.length})</label>
                                <button
                                  onClick={() => addResource(module.id)}
                                  className="btn-ghost text-sm flex items-center gap-1"
                                >
                                  <Icon.Plus className="w-3 h-3" />
                                  Agregar
                                </button>
                              </div>
                              {module.resources.map((resource) => (
                                <div key={resource.id} className="resource-item mb-2">
                                  <div className="flex-1 grid grid-cols-4 gap-2">
                                    <input
                                      type="text"
                                      value={resource.name}
                                      onChange={(e) => updateResource(module.id, resource.id, { name: e.target.value })}
                                      className="input-field text-xs col-span-2"
                                      placeholder="Nombre del recurso"
                                    />
                                    <select
                                      value={resource.type}
                                      onChange={(e) => updateResource(module.id, resource.id, { type: e.target.value as Resource["type"] })}
                                      className="select-field text-xs"
                                    >
                                      <option value="pdf">PDF</option>
                                      <option value="video">Video</option>
                                      <option value="template">Template</option>
                                      <option value="document">Documento</option>
                                      <option value="link">Link</option>
                                    </select>
                                    <input
                                      type="text"
                                      value={resource.url}
                                      onChange={(e) => updateResource(module.id, resource.id, { url: e.target.value })}
                                      className="input-field text-xs"
                                      placeholder="URL"
                                    />
                                  </div>
                                  <button
                                    onClick={() => deleteResource(module.id, resource.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                  >
                                    <Icon.X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Activities */}
                            <div className="pt-4 border-t border-neutral-100">
                              <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-neutral-700">Actividades ({module.activities.length})</label>
                                <button
                                  onClick={() => addActivity(module.id)}
                                  className="btn-ghost text-sm flex items-center gap-1"
                                >
                                  <Icon.Plus className="w-3 h-3" />
                                  Agregar
                                </button>
                              </div>
                              {module.activities.map((activity) => (
                                <div key={activity.id} className="activity-item mb-2">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 grid grid-cols-4 gap-2">
                                      <input
                                        type="text"
                                        value={activity.name}
                                        onChange={(e) => updateActivity(module.id, activity.id, { name: e.target.value })}
                                        className="input-field text-xs col-span-2"
                                        placeholder="Nombre de la actividad"
                                      />
                                      <select
                                        value={activity.type}
                                        onChange={(e) => updateActivity(module.id, activity.id, { type: e.target.value as Activity["type"] })}
                                        className="select-field text-xs"
                                      >
                                        <option value="exercise">Ejercicio</option>
                                        <option value="reflection">Reflexión</option>
                                        <option value="roleplay">Role Play</option>
                                        <option value="assessment">Assessment</option>
                                        <option value="discussion">Discusión</option>
                                      </select>
                                      <input
                                        type="text"
                                        value={activity.duration}
                                        onChange={(e) => updateActivity(module.id, activity.id, { duration: e.target.value })}
                                        className="input-field text-xs"
                                        placeholder="30 min"
                                      />
                                    </div>
                                    <button
                                      onClick={() => deleteActivity(module.id, activity.id)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <Icon.X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={activity.description}
                                    onChange={(e) => updateActivity(module.id, activity.id, { description: e.target.value })}
                                    className="input-field text-xs mt-2"
                                    placeholder="Descripción de la actividad"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Sessions Detail */}
                            {module.sessions_detail && module.sessions_detail.length > 0 && (
                              <div className="pt-4 border-t border-neutral-100">
                                <div className="flex items-center justify-between mb-3">
                                  <label className="text-sm font-medium text-neutral-700">
                                    Sesiones Detalladas ({module.sessions_detail.length})
                                  </label>
                                  <span className="text-xs text-neutral-500">
                                    Inicia: {formatDateSpanish(getNextMonday())}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {module.sessions_detail.map((session: SessionDetail, idx: number) => (
                                    <div 
                                      key={session.id} 
                                      className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                    >
                                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-700">
                                        S{idx + 1}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-neutral-800 truncate">{session.title}</p>
                                        <p className="text-xs text-neutral-500">Semana {session.week} • {session.duration} min</p>
                                      </div>
                                      {session.homework && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                                          Tarea
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Milestones Tab */}
                {editTab === "milestones" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-neutral-900">Hitos ({(formData.milestones || []).length})</h3>
                        <p className="text-sm text-neutral-500">Puntos de control y entregables</p>
                      </div>
                      <button onClick={addMilestone} className="btn-primary flex items-center gap-2 text-sm">
                        <Icon.Plus className="w-4 h-4" />
                        Agregar Hito
                      </button>
                    </div>

                    {(formData.milestones || []).length === 0 && (
                      <div className="empty-state">
                        <Icon.Flag className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500">No hay hitos definidos</p>
                        <button onClick={addMilestone} className="btn-secondary mt-4">
                          Agregar primer hito
                        </button>
                      </div>
                    )}

                    {(formData.milestones || []).map((milestone) => (
                      <div key={milestone.id} className="milestone-item">
                        <div className="milestone-marker">
                          S{milestone.week}
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <input
                            type="text"
                            value={milestone.name}
                            onChange={(e) => updateMilestone(milestone.id, { name: e.target.value })}
                            className="input-field text-sm col-span-2"
                            placeholder="Nombre del hito"
                          />
                          <input
                            type="number"
                            value={milestone.week}
                            onChange={(e) => updateMilestone(milestone.id, { week: Number(e.target.value) })}
                            className="input-field text-sm"
                            placeholder="Semana"
                            min="1"
                          />
                          <input
                            type="text"
                            value={milestone.deliverable}
                            onChange={(e) => updateMilestone(milestone.id, { deliverable: e.target.value })}
                            className="input-field text-sm"
                            placeholder="Entregable"
                          />
                          <input
                            type="text"
                            value={milestone.description}
                            onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                            className="input-field text-sm col-span-3"
                            placeholder="Descripción"
                          />
                          <button
                            onClick={() => deleteMilestone(milestone.id)}
                            className="btn-ghost text-red-500 hover:bg-red-50 self-center"
                          >
                            <Icon.Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mentors Tab */}
                {editTab === "mentors" && (
                  <div className="space-y-4">
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Máximo de mentees</p>
                        <p className="text-sm text-neutral-500">Por cada mentor</p>
                      </div>
                      <input
                        type="number"
                        value={formData.mentorRequirements?.maxMentees || 5}
                        onChange={(e) => setFormData({
                          ...formData,
                          mentorRequirements: { ...formData.mentorRequirements!, maxMentees: Number(e.target.value) }
                        })}
                        className="number-input"
                        min="1"
                        max="20"
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Años de experiencia mínimos</p>
                        <p className="text-sm text-neutral-500">Para ser mentor</p>
                      </div>
                      <input
                        type="number"
                        value={formData.mentorRequirements?.minExperienceYears || 3}
                        onChange={(e) => setFormData({
                          ...formData,
                          mentorRequirements: { ...formData.mentorRequirements!, minExperienceYears: Number(e.target.value) }
                        })}
                        className="number-input"
                        min="0"
                        max="30"
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Nivel requerido</p>
                        <p className="text-sm text-neutral-500">Seniority mínimo</p>
                      </div>
                      <select
                        value={formData.mentorRequirements?.requiredLevel || "senior"}
                        onChange={(e) => setFormData({
                          ...formData,
                          mentorRequirements: { ...formData.mentorRequirements!, requiredLevel: e.target.value }
                        })}
                        className="select-field w-auto"
                      >
                        <option value="junior">Junior</option>
                        <option value="mid">Mid</option>
                        <option value="senior">Senior</option>
                        <option value="staff">Staff</option>
                        <option value="principal">Principal</option>
                        <option value="director">Director</option>
                      </select>
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Requiere perfil completo</p>
                        <p className="text-sm text-neutral-500">Bio, foto, especialidades</p>
                      </div>
                      <div
                        className={`toggle-switch ${formData.mentorRequirements?.requireProfile ? "active" : ""}`}
                        onClick={() => setFormData({
                          ...formData,
                          mentorRequirements: { ...formData.mentorRequirements!, requireProfile: !formData.mentorRequirements?.requireProfile }
                        })}
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Requiere LinkedIn</p>
                        <p className="text-sm text-neutral-500">Verificación profesional</p>
                      </div>
                      <div
                        className={`toggle-switch ${formData.mentorRequirements?.requireLinkedIn ? "active" : ""}`}
                        onClick={() => setFormData({
                          ...formData,
                          mentorRequirements: { ...formData.mentorRequirements!, requireLinkedIn: !formData.mentorRequirements?.requireLinkedIn }
                        })}
                      />
                    </div>
                  </div>
                )}

                {/* Mentees Tab */}
                {editTab === "mentees" && (
                  <div className="space-y-4">
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Puede seleccionar mentor</p>
                        <p className="text-sm text-neutral-500">El mentee elige su mentor</p>
                      </div>
                      <div
                        className={`toggle-switch ${formData.menteeRequirements?.canSelectMentor ? "active" : ""}`}
                        onClick={() => setFormData({
                          ...formData,
                          menteeRequirements: { ...formData.menteeRequirements!, canSelectMentor: !formData.menteeRequirements?.canSelectMentor }
                        })}
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Máximo de mentores</p>
                        <p className="text-sm text-neutral-500">Simultáneos permitidos</p>
                      </div>
                      <input
                        type="number"
                        value={formData.menteeRequirements?.maxMentors || 1}
                        onChange={(e) => setFormData({
                          ...formData,
                          menteeRequirements: { ...formData.menteeRequirements!, maxMentors: Number(e.target.value) }
                        })}
                        className="number-input"
                        min="1"
                        max="5"
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Requiere objetivos</p>
                        <p className="text-sm text-neutral-500">Definir metas al inscribirse</p>
                      </div>
                      <div
                        className={`toggle-switch ${formData.menteeRequirements?.requiredGoals ? "active" : ""}`}
                        onClick={() => setFormData({
                          ...formData,
                          menteeRequirements: { ...formData.menteeRequirements!, requiredGoals: !formData.menteeRequirements?.requiredGoals }
                        })}
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Requiere perfil</p>
                        <p className="text-sm text-neutral-500">Info personal completa</p>
                      </div>
                      <div
                        className={`toggle-switch ${formData.menteeRequirements?.requireProfile ? "active" : ""}`}
                        onClick={() => setFormData({
                          ...formData,
                          menteeRequirements: { ...formData.menteeRequirements!, requireProfile: !formData.menteeRequirements?.requireProfile }
                        })}
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Antigüedad mínima</p>
                        <p className="text-sm text-neutral-500">Meses en la empresa</p>
                      </div>
                      <input
                        type="number"
                        value={formData.menteeRequirements?.minTenure || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          menteeRequirements: { ...formData.menteeRequirements!, minTenure: Number(e.target.value) }
                        })}
                        className="number-input"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                {/* Matching Tab */}
                {editTab === "matching" && (
                  <div className="space-y-4">
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Algoritmo de matching</p>
                        <p className="text-sm text-neutral-500">Cómo se emparejan mentor-mentee</p>
                      </div>
                      <select
                        value={formData.matchingRules?.algorithm || "hybrid"}
                        onChange={(e) => setFormData({
                          ...formData,
                          matchingRules: { ...formData.matchingRules!, algorithm: e.target.value as MatchingRules["algorithm"] }
                        })}
                        className="select-field w-auto"
                      >
                        <option value="manual">Manual (admin asigna)</option>
                        <option value="auto_skills">Auto (por skills)</option>
                        <option value="auto_goals">Auto (por objetivos)</option>
                        <option value="hybrid">Híbrido (sugerencias + aprobación)</option>
                      </select>
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Permitir preferencias</p>
                        <p className="text-sm text-neutral-500">Mentees indican preferencias</p>
                      </div>
                      <div
                        className={`toggle-switch ${formData.matchingRules?.allowPreferences ? "active" : ""}`}
                        onClick={() => setFormData({
                          ...formData,
                          matchingRules: { ...formData.matchingRules!, allowPreferences: !formData.matchingRules?.allowPreferences }
                        })}
                      />
                    </div>
                    <div className="pt-4 border-t border-neutral-100">
                      <p className="text-sm font-medium text-neutral-700 mb-4">Pesos del algoritmo (total = 100%)</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="config-row py-2">
                          <span className="text-sm text-neutral-600">Skills</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={formData.matchingRules?.weighSkills || 30}
                              onChange={(e) => setFormData({
                                ...formData,
                                matchingRules: { ...formData.matchingRules!, weighSkills: Number(e.target.value) }
                              })}
                              className="number-input"
                              min="0"
                              max="100"
                            />
                            <span className="text-xs text-neutral-500">%</span>
                          </div>
                        </div>
                        <div className="config-row py-2">
                          <span className="text-sm text-neutral-600">Objetivos</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={formData.matchingRules?.weighGoals || 40}
                              onChange={(e) => setFormData({
                                ...formData,
                                matchingRules: { ...formData.matchingRules!, weighGoals: Number(e.target.value) }
                              })}
                              className="number-input"
                              min="0"
                              max="100"
                            />
                            <span className="text-xs text-neutral-500">%</span>
                          </div>
                        </div>
                        <div className="config-row py-2">
                          <span className="text-sm text-neutral-600">Departamento</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={formData.matchingRules?.weighDepartment || 15}
                              onChange={(e) => setFormData({
                                ...formData,
                                matchingRules: { ...formData.matchingRules!, weighDepartment: Number(e.target.value) }
                              })}
                              className="number-input"
                              min="0"
                              max="100"
                            />
                            <span className="text-xs text-neutral-500">%</span>
                          </div>
                        </div>
                        <div className="config-row py-2">
                          <span className="text-sm text-neutral-600">Seniority</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={formData.matchingRules?.weighSeniority || 15}
                              onChange={(e) => setFormData({
                                ...formData,
                                matchingRules: { ...formData.matchingRules!, weighSeniority: Number(e.target.value) }
                              })}
                              className="number-input"
                              min="0"
                              max="100"
                            />
                            <span className="text-xs text-neutral-500">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sessions Tab */}
                {editTab === "sessions" && (
                  <div className="space-y-4">
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Duración por defecto</p>
                        <p className="text-sm text-neutral-500">Minutos por sesión</p>
                      </div>
                      <select
                        value={formData.sessionRules?.defaultDuration || 60}
                        onChange={(e) => setFormData({
                          ...formData,
                          sessionRules: { ...formData.sessionRules!, defaultDuration: Number(e.target.value) }
                        })}
                        className="select-field w-auto"
                      >
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                        <option value={90}>90 min</option>
                        <option value={120}>120 min</option>
                      </select>
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Frecuencia mensual</p>
                        <p className="text-sm text-neutral-500">Sesiones por mes</p>
                      </div>
                      <input
                        type="number"
                        value={formData.sessionRules?.frequencyPerMonth || 2}
                        onChange={(e) => setFormData({
                          ...formData,
                          sessionRules: { ...formData.sessionRules!, frequencyPerMonth: Number(e.target.value) }
                        })}
                        className="number-input"
                        min="1"
                        max="8"
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Permitir reprogramar</p>
                        <p className="text-sm text-neutral-500">Cambiar fecha de sesión</p>
                      </div>
                      <div
                        className={`toggle-switch ${formData.sessionRules?.allowReschedule ? "active" : ""}`}
                        onClick={() => setFormData({
                          ...formData,
                          sessionRules: { ...formData.sessionRules!, allowReschedule: !formData.sessionRules?.allowReschedule }
                        })}
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Máximo reprogramaciones</p>
                        <p className="text-sm text-neutral-500">Por sesión</p>
                      </div>
                      <input
                        type="number"
                        value={formData.sessionRules?.maxReschedules || 2}
                        onChange={(e) => setFormData({
                          ...formData,
                          sessionRules: { ...formData.sessionRules!, maxReschedules: Number(e.target.value) }
                        })}
                        className="number-input"
                        min="0"
                        max="5"
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Recordatorio (días antes)</p>
                        <p className="text-sm text-neutral-500">Notificación previa</p>
                      </div>
                      <input
                        type="number"
                        value={formData.sessionRules?.reminderDays || 2}
                        onChange={(e) => setFormData({
                          ...formData,
                          sessionRules: { ...formData.sessionRules!, reminderDays: Number(e.target.value) }
                        })}
                        className="number-input"
                        min="1"
                        max="7"
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Requiere agenda previa</p>
                        <p className="text-sm text-neutral-500">Definir temas antes de la sesión</p>
                      </div>
                      <div
                        className={`toggle-switch ${formData.sessionRules?.requireAgenda ? "active" : ""}`}
                        onClick={() => setFormData({
                          ...formData,
                          sessionRules: { ...formData.sessionRules!, requireAgenda: !formData.sessionRules?.requireAgenda }
                        })}
                      />
                    </div>
                    <div className="config-row">
                      <div>
                        <p className="font-medium text-neutral-900">Requiere feedback post-sesión</p>
                        <p className="text-sm text-neutral-500">Evaluación obligatoria</p>
                      </div>
                      <div
                        className={`toggle-switch ${formData.sessionRules?.requireFeedback ? "active" : ""}`}
                        onClick={() => setFormData({
                          ...formData,
                          sessionRules: { ...formData.sessionRules!, requireFeedback: !formData.sessionRules?.requireFeedback }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-neutral-100 bg-neutral-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { setShowEditModal(false); setSelectedTemplate(null); }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                    <Icon.Check className="w-4 h-4" />
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
            <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Icon.Trash className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 text-center mb-2">Eliminar Plantilla</h3>
                <p className="text-neutral-500 text-center mb-6">
                  ¿Eliminar esta plantilla? Las empresas que ya la usan conservarán su copia.
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ASSIGN PROGRAM MODAL ─── */}
        {showAssignModal && (
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
              {!assignSuccess ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                        <Icon.Link className="w-5 h-5 text-[#FFD902]" />
                      </div>
                      <div>
                        <h3 className="text-[16px] font-semibold text-neutral-900">Asignar programa</h3>
                        <p className="text-[12px] text-neutral-400">Asigna una plantilla a una empresa activa</p>
                      </div>
                    </div>
                    <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                      <Icon.X className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[12px] text-neutral-500 mb-1.5 font-medium">Plantilla de programa</label>
                      <select
                        value={assignForm.programId}
                        onChange={e => setAssignForm(p => ({ ...p, programId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-[14px] text-neutral-900 focus:outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100"
                      >
                        <option value="">Seleccionar programa...</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.status === "published" ? "Publicado" : "Borrador"})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[12px] text-neutral-500 mb-1.5 font-medium">Empresa destino</label>
                      <select
                        value={assignForm.companyId}
                        onChange={e => setAssignForm(p => ({ ...p, companyId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-[14px] text-neutral-900 focus:outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100"
                      >
                        <option value="">Seleccionar empresa...</option>
                        {activeCompanies.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.corp_id} · {c.plan})</option>
                        ))}
                      </select>
                      {activeCompanies.length === 0 && (
                        <p className="text-[11px] text-neutral-400 mt-1.5">No hay empresas activas. Crea una cuenta Studio primero.</p>
                      )}
                    </div>
                  </div>

                  {assignError && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <p className="text-[12px] text-red-600">{assignError}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 mt-6">
                    <button onClick={() => setShowAssignModal(false)} className="btn-secondary px-4 py-2.5 text-[13px]">
                      Cancelar
                    </button>
                    <button
                      onClick={handleAssignProgram}
                      disabled={assignLoading}
                      className="btn-primary px-5 py-2.5 text-[13px] flex items-center gap-2"
                    >
                      {assignLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Asignando...
                        </>
                      ) : (
                        <>
                          <Icon.Link className="w-4 h-4" />
                          Asignar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center mx-auto mb-4">
                    <Icon.Check className="w-7 h-7 text-[#FFD902]" />
                  </div>
                  <h3 className="text-[18px] font-semibold text-neutral-900 mb-2">Programa asignado</h3>
                  <p className="text-[13px] text-neutral-400 mb-6">
                    El programa ha sido asignado a la empresa. Ahora aparecerá en su Studio Dashboard.
                  </p>
                  <button onClick={() => setShowAssignModal(false)} className="btn-primary px-5 py-2.5 text-[13px]">
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
