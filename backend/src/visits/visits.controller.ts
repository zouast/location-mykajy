import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';
import { VisitResponseDto, AvailabilityResponseDto } from './dto/visit-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../auth/decorators/public.decorator';
import { VisitStatus } from '@prisma/client';

@ApiTags('Visits')
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Demander un créneau de visite pour un bien' })
  @ApiResponse({ status: 201, type: VisitResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateVisitDto,
  ): Promise<VisitResponseDto> {
    return this.visitsService.create(user.id, createDto);
  }

  @Public()
  @Get('availability')
  @ApiOperation({ summary: 'Obtenir les créneaux de visite libres pour une date et une annonce' })
  @ApiQuery({ name: 'listingId', required: true, type: String })
  @ApiQuery({ name: 'date', required: true, type: String, example: '2026-09-15' })
  @ApiResponse({ status: 200, type: AvailabilityResponseDto })
  async getAvailability(
    @Query('listingId') listingId: string,
    @Query('date') date: string,
  ): Promise<AvailabilityResponseDto> {
    return this.visitsService.getAvailability(listingId, date);
  }

  @ApiBearerAuth()
  @Get('my-visits')
  @ApiOperation({ summary: 'Consulter ses demandes de visites (Espace Client)' })
  @ApiQuery({ name: 'status', required: false, enum: VisitStatus })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiResponse({ status: 200, description: 'Liste des visites du client' })
  async getMyVisits(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: VisitStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.visitsService.getMyClientVisits(user.id, pageNum, limitNum, status);
  }

  @ApiBearerAuth()
  @Get('agenda')
  @ApiOperation({ summary: 'Planning et agenda des visites (Espace Agent / Propriétaire)' })
  @ApiQuery({ name: 'status', required: false, enum: VisitStatus })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Agenda des visites' })
  async getAgenda(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: VisitStatus,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.visitsService.getAgendaVisits(user.id, user.role, status, fromDate, toDate, pageNum, limitNum);
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Consulter le détail d’une visite' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, type: VisitResponseDto })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VisitResponseDto> {
    return this.visitsService.findOne(user.id, id);
  }

  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Confirmer, annuler, rejeter ou clore une visite' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, type: VisitResponseDto })
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateVisitStatusDto,
  ): Promise<VisitResponseDto> {
    return this.visitsService.updateStatus(user.id, id, updateDto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une visite' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  @ApiResponse({ status: 200, schema: { example: { success: true, message: 'Supprimée' } } })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.visitsService.remove(user.id, id);
  }
}
