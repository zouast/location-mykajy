import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitsService } from '@/services/visits.service';
import type { VisitType } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar, Clock, Video, Home, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisitBookingModalProps {
  listingId: string;
  listingTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VisitBookingModal({
  listingId,
  listingTitle,
  isOpen,
  onClose,
}: VisitBookingModalProps) {
  const queryClient = useQueryClient();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00');
  const [visitType, setVisitType] = useState<VisitType>('IN_PERSON');
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Charger les créneaux disponibles pour la date sélectionnée
  const { data: availability, isLoading: loadingSlots } = useQuery({
    queryKey: ['visit-availability', listingId, selectedDate],
    queryFn: () => visitsService.getAvailability(listingId, selectedDate),
    enabled: isOpen && !!listingId && !!selectedDate,
  });

  const bookingMutation = useMutation({
    mutationFn: () => {
      const scheduledAt = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();
      return visitsService.create({
        listingId,
        scheduledAt,
        type: visitType,
        clientNotes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['my-visits'] });
      queryClient.invalidateQueries({ queryKey: ['visit-agenda'] });
    },
  });

  const handleClose = () => {
    setIsSuccess(false);
    setNotes('');
    onClose();
  };

  const defaultSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const availableSlots = availability?.slots
    ? availability.slots.filter((s) => s.isAvailable).map((s) => s.time)
    : defaultSlots;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : null)}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-6 border-border/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Réserver une visite
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            {listingTitle}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-foreground">Demande de visite transmise !</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Votre demande pour le <strong>{selectedDate}</strong> à <strong>{selectedSlot}</strong> a été enregistrée. L'agent ou le propriétaire confirmera votre créneau très rapidement.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="mt-4 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500"
            >
              Fermer
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Type de visite */}
            <div>
              <label className="text-xs font-bold text-foreground mb-2 block">Type de rendez-vous</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisitType('IN_PERSON')}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold transition-all',
                    visitType === 'IN_PERSON'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 ring-2 ring-indigo-600/20'
                      : 'border-border/80 hover:bg-muted/40 text-foreground'
                  )}
                >
                  <Home className="h-4 w-4 shrink-0" />
                  Visite sur place
                </button>
                <button
                  type="button"
                  onClick={() => setVisitType('VIRTUAL')}
                  className={cn(
                    'flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold transition-all',
                    visitType === 'VIRTUAL'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 ring-2 ring-indigo-600/20'
                      : 'border-border/80 hover:bg-muted/40 text-foreground'
                  )}
                >
                  <Video className="h-4 w-4 shrink-0" />
                  Visite en Visio
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Date souhaitée</label>
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            {/* Créneaux */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
                <span>Créneau horaire disponible</span>
                {loadingSlots && <span className="text-[10px] text-muted-foreground">Mise à jour...</span>}
              </label>
              {availableSlots.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Aucun créneau libre pour cette date. Veuillez choisir un autre jour.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1',
                        selectedSlot === slot
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-muted/50 text-foreground hover:bg-muted border border-border/60'
                      )}
                    >
                      <Clock className="h-3 w-3" />
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes complémentaires */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">
                Précisions ou questions (optionnel)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Je serai accompagné(e) de mon architecte..."
                className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600/20 resize-none"
              />
            </div>

            {bookingMutation.isError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {(bookingMutation.error as any)?.response?.data?.message ||
                  'Impossible de réserver ce créneau. Veuillez réessayer.'}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="rounded-xl text-xs"
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => bookingMutation.mutate()}
                disabled={bookingMutation.isPending || availableSlots.length === 0}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                {bookingMutation.isPending ? 'Réservation...' : 'Confirmer la visite'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
