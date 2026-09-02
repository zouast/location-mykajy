import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Visits')
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Demander une visite (client)' })
  @ApiResponse({ status: 201 })
  async create(@CurrentUser() user: AuthenticatedUser | undefined, @Body() dto: CreateVisitDto) {
    return this.visitsService.create(user?.id || null, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Consulter les visites programmées pour une annonce (public limité)' })
  async findPublic(@Query('listingId') listingId?: string) {
    if (!listingId) return [];
    return this.visitsService.findPublic(listingId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sent')
  @ApiOperation({ summary: 'Mes demandes de visite (Client)' })
  async getMySentVisits(@CurrentUser() user: AuthenticatedUser) {
    return this.visitsService.findMySentVisits(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('received')
  @ApiOperation({ summary: 'Demandes reçues (Agent / Propriétaire)' })
  @ApiQuery({ name: 'status', required: false })
  async getReceivedVisits(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: string) {
    return this.visitsService.findReceivedVisits(user.id, user.role, status as any);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d’une visite (Agent / Propriétaire / Client)' })
  @ApiParam({ name: 'id', description: 'ID de la visite' })
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisitStatusDto,
  ) {
    return this.visitsService.updateStatus(id, user, dto);
  }
}
