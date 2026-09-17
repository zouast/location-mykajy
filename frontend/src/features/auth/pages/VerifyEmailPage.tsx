import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Building2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setMessage("Aucun jeton de vérification n'a été fourni.");
      return;
    }

    let isMounted = true;
    const verify = async () => {
      try {
        const res = await authService.verifyEmail(token);
        if (isMounted) {
          setIsSuccess(true);
          setMessage(
            res.message ||
              'Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant vous connecter.',
          );
        }
      } catch (err: unknown) {
        if (isMounted) {
          setIsSuccess(false);
          const axiosError = err as {
            response?: { data?: { message?: string } };
          };
          setMessage(
            axiosError.response?.data?.message ||
              'Le lien de vérification est invalide ou a expiré.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Building2 className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Vérification de compte
          </h1>
        </div>

        <div className="rounded-3xl bg-card p-8 ring-1 ring-border/80 shadow-2xl text-center">
          {isLoading ? (
            <div className="py-10 space-y-4">
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                Vérification de votre adresse email en cours…
              </p>
              <p className="text-xs text-muted-foreground">
                Veuillez patienter un instant.
              </p>
            </div>
          ) : isSuccess ? (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-600/10">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Email vérifié !
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {message}
                </p>
              </div>

              <Button
                id="btn-login-verified"
                onClick={() => navigate('/login')}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-600/25 py-6 text-sm flex items-center justify-center gap-2"
              >
                <span>Se connecter</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-lg shadow-destructive/10">
                <XCircle className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Échec de vérification
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/register')}
                  variant="outline"
                  className="w-full rounded-xl font-semibold py-5 text-xs"
                >
                  Retour à l'inscription
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white py-5 text-xs"
                >
                  Page de connexion
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
