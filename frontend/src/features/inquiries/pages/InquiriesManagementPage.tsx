import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { inquiriesService } from '@/services/inquiries.service';
import type { Inquiry, InquiryStatus } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Mail,
  Phone,
  User,
  Clock,
  CheckCircle,
  Send,
  ExternalLink,
  Trash2,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  InquiryStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  NEW: {
    label: 'Nouveau',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  CONTACTED: {
    label: 'Contacté',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  IN_PROGRESS: {
    label: 'En cours',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  ANSWERED: {
    label: 'Répondu',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  CLOSED: {
    label: 'Clôturé',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
};

export default function InquiriesManagementPage() {
  const [selectedStatus, setSelectedStatus] = useState<InquiryStatus | ''>('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [responseText, setResponseText] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['received-inquiries', selectedStatus],
    queryFn: () =>
      inquiriesService.getReceived(selectedStatus ? (selectedStatus as InquiryStatus) : undefined),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, response }: { id: string; status: InquiryStatus; response?: string }) =>
      inquiriesService.updateStatus(id, { status, response }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['received-inquiries'] });
      setSelectedInquiry(updated);
      setResponseText('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inquiriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-inquiries'] });
      setSelectedInquiry(null);
    },
  });

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !responseText.trim()) return;
    updateStatusMutation.mutate({
      id: selectedInquiry.id,
      status: 'ANSWERED',
      response: responseText.trim(),
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <MessageSquare className="h-4 w-4" />
            <span>Espace Gestion Annonceur</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Demandes de Contact & Visites
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Gérez et répondez en temps réel aux messages des prospects intéressés par vos biens.
          </p>
        </div>
      </div>

      {/* ── Status Filter Tabs ── */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { label: 'Toutes les demandes', value: '' },
          { label: 'Nouvelles (NEW)', value: 'NEW' },
          { label: 'Contactées', value: 'CONTACTED' },
          { label: 'En cours', value: 'IN_PROGRESS' },
          { label: 'Clôturées', value: 'CLOSED' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setSelectedStatus(tab.value as InquiryStatus | '');
              setSelectedInquiry(null);
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              selectedStatus === tab.value
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-card text-muted-foreground ring-1 ring-border/80 hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Two-Column Layout (List + Detail Pane) ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left Column : Inquiries List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))
          ) : !data || data.items.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <h3 className="text-base font-bold text-foreground">Aucune demande reçue</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Les nouveaux messages des clients pour vos annonces apparaîtront ici.
              </p>
            </div>
          ) : (
            data.items.map((inquiry) => {
              const isSelected = selectedInquiry?.id === inquiry.id;
              const statusCfg = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.NEW;

              return (
                <div
                  key={inquiry.id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className={`cursor-pointer rounded-2xl p-4 ring-1 transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-50/40 ring-indigo-600 shadow-md dark:bg-indigo-950/30'
                      : 'bg-card ring-border/80 hover:ring-indigo-400 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs dark:bg-indigo-950">
                        {inquiry.name?.charAt(0) || inquiry.email?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          {inquiry.name || inquiry.email || 'Visiteur anonyme'}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">{inquiry.email}</p>
                      </div>
                    </div>

                    <Badge
                      className={`rounded-full text-[10px] ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border} border`}
                    >
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Subject & Message preview */}
                  <h5 className="font-semibold text-xs text-foreground mb-1 line-clamp-1">
                    {inquiry.subject}
                  </h5>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {inquiry.message}
                  </p>

                  {/* Footer info: listing title & date */}
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                    <span className="truncate max-w-[200px] font-medium text-foreground">
                      🏠 {inquiry.listing?.title || 'Bien immobilier'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(inquiry.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column : Detail & Action Pane */}
        <div>
          {selectedInquiry ? (
            <div className="sticky top-20 rounded-3xl bg-card p-6 ring-1 ring-border/80 shadow-lg space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-4">
                <div>
                  <h3 className="font-black text-lg text-foreground">{selectedInquiry.subject}</h3>
                  <p className="text-xs text-muted-foreground">
                    Reçu le {new Date(selectedInquiry.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Supprimer définitivement ce message ?')) {
                      deleteMutation.mutate(selectedInquiry.id);
                    }
                  }}
                  className="h-8 w-8 p-0 rounded-xl text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Prospect Contact Card */}
              <div className="rounded-2xl bg-muted/40 p-3.5 space-y-2 text-xs">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4 text-indigo-600" />
                  <span>{selectedInquiry.name || 'Demandeur'}</span>
                </div>
                {selectedInquiry.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-indigo-500" />
                    <a href={`mailto:${selectedInquiry.email}`} className="hover:text-indigo-600 underline">
                      {selectedInquiry.email}
                    </a>
                  </div>
                )}
                {selectedInquiry.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-indigo-500" />
                    <a href={`tel:${selectedInquiry.phone}`} className="hover:text-indigo-600 font-semibold">
                      {selectedInquiry.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Associated Listing Banner */}
              {selectedInquiry.listing && (
                <div className="flex items-center justify-between rounded-2xl border border-border p-3 text-xs">
                  <div className="truncate pr-2">
                    <span className="text-muted-foreground block text-[10px]">Annonce concernée :</span>
                    <span className="font-bold text-foreground">{selectedInquiry.listing.title}</span>
                  </div>
                  <Link
                    to={`/properties/${selectedInquiry.listingId}`}
                    target="_blank"
                    className="shrink-0 text-indigo-600 hover:text-indigo-500 font-semibold inline-flex items-center gap-1"
                  >
                    Voir <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* Message Content */}
              <div>
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-2">
                  Message du prospect
                </h4>
                <div className="rounded-2xl bg-card border border-border/80 p-4 text-xs leading-relaxed text-foreground whitespace-pre-line">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Response History if already answered */}
              {selectedInquiry.response && (
                <div className="rounded-2xl bg-emerald-50/50 border border-emerald-200 p-4 dark:bg-emerald-950/30 dark:border-emerald-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Votre réponse transmise :</span>
                  </div>
                  <p className="text-xs text-emerald-900 dark:text-emerald-200 whitespace-pre-line">
                    {selectedInquiry.response}
                  </p>
                  {selectedInquiry.respondedAt && (
                    <span className="text-[10px] text-muted-foreground block mt-2">
                      Envoyée le {new Date(selectedInquiry.respondedAt).toLocaleString('fr-FR')}
                    </span>
                  )}
                </div>
              )}

              {/* Status Update Quick Buttons */}
              <div className="space-y-2 border-t border-border/60 pt-4">
                <span className="text-xs font-semibold text-muted-foreground block">Changer le statut :</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED'] as InquiryStatus[]).map((st) => (
                    <Button
                      key={st}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateStatusMutation.mutate({ id: selectedInquiry.id, status: st })
                      }
                      className={`rounded-xl text-[11px] h-7 ${
                        selectedInquiry.status === st
                          ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950'
                          : ''
                      }`}
                    >
                      {STATUS_CONFIG[st].label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendResponse} className="space-y-3 border-t border-border/60 pt-4">
                <label className="text-xs font-bold text-foreground block">
                  Envoyer une réponse par message / email :
                </label>
                <textarea
                  rows={3}
                  required
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Bonjour, je fais suite à votre demande..."
                  className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  type="submit"
                  disabled={updateStatusMutation.isPending || !responseText.trim()}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs py-4 shadow-md shadow-indigo-600/20"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {updateStatusMutation.isPending ? 'Envoi…' : 'Envoyer la réponse'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 p-8 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-medium">Sélectionnez une demande dans la liste pour voir les détails et répondre.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
