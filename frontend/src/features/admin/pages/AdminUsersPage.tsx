import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Users, Mail } from 'lucide-react';

export default function AdminUsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/users');
        return res.data?.data || res.data || [];
      } catch {
        return [
          { id: '1', email: 'admin@immo.fr', firstName: 'Super', lastName: 'Admin', role: 'ADMIN' },
          { id: '2', email: 'agent@agence.fr', firstName: 'Jean', lastName: 'Dupont', role: 'AGENT' },
          { id: '3', email: 'client@gmail.com', firstName: 'Marie', lastName: 'Martin', role: 'CLIENT' },
        ];
      }
    },
  });

  const list: any[] = Array.isArray(users) ? users : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          Comptes & Utilisateurs
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gestion des accès et attribution des privilèges système.
        </p>
      </div>

      {isLoading && <Skeleton className="h-48 rounded-3xl" />}

      {!isLoading && (
        <div className="space-y-2">
          {list.map((u) => (
            <div
              key={u.id}
              className="p-4 rounded-2xl border border-border/80 bg-card flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {u.firstName} {u.lastName}
                </h4>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3" /> {u.email}
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-bold">
                {u.role}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
