import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { favoritesService } from '@/services/favorites.service';
import { PropertyCard } from '@/features/listings/components/PropertyCard';
import { Pagination } from '@/features/listings/components/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Heart, ArrowLeft } from 'lucide-react';

export default function FavoritesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['my-favorites', page],
    queryFn: () => favoritesService.getFavorites(page, 9),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Heart className="h-4 w-4 fill-red-600" />
            <span>Votre sélection</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Mes Biens Favoris</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {isLoading
              ? 'Chargement de vos favoris…'
              : `${data?.total ?? 0} bien${(data?.total ?? 0) > 1 ? 's' : ''} sauvegardé${(data?.total ?? 0) > 1 ? 's' : ''} dans votre liste.`}
          </p>
        </div>

        <Link to="/properties">
          <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Explorer plus d'annonces
          </Button>
        </Link>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-4 dark:bg-red-950/40">
            <Heart className="h-8 w-8 fill-red-500/20" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Vous n'avez aucun favori pour le moment</h3>
          <p className="mt-1 max-w-md text-xs sm:text-sm text-muted-foreground">
            Parcourez notre catalogue et cliquez sur l'icône cœur pour conserver vos coups de cœur et suivre les évolutions de prix.
          </p>
          <Link to="/properties" className="mt-6">
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20">
              Découvrir les annonces
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((fav) => (
              <PropertyCard key={fav.id} listing={fav.listing} />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={data.page}
            totalPages={data.totalPages}
            totalItems={data.total}
            itemsPerPage={9}
            onPageChange={(newPage) => setPage(newPage)}
            isLoading={isFetching}
          />
        </div>
      )}
    </div>
  );
}
