import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token reçu par email' })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required.' })
  token: string;

  @ApiProperty({ example: 'NewSecurePass456!', minLength: 6 })
  @IsString()
  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(6, { message: 'New password must be at least 6 characters long.' })
  newPassword: string;
}
