import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { savedSearchesService } from '@/services/saved-searches.service';
import type { SavedSearch } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bookmark,
  Bell,
  BellOff,
  Trash2,
  ExternalLink,
  Plus,
  MapPin,
  Euro,
  Maximize2,
} from 'lucide-react';

export default function SavedSearchesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => savedSearchesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-saved-searches'] });
    },
  });

  // Toggle notification alert mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      savedSearchesService.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-saved-searches'] });
    },
  });

  const { data: savedSearches, isLoading } = useQuery({
    queryKey: ['my-saved-searches'],
    queryFn: () => savedSearchesService.getAll(),
  });

  const handleExecuteSearch = (search: SavedSearch) => {
    const params = new URLSearchParams();
    if (search.transactionType) params.set('transactionType', search.transactionType);
    if (search.city) params.set('city', search.city);
    if (search.minPrice) params.set('minPrice', String(search.minPrice));
    if (search.maxPrice) params.set('maxPrice', String(search.maxPrice));
    if (search.minArea) params.set('minArea', String(search.minArea));
    if (search.maxArea) params.set('maxArea', String(search.maxArea));
    if (search.minRooms) params.set('minRooms', String(search.minRooms));
    if (search.propertyTypeId) params.set('propertyType', search.propertyTypeId);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Bookmark className="h-4 w-4" />
            <span>Alertes & Critères</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Mes Recherches Sauvegardées
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Recevez des alertes automatiques dès qu'un bien correspondant à vos critères est mis en ligne.
          </p>
        </div>

        <Link to="/properties">
          <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-indigo-600/20">
            <Plus className="h-4 w-4" /> Nouvelle recherche
          </Button>
        </Link>
      </div>

      {/* ── List of Saved Searches ── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>
      ) : !savedSearches || savedSearches.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 dark:bg-indigo-950">
            <Bookmark className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Aucune recherche enregistrée</h3>
          <p className="mt-1 max-w-md text-xs sm:text-sm text-muted-foreground">
            Configurez vos critères dans notre moteur de recherche et cliquez sur "Sauvegarder la recherche" pour être alerté en priorité.
          </p>
          <Link to="/properties" className="mt-6">
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20">
              Lancer une recherche
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className="flex flex-col justify-between rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-xs hover:shadow-md transition-all"
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-base text-foreground line-clamp-1">{search.name}</h3>
                  <Badge
                    className={`rounded-full text-[10px] ${
                      search.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {search.isActive ? 'Alerte active' : 'Alerte en pause'}
                  </Badge>
                </div>

                {/* Criteria Tags */}
                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                  {search.transactionType && (
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      <span>{search.transactionType === 'RENT' ? 'Location' : 'Achat'}</span>
                    </div>
                  )}

                  {search.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{search.city}</span>
                    </div>
                  )}

                  {(search.minPrice || search.maxPrice) && (
                    <div className="flex items-center gap-1.5">
                      <Euro className="h-3.5 w-3.5 text-indigo-500" />
                      <span>
                        Budget : {search.minPrice ? `${search.minPrice.toLocaleString('fr-FR')} €` : '0 €'} -{' '}
                        {search.maxPrice ? `${search.maxPrice.toLocaleString('fr-FR')} €` : 'Illimité'}
                      </span>
                    </div>
                  )}

                  {(search.minArea || search.maxArea) && (
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="h-3.5 w-3.5 text-indigo-500" />
                      <span>
                        Surface : {search.minArea || 0} m² - {search.maxArea ? `${search.maxArea} m²` : 'Illimitée'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Match Counter Badge */}
                <div className="rounded-xl bg-muted/50 p-2.5 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Annonces disponibles :</span>
                  <span className="font-bold text-foreground">
                    {search.matchedCount !== undefined ? search.matchedCount : '—'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 border-t border-border/60 pt-4 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    toggleActiveMutation.mutate({ id: search.id, isActive: !search.isActive })
                  }
                  title={search.isActive ? 'Désactiver les alertes' : 'Activer les alertes'}
                  className="rounded-xl text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  {search.isActive ? <Bell className="h-3.5 w-3.5 text-emerald-600" /> : <BellOff className="h-3.5 w-3.5" />}
                  {search.isActive ? 'Alertes On' : 'Alertes Off'}
                </Button>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Voulez-vous supprimer cette recherche sauvegardée ?')) {
                        deleteMutation.mutate(search.id);
                      }
                    }}
                    title="Supprimer"
                    className="h-8 w-8 p-0 rounded-xl text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleExecuteSearch(search)}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1"
                  >
                    Voir <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
