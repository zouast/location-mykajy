import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileSpreadsheet,
  Users,
  MessageSquare,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  ArrowLeft,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AgentLayout() {
  const { user } = useAuth();

  const navItems = [
    { to: '/agent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/agent/properties', label: 'Portefeuille', icon: Building2 },
    { to: '/agent/listings', label: 'Mandats', icon: FileSpreadsheet },
    { to: '/agent/clients', label: 'Acquéreurs', icon: Users },
    { to: '/agent/inquiries', label: 'Leads', icon: MessageSquare },
    { to: '/agent/visits', label: 'Visites', icon: Calendar },
    { to: '/agent/transactions', label: 'Ventes & Baux', icon: DollarSign },
    { to: '/agent/commissions', label: 'Commissions', icon: Award },
    { to: '/agent/team', label: 'Équipe', icon: Building },
    { to: '/agent/stats', label: 'Performance', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Top Agent Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Portail
          </Link>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-black text-foreground">Console Agent Immobilier</span>
              <span className="hidden sm:inline-block text-[11px] text-muted-foreground ml-2">
                — {user?.firstName} {user?.lastName} ({user?.role})
              </span>
            </div>
          </div>
        </div>

        {/* Quick horizontal navigation for desktop */}
        <nav className="hidden xl:flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/agent/dashboard'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}

export default AgentLayout;
