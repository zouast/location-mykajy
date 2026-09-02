import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token de vérification reçu par email' })
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required.' })
  token: string;
}
