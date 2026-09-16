import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Phone,
  LogOut,
  Save,
  Lock,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, updateProfile, refreshProfile } = useAuth();

  // Personal Info Form State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Feedback states
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [phoneMessage, setPhoneMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      await updateProfile({ firstName, lastName, gender: gender || undefined });
      setProfileMessage({ type: 'success', text: 'Informations personnelles mises à jour avec succès.' });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setProfileMessage({
        type: 'error',
        text: axiosError.response?.data?.message || 'Erreur lors de la mise à jour.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Phone Update
  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPhone(true);
    setPhoneMessage(null);
    try {
      await authService.updatePhone(phone);
      await refreshProfile();
      setPhoneMessage({ type: 'success', text: 'Numéro de téléphone mis à jour avec succès.' });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setPhoneMessage({
        type: 'error',
        text: axiosError.response?.data?.message || 'Erreur lors de la mise à jour du téléphone.',
      });
    } finally {
      setSavingPhone(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    setSavingPassword(true);
    setPasswordMessage(null);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setPasswordMessage({
        type: 'error',
        text: axiosError.response?.data?.message || 'Mot de passe actuel incorrect ou invalide.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* ── Page Header ── */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-2xl shadow-lg shadow-indigo-600/30">
            {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
              </h1>
              <Badge className="rounded-full bg-indigo-600 text-white text-[10px]">
                {user.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => logout()}
          className="rounded-xl gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Se déconnecter
        </Button>
      </div>

      {/* ── Grid Sections ── */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Section 1 : Informations Personnelles */}
        <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-foreground mb-4 border-b border-border/50 pb-3">
            <User className="h-4 w-4 text-indigo-600" />
            <span>Informations personnelles</span>
          </div>

          {profileMessage && (
            <div
              className={`mb-4 rounded-xl p-3 text-xs font-medium ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
            >
              {profileMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Prénom</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Votre prénom"
                  className="text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nom</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Votre nom"
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Genre / Civilité</Label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Non spécifié</option>
                <option value="MALE">Monsieur</option>
                <option value="FEMALE">Madame</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Adresse email</Label>
              <Input
                value={user.email}
                disabled
                className="text-xs rounded-xl bg-muted/60 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-[10px] text-muted-foreground">L'email principal est géré avec vérification sécurisée.</p>
            </div>

            <Button
              type="submit"
              disabled={savingProfile}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs shadow-md shadow-indigo-600/20"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {savingProfile ? 'Enregistrement…' : 'Mettre à jour mon profil'}
            </Button>
          </form>
        </div>

        {/* Section 2 : Téléphone & Coordonnées */}
        <div className="space-y-8">
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground mb-4 border-b border-border/50 pb-3">
              <Phone className="h-4 w-4 text-indigo-600" />
              <span>Numéro de téléphone</span>
            </div>

            {phoneMessage && (
              <div
                className={`mb-4 rounded-xl p-3 text-xs font-medium ${
                  phoneMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}
              >
                {phoneMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdatePhone} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Téléphone de contact</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+261 34 00 000 00"
                  className="text-xs rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={savingPhone}
                variant="outline"
                className="w-full rounded-xl text-xs font-bold border-indigo-600/40 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                {savingPhone ? 'Mise à jour…' : 'Enregistrer le numéro'}
              </Button>
            </form>
          </div>

          {/* Section 3 : Sécurité & Mot de passe */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground mb-4 border-b border-border/50 pb-3">
              <Lock className="h-4 w-4 text-indigo-600" />
              <span>Sécurité & Mot de passe</span>
            </div>

            {passwordMessage && (
              <div
                className={`mb-4 rounded-xl p-3 text-xs font-medium ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mot de passe actuel</Label>
                <Input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nouveau mot de passe</Label>
                <Input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Confirmer le nouveau mot de passe</Label>
                <Input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-xs rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={savingPassword}
                variant="outline"
                className="w-full rounded-xl text-xs font-bold border-indigo-600/40 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                {savingPassword ? 'Changement en cours…' : 'Changer le mot de passe'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
