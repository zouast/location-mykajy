import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { RoleSelector, type PublicRole } from '../components/RoleSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  MailCheck,
} from 'lucide-react';

const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, 'Le prénom doit comporter au moins 2 caractères'),
    lastName: z
      .string()
      .trim()
      .min(2, 'Le nom doit comporter au moins 2 caractères'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Veuillez renseigner une adresse email valide'),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/.test(val),
        'Numéro de téléphone invalide (ex: +33 6 12 34 56 78)',
      ),
    role: z.enum(['LOCATAIRE', 'PROPRIETAIRE'] as const),
    password: z
      .string()
      .min(8, 'Le mot de passe doit comporter au moins 8 caractères')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
      ),
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Vous devez accepter les conditions générales d'utilisation",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredRole, setRegisteredRole] = useState<PublicRole | ''>('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'LOCATAIRE',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await authService.register({
        email: data.email,
        password: data.password,
        passwordConfirmation: data.confirmPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        role: data.role,
        acceptTerms: data.acceptTerms,
      });

      setRegisteredEmail(data.email);
      setRegisteredRole(data.role);
      setIsSuccess(true);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const responseMsg = axiosError.response?.data?.message;
      const msg = Array.isArray(responseMsg)
        ? responseMsg.join(' ')
        : responseMsg ||
          "Une erreur est survenue lors de l'inscription. Veuillez vérifier vos informations.";
      setError('root', { message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success Confirmation State
  if (isSuccess) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl bg-card p-8 sm:p-10 ring-1 ring-border/80 shadow-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-6 shadow-lg shadow-emerald-600/10">
              <MailCheck className="h-8 w-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 mb-3">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Compte créé avec succès
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-3">
              Vérifiez votre boîte email
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Votre compte a été créé avec succès en tant que{' '}
              <span className="font-bold text-foreground">
                {registeredRole === 'LOCATAIRE' ? 'Locataire' : 'Propriétaire'}
              </span>
              . Un lien d'activation sécurisé a été envoyé à l'adresse :
            </p>

            <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/80 text-sm font-semibold text-foreground break-all mb-6">
              {registeredEmail}
            </div>

            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-4 text-xs text-amber-900 dark:text-amber-200 text-left mb-8 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Activation obligatoire avant connexion :</span>
                <p className="mt-0.5 text-amber-800 dark:text-amber-300/90">
                  Pour garantir la sécurité de la plateforme, votre adresse email doit être vérifiée avant de pouvoir vous connecter.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                id="btn-go-to-login"
                onClick={() => navigate('/login')}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/25 py-6 text-sm flex items-center justify-center gap-2"
              >
                <span>Accéder à la page de connexion</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground font-medium underline"
              >
                Créer un autre compte
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Building2 className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Créer votre compte
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Rejoignez Immo-MyKajy pour trouver ou gérer vos biens immobiliers
          </p>
        </div>

        {/* Register Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-3xl bg-card p-6 sm:p-10 ring-1 ring-border/80 shadow-2xl"
        >
          {errors.root && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive font-medium">
              {errors.root.message}
            </div>
          )}

          {/* Role Selection (Locataire vs Propriétaire) */}
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <RoleSelector
                selectedRole={field.value}
                onSelectRole={(role) => field.onChange(role)}
                error={errors.role?.message}
              />
            )}
          />

          <div className="pt-2 border-t border-border/60">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Informations personnelles
            </h2>

            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-first-name" className="text-xs font-semibold">
                  Prénom <span className="text-destructive">*</span>
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
                  Nom <span className="text-destructive">*</span>
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

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-xs font-semibold">
                  Adresse email <span className="text-destructive">*</span>
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

              <div className="space-y-1.5">
                <Label htmlFor="reg-phone" className="text-xs font-semibold">
                  Téléphone (optionnel)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-phone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    className="pl-10 rounded-xl text-xs"
                    {...register('phone')}
                  />
                </div>
                {errors.phone && (
                  <p className="text-[11px] text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Password & Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-xs font-semibold">
                  Mot de passe <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 caractères"
                    className="pl-10 pr-10 rounded-xl text-xs"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm" className="text-xs font-semibold">
                  Confirmer le mot de passe <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Identique au mot de passe"
                    className="pl-10 pr-10 rounded-xl text-xs"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mb-4">
              Le mot de passe doit comporter au moins 8 caractères, une majuscule, une minuscule et un chiffre.
            </p>

            {/* Terms and conditions */}
            <div className="space-y-1.5 pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="reg-accept-terms"
                  className="h-4 w-4 mt-0.5 rounded border-border text-indigo-600 focus:ring-indigo-500"
                  {...register('acceptTerms')}
                />
                <span className="text-xs text-foreground/80 leading-relaxed">
                  J'accepte les{' '}
                  <Link to="/terms" className="font-semibold text-indigo-600 hover:underline">
                    conditions d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link to="/privacy" className="font-semibold text-indigo-600 hover:underline">
                    politique de confidentialité
                  </Link>{' '}
                  d'Immo-MyKajy.
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-[11px] text-destructive pl-7">{errors.acceptTerms.message}</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            id="btn-submit-register"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/25 py-6 text-sm"
          >
            {isSubmitting ? 'Création de votre compte…' : 'Créer mon compte'}
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
