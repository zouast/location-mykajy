import { PropertyCard } from './PropertyCard';
import type { ListingSearchResult } from '@/types';

interface PropertyGridProps {
  listings: ListingSearchResult[];
}

export function PropertyGrid({ listings }: PropertyGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => (
        <PropertyCard key={listing.id} listing={listing} variant="grid" />
      ))}
    </div>
  );
}
