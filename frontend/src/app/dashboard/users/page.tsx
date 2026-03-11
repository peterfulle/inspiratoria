'use client';

import { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

interface NewUserForm {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  password: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const roleLabels: Record<string, string> = {
  admin_root: 'Admin Root',
  superadmin: 'Super Admin',
  inspiratoria_admin: 'Admin Inspiratoria',
  admin: 'Administrador',
  coordinator: 'Coordinador',
  client: 'Cliente',
  facilitator: 'Facilitador',
  mentor: 'Mentor',
  mentee: 'Aprendiz',
};

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
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
  x: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  shield: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  activity: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// ============================================================================
// STYLES
// ============================================================================
const styles = `
  .users-container {
    min-height: 100vh;
    background: #fafafa;
    padding: 2rem;
  }

  .users-header {
    margin-bottom: 2rem;
  }

  .users-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.25rem;
  }

  .users-subtitle {
    font-size: 0.875rem;
    color: #6b7280;
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

  .input-clean {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: #fafafa;
    transition: all 0.15s ease;
  }

  .input-clean:focus {
    outline: none;
    border-color: #1a1a1a;
    background: white;
  }

  .select-field {
    padding: 0.5rem 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: #fafafa;
    cursor: pointer;
    min-width: 140px;
  }

  .select-field:focus {
    outline: none;
    border-color: #1a1a1a;
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

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #f3f4f6;
    color: #374151;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-secondary:hover {
    background: #e5e7eb;
  }

  /* User List */
  .user-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .user-row {
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

  .user-row:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .user-avatar {
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

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-meta {
    font-size: 0.75rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.125rem;
  }

  .user-stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
    min-width: 100px;
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

  .badge-inactive {
    background: #fee2e2;
    color: #991b1b;
  }

  .badge-admin_root {
    background: #ede9fe;
    color: #5b21b6;
  }

  .badge-superadmin {
    background: #fce7f3;
    color: #9d174d;
  }

  .badge-inspiratoria_admin {
    background: #dbeafe;
    color: #1e40af;
  }

  .badge-admin {
    background: #e0e7ff;
    color: #3730a3;
  }

  .badge-coordinator {
    background: #dcfce7;
    color: #166534;
  }

  .badge-client {
    background: #fef3c7;
    color: #92400e;
  }

  .badge-facilitator {
    background: #ccfbf1;
    color: #115e59;
  }

  .badge-mentor {
    background: #cffafe;
    color: #155e75;
  }

  .badge-mentee {
    background: #f3f4f6;
    color: #374151;
  }

  .user-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .user-row:hover .user-actions {
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
  .user-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .user-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .user-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .user-card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .user-card-stats {
    display: flex;
    gap: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f3f4f6;
  }

  .user-card-stat {
    font-size: 0.75rem;
    color: #6b7280;
  }

  /* Summary Section */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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

  /* Loading */
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
  }

  .loading-spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 2px solid #e5e7eb;
    border-top-color: #1a1a1a;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 0.75rem;
    width: 100%;
    max-width: 28rem;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .modal-close {
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

  .modal-close:hover {
    background: #e5e7eb;
    color: #1a1a1a;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .modal-footer {
    display: flex;
    gap: 0.75rem;
    padding: 1.25rem;
    border-top: 1px solid #e5e7eb;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.375rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .user-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    .user-grid {
      grid-template-columns: 1fr;
    }
    .glass-card-header {
      flex-direction: column;
      align-items: stretch;
    }
    .search-container {
      max-width: 100%;
    }
    .form-row {
      grid-template-columns: 1fr;
    }
  }
`;

// ============================================================================
// SAMPLE DATA
// ============================================================================
const sampleUsers: User[] = [
  { id: 1, username: 'admin', email: 'admin@test.com', first_name: 'Admin', last_name: 'Principal', role: 'admin_root', is_active: true, date_joined: '2024-01-01', last_login: '2024-03-15T10:30:00' },
  { id: 2, username: 'carolina', email: 'carolina@inspiratoria.com', first_name: 'Carolina', last_name: 'González', role: 'inspiratoria_admin', is_active: true, date_joined: '2024-01-15', last_login: '2024-03-14T15:45:00' },
  { id: 3, username: 'juan.coord', email: 'juan@empresa.com', first_name: 'Juan', last_name: 'Martínez', role: 'coordinator', is_active: true, date_joined: '2024-02-01', last_login: '2024-03-13T09:20:00' },
  { id: 4, username: 'maria.mentor', email: 'maria@empresa.com', first_name: 'María', last_name: 'López', role: 'mentor', is_active: true, date_joined: '2024-02-10', last_login: '2024-03-12T14:00:00' },
  { id: 5, username: 'pedro.mentee', email: 'pedro@empresa.com', first_name: 'Pedro', last_name: 'Sánchez', role: 'mentee', is_active: true, date_joined: '2024-02-15', last_login: '2024-03-11T11:30:00' },
  { id: 6, username: 'ana.client', email: 'ana@cliente.com', first_name: 'Ana', last_name: 'Ruiz', role: 'client', is_active: false, date_joined: '2024-01-20', last_login: null },
];

const recentActivity = [
  { text: 'Carolina González inició sesión', time: 'Hace 2 horas' },
  { text: 'Juan Martínez actualizó su perfil', time: 'Hace 5 horas' },
  { text: 'María López completó mentoría', time: 'Hace 8 horas' },
  { text: 'Pedro Sánchez se registró', time: 'Hace 1 día' },
];

// ============================================================================
// COMPONENT
// ============================================================================
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUserForm>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'admin',
    password: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUserEmail(user.email);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setUsers(sampleUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers(sampleUsers);
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => ['admin_root', 'superadmin', 'inspiratoria_admin', 'admin'].includes(u.role)).length,
    recentlyActive: users.filter(u => {
      if (!u.last_login) return false;
      const lastLogin = new Date(u.last_login);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastLogin > weekAgo;
    }).length,
  };

  // Role summary
  const roleSummary = Object.entries(
    users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).slice(0, 4);

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '??';
  };

  const formatLastLogin = (lastLogin: string | null): string => {
    if (!lastLogin) return 'Nunca';
    const date = new Date(lastLogin);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const handleInviteUser = async () => {
    if (!newUser.email || !newUser.first_name || !newUser.last_name || !newUser.password) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:8001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        await loadUsers();
        setShowInviteModal(false);
        setNewUser({ username: '', email: '', first_name: '', last_name: '', role: 'admin', password: '' });
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error al crear usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8001/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          email: editingUser.email,
          role: editingUser.role,
          is_active: editingUser.is_active,
        }),
      });

      if (response.ok) {
        await loadUsers();
        setShowEditModal(false);
        setEditingUser(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error al actualizar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="users-container">
          <div className="loading-container">
            <div className="loading-spinner" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="users-container">
        {/* Header */}
        <div className="users-header">
          <h1 className="users-title">Usuarios</h1>
          <p className="users-subtitle">Administra usuarios y permisos del sistema.</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Usuarios</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-change">+5 este mes</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Usuarios Activos</div>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-change">{Math.round((stats.active / stats.total) * 100)}% del total</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Administradores</div>
            <div className="stat-value">{stats.admins}</div>
            <div className="stat-change">Con permisos elevados</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Activos Esta Semana</div>
            <div className="stat-value">{stats.recentlyActive}</div>
            <div className="stat-change">Última semana</div>
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
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="select-field"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Todos los roles</option>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <div className="filter-tabs">
              {(['all', 'active', 'inactive'] as const).map(status => (
                <button
                  key={status}
                  className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'Todos' : status === 'active' ? 'Activos' : 'Inactivos'}
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

            <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
              {Icons.plus}
              Invitar Usuario
            </button>
          </div>
        </div>

        {/* User List/Grid */}
        {viewMode === 'list' ? (
          <div className="user-list">
            {filteredUsers.map(user => (
              <div key={user.id} className="user-row">
                <div className="user-avatar">
                  {getInitials(user.first_name, user.last_name)}
                </div>
                <div className="user-info">
                  <div className="user-name">
                    {user.first_name} {user.last_name}
                    {currentUserEmail === user.email && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.625rem', background: '#e0e7ff', color: '#3730a3', padding: '0.125rem 0.375rem', borderRadius: '9999px' }}>Tú</span>
                    )}
                  </div>
                  <div className="user-meta">
                    <span>{user.email}</span>
                  </div>
                </div>
                <span className={`badge badge-${user.role}`}>
                  {roleLabels[user.role] || user.role}
                </span>
                <span className={`badge ${user.is_active ? 'badge-active' : 'badge-inactive'}`}>
                  {user.is_active ? <>{Icons.check} Activo</> : <>{Icons.x} Inactivo</>}
                </span>
                <div className="user-stat">
                  {Icons.clock}
                  <span>{formatLastLogin(user.last_login)}</span>
                </div>
                <div className="user-actions">
                  <button className="action-btn" title="Editar" onClick={() => openEditModal(user)}>
                    {Icons.edit}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="user-grid">
            {filteredUsers.map(user => (
              <div key={user.id} className="user-card" onClick={() => openEditModal(user)}>
                <div className="user-card-header">
                  <div className="user-avatar">
                    {getInitials(user.first_name, user.last_name)}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.first_name} {user.last_name}</div>
                    <div className="user-meta">
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span className={`badge badge-${user.role}`}>
                    {roleLabels[user.role] || user.role}
                  </span>
                  <span className={`badge ${user.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="user-card-stats">
                  <div className="user-card-stat">
                    Último acceso: {formatLastLogin(user.last_login)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">{Icons.users}</div>
            <p>No se encontraron usuarios</p>
          </div>
        )}

        {/* Summary Section */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-title">
              {Icons.shield}
              Por Rol
            </div>
            <div className="summary-list">
              {roleSummary.map(([role, count]) => (
                <div key={role} className="summary-item">
                  <span className="summary-item-label">{roleLabels[role] || role}</span>
                  <span className="summary-item-value">{count} usuarios</span>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-title">
              {Icons.users}
              Estado
            </div>
            <div className="summary-list">
              <div className="summary-item">
                <span className="summary-item-label">Activos</span>
                <span className="summary-item-value">{stats.active} usuarios</span>
              </div>
              <div className="summary-item">
                <span className="summary-item-label">Inactivos</span>
                <span className="summary-item-value">{stats.total - stats.active} usuarios</span>
              </div>
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

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Invitar Usuario</h2>
                <button className="modal-close" onClick={() => setShowInviteModal(false)}>
                  {Icons.close}
                </button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="input-clean"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                      placeholder="Juan"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellido *</label>
                    <input
                      type="text"
                      className="input-clean"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                      placeholder="Pérez"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="input-clean"
                    value={newUser.email}
                    onChange={(e) => {
                      const email = e.target.value;
                      setNewUser({ ...newUser, email, username: email.split('@')[0] || email });
                    }}
                    placeholder="juan@ejemplo.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña *</label>
                  <input
                    type="password"
                    className="input-clean"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol *</label>
                  <select
                    className="input-clean"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowInviteModal(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleInviteUser} disabled={submitting}>
                  {submitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingUser && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Editar Usuario</h2>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>
                  {Icons.close}
                </button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="input-clean"
                      value={editingUser.first_name}
                      onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Apellido *</label>
                    <input
                      type="text"
                      className="input-clean"
                      value={editingUser.last_name}
                      onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="input-clean"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol *</label>
                  <select
                    className="input-clean"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#fafafa', borderRadius: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editingUser.is_active}
                      onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                      style={{ width: '1.25rem', height: '1.25rem' }}
                    />
                    <label htmlFor="is_active" style={{ fontSize: '0.875rem', color: '#374151' }}>Usuario activo</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleEditUser} disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
