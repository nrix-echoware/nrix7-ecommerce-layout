const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:9997';

const ADMIN_KEY_STORAGE = 'admin_api_key';

export interface GeneratePasswordResetTokenRequest {
  email: string;
}

export interface GeneratePasswordResetTokenResponse {
  token: string;
  reset_link: string;
  expires_at: string;
}

export interface ResetPasswordRequest {
  token: string;
  newpassword: string;
}

export async function generatePasswordResetToken(email: string): Promise<GeneratePasswordResetTokenResponse> {
  const adminKey = sessionStorage.getItem(ADMIN_KEY_STORAGE);
  if (!adminKey) {
    throw new Error('Admin key required');
  }

  const response = await fetch(`${API_BASE}/admin/password-reset/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-API-Key': adminKey,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate reset token' }));
    throw new Error(error.error || 'Failed to generate reset token');
  }

  return response.json();
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newpassword: newPassword }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to reset password' }));
    throw new Error(error.error || 'Failed to reset password');
  }

  return response.json();
}

