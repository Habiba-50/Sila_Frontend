import apiClient from "./apiClient";

// POST /auth/signup  { username, email, password, confirmPassword, gender, phone }
export function signup(values) {
  return apiClient.post("/auth/signup", {
    ...values,
    gender: Number(values.gender),
  });
}

// PATCH /auth/confirm-email  { email, otp }
export function confirmEmail(values) {
  return apiClient.patch("/auth/confirm-email", values);
}

// PATCH /auth/resend-otp  { email }
export function resendOtp(values) {
  return apiClient.patch("/auth/resend-otp", values);
}

// POST /auth/login  { email, password, fcm? }
export function login(values) {
  return apiClient.post("/auth/login", values);
}

// Google Identity Services returns an ID token that the backend verifies.
export function signupWithGoogle(idToken) {
  return apiClient.post("/auth/signup/gmail", { idToken });
}

export function loginWithGoogle(idToken) {
  return apiClient.post("/auth/login/gmail", { idToken });
}

// POST /auth/forgot-password-otp  { email }
export function forgotPasswordOtp(values) {
  return apiClient.post("/auth/forgot-password-otp", values);
}

// PATCH /auth/verify-otp-password  { email, otp }
export function verifyOtpPassword(values) {
  return apiClient.post("/auth/verify-otp-password", values);
}

// PATCH /auth/reset-password  { email, password, confirmPassword }
export function resetPassword(values) {
  return apiClient.patch("/auth/reset-password", values);
}

// POST /rotate-token
export function rotateToken() {
  return apiClient.post("/user/rotate-token");
}


