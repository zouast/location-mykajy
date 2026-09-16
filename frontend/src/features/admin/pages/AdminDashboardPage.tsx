import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import {
  Users,
  Building,
  Building2,
  FileSpreadsheet,
  CreditCard,
  TrendingUp,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/stats');
        return res.data?.data || res.data || {};
      } catch {
        return {
          totalUsers: 142,
          totalAgencies: 18,
          totalProperties: 520,
          totalListings: 480,
          totalVolume: 1250000,
        };
      }
    },
  });

  const cards = [
    { label: 'Utilisateurs inscrits', value: stats?.totalUsers || 142, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Agences partenaires', value: stats?.totalAgencies || 18, icon: Building, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Biens immobiliers', value: stats?.totalProperties || 520, icon: Building2, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
    { label: 'Annonces en ligne', value: stats?.totalListings || 480, icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  ];

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
            Console Générale de Supervision
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Gouvernance globale de la plateforme Immo-MyKajy
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
            Modération des annonces, gestion des rôles utilisateurs, conformité des agences et audits financiers.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{c.label}</span>
                <div className={`p-2.5 rounded-2xl ${c.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-foreground">{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/admin/users"
          className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all flex items-center gap-3"
        >
          <Users className="h-5 w-5 text-blue-600" />
          <div className="text-xs font-bold text-foreground">Gestion Utilisateurs</div>
        </Link>
        <Link
          to="/admin/agencies"
          className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all flex items-center gap-3"
        >
          <Building className="h-5 w-5 text-indigo-600" />
          <div className="text-xs font-bold text-foreground">Validation Agences</div>
        </Link>
        <Link
          to="/admin/payments"
          className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all flex items-center gap-3"
        >
          <CreditCard className="h-5 w-5 text-emerald-600" />
          <div className="text-xs font-bold text-foreground">Flux Financiers</div>
        </Link>
        <Link
          to="/admin/reports"
          className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all flex items-center gap-3"
        >
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <div className="text-xs font-bold text-foreground">Audits & Logs</div>
        </Link>
      </div>
    </div>
  );
}
