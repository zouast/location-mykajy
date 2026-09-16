export class CreateConversationDto {
  recipientId: string;
  subject?: string;
  listingId?: string;
  initialMessage: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
}
