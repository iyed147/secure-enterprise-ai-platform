export type MockLoginResponse = {
  access_token: string;
  token_type: "bearer";
  user_id: number;
  full_name: string;
  email: string;
  role: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user_id: number;
  full_name: string;
  email: string;
  role: string;
};

export type MeResponse = {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
};

export type DocumentResponse = {
  id: number;
  title: string;
  file_name: string;
  owner_role: string;
  allowed_roles: string[];
  status: string;
  created_at: string;
};

export type FaceEnrollResponse = {
  success: boolean;
  message: string;
};

export type FaceLoginResponse = {
  access_token: string;
  token_type: "bearer";
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  match_distance: number;
};

export type DocumentUploadResponse = {
  id: number;
  title: string;
  file_name: string;
  status: string;
  message: string;
};