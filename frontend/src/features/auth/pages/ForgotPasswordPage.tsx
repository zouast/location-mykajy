import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email('Adresse email valide requise'),
});
type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await authService.forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setServerError(
        axiosError.response?.data?.message ||
          'Une erreur est survenue lors de la demande de réinitialisation.',
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
            Mot de passe oublié
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-card p-6 sm:p-8 ring-1 ring-border/80 shadow-xl">
          {isSubmitted ? (
            <div className="py-4 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-base text-foreground">Email de réinitialisation envoyé</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Si un compte correspond à cette adresse email, un lien d'instructions vous a été envoyé. Veuillez vérifier votre boîte de réception et vos courriers indésirables.
              </p>
              <Link to="/login" className="inline-block mt-4">
                <Button className="rounded-xl bg-indigo-600 text-white font-semibold text-xs">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Retour à la connexion
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

              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs font-semibold">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-md shadow-indigo-600/20 py-5 text-xs"
              >
                {isLoading ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
              </Button>

              <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border/60">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                >
                  <ArrowLeft className="h-3 w-3" /> Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
