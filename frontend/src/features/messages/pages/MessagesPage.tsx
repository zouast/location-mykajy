import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { conversationService } from '@/services/conversation.service';
import { useAuth } from '@/features/auth/AuthContext';
import type { ConversationItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  Send,
  Paperclip,
  Search,
  Building,
  Check,
  CheckCheck,
  ArrowLeft,
  FileText,
  ExternalLink,
  Shield,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialConversationId = searchParams.get('id');

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // ─── 1. Liste des conversations ───
  const { data: convData, isLoading: isLoadingConvs } = useQuery({
    queryKey: ['conversations', searchQuery, unreadOnly],
    queryFn: () => conversationService.getConversations(1, 30, searchQuery, unreadOnly),
    refetchInterval: 10000,
  });

  const conversations = convData?.items || [];

  // Sélectionner la première conversation par défaut si aucune n'est choisie
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  // ─── 2. Conversation active & Messages ───
  const { data: activeConversation } = useQuery({
    queryKey: ['conversation', selectedConversationId],
    queryFn: () => conversationService.getConversationById(selectedConversationId!),
    enabled: !!selectedConversationId,
  });

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['conversation-messages', selectedConversationId],
    queryFn: () => conversationService.getMessages(selectedConversationId!),
    enabled: !!selectedConversationId,
    refetchInterval: 5000,
  });

  const messages = messagesData?.items || [];

  // Marquer comme lu à la sélection
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => conversationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    if (selectedConversationId && activeConversation?.unreadCount) {
      markAsReadMutation.mutate(selectedConversationId);
    }
  }, [selectedConversationId, activeConversation?.unreadCount]);

  // Défilement automatique vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── 3. Envoi de message ───
  const sendMessageMutation = useMutation({
    mutationFn: ({ convId, content, attUrl, attName }: { convId: string; content: string; attUrl?: string; attName?: string }) =>
      conversationService.sendMessage(convId, {
        content,
        attachmentUrl: attUrl || undefined,
        attachmentName: attName || undefined,
        attachmentType: attUrl ? (attUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? 'IMAGE' : 'DOCUMENT') : undefined,
      }),
    onSuccess: () => {
      setMessageInput('');
      setAttachmentUrl('');
      setAttachmentName('');
      setShowAttachmentInput(false);
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!messageInput.trim() && !attachmentUrl.trim()) || !selectedConversationId) return;

    sendMessageMutation.mutate({
      convId: selectedConversationId,
      content: messageInput.trim() || '📎 Pièce jointe partagée',
      attUrl: attachmentUrl.trim() || undefined,
      attName: attachmentName.trim() || (attachmentUrl ? 'Fichier_joint' : undefined),
    });
  };

  // Trouver l'interlocuteur de la conversation
  const getInterlocutor = (conv: ConversationItem) => {
    const otherParticipant = conv.participants.find((p) => p.userId !== user?.id);
    return otherParticipant?.user;
  };

  const activeInterlocutor = activeConversation ? getInterlocutor(activeConversation) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* En-tête */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            Messagerie Instantanée
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Échangez en direct avec vos clients, propriétaires et agents immobiliers.
          </p>
        </div>
      </div>

      {/* Cadre de messagerie à 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-card border border-border/80 rounded-3xl shadow-xl overflow-hidden min-h-[700px] max-h-[820px]">
        {/* ─── Colonne de gauche : Liste des conversations ─── */}
        <div
          className={cn(
            'lg:col-span-4 border-r border-border/60 flex flex-col bg-background/50 backdrop-blur-xs',
            selectedConversationId && 'hidden lg:flex',
          )}
        >
          {/* Recherche & Filtre */}
          <div className="p-4 border-b border-border/60 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-muted/60 pl-9 pr-4 py-2 text-xs border border-border/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUnreadOnly(false)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
                  !unreadOnly
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                Toutes ({convData?.total || 0})
              </button>
              <button
                onClick={() => setUnreadOnly(true)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
                  unreadOnly
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                Non lues ({convData?.unreadCount || 0})
              </button>
            </div>
          </div>

          {/* Liste déroulante des conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {isLoadingConvs ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold text-foreground">Aucune conversation</p>
                <p className="text-[11px] mt-0.5">Vos échanges récents apparaîtront ici.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const interlocutor = getInterlocutor(conv);
                const isSelected = selectedConversationId === conv.id;
                const displayName = interlocutor
                  ? [interlocutor.firstName, interlocutor.lastName].filter(Boolean).join(' ') ||
                    interlocutor.email
                  : 'Interlocuteur';

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      setSearchParams({ id: conv.id });
                    }}
                    className={cn(
                      'w-full text-left p-4 transition-all flex items-start gap-3 relative hover:bg-muted/50',
                      isSelected && 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600',
                      conv.unreadCount ? 'font-medium' : '',
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden">
                        {interlocutor?.avatarUrl ? (
                          <img
                            src={interlocutor.avatarUrl}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          displayName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      {interlocutor?.role && interlocutor.role !== 'CLIENT' && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] text-white">
                          <Shield className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Détails */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-foreground truncate">
                          {displayName}
                        </span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>

                      {conv.listing && (
                        <div className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate mb-1">
                          <Building className="h-3 w-3 shrink-0" />
                          <span className="truncate">{conv.listing.title}</span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground truncate leading-relaxed">
                        {conv.lastMessage?.content || 'Aucun message.'}
                      </p>
                    </div>

                    {/* Badge non lu */}
                    {!!conv.unreadCount && (
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 shrink-0 self-center" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ─── Colonne de droite : Fenêtre de discussion active ─── */}
        <div
          className={cn(
            'lg:col-span-8 flex flex-col bg-card',
            !selectedConversationId && 'hidden lg:flex',
          )}
        >
          {selectedConversationId && activeConversation ? (
            <>
              {/* En-tête de la conversation active */}
              <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversationId(null)}
                    className="lg:hidden p-1.5 h-8 w-8 rounded-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                    {activeInterlocutor?.avatarUrl ? (
                      <img
                        src={activeInterlocutor.avatarUrl}
                        alt={activeInterlocutor.email}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (activeInterlocutor?.firstName?.slice(0, 2) || 'CL').toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground truncate">
                        {activeInterlocutor
                          ? [activeInterlocutor.firstName, activeInterlocutor.lastName]
                              .filter(Boolean)
                              .join(' ') || activeInterlocutor.email
                          : 'Conversation'}
                      </span>
                      {activeInterlocutor?.role && (
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {activeInterlocutor.role}
                        </Badge>
                      )}
                    </div>
                    {activeInterlocutor?.phone && (
                      <p className="text-[11px] text-muted-foreground">{activeInterlocutor.phone}</p>
                    )}
                  </div>
                </div>

                {/* Badge du bien rattaché */}
                {activeConversation.listing && (
                  <Link
                    to={`/properties/${activeConversation.listing.id}`}
                    target="_blank"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:opacity-90 transition-opacity shrink-0"
                  >
                    <Building className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[160px]">{activeConversation.listing.title}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>

              {/* Zone d'affichage des messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/10">
                {isLoadingMessages ? (
                  <div className="space-y-4 p-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex flex-col gap-1 max-w-[70%]',
                          i % 2 === 0 ? 'ml-auto items-end' : 'mr-auto items-start',
                        )}
                      >
                        <Skeleton className="h-12 w-48 rounded-2xl" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                    <Sparkles className="h-8 w-8 text-indigo-400 mb-2" />
                    <p className="text-xs font-bold text-foreground">Début de la conversation</p>
                    <p className="text-[11px]">Envoyez votre premier message ci-dessous.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={cn('flex flex-col group', isMe ? 'items-end' : 'items-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-xs',
                            isMe
                              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-br-xs'
                              : 'bg-background border border-border/80 text-foreground rounded-bl-xs',
                          )}
                        >
                          {/* Contenu texte */}
                          <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>

                          {/* Pièce jointe éventuelle */}
                          {msg.attachmentUrl && (
                            <div className="mt-2 pt-2 border-t border-white/20 dark:border-border/40">
                              {msg.attachmentType === 'IMAGE' ||
                              msg.attachmentUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                                <a
                                  href={msg.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block overflow-hidden rounded-xl border border-white/30"
                                >
                                  <img
                                    src={msg.attachmentUrl}
                                    alt={msg.attachmentName || 'Image jointe'}
                                    className="max-h-48 w-full object-cover hover:scale-105 transition-transform"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={msg.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={cn(
                                    'flex items-center gap-2 p-2 rounded-xl text-[11px] font-semibold transition-colors',
                                    isMe
                                      ? 'bg-white/10 hover:bg-white/20 text-white'
                                      : 'bg-muted hover:bg-muted/80 text-foreground',
                                  )}
                                >
                                  <FileText className="h-4 w-4 shrink-0" />
                                  <span className="truncate">{msg.attachmentName || 'Télécharger le document'}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0 ml-auto" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Heure et statut de lecture */}
                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-muted-foreground">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && (
                            <span>
                              {msg.isRead ? (
                                <CheckCheck className="h-3 w-3 text-indigo-600" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Champ d'attachement facultatif */}
              {showAttachmentInput && (
                <div className="px-4 py-2 border-t border-border/40 bg-muted/30 flex flex-col sm:flex-row gap-2 items-center text-xs">
                  <input
                    type="url"
                    placeholder="URL du fichier (ex: https://...)"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="flex-1 w-full rounded-lg bg-background px-3 py-1.5 border border-border/80 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Nom du fichier (ex: contrat.pdf)"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="w-full sm:w-48 rounded-lg bg-background px-3 py-1.5 border border-border/80 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAttachmentInput(false)}
                    className="text-xs text-muted-foreground h-7"
                  >
                    Fermer
                  </Button>
                </div>
              )}

              {/* Barre de saisie de message */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 border-t border-border/60 bg-background flex items-center gap-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                  title="Ajouter une pièce jointe"
                  className={cn(
                    'rounded-full h-9 w-9 p-0 shrink-0 text-muted-foreground hover:text-indigo-600',
                    showAttachmentInput && 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950',
                  )}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <input
                  type="text"
                  placeholder="Écrivez votre message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 rounded-2xl bg-muted/60 px-4 py-2.5 text-xs sm:text-sm border border-border/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />

                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending || (!messageInput.trim() && !attachmentUrl.trim())}
                  className="rounded-2xl bg-indigo-600 text-white font-bold h-9 px-4 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 shrink-0 flex items-center gap-1 text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Envoyer</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-base text-foreground mb-1">Sélectionnez une conversation</h3>
              <p className="text-xs max-w-sm">
                Choisissez une conversation dans la liste à gauche ou contactez directement un agent depuis la page d'une annonce.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
