import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileSpreadsheet,
  MessageSquare,
  Calendar,
  Layers,
  ArrowLeft,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function OwnerLayout() {
  const { user } = useAuth();

  const navItems = [
    { to: '/owner/dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { to: '/owner/properties', label: 'Mes Biens', icon: Building2 },
    { to: '/owner/listings', label: 'Mes Annonces', icon: FileSpreadsheet },
    { to: '/owner/inquiries', label: 'Demandes reçues', icon: MessageSquare },
    { to: '/owner/visits', label: 'Agenda des Visites', icon: Calendar },
    { to: '/owner/messages', label: 'Messagerie', icon: Layers },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Top Owner Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
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
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-black text-foreground">Espace Bailleur & Propriétaire</span>
              <span className="hidden sm:inline-block text-[11px] text-muted-foreground ml-2">
                — {user?.firstName} {user?.lastName}
              </span>
            </div>
          </div>
        </div>

        {/* Quick horizontal navigation for desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/owner/dashboard'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
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

export default OwnerLayout;
