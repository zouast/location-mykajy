import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaginationMetaDto,
  UserResponseDto,
} from '../../users/dto/user-response.dto';

export class AgencyStatsDto {
  @ApiProperty({ example: 5 })
  agentsCount: number;

  @ApiProperty({ example: 24 })
  propertiesCount: number;

  @ApiProperty({ example: 18 })
  listingsCount: number;
}

export class AgencyAgentItemDto {
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
}

export class AgencyResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Immo Prestige Paris' })
  name: string;

  @ApiPropertyOptional({ example: 'Immo Prestige SAS' })
  legalName?: string | null;

  @ApiPropertyOptional({ example: '12345678901234' })
  siret?: string | null;

  @ApiPropertyOptional({ example: 'https://images.example.com/logo.png' })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://images.example.com/banner.jpg' })
  bannerUrl?: string | null;

  @ApiPropertyOptional({ example: 'Description de l’agence' })
  description?: string | null;

  @ApiProperty({ example: '12 Avenue Montaigne' })
  address: string;

  @ApiProperty({ example: 'Paris' })
  city: string;

  @ApiPropertyOptional({ example: '75008' })
  zipCode?: string | null;

  @ApiProperty({ example: '+33140000000' })
  phone: string;

  @ApiProperty({ example: 'contact@immoprestige.com' })
  email: string;

  @ApiPropertyOptional({ example: 'https://www.immoprestige.com' })
  website?: string | null;

  @ApiPropertyOptional({ example: 'CPI75012020000000001' })
  licenseNumber?: string | null;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-09-01T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-01T08:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: null })
  deletedAt?: Date | null;
}

export class AgencyDetailResponseDto extends AgencyResponseDto {
  @ApiPropertyOptional({ type: () => AgencyStatsDto })
  stats?: AgencyStatsDto;

  @ApiPropertyOptional({ type: () => [AgencyAgentItemDto] })
  agents?: AgencyAgentItemDto[];
}

export class PaginatedAgenciesResponseDto {
  @ApiProperty({ type: [AgencyResponseDto] })
  items: AgencyResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class PaginatedAgencyAgentsResponseDto {
  @ApiProperty({ type: [AgencyAgentItemDto] })
  items: AgencyAgentItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
