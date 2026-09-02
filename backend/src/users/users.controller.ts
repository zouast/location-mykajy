import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';
import {
  UserProfileResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Consulter son profil utilisateur complet' })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur récupéré avec succès',
    type: UserProfileResponseDto,
  })
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Modifier ses informations personnelles (prénom, nom, genre)',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil mis à jour avec succès',
    type: UserResponseDto,
  })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Patch('me/phone')
  @ApiOperation({ summary: 'Modifier son numéro de téléphone' })
  @ApiResponse({
    status: 200,
    description: 'Numéro de téléphone mis à jour avec succès',
    type: UserResponseDto,
  })
  async updatePhone(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updatePhoneDto: UpdatePhoneDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updatePhone(user.id, updatePhoneDto);
  }

  @Patch('me/email')
  @ApiOperation({
    summary:
      'Modifier son adresse email (requiert le mot de passe actuel pour vérification)',
  })
  @ApiResponse({
    status: 200,
    description: 'Email mis à jour avec envoi d’un email de vérification',
  })
  async updateEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateEmailDto: UpdateEmailDto,
  ): Promise<{ user: UserResponseDto; message: string }> {
    return this.usersService.updateEmail(user.id, updateEmailDto);
  }

  @Patch('me/avatar')
  @ApiOperation({ summary: 'Modifier sa photo de profil / avatar' })
  @ApiResponse({
    status: 200,
    description: 'Photo de profil mise à jour avec succès',
    type: UserResponseDto,
  })
  async updateAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateAvatarDto: UpdateAvatarDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateAvatar(user.id, updateAvatarDto);
  }

  @Post('me/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Désactiver son compte (requiert le mot de passe pour confirmation)',
  })
  @ApiResponse({
    status: 200,
    description: 'Compte désactivé et sessions fermées',
    type: MessageResponseDto,
  })
  async deactivateAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() deactivateAccountDto: DeactivateAccountDto,
  ): Promise<MessageResponseDto> {
    return this.usersService.deactivateAccount(user.id, deactivateAccountDto);
  }
}
