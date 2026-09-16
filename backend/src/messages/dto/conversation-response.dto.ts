export class ConversationParticipantUserDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
  phone?: string | null;
}

export class ConversationParticipantDto {
  id: string;
  userId: string;
  hasUnread: boolean;
  lastReadAt: Date | null;
  user: ConversationParticipantUserDto;
}

export class MessageSenderDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: string;
}

export class MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  isEdited: boolean;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentSize: number | null;
  attachmentType: string | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sender: MessageSenderDto | null;
}

export class ConversationListingDto {
  id: string;
  title: string | null;
  transactionType: string;
  city?: string;
  price?: number;
  primaryPhotoUrl?: string;
}

export class ConversationResponseDto {
  id: string;
  subject: string | null;
  listingId: string | null;
  isArchived: boolean;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  unreadCount: number;
  participants: ConversationParticipantDto[];
  lastMessage: MessageDto | null;
  listing: ConversationListingDto | null;
}
