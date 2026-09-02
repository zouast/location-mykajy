import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RotateCcw, Euro, Maximize2, Bed, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ListingsFiltersProps {
  onFiltersChange?: (filters: Record<string, string | number | boolean | undefined>) => void;
  hideTransactionType?: boolean;
}

const PROPERTY_TYPES = [
  { label: 'Tous', value: '' },
  { label: 'Appartement', value: 'appartement' },
  { label: 'Maison / Villa', value: 'maison' },
  { label: 'Studio', value: 'studio' },
  { label: 'Bureau', value: 'bureau' },
  { label: 'Local Commercial', value: 'local_commercial' },
  { label: 'Terrain', value: 'terrain' },
  { label: 'Immeuble', value: 'immeuble' },
];

export function ListingsFilters({ hideTransactionType = false }: ListingsFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state initialized from URL params
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [transactionType, setTransactionType] = useState(searchParams.get('transactionType') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minArea, setMinArea] = useState(searchParams.get('minArea') || '');
  const [maxArea, setMaxArea] = useState(searchParams.get('maxArea') || '');
  const [minBedrooms, setMinBedrooms] = useState(searchParams.get('minBedrooms') || '');
  const [hasParking, setHasParking] = useState(searchParams.get('hasParking') === 'true');
  const [hasPool, setHasPool] = useState(searchParams.get('hasPool') === 'true');
  const [hasGarden, setHasGarden] = useState(searchParams.get('hasGarden') === 'true');
  const [isFurnished, setIsFurnished] = useState(searchParams.get('isFurnished') === 'true');
  const [hasBalcony, setHasBalcony] = useState(searchParams.get('hasBalcony') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'date');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');

  const applyFilters = () => {
    const nextParams = new URLSearchParams(searchParams);

    const setOrDelete = (key: string, val: string | boolean | undefined) => {
      if (val !== undefined && val !== '' && val !== false) {
        nextParams.set(key, String(val));
      } else {
        nextParams.delete(key);
      }
    };

    setOrDelete('city', city.trim());
    if (!hideTransactionType) {
      setOrDelete('transactionType', transactionType);
    }
    setOrDelete('propertyType', propertyType);
    setOrDelete('minPrice', minPrice);
    setOrDelete('maxPrice', maxPrice);
    setOrDelete('minArea', minArea);
    setOrDelete('maxArea', maxArea);
    setOrDelete('minBedrooms', minBedrooms);
    setOrDelete('hasParking', hasParking);
    setOrDelete('hasPool', hasPool);
    setOrDelete('hasGarden', hasGarden);
    setOrDelete('isFurnished', isFurnished);
    setOrDelete('hasBalcony', hasBalcony);
    setOrDelete('sortBy', sortBy);
    setOrDelete('sortOrder', sortOrder);

    // Reset pagination to page 1 on filter submit
    nextParams.set('page', '1');

    setSearchParams(nextParams);
  };

  const resetFilters = () => {
    setCity('');
    if (!hideTransactionType) setTransactionType('');
    setPropertyType('');
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setMinBedrooms('');
    setHasParking(false);
    setHasPool(false);
    setHasGarden(false);
    setIsFurnished(false);
    setHasBalcony(false);
    setSortBy('date');
    setSortOrder('desc');

    const nextParams = new URLSearchParams();
    if (hideTransactionType && searchParams.get('transactionType')) {
      nextParams.set('transactionType', searchParams.get('transactionType')!);
    }
    setSearchParams(nextParams);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl bg-card p-5 ring-1 ring-border/80 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
          <span>Filtres de recherche</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="mr-1 h-3 w-3" />
          Réinitialiser
        </Button>
      </div>

      {/* ── Transaction Type (si non verrouillé par la page /sale ou /rent) ── */}
      {!hideTransactionType && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Type d'opération</label>
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted/60 p-1">
            {[
              { label: 'Tous', value: '' },
              { label: 'Achat', value: 'SALE' },
              { label: 'Location', value: 'RENT' },
            ].map((op) => (
              <button
                key={op.value}
                type="button"
                onClick={() => setTransactionType(op.value)}
                className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
                  transactionType === op.value
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Localisation ── */}
      <div className="space-y-2">
        <label htmlFor="filter-city" className="text-xs font-medium text-muted-foreground">
          Ville ou Quartier
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="filter-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: Paris, Lyon, Bordeaux..."
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* ── Type de bien ── */}
      <div className="space-y-2">
        <label htmlFor="filter-type" className="text-xs font-medium text-muted-foreground">
          Type de bien
        </label>
        <select
          id="filter-type"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {PROPERTY_TYPES.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {pt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Budget ── */}
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Euro className="h-3.5 w-3.5" /> Budget (€)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            step={50}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="text-xs"
          />
          <Input
            type="number"
            min={0}
            step={50}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* ── Surface ── */}
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Maximize2 className="h-3.5 w-3.5" /> Surface (m²)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            step={5}
            placeholder="Min m²"
            value={minArea}
            onChange={(e) => setMinArea(e.target.value)}
            className="text-xs"
          />
          <Input
            type="number"
            min={0}
            step={5}
            placeholder="Max m²"
            value={maxArea}
            onChange={(e) => setMaxArea(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* ── Chambres ── */}
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Bed className="h-3.5 w-3.5" /> Chambres min
        </label>
        <div className="flex gap-1.5">
          {['', '1', '2', '3', '4+'].map((num) => {
            const rawVal = num === '4+' ? '4' : num;
            const isSelected = minBedrooms === rawVal;
            return (
              <button
                key={num || 'all'}
                type="button"
                onClick={() => setMinBedrooms(rawVal)}
                className={`flex-1 rounded-lg border py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {num === '' ? 'Tous' : num}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Critères & Commodités ── */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Critères supplémentaires</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Meublé', checked: isFurnished, setter: setIsFurnished },
            { label: 'Parking', checked: hasParking, setter: setHasParking },
            { label: 'Piscine', checked: hasPool, setter: setHasPool },
            { label: 'Jardin', checked: hasGarden, setter: setHasGarden },
            { label: 'Balcon/Terrasse', checked: hasBalcony, setter: setHasBalcony },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.setter(!item.checked)}
              className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                item.checked
                  ? 'border-indigo-600 bg-indigo-50/60 font-medium text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              <span>{item.label}</span>
              {item.checked && <Check className="h-3 w-3 text-indigo-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tri ── */}
      <div className="space-y-2 border-t border-border/60 pt-4">
        <label htmlFor="filter-sort" className="text-xs font-medium text-muted-foreground">
          Trier par
        </label>
        <select
          id="filter-sort"
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [sb, so] = e.target.value.split('-');
            setSortBy(sb);
            setSortOrder(so);
          }}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="date-desc">Plus récents</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
          <option value="area-desc">Surface décroissante</option>
          <option value="relevance-desc">Popularité & Pertinence</option>
        </select>
      </div>

      <Button
        type="submit"
        className="w-full rounded-xl bg-indigo-600 font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500"
      >
        <Search className="mr-2 h-4 w-4" />
        Appliquer les filtres
      </Button>
    </form>
  );
}
