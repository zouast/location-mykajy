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
import { SavedSearchesService } from './saved-searches.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';
import { SavedSearchResponseDto } from './dto/saved-search-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Saved Searches')
@ApiBearerAuth()
@Controller('saved-searches')
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sauvegarder une recherche avec filtres personnalisés' })
  @ApiResponse({ status: 201, type: SavedSearchResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDto: CreateSavedSearchDto,
  ): Promise<SavedSearchResponseDto> {
    return this.savedSearchesService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes ses recherches sauvegardées avec nombre de résultats' })
  @ApiResponse({ status: 200, type: [SavedSearchResponseDto] })
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<SavedSearchResponseDto[]> {
    return this.savedSearchesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulter une recherche sauvegardée par ID' })
  @ApiParam({ name: 'id', description: 'ID de la recherche sauvegardée' })
  @ApiResponse({ status: 200, type: SavedSearchResponseDto })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SavedSearchResponseDto> {
    return this.savedSearchesService.findOne(user.id, id);
  }

  @Get(':id/matches')
  @ApiOperation({ summary: 'Exécuter la recherche sauvegardée et obtenir les annonces correspondantes' })
  @ApiParam({ name: 'id', description: 'ID de la recherche sauvegardée' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiResponse({ status: 200, description: 'Annonces correspondantes' })
  async findMatches(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.savedSearchesService.findMatches(user.id, id, pageNum, limitNum);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une recherche sauvegardée (nom, critères, alertes)' })
  @ApiParam({ name: 'id', description: 'ID de la recherche sauvegardée' })
  @ApiResponse({ status: 200, type: SavedSearchResponseDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSavedSearchDto,
  ): Promise<SavedSearchResponseDto> {
    return this.savedSearchesService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une recherche sauvegardée' })
  @ApiParam({ name: 'id', description: 'ID de la recherche sauvegardée' })
  @ApiResponse({ status: 200, schema: { example: { success: true, message: 'Supprimée' } } })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.savedSearchesService.remove(user.id, id);
  }
}
