import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/payment.service';
import type {
  PaymentType,
  PaymentMethod,
  PaymentSessionResponse,
  PaymentItem,
} from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Smartphone,
  Building,
  Banknote,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Lock,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  type: PaymentType;
  description: string;
  rentalId?: string;
  saleId?: string;
  rentScheduleId?: string;
  commissionId?: string;
  onSuccess?: (payment: PaymentItem) => void;
}

export function PaymentCheckoutModal({
  isOpen,
  onClose,
  amount,
  currency = 'EUR',
  type,
  description,
  rentalId,
  saleId,
  rentScheduleId,
  commissionId,
  onSuccess,
}: PaymentCheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('STRIPE');
  const [phone, setPhone] = useState('');
  const [mobileOperator, setMobileOperator] = useState('ORANGE_MONEY');
  const [otpCode, setOtpCode] = useState('');

  // Étape du flux de paiement : 1 = Sélection, 2 = Instructions/OTP, 3 = Validé
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sessionData, setSessionData] = useState<PaymentSessionResponse | null>(null);
  const [completedPayment, setCompletedPayment] = useState<PaymentItem | null>(null);

  const queryClient = useQueryClient();

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(val);

  // ─── 1. Initiation de la session ───
  const initiateMutation = useMutation({
    mutationFn: () => {
      let provider: 'STRIPE' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'MANUAL' = 'STRIPE';
      if (selectedMethod === 'MOBILE_MONEY') provider = 'MOBILE_MONEY';
      else if (selectedMethod === 'BANK_TRANSFER') provider = 'BANK_TRANSFER';
      else if (selectedMethod === 'MANUAL' || selectedMethod === 'CASH' || selectedMethod === 'CHECK')
        provider = 'MANUAL';

      return paymentService.initiatePayment({
        amount,
        currency,
        type,
        method: selectedMethod,
        provider,
        description,
        rentalId,
        saleId,
        rentScheduleId,
        commissionId,
        phone: selectedMethod === 'MOBILE_MONEY' ? phone : undefined,
        metadata: { operator: mobileOperator },
        returnUrl: window.location.href,
      });
    },
    onSuccess: (data) => {
      setSessionData(data);
      if (data.session.checkoutUrl && selectedMethod === 'STRIPE') {
        // Redirection Stripe ou simulation validation directe
        setStep(2);
      } else {
        setStep(2);
      }
    },
  });

  // ─── 2. Validation / Confirmation ───
  const processMutation = useMutation({
    mutationFn: () => {
      if (!sessionData) throw new Error('Session manquante');
      return paymentService.processPayment(sessionData.payment.id, {
        providerRef: sessionData.session.providerRef,
        otpCode: otpCode.trim() || undefined,
        phoneNumber: phone || undefined,
      });
    },
    onSuccess: (payment) => {
      setCompletedPayment(payment);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ['my-rentals'] });
      queryClient.invalidateQueries({ queryKey: ['rental-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      if (onSuccess) onSuccess(payment);
    },
  });

  const handleReset = () => {
    setStep(1);
    setSessionData(null);
    setCompletedPayment(null);
    setOtpCode('');
    onClose();
  };

  const getTypeLabel = (t: PaymentType) => {
    switch (t) {
      case 'RENT':
        return 'Loyer mensuel';
      case 'DEPOSIT':
        return 'Dépôt de garantie / Caution';
      case 'COMMISSION':
        return 'Commission d’agence';
      case 'DOWN_PAYMENT':
        return 'Acompte / Réservation';
      case 'SALE_PAYMENT':
        return 'Paiement d’acquisition immobilière';
      case 'OTHER_FEES':
      default:
        return 'Frais & Charges';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-6 bg-card border-border/80 shadow-2xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20">
              <Lock className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold">Paiement Sécurisé</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Transaction cryptée de bout en bout conforme aux normes bancaires.
          </DialogDescription>
        </DialogHeader>

        {/* Récapitulatif du montant */}
        <div className="my-2 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 p-4 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              {getTypeLabel(type)}
            </span>
            <span className="text-xs text-muted-foreground line-clamp-1">{description}</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-foreground">{formatPrice(amount)}</span>
          </div>
        </div>

        {/* ─── ÉTAPE 1 : Choix du moyen de paiement ─── */}
        {step === 1 && (
          <div className="space-y-4 pt-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Sélectionnez votre moyen de règlement
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1 : Stripe / Carte */}
              <button
                type="button"
                onClick={() => setSelectedMethod('STRIPE')}
                className={cn(
                  'p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 relative',
                  selectedMethod === 'STRIPE'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-600/20'
                    : 'border-border/80 hover:bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  <Badge variant="outline" className="text-[9px] font-bold">Instantané</Badge>
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Carte / Apple Pay</div>
                  <div className="text-[10px] text-muted-foreground">Visa, Mastercard, Stripe</div>
                </div>
              </button>

              {/* Option 2 : Mobile Money */}
              <button
                type="button"
                onClick={() => setSelectedMethod('MOBILE_MONEY')}
                className={cn(
                  'p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 relative',
                  selectedMethod === 'MOBILE_MONEY'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-600/20'
                    : 'border-border/80 hover:bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between">
                  <Smartphone className="h-5 w-5 text-emerald-600" />
                  <Badge variant="outline" className="text-[9px] font-bold">Sans frais</Badge>
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Mobile Money</div>
                  <div className="text-[10px] text-muted-foreground">Orange, Wave, MTN, M-Pesa</div>
                </div>
              </button>

              {/* Option 3 : Virement Bancaire */}
              <button
                type="button"
                onClick={() => setSelectedMethod('BANK_TRANSFER')}
                className={cn(
                  'p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 relative',
                  selectedMethod === 'BANK_TRANSFER'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-600/20'
                    : 'border-border/80 hover:bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between">
                  <Building className="h-5 w-5 text-blue-600" />
                  <Badge variant="outline" className="text-[9px] font-bold">SEPA / RIB</Badge>
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Virement bancaire</div>
                  <div className="text-[10px] text-muted-foreground">Ordre de virement direct</div>
                </div>
              </button>

              {/* Option 4 : Paiement manuel */}
              <button
                type="button"
                onClick={() => setSelectedMethod('MANUAL')}
                className={cn(
                  'p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 relative',
                  selectedMethod === 'MANUAL'
                    ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-600/20'
                    : 'border-border/80 hover:bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between">
                  <Banknote className="h-5 w-5 text-amber-600" />
                  <Badge variant="outline" className="text-[9px] font-bold">En agence</Badge>
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Espèces / Chèque</div>
                  <div className="text-[10px] text-muted-foreground">Remise avec reçu signé</div>
                </div>
              </button>
            </div>

            {/* Détails spécifiques Mobile Money */}
            {selectedMethod === 'MOBILE_MONEY' && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground mb-1 block">Opérateur</label>
                    <select
                      value={mobileOperator}
                      onChange={(e) => setMobileOperator(e.target.value)}
                      className="w-full rounded-xl bg-background px-3 py-1.5 text-xs border border-border/80"
                    >
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="WAVE">Wave</option>
                      <option value="MTN_MOMO">MTN Mobile Money</option>
                      <option value="MOOV">Moov Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-foreground mb-1 block">N° Téléphone</label>
                    <input
                      type="tel"
                      placeholder="+225 07 00 00 00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl bg-background px-3 py-1.5 text-xs border border-border/80"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => initiateMutation.mutate()}
                disabled={initiateMutation.isPending || (selectedMethod === 'MOBILE_MONEY' && !phone.trim())}
                className="rounded-xl bg-emerald-600 text-white font-bold text-xs h-9 px-5 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                {initiateMutation.isPending ? 'Initialisation...' : 'Continuer vers le règlement'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 2 : Instructions & Confirmation ─── */}
        {step === 2 && sessionData && (
          <div className="space-y-4 pt-2">
            {selectedMethod === 'STRIPE' && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 text-center space-y-3">
                <CreditCard className="h-8 w-8 text-indigo-600 mx-auto" />
                <h4 className="font-bold text-sm text-foreground">Paiement par Carte Sécurisée</h4>
                <p className="text-xs text-muted-foreground">
                  Session de paiement Stripe prête. Cliquez ci-dessous pour confirmer et finaliser la transaction.
                </p>
                <Button
                  onClick={() => processMutation.mutate()}
                  disabled={processMutation.isPending}
                  className="w-full rounded-xl bg-indigo-600 text-white font-bold text-xs h-10 hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                >
                  {processMutation.isPending ? 'Validation en cours...' : `Confirmer le règlement de ${formatPrice(amount)}`}
                </Button>
              </div>
            )}

            {selectedMethod === 'MOBILE_MONEY' && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <Smartphone className="h-4 w-4" />
                  Validation Mobile Money
                </div>
                <p className="text-xs text-muted-foreground">
                  {sessionData.session.instructions || 'Veuillez valider le prompt sur votre mobile ou saisir votre code OTP.'}
                </p>
                <div>
                  <label className="text-[11px] font-semibold text-foreground mb-1 block">Code OTP / PIN de confirmation</label>
                  <input
                    type="text"
                    placeholder="Ex: 849204"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full rounded-xl bg-background px-3 py-2 text-xs border border-border/80 text-center font-mono font-bold tracking-widest"
                  />
                </div>
                <Button
                  onClick={() => processMutation.mutate()}
                  disabled={processMutation.isPending}
                  className="w-full rounded-xl bg-emerald-600 text-white font-bold text-xs h-10 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                >
                  {processMutation.isPending ? 'Validation en cours...' : 'Valider le paiement'}
                </Button>
              </div>
            )}

            {selectedMethod === 'BANK_TRANSFER' && (
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Coordonnées SEPA</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Ref: {sessionData.session.providerRef}
                  </Badge>
                </div>
                <div className="text-xs font-mono bg-background p-3 rounded-xl border border-border/80 space-y-1">
                  <div><strong>Bénéficiaire :</strong> IMMO-MYKAJY SAS</div>
                  <div><strong>IBAN :</strong> FR76 3000 4000 5000 6000 7000 123</div>
                  <div><strong>BIC :</strong> BNPAPRPP</div>
                  <div className="text-blue-600 font-bold pt-1">
                    <strong>Motif obligatoire :</strong> {sessionData.session.providerRef}
                  </div>
                </div>
                <Button
                  onClick={() => processMutation.mutate()}
                  disabled={processMutation.isPending}
                  className="w-full rounded-xl bg-blue-600 text-white font-bold text-xs h-10 hover:bg-blue-500 shadow-md shadow-blue-600/20"
                >
                  {processMutation.isPending ? 'Enregistrement...' : 'J’ai effectué le virement'}
                </Button>
              </div>
            )}

            {selectedMethod === 'MANUAL' && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-3">
                <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">Règlement en agence</h4>
                <p className="text-xs text-muted-foreground">
                  Présentez la référence <strong>{sessionData.session.providerRef}</strong> à l'accueil de votre agence Immo-MyKajy.
                </p>
                <Button
                  onClick={() => processMutation.mutate()}
                  disabled={processMutation.isPending}
                  className="w-full rounded-xl bg-amber-600 text-white font-bold text-xs h-10 hover:bg-amber-500 shadow-md shadow-amber-600/20"
                >
                  {processMutation.isPending ? 'Traitement...' : 'Enregistrer la promesse de règlement'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── ÉTAPE 3 : Succès & Reçu ─── */}
        {step === 3 && completedPayment && (
          <div className="py-4 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="h-8 w-8 animate-in zoom-in-50 duration-200" />
            </div>

            <div>
              <h3 className="text-base font-black text-foreground">Paiement validé avec succès !</h3>
              <p className="text-xs text-muted-foreground mt-1">
                La transaction <strong>{completedPayment.transactionRef}</strong> a été enregistrée.
              </p>
            </div>

            {completedPayment.receiptUrl && (
              <a
                href={completedPayment.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground border border-border/80 transition-colors"
              >
                <Receipt className="h-4 w-4 text-emerald-600" />
                Télécharger le reçu / quittance PDF
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <div className="pt-2">
              <Button
                type="button"
                onClick={handleReset}
                className="w-full rounded-xl bg-emerald-600 text-white font-bold text-xs h-10 hover:bg-emerald-500"
              >
                Terminer
              </Button>
            </div>
          </div>
        )}

        {/* Pied de sécurité */}
        <div className="mt-2 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Cryptage SSL 256-bit
          </span>
          <span>Immo-MyKajy Pay</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
