import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiPropertyOptional({
    description:
      'Refresh token à révoquer. Si absent, tous les refresh tokens de l’utilisateur sont révoqués.',
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
