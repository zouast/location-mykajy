import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { QueryUsersDto } from './dto/query-users.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto';
import {
  PaginatedUsersResponseDto,
  UserProfileResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lister tous les utilisateurs avec pagination, filtres et recherche (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des utilisateurs récupérée avec succès',
    type: PaginatedUsersResponseDto,
  })
  async findAll(
    @Query() query: QueryUsersDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulter un utilisateur par son ID avec ses profils (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de l’utilisateur récupérés avec succès',
    type: UserProfileResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<UserProfileResponseDto> {
    return this.usersService.adminFindOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Créer un nouvel utilisateur avec attribution de rôle (ADMIN)',
  })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
    type: UserResponseDto,
  })
  async create(
    @Body() adminCreateUserDto: AdminCreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.adminCreate(adminCreateUserDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Modifier un utilisateur (informations, rôle, statut actif/vérifié) (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur mis à jour avec succès',
    type: UserResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.adminUpdate(id, adminUpdateUserDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Activer ou désactiver le compte d’un utilisateur (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut du compte mis à jour avec succès',
    type: UserResponseDto,
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() adminUpdateUserStatusDto: AdminUpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    return this.usersService.adminUpdateStatus(id, adminUpdateUserStatusDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer (soft-delete) un utilisateur (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur désactivé et marqué comme supprimé',
    type: MessageResponseDto,
  })
  async remove(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.usersService.adminDelete(id);
  }
}
