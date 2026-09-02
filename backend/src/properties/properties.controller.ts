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
import { PropertiesService } from './properties.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyFilterDto } from './dto/property-filter.dto';
import {
  PaginatedPropertiesResponseDto,
  PropertyResponseDto,
} from './dto/property-response.dto';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';

@ApiTags('Properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Get('my-properties')
  @ApiOperation({
    summary:
      'Consulter ses propres biens immobiliers (OWNER: ses biens, AGENT: ses biens assignés, AGENCY_ADMIN: biens de l’agence, ADMIN: tous)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste de ses biens immobiliers récupérée avec succès',
    type: PaginatedPropertiesResponseDto,
  })
  async getMyProperties(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filter: PropertyFilterDto,
  ): Promise<PaginatedPropertiesResponseDto> {
    return this.propertiesService.getMyProperties(user, filter);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Rechercher et filtrer les biens immobiliers (public ou selon permissions si connecté)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des biens immobiliers récupérée avec succès',
    type: PaginatedPropertiesResponseDto,
  })
  async findAll(
    @Query() filter: PropertyFilterDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<PaginatedPropertiesResponseDto> {
    return this.propertiesService.findAll(filter, user);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary:
      'Consulter la fiche détaillée d’un bien immobilier par son identifiant',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du bien immobilier récupérés avec succès',
    type: PropertyResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<PropertyResponseDto> {
    return this.propertiesService.findOne(id, user);
  }

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Post()
  @ApiOperation({
    summary:
      'Créer un nouveau bien immobilier physique (OWNER, AGENT, AGENCY_ADMIN, ADMIN)',
  })
  @ApiResponse({
    status: 201,
    description: 'Bien immobilier créé avec succès',
    type: PropertyResponseDto,
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createPropertyDto: CreatePropertyDto,
  ): Promise<PropertyResponseDto> {
    return this.propertiesService.create(user, createPropertyDto);
  }

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Patch(':id')
  @ApiOperation({
    summary:
      'Modifier un bien immobilier existant selon les permissions de rôle',
  })
  @ApiResponse({
    status: 200,
    description: 'Bien immobilier mis à jour avec succès',
    type: PropertyResponseDto,
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ): Promise<PropertyResponseDto> {
    return this.propertiesService.update(user, id, updatePropertyDto);
  }

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer / archiver un bien immobilier',
  })
  @ApiResponse({
    status: 200,
    description: 'Bien immobilier supprimé et archivé avec succès',
    type: MessageResponseDto,
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<MessageResponseDto> {
    return this.propertiesService.remove(user, id);
  }
}
