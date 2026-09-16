import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, Role } from '@prisma/client';

export class AgentProfileDto {
  @ApiProperty()
  id: string;

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
}

export class OwnerProfileDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  companyName?: string | null;

  @ApiPropertyOptional()
  siret?: string | null;

  @ApiPropertyOptional()
  address?: string | null;
}

export class ClientProfileDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  preferredCity?: string | null;

  @ApiPropertyOptional()
  budgetMin?: number | null;

  @ApiPropertyOptional()
  budgetMax?: number | null;

  @ApiPropertyOptional()
  preferredRooms?: number | null;

  @ApiProperty()
  isPreApproved: boolean;

  @ApiPropertyOptional()
  preApprovalAmount?: number | null;
}

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Jean' })
  firstName: string | null;

  @ApiPropertyOptional({ example: 'Dupont' })
  lastName: string | null;

  @ApiPropertyOptional({ example: '+33612345678' })
  phone: string | null;

  @ApiPropertyOptional({ example: 'https://images.example.com/avatar.jpg' })
  avatarUrl: string | null;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  gender: Gender | null;

  @ApiProperty({ enum: Role, example: Role.LOCATAIRE })
  role: Role;

  @ApiPropertyOptional({ example: 'PENDING' })
  status?: string;

  @ApiProperty({ example: false })
  emailVerified: boolean;

  @ApiProperty({ example: false })
  phoneVerified: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isVerified: boolean;

  @ApiPropertyOptional({ example: '2026-09-01T10:00:00.000Z' })
  lastLoginAt: Date | null;

  @ApiProperty({ example: '2026-09-01T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-01T08:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: null })
  deletedAt: Date | null;
}

export class UserProfileResponseDto extends UserResponseDto {
  @ApiPropertyOptional({ type: () => AgentProfileDto })
  agentProfile?: AgentProfileDto | null;

  @ApiPropertyOptional({ type: () => OwnerProfileDto })
  ownerProfile?: OwnerProfileDto | null;

  @ApiPropertyOptional({ type: () => ClientProfileDto })
  clientProfile?: ClientProfileDto | null;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  items: UserResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
