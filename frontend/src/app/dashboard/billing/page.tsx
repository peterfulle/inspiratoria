"use client";

import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// STYLES — same visual language as accounts & dashboard
// ═══════════════════════════════════════════════════════════════════

const pageStyles = `
  .bill-page {
    min-height: 100vh;
    background: #ffffff;
    color: #0f0f0f;
  }
  .bill-header {
    background: #ffffff;
    border-bottom: 1px solid #f0f0f0;
  }
  .bill-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #b08a00;
    margin-bottom: 0.4rem;
  }
  .bill-eyebrow::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #F5C800;
    display: inline-block;
  }
  .bill-stat {
    background: white;
    border: 1px solid #ebebeb;
    border-radius: 14px;
    padding: 20px 22px;
    transition: box-shadow 0.18s, transform 0.18s;
    position: relative;
    overflow: hidden;
  }
  .bill-stat:hover {
    box-shadow: 0 6px 24px rgba(0,0,0,0.07);
    transform: translateY(-2px);
  }
  .bill-stat.featured {
    border-color: rgba(245,200,0,0.4);
    background: linear-gradient(145deg, #fffdf0 0%, #fffbe8 100%);
  }
  .bill-stat.featured::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: #F5C800;
    border-radius: 14px 14px 0 0;
  }
  .bill-card {
    background: white;
    border: 1px solid #ebebeb;
    border-radius: 16px;
    overflow: hidden;
  }
  .bill-tab {
    padding: 0.4rem 0.85rem;
    font-size: 0.78rem;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.12s ease;
    color: #999;
    cursor: pointer;
    background: none;
    border: none;
    white-space: nowrap;
  }
  .bill-tab.active {
    background: #0f0f0f;
    color: #ffffff;
    font-weight: 700;
  }
  .bill-tab:hover:not(.active) {
    color: #0f0f0f;
    background: #f5f5f5;
  }
  .bill-row {
    border-bottom: 1px solid #f3f4f6;
    transition: background 0.15s ease;
    cursor: pointer;
  }
  .bill-row:hover {
    background: #f9fafb;
  }
  .bill-badge {
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .bill-badge-active { background: #dcfce7; color: #16a34a; }
  .bill-badge-trial { background: #dbeafe; color: #2563eb; }
  .bill-badge-overdue { background: #fee2e2; color: #dc2626; }
  .bill-badge-cancelled { background: #f3f4f6; color: #6b7280; }
  .bill-badge-pending { background: #fef3c7; color: #d97706; }
  .bill-badge-paid { background: #dcfce7; color: #16a34a; }
  .bill-badge-starter { background: #e0f2fe; color: #0369a1; }
  .bill-badge-growth { background: #dbeafe; color: #2563eb; }
  .bill-badge-enterprise { background: #f3e8ff; color: #7c3aed; }
  .bill-badge-trial-plan { background: #fef3c7; color: #d97706; }
  .bill-btn {
    padding: 0.45rem 0.9rem;
    border-radius: 10px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .bill-btn-primary {
    background: #0f0f0f;
    color: white;
  }
  .bill-btn-primary:hover {
    background: #222;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .bill-btn-secondary {
    background: white;
    color: #0f0f0f;
    border: 1px solid #e8e8e8;
  }
  .bill-btn-secondary:hover {
    background: #f5f5f5;
    border-color: #ccc;
  }
  .bill-btn-sm {
    padding: 0.3rem 0.65rem;
    font-size: 0.72rem;
    border-radius: 8px;
  }
  .bill-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    animation: fadeIn 0.15s ease;
  }
  .bill-modal {
    background: white;
    border-radius: 16px;
    max-width: 720px;
    width: 94%;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .bill-input {
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    outline: none;
    transition: border-color 0.15s ease;
  }
  .bill-input:focus {
    border-color: #9ca3af;
    box-shadow: 0 0 0 2px rgba(156,163,175,0.1);
  }
  .bill-select {
    padding: 8px 32px 8px 12px;
    font-size: 13px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;
    appearance: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
  }
  .bill-detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .bill-detail-item {
    padding: 14px;
    background: #f9fafb;
    border-radius: 10px;
  }
  .bill-detail-item label {
    display: block;
    font-size: 11px;
    color: #9ca3af;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  .bill-detail-item span {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
  }
  .bill-role-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .bill-role-bar:last-child {
    border-bottom: none;
  }
  .bill-role-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .bill-plan-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: 28px;
    transition: all 0.25s ease;
    position: relative;
  }
  .bill-plan-card:hover {
    border-color: #1a1a1a;
    transform: translateY(-3px);
    box-shadow: 0 16px 32px rgba(0,0,0,0.06);
  }
  .bill-plan-card.popular {
    border-color: #1a1a1a;
  }
  .bill-plan-card.popular::before {
    content: 'Más Popular';
    position: absolute;
    top: -11px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a1a;
    color: white;
    padding: 3px 14px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
  }
  .bill-section-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #9ca3af;
    margin-bottom: 12px;
  }
`;

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface RoleCounts {
  admin_root: number;
  coordinator: number;
  mentor: number;
  mentee: number;
  facilitator: number;
  client: number;
}

interface ProgramInfo {
  id: string;
  name: string;
  status: string;
  theme: string;
  created_at: string | null;
}

interface BillingClient {
  id: string;
  name: string;
  slug: string;
  corp_id: string;
  account_type: string;
  plan: string;
  status: string;
  billing_status: string;
  amount: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_position: string;
  legal_name: string;
  rut: string;
  country: string;
  city: string;
  contract_start: string | null;
  contract_end: string | null;
  total_users: number;
  users_by_role: RoleCounts;
  max_users: number;
  total_programs: number;
  programs: ProgramInfo[];
  max_programs: number;
  plan_limits: Record<string, number>;
  plan_features: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

interface BillingStats {
  total_clients: number;
  active: number;
  trial: number;
  overdue: number;
  cancelled: number;
  mrr: number;
  arr: number;
  total_users: number;
  total_programs: number;
  by_plan: Record<string, { count: number; revenue: number }>;
}

interface Invoice {
  invoice_id: string;
  company_id: string;
  company_name: string;
  amount: number;
  description: string;
  due_date: string;
  status: string;
  created_at: string;
  plan: string;
}

// ═══════════════════════════════════════════════════════════════════
// ICONS (inline SVGs)
// ═══════════════════════════════════════════════════════════════════

const Icons = {
  dollar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  trendUp: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  building: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  receipt: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  alert: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  program: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  mail: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
};

const initials = (name: string) =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const gradients = [
  "linear-gradient(135deg,#3b82f6,#6366f1)",
  "linear-gradient(135deg,#10b981,#14b8a6)",
  "linear-gradient(135deg,#f97316,#ef4444)",
  "linear-gradient(135deg,#8b5cf6,#ec4899)",
  "linear-gradient(135deg,#06b6d4,#3b82f6)",
  "linear-gradient(135deg,#f59e0b,#f97316)",
];
const gradient = (name: string) => gradients[name.charCodeAt(0) % gradients.length];

const planLabel: Record<string, string> = { trial: "Suscripción", starter: "Starter", growth: "Growth", enterprise: "Enterprise" };
const statusLabel: Record<string, string> = { active: "Activa", trial: "Activa", overdue: "Vencida", cancelled: "Cancelada", pending: "Pendiente" };
const roleLabels: Record<string, string> = {
  admin_root: "Administradores",
  coordinator: "Coordinadores",
  mentor: "Mentores",
  mentee: "Mentees",
  facilitator: "Facilitadores",
  client: "Clientes",
};
const roleColors: Record<string, string> = {
  admin_root: "#7c3aed",
  coordinator: "#2563eb",
  mentor: "#10b981",
  mentee: "#f59e0b",
  facilitator: "#ec4899",
  client: "#6b7280",
};

const plans = [
  {
    id: "starter", name: "Starter", price: 299, period: "/mes", annual: "$3,200", description: "Empezar con Mentoría. Ideal para equipos pequeños.",
    users: "Hasta 20 usuarios", programs: "1 programa activo",
    features: ["1 programa pre-armado", "Matching IA básico", "Dashboard estándar", "Certificación digital", "Soporte email (72hr SLA)"],
  },
  {
    id: "growth", name: "Growth", price: 899, period: "/mes", annual: "$9,600", description: "Escalar Desarrollo de Talento. Para empresas en crecimiento.", popular: true,
    users: "Hasta 80 usuarios", programs: "3 programas simultáneos",
    features: ["Todo en Starter", "IA matching avanzado", "Dashboard ejecutivo", "API + Integraciones", "SSO (Google/Microsoft)", "Account Manager compartido", "Soporte prioritario (24hr SLA)"],
  },
  {
    id: "enterprise", name: "Enterprise", price: null, period: "", annual: "$28,000+", description: "Solución completa para grandes organizaciones.",
    users: "Usuarios ilimitados", programs: "Programas ilimitados",
    features: ["Todo en Growth", "White-label completo", "SSO + SAML + SCIM", "Integraciones enterprise", "CSM dedicado (1:5)", "SLA 99.9% uptime", "Soporte 24/7", "Custom 30% contenido"],
  },
];

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "plans">("overview");
  const [clients, setClients] = useState<BillingClient[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Detail modal
  const [selected, setSelected] = useState<BillingClient | null>(null);

  // Invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceTarget, setInvoiceTarget] = useState<BillingClient | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({ amount: "", description: "", due_date: "" });
  const [createdInvoices, setCreatedInvoices] = useState<Invoice[]>([]);

  // Payment order modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<BillingClient | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: "", concept: "", due_date: "" });

  // ── Fetch billing data ──
  useEffect(() => {
    loadBilling();
  }, []);

  async function loadBilling() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/companies/billing/overview`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setClients(data.clients || []);
      setStats(data.stats || null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      console.error("Billing fetch error:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Create invoice ──
  async function handleCreateInvoice() {
    if (!invoiceTarget) return;
    try {
      const res = await fetch(`${API}/api/companies/billing/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: invoiceTarget.id,
          amount: invoiceForm.amount ? Number(invoiceForm.amount) : undefined,
          description: invoiceForm.description || undefined,
          due_date: invoiceForm.due_date || undefined,
        }),
      });
      if (!res.ok) throw new Error("Error creando factura");
      const inv = await res.json();
      setCreatedInvoices(prev => [inv, ...prev]);
      setShowInvoiceModal(false);
      setInvoiceForm({ amount: "", description: "", due_date: "" });
    } catch (e) {
      alert("Error al crear factura");
    }
  }

  // ── Create payment order ──
  async function handleCreatePayment() {
    if (!paymentTarget) return;
    try {
      const res = await fetch(`${API}/api/companies/billing/payment-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: paymentTarget.id,
          amount: paymentForm.amount ? Number(paymentForm.amount) : undefined,
          concept: paymentForm.concept || undefined,
          due_date: paymentForm.due_date || undefined,
        }),
      });
      if (!res.ok) throw new Error("Error creando orden");
      await res.json();
      setShowPaymentModal(false);
      setPaymentForm({ amount: "", concept: "", due_date: "" });
      alert("Orden de pago creada exitosamente");
    } catch (e) {
      alert("Error al crear orden de pago");
    }
  }

  // ── Filter & sort ──
  const filtered = clients
    .filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.contact_email.toLowerCase().includes(search.toLowerCase());
      const matchPlan = filterPlan === "all" || c.plan === filterPlan;
      const normalizedStatus = c.billing_status === "trial" ? "active" : c.billing_status;
      const matchStatus = filterStatus === "all" || normalizedStatus === filterStatus;
      return matchSearch && matchPlan && matchStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "amount": return b.amount - a.amount;
        case "users": return b.total_users - a.total_users;
        case "date": return (a.contract_start || "").localeCompare(b.contract_start || "");
        default: return 0;
      }
    });

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <div className="bill-page">
        {/* ── HEADER ── */}
        <div className="bill-header" style={{ padding: "1.75rem 2rem 1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <div className="bill-eyebrow">Finanzas</div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f0f0f", letterSpacing: "-0.02em", lineHeight: 1.15, margin: 0 }}>Facturación</h1>
              <p style={{ fontSize: "0.82rem", color: "#9a9a9a", marginTop: "0.25rem" }}>Gestión de pagos, suscripciones y planes</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", paddingBottom: 4 }}>
              <button className="bill-btn bill-btn-secondary">
                {Icons.download} Exportar
              </button>
              <button className="bill-btn bill-btn-primary" onClick={loadBilling}>
                ↻ Actualizar
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.25rem", background: "#f5f5f5", padding: "0.2rem", borderRadius: 10, width: "fit-content", border: "1px solid #eee" }}>
            {([
              { id: "overview" as const, label: "Resumen" },
              { id: "invoices" as const, label: "Facturas" },
              { id: "plans" as const, label: "Catálogo de Planes" },
            ]).map(t => (
              <button key={t.id} className={`bill-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <main style={{ padding: "1.75rem 2rem" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
              <div style={{ fontSize: 14 }}>Cargando datos de facturación...</div>
            </div>
          )}

          {error && (
            <div style={{ textAlign: "center", padding: 40, color: "#dc2626", background: "#fef2f2", borderRadius: 12, marginBottom: 16 }}>
              <p style={{ fontWeight: 500 }}>Error: {error}</p>
              <button className="bill-btn bill-btn-secondary bill-btn-sm" onClick={loadBilling} style={{ marginTop: 8 }}>Reintentar</button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* ══════════════════════════════════════ */}
              {/* TAB: OVERVIEW                         */}
              {/* ══════════════════════════════════════ */}
              {activeTab === "overview" && (
                <>
                  {/* Stats Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: 14, marginBottom: 24 }}>
                    <div className="bill-stat featured">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "#b08a00" }}>MRR</span>
                        <span style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: 2, fontSize: 11 }}>{Icons.trendUp}</span>
                      </div>
                      <p style={{ fontSize: "2rem", fontWeight: 800, color: "#6a4f00", margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>{stats ? fmtCurrency(stats.mrr) : "—"}</p>
                      <p style={{ fontSize: "0.7rem", color: "#b08a00", marginTop: 4 }}>Ingresos mensuales recurrentes</p>
                    </div>

                    <div className="bill-stat">
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "#aaa", display: "block", marginBottom: 10 }}>ARR</span>
                      <p style={{ fontSize: "2rem", fontWeight: 800, color: "#0f0f0f", margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>{stats ? fmtCurrency(stats.arr) : "—"}</p>
                      <p style={{ fontSize: "0.7rem", color: "#aaa", marginTop: 4 }}>Ingresos anuales recurrentes</p>
                    </div>

                    <div className="bill-stat">
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "#aaa", display: "block", marginBottom: 10 }}>Clientes Activos</span>
                      <p style={{ fontSize: "2rem", fontWeight: 800, color: "#16a34a", margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>{stats?.active ?? 0}</p>
                      <p style={{ fontSize: "0.7rem", color: "#aaa", marginTop: 4 }}>de {stats?.total_clients ?? 0} totales</p>
                    </div>

                    <div className="bill-stat">
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "#aaa", display: "block", marginBottom: 10 }}>Suscripciones</span>
                      <p style={{ fontSize: "2rem", fontWeight: 800, color: "#16a34a", margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>{(stats?.active ?? 0) + (stats?.trial ?? 0)}</p>
                      <p style={{ fontSize: "0.7rem", color: "#aaa", marginTop: 4 }}>incluye trials activos</p>
                    </div>

                    <div className="bill-stat">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "#aaa" }}>Vencidas</span>
                        {(stats?.overdue ?? 0) > 0 && <span style={{ color: "#dc2626" }}>{Icons.alert}</span>}
                      </div>
                      <p style={{ fontSize: "2rem", fontWeight: 800, color: (stats?.overdue ?? 0) > 0 ? "#dc2626" : "#0f0f0f", margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>{stats?.overdue ?? 0}</p>
                      <p style={{ fontSize: "0.7rem", color: "#aaa", marginTop: 4 }}>requieren atención</p>
                    </div>

                    <div className="bill-stat">
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "#aaa", display: "block", marginBottom: 10 }}>Usuarios Totales</span>
                      <p style={{ fontSize: "2rem", fontWeight: 800, color: "#0f0f0f", margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>{stats?.total_users ?? 0}</p>
                      <p style={{ fontSize: "0.7rem", color: "#aaa", marginTop: 4 }}>{stats?.total_programs ?? 0} programas activos</p>
                    </div>
                  </div>

                  {/* Plan breakdown */}
                  {stats?.by_plan && Object.keys(stats.by_plan).length > 0 && (
                    <div className="bill-card" style={{ marginBottom: 24, padding: 20 }}>
                      <p className="bill-section-title">Distribución por Plan</p>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {Object.entries(stats.by_plan).map(([plan, data]) => (
                          <div key={plan} style={{ flex: 1, minWidth: 160, padding: 16, background: "#f9fafb", borderRadius: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                              <span className={`bill-badge bill-badge-${plan === "trial" ? "trial-plan" : plan}`}>{planLabel[plan] || plan}</span>
                            </div>
                            <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{data.count} <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400 }}>cuentas</span></p>
                            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{fmtCurrency(data.revenue)}/mes</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Client Table */}
                  <div className="bill-card">
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Suscripciones</h2>
                        <span style={{ fontSize: 11, background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: 10 }}>{filtered.length}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>{Icons.search}</span>
                          <input className="bill-input" placeholder="Buscar empresa..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, width: 200 }} />
                        </div>
                        <select className="bill-select" value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
                          <option value="all">Todos los planes</option>
                          <option value="starter">Starter</option>
                          <option value="growth">Growth</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        <select className="bill-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                          <option value="all">Todos los estados</option>
                          <option value="active">Activas</option>
                          <option value="overdue">Vencidas</option>
                          <option value="cancelled">Canceladas</option>
                        </select>
                        <select className="bill-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                          <option value="name">Nombre</option>
                          <option value="amount">Monto</option>
                          <option value="users">Usuarios</option>
                          <option value="date">Fecha</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                            <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Empresa</th>
                            <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Plan</th>
                            <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</th>
                            <th style={{ textAlign: "center", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Usuarios</th>
                            <th style={{ textAlign: "center", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Programas</th>
                            <th style={{ textAlign: "right", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>MRR</th>
                            <th style={{ textAlign: "center", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px 16px", color: "#9ca3af", fontSize: 13 }}>No se encontraron cuentas</td></tr>
                          ) : filtered.map(c => (
                            <tr key={c.id} className="bill-row" onClick={() => setSelected(c)}>
                              <td style={{ padding: "12px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: 8, background: gradient(c.name), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                                    {initials(c.name)}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{c.name}</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{c.contact_email || c.corp_id || "—"}</p>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <span className={`bill-badge bill-badge-${c.plan === "trial" ? "trial-plan" : c.plan}`}>
                                  {c.plan === "enterprise" && "⭐ "}{planLabel[c.plan] || c.plan}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <span className={`bill-badge bill-badge-${c.billing_status === "trial" ? "active" : c.billing_status}`}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.billing_status === "active" || c.billing_status === "trial" ? "#16a34a" : c.billing_status === "overdue" ? "#dc2626" : "#6b7280" }}></span>
                                  {statusLabel[c.billing_status] || c.billing_status}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{c.total_users}</span>
                                <span style={{ fontSize: 11, color: "#9ca3af" }}>/{c.max_users}</span>
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{c.total_programs}</span>
                                <span style={{ fontSize: 11, color: "#9ca3af" }}>/{c.max_programs}</span>
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{fmtCurrency(c.amount)}</p>
                                <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>/mes</p>
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                <div style={{ display: "flex", justifyContent: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => setSelected(c)}
                                    style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
                                    title="Ver detalle"
                                  >
                                    {Icons.eye}
                                  </button>
                                  <button
                                    onClick={() => { setInvoiceTarget(c); setShowInvoiceModal(true); }}
                                    style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
                                    title="Emitir factura"
                                  >
                                    {Icons.receipt}
                                  </button>
                                  <button
                                    onClick={() => { setPaymentTarget(c); setShowPaymentModal(true); }}
                                    style={{ padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
                                    title="Orden de pago"
                                  >
                                    {Icons.dollar}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", background: "#fafafa", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280" }}>
                      <span>{filtered.length} cuenta(s)</span>
                      <span style={{ fontWeight: 500, color: "#374151" }}>MRR Total: {fmtCurrency(filtered.reduce((s, c) => s + c.amount, 0))}</span>
                    </div>
                  </div>
                </>
              )}

              {/* ══════════════════════════════════════ */}
              {/* TAB: INVOICES                         */}
              {/* ══════════════════════════════════════ */}
              {activeTab === "invoices" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Facturas Emitidas</h2>
                    <button className="bill-btn bill-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => { setInvoiceTarget(clients[0] || null); setShowInvoiceModal(true); }}>
                      {Icons.plus} Nueva Factura
                    </button>
                  </div>

                  {createdInvoices.length === 0 ? (
                    <div className="bill-card" style={{ padding: 48, textAlign: "center" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>No hay facturas emitidas aún</p>
                      <p style={{ fontSize: 12, color: "#9ca3af" }}>Emite tu primera factura desde la pestaña Resumen o con el botón &quot;Nueva Factura&quot;</p>
                    </div>
                  ) : (
                    <div className="bill-card">
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                              <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase" }}>N° Factura</th>
                              <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase" }}>Empresa</th>
                              <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase" }}>Descripción</th>
                              <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase" }}>Vencimiento</th>
                              <th style={{ textAlign: "right", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase" }}>Monto</th>
                              <th style={{ textAlign: "center", padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#6b7280", textTransform: "uppercase" }}>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {createdInvoices.map(inv => (
                              <tr key={inv.invoice_id} className="bill-row">
                                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500 }}>{inv.invoice_id}</td>
                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{inv.company_name}</td>
                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{inv.description}</td>
                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{fmtDate(inv.due_date)}</td>
                                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, textAlign: "right" }}>{fmtCurrency(inv.amount)}</td>
                                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                  <span className={`bill-badge bill-badge-${inv.status}`}>
                                    {inv.status === "paid" ? "Pagada" : inv.status === "pending" ? "Pendiente" : "Vencida"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Quick-invoice from client list */}
                  <div style={{ marginTop: 24 }}>
                    <p className="bill-section-title">Emitir factura rápida a cliente</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                      {clients.filter(c => c.amount > 0).map(c => (
                        <div key={c.id} className="bill-card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: gradient(c.name), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 600 }}>
                              {initials(c.name)}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{c.name}</p>
                              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{planLabel[c.plan]} · {fmtCurrency(c.amount)}/mes</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="bill-btn bill-btn-secondary bill-btn-sm" onClick={() => { setInvoiceTarget(c); setShowInvoiceModal(true); }}>Factura</button>
                            <button className="bill-btn bill-btn-secondary bill-btn-sm" onClick={() => { setPaymentTarget(c); setShowPaymentModal(true); }}>O. Pago</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════ */}
              {/* TAB: PLANS                            */}
              {/* ══════════════════════════════════════ */}
              {activeTab === "plans" && (
                <>
                  <div style={{ background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 12, padding: 16, marginBottom: 24 }}>
                    <p style={{ fontSize: 13, color: "#1d4ed8", margin: 0 }}><strong>Vista de Administrador:</strong> Estos son los planes disponibles para asignar a tus clientes. Precios en USD.</p>
                  </div>

                  <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 6px" }}>Catálogo de Planes</h2>
                    <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Starter / Growth / Enterprise</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
                    {plans.map(p => (
                      <div key={p.id} className={`bill-plan-card ${p.popular ? "popular" : ""}`}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{p.name}</h3>
                        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{p.description}</p>
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 32, fontWeight: 700 }}>{p.price ? fmtCurrency(p.price) : "Custom"}</span>
                          <span style={{ color: "#9ca3af" }}>{p.period}</span>
                        </div>
                        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 20 }}>Anual: {p.annual}</p>
                        <div style={{ padding: "12px 0", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", marginBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", marginBottom: 4 }}>{Icons.users} {p.users}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151" }}>{Icons.program} {p.programs}</div>
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px" }}>
                          {p.features.map((f, i) => (
                            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 13, color: "#374151", padding: "4px 0" }}>
                              <span style={{ color: "#10b981", flexShrink: 0, marginTop: 1 }}>{Icons.check}</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                        <button className={p.popular ? "bill-btn bill-btn-primary" : "bill-btn bill-btn-secondary"} style={{ width: "100%" }}>
                          {p.id === "enterprise" ? "Ver Detalles" : "Asignar a Cliente"}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Comparison table */}
                  <div className="bill-card" style={{ marginBottom: 24 }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Comparativa de Planes (USD)</h3>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#fafafa" }}>
                            <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Feature</th>
                            <th style={{ textAlign: "center", padding: "10px 16px", fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Starter</th>
                            <th style={{ textAlign: "center", padding: "10px 16px", fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Growth ⭐</th>
                            <th style={{ textAlign: "center", padding: "10px 16px", fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Enterprise</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["Precio/mes", "$299", "$899", "Custom"],
                            ["Precio/año", "$3,200", "$9,600", "$28,000+"],
                            ["Usuarios", "20", "80", "Ilimitado"],
                            ["Programas", "1", "3", "Ilimitado"],
                            ["Matching IA", "Básico", "Avanzado", "Custom"],
                            ["API", "✕", "✓", "✓ + Webhooks"],
                            ["SSO", "✕", "✓", "SAML/SCIM"],
                            ["White-label", "✕", "Logo/color", "Completo"],
                            ["Soporte", "Email 72hr", "24hr + AM", "24/7 + CSM"],
                            ["SLA", "✕", "✕", "99.9%"],
                          ].map(([feat, s, g, e], i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                              <td style={{ padding: "10px 16px", fontSize: 13, color: "#374151" }}>{feat}</td>
                              <td style={{ padding: "10px 16px", fontSize: 13, textAlign: "center", color: s === "✕" ? "#d1d5db" : "#374151" }}>{s}</td>
                              <td style={{ padding: "10px 16px", fontSize: 13, textAlign: "center", color: g === "✕" ? "#d1d5db" : "#2563eb", fontWeight: 500 }}>{g}</td>
                              <td style={{ padding: "10px 16px", fontSize: 13, textAlign: "center", color: "#374151" }}>{e}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* MODAL: Client Detail                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {selected && (
          <div className="bill-modal-overlay" onClick={() => setSelected(null)}>
            <div className="bill-modal" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: gradient(selected.name), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 600, fontSize: 13 }}>
                    {initials(selected.name)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{selected.name}</h3>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span className={`bill-badge bill-badge-${selected.plan === "trial" ? "trial-plan" : selected.plan}`}>{planLabel[selected.plan]}</span>
                      <span className={`bill-badge bill-badge-${selected.billing_status}`}>{statusLabel[selected.billing_status]}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#9ca3af" }}>{Icons.x}</button>
              </div>

              <div style={{ padding: 24 }}>
                {/* Suscripción */}
                <p className="bill-section-title">Suscripción & Contrato</p>
                <div className="bill-detail-grid" style={{ marginBottom: 24 }}>
                  <div className="bill-detail-item">
                    <label>Plan Actual</label>
                    <span>{planLabel[selected.plan] || selected.plan}</span>
                  </div>
                  <div className="bill-detail-item">
                    <label>Monto Mensual</label>
                    <span>{fmtCurrency(selected.amount)}</span>
                  </div>
                  <div className="bill-detail-item">
                    <label>Fecha de Activación</label>
                    <span>{fmtDate(selected.created_at)}</span>
                  </div>
                  <div className="bill-detail-item">
                    <label>Inicio Contrato</label>
                    <span>{fmtDate(selected.contract_start)}</span>
                  </div>
                  <div className="bill-detail-item">
                    <label>Fin Contrato</label>
                    <span>{fmtDate(selected.contract_end)}</span>
                  </div>
                  <div className="bill-detail-item">
                    <label>ID Corporativo</label>
                    <span>{selected.corp_id || "—"}</span>
                  </div>
                </div>

                {/* Datos legales */}
                <p className="bill-section-title">Datos de Facturación</p>
                <div className="bill-detail-grid" style={{ marginBottom: 24 }}>
                  <div className="bill-detail-item">
                    <label>Razón Social</label>
                    <span>{selected.legal_name || "—"}</span>
                  </div>
                  <div className="bill-detail-item">
                    <label>RUT / Tax ID</label>
                    <span>{selected.rut || "—"}</span>
                  </div>
                  <div className="bill-detail-item">
                    <label>País</label>
                    <span>{selected.country || "—"}</span>
                  </div>
                  <div className="bill-detail-item">
                    <label>Ciudad</label>
                    <span>{selected.city || "—"}</span>
                  </div>
                </div>

                {/* Contacto */}
                <p className="bill-section-title">Contacto Principal</p>
                <div className="bill-detail-grid" style={{ marginBottom: 24 }}>
                  <div className="bill-detail-item" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div>
                      <label>Nombre</label>
                      <span>{selected.contact_name || "—"}</span>
                    </div>
                  </div>
                  <div className="bill-detail-item">
                    <label>Cargo</label>
                    <span>{selected.contact_position || "—"}</span>
                  </div>
                  <div className="bill-detail-item" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {Icons.mail}
                    <div>
                      <label>Email</label>
                      <span>{selected.contact_email || "—"}</span>
                    </div>
                  </div>
                  <div className="bill-detail-item" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {Icons.phone}
                    <div>
                      <label>Teléfono</label>
                      <span>{selected.contact_phone || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Usuarios por rol */}
                <p className="bill-section-title">Desglose de Usuarios ({selected.total_users}/{selected.max_users})</p>
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: 16, marginBottom: 24 }}>
                  {Object.entries(selected.users_by_role).map(([role, count]) => {
                    const pct = selected.max_users > 0 ? (count / selected.max_users) * 100 : 0;
                    return (
                      <div key={role} className="bill-role-bar">
                        <span className="bill-role-dot" style={{ background: roleColors[role] || "#6b7280" }}></span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#374151", flex: 1 }}>{roleLabels[role] || role}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", minWidth: 24, textAlign: "right" }}>{count}</span>
                        <div style={{ width: 80, height: 6, borderRadius: 3, background: "#e5e7eb", overflow: "hidden", marginLeft: 8 }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 3, background: roleColors[role] || "#6b7280", transition: "width 0.3s ease" }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Programas */}
                <p className="bill-section-title">Programas ({selected.total_programs}/{selected.max_programs})</p>
                {selected.programs.length === 0 ? (
                  <div style={{ background: "#f9fafb", borderRadius: 10, padding: 20, textAlign: "center", marginBottom: 24 }}>
                    <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Sin programas activos</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8, marginBottom: 24 }}>
                    {selected.programs.map(prog => (
                      <div key={prog.id} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{prog.name}</p>
                          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{prog.theme || "Sin temática"} · Creado {fmtDate(prog.created_at)}</p>
                        </div>
                        <span className={`bill-badge ${prog.status === "active" ? "bill-badge-active" : prog.status === "draft" ? "bill-badge-pending" : "bill-badge-cancelled"}`}>
                          {prog.status === "active" ? "Activo" : prog.status === "draft" ? "Borrador" : prog.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Plan Limits & Features */}
                <p className="bill-section-title">Límites del Plan</p>
                <div className="bill-detail-grid" style={{ marginBottom: 24 }}>
                  <div className="bill-detail-item">
                    <label>Máx. Usuarios</label>
                    <span>{selected.plan_limits?.max_users ?? "—"}</span>
                  </div>
                  <div className="bill-detail-item">
                    <label>Máx. Programas</label>
                    <span>{selected.plan_limits?.max_programs ?? "—"}</span>
                  </div>
                  <div className="bill-detail-item">
                    <label>Máx. Participantes</label>
                    <span>{selected.plan_limits?.max_participants ?? "—"}</span>
                  </div>
                  <div className="bill-detail-item">
                    <label>Tipo de Cuenta</label>
                    <span style={{ textTransform: "capitalize" }}>{selected.account_type}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
                  <button className="bill-btn bill-btn-secondary" style={{ flex: 1 }} onClick={() => { setInvoiceTarget(selected); setShowInvoiceModal(true); }}>
                    Emitir Factura
                  </button>
                  <button className="bill-btn bill-btn-primary" style={{ flex: 1 }} onClick={() => { setPaymentTarget(selected); setShowPaymentModal(true); }}>
                    Orden de Pago
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* MODAL: New Invoice                                        */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {showInvoiceModal && (
          <div className="bill-modal-overlay" onClick={() => setShowInvoiceModal(false)}>
            <div className="bill-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Emitir Factura</h3>
                <button onClick={() => setShowInvoiceModal(false)} style={{ padding: 6, border: "none", background: "transparent", cursor: "pointer", color: "#9ca3af" }}>{Icons.x}</button>
              </div>
              <div style={{ padding: 24 }}>
                {/* Client selector */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Cliente</label>
                  <select className="bill-select" style={{ width: "100%" }} value={invoiceTarget?.id || ""} onChange={e => setInvoiceTarget(clients.find(c => c.id === e.target.value) || null)}>
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {planLabel[c.plan]} ({fmtCurrency(c.amount)}/mes)</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Monto (USD) — dejar vacío para usar precio del plan</label>
                  <input className="bill-input" type="number" placeholder={invoiceTarget ? String(invoiceTarget.amount) : "0"} value={invoiceForm.amount} onChange={e => setInvoiceForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Descripción</label>
                  <input className="bill-input" placeholder="Plan Growth - Marzo 2025" value={invoiceForm.description} onChange={e => setInvoiceForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Fecha de vencimiento</label>
                  <input className="bill-input" type="date" value={invoiceForm.due_date} onChange={e => setInvoiceForm(p => ({ ...p, due_date: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="bill-btn bill-btn-secondary" style={{ flex: 1 }} onClick={() => setShowInvoiceModal(false)}>Cancelar</button>
                  <button className="bill-btn bill-btn-primary" style={{ flex: 1 }} onClick={handleCreateInvoice} disabled={!invoiceTarget}>Emitir Factura</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* MODAL: Payment Order                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {showPaymentModal && (
          <div className="bill-modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="bill-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Orden de Pago</h3>
                <button onClick={() => setShowPaymentModal(false)} style={{ padding: 6, border: "none", background: "transparent", cursor: "pointer", color: "#9ca3af" }}>{Icons.x}</button>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Cliente</label>
                  <select className="bill-select" style={{ width: "100%" }} value={paymentTarget?.id || ""} onChange={e => setPaymentTarget(clients.find(c => c.id === e.target.value) || null)}>
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {planLabel[c.plan]}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Monto (USD)</label>
                  <input className="bill-input" type="number" placeholder={paymentTarget ? String(paymentTarget.amount) : "0"} value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Concepto</label>
                  <input className="bill-input" placeholder="Suscripción Growth" value={paymentForm.concept} onChange={e => setPaymentForm(p => ({ ...p, concept: e.target.value }))} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Fecha de vencimiento</label>
                  <input className="bill-input" type="date" value={paymentForm.due_date} onChange={e => setPaymentForm(p => ({ ...p, due_date: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="bill-btn bill-btn-secondary" style={{ flex: 1 }} onClick={() => setShowPaymentModal(false)}>Cancelar</button>
                  <button className="bill-btn bill-btn-primary" style={{ flex: 1 }} onClick={handleCreatePayment} disabled={!paymentTarget}>Crear Orden</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
