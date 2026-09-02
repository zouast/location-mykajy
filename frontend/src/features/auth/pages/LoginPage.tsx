import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/profile';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosError.response?.data?.message ||
        'Identifiants incorrects ou compte inactif. Veuillez réessayer.';
      setError('root', { message: msg });
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Building2 className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Espace Connexion
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Accédez à vos annonces, favoris et demandes de visite
          </p>
        </div>

        {/* Login Card Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-3xl bg-card p-6 sm:p-8 ring-1 ring-border/80 shadow-xl"
        >
          {errors.root && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive font-medium">
              {errors.root.message}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs font-semibold">
              Adresse email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                placeholder="nom@exemple.com"
                className="pl-10 rounded-xl text-xs"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs font-semibold">
                Mot de passe
              </Label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-password"
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

          {/* Submit */}
          <Button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-md shadow-indigo-600/20 py-5 text-xs"
          >
            {isLoading ? 'Connexion en cours…' : 'Se connecter'}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>

          {/* Link to Register */}
          <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/60">
            Vous n'avez pas encore de compte ?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:underline">
              Créer un compte
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
