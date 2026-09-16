import { ApiProperty } from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';

export class UserSummaryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Jean' })
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  lastName: string;

  @ApiProperty({ example: 'jean.dupont@example.com' })
  email: string;

  @ApiProperty({ example: '+33612345678', required: false, nullable: true })
  phone?: string | null;

  @ApiProperty({ enum: Role, example: Role.LOCATAIRE })
  role: Role;

  @ApiProperty({ enum: UserStatus, example: UserStatus.PENDING })
  status: UserStatus;

  @ApiProperty({ example: false })
  emailVerified: boolean;

  @ApiProperty({ example: false })
  phoneVerified?: boolean;
}

export class RegisterResponseDataDto {
  @ApiProperty({ type: UserSummaryDto })
  user: UserSummaryDto;
}

export class RegisterResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Compte créé. Vérifiez votre adresse email.' })
  message: string;

  @ApiProperty({ type: RegisterResponseDataDto })
  data: RegisterResponseDataDto;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false, nullable: true })
  firstName: string | null;

  @ApiProperty({ required: false, nullable: true })
  lastName: string | null;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @ApiProperty({ default: false })
  emailVerified: boolean;

  @ApiProperty({ default: false })
  phoneVerified: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isVerified: boolean;
}

export class AuthTokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ example: '15m' })
  expiresIn: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens: AuthTokensDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation successful.' })
  message: string;

  @ApiProperty({ example: true, required: false })
  success?: boolean;
}
