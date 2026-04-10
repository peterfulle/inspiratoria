export type Program = {
  id: number;
  name: string;
  description: string;
  theme: string;
  status: string;
};

export type Participant = {
  id: number;
  full_name: string;
  role: "mentor" | "mentee";
  headline?: string;
  goals: string[];
  skills: string[];
  availability_hours: number;
  program_id: number;
};

// User & Company Types
export type User = {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "superadmin" | "client" | "admin" | "facilitator_internal" | "facilitator_inspiratoria" | "mentor" | "mentee";
  company_id?: string;
  position?: string;
  department?: string;
  avatar_url?: string;
  is_onboarded: boolean;
  created_at: string;
};

export type Company = {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  company_size?: string;
  website?: string;
  plan: string;
  status: string;
  max_users: number;
  max_programs: number;
  max_participants: number;
  primary_color: string;
  secondary_color: string;
  onboarding_completed: boolean;
  created_at: string;
};

export type Match = {
  id: number;
  program_id: number;
  mentor: Participant;
  mentee: Participant;
  status: string;
  score: number;
  created_at: string;
};

export type Notification = {
  id: number;
  recipient_id: string;
  sender_id?: string | null;
  sender_name?: string | null;
  notification_type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
  match_id?: number;
  milestone_id?: number;
};

export type KeyResult = {
  id: number;
  goal_id: number;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  completed: boolean;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
};

export type Goal = {
  id: number;
  match_id: number;
  title: string;
  description: string;
  goal_type: string;
  priority: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  time_bound: string;
  progress_percentage: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by_id?: number;
  is_overdue: boolean;
  days_remaining: number;
  key_results: KeyResult[];
};

export type GoalUpdate = {
  id: number;
  goal_id: number;
  user_id: number;
  note: string;
  progress_before: number;
  progress_after: number;
  created_at: string;
};

// AI Types
export interface AIGoalRecommendation {
  title: string;
  description: string;
  goal_type: string;
  priority: string;
  rationale: string;
  key_results: Array<{
    description: string;
    target_value: number;
    unit: string;
  }>;
  estimated_duration_weeks: number;
}

export interface AIAnalysis {
  sentiment: "positive" | "neutral" | "negative";
  engagement_level: "high" | "medium" | "low";
  confidence_score: number;
  risk_signals: string[];
  positive_signals: string[];
  recommendations: string[];
  summary: string;
  predictive_alerts: Array<{
    type: string;
    severity: string;
    title: string;
    message: string;
    action: string;
  }>;
}

export interface AIMatchHealth {
  health_score: number;
  health_status: "excellent" | "good" | "needs_attention" | "critical";
  engagement_metrics: {
    communication: string;
    goal_completion: string;
    session_frequency: string;
  };
  risk_factors: string[];
  strengths: string[];
  recommendations: string[];
  next_steps: string[];
  summary: string;
}

const FALLBACK_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001") + "/api";
const FALLBACK_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? FALLBACK_BASE_URL;
export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? FALLBACK_BACKEND_URL;

async function safeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBaseUrl}${path}`;
  console.log(`🌐 safeFetch: ${init?.method || 'GET'} ${url}`, init?.body ? JSON.parse(init.body as string) : '');
  
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  console.log(`📡 Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error ${response.status}:`, errorText);
    throw new Error(`API error ${response.status}`);
  }

  const data = await response.json() as T;
  console.log(`✅ Response data:`, data);
  return data;
}

export const ApiClient = {
  // GET methods
  getPrograms: () => safeFetch<Program[]>("/programs"),
  getMatches: () => safeFetch<Match[]>("/matches"),
  getParticipants: () => safeFetch<Participant[]>("/participants"),
  
  // POST methods
  createProgram: (data: { name: string; description: string; theme: string; status: string }) => {
    console.log("🔧 ApiClient.createProgram llamado con:", data);
    return safeFetch<Program>("/programs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  
  createParticipant: (data: {
    full_name: string;
    role: string;
    headline?: string;
    skills: string[];
    goals: string[];
    availability_hours: number;
    program_id: number;
  }) =>
    safeFetch<Participant>("/participants", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  createMatch: (data: {
    program_id: number;
    mentor_id: number;
    mentee_id: number;
    score: number;
  }) =>
    safeFetch<Match>("/matches", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  smartMatch: (programId: number) =>
    safeFetch<Match[]>("/matches/smart", {
      method: "POST",
      body: JSON.stringify({ program_id: programId }),
    }),
  
  // Sentiment methods
  createSentiment: (data: { match_id: number; rating: number; comment?: string }) =>
    safeFetch<any>("/sentiment", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  getMatchSentiment: (matchId: number) =>
    safeFetch<any[]>(`/sentiment/match/${matchId}`),
  
  getAllSentiments: () =>
    safeFetch<any[]>("/sentiment"),
  
  // Notification methods
  getUserNotifications: (userId: string | number, unreadOnly: boolean = false) =>
    safeFetch<Notification[]>(`/notifications/user/${userId}${unreadOnly ? "?unread_only=true" : ""}`),
  
  createNotification: (data: {
    recipient_id: number;
    notification_type: string;
    title: string;
    message: string;
    link?: string;
    match_id?: number;
    milestone_id?: number;
  }) =>
    safeFetch<Notification>("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  broadcastNotification: (data: {
    sender_id?: string;
    notification_type?: string;
    title: string;
    message: string;
    link?: string;
  }) =>
    safeFetch<{ status: string; recipients: number; notification_ids: number[] }>("/notifications/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  markNotificationsRead: (notificationIds: number[]) =>
    safeFetch<{ status: string; updated: number }>("/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify({ notification_ids: notificationIds }),
    }),
  
  getUnreadCount: (userId: string | number) =>
    safeFetch<{ unread_count: number }>(`/notifications/unread-count/${userId}`),
  
  deleteNotification: (notificationId: number) =>
    safeFetch<{ status: string }>(`/notifications/${notificationId}`, {
      method: "DELETE",
    }),
  
  // Goals & OKRs methods
  getMatchGoals: (matchId: number) =>
    safeFetch<Goal[]>(`/goals/match/${matchId}`),
  
  createGoal: (data: {
    match_id: number;
    title: string;
    description: string;
    goal_type?: string;
    priority?: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    time_bound: string;
    key_results?: Array<{
      description: string;
      target_value: number;
      current_value?: number;
      unit: string;
    }>;
  }) =>
    safeFetch<Goal>("/goals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  updateGoalProgress: (goalId: number, data: { user_id: number; note: string; progress_after: number }) =>
    safeFetch<{ status: string; progress: number }>(`/goals/${goalId}/progress`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  updateKeyResult: (krId: number, data: { current_value: number; completed?: boolean }) =>
    safeFetch<KeyResult>(`/key-results/${krId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  getGoalUpdates: (goalId: number) =>
    safeFetch<GoalUpdate[]>(`/goals/${goalId}/updates`),
  
  deleteGoal: (goalId: number) =>
    safeFetch<{ status: string }>(`/goals/${goalId}`, {
      method: "DELETE",
    }),
  
  // AI Endpoints
  getAIGoalRecommendations: (participantId: number, matchId?: number) =>
    safeFetch<{ recommendations: AIGoalRecommendation[] }>("/ai/recommendations", {
      method: "POST",
      body: JSON.stringify({
        participant_id: participantId,
        match_id: matchId,
      }),
    }),
  
  analyzeGoalWithAI: (goalId: number) =>
    safeFetch<AIAnalysis>("/ai/analyze-goal", {
      method: "POST",
      body: JSON.stringify({ goal_id: goalId }),
    }),
  
  analyzeMatchHealth: (matchId: number) =>
    safeFetch<AIMatchHealth>("/ai/match-health", {
      method: "POST",
      body: JSON.stringify({ match_id: matchId }),
    }),
  
  // ============= USER MANAGEMENT ENDPOINTS =============
  
  // Login
  login: (data: { username: string; password: string }) =>
    safeFetch<{ user: User; company?: Company; token: string; message: string }>("/companies/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  // List all users
  listUsers: (params?: { company_id?: string; role?: string; skip?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.company_id) queryParams.append("company_id", params.company_id);
    if (params?.role) queryParams.append("role", params.role);
    if (params?.skip) queryParams.append("skip", params.skip.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return safeFetch<User[]>(`/companies/users${query}`);
  },
  
  // Get single user
  getUser: (userId: string) =>
    safeFetch<User>(`/companies/users/${userId}`),
  
  // Create user
  createUser: (data: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role: string;
    company_id?: string;
    position?: string;
    department?: string;
    phone?: string;
  }) =>
    safeFetch<User>("/companies/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  // Update user
  updateUser: (userId: string, data: Partial<{
    email: string;
    full_name: string;
    role: string;
    position: string;
    department: string;
    phone: string;
    avatar_url: string;
    is_onboarded: boolean;
  }>) =>
    safeFetch<User>(`/companies/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  // Delete user
  deleteUser: (userId: string) =>
    safeFetch<void>(`/companies/users/${userId}`, {
      method: "DELETE",
    }),
  
  // Reset user password
  resetUserPassword: (userId: string, newPassword: string) =>
    safeFetch<{ message: string }>(`/companies/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword }),
    }),
  
  // Get user statistics
  getUsersStats: () =>
    safeFetch<{
      total_users: number;
      users_by_role: Record<string, number>;
      users_by_company: Record<string, number>;
      onboarded_users: number;
      pending_onboarding: number;
    }>("/companies/users/stats/summary"),
  
  // Company methods
  getCompany: (companyId: string) =>
    safeFetch<Company>(`/companies/companies/${companyId}`),
  
  getCompanyUsers: (companyId: string) =>
    safeFetch<User[]>(`/companies/companies/${companyId}/users`),
};
