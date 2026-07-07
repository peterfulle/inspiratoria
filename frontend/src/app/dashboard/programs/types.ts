// ═══════════════════════════════════════════════════════════════════
// TYPES - Program Templates (White Label)
// ═══════════════════════════════════════════════════════════════════

export interface Resource {
  id: string;
  name: string;
  type: "pdf" | "video" | "link" | "document" | "template";
  url: string;
  dataUrl?: string;   // base64 data URL for uploaded files (persistent)
  file?: File;         // transient File object (not serializable)
  fileName?: string;
  size?: string;
  description?: string;
}

export interface Activity {
  id: string;
  name: string;
  type: "exercise" | "reflection" | "roleplay" | "assessment" | "discussion";
  duration: string;
  description: string;
  required?: boolean;
}

export interface Module {
  id: string;
  name: string;
  duration: string;
  sessions: number;
  description: string;
  objectives: string[];
  resources: Resource[];
  activities: Activity[];
  sessions_detail?: SessionDetail[];
  startDate?: string;
  endDate?: string;
}

export interface MentorRequirements {
  maxMentees: number;
  minExperienceYears: number;
  requiredLevel: string;
  requireProfile: boolean;
  requireLinkedIn: boolean;
  requiredCertifications: string[];
  requiredSkills: string[];
}

export interface MenteeRequirements {
  canSelectMentor: boolean;
  maxMentors: number;
  requiredGoals: boolean;
  requireProfile: boolean;
  minTenure: number;
  requiredDepartments: string[];
}

export interface MatchingRules {
  algorithm: "manual" | "auto_skills" | "auto_goals" | "hybrid";
  allowPreferences: boolean;
  weighSkills: number;
  weighGoals: number;
  weighDepartment: number;
  weighSeniority: number;
}

export interface SessionRules {
  defaultDuration: number;
  frequencyPerMonth: number;
  allowReschedule: boolean;
  maxReschedules: number;
  reminderDays: number;
  requireAgenda: boolean;
  requireFeedback: boolean;
}

export interface SessionDetail {
  id: string;
  week: number;
  title: string;
  description?: string;
  duration: number | string;
  objectives?: string[];
  agenda: string[];
  homework: string;
  resources?: string[];
}

export interface Milestone {
  id: string;
  name: string;
  week: number;
  description: string;
  deliverable: string;
}

export interface ProgramTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  categories?: string[];
  duration: string;
  modules: Module[];
  status: "published" | "draft";
  mentorRequirements: MentorRequirements;
  menteeRequirements: MenteeRequirements;
  matchingRules: MatchingRules;
  sessionRules: SessionRules;
  milestones: Milestone[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = "grid" | "list";
export type ConfigTab = "general" | "modules" | "mentors" | "mentees" | "matching" | "sessions" | "milestones";
