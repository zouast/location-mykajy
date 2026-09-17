import React from 'react';
import { Home, KeyRound, Check, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export type PublicRole = 'LOCATAIRE' | 'PROPRIETAIRE';

interface RoleSelectorProps {
  selectedRole: PublicRole | null;
  onSelectRole: (role: PublicRole) => void;
  error?: string;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onSelectRole,
  error,
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center sm:text-left">
        <label className="block text-sm font-bold text-foreground">
          Choisissez votre profil <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground mt-0.5">
          Sélectionnez le type de compte correspondant à votre usage
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: LOCATAIRE */}
        <button
          type="button"
          id="btn-role-locataire"
          onClick={() => onSelectRole('LOCATAIRE')}
          className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 flex flex-col justify-between ${
            selectedRole === 'LOCATAIRE'
              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-md shadow-indigo-500/10'
              : 'border-border/80 bg-card hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:bg-accent/40'
          }`}
        >
          {selectedRole === 'LOCATAIRE' && (
            <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
              <Check className="h-4 w-4" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                  selectedRole === 'LOCATAIRE'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Profil Locataire
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Je suis locataire
                </h3>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Idéal pour trouver rapidement votre futur logement en toute simplicité.
            </p>

            <ul className="space-y-1.5 text-xs text-foreground/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>Trouver un bien & planifier des visites</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>Postuler et suivre ses candidatures</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>Signer son bail et payer son loyer en ligne</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Accès immédiat à l’espace locataire</span>
          </div>
        </button>

        {/* Option 2: PROPRIETAIRE */}
        <button
          type="button"
          id="btn-role-proprietaire"
          onClick={() => onSelectRole('PROPRIETAIRE')}
          className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 flex flex-col justify-between ${
            selectedRole === 'PROPRIETAIRE'
              ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-md shadow-emerald-500/10'
              : 'border-border/80 bg-card hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:bg-accent/40'
          }`}
        >
          {selectedRole === 'PROPRIETAIRE' && (
            <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
              <Check className="h-4 w-4" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                  selectedRole === 'PROPRIETAIRE'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                <Home className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Profil Bailleur
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Je suis propriétaire
                </h3>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Gérez votre patrimoine immobilier et optimisez votre rentabilité locative.
            </p>

            <ul className="space-y-1.5 text-xs text-foreground/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Publier des annonces et gérer ses biens</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Recevoir et analyser les dossiers candidats</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Générer les baux et encaisser les loyers</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Gestion locative sécurisée et certifiée</span>
          </div>
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive font-medium mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
