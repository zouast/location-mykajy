import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { CommissionStatus, Role } from '@prisma/client';
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
import {
  AgentDashboardStatsDto,
  AgentClientDto,
  AgentTransactionDto,
  AgentCommissionDto,
} from './dto/agent-dashboard.dto';

@ApiTags('Agents')
@ApiBearerAuth()
@Roles(Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('dashboard/stats')
  @ApiOperation({
    summary: 'Obtenir les statistiques clés du dashboard (AGENT / AGENCY_ADMIN)',
  })
  @ApiResponse({
    status: 200,
    type: AgentDashboardStatsDto,
  })
  async getDashboardStats(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AgentDashboardStatsDto> {
    return this.agentsService.getDashboardStats(user);
  }

  @Get('clients')
  @ApiOperation({
    summary: 'Consulter l’annuaire CRM des clients et prospects (AGENT / AGENCY_ADMIN)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 15 })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getClients(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 15;
    return this.agentsService.getClients(user, pageNum, limitNum, search);
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Consulter les transactions de vente et location (AGENT / AGENCY_ADMIN)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 15 })
  @ApiQuery({ name: 'type', required: false, enum: ['SALE', 'RENTAL'] })
  async getTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: 'SALE' | 'RENTAL',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 15;
    return this.agentsService.getTransactions(user, pageNum, limitNum, type);
  }

  @Get('commissions')
  @ApiOperation({
    summary: 'Consulter les honoraires & commissions (AGENT: perso / AGENCY_ADMIN: agence)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 15 })
  @ApiQuery({ name: 'status', required: false, enum: CommissionStatus })
  async getCommissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: CommissionStatus,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 15;
    return this.agentsService.getCommissions(user, pageNum, limitNum, status);
  }

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
