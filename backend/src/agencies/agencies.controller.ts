import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import { Public } from '../auth/decorators/public.decorator';
import { QueryAgenciesDto } from './dto/query-agencies.dto';
import {
  AgencyDetailResponseDto,
  PaginatedAgenciesResponseDto,
} from './dto/agency-response.dto';

@ApiTags('Agencies')
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Consulter l’annuaire public des agences immobilières partenaires',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des agences récupérée avec succès',
    type: PaginatedAgenciesResponseDto,
  })
  async findAll(
    @Query() query: QueryAgenciesDto,
  ): Promise<PaginatedAgenciesResponseDto> {
    return this.agenciesService.findAllPublic(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Consulter la fiche publique détaillée d’une agence immobilière',
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de l’agence récupérés avec succès',
    type: AgencyDetailResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<AgencyDetailResponseDto> {
    return this.agenciesService.findOnePublic(id);
  }
}
