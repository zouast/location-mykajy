import { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  initialCity?: string;
  initialQuery?: string;
  initialTransactionType?: string;
  onSearch: (params: { q?: string; city?: string; transactionType?: string }) => void;
  className?: string;
}

export function SearchBar({
  initialCity = '',
  initialQuery = '',
  initialTransactionType = '',
  onSearch,
  className = '',
}: SearchBarProps) {
  const [city, setCity] = useState(initialCity);
  const [query, setQuery] = useState(initialQuery);
  const [transactionType, setTransactionType] = useState(initialTransactionType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      city: city.trim() || undefined,
      q: query.trim() || undefined,
      transactionType: transactionType || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-2 rounded-2xl bg-card p-2 ring-1 ring-border/80 shadow-xs sm:flex-row sm:items-center ${className}`}
    >
      {/* Transaction Type Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/60 p-1 shrink-0">
        {[
          { label: 'Tous', value: '' },
          { label: 'Achat', value: 'SALE' },
          { label: 'Location', value: 'RENT' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setTransactionType(tab.value);
              onSearch({
                city: city.trim() || undefined,
                q: query.trim() || undefined,
                transactionType: tab.value || undefined,
              });
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              transactionType === tab.value
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* City / Location Input */}
      <div className="relative flex flex-1 items-center">
        <MapPin className="absolute left-3 h-4 w-4 text-indigo-600 shrink-0" />
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville (ex: Antananarivo, Paris...)"
          className="border-0 bg-transparent pl-9 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
        />
        {city && (
          <button
            type="button"
            onClick={() => setCity('')}
            className="mr-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Keyword / Query Input */}
      <div className="relative flex flex-1 items-center border-t border-border/50 pt-2 sm:border-l sm:border-t-0 sm:pt-0 sm:pl-2">
        <Search className="absolute left-3 sm:left-4 h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mots-clés (titre, quartier...)"
          className="border-0 bg-transparent pl-9 sm:pl-10 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mr-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 shadow-sm shadow-indigo-600/20"
      >
        <Search className="mr-1.5 h-4 w-4" />
        Rechercher
      </Button>
    </form>
  );
}
