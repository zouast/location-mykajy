import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  Star,
  Heart,
  Car,
  Trees,
  Waves,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ListingSearchResult } from '@/types';
import { favoritesService } from '@/services/favorites.service';
import { useAuth } from '@/features/auth/AuthContext';

interface PropertyCardProps {
  listing: ListingSearchResult;
  variant?: 'grid' | 'list';
  isInitiallySaved?: boolean;
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

export function PropertyCard({
  listing,
  variant = 'grid',
  isInitiallySaved = false,
}: PropertyCardProps) {
  const { property, location, price, primaryPhoto } = listing;
  const [isSaved, setIsSaved] = useState(isInitiallySaved);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        return favoritesService.removeFavorite(listing.id);
      } else {
        return favoritesService.addFavorite(listing.id);
      }
    },
    onMutate: () => {
      setIsSaved(!isSaved);
    },
    onError: () => {
      setIsSaved(isSaved);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorite-ids'] });
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    toggleFavoriteMutation.mutate();
  };

  const isList = variant === 'list';

  return (
    <div
      className={`group relative flex overflow-hidden rounded-2xl bg-card ring-1 ring-border/80 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:ring-indigo-500/30 hover:-translate-y-0.5 ${
        isList ? 'flex-col sm:flex-row' : 'flex-col'
      }`}
    >
      {/* ── Image & Badges ── */}
      <Link
        to={`/properties/${listing.id}`}
        className={`relative overflow-hidden bg-muted block shrink-0 ${
          isList ? 'h-52 sm:h-auto sm:w-72' : 'h-52 w-full'
        }`}
      >
        {primaryPhoto ? (
          <img
            src={primaryPhoto.url}
            alt={listing.title ?? property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full min-h-[180px] items-center justify-center text-muted-foreground/30">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge
            className={`rounded-full text-xs font-semibold shadow-xs ${
              listing.transactionType === 'RENT'
                ? 'bg-indigo-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {listing.transactionType === 'RENT' ? 'Location' : 'Vente'}
          </Badge>
          {listing.isFeatured && (
            <Badge className="rounded-full bg-amber-500 text-white text-xs shadow-xs">
              <Star className="mr-1 h-3 w-3" /> Coup de cœur
            </Badge>
          )}
        </div>

        {/* DPE badge */}
        {property.energyRating && (
          <div className="absolute right-3 top-3">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ${
                ENERGY_COLORS[property.energyRating] ?? 'bg-slate-400'
              }`}
            >
              {property.energyRating}
            </span>
          </div>
        )}
      </Link>

      {/* ── Favorite toggle button ── */}
      <button
        type="button"
        onClick={handleFavoriteClick}
        title={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className="absolute right-3 bottom-3 sm:top-3 sm:bottom-auto z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-xs transition-transform hover:scale-110 dark:bg-slate-900/90"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            isSaved ? 'fill-red-500 text-red-500' : 'text-slate-600 dark:text-slate-300'
          }`}
        />
      </button>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Price */}
        <div className="mb-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-foreground">
            {price.formatted ?? `${price.price.toLocaleString('fr-FR')} €`}
          </span>
          {listing.transactionType === 'RENT' && (
            <span className="text-xs text-muted-foreground font-medium">/mois</span>
          )}
          {price.pricePerSqmFormatted && (
            <span className="ml-auto text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {price.pricePerSqmFormatted}
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/properties/${listing.id}`}>
          <h3 className="mb-1 text-sm font-bold leading-snug text-foreground group-hover:text-indigo-600 transition-colors line-clamp-2">
            {listing.title ?? property.title}
          </h3>
        </Link>

        {/* Property type */}
        {property.typeName && (
          <p className="mb-2 text-xs font-medium text-muted-foreground">{property.typeName}</p>
        )}

        {/* Location */}
        <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
          <span className="truncate">
            {location.formatted ??
              [location.neighborhood, location.city, location.zipCode].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Description preview in list view */}
        {isList && listing.descriptionExcerpt && (
          <p className="mb-4 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {listing.descriptionExcerpt}
          </p>
        )}

        {/* Specs & Amenities */}
        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {property.area && (
            <span className="flex items-center gap-1 font-medium">
              <Ruler className="h-3.5 w-3.5 text-indigo-600" />
              {property.area} m²
            </span>
          )}
          {property.bedrooms && (
            <span className="flex items-center gap-1 font-medium">
              <BedDouble className="h-3.5 w-3.5 text-indigo-600" />
              {property.bedrooms} ch.
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-1 font-medium">
              <Bath className="h-3.5 w-3.5 text-indigo-600" />
              {property.bathrooms} sdb
            </span>
          )}
          {property.parkingSpaces && (
            <span className="flex items-center gap-1 font-medium">
              <Car className="h-3.5 w-3.5 text-indigo-600" />
              {property.parkingSpaces} pkg
            </span>
          )}
          {property.hasPool && (
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <Waves className="h-3.5 w-3.5" /> Piscine
            </span>
          )}
          {property.hasGarden && (
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <Trees className="h-3.5 w-3.5" /> Jardin
            </span>
          )}

          {/* Distance badge (si recherche GPS) */}
          {listing.distanceKm !== undefined && (
            <span className="ml-auto font-semibold text-emerald-600">
              📍 {listing.distanceKm.toFixed(1)} km
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
