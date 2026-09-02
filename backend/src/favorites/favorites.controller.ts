import {
  Controller,
  Get,
  Post,
  Delete,
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
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { FavoriteResponseDto, FavoriteIdsResponseDto } from './dto/favorite-response.dto';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Consulter la liste de ses favoris avec détails complets' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiResponse({ status: 200, description: 'Liste des favoris récupérée' })
  async getMyFavorites(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.favoritesService.getUserFavorites(user.id, pageNum, limitNum);
  }

  @Get('ids')
  @ApiOperation({ summary: 'Récupérer la liste des IDs des annonces favorites' })
  @ApiResponse({ status: 200, type: FavoriteIdsResponseDto })
  async getMyFavoriteIds(@CurrentUser() user: AuthenticatedUser): Promise<FavoriteIdsResponseDto> {
    const listingIds = await this.favoritesService.getUserFavoriteListingIds(user.id);
    return { listingIds };
  }

  @Get('check/:listingId')
  @ApiOperation({ summary: 'Vérifier si une annonce est dans ses favoris' })
  @ApiParam({ name: 'listingId', description: 'ID de l’annonce' })
  @ApiResponse({ status: 200, schema: { example: { isFavorite: true } } })
  async checkFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ): Promise<{ isFavorite: boolean }> {
    const isFavorite = await this.favoritesService.isFavorite(user.id, listingId);
    return { isFavorite };
  }

  @Post(':listingId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ajouter une annonce aux favoris' })
  @ApiParam({ name: 'listingId', description: 'ID de l’annonce' })
  @ApiResponse({ status: 201, type: FavoriteResponseDto })
  async addFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ): Promise<FavoriteResponseDto> {
    return this.favoritesService.addFavorite(user.id, listingId);
  }

  @Delete(':listingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirer une annonce de ses favoris' })
  @ApiParam({ name: 'listingId', description: 'ID de l’annonce' })
  @ApiResponse({ status: 200, schema: { example: { success: true, message: 'Retirée' } } })
  async removeFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.favoritesService.removeFavorite(user.id, listingId);
  }
}
