// Sistema de permisos por rol

export type UserRole = 
  | 'admin_root'
  | 'superadmin'
  | 'inspiratoria_admin'
  | 'client'
  | 'admin'
  | 'facilitator_internal'
  | 'facilitator_inspiratoria'
  | 'mentor'
  | 'mentee'
  | 'coordinator'; // Backward compatibility

export interface Permission {
  // Dashboard access
  canViewGlobalDashboard: boolean;
  canViewCompanyDashboard: boolean;
  canViewPersonalDashboard: boolean;

  // Programs
  canCreatePrograms: boolean;
  canEditPrograms: boolean;
  canViewPrograms: boolean;
  canDeletePrograms: boolean;

  // Participants
  canCreateParticipants: boolean;
  canEditParticipants: boolean;
  canViewAllParticipants: boolean;
  canViewAssignedParticipants: boolean;

  // Matching
  canCreateMatches: boolean;
  canViewAllMatches: boolean;
  canViewOwnMatches: boolean;

  // Sessions
  canRegisterSessions: boolean;
  canViewSessions: boolean;

  // Analytics
  canViewAnalytics: boolean;
  canExportData: boolean;

  // Users
  canInviteUsers: boolean;
  canManageUsers: boolean;

  // Chat
  canChatWithAnyone: boolean;
  canChatWithMatches: boolean;

  // Company
  canManageCompany: boolean;
  canViewMultipleCompanies: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  admin_root: {
    canViewGlobalDashboard: true,
    canViewCompanyDashboard: true,
    canViewPersonalDashboard: false,
    canCreatePrograms: true,
    canEditPrograms: true,
    canViewPrograms: true,
    canDeletePrograms: true,
    canCreateParticipants: true,
    canEditParticipants: true,
    canViewAllParticipants: true,
    canViewAssignedParticipants: true,
    canCreateMatches: true,
    canViewAllMatches: true,
    canViewOwnMatches: true,
    canRegisterSessions: true,
    canViewSessions: true,
    canViewAnalytics: true,
    canExportData: true,
    canInviteUsers: true,
    canManageUsers: true,
    canChatWithAnyone: true,
    canChatWithMatches: true,
    canManageCompany: true,
    canViewMultipleCompanies: true,
  },

  superadmin: {
    canViewGlobalDashboard: true,
    canViewCompanyDashboard: true,
    canViewPersonalDashboard: false,
    canCreatePrograms: true,
    canEditPrograms: true,
    canViewPrograms: true,
    canDeletePrograms: true,
    canCreateParticipants: true,
    canEditParticipants: true,
    canViewAllParticipants: true,
    canViewAssignedParticipants: true,
    canCreateMatches: true,
    canViewAllMatches: true,
    canViewOwnMatches: true,
    canRegisterSessions: true,
    canViewSessions: true,
    canViewAnalytics: true,
    canExportData: true,
    canInviteUsers: true,
    canManageUsers: true,
    canChatWithAnyone: true,
    canChatWithMatches: true,
    canManageCompany: true,
    canViewMultipleCompanies: true,
  },

  inspiratoria_admin: {
    canViewGlobalDashboard: true,
    canViewCompanyDashboard: true,
    canViewPersonalDashboard: false,
    canCreatePrograms: true,
    canEditPrograms: true,
    canViewPrograms: true,
    canDeletePrograms: true,
    canCreateParticipants: true,
    canEditParticipants: true,
    canViewAllParticipants: true,
    canViewAssignedParticipants: true,
    canCreateMatches: true,
    canViewAllMatches: true,
    canViewOwnMatches: true,
    canRegisterSessions: true,
    canViewSessions: true,
    canViewAnalytics: true,
    canExportData: true,
    canInviteUsers: true,
    canManageUsers: true,
    canChatWithAnyone: true,
    canChatWithMatches: true,
    canManageCompany: true,
    canViewMultipleCompanies: true,
  },

  client: {
    canViewGlobalDashboard: false,
    canViewCompanyDashboard: true,
    canViewPersonalDashboard: false,
    canCreatePrograms: false,
    canEditPrograms: false,
    canViewPrograms: true,
    canDeletePrograms: false,
    canCreateParticipants: false,
    canEditParticipants: false,
    canViewAllParticipants: true,
    canViewAssignedParticipants: true,
    canCreateMatches: false,
    canViewAllMatches: true,
    canViewOwnMatches: false,
    canRegisterSessions: false,
    canViewSessions: true,
    canViewAnalytics: true,
    canExportData: true,
    canInviteUsers: false,
    canManageUsers: false,
    canChatWithAnyone: false,
    canChatWithMatches: false,
    canManageCompany: false,
    canViewMultipleCompanies: false,
  },

  admin: {
    canViewGlobalDashboard: false,
    canViewCompanyDashboard: true,
    canViewPersonalDashboard: false,
    canCreatePrograms: true,
    canEditPrograms: true,
    canViewPrograms: true,
    canDeletePrograms: true,
    canCreateParticipants: true,
    canEditParticipants: true,
    canViewAllParticipants: true,
    canViewAssignedParticipants: true,
    canCreateMatches: true,
    canViewAllMatches: true,
    canViewOwnMatches: true,
    canRegisterSessions: true,
    canViewSessions: true,
    canViewAnalytics: true,
    canExportData: true,
    canInviteUsers: true,
    canManageUsers: true,
    canChatWithAnyone: true,
    canChatWithMatches: true,
    canManageCompany: true,
    canViewMultipleCompanies: false,
  },

  coordinator: {
    // Backward compatibility - same as admin
    canViewGlobalDashboard: false,
    canViewCompanyDashboard: true,
    canViewPersonalDashboard: false,
    canCreatePrograms: true,
    canEditPrograms: true,
    canViewPrograms: true,
    canDeletePrograms: true,
    canCreateParticipants: true,
    canEditParticipants: true,
    canViewAllParticipants: true,
    canViewAssignedParticipants: true,
    canCreateMatches: true,
    canViewAllMatches: true,
    canViewOwnMatches: true,
    canRegisterSessions: true,
    canViewSessions: true,
    canViewAnalytics: true,
    canExportData: true,
    canInviteUsers: true,
    canManageUsers: true,
    canChatWithAnyone: true,
    canChatWithMatches: true,
    canManageCompany: true,
    canViewMultipleCompanies: false,
  },

  facilitator_internal: {
    canViewGlobalDashboard: false,
    canViewCompanyDashboard: true,
    canViewPersonalDashboard: false,
    canCreatePrograms: false,
    canEditPrograms: false,
    canViewPrograms: true,
    canDeletePrograms: false,
    canCreateParticipants: false,
    canEditParticipants: false,
    canViewAllParticipants: true,
    canViewAssignedParticipants: true,
    canCreateMatches: false,
    canViewAllMatches: true,
    canViewOwnMatches: false,
    canRegisterSessions: true,
    canViewSessions: true,
    canViewAnalytics: true,
    canExportData: false,
    canInviteUsers: false,
    canManageUsers: false,
    canChatWithAnyone: false,
    canChatWithMatches: false,
    canManageCompany: false,
    canViewMultipleCompanies: false,
  },

  facilitator_inspiratoria: {
    canViewGlobalDashboard: false,
    canViewCompanyDashboard: true,
    canViewPersonalDashboard: false,
    canCreatePrograms: false,
    canEditPrograms: false,
    canViewPrograms: true,
    canDeletePrograms: false,
    canCreateParticipants: false,
    canEditParticipants: false,
    canViewAllParticipants: true,
    canViewAssignedParticipants: true,
    canCreateMatches: false,
    canViewAllMatches: true,
    canViewOwnMatches: false,
    canRegisterSessions: true,
    canViewSessions: true,
    canViewAnalytics: true,
    canExportData: true,
    canInviteUsers: false,
    canManageUsers: false,
    canChatWithAnyone: false,
    canChatWithMatches: false,
    canManageCompany: false,
    canViewMultipleCompanies: true, // Can see multiple assigned companies
  },

  mentor: {
    canViewGlobalDashboard: false,
    canViewCompanyDashboard: false,
    canViewPersonalDashboard: true,
    canCreatePrograms: false,
    canEditPrograms: false,
    canViewPrograms: true, // Only their program
    canDeletePrograms: false,
    canCreateParticipants: false,
    canEditParticipants: false,
    canViewAllParticipants: false,
    canViewAssignedParticipants: false,
    canCreateMatches: false,
    canViewAllMatches: false,
    canViewOwnMatches: true,
    canRegisterSessions: false,
    canViewSessions: true, // Only their sessions
    canViewAnalytics: false,
    canExportData: false,
    canInviteUsers: false,
    canManageUsers: false,
    canChatWithAnyone: false,
    canChatWithMatches: true,
    canManageCompany: false,
    canViewMultipleCompanies: false,
  },

  mentee: {
    canViewGlobalDashboard: false,
    canViewCompanyDashboard: false,
    canViewPersonalDashboard: true,
    canCreatePrograms: false,
    canEditPrograms: false,
    canViewPrograms: true, // Only their program
    canDeletePrograms: false,
    canCreateParticipants: false,
    canEditParticipants: false,
    canViewAllParticipants: false,
    canViewAssignedParticipants: false,
    canCreateMatches: false,
    canViewAllMatches: false,
    canViewOwnMatches: true,
    canRegisterSessions: false,
    canViewSessions: true, // Only their sessions
    canViewAnalytics: false,
    canExportData: false,
    canInviteUsers: false,
    canManageUsers: false,
    canChatWithAnyone: false,
    canChatWithMatches: true,
    canManageCompany: false,
    canViewMultipleCompanies: false,
  },
};

export function getPermissions(role: UserRole): Permission {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.mentee;
}

export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  const permissions = getPermissions(role);
  return permissions[permission];
}

// Helper functions for common checks
export function isAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'superadmin' || role === 'inspiratoria_admin' || role === 'coordinator';
}

export function isFacilitator(role: UserRole): boolean {
  return role === 'facilitator_internal' || role === 'facilitator_inspiratoria';
}

export function isParticipant(role: UserRole): boolean {
  return role === 'mentor' || role === 'mentee';
}

export function canManagePrograms(role: UserRole): boolean {
  return hasPermission(role, 'canCreatePrograms');
}

export function canManageParticipants(role: UserRole): boolean {
  return hasPermission(role, 'canCreateParticipants');
}

export function canDoMatching(role: UserRole): boolean {
  return hasPermission(role, 'canCreateMatches');
}

// Role display names
export const ROLE_NAMES: Record<UserRole, string> = {
  admin_root: 'Admin Root',
  superadmin: 'Super Administrador',
  inspiratoria_admin: 'Admin Inspiratoria',
  client: 'Cliente',
  admin: 'Administrador',
  coordinator: 'Coordinador',
  facilitator_internal: 'Facilitador Interno',
  facilitator_inspiratoria: 'Facilitador Inspiratoria',
  mentor: 'Mentor',
  mentee: 'Mentee',
};

// Role icons
export const ROLE_ICONS: Record<UserRole, string> = {
  admin_root: '🔐',
  superadmin: '👑',
  inspiratoria_admin: '⭐',
  client: '💼',
  admin: '👑',
  coordinator: '👑',
  facilitator_internal: '🎯',
  facilitator_inspiratoria: '🎯',
  mentor: '👨‍🏫',
  mentee: '👨‍🎓',
};

export function getRoleName(role: UserRole): string {
  return ROLE_NAMES[role] || role;
}

export function getRoleIcon(role: UserRole): string {
  return ROLE_ICONS[role] || '👤';
}
