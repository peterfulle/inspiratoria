'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================
interface Company {
  id: string;
  name: string;
  plan: string;
  status: 'active' | 'inactive' | 'trial';
  users: number;
  programs: number;
  created: string;
  lastActivity: string;
}

interface QuickLink {
  id: string;
  title: string;
  description: string;
  href: string;
  count?: number;
}

// ============================================================================
// ICONS
// ============================================================================
const Icons = {
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  grid: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  list: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  building: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  program: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  settings: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
    </svg>
  ),
  check: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  clock: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pause: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  activity: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

// ============================================================================
// STYLES
// ============================================================================
const styles = `
  .dashboard-container {
    min-height: 100vh;
    background: #fafafa;
    padding: 2rem;
  }

  .dashboard-header {
    margin-bottom: 2rem;
  }

  .dashboard-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.25rem;
  }

  .dashboard-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
  }

  /* Quick Links */
  .quick-links-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .quick-link-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .quick-link-card:hover {
    border-color: #1a1a1a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .quick-link-icon {
    width: 2.5rem;
    height: 2.5rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a1a1a;
  }

  .quick-link-content {
    flex: 1;
  }

  .quick-link-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.125rem;
  }

  .quick-link-desc {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .quick-link-count {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  /* Stats Cards */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .stat-change {
    font-size: 0.75rem;
    color: #10b981;
    margin-top: 0.25rem;
  }

  /* Glass Card */
  .glass-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .glass-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .search-container {
    position: relative;
    flex: 1;
    max-width: 320px;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }

  .input-field {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: #fafafa;
    transition: all 0.15s ease;
  }

  .input-field:focus {
    outline: none;
    border-color: #1a1a1a;
    background: white;
  }

  .filter-tabs {
    display: flex;
    gap: 0.25rem;
    background: #f3f4f6;
    padding: 0.25rem;
    border-radius: 0.5rem;
  }

  .filter-tab {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    background: transparent;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .filter-tab:hover {
    color: #1a1a1a;
  }

  .filter-tab.active {
    background: white;
    color: #1a1a1a;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .view-toggle {
    display: flex;
    gap: 0.25rem;
    background: #f3f4f6;
    padding: 0.25rem;
    border-radius: 0.5rem;
  }

  .btn-icon {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 0.375rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-icon:hover {
    color: #1a1a1a;
  }

  .btn-icon.active {
    background: white;
    color: #1a1a1a;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #1a1a1a;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-primary:hover {
    background: #2d2d2d;
  }

  /* Company List */
  .company-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .company-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .company-row:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .company-avatar {
    width: 2.5rem;
    height: 2.5rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
    color: #1a1a1a;
    flex-shrink: 0;
  }

  .company-info {
    flex: 1;
    min-width: 0;
  }

  .company-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .company-meta {
    font-size: 0.75rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.125rem;
  }

  .company-stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
    min-width: 80px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.625rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    border-radius: 9999px;
  }

  .badge-active {
    background: #d1fae5;
    color: #065f46;
  }

  .badge-trial {
    background: #fef3c7;
    color: #92400e;
  }

  .badge-inactive {
    background: #f3f4f6;
    color: #6b7280;
  }

  .badge-plan {
    background: #ede9fe;
    color: #5b21b6;
  }

  .company-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .company-row:hover .company-actions {
    opacity: 1;
  }

  .action-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    border: none;
    border-radius: 0.375rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: #e5e7eb;
    color: #1a1a1a;
  }

  /* Grid View */
  .company-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .company-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .company-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .company-card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .company-card-stats {
    display: flex;
    gap: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f3f4f6;
  }

  .company-card-stat {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .company-card-stat strong {
    color: #1a1a1a;
  }

  /* Summary Section */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .summary-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
  }

  .summary-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .summary-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .summary-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: #fafafa;
    border-radius: 0.5rem;
  }

  .summary-item-label {
    font-size: 0.875rem;
    color: #374151;
  }

  .summary-item-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #fafafa;
    border-radius: 0.5rem;
  }

  .activity-dot {
    width: 0.5rem;
    height: 0.5rem;
    background: #1a1a1a;
    border-radius: 50%;
    margin-top: 0.375rem;
    flex-shrink: 0;
  }

  .activity-content {
    flex: 1;
  }

  .activity-text {
    font-size: 0.875rem;
    color: #374151;
  }

  .activity-time {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.125rem;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #6b7280;
  }

  .empty-icon {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 1rem;
    color: #d1d5db;
  }

  @media (max-width: 1024px) {
    .quick-links-grid,
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .company-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .quick-links-grid,
    .stats-grid {
      grid-template-columns: 1fr;
    }
    .company-grid {
      grid-template-columns: 1fr;
    }
    .glass-card-header {
      flex-direction: column;
      align-items: stretch;
    }
    .search-container {
      max-width: 100%;
    }
  }
`;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// ============================================================================
// COMPONENT
// ============================================================================
export default function DashboardPage() {
  const router = useRouter();

  // Redirect participants away from admin dashboard
  useEffect(() => {
    const PARTICIPANT_ROLES = ['facilitator', 'mentor', 'mentee', 'participant_cell', 'participant', 'facilitator_internal'];
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (PARTICIPANT_ROLES.includes(user?.role)) {
          const portalCode = user?.portal_code;
          if (portalCode) { router.replace(`/p/${portalCode}`); return; }
          const pp = localStorage.getItem('program_participant');
          if (pp) {
            const ppData = JSON.parse(pp);
            if (ppData?.company_slug) { router.replace(`/studio/${ppData.company_slug}`); return; }
          }
          router.replace('/login/admin');
          return;
        }
      }
    } catch {}
  }, [router]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([
    { id: 'accounts', title: 'Cuentas Studio', description: 'Gestionar empresas', href: '/dashboard/accounts', count: 0 },
    { id: 'programs', title: 'Programas Studio', description: 'Templates de mentoría', href: '/dashboard/programs', count: 0 },
    { id: 'users', title: 'Usuarios', description: 'Administrar usuarios', href: '/dashboard/users', count: 0 },
    { id: 'settings', title: 'Configuración', description: 'Ajustes del sistema', href: '/dashboard/settings' },
  ]);
  const [recentActivity, setRecentActivity] = useState<{ text: string; time: string }[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsRes, companiesRes, templatesRes] = await Promise.all([
          fetch(`${API_URL}/api/companies/stats`).catch(() => null),
          fetch(`${API_URL}/api/companies/`).catch(() => null),
          fetch(`${API_URL}/api/program-templates`).catch(() => null),
        ]);

        let totalAccounts = 0;
        let totalUsers = 0;
        if (statsRes?.ok) {
          const s = await statsRes.json();
          totalAccounts = s.total_companies || 0;
          totalUsers = s.total_users || 0;
        }

        let totalTemplates = 0;
        if (templatesRes?.ok) {
          const t = await templatesRes.json();
          totalTemplates = Array.isArray(t) ? t.length : 0;
        }

        setQuickLinks([
          { id: 'accounts', title: 'Cuentas Studio', description: 'Gestionar empresas', href: '/dashboard/accounts', count: totalAccounts },
          { id: 'programs', title: 'Programas Studio', description: 'Templates de mentoría', href: '/dashboard/programs', count: totalTemplates },
          { id: 'users', title: 'Usuarios', description: 'Administrar usuarios', href: '/dashboard/users', count: totalUsers },
          { id: 'settings', title: 'Configuración', description: 'Ajustes del sistema', href: '/dashboard/settings' },
        ]);

        if (companiesRes?.ok) {
          const all = await companiesRes.json();
          const mapped: Company[] = (Array.isArray(all) ? all : [])
            .filter((c: any) => c.status !== 'pending')
            .map((c: any) => ({
              id: c.id,
              name: c.name || 'Sin nombre',
              plan: (c.plan || 'starter').charAt(0).toUpperCase() + (c.plan || 'starter').slice(1),
              status: c.status === 'active' ? 'active' : c.status === 'trial' ? 'trial' : 'inactive',
              users: c.user_count || c.users || 0,
              programs: c.program_count || c.programs || 0,
              created: c.created_at ? new Date(c.created_at).toLocaleDateString('es-CL') : 'N/A',
              lastActivity: c.updated_at ? new Date(c.updated_at).toLocaleDateString('es-CL') : 'Hoy',
            }));
          setCompanies(mapped);

          // Build recent activity from companies
          const activity = mapped.slice(0, 5).map(c => ({
            text: `${c.name} — cuenta ${c.status === 'active' ? 'activa' : c.status}`,
            time: c.created,
          }));
          setRecentActivity(activity);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    };
    loadDashboardData();
  }, []);

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    trial: companies.filter(c => c.status === 'trial').length,
    users: companies.reduce((sum, c) => sum + c.users, 0),
  };

  // Plan summary
  const planSummary = [
    { label: 'Enterprise', count: companies.filter(c => c.plan === 'Enterprise').length },
    { label: 'Professional', count: companies.filter(c => c.plan === 'Professional').length },
    { label: 'Starter', count: companies.filter(c => c.plan === 'Starter').length },
  ];

  const getStatusBadge = (status: Company['status']) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-active">{Icons.check} Activa</span>;
      case 'trial':
        return <span className="badge badge-trial">{Icons.clock} Trial</span>;
      case 'inactive':
        return <span className="badge badge-inactive">{Icons.pause} Inactiva</span>;
    }
  };

  const getQuickLinkIcon = (id: string) => {
    switch (id) {
      case 'accounts': return Icons.building;
      case 'programs': return Icons.program;
      case 'users': return Icons.users;
      case 'settings': return Icons.settings;
      default: return Icons.building;
    }
  };

  const handleQuickLinkClick = (href: string) => {
    window.location.href = href;
  };

  return (
    <>
      <style>{styles}</style>
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Bienvenido, Admin. Vista general del sistema.</p>
        </div>

        {/* Quick Links */}
        <div className="quick-links-grid">
          {quickLinks.map(link => (
            <div
              key={link.id}
              className="quick-link-card"
              onClick={() => handleQuickLinkClick(link.href)}
            >
              <div className="quick-link-icon">
                {getQuickLinkIcon(link.id)}
              </div>
              <div className="quick-link-content">
                <div className="quick-link-title">{link.title}</div>
                <div className="quick-link-desc">{link.description}</div>
              </div>
              {link.count !== undefined && (
                <div className="quick-link-count">{link.count}</div>
              )}
              <div style={{ color: '#9ca3af' }}>{Icons.arrow}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Cuentas</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-change">+2 este mes</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cuentas Activas</div>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-change">83% del total</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">En Prueba</div>
            <div className="stat-value">{stats.trial}</div>
            <div className="stat-change">Conversión: 65%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Usuarios</div>
            <div className="stat-value">{stats.users}</div>
            <div className="stat-change">+48 esta semana</div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card">
          <div className="glass-card-header">
            <div className="search-container">
              <span className="search-icon">{Icons.search}</span>
              <input
                type="text"
                className="input-field"
                placeholder="Buscar cuentas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-tabs">
              {(['all', 'active', 'trial', 'inactive'] as const).map(status => (
                <button
                  key={status}
                  className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'Todas' : status === 'active' ? 'Activas' : status === 'trial' ? 'Trial' : 'Inactivas'}
                </button>
              ))}
            </div>

            <div className="view-toggle">
              <button
                className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Vista lista"
              >
                {Icons.list}
              </button>
              <button
                className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vista grid"
              >
                {Icons.grid}
              </button>
            </div>

            <button className="btn-primary">
              {Icons.plus}
              Nueva Cuenta
            </button>
          </div>
        </div>

        {/* Company List/Grid */}
        {viewMode === 'list' ? (
          <div className="company-list">
            {filteredCompanies.map(company => (
              <div key={company.id} className="company-row">
                <div className="company-avatar">
                  {company.name.charAt(0)}
                </div>
                <div className="company-info">
                  <div className="company-name">{company.name}</div>
                  <div className="company-meta">
                    <span>{company.lastActivity}</span>
                  </div>
                </div>
                <span className="badge badge-plan">{company.plan}</span>
                {getStatusBadge(company.status)}
                <div className="company-stat">
                  {Icons.users}
                  <span>{company.users} usuarios</span>
                </div>
                <div className="company-stat">
                  {Icons.program}
                  <span>{company.programs} programas</span>
                </div>
                <div className="company-actions">
                  <button className="action-btn" title="Ver detalles">
                    {Icons.eye}
                  </button>
                  <button className="action-btn" title="Editar">
                    {Icons.edit}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="company-grid">
            {filteredCompanies.map(company => (
              <div key={company.id} className="company-card">
                <div className="company-card-header">
                  <div className="company-avatar">
                    {company.name.charAt(0)}
                  </div>
                  <div className="company-info">
                    <div className="company-name">{company.name}</div>
                    <div className="company-meta">
                      <span>{company.lastActivity}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span className="badge badge-plan">{company.plan}</span>
                  {getStatusBadge(company.status)}
                </div>
                <div className="company-card-stats">
                  <div className="company-card-stat">
                    <strong>{company.users}</strong> usuarios
                  </div>
                  <div className="company-card-stat">
                    <strong>{company.programs}</strong> programas
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredCompanies.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">{Icons.building}</div>
            <p>No se encontraron cuentas</p>
          </div>
        )}

        {/* Summary Section */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-title">
              {Icons.program}
              Por Plan
            </div>
            <div className="summary-list">
              {planSummary.map(plan => (
                <div key={plan.label} className="summary-item">
                  <span className="summary-item-label">{plan.label}</span>
                  <span className="summary-item-value">{plan.count} cuentas</span>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-title">
              {Icons.activity}
              Actividad Reciente
            </div>
            <div className="summary-list">
              {recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <div className="activity-text">{activity.text}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
