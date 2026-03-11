import axios from "axios";
import {
  Company,
  User,
  OnboardingStep1Data,
  OnboardingStep2Data,
  OnboardingStep3Data,
  LoginRequest,
  LoginResponse,
  OnboardingCompleteResponse,
} from "@/types/company";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export const companyApi = {
  // ============ ONBOARDING ============
  
  createCompanyStep1: async (data: OnboardingStep1Data): Promise<Company> => {
    const response = await axios.post<Company>(`${API_URL}/api/companies/onboarding/step1`, data);
    return response.data;
  },

  createSuperAdminStep2: async (companyId: string, data: OnboardingStep2Data): Promise<User> => {
    const response = await axios.post<User>(
      `${API_URL}/api/companies/onboarding/step2/${companyId}`,
      data
    );
    return response.data;
  },

  completeOnboardingStep3: async (
    companyId: string,
    userId: string,
    data: OnboardingStep3Data
  ): Promise<OnboardingCompleteResponse> => {
    const response = await axios.post<OnboardingCompleteResponse>(
      `${API_URL}/api/companies/onboarding/step3/${companyId}/${userId}`,
      data
    );
    return response.data;
  },

  // ============ AUTHENTICATION ============
  
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>(`${API_URL}/api/companies/auth/login`, data);
    return response.data;
  },

  // ============ COMPANY MANAGEMENT ============
  
  getCompany: async (companyId: string): Promise<Company> => {
    const response = await axios.get<Company>(`${API_URL}/api/companies/${companyId}`);
    return response.data;
  },

  listUsers: async (companyId: string): Promise<User[]> => {
    const response = await axios.get<User[]>(`${API_URL}/api/companies/${companyId}/users`);
    return response.data;
  },
};
