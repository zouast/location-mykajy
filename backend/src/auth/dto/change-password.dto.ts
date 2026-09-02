import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123!' })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required.' })
  currentPassword: string;

  @ApiProperty({ example: 'NewSecurePass456!', minLength: 6 })
  @IsString()
  @IsNotEmpty({ message: 'New password is required.' })
  @MinLength(6, { message: 'New password must be at least 6 characters long.' })
  newPassword: string;
}
