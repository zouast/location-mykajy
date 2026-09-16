import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Query unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      try {
        const res = await api.get<{ count: number } | { data: { count: number } }>('/notifications/unread-count');
        const body: any = res.data;
        return typeof body?.count === 'number' ? body.count : body?.data?.count || 0;
      } catch {
        return 0;
      }
    },
    refetchInterval: 30000,
  });

  const unreadCount = typeof countData === 'number' ? countData : 0;

  // Query notifications list
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: async () => {
      try {
        const res = await api.get<{ items: NotificationItem[] } | NotificationItem[]>('/notifications?limit=5');
        const body: any = res.data;
        if (Array.isArray(body)) return body;
        if (Array.isArray(body?.items)) return body.items;
        if (Array.isArray(body?.data)) return body.data;
        if (Array.isArray(body?.data?.items)) return body.data.items;
        return [];
      } catch {
        return [];
      }
    },
    enabled: isOpen,
  });

  const notifications: NotificationItem[] = Array.isArray(notificationsData) ? notificationsData : [];

  // Mark all as read
  const markAllMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  // Mark single as read
  const markSingleMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border border-border/80 bg-card p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="divide-y divide-border/40 max-h-72 overflow-y-auto py-1">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Aucune notification pour l'instant.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markSingleMutation.mutate(n.id);
                  }}
                  className={`p-2.5 transition-colors rounded-xl flex items-start gap-2.5 cursor-pointer ${
                    n.isRead ? 'hover:bg-muted/40 opacity-75' : 'bg-muted/30 hover:bg-muted/60'
                  }`}
                >
                  <div
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      n.isRead ? 'bg-transparent' : 'bg-indigo-600'
                    }`}
                  />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="text-xs font-bold text-foreground line-clamp-1">{n.title}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2">{n.content}</div>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => setIsOpen(false)}
                          className="font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                        >
                          Voir <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
