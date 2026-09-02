import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token opaque reçu lors de la connexion',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required.' })
  refreshToken: string;
}
