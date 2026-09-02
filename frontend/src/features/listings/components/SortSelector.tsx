import { ArrowUpDown, Grid, List, Map } from 'lucide-react';

export type ViewMode = 'grid' | 'list' | 'map';

interface SortSelectorProps {
  sortBy?: string;
  sortOrder?: string;
  viewMode: ViewMode;
  onSortChange: (sortBy: string, sortOrder: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  totalResults?: number;
}

export function SortSelector({
  sortBy = 'date',
  sortOrder = 'desc',
  viewMode,
  onSortChange,
  onViewModeChange,
  totalResults,
}: SortSelectorProps) {
  const currentKey = `${sortBy}-${sortOrder}`;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sb, so] = e.target.value.split('-');
    onSortChange(sb, so);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-card p-3 ring-1 ring-border/80 shadow-xs">
      {/* Results Count */}
      <div className="text-xs text-muted-foreground font-medium">
        {totalResults !== undefined && (
          <span>
            <strong className="text-foreground font-bold">{totalResults}</strong> annonce
            {totalResults > 1 ? 's' : ''} disponible{totalResults > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={currentKey}
            onChange={handleSelectChange}
            className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium"
          >
            <option value="date-desc">Plus récentes en premier</option>
            <option value="price-asc">Prix : croissant</option>
            <option value="price-desc">Prix : décroissant</option>
            <option value="area-desc">Surface : décroissante</option>
            <option value="relevance-desc">Pertinence & Vues</option>
          </select>
        </div>

        {/* View Mode Switcher (Grid / List / Map) */}
        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border/50">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Affichage Grille"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            title="Affichage Liste"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('map')}
            title="Affichage Carte"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              viewMode === 'map'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Map className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
