import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Ruler, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ListingSearchResult } from '@/types';

interface ListingCardProps {
  listing: ListingSearchResult;
}

const ENERGY_COLORS: Record<string, string> = {
  A: 'bg-green-500',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-orange-400',
  E: 'bg-orange-500',
  F: 'bg-red-500',
  G: 'bg-red-700',
};

export function ListingCard({ listing }: ListingCardProps) {
  const { property, location, price, primaryPhoto } = listing;

  return (
    <Link
      to={`/properties/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:ring-indigo-500/30 hover:-translate-y-0.5"
    >
      {/* ── Image ── */}
      <div className="relative h-52 overflow-hidden bg-muted">
        {primaryPhoto ? (
          <img
            src={primaryPhoto.url}
            alt={listing.title ?? property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/30">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge
            className={`rounded-full text-xs font-semibold ${
              listing.transactionType === 'RENT'
                ? 'bg-indigo-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {listing.transactionType === 'RENT' ? 'Location' : 'Vente'}
          </Badge>
          {listing.isFeatured && (
            <Badge className="rounded-full bg-amber-500 text-white text-xs">
              <Star className="mr-1 h-3 w-3" /> Premium
            </Badge>
          )}
        </div>

        {/* DPE badge */}
        {property.energyRating && (
          <div className="absolute right-3 top-3">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${ENERGY_COLORS[property.energyRating] ?? 'bg-slate-400'}`}>
              {property.energyRating}
            </span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col p-4">
        {/* Price */}
        <div className="mb-2 flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-foreground">
            {price.formatted ?? `${price.price.toLocaleString('fr-FR')} €`}
          </span>
          {listing.transactionType === 'RENT' && (
            <span className="text-xs text-muted-foreground">/mois</span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-indigo-600 transition-colors">
          {listing.title ?? property.title}
        </h3>

        {/* Property type */}
        {property.typeName && (
          <p className="mb-2 text-xs text-muted-foreground">{property.typeName}</p>
        )}

        {/* Location */}
        <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {location.formatted ?? [location.neighborhood, location.city, location.zipCode].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Specs */}
        <div className="mt-auto flex flex-wrap gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {property.area && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              {property.area} m²
            </span>
          )}
          {property.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {property.bedrooms} ch.
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms} sdb
            </span>
          )}
          {price.pricePerSqmFormatted && (
            <span className="ml-auto flex items-center gap-1 text-indigo-500">
              <Zap className="h-3 w-3" />
              {price.pricePerSqmFormatted}
            </span>
          )}
        </div>

        {/* Distance badge (si recherche GPS) */}
        {listing.distanceKm !== undefined && (
          <div className="mt-2 text-xs text-emerald-600 font-medium">
            📍 {listing.distanceKm.toFixed(1)} km
          </div>
        )}
      </div>
    </Link>
  );
}
