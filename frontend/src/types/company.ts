// Types para el nuevo sistema de Company y User
export interface Company {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  company_size?: string;
  website?: string;
  plan: "trial" | "startup" | "growth" | "enterprise";
  status: "trial" | "active" | "suspended" | "cancelled";
  max_users: number;
  max_programs: number;
  max_participants: number;
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  onboarding_completed: boolean;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_id?: string;
  position?: string;
  department?: string;
  avatar_url?: string;
  is_onboarded: boolean;
  created_at: string;
}

export type UserRole =
  | "admin_root"
  | "superadmin"
  | "inspiratoria_admin"
  | "coordinator"
  | "client"
  | "admin"
  | "facilitator_internal"
  | "facilitator_inspiratoria"
  | "mentor"
  | "mentee";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin_root: "Admin Root",
  superadmin: "Super Administrador",
  inspiratoria_admin: "Admin Inspiratoria",
  coordinator: "Coordinador",
  client: "Cliente",
  admin: "Administrador",
  facilitator_internal: "Facilitador Interno",
  facilitator_inspiratoria: "Facilitador Inspiratoria",
  mentor: "Mentor",
  mentee: "Mentee",
};

export interface OnboardingStep1Data {
  name: string;
  industry?: string;
  company_size?: string;
  website?: string;
}

export interface OnboardingStep2Data {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  phone?: string;
  position?: string;
}

export interface OnboardingStep3Data {
  primary_color?: string;
  secondary_color?: string;
  initial_program_name?: string;
  initial_program_description?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  company?: Company;
  token: string;
  message: string;
}

export interface OnboardingCompleteResponse {
  company: Company;
  user: User;
  token: string;
  next_steps: string[];
  message: string;
}
