import { useAuth } from '@/features/auth/AuthContext';
import { Building2, Heart, CalendarCheck, MessageSquare, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const stats = [
    { label: 'Annonces vues', value: '24', icon: Building2, color: 'text-indigo-500' },
    { label: 'Favoris', value: '3', icon: Heart, color: 'text-pink-500' },
    { label: 'Visites planifiées', value: '1', icon: CalendarCheck, color: 'text-emerald-500' },
    { label: 'Messages', value: '2', icon: MessageSquare, color: 'text-amber-500' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Bonjour, {user?.firstName ?? user?.email} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Rôle : <span className="capitalize font-medium text-foreground">{user?.role.toLowerCase()}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>

      {/* Stats grid */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <s.icon className={`mb-3 h-6 w-6 ${s.color}`} />
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
        <h2 className="mb-4 text-lg font-semibold">Actions rapides</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" className="justify-start gap-2" onClick={() => navigate('/listings')}>
            <Building2 className="h-4 w-4 text-indigo-500" />
            Parcourir les annonces
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => navigate('/listings?type=RENT')}>
            <Heart className="h-4 w-4 text-pink-500" />
            Voir mes favoris
          </Button>
        </div>
      </div>
    </div>
  );
}
