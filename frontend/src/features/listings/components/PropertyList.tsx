import { PropertyCard } from './PropertyCard';
import type { ListingSearchResult } from '@/types';

interface PropertyListProps {
  listings: ListingSearchResult[];
}

export function PropertyList({ listings }: PropertyListProps) {
  return (
    <div className="flex flex-col gap-4">
      {listings.map((listing) => (
        <PropertyCard key={listing.id} listing={listing} variant="list" />
      ))}
    </div>
  );
}
