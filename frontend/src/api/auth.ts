import api from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const loginUser = (email: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { email, password });

export const signupUser = (name: string, email: string, password: string, role: string) =>
  api.post<AuthResponse>('/auth/signup', { name, email, password, role });
