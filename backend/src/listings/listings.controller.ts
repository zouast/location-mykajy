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
import { ListingsService } from './listings.service';
import { ListingSearchService } from './listing-search.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { ListingActionDto } from './dto/listing-action.dto';
import {
  ListingResponseDto,
  PaginatedListingsResponseDto,
} from './dto/listing-response.dto';
import { ListingSearchResponseDto } from './dto/listing-search-response.dto';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly listingSearchService: ListingSearchService,
  ) {}

  // ── Consultation publique ────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Moteur de recherche avancé des annonces immobilières — filtres multi-critères, géolocalisation par rayon, tri par prix/date/pertinence, réponse enrichie avec photo principale et localisation',
    description:
      'Endpoint principal de recherche. Tous les paramètres sont optionnels. ' +
      'Supporte : transactionType, propertyType, city, neighborhood, commune, ' +
      'minPrice/maxPrice, minArea/maxArea, minBedrooms, minRooms, minBathrooms, ' +
      'hasParking, hasPool, hasGarden, isFurnished, hasElevator, hasGarage, hasBalcony, ' +
      'lat/lng/radiusKm (recherche GPS par rayon), q (texte libre), ' +
      'sortBy (price|date|area|relevance), sortOrder (asc|desc), page, limit.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Liste paginée des annonces avec photo principale, localisation formatée et prix',
    type: ListingSearchResponseDto,
  })
  search(@Query() dto: SearchListingsDto): Promise<ListingSearchResponseDto> {
    return this.listingSearchService.search(dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary:
      "Consulter le détail d'une annonce immobilière (incrémente le compteur de vues)",
  })
  @ApiResponse({
    status: 200,
    description: "Détails de l'annonce",
    type: ListingResponseDto,
  })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<ListingResponseDto> {
    return this.listingsService.findOne(id, user);
  }

  // ── CRUD (créer / modifier) ──────────────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle annonce immobilière — toujours créée en DRAFT',
  })
  @ApiResponse({
    status: 201,
    description: 'Annonce créée en DRAFT avec succès',
    type: ListingResponseDto,
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateListingDto,
  ): Promise<ListingResponseDto> {
    return this.listingsService.create(user, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Patch(':id')
  @ApiOperation({
    summary: 'Modifier une annonce (uniquement en DRAFT ou PAUSED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Annonce mise à jour avec succès',
    type: ListingResponseDto,
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ): Promise<ListingResponseDto> {
    return this.listingsService.update(user, id, dto);
  }

  // ── Actions Workflow ─────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Patch(':id/submit')
  @ApiOperation({
    summary:
      'Soumettre une annonce à la validation admin (DRAFT → PENDING_REVIEW)',
  })
  @ApiResponse({
    status: 200,
    description: 'Annonce soumise pour validation',
    type: ListingResponseDto,
  })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ListingResponseDto> {
    return this.listingsService.submit(user, id);
  }

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Patch(':id/pause')
  @ApiOperation({
    summary: 'Dépublier temporairement une annonce active (ACTIVE → PAUSED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Annonce mise en pause',
    type: ListingResponseDto,
  })
  pause(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ListingResponseDto> {
    return this.listingsService.pause(user, id);
  }

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Patch(':id/resume')
  @ApiOperation({
    summary: 'Republier une annonce mise en pause (PAUSED → ACTIVE)',
  })
  @ApiResponse({
    status: 200,
    description: 'Annonce republiée avec succès',
    type: ListingResponseDto,
  })
  resume(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ListingResponseDto> {
    return this.listingsService.resume(user, id);
  }

  // ── Actions ADMIN ────────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id/publish')
  @ApiOperation({
    summary: '[ADMIN] Valider et publier une annonce (PENDING_REVIEW → ACTIVE)',
  })
  @ApiResponse({
    status: 200,
    description: 'Annonce validée et publiée',
    type: ListingResponseDto,
  })
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ListingResponseDto> {
    return this.listingsService.publish(user, id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id/reject')
  @ApiOperation({
    summary:
      '[ADMIN] Rejeter une annonce en attente (PENDING_REVIEW → CANCELLED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Annonce rejetée',
    type: ListingResponseDto,
  })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ListingActionDto,
  ): Promise<ListingResponseDto> {
    return this.listingsService.reject(user, id, dto.reason);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id/complete')
  @ApiOperation({
    summary: '[ADMIN] Marquer une annonce comme finalisée (ACTIVE → COMPLETED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Annonce marquée comme finalisée',
    type: ListingResponseDto,
  })
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ListingResponseDto> {
    return this.listingsService.complete(user, id);
  }

  // ── Archivage ────────────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archiver et supprimer une annonce (soft-delete)',
  })
  @ApiResponse({
    status: 200,
    description: 'Annonce archivée avec succès',
    schema: { example: { message: 'Annonce archivée avec succès.' } },
  })
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.listingsService.archive(user, id);
  }
}
