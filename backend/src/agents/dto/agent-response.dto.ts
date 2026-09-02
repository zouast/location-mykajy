import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus, PropertyStatus, TransactionType } from '@prisma/client';
import { AgencyResponseDto } from '../../agencies/dto/agency-response.dto';
import {
  PaginationMetaDto,
  UserResponseDto,
} from '../../users/dto/user-response.dto';

export class AgentDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  agencyId: string;

  @ApiPropertyOptional()
  title?: string | null;

  @ApiPropertyOptional()
  licenseNumber?: string | null;

  @ApiPropertyOptional()
  biography?: string | null;

  @ApiProperty({ type: [String] })
  specialties: string[];

  @ApiPropertyOptional()
  yearsExperience?: number | null;

  @ApiProperty()
  isAvailable: boolean;

  @ApiPropertyOptional()
  rating?: number | null;

  @ApiProperty()
  reviewCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;

  @ApiPropertyOptional({ type: () => AgencyResponseDto })
  agency?: AgencyResponseDto;
}

export class AgentPropertyItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: PropertyStatus })
  status: PropertyStatus;

  @ApiProperty()
  area: number;

  @ApiPropertyOptional()
  rooms?: number | null;

  @ApiPropertyOptional()
  bedrooms?: number | null;

  @ApiProperty()
  createdAt: Date;
}

export class AgentListingItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  propertyId: string;

  @ApiProperty({ enum: TransactionType })
  transactionType: TransactionType;

  @ApiProperty({ enum: ListingStatus })
  status: ListingStatus;

  @ApiPropertyOptional()
  title?: string | null;

  @ApiPropertyOptional()
  price?: number;

  @ApiProperty()
  viewsCount: number;

  @ApiProperty()
  contactCount: number;

  @ApiProperty()
  createdAt: Date;
}

export class PaginatedAgentPropertiesResponseDto {
  @ApiProperty({ type: [AgentPropertyItemDto] })
  items: AgentPropertyItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class PaginatedAgentListingsResponseDto {
  @ApiProperty({ type: [AgentListingItemDto] })
  items: AgentListingItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
