import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Phone, Mail, MapPin, Euro, CheckCircle2 } from 'lucide-react';

interface ClientItem {
  id: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  preferredCity?: string;
  budgetMin?: number;
  budgetMax?: number;
  isPreApproved?: boolean;
}

export default function AgentClientsPage() {
  const { data: clients, isLoading } = useQuery({
    queryKey: ['agent-clients'],
    queryFn: async () => {
      const res = await api.get<{ data: ClientItem[] } | ClientItem[]>('/agents/clients');
      return (res.data as { data: ClientItem[] }).data || res.data || [];
    },
  });

  const list: ClientItem[] = Array.isArray(clients) ? clients : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Base Acquéreurs & Locataires
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gérez vos acheteurs qualifiés, budgets et critères de recherche.
          </p>
        </div>
        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Ajouter un client
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-3xl" />
          ))}
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 space-y-3">
          <Users className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-bold text-sm text-foreground">Aucun client qualifié pour le moment</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Les visiteurs formulant des demandes ou réservant des visites s'afficheront automatiquement ici.
          </p>
        </div>
      )}

      {!isLoading && list.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">
                  {c.user?.firstName || 'Client'} {c.user?.lastName || ''}
                </h3>
                {c.isPreApproved && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Financement validé
                  </Badge>
                )}
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                {c.user?.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {c.user.email}
                  </div>
                )}
                {c.user?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {c.user.phone}
                  </div>
                )}
                {c.preferredCity && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Recherche : {c.preferredCity}
                  </div>
                )}
                {(c.budgetMin || c.budgetMax) && (
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Euro className="h-3.5 w-3.5 text-indigo-600" />
                    Budget : {c.budgetMin?.toLocaleString('fr-FR')} € - {c.budgetMax?.toLocaleString('fr-FR')} €
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
