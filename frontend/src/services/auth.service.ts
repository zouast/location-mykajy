import api, { tokenStorage } from '@/services/api';
import type { AuthResponse, User, MessageResponse, RegisterResponse } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  passwordConfirmation?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'LOCATAIRE' | 'PROPRIETAIRE';
  acceptTerms?: boolean;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  gender?: string;
}

export const authService = {
  /** Connexion utilisateur */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', payload);
    const data = (res.data as unknown as { data: AuthResponse }).data || res.data;
    if (data.tokens?.accessToken && data.tokens?.refreshToken) {
      tokenStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    }
    return data;
  },

  /** Inscription utilisateur */
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const res = await api.post<RegisterResponse>('/auth/register', payload);
    return res.data;
  },

  /** Vérification email */
  async verifyEmail(token: string): Promise<MessageResponse> {
    const res = await api.post<MessageResponse>('/auth/verify-email', { token });
    return (res.data as unknown as { data: MessageResponse }).data || res.data;
  },

  /** Déconnexion */
  async logout(): Promise<void> {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenStorage.clearTokens();
    }
  },

  /** Demande de réinitialisation de mot de passe (envoi d'email) */
  async forgotPassword(email: string): Promise<MessageResponse> {
    const res = await api.post<MessageResponse>('/auth/forgot-password', { email });
    return (res.data as unknown as { data: MessageResponse }).data || res.data;
  },

  /** Réinitialisation avec token */
  async resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
    const res = await api.post<MessageResponse>('/auth/reset-password', {
      token,
      newPassword,
    });
    return (res.data as unknown as { data: MessageResponse }).data || res.data;
  },

  /** Récupérer son profil complet (GET /users/me) */
  async getProfile(): Promise<User> {
    const res = await api.get<User>('/users/me');
    return (res.data as unknown as { data: User }).data || res.data;
  },

  /** Modifier son profil */
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const res = await api.patch<User>('/users/me', payload);
    return (res.data as unknown as { data: User }).data || res.data;
  },

  /** Modifier son téléphone */
  async updatePhone(phone: string): Promise<User> {
    const res = await api.patch<User>('/users/me/phone', { phone });
    return (res.data as unknown as { data: User }).data || res.data;
  },

  /** Modifier son adresse email */
  async updateEmail(newEmail: string, currentPassword: string): Promise<{ user: User; message: string }> {
    const res = await api.patch<{ user: User; message: string }>('/users/me/email', {
      newEmail,
      currentPassword,
    });
    return (res.data as unknown as { data: { user: User; message: string } }).data || res.data;
  },

  /** Modifier sa photo de profil */
  async updateAvatar(avatarUrl: string): Promise<User> {
    const res = await api.patch<User>('/users/me/avatar', { avatarUrl });
    return (res.data as unknown as { data: User }).data || res.data;
  },

  /** Changer son mot de passe */
  async changePassword(currentPassword: string, newPassword: string): Promise<MessageResponse> {
    const res = await api.post<MessageResponse>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return (res.data as unknown as { data: MessageResponse }).data || res.data;
  },

  /** Désactiver son compte */
  async deactivateAccount(password: string, reason?: string): Promise<MessageResponse> {
    const res = await api.post<MessageResponse>('/users/me/deactivate', {
      password,
      reason,
    });
    tokenStorage.clearTokens();
    return (res.data as unknown as { data: MessageResponse }).data || res.data;
  },
};
