export class DayAvailabilitySlotDto {
  time: string;
  isAvailable: boolean;
  reason?: string;
}

export class AvailabilityResponseDto {
  date: string;
  slots: DayAvailabilitySlotDto[];
}

export class VisitClientDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

export class VisitAgentDto {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export class VisitListingDto {
  id: string;
  title: string;
  transactionType: string;
  city: string;
  primaryPhotoUrl?: string;
  price?: number;
}

export class VisitResponseDto {
  id: string;
  listingId: string;
  clientId: string;
  agentId: string | null;
  scheduledAt: Date;
  duration: number;
  type: 'IN_PERSON' | 'VIRTUAL';
  status: string;
  clientNotes: string | null;
  agentNotes: string | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  client: VisitClientDto | null;
  agent: VisitAgentDto | null;
  listing: VisitListingDto | null;
}
