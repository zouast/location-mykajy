import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CheckCircle2, TrendingUp } from 'lucide-react';

export default function AgentTransactionsPage() {
  const { data: sales, isLoading } = useQuery({
    queryKey: ['agent-sales'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] } | any[]>('/agents/sales');
      return (res.data as { data: any[] }).data || res.data || [];
    },
  });

  const list: any[] = Array.isArray(sales) ? sales : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-emerald-600" />
          Transactions & Ventes Clôturées
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Historique des actes authentiques et baux finalisés.
        </p>
      </div>

      {isLoading && <Skeleton className="h-48 rounded-3xl" />}

      {!isLoading && list.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 space-y-3">
          <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-bold text-sm text-foreground">Aucune transaction signée pour le moment</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Les actes authentiques et baux finalisés s'inscriront automatiquement ici avec le calcul des honoraires.
          </p>
        </div>
      )}

      {!isLoading && list.length > 0 && (
        <div className="space-y-3">
          {list.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl border border-border/80 bg-card flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-foreground">{s.listing?.title || 'Bien vendu'}</h4>
                <p className="text-xs text-muted-foreground">
                  Prix acte : {s.salePrice?.toLocaleString('fr-FR')} €
                </p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Acte signé
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
