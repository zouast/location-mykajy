import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Building,
  Building2,
  FileSpreadsheet,
  DollarSign,
  CreditCard,
  BarChart3,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminLayout() {
  const { user } = useAuth();

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: ShieldCheck },
    { to: '/admin/users', label: 'Utilisateurs', icon: Users },
    { to: '/admin/agencies', label: 'Agences', icon: Building },
    { to: '/admin/properties', label: 'Biens', icon: Building2 },
    { to: '/admin/listings', label: 'Annonces', icon: FileSpreadsheet },
    { to: '/admin/transactions', label: 'Transactions', icon: DollarSign },
    { to: '/admin/payments', label: 'Paiements', icon: CreditCard },
    { to: '/admin/reports', label: 'Rapports', icon: BarChart3 },
    { to: '/admin/settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-muted/25 flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au site
          </Link>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-black text-foreground">Administration Plateforme</span>
              <span className="hidden sm:inline-block text-[11px] text-muted-foreground ml-2">
                — Super Admin ({user?.email})
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
                end={item.to === '/admin/dashboard'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xs'
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

export default AdminLayout;
