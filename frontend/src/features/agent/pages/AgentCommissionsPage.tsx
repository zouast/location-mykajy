import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

export default function AgentCommissionsPage() {
  const { data: commissions, isLoading } = useQuery({
    queryKey: ['agent-commissions'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] } | any[]>('/agents/commissions');
      return (res.data as { data: any[] }).data || res.data || [];
    },
  });

  const list: any[] = Array.isArray(commissions) ? commissions : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Award className="h-6 w-6 text-amber-600" />
          Mes Commissions & Honoraires
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Suivi de vos commissions générées sur ventes et locations.
        </p>
      </div>

      {isLoading && <Skeleton className="h-48 rounded-3xl" />}

      {!isLoading && list.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 space-y-3">
          <Award className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-bold text-sm text-foreground">Aucune commission enregistrée</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Vos honoraires d'agence calculés sur vos ventes et locations apparaîtront ici.
          </p>
        </div>
      )}

      {!isLoading && list.length > 0 && (
        <div className="space-y-3">
          {list.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl border border-border/80 bg-card flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-foreground">Honoraires mandat</h4>
                <p className="text-xs text-muted-foreground">Taux : {c.rate}%</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-foreground">{c.amount?.toLocaleString('fr-FR')} €</div>
                <Badge variant="outline" className="text-[10px] font-bold">{c.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
