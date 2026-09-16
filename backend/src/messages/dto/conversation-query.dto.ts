export class ConversationQueryDto {
  page?: number;
  limit?: number;
  archived?: boolean;
  search?: string;
  unreadOnly?: boolean;
  listingId?: string;
}

export class MessageQueryDto {
  page?: number;
  limit?: number;
  before?: string;
}
