import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Eye, EyeOff, Lock, Mail, User, Phone, CheckCircle2 } from 'lucide-react';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'Le prénom doit comporter au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
    email: z.string().email('Adresse email invalide'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères'),
    confirmPassword: z.string().min(8, 'Veuillez confirmer le mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerAuth, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerAuth({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      });
      navigate('/profile');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosError.response?.data?.message ||
        'Une erreur est survenue lors de l’inscription. Cet email est peut-être déjà utilisé.';
      setError('root', { message: msg });
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Building2 className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Créer un compte
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Rejoignez Immo-MyKajy pour publier et trouver vos biens
          </p>
        </div>

        {/* Register Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-3xl bg-card p-6 sm:p-8 ring-1 ring-border/80 shadow-xl"
        >
          {errors.root && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive font-medium">
              {errors.root.message}
            </div>
          )}

          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reg-first-name" className="text-xs font-semibold">
                Prénom
              </Label>
              <Input
                id="reg-first-name"
                placeholder="Jean"
                className="rounded-xl text-xs"
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-[11px] text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-last-name" className="text-xs font-semibold">
                Nom
              </Label>
              <Input
                id="reg-last-name"
                placeholder="Dupont"
                className="rounded-xl text-xs"
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-[11px] text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-xs font-semibold">
              Adresse email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-email"
                type="email"
                placeholder="jean.dupont@exemple.com"
                className="pl-10 rounded-xl text-xs"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-phone" className="text-xs font-semibold">
              Téléphone (optionnel)
            </Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-phone"
                type="tel"
                placeholder="+261 34 00 000 00"
                className="pl-10 rounded-xl text-xs"
                {...register('phone')}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-password" className="text-xs font-semibold">
              Mot de passe (8 car. min)
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-password"
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
            <Label htmlFor="reg-confirm" className="text-xs font-semibold">
              Confirmer le mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-confirm"
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

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-md shadow-indigo-600/20 py-5 text-xs"
          >
            {isLoading ? 'Création du compte…' : 'Créer mon compte'}
          </Button>

          {/* Link to Login */}
          <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/60">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:underline">
              Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
