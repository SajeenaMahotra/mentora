import api from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";

type Role = "learner" | "mentor";

interface LoginSuccess {
  success: true;
  mfaRequired?: false;
  data: {
    _id: string;
    fullname: string;
    email: string;
    role: Role | "admin";
    isProfileSetup: boolean;
  };
  token: string;
}

interface LoginMfaRequired {
  success: true;
  mfaRequired: true;
  tempToken: string;
}

interface ActionFailure {
  success: false;
  message: string;
}

export async function loginAction(
  email: string,
  password: string,
  captchaToken: string
): Promise<LoginSuccess | LoginMfaRequired | ActionFailure> {
  try {
    const res = await api.post(ENDPOINTS.LOGIN, { email, password, captchaToken });
    return res.data;
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Invalid email or password" };
  }
}

export async function mfaLoginVerifyAction(tempToken: string, code: string) {
  try {
    const res = await api.post(ENDPOINTS.MFA_LOGIN_VERIFY, { tempToken, code });
    return res.data as LoginSuccess;
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Invalid code" } as ActionFailure;
  }
}

export async function registerAction(data: {
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  captchaToken: string;
}) {
  try {
    const res = await api.post(ENDPOINTS.REGISTER, data);
    return { success: true, data: res.data };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Registration failed" };
  }
}

export async function forgotPasswordAction(email: string) {
  try {
    await api.post(ENDPOINTS.FORGOT_PASSWORD, { email });
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function resetPasswordAction(token: string, password: string, confirmPassword: string) {
  try {
    await api.post(ENDPOINTS.RESET_PASSWORD, { token, password, confirmPassword });
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}

export async function unlockAccountAction(token: string) {
  try {
    await api.post(ENDPOINTS.UNLOCK_ACCOUNT, { token });
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || "Failed" };
  }
}