import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AgentsService } from './agents.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import {
  QueryAgentListingsDto,
  QueryAgentPropertiesDto,
} from './dto/query-agent-items.dto';
import {
  AgentDetailDto,
  PaginatedAgentListingsResponseDto,
  PaginatedAgentPropertiesResponseDto,
} from './dto/agent-response.dto';
import { AgencyResponseDto } from '../agencies/dto/agency-response.dto';

@ApiTags('Agents')
@ApiBearerAuth()
@Roles(Role.AGENT, Role.AGENCY_ADMIN)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('me')
  @ApiOperation({
    summary:
      'Consulter son profil agent immobilier et ses statistiques (AGENT)',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil agent récupéré avec succès',
    type: AgentDetailDto,
  })
  async getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AgentDetailDto> {
    return this.agentsService.getMyProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary:
      'Modifier ses informations d’agent (biographie, spécialités, disponibilité) (AGENT)',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil agent mis à jour avec succès',
    type: AgentDetailDto,
  })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAgentProfileDto,
  ): Promise<AgentDetailDto> {
    return this.agentsService.updateMyProfile(user.id, dto);
  }

  @Get('me/agency')
  @ApiOperation({
    summary: 'Consulter les informations de son agence de rattachement (AGENT)',
  })
  @ApiResponse({
    status: 200,
    description: 'Informations de l’agence récupérées avec succès',
    type: AgencyResponseDto,
  })
  async getMyAgency(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AgencyResponseDto> {
    return this.agentsService.getMyAgency(user.id);
  }

  @Get('me/properties')
  @ApiOperation({
    summary:
      'Consulter la liste de ses biens assignés avec pagination et filtres (AGENT)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des biens récupérée avec succès',
    type: PaginatedAgentPropertiesResponseDto,
  })
  async getMyProperties(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryAgentPropertiesDto,
  ): Promise<PaginatedAgentPropertiesResponseDto> {
    return this.agentsService.getMyProperties(user.id, query);
  }

  @Get('me/listings')
  @ApiOperation({
    summary:
      'Consulter la liste de ses annonces avec pagination et filtres (AGENT)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des annonces récupérée avec succès',
    type: PaginatedAgentListingsResponseDto,
  })
  async getMyListings(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryAgentListingsDto,
  ): Promise<PaginatedAgentListingsResponseDto> {
    return this.agentsService.getMyListings(user.id, query);
  }
}
