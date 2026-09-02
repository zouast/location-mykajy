import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdatePhoneDto {
  @ApiProperty({
    description:
      'Numéro de téléphone au format international (E.164 ou standard)',
    example: '+33612345678',
  })
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'Le format du numéro de téléphone est invalide',
  })
  phone: string;
}
