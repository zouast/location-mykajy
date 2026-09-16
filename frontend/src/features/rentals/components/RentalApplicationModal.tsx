import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface RentalApplicationModalProps {
  listingId: string;
  listingTitle: string;
  monthlyRent: number;
  charges: number;
  deposit: number;
  isOpen: boolean;
  onClose: () => void;
}

export function RentalApplicationModal({
  listingId,
  listingTitle,
  monthlyRent,
  charges,
  deposit,
  isOpen,
  onClose,
}: RentalApplicationModalProps) {
  const [profession, setProfession] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>('');
  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [guarantorIncome, setGuarantorIncome] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const totalMonthly = monthlyRent + charges;

  const applyMutation = useMutation({
    mutationFn: async () => {
      return api.post('/rentals/applications', {
        listingId,
        profession,
        monthlyIncome: Number(monthlyIncome),
        hasGuarantor,
        guarantorIncome: hasGuarantor ? Number(guarantorIncome) : undefined,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : null)}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-6 border-border/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Déposer mon dossier de candidature
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
              <h4 className="text-lg font-bold text-foreground">Dossier transmis avec succès !</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Votre candidature a été envoyée au gestionnaire. Vous recevrez une notification par email et dans votre espace dès l'étude des pièces.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="mt-4 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500"
            >
              Terminer
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyMutation.mutate();
            }}
            className="space-y-4 pt-2"
          >
            {/* Récap loyer */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-foreground">Loyer charges comprises :</span>
                <span className="font-bold text-foreground ml-1">
                  {totalMonthly.toLocaleString('fr-FR')} € / mois
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Dépôt :</span>
                <span className="font-bold text-foreground ml-1">
                  {deposit.toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>

            {/* Situation pro */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Situation pro / Poste *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CDI Cadre, Ingénieur..."
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Revenu net mensuel (€) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Ex: 2800"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
            </div>

            {/* Garant */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={hasGuarantor}
                  onChange={(e) => setHasGuarantor(e.target.checked)}
                  className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                />
                J'ai un ou des garants (physique ou Visale)
              </label>
              {hasGuarantor && (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Revenu net du garant (€)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 3500"
                    value={guarantorIncome}
                    onChange={(e) => setGuarantorIncome(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>
              )}
            </div>

            {/* Zone upload justificatifs info */}
            <div className="p-3 rounded-2xl border-2 border-dashed border-border/80 text-center space-y-1">
              <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
              <div className="text-xs font-bold text-foreground">Pièces justificatives</div>
              <p className="text-[11px] text-muted-foreground">
                Carte d'identité, 3 derniers bulletins de paie et avis d'imposition pourront également être téléversés dans votre espace candidat.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">Remarques au bailleur (optionnel)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Date d'entrée souhaitée début du mois prochain..."
                className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600/20 resize-none"
              />
            </div>

            {applyMutation.isError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Une erreur est survenue lors de l'envoi du dossier.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={handleClose} className="rounded-xl text-xs">
                Annuler
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={applyMutation.isPending}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                {applyMutation.isPending ? 'Envoi...' : 'Transmettre ma candidature'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
