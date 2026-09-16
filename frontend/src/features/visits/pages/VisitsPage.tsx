import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { visitsService } from '@/services/visits.service';
import type { VisitStatus } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Home,
  ExternalLink,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  VisitStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  REQUESTED: {
    label: 'Demandée',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  CONFIRMED: {
    label: 'Confirmée',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  CANCELLED: {
    label: 'Annulée',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
  COMPLETED: {
    label: 'Terminée',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  REJECTED: {
    label: 'Refusée',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
};

export default function VisitsPage() {
  const [selectedStatus, setSelectedStatus] = useState<VisitStatus | 'ALL'>('ALL');

  const { data: visitsData, isLoading, isError } = useQuery({
    queryKey: ['my-visits', selectedStatus],
    queryFn: () =>
      visitsService.getMyVisits(
        selectedStatus === 'ALL' ? undefined : selectedStatus,
        1,
        50
      ),
  });

  const visits = visitsData?.items || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <Calendar className="h-7 w-7 text-indigo-600" />
            Mes Visites Immobilières
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Suivez vos rendez-vous de visite sur place ou en visioconférence.
          </p>
        </div>

        {/* Filtres de statut */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['ALL', 'CONFIRMED', 'REQUESTED', 'COMPLETED', 'CANCELLED'] as const).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedStatus === status
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                {status === 'ALL'
                  ? 'Toutes'
                  : status === 'CONFIRMED'
                  ? 'Confirmées'
                  : status === 'REQUESTED'
                  ? 'En attente'
                  : status === 'COMPLETED'
                  ? 'Terminées'
                  : 'Annulées'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-6 rounded-3xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <h3 className="font-bold text-sm text-red-900 dark:text-red-200">
            Erreur de chargement des visites
          </h3>
          <p className="text-xs text-muted-foreground">
            Veuillez vous reconnecter ou réessayer ultérieurement.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && visits.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            <Calendar className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Aucune visite programmée</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Parcourez nos annonces et réservez une visite directement depuis la fiche d'un bien.
            </p>
          </div>
          <Link to="/properties">
            <Button className="rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500">
              Explorer les biens
            </Button>
          </Link>
        </div>
      )}

      {/* Visits List */}
      {!isLoading && !isError && visits.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visits.map((v) => {
            const statusConfig = STATUS_CONFIG[v.status] || STATUS_CONFIG.REQUESTED;
            const dateObj = new Date(v.scheduledAt);
            const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const timeFormatted = dateObj.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={v.id}
                className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Top: Status badge & type */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      {statusConfig.label}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                      {v.type === 'VIRTUAL' ? (
                        <>
                          <Video className="h-3.5 w-3.5 text-indigo-500" />
                          Visio
                        </>
                      ) : (
                        <>
                          <Home className="h-3.5 w-3.5 text-emerald-500" />
                          Sur place
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title & Listing link */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-1">
                      {v.listing?.title || 'Bien immobilier'}
                    </h3>
                    {v.listing?.city && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {v.listing.city}
                      </p>
                    )}
                  </div>

                  {/* Date & Time block */}
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-background border border-border/80 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase font-bold text-indigo-600">
                        {dateObj.toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                      <span className="text-sm font-black text-foreground leading-none">
                        {dateObj.getDate()}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground capitalize">
                        {dateFormatted}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeFormatted} ({v.duration || 30} min)
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {v.clientNotes && (
                    <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                      "{v.clientNotes}"
                    </p>
                  )}
                </div>

                {/* Bottom action */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  {v.listing?.id ? (
                    <Link
                      to={`/properties/${v.listing.id}`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Voir l'annonce
                    </Link>
                  ) : (
                    <span />
                  )}
                  <Link
                    to="/messages"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Échanger
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
