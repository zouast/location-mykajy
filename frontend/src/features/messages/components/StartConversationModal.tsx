import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { conversationService } from '@/services/conversation.service';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { MessageSquare, Send, Building, Paperclip } from 'lucide-react';

interface StartConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientRole?: string;
  listingId?: string;
  listingTitle?: string;
}

export function StartConversationModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientRole,
  listingId,
  listingTitle,
}: StartConversationModalProps) {
  const [message, setMessage] = useState(
    listingTitle
      ? `Bonjour ${recipientName}, je suis intéressé(e) par votre bien "${listingTitle}" et souhaiterais avoir plus d'informations.`
      : `Bonjour ${recipientName},`,
  );
  const [subject, setSubject] = useState(
    listingTitle ? `Demande d'information : ${listingTitle}` : 'Contact Immo-MyKajy',
  );
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachment, setShowAttachment] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: () =>
      conversationService.createConversation({
        recipientId,
        listingId,
        subject,
        initialMessage: message.trim(),
        attachmentUrl: attachmentUrl.trim() || undefined,
        attachmentName: attachmentUrl ? 'Document_joint' : undefined,
      }),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onClose();
      navigate(`/messages?id=${newConv.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    startMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border-border/80 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <MessageSquare className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold">Contacter {recipientName}</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {recipientRole ? `Rôle : ${recipientRole}` : 'Envoyez un message direct à votre interlocuteur.'}
          </DialogDescription>
        </DialogHeader>

        {listingTitle && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200">
            <Building className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="font-semibold truncate">{listingTitle}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Objet</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl bg-muted/60 px-3.5 py-2 text-xs border border-border/80 focus:ring-2 focus:ring-indigo-500/50"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Votre message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl bg-muted/60 p-3 text-xs border border-border/80 focus:ring-2 focus:ring-indigo-500/50 resize-none"
              required
            />
          </div>

          {showAttachment ? (
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Lien du fichier (optionnel)</label>
              <input
                type="url"
                placeholder="https://..."
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="w-full rounded-xl bg-muted/60 px-3.5 py-2 text-xs border border-border/80 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAttachment(true)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Joindre un document ou dossier
            </button>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={startMutation.isPending || !message.trim()}
              className="rounded-xl bg-indigo-600 text-white font-bold text-xs h-9 px-4 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {startMutation.isPending ? 'Envoi...' : 'Envoyer le message'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
