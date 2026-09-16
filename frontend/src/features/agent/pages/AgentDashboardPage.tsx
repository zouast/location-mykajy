import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import type { AgentDashboardStats } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  Users,
  MessageSquare,
  Calendar,
  Award,
  TrendingUp,
  Plus,
} from 'lucide-react';

export default function AgentDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['agent-dashboard-stats'],
    queryFn: async () => {
      const res = await api.get<{ data: AgentDashboardStats } | AgentDashboardStats>('/agents/dashboard');
      return (res.data as { data: AgentDashboardStats }).data || res.data;
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
      label: 'Mandats actifs',
      value: stats?.activeListings || 0,
      sub: `${stats?.draftListings || 0} en rédaction`,
      icon: FileSpreadsheet,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      label: 'Prospects & Demandes',
      value: stats?.totalInquiries || 0,
      sub: `${stats?.pendingInquiries || 0} à traiter`,
      icon: MessageSquare,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
    },
    {
      label: 'Visites programmées',
      value: stats?.upcomingVisits || 0,
      sub: `${stats?.totalVisits || 0} au total`,
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Commissions perçues',
      value: `${(stats?.totalCommissionsEarned || 0).toLocaleString('fr-FR')} €`,
      sub: `${(stats?.pendingCommissions || 0).toLocaleString('fr-FR')} € en attente`,
      icon: Award,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
              Pilotage Commercial
            </span>
            {stats?.isAgencyAdmin && (
              <Badge className="bg-purple-500 text-white font-black text-[10px]">
                Directeur d'Agence ({stats.agencyName || 'Mon Agence'})
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Générez des opportunités et concluez vos transactions
          </h1>
          <p className="text-xs sm:text-sm text-purple-100/80 mt-2 max-w-xl">
            Suivez vos mandats, gérez les visites acquéreurs, les dossiers de location et vos commissions d'agence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/agent/listings">
            <Button className="rounded-2xl bg-white text-purple-950 font-bold hover:bg-white/90 text-xs shadow-lg">
              <Plus className="h-4 w-4 mr-1.5" />
              Nouveau mandat
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
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

      {/* Fast Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/agent/clients"
          className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all flex items-center gap-3"
        >
          <Users className="h-5 w-5 text-indigo-600" />
          <div className="text-xs font-bold text-foreground">Base Acquéreurs ({stats?.totalClients || 0})</div>
        </Link>
        <Link
          to="/agent/visits"
          className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all flex items-center gap-3"
        >
          <Calendar className="h-5 w-5 text-purple-600" />
          <div className="text-xs font-bold text-foreground">Agenda Visites ({stats?.upcomingVisits || 0})</div>
        </Link>
        <Link
          to="/agent/transactions"
          className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all flex items-center gap-3"
        >
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <div className="text-xs font-bold text-foreground">Ventes ({stats?.totalSales || 0})</div>
        </Link>
        <Link
          to="/agent/commissions"
          className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all flex items-center gap-3"
        >
          <Award className="h-5 w-5 text-amber-600" />
          <div className="text-xs font-bold text-foreground">Mes Honoraires</div>
        </Link>
      </div>
    </div>
  );
}
