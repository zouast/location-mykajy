import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { PaymentCheckoutModal } from '@/features/payments/components/PaymentCheckoutModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Key,
  CreditCard,
  Calendar,
  Download,
  AlertCircle,
} from 'lucide-react';

interface RentalItem {
  id: string;
  listingTitle?: string;
  propertyAddress?: string;
  monthlyRent: number;
  charges?: number;
  status: string;
  startDate: string;
  endDate?: string;
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
}

export default function RentalsPage() {
  const [payingRental, setPayingRental] = useState<RentalItem | null>(null);

  const { data: rentalsData, isLoading, isError } = useQuery({
    queryKey: ['my-rentals'],
    queryFn: async () => {
      const res = await api.get<{ data: RentalItem[] } | RentalItem[]>('/rentals/my-rentals');
      return (res.data as { data: RentalItem[] }).data || res.data || [];
    },
  });

  const rentals: RentalItem[] = Array.isArray(rentalsData) ? rentalsData : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            <Key className="h-7 w-7 text-indigo-600" />
            Gestion Locative & Baux
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Consultez vos contrats de location, échéances de loyer et quittances.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      )}

      {isError && (
        <div className="p-6 rounded-3xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <h3 className="font-bold text-sm text-red-900 dark:text-red-200">
            Impossible de charger vos locations
          </h3>
          <p className="text-xs text-muted-foreground">
            Veuillez vérifier votre session ou réessayer plus tard.
          </p>
        </div>
      )}

      {!isLoading && !isError && rentals.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            <Key className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Aucun bail actif pour le moment</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Lorsque votre dossier de candidature sera accepté et le contrat signé, vous retrouverez ici l'ensemble de vos baux et quittances.
            </p>
          </div>
          <Link to="/rent">
            <Button className="rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500">
              Découvrir les locations disponibles
            </Button>
          </Link>
        </div>
      )}

      {!isLoading && !isError && rentals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rentals.map((r) => (
            <div
              key={r.id}
              className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[11px] font-bold border-indigo-200 text-indigo-700 bg-indigo-50">
                  {r.status || 'Bail actif'}
                </Badge>
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Depuis {new Date(r.startDate).toLocaleDateString('fr-FR')}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground line-clamp-1">
                  {r.listingTitle || 'Logement en location'}
                </h3>
                {r.propertyAddress && (
                  <p className="text-xs text-muted-foreground mt-0.5">{r.propertyAddress}</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground">Loyer mensuel</div>
                  <div className="text-lg font-black text-foreground">
                    {(r.monthlyRent + (r.charges || 0)).toLocaleString('fr-FR')} € / mois
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setPayingRental(r)}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs"
                >
                  <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                  Régler mon loyer
                </Button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <button
                  type="button"
                  onClick={() => alert('Téléchargement de votre contrat au format PDF...')}
                  className="font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Contrat & Quittances
                </button>
                <Link
                  to="/messages"
                  className="font-bold text-indigo-600 hover:text-indigo-500"
                >
                  Contacter le bailleur
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de règlement */}
      {payingRental && (
        <PaymentCheckoutModal
          isOpen={!!payingRental}
          onClose={() => setPayingRental(null)}
          amount={payingRental.monthlyRent + (payingRental.charges || 0)}
          type="RENT"
          description={`Loyer pour ${payingRental.listingTitle || 'Logement'}`}
          rentalId={payingRental.id}
          onSuccess={() => setPayingRental(null)}
        />
      )}
    </div>
  );
}
