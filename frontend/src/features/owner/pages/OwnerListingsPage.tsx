import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { OwnerListing } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Plus, Eye, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OwnerListingsPage() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ['owner-listings'],
    queryFn: async () => {
      const res = await api.get<{ data: OwnerListing[] } | OwnerListing[]>('/owners/listings');
      return (res.data as { data: OwnerListing[] }).data || res.data || [];
    },
  });

  const list: OwnerListing[] = Array.isArray(listings) ? listings : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
            Mes Annonces Immobilières
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suivez la visibilité et la performance de vos publications.
          </p>
        </div>
        <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Publier une annonce
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 space-y-3">
          <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-bold text-sm text-foreground">Aucune annonce publiée</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Créez une annonce pour mettre votre bien en location ou en vente dès aujourd'hui.
          </p>
        </div>
      )}

      {!isLoading && list.length > 0 && (
        <div className="space-y-3">
          {list.map((l) => (
            <div
              key={l.id}
              className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {l.status}
                  </Badge>
                  <span className="text-xs font-bold text-indigo-600">
                    {l.transactionType === 'RENT' ? 'Location' : 'Vente'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {l.title || l.property?.title || 'Annonce sans titre'}
                </h3>
                {l.property?.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {l.property.location.city}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-6 justify-between sm:justify-end">
                <div className="text-right">
                  <div className="text-sm font-black text-foreground">
                    {l.price?.price ? `${l.price.price.toLocaleString('fr-FR')} €` : 'N/C'}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                    <Eye className="h-3 w-3" /> {l.viewsCount || 0} vues
                  </div>
                </div>
                <Link to={`/properties/${l.id}`}>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Fiche
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
