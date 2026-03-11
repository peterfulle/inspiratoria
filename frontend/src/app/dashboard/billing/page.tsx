"use client";

import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════

const pageStyles = `
  .billing-page {
    min-height: 100vh;
    background: #fafafa;
    color: #1a1a1a;
  }
  .billing-header {
    background: white;
    border-bottom: 1px solid #f0f0f0;
  }
  .stat-card {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    padding: 24px;
    transition: all 0.2s ease;
  }
  .stat-card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  }
  .glass-card {
    background: white;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
  }
  .tab-btn {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 2px solid transparent;
    transition: all 0.15s ease;
    color: #666;
  }
  .tab-btn.active {
    color: #1a1a1a;
    border-bottom-color: #1a1a1a;
  }
  .tab-btn:hover:not(.active) {
    color: #333;
  }
  .btn-primary {
    background: #1a1a1a;
    color: white;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  .btn-primary:hover {
    background: #333;
  }
  .btn-secondary {
    background: white;
    color: #1a1a1a;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 14px;
    border: 1px solid #e5e5e5;
    transition: all 0.2s ease;
  }
  .btn-secondary:hover {
    background: #f5f5f5;
  }
  .badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
  }
  .badge-paid { background: #dcfce7; color: #16a34a; }
  .badge-pending { background: #fef3c7; color: #d97706; }
  .badge-overdue { background: #fee2e2; color: #dc2626; }
  .badge-enterprise { background: #f3e8ff; color: #7c3aed; }
  .badge-growth { background: #dbeafe; color: #2563eb; }
  .badge-starter { background: #e0f2fe; color: #0369a1; }
  .table-row {
    border-bottom: 1px solid #f5f5f5;
    transition: all 0.15s ease;
  }
  .table-row:hover {
    background: #fafafa;
  }
  .plan-card {
    background: white;
    border: 2px solid #f0f0f0;
    border-radius: 20px;
    padding: 32px;
    transition: all 0.3s ease;
    position: relative;
  }
  .plan-card:hover {
    border-color: #1a1a1a;
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.08);
  }
  .plan-card.popular {
    border-color: #1a1a1a;
  }
  .plan-card.popular::before {
    content: 'Más Popular';
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a1a;
    color: white;
    padding: 4px 16px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
  }
  .section-title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 16px;
  }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }
  .modal-content {
    background: white;
    border-radius: 20px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
`;

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface Company {
  id: string;
  name: string;
  plan: "enterprise" | "growth" | "starter";
  status: "paid" | "pending" | "overdue";
  nextBilling: string;
  amount: number;
  users: number;
  paymentMethod: string;
  lastPayment: string;
}

interface Invoice {
  id: string;
  companyId: string;
  companyName: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  description: string;
}

interface Plan {
  id: string;
  name: string;
  price: number | null;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  users: string;
  programs: string;
}

// ═══════════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════════

const Icon = {
  CreditCard: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  DollarSign: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  TrendUp: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Users: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  AlertCircle: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Download: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Eye: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  X: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Star: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Search: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Filter: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  ChevronDown: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  MoreVertical: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════════
// DEMO DATA
// ═══════════════════════════════════════════════════════════════════

const demoCompanies: Company[] = [
  { id: "1", name: "TechCorp Solutions", plan: "enterprise", status: "paid", nextBilling: "2026-03-15", amount: 4833, users: 250, paymentMethod: "Visa •••• 4242", lastPayment: "2026-02-15" },
  { id: "2", name: "DesignLab Studio", plan: "growth", status: "paid", nextBilling: "2026-03-01", amount: 899, users: 65, paymentMethod: "Mastercard •••• 5555", lastPayment: "2026-02-01" },
  { id: "3", name: "DataFlow Analytics", plan: "starter", status: "pending", nextBilling: "2026-02-20", amount: 299, users: 18, paymentMethod: "Visa •••• 1234", lastPayment: "2026-01-20" },
  { id: "4", name: "StartupX Ventures", plan: "starter", status: "paid", nextBilling: "2026-02-25", amount: 299, users: 12, paymentMethod: "Amex •••• 3782", lastPayment: "2026-01-25" },
  { id: "5", name: "MediHealth Corp", plan: "enterprise", status: "overdue", nextBilling: "2026-02-01", amount: 4833, users: 320, paymentMethod: "Visa •••• 9876", lastPayment: "2026-01-01" },
];

const demoInvoices: Invoice[] = [
  { id: "INV-2026-001", companyId: "1", companyName: "TechCorp Solutions", date: "2026-02-15", amount: 4833, status: "paid", description: "Plan Enterprise - Febrero 2026" },
  { id: "INV-2026-002", companyId: "2", companyName: "DesignLab Studio", date: "2026-02-01", amount: 899, status: "paid", description: "Plan Growth - Febrero 2026" },
  { id: "INV-2026-003", companyId: "3", companyName: "DataFlow Analytics", date: "2026-02-20", amount: 299, status: "pending", description: "Plan Starter - Febrero 2026" },
  { id: "INV-2026-004", companyId: "5", companyName: "MediHealth Corp", date: "2026-02-01", amount: 4833, status: "overdue", description: "Plan Enterprise - Febrero 2026" },
  { id: "INV-2026-005", companyId: "1", companyName: "TechCorp Solutions", date: "2026-01-15", amount: 4833, status: "paid", description: "Plan Enterprise - Enero 2026" },
  { id: "INV-2026-006", companyId: "2", companyName: "DesignLab Studio", date: "2026-01-01", amount: 899, status: "paid", description: "Plan Growth - Enero 2026" },
];

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 299,
    period: "/mes",
    description: "Empezar con Mentoría Profesional. Ideal para equipos pequeños y pilotos.",
    users: "Hasta 20 usuarios",
    programs: "1 programa activo",
    features: [
      "1 programa pre-armado a elección",
      "Matching IA básico",
      "Dashboard estándar (KPIs básicos)",
      "Certificación digital",
      "Soporte email (72hr SLA)",
      "Updates contenido trimestral",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 899,
    period: "/mes",
    description: "Escalar Desarrollo de Talento. Para empresas en crecimiento.",
    users: "Hasta 80 usuarios",
    programs: "3 programas simultáneos",
    popular: true,
    features: [
      "Todo en Starter",
      "IA matching avanzado",
      "Dashboard ejecutivo (custom KPIs)",
      "API acceso + integraciones",
      "SSO (Google/Microsoft/Okta)",
      "Account Manager compartido",
      "Soporte prioritario (24hr SLA)",
      "QBRs trimestrales",
      "Custom branding (logo, colores)",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    period: "",
    description: "Academia Corporativa Completa. Solución para grandes organizaciones.",
    users: "Usuarios ilimitados",
    programs: "Programas ilimitados",
    features: [
      "Todo en Growth",
      "White-label completo",
      "SSO + SAML + SCIM",
      "Integraciones enterprise (Workday, SAP)",
      "CSM dedicado (1:5 ratio)",
      "SLA 99.9% uptime garantizado",
      "Soporte 24/7 priority hotline",
      "Workshops on-site (2/año incluidos)",
      "Customización hasta 30% contenido",
      "Roadmap influence",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  if (dateStr === "-") return "-";
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getCompanyInitials = (name: string): string => {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const getCompanyGradient = (name: string): string => {
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-purple-500 to-pink-600",
    "from-cyan-500 to-blue-600",
  ];
  return gradients[name.charCodeAt(0) % gradients.length];
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "plans">("overview");
  const [companies] = useState<Company[]>(demoCompanies);
  const [invoices] = useState<Invoice[]>(demoInvoices);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  // Stats calculations
  const totalMRR = companies.reduce((acc, c) => acc + c.amount, 0);
  const paidCount = companies.filter(c => c.status === "paid").length;
  const pendingCount = companies.filter(c => c.status === "pending").length;
  const overdueCount = companies.filter(c => c.status === "overdue").length;
  const overdueAmount = companies.filter(c => c.status === "overdue").reduce((acc, c) => acc + c.amount, 0);

  // Filtered and sorted companies
  const filteredCompanies = companies
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = filterPlan === "all" || c.plan === filterPlan;
      const matchesStatus = filterStatus === "all" || c.status === filterStatus;
      return matchesSearch && matchesPlan && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "amount": return b.amount - a.amount;
        case "users": return b.users - a.users;
        case "date": return new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime();
        default: return 0;
      }
    });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <div className="billing-page">
        {/* Header */}
        <header className="billing-header sticky top-0 z-20">
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">Facturación</h1>
                <p className="text-neutral-500 text-sm mt-0.5">Gestiona pagos, suscripciones y facturas</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="btn-secondary flex items-center gap-2">
                  <Icon.Download className="w-4 h-4" />
                  Exportar
                </button>
                <button className="btn-primary flex items-center gap-2">
                  Configurar Stripe
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-6 -mb-px">
              {[
                { id: "overview", label: "Resumen" },
                { id: "invoices", label: "Facturas" },
                { id: "plans", label: "Planes" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* OVERVIEW TAB */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="section-title" style={{ margin: 0 }}>MRR</span>
                    <span className="badge badge-paid flex items-center gap-1">
                      <Icon.TrendUp className="w-3 h-3" />
                      +8%
                    </span>
                  </div>
                  <p className="text-3xl font-semibold text-neutral-900">{formatCurrency(totalMRR)}</p>
                  <p className="text-neutral-500 text-xs mt-1">ingresos mensuales recurrentes</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="section-title" style={{ margin: 0 }}>Pagados</span>
                  </div>
                  <p className="text-3xl font-semibold text-green-600">{paidCount}</p>
                  <p className="text-neutral-500 text-xs mt-1">cuentas al día</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="section-title" style={{ margin: 0 }}>Pendientes</span>
                  </div>
                  <p className="text-3xl font-semibold text-amber-600">{pendingCount}</p>
                  <p className="text-neutral-500 text-xs mt-1">esperando pago</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="section-title" style={{ margin: 0 }}>Vencidos</span>
                    {overdueCount > 0 && (
                      <Icon.AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-3xl font-semibold text-red-600">{formatCurrency(overdueAmount)}</p>
                  <p className="text-neutral-500 text-xs mt-1">{overdueCount} cuenta(s) vencida(s)</p>
                </div>
              </div>

              {/* Accounts Table - Enhanced */}
              <div className="glass-card overflow-hidden">
                {/* Header with Filters */}
                <div className="p-4 border-b border-neutral-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-neutral-900">Suscripciones</h2>
                      <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                        {filteredCompanies.length} de {companies.length}
                      </span>
                    </div>
                    
                    {/* Advanced Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search */}
                      <div className="relative">
                        <Icon.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Buscar empresa..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 pr-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200 w-48"
                        />
                      </div>
                      
                      {/* Plan Filter */}
                      <select
                        value={filterPlan}
                        onChange={(e) => setFilterPlan(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:border-neutral-400 appearance-none cursor-pointer pr-8"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                      >
                        <option value="all">Todos los planes</option>
                        <option value="starter">Starter</option>
                        <option value="growth">Growth</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                      
                      {/* Status Filter */}
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:border-neutral-400 appearance-none cursor-pointer pr-8"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                      >
                        <option value="all">Todos los estados</option>
                        <option value="paid">Pagado</option>
                        <option value="pending">Pendiente</option>
                        <option value="overdue">Vencido</option>
                      </select>
                      
                      {/* Sort */}
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:border-neutral-400 appearance-none cursor-pointer pr-8"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                      >
                        <option value="name">Ordenar: Nombre</option>
                        <option value="amount">Ordenar: Monto</option>
                        <option value="users">Ordenar: Usuarios</option>
                        <option value="date">Ordenar: Próximo cobro</option>
                      </select>
                      
                      {/* Clear Filters */}
                      {(searchTerm || filterPlan !== "all" || filterStatus !== "all") && (
                        <button
                          onClick={() => { setSearchTerm(""); setFilterPlan("all"); setFilterStatus("all"); }}
                          className="text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1.5 hover:bg-neutral-100 rounded-lg transition-all"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compact Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">Empresa</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">Plan</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">Estado</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">Cobro</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">MRR</th>
                        <th className="text-center px-4 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompanies.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-neutral-500 text-sm">
                            No se encontraron empresas con los filtros aplicados
                          </td>
                        </tr>
                      ) : (
                        filteredCompanies.map((company) => (
                          <tr key={company.id} className="table-row group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getCompanyGradient(company.name)} flex items-center justify-center text-white font-medium text-[10px]`}>
                                  {getCompanyInitials(company.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-neutral-900 text-sm truncate max-w-[180px]">{company.name}</p>
                                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                                    <Icon.Users className="w-3 h-3" />
                                    <span>{company.users}</span>
                                    <span className="text-neutral-300">•</span>
                                    <span className="truncate">{company.paymentMethod}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                                company.plan === 'enterprise' ? 'bg-purple-50 text-purple-700' :
                                company.plan === 'growth' ? 'bg-blue-50 text-blue-700' :
                                'bg-sky-50 text-sky-700'
                              }`}>
                                {company.plan === 'enterprise' && '⭐'}
                                {company.plan.charAt(0).toUpperCase() + company.plan.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                                company.status === 'paid' ? 'bg-green-50 text-green-700' :
                                company.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                'bg-red-50 text-red-700'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  company.status === 'paid' ? 'bg-green-500' :
                                  company.status === 'pending' ? 'bg-amber-500' :
                                  'bg-red-500'
                                }`}></span>
                                {company.status === "paid" ? "Pagado" : company.status === "pending" ? "Pendiente" : "Vencido"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm ${
                                company.status === 'overdue' ? 'text-red-600 font-medium' : 'text-neutral-600'
                              }`}>
                                {formatDate(company.nextBilling)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-semibold text-neutral-900">{formatCurrency(company.amount)}</span>
                              <p className="text-[10px] text-neutral-400">/mes</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => setSelectedCompany(company)}
                                  className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all"
                                  title="Ver detalles"
                                >
                                  <Icon.Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-all"
                                  title="Más opciones"
                                >
                                  <Icon.MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Footer with Summary */}
                <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    Mostrando {filteredCompanies.length} empresa(s)
                  </span>
                  <span className="font-medium text-neutral-700">
                    MRR Total: {formatCurrency(filteredCompanies.reduce((acc, c) => acc + c.amount, 0))}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* INVOICES TAB */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === "invoices" && (
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">Historial de Facturas</h2>
                <button className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
                  <Icon.Download className="w-4 h-4" />
                  Descargar Todo
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Factura</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Empresa</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Descripción</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Fecha</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Monto</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">Estado</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="table-row">
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-neutral-900">{invoice.id}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-neutral-600">{invoice.companyName}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-neutral-500">{invoice.description}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-neutral-600">{formatDate(invoice.date)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-neutral-900">{formatCurrency(invoice.amount)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`badge badge-${invoice.status}`}>
                            {invoice.status === "paid" ? "Pagada" : invoice.status === "pending" ? "Pendiente" : "Vencida"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button className="text-neutral-600 hover:text-neutral-900 transition-all">
                            <Icon.Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* PLANS TAB */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === "plans" && (
            <>
              {/* Admin Notice */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm text-blue-700">
                  <strong>Vista de Administrador:</strong> Estos son los planes disponibles para asignar a tus clientes. Los precios están en USD.
                </p>
              </div>

              <div className="text-center mb-10">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Catálogo de Planes</h2>
                <p className="text-neutral-500">Starter / Growth / Enterprise — Planes disponibles para asignar a cuentas de clientes</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {plans.map((plan) => (
                  <div key={plan.id} className={`plan-card ${plan.popular ? "popular" : ""}`}>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-neutral-900 mb-1">{plan.name}</h3>
                      <p className="text-neutral-500 text-sm">{plan.description}</p>
                    </div>

                    <div className="mb-2">
                      <span className="text-4xl font-bold text-neutral-900">
                        {plan.price !== null ? formatCurrency(plan.price) : "Custom"}
                      </span>
                      <span className="text-neutral-500">{plan.period}</span>
                    </div>
                    <p className="text-xs text-neutral-400 mb-6">
                      {plan.id === "starter" && "Anual: $3,200 USD (ahorra 11%)"}
                      {plan.id === "growth" && "Anual: $9,600 USD (ahorra 11%)"}
                      {plan.id === "enterprise" && "Desde $28,000 USD/año • Precio negociable"}
                    </p>

                    <div className="mb-6 pb-6 border-b border-neutral-100">
                      <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                        <Icon.Users className="w-4 h-4" />
                        {plan.users}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Icon.CreditCard className="w-4 h-4" />
                        {plan.programs}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-neutral-600">
                          <Icon.Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button className={plan.popular ? "btn-primary w-full" : "btn-secondary w-full"}>
                      {plan.id === "enterprise" ? "Ver Detalles" : "Asignar a Cliente"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Feature Comparison Table */}
              <div className="glass-card overflow-hidden mb-8">
                <div className="p-5 border-b border-neutral-100">
                  <h3 className="font-semibold text-neutral-900">Comparativa de Planes (Precios en USD)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        <th className="text-left px-5 py-3 text-xs font-medium text-neutral-500 uppercase">Feature</th>
                        <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase">Starter</th>
                        <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase">Growth ⭐</th>
                        <th className="text-center px-5 py-3 text-xs font-medium text-neutral-500 uppercase">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      <tr>
                        <td className="px-5 py-3 text-sm text-neutral-600">Precio/mes (USD)</td>
                        <td className="px-5 py-3 text-center text-sm font-medium">$299</td>
                        <td className="px-5 py-3 text-center text-sm font-medium text-blue-600">$899</td>
                        <td className="px-5 py-3 text-center text-sm font-medium">Custom</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 text-sm text-neutral-600">Precio/año (USD)</td>
                        <td className="px-5 py-3 text-center text-sm font-medium">$3,200</td>
                        <td className="px-5 py-3 text-center text-sm font-medium text-blue-600">$9,600</td>
                        <td className="px-5 py-3 text-center text-sm font-medium">$28,000+</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 text-sm text-neutral-600">Usuarios máx.</td>
                        <td className="px-5 py-3 text-center text-sm">20</td>
                        <td className="px-5 py-3 text-center text-sm">80</td>
                        <td className="px-5 py-3 text-center text-sm">Ilimitado</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 text-sm text-neutral-600">Programas</td>
                        <td className="px-5 py-3 text-center text-sm">1</td>
                        <td className="px-5 py-3 text-center text-sm">3</td>
                        <td className="px-5 py-3 text-center text-sm">Ilimitado</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 text-sm text-neutral-600">Matching IA</td>
                        <td className="px-5 py-3 text-center"><span className="text-neutral-400 text-sm">Básico</span></td>
                        <td className="px-5 py-3 text-center"><span className="text-green-600 text-sm">Avanzado</span></td>
                        <td className="px-5 py-3 text-center"><span className="text-green-600 text-sm">+ Custom rules</span></td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 text-sm text-neutral-600">API</td>
                        <td className="px-5 py-3 text-center"><Icon.X className="w-4 h-4 text-neutral-300 mx-auto" /></td>
                        <td className="px-5 py-3 text-center"><Icon.Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="px-5 py-3 text-center"><span className="text-green-600 text-sm">+ Webhooks</span></td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 text-sm text-neutral-600">SSO</td>
                        <td className="px-5 py-3 text-center"><Icon.X className="w-4 h-4 text-neutral-300 mx-auto" /></td>
                        <td className="px-5 py-3 text-center"><Icon.Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="px-5 py-3 text-center"><span className="text-green-600 text-sm">+ SAML/SCIM</span></td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 text-sm text-neutral-600">White-label</td>
                        <td className="px-5 py-3 text-center"><Icon.X className="w-4 h-4 text-neutral-300 mx-auto" /></td>
                        <td className="px-5 py-3 text-center"><span className="text-neutral-400 text-sm">Logo/color</span></td>
                        <td className="px-5 py-3 text-center"><span className="text-green-600 text-sm">Completo</span></td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 text-sm text-neutral-600">Soporte</td>
                        <td className="px-5 py-3 text-center text-sm">Email 72hr</td>
                        <td className="px-5 py-3 text-center text-sm">24hr + AM</td>
                        <td className="px-5 py-3 text-center text-sm">24/7 + CSM</td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3 text-sm text-neutral-600">SLA</td>
                        <td className="px-5 py-3 text-center"><Icon.X className="w-4 h-4 text-neutral-300 mx-auto" /></td>
                        <td className="px-5 py-3 text-center"><Icon.X className="w-4 h-4 text-neutral-300 mx-auto" /></td>
                        <td className="px-5 py-3 text-center"><span className="text-green-600 text-sm">99.9%</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Economics Info for Admin */}
              <div className="glass-card p-6 mb-8">
                <h3 className="font-semibold text-neutral-900 mb-4">📊 Métricas de Negocio (Vista Admin)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-xs text-neutral-500 mb-1">LTV Starter (3 años)</p>
                    <p className="text-xl font-semibold text-neutral-900">$10,560 USD</p>
                    <p className="text-xs text-neutral-400">Renewal 85%</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-xs text-neutral-500 mb-1">LTV Growth (4 años)</p>
                    <p className="text-xl font-semibold text-neutral-900">$42,240 USD</p>
                    <p className="text-xs text-neutral-400">Renewal 92%</p>
                  </div>
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <p className="text-xs text-neutral-500 mb-1">LTV Enterprise (5 años)</p>
                    <p className="text-xl font-semibold text-neutral-900">$168,000 USD</p>
                    <p className="text-xs text-neutral-400">Renewal 95%</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 text-center">
                <p className="text-neutral-600 mb-2">
                  <strong>¿Cliente requiere plan personalizado?</strong>
                </p>
                <p className="text-sm text-neutral-500 mb-4">
                  Para clientes Enterprise con +1,000 usuarios o requerimientos especiales
                </p>
                <button className="btn-primary">
                  Crear Propuesta Custom
                </button>
              </div>
            </>
          )}
        </main>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* COMPANY DETAIL MODAL */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {selectedCompany && (
          <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getCompanyGradient(selectedCompany.name)} flex items-center justify-center text-white font-medium text-sm`}>
                    {getCompanyInitials(selectedCompany.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{selectedCompany.name}</h3>
                    <span className={`badge badge-${selectedCompany.plan}`}>
                      {selectedCompany.plan.charAt(0).toUpperCase() + selectedCompany.plan.slice(1)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
                >
                  <Icon.X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Subscription Info */}
                <div>
                  <h4 className="section-title">Información de Suscripción</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <p className="text-xs text-neutral-500 mb-1">Plan Actual</p>
                      <p className="font-medium text-neutral-900">{selectedCompany.plan.charAt(0).toUpperCase() + selectedCompany.plan.slice(1)}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <p className="text-xs text-neutral-500 mb-1">Monto Mensual</p>
                      <p className="font-medium text-neutral-900">{formatCurrency(selectedCompany.amount)}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <p className="text-xs text-neutral-500 mb-1">Próximo Cobro</p>
                      <p className="font-medium text-neutral-900">{formatDate(selectedCompany.nextBilling)}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-xl">
                      <p className="text-xs text-neutral-500 mb-1">Usuarios Activos</p>
                      <p className="font-medium text-neutral-900">{selectedCompany.users}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h4 className="section-title">Método de Pago</h4>
                  <div className="p-4 bg-neutral-50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon.CreditCard className="w-5 h-5 text-neutral-400" />
                      <span className="text-sm text-neutral-900">{selectedCompany.paymentMethod}</span>
                    </div>
                    <button className="text-sm text-neutral-600 hover:text-neutral-900">Cambiar</button>
                  </div>
                </div>

                {/* Recent Invoices */}
                <div>
                  <h4 className="section-title">Facturas Recientes</h4>
                  <div className="space-y-2">
                    {invoices
                      .filter(inv => inv.companyId === selectedCompany.id)
                      .slice(0, 3)
                      .map((invoice) => (
                        <div key={invoice.id} className="p-3 bg-neutral-50 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{invoice.id}</p>
                            <p className="text-xs text-neutral-500">{formatDate(invoice.date)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">{formatCurrency(invoice.amount)}</span>
                            <span className={`badge badge-${invoice.status}`}>
                              {invoice.status === "paid" ? "Pagada" : invoice.status === "pending" ? "Pendiente" : "Vencida"}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="btn-secondary flex-1">Cambiar Plan</button>
                  <button className="btn-primary flex-1">Ver Todas las Facturas</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
