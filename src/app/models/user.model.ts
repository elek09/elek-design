import { AdminApiResponse } from './api.model';

export interface User {
  id: number;
  name: string;
  email: string;
  admin: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export type LoginResponse = AdminApiResponse<{ user: User }>;
