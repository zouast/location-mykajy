import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OwnersService } from './owners.service';
import { OwnerDashboardStatsDto } from './dto/owner-dashboard-stats.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Owners')
@ApiBearerAuth()
@Controller('owners')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Obtenir les statistiques clés et KPI du dashboard propriétaire' })
  @ApiResponse({ status: 200, type: OwnerDashboardStatsDto })
  async getDashboardStats(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OwnerDashboardStatsDto> {
    return this.ownersService.getDashboardStats(user.id);
  }

  @Get('properties')
  @ApiOperation({ summary: 'Lister les biens immobiliers du propriétaire' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiResponse({ status: 200, description: 'Patrimoine du propriétaire' })
  async getMyProperties(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.ownersService.getMyProperties(user.id, pageNum, limitNum);
  }

  @Get('listings')
  @ApiOperation({ summary: 'Lister les annonces publiées par le propriétaire' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiResponse({ status: 200, description: 'Annonces du propriétaire' })
  async getMyListings(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.ownersService.getMyListings(user.id, pageNum, limitNum);
  }
}
