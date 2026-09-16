import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ConversationsWsService {
  private readonly logger = new Logger(ConversationsWsService.name);

  // Map userId -> Set of socket IDs (simulated in-memory)
  private readonly onlineUsers = new Map<string, Set<string>>();

  /**
   * Vérifie si un utilisateur est actuellement en ligne (connecté au WebSocket)
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.onlineUsers.get(userId);
    return !!sockets && sockets.size > 0;
  }

  /**
   * Enregistre un utilisateur comme en ligne
   */
  addOnlineUser(userId: string, socketId: string): void {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socketId);
  }

  /**
   * Retire un utilisateur de la liste en ligne
   */
  removeOnlineUser(userId: string, socketId: string): void {
    const sockets = this.onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId);
      }
    }
  }

  /**
   * Émet un nouveau message à tous les destinataires via WebSocket
   */
  emitNewMessage(
    conversationId: string,
    message: any,
    recipientIds: string[],
  ): void {
    // TODO: Implémenter avec @nestjs/websockets / Socket.IO Gateway
    this.logger.debug(
      `[WS] emitNewMessage: conversation=${conversationId}, recipients=${recipientIds.join(',')}`,
    );
  }

  /**
   * Émet une confirmation de lecture de message
   */
  emitMessageRead(conversationId: string, readByUserId: string): void {
    // TODO: Implémenter avec @nestjs/websockets / Socket.IO Gateway
    this.logger.debug(
      `[WS] emitMessageRead: conversation=${conversationId}, readBy=${readByUserId}`,
    );
  }
}
