"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { pageStyles } from "./styles";
import { Icon } from "./icons";
import { 
  ProgramTemplate, Module, Resource, Activity, Milestone,
  MentorRequirements, MenteeRequirements, MatchingRules, SessionRules,
  ViewMode, ConfigTab, SessionDetail 
} from "./types";
import {
  defaultMentorReqs, defaultMenteeReqs, defaultMatchingRules, defaultSessionRules,
  getCategoryLabel, getCategoryColor, getAlgorithmLabel, getTotalSessions, getTotalResources, getTotalActivities,
  getNextMonday, formatDateSpanish, generateModuleContent, generateSessionPlan, generateSlug,
  PROGRAM_CATEGORIES, computeDurationFromDates,
  getTemplateSteps, getTemplateCompleteness, TemplateStepStatus
} from "./data";
import { apiFetch } from "@/lib/api";

// ═══════════════════════════════════════════════════════════════════
// CATEGORY PICKER — grilla scrolleable de 24 categorías temáticas
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// WIZARD — orden fijo de pasos + cálculo de hasta dónde se puede avanzar
// ═══════════════════════════════════════════════════════════════════
const STEP_ORDER: ConfigTab[] = ["general", "modules", "milestones", "mentors", "mentees", "matching", "sessions"];

/**
 * Al abrir el editor, desbloquea hasta el primer paso OBLIGATORIO incompleto
 * (fuerza a completarlo antes de seguir). Si ya está todo lo obligatorio
 * resuelto, desbloquea todos los pasos (edición libre para retocar detalles).
 */
function computeInitialUnlockedIndex(steps: TemplateStepStatus[]): number {
  const firstRequiredGap = steps.findIndex((s) => s.required && !s.complete);
  return firstRequiredGap === -1 ? steps.length - 1 : firstRequiredGap;
}

function CategoryPicker({ value, onChange }: { value: string[]; onChange: (keys: string[]) => void }) {
  const toggle = (key: string) => {
    if (value.includes(key)) onChange(value.filter((k) => k !== key));
    else onChange([...value, key]);
  };
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1 rounded-xl">
        {PROGRAM_CATEGORIES.map((cat) => {
          const active = value.includes(cat.key);
          const isPrimary = value[0] === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => toggle(cat.key)}
              className="relative flex items-center gap-2 rounded-xl py-2.5 px-3 text-left transition border-2"
              style={{
                background: active ? cat.bg : "#fafafa",
                color: active ? cat.fg : "#71717a",
                borderColor: active ? cat.fg : "transparent",
              }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: active ? cat.fg : "#d4d4d8" }} />
              <span className="text-[12px] font-medium leading-tight truncate">{cat.label}</span>
              {active && <Icon.Check className="w-3.5 h-3.5 flex-shrink-0 ml-auto" />}
              {isPrimary && (
                <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-neutral-900 text-white">
                  Principal
                </span>
              )}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-[11px] text-neutral-400 mt-2">
          {value.length} seleccionada{value.length === 1 ? "" : "s"} — la primera marcada como <b>Principal</b> define el color/insignia mostrada en las tarjetas.
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DATE RANGE -> DURATION — reemplaza el texto libre de duración por un
// rango de fechas real; la duración se calcula automáticamente.
// ═══════════════════════════════════════════════════════════════════
function DateRangeDuration({
  startDate, endDate, onChange, computedDuration, existingDuration,
}: {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  computedDuration: string;
  existingDuration?: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">Fecha de inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChange(e.target.value, endDate)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">Fecha de término</label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => onChange(startDate, e.target.value)}
            className="input-field"
          />
        </div>
      </div>
      {!startDate && !endDate && existingDuration && (
        <p className="text-[11.5px] text-neutral-500 mt-2 flex items-center gap-1.5">
          <Icon.Clock className="w-3 h-3" /> Duración actual: <span className="font-semibold text-neutral-700">{existingDuration}</span>
          <span className="text-neutral-400">— elige fechas para actualizarla</span>
        </p>
      )}
      {startDate && endDate && (
        computedDuration ? (
          <p className="text-[11.5px] text-neutral-500 mt-2 flex items-center gap-1.5">
            <Icon.Clock className="w-3 h-3" /> Duración: <span className="font-semibold text-neutral-700">{computedDuration}</span>
          </p>
        ) : (
          <p className="text-[11.5px] text-red-500 mt-2">La fecha de término debe ser posterior a la de inicio.</p>
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DELETE MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════
function DeleteModal({ countdown, setCountdown, confirmText, setConfirmText, templateName, onCancel, onDelete }: {
  countdown: number; setCountdown: (n: number) => void;
  confirmText: string; setConfirmText: (s: string) => void;
  templateName: string; onCancel: () => void; onDelete: () => void;
}) {
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, setCountdown]);

  const canDelete = countdown === 0 && confirmText === 'delete';
  const progress = ((5 - countdown) / 5) * 100;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onCancel} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 420, margin: '0 16px', background: '#fff',
        borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        animation: 'deleteModalIn 0.2s ease-out',
      }}>
        <style>{`@keyframes deleteModalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
        {/* Red top bar with progress */}
        <div style={{ height: 4, background: '#fee2e2', position: 'relative' }}>
          <div style={{ height: '100%', background: '#ef4444', width: `${progress}%`, transition: 'width 1s linear', borderRadius: '0 2px 2px 0' }} />
        </div>

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Icon + Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg style={{ width: 20, height: 20, color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111', margin: 0 }}>Eliminar programa</h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
                <span style={{ fontWeight: 500, color: '#374151' }}>{templateName}</span> ser\u00e1 eliminado permanentemente.
              </p>
            </div>
          </div>

          {/* Warning box */}
          <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <svg style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0, marginTop: 1 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 600 }}>Acci\u00f3n destructiva.</span> No se puede deshacer. La acci\u00f3n quedar\u00e1 registrada en el audit log con tu sesi\u00f3n.
              </div>
            </div>
          </div>

          {/* Type delete */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Escribe{' '}
              <code style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>delete</code>
              {' '}para confirmar
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toLowerCase())}
              placeholder="delete"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14, fontFamily: 'monospace',
                border: `1.5px solid ${confirmText === 'delete' ? '#22c55e' : '#e5e7eb'}`,
                background: confirmText === 'delete' ? '#f0fdf4' : '#fafafa',
                outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box',
                letterSpacing: 1,
              }}
            />
          </div>

          {/* Countdown + Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#e5e7eb')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#f3f4f6')}
            >
              Cancelar
            </button>
            <button
              onClick={canDelete ? onDelete : undefined}
              disabled={!canDelete}
              style={{
                flex: 1.2, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: canDelete ? '#ef4444' : '#e5e7eb', color: canDelete ? '#fff' : '#9ca3af',
                border: 'none', cursor: canDelete ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
              onMouseOver={(e) => { if (canDelete) e.currentTarget.style.background = '#dc2626'; }}
              onMouseOut={(e) => { if (canDelete) e.currentTarget.style.background = '#ef4444'; }}
            >
              {countdown > 0 ? (
                <>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', border: '2px solid #d1d5db',
                    borderTopColor: '#9ca3af', animation: 'spin 1s linear infinite',
                    display: 'inline-block',
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  Espera {countdown}s
                </>
              ) : confirmText !== 'delete' ? (
                'Escribe delete'
              ) : (
                <>
                  <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Eliminar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function ProgramsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<ProgramTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Modals
  const [selectedTemplate, setSelectedTemplate] = useState<ProgramTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteCountdown, setDeleteCountdown] = useState(5);

  // Edit tabs
  const [editTab, setEditTab] = useState<ConfigTab>("general");
  // Wizard: solo se puede avanzar hasta este índice (bloquea saltar pasos
  // obligatorios incompletos). Retroceder siempre está permitido.
  const [maxUnlockedIndex, setMaxUnlockedIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  // Expanded modules
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Tag input state
  const [tagInput, setTagInput] = useState("");
  // Resource type selector per module
  const [resTypeTab, setResTypeTab] = useState<Record<string, Resource["type"]>>({});
  const [linkInput, setLinkInput] = useState<Record<string, string>>({});
  const [linkNameInput, setLinkNameInput] = useState<Record<string, string>>({});

  // Dirty state for unsaved changes warning
  const [isDirty, setIsDirty] = useState(false);
  // Save status feedback
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // Loading state
  const [loading, setLoading] = useState(true);
  // New template modal: inline error + loading state (no silent failure)
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // Fecha de inicio/término -> se traducen a formData.duration (texto)
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

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

  // Track formData changes to mark dirty
  const setFormDataTracked = (updater: Partial<ProgramTemplate> | ((prev: Partial<ProgramTemplate>) => Partial<ProgramTemplate>)) => {
    setIsDirty(true);
    if (typeof updater === 'function') {
      setFormData(updater);
    } else {
      setFormData(updater);
    }
  };

  // Helper: strip File objects for API serialization
  const cleanForApi = (t: Partial<ProgramTemplate>) => {
    const { id, createdAt, updatedAt, ...rest } = t as any;
    return {
      ...rest,
      modules: (rest.modules || []).map((m: any) => ({
        ...m,
        resources: (m.resources || []).map(({ file, ...r }: any) => r),
      })),
    };
  };

  // ─── LOAD FROM API ON MOUNT ───
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await apiFetch(`${API_URL}/api/program-templates`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setTemplates(data);
          }
        }
      } catch (e) {
        console.warn("Could not fetch templates from API, using local defaults", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Deep-link ?edit=<templateId> — usado desde Asignaciones para saltar
  // directo a completar una plantilla incompleta (ver "Completar plantilla ahora"),
  // y desde la consola de Studio (pestaña Módulos) para editar el diseño en vivo.
  // ?step=<tab> fuerza el paso inicial del wizard; ?embed=1 se preserva en el
  // replace para que el layout de /dashboard siga sin chrome tras la limpieza de URL.
  useEffect(() => {
    if (loading || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (!editId) return;
    const target = templates.find(t => t.id === editId);
    if (target) {
      openEditModal(target);
      const step = params.get("step");
      if (step && (STEP_ORDER as string[]).includes(step)) {
        setEditTab(step as ConfigTab);
        setMaxUnlockedIndex(STEP_ORDER.length - 1);
      }
      const embed = params.get("embed") === "1";
      router.replace(embed ? "/dashboard/programs?embed=1" : "/dashboard/programs");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, templates]);

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

  // Handlers — all persist to backend API
  const handleCreate = async () => {
    setCreateError(null);

    const name = (formData.name || "").trim();
    const description = (formData.description || "").trim();
    const duration = (formData.duration || "").trim();
    if (!name) { setCreateError("Ponle un nombre a la plantilla."); return; }
    if (!description) { setCreateError("Agrega una descripción breve."); return; }
    if (!duration) { setCreateError("Indica la duración del programa."); return; }

    const payload = cleanForApi(formData);
    payload.slug = generateSlug(name);
    setCreating(true);
    try {
      const res = await apiFetch(`${API_URL}/api/program-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({} as any));
        throw new Error(errBody?.detail || `No se pudo crear la plantilla (error ${res.status}).`);
      }
      const created = await res.json();
      setTemplates(prev => [...prev, created]);
      setShowCreateModal(false);
      setIsDirty(false);
      resetForm();
      // Continuar directo en el editor completo, como promete el modal
      openEditModal(created);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "No se pudo crear la plantilla. Intenta nuevamente.");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    const payload = cleanForApi(formData);
    const selId = selectedTemplate.id;
    setSaveStatus('saving');
    try {
      const res = await apiFetch(`${API_URL}/api/program-templates/${selId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({} as any));
        throw new Error(errBody?.detail || "No se pudo guardar la plantilla.");
      }
      const updated = await res.json();
      setTemplates(prev => prev.map(t => t.id === selId ? updated : t));
      setSaveStatus('saved');
      // Solo cerramos si el guardado fue exitoso — si falla, el usuario ve el
      // error y conserva su trabajo en vez de perderlo en silencio.
      setShowEditModal(false);
      setSelectedTemplate(null);
      setIsDirty(false);
      resetForm();
    } catch (err) {
      setSaveStatus('error');
      setStepError(err instanceof Error ? err.message : "No se pudo guardar la plantilla.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`${API_URL}/api/program-templates/${id}`, { method: "DELETE" });
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch { /* ignore */ }
    setShowDeleteConfirm(null);
  };

  const handleDuplicate = async (template: ProgramTemplate) => {
    try {
      const res = await apiFetch(`${API_URL}/api/program-templates/${template.id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        const dup = await res.json();
        setTemplates(prev => [...prev, dup]);
      }
    } catch { /* ignore */ }
  };

  // Close edit modal — warn if unsaved changes
  const closeEditModal = () => {
    if (isDirty) {
      const ok = window.confirm('Tienes cambios sin guardar. ¿Seguro que quieres cerrar?');
      if (!ok) return;
    }
    setShowEditModal(false);
    setSelectedTemplate(null);
    setIsDirty(false);
    resetForm();
  };

  const openEditModal = (template: ProgramTemplate) => {
    setSelectedTemplate(template);
    // Deep copy to avoid reference issues
    setFormData(JSON.parse(JSON.stringify(template)));
    const initialIndex = computeInitialUnlockedIndex(getTemplateSteps(template));
    setEditTab(STEP_ORDER[initialIndex]);
    setMaxUnlockedIndex(initialIndex);
    setStepError(null);
    setExpandedModules([]);
    setIsDirty(false);
    setEditStartDate("");
    setEditEndDate("");
    setShowEditModal(true);
  };

  // ── Navegación del wizard: avanzar valida el paso actual, retroceder es libre ──
  const wizardGoNext = () => {
    const steps = getTemplateSteps(formData);
    const currentIndex = STEP_ORDER.indexOf(editTab);
    const currentStep = steps[currentIndex];
    if (currentStep.required && !currentStep.complete) {
      setStepError(`Completa "${currentStep.label}" antes de continuar — ${currentStep.hint}.`);
      return;
    }
    setStepError(null);
    const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
    setEditTab(STEP_ORDER[nextIndex]);
    setMaxUnlockedIndex((m) => Math.max(m, nextIndex));
  };

  const wizardGoPrev = () => {
    setStepError(null);
    const currentIndex = STEP_ORDER.indexOf(editTab);
    setEditTab(STEP_ORDER[Math.max(currentIndex - 1, 0)]);
  };

  const wizardFinalize = async () => {
    const steps = getTemplateSteps(formData);
    const missing = steps.filter((s) => s.required && !s.complete);
    if (missing.length > 0) {
      const gapId = missing[0].id as ConfigTab;
      const gapIndex = STEP_ORDER.indexOf(gapId);
      setEditTab(gapId);
      setMaxUnlockedIndex((m) => Math.max(m, gapIndex));
      setStepError(`Falta completar "${missing[0].label}" para poder crear un programa real con esta plantilla.`);
      return;
    }
    setStepError(null);
    await handleSave();
  };

  // Auto-save feedback timer
  useEffect(() => {
    if (saveStatus === 'saved' || saveStatus === 'error') {
      const t = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);

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
    setCreateStartDate("");
    setCreateEndDate("");
  };

  // Module handlers — all use functional updater to prevent stale state
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
    setFormDataTracked(prev => ({ ...prev, modules: [...(prev.modules || []), newModule] }));
    setExpandedModules(prev => [...prev, newModule.id]);
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setFormDataTracked(prev => ({
      ...prev,
      modules: (prev.modules || []).map(m => m.id === moduleId ? { ...m, ...updates } : m)
    }));
  };

  const deleteModule = (moduleId: string) => {
    setFormDataTracked(prev => ({
      ...prev,
      modules: (prev.modules || []).filter(m => m.id !== moduleId)
    }));
  };

  // Resource handlers — functional updaters
  const addResource = (moduleId: string) => {
    const newResource: Resource = {
      id: `res-${Date.now()}`,
      name: "",
      type: "pdf",
      url: "",
    };
    setFormDataTracked(prev => ({
      ...prev,
      modules: (prev.modules || []).map(m => 
        m.id === moduleId ? { ...m, resources: [...m.resources, newResource] } : m
      )
    }));
  };

  const updateResource = (moduleId: string, resourceId: string, updates: Partial<Resource>) => {
    setFormDataTracked(prev => ({
      ...prev,
      modules: (prev.modules || []).map(m => 
        m.id === moduleId ? {
          ...m,
          resources: m.resources.map(r => r.id === resourceId ? { ...r, ...updates } : r)
        } : m
      )
    }));
  };

  const deleteResource = (moduleId: string, resourceId: string) => {
    setFormDataTracked(prev => ({
      ...prev,
      modules: (prev.modules || []).map(m => 
        m.id === moduleId ? { ...m, resources: m.resources.filter(r => r.id !== resourceId) } : m
      )
    }));
  };

  // File upload handler - converts files to base64 for persistence
  const handleFileUpload = (moduleId: string, files: FileList | null, forceType?: Resource["type"]) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const selectedType = forceType || resTypeTab[moduleId] || "pdf";
    
    Promise.all(
      fileArray.map(
        (file) =>
          new Promise<Resource>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const autoType: Resource["type"] =
                selectedType !== "pdf" ? selectedType :
                file.type === "application/pdf" ? "pdf" :
                file.type.startsWith("video/") ? "video" :
                "document";
              resolve({
                id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: file.name.replace(/\.[^/.]+$/, ""),
                type: autoType,
                url: "",
                dataUrl: reader.result as string,
                fileName: file.name,
                size:
                  file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(0)} KB`
                    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              });
            };
            reader.readAsDataURL(file);
          })
      )
    ).then((newResources) => {
      setFormDataTracked((prev) => ({
        ...prev,
        modules: (prev.modules || []).map((m) =>
          m.id === moduleId
            ? { ...m, resources: [...m.resources, ...newResources] }
            : m
        ),
      }));
    });
  };

  // Add link/video URL resource
  const addLinkResource = (moduleId: string) => {
    const url = (linkInput[moduleId] || "").trim();
    if (!url) return;
    const selectedType = resTypeTab[moduleId] || "link";
    const name = (linkNameInput[moduleId] || "").trim() || url.replace(/^https?:\/\//, "").split("/")[0];
    const newResource: Resource = {
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      type: selectedType,
      url,
    };
    setFormDataTracked(prev => ({
      ...prev,
      modules: (prev.modules || []).map(m =>
        m.id === moduleId ? { ...m, resources: [...m.resources, newResource] } : m
      )
    }));
    setLinkInput(p => ({ ...p, [moduleId]: "" }));
    setLinkNameInput(p => ({ ...p, [moduleId]: "" }));
  };

  // Activity handlers — functional updaters
  const addActivity = (moduleId: string) => {
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      name: "",
      type: "exercise",
      duration: "",
      description: "",
    };
    setFormDataTracked(prev => ({
      ...prev,
      modules: (prev.modules || []).map(m => 
        m.id === moduleId ? { ...m, activities: [...m.activities, newActivity] } : m
      )
    }));
  };

  const updateActivity = (moduleId: string, activityId: string, updates: Partial<Activity>) => {
    setFormDataTracked(prev => ({
      ...prev,
      modules: (prev.modules || []).map(m => 
        m.id === moduleId ? {
          ...m,
          activities: m.activities.map(a => a.id === activityId ? { ...a, ...updates } : a)
        } : m
      )
    }));
  };

  const deleteActivity = (moduleId: string, activityId: string) => {
    setFormDataTracked(prev => ({
      ...prev,
      modules: (prev.modules || []).map(m => 
        m.id === moduleId ? { ...m, activities: m.activities.filter(a => a.id !== activityId) } : m
      )
    }));
  };

  // Milestone handlers — functional updaters
  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: `ms-${Date.now()}`,
      name: "",
      week: 1,
      description: "",
      deliverable: "",
    };
    setFormDataTracked(prev => ({ ...prev, milestones: [...(prev.milestones || []), newMilestone] }));
  };

  const updateMilestone = (milestoneId: string, updates: Partial<Milestone>) => {
    setFormDataTracked(prev => ({
      ...prev,
      milestones: (prev.milestones || []).map(m => m.id === milestoneId ? { ...m, ...updates } : m)
    }));
  };

  const deleteMilestone = (milestoneId: string) => {
    setFormDataTracked(prev => ({
      ...prev,
      milestones: (prev.milestones || []).filter(m => m.id !== milestoneId)
    }));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <div className="programs-page">
        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
            <div style={{ width: 24, height: 24, border: '3px solid #e5e7eb', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: '#6b7280', fontSize: 14 }}>Cargando plantillas...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {!loading && (<>
        {/* Header */}
        <header className="programs-header sticky top-0 z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="programs-eyebrow">Gestión</div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f0f0f', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  Programas Studio
                </h1>
                <p className="text-neutral-500 text-sm mt-0.5">
                  Catálogo de diseños reutilizables
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button className="btn-secondary flex items-center gap-2 text-xs sm:text-sm">
                  <Icon.Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
                <button
                  onClick={() => router.push("/dashboard/programs/assignments?assign=1")}
                  className="btn-secondary flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Icon.Link className="w-4 h-4" />
                  <span className="hidden sm:inline">Asignar programa</span>
                </button>
                <button
                  onClick={() => { resetForm(); setCreateError(null); setShowCreateModal(true); }}
                  className="btn-primary flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Icon.Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Crear programas</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 w-full">
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
          <div className="glass-card p-3 sm:p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
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

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
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
                <div className="flex items-center gap-1 border-l border-neutral-200 pl-3 sm:pl-4 flex-shrink-0">
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

          {/* Templates Grid View - Responsive Cards */}
          {viewMode === "grid" && (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="program-card p-3 sm:p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                    {/* Left: Badges + Title + Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="badge" style={{ background: getCategoryColor(template.category).bg, color: getCategoryColor(template.category).fg }}>
                          {getCategoryLabel(template.category)}
                        </span>
                        <span className={`badge badge-${template.status}`}>
                          {template.status === "published" ? "Publicada" : "Borrador"}
                        </span>
                        {(() => {
                          const { requiredComplete, percent } = getTemplateCompleteness(template);
                          return requiredComplete ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              <Icon.Check className="w-2.5 h-2.5" /> Lista
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                              {percent}% completa
                            </span>
                          );
                        })()}
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-neutral-900">{template.name}</h3>
                      <p className="text-neutral-500 text-xs sm:text-sm truncate">{template.description}</p>
                    </div>

                    {/* Center: Stats */}
                    <div className="flex items-center gap-4 sm:gap-6 text-center flex-shrink-0">
                      <div className="px-2 sm:px-4">
                        <p className="text-xs sm:text-sm font-semibold text-neutral-900">{template.duration}</p>
                        <p className="text-xs text-neutral-400">Duración</p>
                      </div>
                      <div className="px-2 sm:px-4 border-l border-neutral-100">
                        <p className="text-xs sm:text-sm font-semibold text-neutral-900">{template.modules.length}</p>
                        <p className="text-xs text-neutral-400">Módulos</p>
                      </div>
                      <div className="px-2 sm:px-4 border-l border-neutral-100">
                        <p className="text-xs sm:text-sm font-semibold text-neutral-900">{getTotalSessions(template.modules)}</p>
                        <p className="text-xs text-neutral-400">Sesiones</p>
                      </div>
                    </div>

                    {/* Right: Config Summary - hidden on small screens */}
                    <div className="hidden xl:block text-xs text-neutral-500 flex-shrink-0 w-48">
                      <p>• Máx {template.mentorRequirements.maxMentees} mentees/mentor</p>
                      <p>• {template.sessionRules.frequencyPerMonth} sesiones/mes ({template.sessionRules.defaultDuration} min)</p>
                      <p>• Matching: {getAlgorithmLabel(template.matchingRules.algorithm)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 lg:pl-4 lg:border-l border-neutral-100">
                      <button
                        onClick={() => router.push(`/dashboard/programs/preview/${template.slug}`)}
                        className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
                        title="Vista previa"
                      >
                        <Icon.Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </button>
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
                <div key={template.id} className="program-row flex-col sm:flex-row !gap-3 sm:!gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="badge" style={{ background: getCategoryColor(template.category).bg, color: getCategoryColor(template.category).fg }}>
                        {getCategoryLabel(template.category)}
                      </span>
                      <span className={`badge badge-${template.status}`}>
                        {template.status === "published" ? "Publicada" : "Borrador"}
                      </span>
                      {(() => {
                        const { requiredComplete, percent } = getTemplateCompleteness(template);
                        return requiredComplete ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            <Icon.Check className="w-2.5 h-2.5" /> Lista
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                            {percent}% completa
                          </span>
                        );
                      })()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate text-sm sm:text-base">{template.name}</h3>
                      <p className="text-xs sm:text-sm text-neutral-500 truncate">{template.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-8 flex-shrink-0 text-center">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{template.duration}</p>
                      <p className="text-xs text-neutral-500">Duración</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{template.modules.length}</p>
                      <p className="text-xs text-neutral-500">Módulos</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{getTotalSessions(template.modules)}</p>
                      <p className="text-xs text-neutral-500">Sesiones</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-neutral-900">{getTotalResources(template.modules)}</p>
                      <p className="text-xs text-neutral-500">Recursos</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => router.push(`/dashboard/programs/preview/${template.slug}`)}
                      className="btn-ghost" title="Vista previa"
                    >
                      <Icon.Eye className="w-4 h-4" />
                    </button>
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
          <div className="modal-overlay" onClick={() => !creating && setShowCreateModal(false)}>
            <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Icon.Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-900">Nueva plantilla</h2>
                      <p className="text-xs text-neutral-500 mt-0.5">Diseña un programa reutilizable para tus cuentas</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !creating && setShowCreateModal(false)}
                    disabled={creating}
                    className="p-2 hover:bg-neutral-100 rounded-lg disabled:opacity-40"
                  >
                    <Icon.X className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Nombre del programa</label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej. Leadership Accelerator"
                    autoFocus
                    className="input-field"
                  />
                  {formData.name?.trim() && (
                    <p className="text-[11px] text-neutral-400 mt-1.5">
                      URL: <code className="text-neutral-500">/{generateSlug(formData.name)}</code>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Descripción</label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="¿De qué se trata este programa y a quién está dirigido?"
                    className="textarea-field"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Categorías (puedes elegir más de una)</label>
                  <CategoryPicker
                    value={formData.categories && formData.categories.length ? formData.categories : (formData.category ? [formData.category] : [])}
                    onChange={(keys) => setFormData({ ...formData, categories: keys, category: keys[0] || "leadership" })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Duración del programa</label>
                  <DateRangeDuration
                    startDate={createStartDate}
                    endDate={createEndDate}
                    computedDuration={computeDurationFromDates(createStartDate, createEndDate)}
                    onChange={(start, end) => {
                      setCreateStartDate(start);
                      setCreateEndDate(end);
                      setFormData({ ...formData, duration: computeDurationFromDates(start, end) });
                    }}
                  />
                </div>

                {createError && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                    <Icon.Flag className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{createError}</p>
                  </div>
                )}

                <div className="flex items-start gap-2.5 p-3.5 bg-neutral-50 rounded-xl">
                  <Icon.Puzzle className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-neutral-600">
                    Al crear, pasarás directo al editor completo para agregar módulos, recursos, actividades y configurar requisitos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-6 pt-4 border-t border-neutral-100">
                <button onClick={() => setShowCreateModal(false)} disabled={creating} className="btn-secondary flex-1 disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="btn-primary flex-1 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Creando…
                    </>
                  ) : (
                    <>
                      <Icon.Plus className="w-4 h-4" />
                      Crear y continuar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal - Full Editor */}
        {showEditModal && selectedTemplate && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 sm:p-6 border-b border-neutral-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-600 mb-0.5">Plantilla</div>
                    <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 truncate">{formData.name}</h2>
                    <p className="text-sm text-neutral-500">{isDirty ? 'Cambios sin guardar' : 'Editor paso a paso'}</p>
                  </div>
                  <button
                    onClick={closeEditModal}
                    className="p-2 hover:bg-neutral-100 rounded-lg flex-shrink-0"
                  >
                    <Icon.X className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>

                {(() => {
                  const steps: TemplateStepStatus[] = getTemplateSteps(formData);
                  const stepIcons: Record<string, any> = {
                    general: Icon.Settings, modules: Icon.Book, milestones: Icon.Flag,
                    mentors: Icon.Award, mentees: Icon.Users, matching: Icon.Link, sessions: Icon.Calendar,
                  };
                  const doneCount = steps.filter((s) => s.complete).length;
                  const percent = Math.round((doneCount / steps.length) * 100);
                  const requiredMissing = steps.filter((s) => s.required && !s.complete);
                  const currentIndex = STEP_ORDER.indexOf(editTab);
                  return (
                    <>
                      {/* Progreso general */}
                      <div className="flex items-center gap-3 mb-1">
                        <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%`, background: requiredMissing.length ? "#f59e0b" : "#16a34a" }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-500 flex-shrink-0">{percent}% completo</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mb-3">Paso {currentIndex + 1} de {steps.length}</p>

                      {/* Aviso: sin esto, el programa se crea vacío */}
                      {requiredMissing.length > 0 && (
                        <div className="flex items-start gap-2 mb-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                          <Icon.Flag className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-[11.5px] text-amber-800">
                            Falta completar <b>{requiredMissing.map((s) => s.label).join(" y ")}</b> — sin esto, al asignar
                            esta plantilla el programa se creará sin actividades reales.
                          </p>
                        </div>
                      )}

                      {/* Pasos — retroceder siempre se puede; avanzar está bloqueado
                          más allá de maxUnlockedIndex hasta resolver lo obligatorio */}
                      <div className="tab-nav -mx-4 sm:-mx-6 px-0 overflow-x-auto scrollbar-hide">
                        {steps.map((step, i) => {
                          const StepIcon = stepIcons[step.id];
                          const locked = i > maxUnlockedIndex;
                          return (
                            <button
                              key={step.id}
                              onClick={() => { if (!locked) { setEditTab(step.id as ConfigTab); setStepError(null); } }}
                              disabled={locked}
                              title={locked ? "Completa los pasos anteriores primero" : step.hint}
                              className={`tab-btn flex items-center gap-1.5 ${editTab === step.id ? "active" : ""} ${locked ? "opacity-40 cursor-not-allowed" : ""}`}
                            >
                              {step.complete ? (
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                                  <Icon.Check className="w-2 h-2" />
                                </span>
                              ) : locked ? (
                                <Icon.Lock className="w-3 h-3 flex-shrink-0" />
                              ) : (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                                  style={{ borderColor: step.required ? "#f59e0b" : "#d4d4d8" }}
                                />
                              )}
                              <StepIcon className="w-3.5 h-3.5" />
                              {step.label}
                              {step.required && !step.complete && <span className="text-amber-600 font-bold">*</span>}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
                {/* General Tab */}
                {editTab === "general" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Nombre *</label>
                      <input
                        type="text"
                        value={formData.name || ""}
                        onChange={(e) => setFormDataTracked({ ...formData, name: e.target.value })}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Descripción *</label>
                      <textarea
                        value={formData.description || ""}
                        onChange={(e) => setFormDataTracked({ ...formData, description: e.target.value })}
                        className="textarea-field"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Categorías (puedes elegir más de una)</label>
                      <CategoryPicker
                        value={formData.categories && formData.categories.length ? formData.categories : (formData.category ? [formData.category] : [])}
                        onChange={(keys) => setFormDataTracked({ ...formData, categories: keys, category: keys[0] || "leadership" })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Duración</label>
                        <DateRangeDuration
                          startDate={editStartDate}
                          endDate={editEndDate}
                          existingDuration={formData.duration}
                          computedDuration={computeDurationFromDates(editStartDate, editEndDate)}
                          onChange={(start, end) => {
                            setEditStartDate(start);
                            setEditEndDate(end);
                            const computed = computeDurationFromDates(start, end);
                            if (computed) setFormDataTracked({ ...formData, duration: computed });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Estado</label>
                        <select
                          value={formData.status || "draft"}
                          onChange={(e) => setFormDataTracked({ ...formData, status: e.target.value as ProgramTemplate["status"] })}
                          className="select-field"
                        >
                          <option value="draft">Borrador</option>
                          <option value="published">Publicada</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Tags (presiona Enter para agregar)</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fafafa', minHeight: 42, alignItems: 'center' }}>
                        {(formData.tags || []).map((tag, i) => {
                          const colors = [
                            { bg: '#dbeafe', text: '#1e40af' },
                            { bg: '#d1fae5', text: '#065f46' },
                            { bg: '#fef3c7', text: '#92400e' },
                            { bg: '#ede9fe', text: '#5b21b6' },
                            { bg: '#fce7f3', text: '#9d174d' },
                            { bg: '#e0e7ff', text: '#3730a3' },
                            { bg: '#ccfbf1', text: '#115e59' },
                          ];
                          const c = colors[i % colors.length];
                          return (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500, background: c.bg, color: c.text }}>
                              {tag}
                              <button
                                type="button"
                                onClick={() => setFormDataTracked({ ...formData, tags: (formData.tags || []).filter((_, idx) => idx !== i) })}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, opacity: 0.6, fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 2 }}
                              >×</button>
                            </span>
                          );
                        })}
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = tagInput.trim();
                              if (val && !(formData.tags || []).includes(val)) {
                                setFormDataTracked({ ...formData, tags: [...(formData.tags || []), val] });
                              }
                              setTagInput('');
                            } else if (e.key === 'Backspace' && !tagInput && (formData.tags || []).length > 0) {
                              setFormDataTracked({ ...formData, tags: (formData.tags || []).slice(0, -1) });
                            }
                          }}
                          placeholder={((formData.tags || []).length === 0) ? 'liderazgo, soft skills...' : ''}
                          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, flex: 1, minWidth: 80, padding: 0 }}
                        />
                      </div>
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="sm:col-span-2">
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              </div>

                              {/* Resource Type Tabs */}
                              {(() => {
                                const curType = resTypeTab[module.id] || "pdf";
                                const typeTabs: { key: Resource["type"]; label: string; icon: any; color: string; bg: string }[] = [
                                  { key: "pdf", label: "PDF", icon: Icon.Document, color: "text-red-600", bg: "bg-red-50 border-red-200" },
                                  { key: "video", label: "Video", icon: Icon.Video, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
                                  { key: "template", label: "Template", icon: Icon.Folder, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
                                  { key: "document", label: "Documento", icon: Icon.File, color: "text-neutral-600", bg: "bg-neutral-50 border-neutral-200" },
                                  { key: "link", label: "Link", icon: Icon.Link, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
                                ];
                                const activeTab = typeTabs.find(t => t.key === curType) || typeTabs[0];
                                const isUrlType = curType === "link" || curType === "video";
                                const fileAccept: Record<string, string> = {
                                  pdf: ".pdf",
                                  video: ".mp4,.mov,.avi,.webm,.mkv",
                                  template: ".doc,.docx,.xlsx,.xls,.pptx,.ppt,.csv",
                                  document: ".doc,.docx,.txt,.rtf,.xlsx,.xls,.pptx,.ppt,.csv,.pdf",
                                };

                                return (
                                  <div className="mb-3">
                                    {/* Type selector pills */}
                                    <div className="flex gap-1.5 mb-3 flex-wrap">
                                      {typeTabs.map(t => (
                                        <button
                                          key={t.key}
                                          type="button"
                                          onClick={() => setResTypeTab(p => ({ ...p, [module.id]: t.key }))}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                            curType === t.key
                                              ? `${t.bg} ${t.color} shadow-sm`
                                              : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                                          }`}
                                        >
                                          <t.icon className="w-3.5 h-3.5" />
                                          {t.label}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Upload / Input area based on type */}
                                    {curType === "link" ? (
                                      /* LINK INPUT */
                                      <div className={`rounded-xl border-2 border-dashed p-4 ${activeTab.bg} transition-all`}>
                                        <div className="flex items-center gap-2 mb-3">
                                          <Icon.Link className={`w-5 h-5 ${activeTab.color}`} />
                                          <span className={`text-sm font-semibold ${activeTab.color}`}>Agregar enlace</span>
                                        </div>
                                        <div className="space-y-2">
                                          <input
                                            type="text"
                                            placeholder="Nombre del recurso (opcional)"
                                            value={linkNameInput[module.id] || ""}
                                            onChange={(e) => setLinkNameInput(p => ({ ...p, [module.id]: e.target.value }))}
                                            className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 bg-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
                                          />
                                          <div className="flex gap-2">
                                            <input
                                              type="url"
                                              placeholder="https://ejemplo.com/recurso"
                                              value={linkInput[module.id] || ""}
                                              onChange={(e) => setLinkInput(p => ({ ...p, [module.id]: e.target.value }))}
                                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLinkResource(module.id); } }}
                                              className="flex-1 text-sm px-3 py-2 rounded-lg border border-neutral-200 bg-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => addLinkResource(module.id)}
                                              disabled={!(linkInput[module.id] || "").trim()}
                                              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                                            >
                                              <Icon.Plus className="w-3.5 h-3.5" />
                                              Agregar
                                            </button>
                                          </div>
                                          {/* Link Preview */}
                                          {(linkInput[module.id] || "").trim() && /^https?:\/\//i.test(linkInput[module.id] || "") && (
                                            <div className="mt-2 rounded-lg border border-indigo-200 bg-white overflow-hidden">
                                              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-indigo-100">
                                                <Icon.Eye className="w-3.5 h-3.5 text-indigo-500" />
                                                <span className="text-xs font-medium text-indigo-600">Vista previa</span>
                                              </div>
                                              <div className="p-3">
                                                <a href={linkInput[module.id]} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline break-all flex items-center gap-1.5">
                                                  <Icon.Link className="w-3.5 h-3.5 flex-shrink-0" />
                                                  {linkInput[module.id]}
                                                </a>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : curType === "video" ? (
                                      /* VIDEO: URL or file */
                                      <div className={`rounded-xl border-2 border-dashed p-4 ${activeTab.bg} transition-all`}>
                                        <div className="flex items-center gap-2 mb-3">
                                          <Icon.Video className={`w-5 h-5 ${activeTab.color}`} />
                                          <span className={`text-sm font-semibold ${activeTab.color}`}>Video</span>
                                        </div>
                                        {/* Toggle: URL or Upload */}
                                        <div className="flex gap-2 mb-3">
                                          <button
                                            type="button"
                                            onClick={() => setLinkInput(p => ({ ...p, [`${module.id}_vmode`]: "url" }))}
                                            className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-all ${
                                              (linkInput[`${module.id}_vmode`] || "url") === "url"
                                                ? "bg-blue-100 border-blue-300 text-blue-700"
                                                : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                                            }`}
                                          >
                                            URL de video
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setLinkInput(p => ({ ...p, [`${module.id}_vmode`]: "file" }))}
                                            className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-all ${
                                              linkInput[`${module.id}_vmode`] === "file"
                                                ? "bg-blue-100 border-blue-300 text-blue-700"
                                                : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                                            }`}
                                          >
                                            Subir archivo
                                          </button>
                                        </div>

                                        {(linkInput[`${module.id}_vmode`] || "url") === "url" ? (
                                          <div className="space-y-2">
                                            <input
                                              type="text"
                                              placeholder="Nombre del video (opcional)"
                                              value={linkNameInput[module.id] || ""}
                                              onChange={(e) => setLinkNameInput(p => ({ ...p, [module.id]: e.target.value }))}
                                              className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 bg-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                                            />
                                            <div className="flex gap-2">
                                              <input
                                                type="url"
                                                placeholder="https://youtube.com/watch?v=... o URL de video"
                                                value={linkInput[module.id] || ""}
                                                onChange={(e) => setLinkInput(p => ({ ...p, [module.id]: e.target.value }))}
                                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLinkResource(module.id); } }}
                                                className="flex-1 text-sm px-3 py-2 rounded-lg border border-neutral-200 bg-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => addLinkResource(module.id)}
                                                disabled={!(linkInput[module.id] || "").trim()}
                                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                                              >
                                                <Icon.Plus className="w-3.5 h-3.5" />
                                                Agregar
                                              </button>
                                            </div>
                                            {/* Video preview */}
                                            {(() => {
                                              const vUrl = (linkInput[module.id] || "").trim();
                                              if (!vUrl) return null;
                                              const ytMatch = vUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
                                              const vimeoMatch = vUrl.match(/vimeo\.com\/(\d+)/);
                                              if (ytMatch) return (
                                                <div className="mt-2 rounded-lg overflow-hidden border border-blue-200 bg-black">
                                                  <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}`} width="100%" height="200" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Vista previa" className="block" />
                                                </div>
                                              );
                                              if (vimeoMatch) return (
                                                <div className="mt-2 rounded-lg overflow-hidden border border-blue-200 bg-black">
                                                  <iframe src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} width="100%" height="200" frameBorder="0" allow="autoplay; fullscreen" allowFullScreen title="Vista previa" className="block" />
                                                </div>
                                              );
                                              if (/^https?:\/\//i.test(vUrl)) return (
                                                <div className="mt-2 rounded-lg border border-blue-200 bg-white p-3">
                                                  <a href={vUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all flex items-center gap-1.5">
                                                    <Icon.Play className="w-4 h-4 flex-shrink-0" />
                                                    {vUrl}
                                                  </a>
                                                </div>
                                              );
                                              return null;
                                            })()}
                                          </div>
                                        ) : (
                                          /* Video file upload */
                                          <div
                                            className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 p-5 text-center cursor-pointer hover:bg-blue-50 transition-all"
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('!bg-blue-100'); }}
                                            onDragLeave={(e) => { e.currentTarget.classList.remove('!bg-blue-100'); }}
                                            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('!bg-blue-100'); handleFileUpload(module.id, e.dataTransfer.files, "video"); }}
                                            onClick={() => {
                                              const input = document.createElement('input');
                                              input.type = 'file'; input.accept = '.mp4,.mov,.avi,.webm,.mkv'; input.multiple = true;
                                              input.onchange = (ev) => handleFileUpload(module.id, (ev.target as HTMLInputElement).files, "video");
                                              input.click();
                                            }}
                                          >
                                            <Icon.Upload className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                            <p className="text-xs text-blue-600 font-medium">Arrastra video aquí o haz clic</p>
                                            <p className="text-xs text-blue-400 mt-1">MP4, MOV, AVI, WebM</p>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      /* FILE UPLOAD: PDF, Template, Document */
                                      <div
                                        className={`upload-zone mb-0 ${activeTab.bg} !border-2`}
                                        style={{ borderColor: curType === 'pdf' ? '#fca5a5' : curType === 'template' ? '#fcd34d' : '#d4d4d4' }}
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                        onDragLeave={(e) => { e.currentTarget.classList.remove('drag-over'); }}
                                        onDrop={(e) => {
                                          e.preventDefault();
                                          e.currentTarget.classList.remove('drag-over');
                                          handleFileUpload(module.id, e.dataTransfer.files, curType);
                                        }}
                                        onClick={() => {
                                          const input = document.createElement('input');
                                          input.type = 'file'; input.multiple = true;
                                          input.accept = fileAccept[curType] || '*';
                                          input.onchange = (ev) => handleFileUpload(module.id, (ev.target as HTMLInputElement).files, curType);
                                          input.click();
                                        }}
                                      >
                                        <activeTab.icon className={`w-6 h-6 ${activeTab.color} mx-auto mb-2`} />
                                        <p className="text-xs text-neutral-600">
                                          Arrastra {curType === 'pdf' ? 'PDFs' : curType === 'template' ? 'plantillas' : 'documentos'} aquí o{' '}
                                          <span className="text-neutral-900 font-medium">haz clic para subir</span>
                                        </p>
                                        <p className="text-xs text-neutral-400 mt-1">
                                          {curType === 'pdf' ? 'PDF' : curType === 'template' ? 'DOC, DOCX, XLSX, PPTX, CSV' : 'DOC, DOCX, TXT, XLSX, PPTX, PDF'}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Resource List */}
                              {module.resources.length > 0 && (
                                <div className="space-y-2 mt-3">
                                  {module.resources.map((resource) => {
                                    const typeConf: Record<string, { icon: any; color: string; bg: string; label: string }> = {
                                      pdf: { icon: Icon.Document, color: "text-red-600", bg: "bg-red-50", label: "PDF" },
                                      video: { icon: Icon.Video, color: "text-blue-600", bg: "bg-blue-50", label: "VIDEO" },
                                      template: { icon: Icon.Folder, color: "text-amber-600", bg: "bg-amber-50", label: "TEMPLATE" },
                                      document: { icon: Icon.File, color: "text-neutral-600", bg: "bg-neutral-100", label: "DOC" },
                                      link: { icon: Icon.Link, color: "text-indigo-600", bg: "bg-indigo-50", label: "LINK" },
                                    };
                                    const rc = typeConf[resource.type] || typeConf.document;
                                    const RIcon = rc.icon;
                                    return (
                                      <div key={resource.id} className="resource-item group">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <div className={`w-9 h-9 rounded-lg ${rc.bg} flex items-center justify-center flex-shrink-0`}>
                                            <RIcon className={`w-4 h-4 ${rc.color}`} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <input
                                              type="text"
                                              value={resource.name}
                                              onChange={(e) => updateResource(module.id, resource.id, { name: e.target.value })}
                                              className="text-sm font-medium text-neutral-900 bg-transparent border-none outline-none w-full p-0"
                                              placeholder="Nombre del recurso"
                                            />
                                            <p className="text-xs text-neutral-400 truncate">
                                              {resource.type === 'link' || resource.type === 'video'
                                                ? (resource.url ? (
                                                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">{resource.url}</a>
                                                  ) : 'Sin URL')
                                                : (resource.fileName || 'Sin archivo')}
                                              {resource.size && ` • ${resource.size}`}
                                            </p>
                                          </div>
                                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${rc.bg} ${rc.color}`}>
                                            {rc.label}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => deleteResource(module.id, resource.id)}
                                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                        >
                                          <Icon.X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
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
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                      <input
                                        type="text"
                                        value={activity.name}
                                        onChange={(e) => updateActivity(module.id, activity.id, { name: e.target.value })}
                                        className="input-field text-xs sm:col-span-2 lg:col-span-2"
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
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="sm:col-span-2 lg:col-span-2">
                            <label className="block text-[11px] font-medium text-neutral-500 mb-1">Nombre del hito</label>
                            <input
                              type="text"
                              value={milestone.name}
                              onChange={(e) => updateMilestone(milestone.id, { name: e.target.value })}
                              className="input-field text-sm w-full"
                              placeholder="Ej: Cierre del módulo 1"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-neutral-500 mb-1">Semana</label>
                            <input
                              type="number"
                              value={milestone.week}
                              onChange={(e) => updateMilestone(milestone.id, { week: Number(e.target.value) })}
                              className="input-field text-sm w-full"
                              placeholder="1"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-neutral-500 mb-1">Entregable</label>
                            <input
                              type="text"
                              value={milestone.deliverable}
                              onChange={(e) => updateMilestone(milestone.id, { deliverable: e.target.value })}
                              className="input-field text-sm w-full"
                              placeholder="Ej: Informe de avance"
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            <label className="block text-[11px] font-medium text-neutral-500 mb-1">Descripción</label>
                            <input
                              type="text"
                              value={milestone.description}
                              onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                              className="input-field text-sm w-full"
                              placeholder="Descripción breve del hito"
                            />
                          </div>
                          <button
                            onClick={() => deleteMilestone(milestone.id)}
                            className="btn-ghost text-red-500 hover:bg-red-50 self-end"
                            title="Eliminar hito"
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
                        onChange={(e) => setFormDataTracked({
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
                        onChange={(e) => setFormDataTracked({
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
                        onChange={(e) => setFormDataTracked({
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
                        onClick={() => setFormDataTracked({
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
                        onClick={() => setFormDataTracked({
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
                        onClick={() => setFormDataTracked({
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
                        onChange={(e) => setFormDataTracked({
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
                        onClick={() => setFormDataTracked({
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
                        onClick={() => setFormDataTracked({
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
                        onChange={(e) => setFormDataTracked({
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
                        onChange={(e) => setFormDataTracked({
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
                        onClick={() => setFormDataTracked({
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
                              onChange={(e) => setFormDataTracked({
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
                              onChange={(e) => setFormDataTracked({
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
                              onChange={(e) => setFormDataTracked({
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
                              onChange={(e) => setFormDataTracked({
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
                        onChange={(e) => setFormDataTracked({
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
                        onChange={(e) => setFormDataTracked({
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
                        onClick={() => setFormDataTracked({
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
                        onChange={(e) => setFormDataTracked({
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
                        onChange={(e) => setFormDataTracked({
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
                        onClick={() => setFormDataTracked({
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
                        onClick={() => setFormDataTracked({
                          ...formData,
                          sessionRules: { ...formData.sessionRules!, requireFeedback: !formData.sessionRules?.requireFeedback }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer — navegación de wizard: Anterior / Siguiente (valida) / Finalizar */}
              <div className="p-4 sm:p-6 border-t border-neutral-100 bg-neutral-50">
                {stepError && (
                  <div className="flex items-start gap-2 mb-3 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                    <Icon.Flag className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-red-700">{stepError}</p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button onClick={closeEditModal} className="btn-secondary">Cancelar</button>
                    <button onClick={handleSave} className="text-[12px] text-neutral-400 hover:text-neutral-600 underline">
                      Guardar borrador y salir
                    </button>
                    {saveStatus === 'saved' && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Icon.Check className="w-3 h-3" /> Guardado
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-xs text-red-600">Error al guardar</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {STEP_ORDER.indexOf(editTab) > 0 && (
                      <button onClick={wizardGoPrev} className="btn-secondary flex items-center gap-2">
                        <Icon.ChevronRight className="w-4 h-4 rotate-180" />
                        Anterior
                      </button>
                    )}
                    {STEP_ORDER.indexOf(editTab) < STEP_ORDER.length - 1 ? (
                      <button onClick={wizardGoNext} className="btn-primary flex items-center gap-2">
                        Siguiente
                        <Icon.ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={wizardFinalize} className="btn-primary flex items-center gap-2">
                        <Icon.Check className="w-4 h-4" />
                        Finalizar y guardar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <DeleteModal
            countdown={deleteCountdown}
            setCountdown={setDeleteCountdown}
            confirmText={deleteConfirmText}
            setConfirmText={setDeleteConfirmText}
            templateName={templates.find(t => t.id === showDeleteConfirm)?.name || ''}
            onCancel={() => { setShowDeleteConfirm(null); setDeleteConfirmText(""); setDeleteCountdown(5); }}
            onDelete={() => { handleDelete(showDeleteConfirm); setDeleteConfirmText(""); setDeleteCountdown(5); }}
          />
        )}

        </>)}
      </div>
    </>
  );
}
