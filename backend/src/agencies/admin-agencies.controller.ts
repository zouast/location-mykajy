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
import { AgenciesService } from './agencies.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { QueryAgenciesDto } from './dto/query-agencies.dto';
import {
  AgencyDetailResponseDto,
  AgencyResponseDto,
  PaginatedAgenciesResponseDto,
} from './dto/agency-response.dto';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';

@ApiTags('Admin - Agencies')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/agencies')
export class AdminAgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lister toutes les agences avec filtres, recherche et pagination (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des agences récupérée avec succès',
    type: PaginatedAgenciesResponseDto,
  })
  async findAll(
    @Query() query: QueryAgenciesDto,
  ): Promise<PaginatedAgenciesResponseDto> {
    return this.agenciesService.adminFindAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consulter les informations complètes d’une agence par ID (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de l’agence récupérés avec succès',
    type: AgencyDetailResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<AgencyDetailResponseDto> {
    return this.agenciesService.adminFindOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle agence immobilière (ADMIN)',
  })
  @ApiResponse({
    status: 201,
    description: 'Agence créée avec succès',
    type: AgencyResponseDto,
  })
  async create(
    @Body() createAgencyDto: CreateAgencyDto,
  ): Promise<AgencyResponseDto> {
    return this.agenciesService.adminCreate(createAgencyDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier une agence immobilière (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Agence mise à jour avec succès',
    type: AgencyResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateAgencyDto: UpdateAgencyDto,
  ): Promise<AgencyResponseDto> {
    return this.agenciesService.adminUpdate(id, updateAgencyDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Activer ou désactiver une agence immobilière (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Statut de l’agence mis à jour',
    type: AgencyResponseDto,
  })
  async updateStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ): Promise<AgencyResponseDto> {
    return this.agenciesService.adminUpdateStatus(id, isActive);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Désactiver et supprimer (soft-delete) une agence (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Agence supprimée avec succès',
    type: MessageResponseDto,
  })
  async remove(@Param('id') id: string): Promise<MessageResponseDto> {
    return this.agenciesService.adminDelete(id);
  }
}
