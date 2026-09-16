import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import type { OwnerDashboardStats } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  FileSpreadsheet,
  MessageSquare,
  Calendar,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function OwnerDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['owner-dashboard-stats'],
    queryFn: async () => {
      const res = await api.get<{ data: OwnerDashboardStats } | OwnerDashboardStats>('/owners/dashboard');
      return (res.data as { data: OwnerDashboardStats }).data || res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Biens en gestion',
      value: stats?.totalProperties || 0,
      sub: `${stats?.rentedProperties || 0} loués · ${stats?.soldProperties || 0} vendus`,
      icon: Building2,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      label: 'Annonces actives',
      value: stats?.activeListings || 0,
      sub: `${stats?.draftListings || 0} brouillons`,
      icon: FileSpreadsheet,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Revenus locatifs / mois',
      value: `${(stats?.monthlyRentalIncome || 0).toLocaleString('fr-FR')} €`,
      sub: 'Baux actifs cumulés',
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
    },
    {
      label: 'Visites programmées',
      value: stats?.upcomingVisits || 0,
      sub: `${stats?.totalVisits || 0} visites totales`,
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
            Tableau de Bord Bailleur
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Gérez votre patrimoine immobilier en toute sérénité
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/80 mt-2 max-w-xl">
            Suivez l'état de vos biens, vos candidatures en cours, vos visites et encaissez vos loyers en quelques clics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/owner/properties">
            <Button className="rounded-2xl bg-white text-indigo-950 font-bold hover:bg-white/90 text-xs shadow-lg">
              <Plus className="h-4 w-4 mr-1.5" />
              Ajouter un bien
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, idx) => {
          const Icon = k.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{k.label}</span>
                <div className={`p-2.5 rounded-2xl ${k.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-foreground">{k.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 2 colonnes : Demandes récentes & Prochaines visites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demandes récentes */}
        <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-bold text-foreground">Dernières demandes</h3>
            </div>
            <Link
              to="/owner/inquiries"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {(stats?.recentInquiries?.length || 0) === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              Aucune demande reçue pour le moment.
            </p>
          ) : (
            <div className="space-y-2.5">
              {stats?.recentInquiries?.map((inq) => (
                <div
                  key={inq.id}
                  className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-foreground line-clamp-1">
                      {inq.subject}
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{inq.name || inq.email || 'Visiteur'}</span>
                      <span>·</span>
                      <span>{inq.listingTitle}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold shrink-0">
                    {inq.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prochaines visites */}
        <div className="p-6 rounded-3xl border border-border/80 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h3 className="text-base font-bold text-foreground">Visites à venir</h3>
            </div>
            <Link
              to="/owner/visits"
              className="text-xs font-bold text-purple-600 hover:text-purple-500 flex items-center gap-1"
            >
              Agenda <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {(stats?.recentVisits?.length || 0) === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              Aucune visite planifiée prochainement.
            </p>
          ) : (
            <div className="space-y-2.5">
              {stats?.recentVisits?.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground line-clamp-1">
                        {v.listingTitle}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(v.scheduledAt).toLocaleString('fr-FR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })} · {v.clientName}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold shrink-0">
                    {v.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
