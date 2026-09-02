import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  RotateCcw,
  Euro,
  Maximize2,
  Bed,
  Compass,
  Check,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PropertyFiltersProps {
  onFiltersApply?: () => void;
  hideTransactionType?: boolean;
}

const PROPERTY_TYPES = [
  { label: 'Tous', value: '' },
  { label: 'Appartement', value: 'appartement' },
  { label: 'Maison / Villa', value: 'maison' },
  { label: 'Studio', value: 'studio' },
  { label: 'Terrain', value: 'terrain' },
  { label: 'Bureau', value: 'bureau' },
  { label: 'Local Commercial', value: 'local_commercial' },
  { label: 'Immeuble', value: 'immeuble' },
  { label: 'Parking / Garage', value: 'parking' },
];

export function PropertyFilters({
  onFiltersApply,
  hideTransactionType = false,
}: PropertyFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Local states
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [neighborhood, setNeighborhood] = useState(searchParams.get('neighborhood') || '');
  const [transactionType, setTransactionType] = useState(searchParams.get('transactionType') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minArea, setMinArea] = useState(searchParams.get('minArea') || '');
  const [maxArea, setMaxArea] = useState(searchParams.get('maxArea') || '');
  const [minBedrooms, setMinBedrooms] = useState(searchParams.get('minBedrooms') || '');
  const [minRooms, setMinRooms] = useState(searchParams.get('minRooms') || '');
  const [minBathrooms, setMinBathrooms] = useState(searchParams.get('minBathrooms') || '');
  const [radiusKm, setRadiusKm] = useState(searchParams.get('radiusKm') || '');

  // Amenities
  const [hasParking, setHasParking] = useState(searchParams.get('hasParking') === 'true');
  const [hasPool, setHasPool] = useState(searchParams.get('hasPool') === 'true');
  const [hasGarden, setHasGarden] = useState(searchParams.get('hasGarden') === 'true');
  const [isFurnished, setIsFurnished] = useState(searchParams.get('isFurnished') === 'true');
  const [hasElevator, setHasElevator] = useState(searchParams.get('hasElevator') === 'true');
  const [hasGarage, setHasGarage] = useState(searchParams.get('hasGarage') === 'true');
  const [hasBalcony, setHasBalcony] = useState(searchParams.get('hasBalcony') === 'true');

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
    setOrDelete('neighborhood', neighborhood.trim());
    if (!hideTransactionType) {
      setOrDelete('transactionType', transactionType);
    }
    setOrDelete('propertyType', propertyType);
    setOrDelete('minPrice', minPrice);
    setOrDelete('maxPrice', maxPrice);
    setOrDelete('minArea', minArea);
    setOrDelete('maxArea', maxArea);
    setOrDelete('minBedrooms', minBedrooms);
    setOrDelete('minRooms', minRooms);
    setOrDelete('minBathrooms', minBathrooms);
    setOrDelete('radiusKm', radiusKm);
    setOrDelete('hasParking', hasParking);
    setOrDelete('hasPool', hasPool);
    setOrDelete('hasGarden', hasGarden);
    setOrDelete('isFurnished', isFurnished);
    setOrDelete('hasElevator', hasElevator);
    setOrDelete('hasGarage', hasGarage);
    setOrDelete('hasBalcony', hasBalcony);

    // Reset pagination to page 1 on filter submission
    nextParams.set('page', '1');

    setSearchParams(nextParams);
    if (onFiltersApply) onFiltersApply();
  };

  const resetFilters = () => {
    setCity('');
    setNeighborhood('');
    if (!hideTransactionType) setTransactionType('');
    setPropertyType('');
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setMinBedrooms('');
    setMinRooms('');
    setMinBathrooms('');
    setRadiusKm('');
    setHasParking(false);
    setHasPool(false);
    setHasGarden(false);
    setIsFurnished(false);
    setHasElevator(false);
    setHasGarage(false);
    setHasBalcony(false);

    const nextParams = new URLSearchParams();
    if (hideTransactionType && searchParams.get('transactionType')) {
      nextParams.set('transactionType', searchParams.get('transactionType')!);
    }
    // Keep sorting preference if present
    if (searchParams.get('sortBy')) nextParams.set('sortBy', searchParams.get('sortBy')!);
    if (searchParams.get('sortOrder')) nextParams.set('sortOrder', searchParams.get('sortOrder')!);

    setSearchParams(nextParams);
    if (onFiltersApply) onFiltersApply();
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
        <div className="flex items-center gap-2 font-bold text-sm">
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
          Effacer
        </Button>
      </div>

      {/* ── Type d'opération ── */}
      {!hideTransactionType && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Type d'opération</label>
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted/60 p-1">
            {[
              { label: 'Tous', value: '' },
              { label: 'Vente', value: 'SALE' },
              { label: 'Location', value: 'RENT' },
            ].map((op) => (
              <button
                key={op.value}
                type="button"
                onClick={() => setTransactionType(op.value)}
                className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                  transactionType === op.value
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Type de bien ── */}
      <div className="space-y-2">
        <label htmlFor="filter-property-type" className="text-xs font-semibold text-muted-foreground">
          Type de bien
        </label>
        <select
          id="filter-property-type"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {PROPERTY_TYPES.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {pt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Localisation (Ville + Quartier) ── */}
      <div className="space-y-2">
        <label htmlFor="filter-city-input" className="text-xs font-semibold text-muted-foreground">
          Ville
        </label>
        <Input
          id="filter-city-input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ex: Antananarivo, Paris, Lyon..."
          className="text-xs rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="filter-neighborhood-input" className="text-xs font-semibold text-muted-foreground">
          Quartier / Commune
        </label>
        <Input
          id="filter-neighborhood-input"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
          placeholder="Ex: Ankorondrano, Montmartre..."
          className="text-xs rounded-xl"
        />
      </div>

      {/* ── Fourchette de Prix ── */}
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Euro className="h-3.5 w-3.5" /> Budget
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="text-xs rounded-xl"
          />
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="text-xs rounded-xl"
          />
        </div>
      </div>

      {/* ── Surface (m²) ── */}
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Maximize2 className="h-3.5 w-3.5" /> Surface (m²)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min m²"
            value={minArea}
            onChange={(e) => setMinArea(e.target.value)}
            className="text-xs rounded-xl"
          />
          <Input
            type="number"
            min={0}
            placeholder="Max m²"
            value={maxArea}
            onChange={(e) => setMaxArea(e.target.value)}
            className="text-xs rounded-xl"
          />
        </div>
      </div>

      {/* ── Nombre de chambres ── */}
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Bed className="h-3.5 w-3.5" /> Chambres
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
                className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 shadow-xs'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {num === '' ? 'Tous' : num}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Rayon géographique ── */}
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Compass className="h-3.5 w-3.5" /> Rayon autour de la zone (km)
        </label>
        <select
          value={radiusKm}
          onChange={(e) => setRadiusKm(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Exactement dans la zone</option>
          <option value="5">+ 5 km</option>
          <option value="10">+ 10 km</option>
          <option value="20">+ 20 km</option>
          <option value="50">+ 50 km</option>
        </select>
      </div>

      {/* ── Équipements & Commodités ── */}
      <div className="space-y-2 border-t border-border/60 pt-4">
        <label className="text-xs font-semibold text-muted-foreground">Commodités & Critères</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Meublé', checked: isFurnished, setter: setIsFurnished },
            { label: 'Parking', checked: hasParking, setter: setHasParking },
            { label: 'Piscine', checked: hasPool, setter: setHasPool },
            { label: 'Jardin', checked: hasGarden, setter: setHasGarden },
            { label: 'Balcon/Terrasse', checked: hasBalcony, setter: setHasBalcony },
            { label: 'Ascenseur', checked: hasElevator, setter: setHasElevator },
            { label: 'Garage', checked: hasGarage, setter: setHasGarage },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => item.setter(!item.checked)}
              className={`flex items-center justify-between rounded-xl border px-2.5 py-2 text-xs transition-all ${
                item.checked
                  ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-xs'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              <span>{item.label}</span>
              {item.checked && <Check className="h-3.5 w-3.5 text-indigo-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Submit Button ── */}
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
