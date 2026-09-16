import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Mail, Phone } from 'lucide-react';

export default function AgentTeamPage() {
  const { data: team, isLoading } = useQuery({
    queryKey: ['agent-team'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] } | any[]>('/agents/team');
      return (res.data as { data: any[] }).data || res.data || [];
    },
  });

  const list: any[] = Array.isArray(team) ? team : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Building className="h-6 w-6 text-indigo-600" />
          Équipe & Collaborateurs d'Agence
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Membres de votre cabinet ou agence immobilière.
        </p>
      </div>

      {isLoading && <Skeleton className="h-48 rounded-3xl" />}

      {!isLoading && list.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 space-y-3">
          <Users className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-bold text-sm text-foreground">Équipe individuelle ou agence non configurée</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Rattachez votre profil à une agence pour visualiser l'ensemble des négociateurs et directeurs.
          </p>
        </div>
      )}

      {!isLoading && list.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((m) => (
            <div key={m.id} className="p-5 rounded-3xl border border-border/80 bg-card space-y-2">
              <h4 className="text-sm font-bold text-foreground">
                {m.user?.firstName} {m.user?.lastName}
              </h4>
              <Badge variant="outline" className="text-[10px]">{m.role || 'Négociateur'}</Badge>
              <div className="text-xs text-muted-foreground space-y-1 pt-1">
                {m.user?.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {m.user.email}</div>}
                {m.user?.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {m.user.phone}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
