import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({
    description: 'URL de la photo de profil / avatar',
    example: 'https://images.example.com/avatars/user-123.jpg',
  })
  @IsNotEmpty({ message: 'L’URL de l’avatar est requise' })
  @IsUrl(
    { require_protocol: true },
    { message: 'L’URL de l’avatar doit être une URL valide (http ou https)' },
  )
  avatarUrl: string;
}
