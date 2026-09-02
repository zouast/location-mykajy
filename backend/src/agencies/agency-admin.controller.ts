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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { AgencyAdminUpdateAgencyDto } from './dto/agency-admin-update.dto';
import { CreateAgencyAgentDto } from './dto/create-agency-agent.dto';
import { UpdateAgencyAgentDto } from './dto/update-agency-agent.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import {
  AgencyAgentItemDto,
  AgencyDetailResponseDto,
  AgencyResponseDto,
  PaginatedAgencyAgentsResponseDto,
} from './dto/agency-response.dto';
import { MessageResponseDto } from '../auth/dto/auth-response.dto';

@ApiTags('Agency Admin')
@ApiBearerAuth()
@Roles(Role.AGENCY_ADMIN)
@Controller('agency/me')
export class AgencyAdminController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Consulter les informations et statistiques de son agence (AGENCY_ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Informations de l’agence récupérées avec succès',
    type: AgencyDetailResponseDto,
  })
  async getMyAgency(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AgencyDetailResponseDto> {
    return this.agenciesService.getMyAgency(user.id);
  }

  @Patch()
  @ApiOperation({
    summary:
      'Modifier les coordonnées et la présentation de son agence (AGENCY_ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Agence mise à jour avec succès',
    type: AgencyResponseDto,
  })
  async updateMyAgency(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AgencyAdminUpdateAgencyDto,
  ): Promise<AgencyResponseDto> {
    return this.agenciesService.updateMyAgency(user.id, dto);
  }

  @Get('agents')
  @ApiOperation({
    summary: 'Lister les agents rattachés à son agence (AGENCY_ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des agents récupérée avec succès',
    type: PaginatedAgencyAgentsResponseDto,
  })
  async getMyAgents(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationDto,
  ): Promise<PaginatedAgencyAgentsResponseDto> {
    return this.agenciesService.getMyAgents(user.id, query);
  }

  @Post('agents')
  @ApiOperation({
    summary: 'Ajouter un nouvel agent dans son agence (AGENCY_ADMIN)',
  })
  @ApiResponse({
    status: 201,
    description: 'Agent créé et rattaché avec succès',
    type: AgencyAgentItemDto,
  })
  async addAgent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createAgentDto: CreateAgencyAgentDto,
  ): Promise<AgencyAgentItemDto> {
    return this.agenciesService.addAgent(user.id, createAgentDto);
  }

  @Patch('agents/:agentId')
  @ApiOperation({
    summary:
      'Modifier le profil professionnel d’un agent de son agence (AGENCY_ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil agent mis à jour avec succès',
    type: AgencyAgentItemDto,
  })
  async updateAgent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('agentId') agentId: string,
    @Body() updateAgentDto: UpdateAgencyAgentDto,
  ): Promise<AgencyAgentItemDto> {
    return this.agenciesService.updateAgent(user.id, agentId, updateAgentDto);
  }

  @Delete('agents/:agentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirer un agent de son agence (AGENCY_ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent retiré et compte désactivé',
    type: MessageResponseDto,
  })
  async removeAgent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('agentId') agentId: string,
  ): Promise<MessageResponseDto> {
    return this.agenciesService.removeAgent(user.id, agentId);
  }
}
