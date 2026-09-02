import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsService, type ListingSearchFilters } from '@/services/listings.service';
import { savedSearchesService } from '@/services/saved-searches.service';
import { useAuth } from '@/features/auth/AuthContext';
import { SearchBar } from '../components/SearchBar';
import { PropertyFilters } from '../components/PropertyFilters';
import { PropertyGrid } from '../components/PropertyGrid';
import { PropertyList } from '../components/PropertyList';
import { MapView } from '../components/MapView';
import { SortSelector, type ViewMode } from '../components/SortSelector';
import { Pagination } from '../components/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SlidersHorizontal,
  RotateCcw,
  Bookmark,
  Bell,
  CheckCircle2,
  X,
} from 'lucide-react';

interface PropertySearchPageProps {
  fixedTransactionType?: 'SALE' | 'RENT';
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function PropertySearchPage({
  fixedTransactionType,
  pageTitle = 'Recherche Immobilière',
  pageSubtitle = 'Explorez nos annonces de vente et location en temps réel.',
}: PropertySearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Parse filters from URL search params
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentLimit = parseInt(searchParams.get('limit') || '9', 10);

  const filters: ListingSearchFilters = useMemo(() => {
    return {
      transactionType:
        fixedTransactionType ||
        (searchParams.get('transactionType') as 'SALE' | 'RENT' | undefined) ||
        undefined,
      city: searchParams.get('city') || undefined,
      neighborhood: searchParams.get('neighborhood') || undefined,
      propertyType: searchParams.get('propertyType') || undefined,
      q: searchParams.get('q') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      minArea: searchParams.get('minArea') ? Number(searchParams.get('minArea')) : undefined,
      maxArea: searchParams.get('maxArea') ? Number(searchParams.get('maxArea')) : undefined,
      minBedrooms: searchParams.get('minBedrooms') ? Number(searchParams.get('minBedrooms')) : undefined,
      minRooms: searchParams.get('minRooms') ? Number(searchParams.get('minRooms')) : undefined,
      minBathrooms: searchParams.get('minBathrooms') ? Number(searchParams.get('minBathrooms')) : undefined,
      radiusKm: searchParams.get('radiusKm') ? Number(searchParams.get('radiusKm')) : undefined,
      hasParking: searchParams.get('hasParking') === 'true' ? true : undefined,
      hasPool: searchParams.get('hasPool') === 'true' ? true : undefined,
      hasGarden: searchParams.get('hasGarden') === 'true' ? true : undefined,
      isFurnished: searchParams.get('isFurnished') === 'true' ? true : undefined,
      hasElevator: searchParams.get('hasElevator') === 'true' ? true : undefined,
      hasGarage: searchParams.get('hasGarage') === 'true' ? true : undefined,
      hasBalcony: searchParams.get('hasBalcony') === 'true' ? true : undefined,
      sortBy: (searchParams.get('sortBy') as 'price' | 'date' | 'area' | 'relevance') || 'date',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      page: currentPage,
      limit: currentLimit,
    };
  }, [searchParams, fixedTransactionType, currentPage, currentLimit]);

  // Query Backend API
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['property-search', filters],
    queryFn: () => listingsService.search(filters),
  });

  // Save Search Mutation
  const saveSearchMutation = useMutation({
    mutationFn: (name: string) =>
      savedSearchesService.create({
        name,
        transactionType: filters.transactionType,
        city: filters.city,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minArea: filters.minArea,
        maxArea: filters.maxArea,
        minRooms: filters.minRooms,
        propertyTypeId: filters.propertyType,
        isActive: true,
      }),
    onSuccess: () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['my-saved-searches'] });
    },
  });

  // Handle SearchBar submission
  const handleSearchBarSubmit = ({
    city,
    q,
    transactionType,
  }: {
    city?: string;
    q?: string;
    transactionType?: string;
  }) => {
    const nextParams = new URLSearchParams(searchParams);
    if (city) nextParams.set('city', city);
    else nextParams.delete('city');

    if (q) nextParams.set('q', q);
    else nextParams.delete('q');

    if (!fixedTransactionType) {
      if (transactionType) nextParams.set('transactionType', transactionType);
      else nextParams.delete('transactionType');
    }

    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  // Handle Sort changes
  const handleSortChange = (sortBy: string, sortOrder: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('sortBy', sortBy);
    nextParams.set('sortOrder', sortOrder);
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  // Handle Page change
  const handlePageChange = (page: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(page));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Limit change
  const handleLimitChange = (limit: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('limit', String(limit));
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    const nextParams = new URLSearchParams();
    if (fixedTransactionType) {
      nextParams.set('transactionType', fixedTransactionType);
    }
    setSearchParams(nextParams);
  };

  const openSaveSearchModal = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const defaultTitle = [
      filters.transactionType === 'RENT' ? 'Location' : 'Achat',
      filters.propertyType || 'Bien',
      filters.city ? `à ${filters.city}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    setSearchName(defaultTitle || 'Ma recherche immobilière');
    setSaveSuccess(false);
    setShowSaveModal(true);
  };

  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) return;
    saveSearchMutation.mutate(searchName.trim());
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* ── Top Header Title & Save Search Action ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {pageTitle}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{pageSubtitle}</p>
        </div>

        {/* Save Search Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={openSaveSearchModal}
          className="rounded-xl gap-2 text-xs font-bold border-indigo-600/30 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
        >
          <Bookmark className="h-4 w-4" />
          Sauvegarder cette recherche
        </Button>
      </div>

      {/* ── Top SearchBar ── */}
      <div className="mb-8">
        <SearchBar
          initialCity={searchParams.get('city') || ''}
          initialQuery={searchParams.get('q') || ''}
          initialTransactionType={
            fixedTransactionType || searchParams.get('transactionType') || ''
          }
          onSearch={handleSearchBarSubmit}
        />
      </div>

      {/* ── Mobile Filter Toggle Button ── */}
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="rounded-xl gap-2 text-xs font-semibold"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
          {mobileFilterOpen ? 'Masquer les filtres' : 'Afficher les filtres avancés'}
        </Button>
      </div>

      {/* ── Main Layout: Sidebar (Filters) + Main Content (Sort + Results) ── */}
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Filters Sidebar */}
        <aside className={`${mobileFilterOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="sticky top-20">
            <PropertyFilters
              hideTransactionType={!!fixedTransactionType}
              onFiltersApply={() => setMobileFilterOpen(false)}
            />
          </div>
        </aside>

        {/* Results Area */}
        <div className="flex flex-col space-y-6">
          {/* Sort Selector and View Switcher */}
          <SortSelector
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            viewMode={viewMode}
            onSortChange={handleSortChange}
            onViewModeChange={setViewMode}
            totalResults={data?.meta?.total}
          />

          {/* Results Display */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600 mb-4 dark:bg-indigo-950">
                🔍
              </div>
              <h3 className="text-lg font-bold text-foreground">Aucune annonce trouvée</h3>
              <p className="mt-1 max-w-md text-xs sm:text-sm text-muted-foreground">
                Aucun résultat ne correspond à vos critères de recherche. Essayez de réinitialiser ou d'assouplir vos filtres.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-6 rounded-xl text-xs gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser la recherche
              </Button>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && <PropertyGrid listings={data.items} />}

              {/* List View */}
              {viewMode === 'list' && <PropertyList listings={data.items} />}

              {/* Map View */}
              {viewMode === 'map' && <MapView listings={data.items} />}

              {/* Pagination */}
              <Pagination
                currentPage={data.meta.page}
                totalPages={data.meta.totalPages}
                totalItems={data.meta.total}
                itemsPerPage={data.meta.limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                isLoading={isFetching}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Modal Sauvegarder la recherche ── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-border animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-foreground text-base">Sauvegarder cette recherche</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {saveSuccess ? (
              <div className="py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-3 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-foreground">Recherche enregistrée avec succès !</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vous recevrez des alertes dès qu'un nouveau bien correspondant sera mis en ligne.
                </p>
                <div className="mt-6 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 rounded-xl text-xs"
                  >
                    Continuer la navigation
                  </Button>
                  <Button
                    onClick={() => navigate('/saved-searches')}
                    className="flex-1 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    Gérer mes recherches
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmSave} className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Donnez un nom à cette recherche pour la retrouver facilement et configurer vos alertes.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Nom de la recherche</label>
                  <Input
                    required
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Ex: T3 centre-ville Antananarivo"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Bell className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Alerte automatique activée</span>
                  </div>
                  <p className="text-[11px]">
                    Vous pouvez modifier la fréquence ou désactiver les notifications à tout moment dans votre espace.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={saveSearchMutation.isPending}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white py-5 text-xs shadow-md shadow-indigo-600/20"
                >
                  {saveSearchMutation.isPending ? 'Enregistrement…' : 'Enregistrer la recherche'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
