import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères'),
    confirmPassword: z.string().min(8, 'Veuillez confirmer le mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormValues) => {
    if (!token) {
      setServerError('Token de réinitialisation manquant ou invalide.');
      return;
    }

    setIsLoading(true);
    setServerError(null);
    try {
      await authService.resetPassword(token, data.password);
      setIsSuccess(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setServerError(
        axiosError.response?.data?.message ||
          'Ce lien de réinitialisation est invalide ou a expiré.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Building2 className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Nouveau mot de passe
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Choisissez un mot de passe sécurisé pour votre compte
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-card p-6 sm:p-8 ring-1 ring-border/80 shadow-xl">
          {isSuccess ? (
            <div className="py-4 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-base text-foreground">Mot de passe réinitialisé !</h3>
              <p className="text-xs text-muted-foreground">
                Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <Link to="/login" className="inline-block mt-4">
                <Button className="rounded-xl bg-indigo-600 text-white font-semibold text-xs">
                  Se connecter <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive font-medium">
                  {serverError}
                </div>
              )}

              {!token && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-600 font-medium">
                  ⚠️ Aucun token de réinitialisation détecté dans l'URL. Veuillez cliquer sur le lien reçu par email.
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reset-password" className="text-xs font-semibold">
                  Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 rounded-xl text-xs"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="reset-confirm-password" className="text-xs font-semibold">
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 rounded-xl text-xs"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !token}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-md shadow-indigo-600/20 py-5 text-xs"
              >
                {isLoading ? 'Mise à jour…' : 'Changer mon mot de passe'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
