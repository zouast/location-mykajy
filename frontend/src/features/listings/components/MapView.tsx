import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, X, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ListingSearchResult } from '@/types';

interface MapViewProps {
  listings: ListingSearchResult[];
}

export function MapView({ listings }: MapViewProps) {
  const [selectedListing, setSelectedListing] = useState<ListingSearchResult | null>(null);

  // Filter listings with coordinates (or generate fallback coordinates around Madagascar / France depending on data)
  const geoListings = useMemo(() => {
    return listings.map((l, index) => {
      let lat = l.location.latitude;
      let lng = l.location.longitude;

      // Fallback coordinate offset for demo if lat/lng are omitted
      if (!lat || !lng) {
        // Center around Antananarivo (-18.8792, 47.5079) or Paris (48.8566, 2.3522)
        const baseLat = -18.8792;
        const baseLng = 47.5079;
        lat = baseLat + ((index % 5) - 2) * 0.02;
        lng = baseLng + ((Math.floor(index / 5) % 5) - 2) * 0.02;
      }

      return {
        ...l,
        computedLat: lat,
        computedLng: lng,
      };
    });
  }, [listings]);

  // Compute map center
  const center = useMemo(() => {
    if (geoListings.length === 0) return { lat: -18.8792, lng: 47.5079 };
    const avgLat = geoListings.reduce((sum, item) => sum + item.computedLat, 0) / geoListings.length;
    const avgLng = geoListings.reduce((sum, item) => sum + item.computedLng, 0) / geoListings.length;
    return { lat: avgLat, lng: avgLng };
  }, [geoListings]);

  // OpenStreetMap embed URL
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.08}%2C${center.lat - 0.05}%2C${center.lng + 0.08}%2C${center.lat + 0.05}&layer=mapnik&marker=${center.lat}%2C${center.lng}`;

  return (
    <div className="relative h-[650px] w-full overflow-hidden rounded-3xl border border-border/80 bg-muted/30 shadow-md">
      {/* ── Interactive Map Embed / Layer ── */}
      <iframe
        title="Immo Map"
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={osmUrl}
        className="h-full w-full grayscale-[15%] contrast-[105%]"
      />

      {/* ── Markers Layer Overlay (Interactive Markers on map) ── */}
      <div className="pointer-events-none absolute inset-0 p-8">
        <div className="relative h-full w-full">
          {geoListings.map((item, idx) => {
            // Position pins relatively in grid simulation overlay
            const topPercent = 20 + ((idx * 17) % 60);
            const leftPercent = 15 + ((idx * 23) % 70);

            const isSelected = selectedListing?.id === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedListing(item)}
                style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
                className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 ${
                  isSelected ? 'z-30 scale-110' : 'z-10'
                }`}
              >
                <div
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black shadow-lg transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-300 dark:ring-indigo-900'
                      : item.transactionType === 'RENT'
                        ? 'bg-slate-900 text-white hover:bg-indigo-600 dark:bg-card dark:text-foreground'
                        : 'bg-emerald-700 text-white hover:bg-emerald-600'
                  }`}
                >
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{item.price.formatted || `${item.price.price.toLocaleString('fr-FR')} €`}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Property Floating Popup Card ── */}
      {selectedListing && (
        <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-96 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="relative flex overflow-hidden rounded-2xl bg-card p-4 shadow-2xl ring-1 ring-border">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedListing(null)}
              className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-foreground backdrop-blur-xs"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Thumbnail */}
            {selectedListing.primaryPhoto && (
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-muted mr-3">
                <img
                  src={selectedListing.primaryPhoto.url}
                  alt={selectedListing.title || selectedListing.property.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <Badge
                  className={`mb-1 text-[10px] ${
                    selectedListing.transactionType === 'RENT' ? 'bg-indigo-600' : 'bg-emerald-600'
                  } text-white`}
                >
                  {selectedListing.transactionType === 'RENT' ? 'Location' : 'Vente'}
                </Badge>
                <h4 className="text-xs font-bold line-clamp-1 text-foreground">
                  {selectedListing.title || selectedListing.property.title}
                </h4>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-indigo-500" />
                  <span className="truncate">{selectedListing.location.city}</span>
                </p>
              </div>

              <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-border/50">
                <span className="text-sm font-extrabold text-foreground">
                  {selectedListing.price.formatted || `${selectedListing.price.price.toLocaleString('fr-FR')} €`}
                </span>
                <Link
                  to={`/properties/${selectedListing.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Voir le bien <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Map Helper Controls ── */}
      <div className="absolute top-4 right-4 z-20 rounded-xl bg-card/90 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-md backdrop-blur-md">
        📍 {geoListings.length} bien{geoListings.length > 1 ? 's' : ''} géolocalisé{geoListings.length > 1 ? 's' : ''}
      </div>
    </div>
  );
}
