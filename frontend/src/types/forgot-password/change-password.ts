export interface ChangePasswordRequest {
  email: string;
  code: string;
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}