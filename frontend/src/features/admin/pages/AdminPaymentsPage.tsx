import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';

export default function AdminPaymentsPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      try {
        const res = await api.get('/payments');
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const list: any[] = Array.isArray(payments) ? payments : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-emerald-600" />
          Transactions & Flux de Paiement
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Suivi des encaissements Stripe, virements SEPA et Mobile Money.
        </p>
      </div>

      {isLoading && <Skeleton className="h-48 rounded-3xl" />}

      {!isLoading && (
        <div className="space-y-2">
          {list.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 space-y-2">
              <CreditCard className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">Aucun flux financier récent.</p>
            </div>
          ) : (
            list.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-border/80 bg-card flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-foreground">{p.description || 'Paiement'}</h4>
                  <p className="text-xs text-muted-foreground">{p.method} · Ref: {p.id}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-foreground">{p.amount} {p.currency}</div>
                  <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
