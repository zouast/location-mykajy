import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin } from 'lucide-react';

export default function AdminAgenciesPage() {
  const { data: agencies, isLoading } = useQuery({
    queryKey: ['admin-agencies'],
    queryFn: async () => {
      try {
        const res = await api.get('/agencies');
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const list: any[] = Array.isArray(agencies) ? agencies : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Building className="h-6 w-6 text-indigo-600" />
          Agences Immobilières Référencées
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Validation des licences professionnelles et conformité.
        </p>
      </div>

      {isLoading && <Skeleton className="h-48 rounded-3xl" />}

      {!isLoading && (
        <div className="space-y-2">
          {list.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-2xl border border-border/80 bg-card flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-foreground">{a.name}</h4>
                {a.city && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {a.city}
                  </p>
                )}
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 text-xs">Agréée</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
