import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { OwnerProperty } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, MapPin, Ruler, Bed, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OwnerPropertiesPage() {
  const { data: properties, isLoading } = useQuery({
    queryKey: ['owner-properties'],
    queryFn: async () => {
      const res = await api.get<{ data: OwnerProperty[] } | OwnerProperty[]>('/owners/properties');
      return (res.data as { data: OwnerProperty[] }).data || res.data || [];
    },
  });

  const list: OwnerProperty[] = Array.isArray(properties) ? properties : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            Mon Parc Immobilier
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Liste de l'ensemble de vos biens physiques déclarés.
          </p>
        </div>
        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Nouveau bien
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 space-y-3">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-bold text-sm text-foreground">Aucun bien répertorié</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Déclarez votre premier appartement ou maison pour commencer à publier des annonces ou percevoir des loyers.
          </p>
        </div>
      )}

      {!isLoading && list.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {p.status}
                  </Badge>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {p.type?.name || 'Bien standard'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground line-clamp-1">{p.title}</h3>
                {p.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {p.location.city} {p.location.zipCode}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5" /> {p.area} m²
                  </span>
                  {p.rooms && (
                    <span className="flex items-center gap-1">
                      <Bed className="h-3.5 w-3.5" /> {p.rooms} pièces
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">
                  {p.listings?.length || 0} annonce(s)
                </span>
                <Link
                  to={`/owner/listings?propertyId=${p.id}`}
                  className="font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Gérer
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
