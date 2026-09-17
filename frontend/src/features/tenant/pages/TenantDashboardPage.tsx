import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Search,
  Heart,
  FileText,
  Calendar,
  MessageSquare,
  CreditCard,
  Bell,
  ArrowRight,
  MapPin,
  Clock,
  CheckCircle2,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';

export default function TenantDashboardPage() {
  const { user } = useAuth();

  // Mock / loaded data for locataire dashboard
  const kpis = [
    {
      label: 'Candidatures actives',
      value: '2',
      sub: '1 en étude · 1 acceptée',
      icon: FileText,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      label: 'Visites programmées',
      value: '1',
      sub: 'Prochaine le 20/09 à 14h30',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Biens en favoris',
      value: '5',
      sub: '2 nouvelles baisses de prix',
      icon: Heart,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
    },
    {
      label: 'Paiement du loyer',
      value: 'À jour',
      sub: 'Prochain loyer : 01/10',
      icon: CreditCard,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
    },
  ];

  const applications = [
    {
      id: 'app-1',
      title: 'Appartement T3 Lumineux - Paris 11ème',
      address: '24 Rue Oberkampf, 75011 Paris',
      price: '1 250 € / mois',
      status: 'DOCUMENT_REVIEW',
      statusLabel: 'Dossier en cours d’étude',
      date: '14 Septembre 2026',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      id: 'app-2',
      title: 'Studio Moderne avec Balcon - Lyon 6ème',
      address: '12 Cours Vitton, 69006 Lyon',
      price: '680 € / mois',
      status: 'APPROVED',
      statusLabel: 'Dossier accepté',
      date: '10 Septembre 2026',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
  ];

  const upcomingVisits = [
    {
      id: 'v-1',
      property: 'T3 Vue Dégagée - Paris 11ème',
      date: 'Vendredi 20 Septembre 2026',
      time: '14:30',
      type: 'En personne',
      agent: 'Sophie Laurent (Conseillère)',
    },
  ];

  const recentSearches = [
    { label: 'Paris 11e · T2/T3 · Max 1 400 €', resultsCount: 18 },
    { label: 'Lyon 6e · Studio meublé · Max 750 €', resultsCount: 9 },
  ];

  const notifications = [
    {
      id: 'notif-1',
      title: 'Votre candidature pour le Studio Lyon 6ème a été acceptée !',
      time: 'Il y a 2 heures',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Confirmation de visite programmée le 20/09 à 14h30.',
      time: 'Hier à 16:45',
      read: true,
    },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-900 p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold text-white/90">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Espace Locataire certifié</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Bonjour, {user?.firstName ? `${user.firstName}` : 'Locataire'} !
          </h1>
          <p className="text-sm text-white/80 max-w-xl">
            Retrouvez ici le suivi de vos recherches, dossiers de location, visites prévues et gestion de vos quittances de loyer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/listings"
            className="inline-flex items-center gap-2 rounded-2xl bg-white text-indigo-900 hover:bg-white/90 font-bold text-xs shadow-lg py-3 px-4 transition-all"
          >
            <Search className="h-4 w-4 text-indigo-700" />
            <span>Trouver un logement</span>
          </Link>
          <Link
            to="/favorites"
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs py-3 px-4 transition-all"
          >
            <Heart className="h-4 w-4" />
            <span>Mes favoris</span>
          </Link>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl bg-card p-5 ring-1 ring-border/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${kpi.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">{kpi.label}</p>
                <h3 className="text-xl font-black text-foreground mt-0.5">{kpi.value}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Applications & Visits */}
        <div className="lg:col-span-2 space-y-8">
          {/* Candidatures / Demandes de location */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Candidatures en cours</h2>
                  <p className="text-xs text-muted-foreground">Suivez l'avancement de vos dossiers de location</p>
                </div>
              </div>
              <Link
                to="/rentals"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500 font-semibold"
              >
                <span>Voir tout</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-muted/40 border border-border/60 hover:bg-muted/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">{app.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{app.address}</span>
                    </p>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {app.price}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${app.badgeClass}`}>
                      {app.statusLabel}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{app.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visites prévues */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Visites programmées</h2>
                  <p className="text-xs text-muted-foreground">Vos prochains rendez-vous de visite</p>
                </div>
              </div>
              <Link
                to="/visits"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500 font-semibold"
              >
                <span>Gérer mes visites</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingVisits.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">{v.property}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      <span>
                        {v.date} à <strong className="text-foreground">{v.time}</strong>
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">{v.agent}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-card">
                      {v.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contrats & Paiements */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Bail & Paiements</h2>
                  <p className="text-xs text-muted-foreground">Consultez vos contrats et réglez vos loyers</p>
                </div>
              </div>
              <Link
                to="/payments"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-500 font-semibold"
              >
                <span>Historique</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Loyer du mois en cours
                </span>
                <p className="text-lg font-black text-foreground">1 250,00 €</p>
                <p className="text-xs text-muted-foreground">Échéance le 01 Octobre 2026</p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/payments"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md shadow-emerald-600/20 py-3 px-4 transition-all"
                >
                  Payer mon loyer en ligne
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Searches, Messages, Notifications */}
        <div className="space-y-6">
          {/* Recherches récentes */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Search className="h-4 w-4 text-indigo-600" />
                <span>Recherches récentes</span>
              </h2>
              <Link to="/saved-searches" className="text-xs text-indigo-600 hover:underline">
                Alertes
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentSearches.map((s, idx) => (
                <Link
                  key={idx}
                  to="/listings"
                  className="block p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors text-xs font-medium text-foreground group"
                >
                  <div className="flex items-center justify-between">
                    <span>{s.label}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{s.resultsCount} biens correspondants</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-indigo-600" />
                <span>Notifications</span>
              </h2>
              <Link to="/notifications" className="text-xs text-indigo-600 hover:underline">
                Tout marquer lu
              </Link>
            </div>

            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    !n.read
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/60'
                      : 'bg-card border-border/60'
                  }`}
                >
                  <p className="font-semibold text-foreground leading-snug">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground">{n.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Messagerie rapide */}
          <div className="rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                <span>Messages récents</span>
              </h2>
              <Link to="/messages" className="text-xs text-indigo-600 hover:underline">
                Messagerie
              </Link>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Discutez directement avec les propriétaires et les conseillers immobiliers concernant vos visites et dossiers.
            </p>

            <Link
              to="/messages"
              className={buttonVariants({
                variant: 'outline',
                className: 'w-full rounded-xl text-xs font-semibold py-3 flex items-center justify-center gap-2',
              })}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Ouvrir mes conversations</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
