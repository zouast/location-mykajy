import { Settings, Shield, Bell } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-slate-700 dark:text-slate-300" />
          Paramètres Généraux de la Plateforme
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configuration des passerelles de paiement, fournisseurs SMS et politiques de publication.
        </p>
      </div>

      <div className="space-y-4 max-w-3xl">
        <div className="p-5 rounded-3xl border border-border/80 bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-foreground">Fournisseurs de Paiement</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Stripe Connect et Mobile Money sont actifs en environnement sécurisé.
          </p>
        </div>

        <div className="p-5 rounded-3xl border border-border/80 bg-card space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            <h3 className="text-sm font-bold text-foreground">Passerelle de Notifications</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Envoi d'e-mails transactionnels (SMTP) et notifications push in-app.
          </p>
        </div>
      </div>
    </div>
  );
}
