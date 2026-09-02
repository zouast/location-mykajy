import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { Public } from '../auth/decorators/public.decorator';
import { LocationSearchDto } from './dto/location-search.dto';
import { RadiusSearchDto } from './dto/radius-search.dto';
import { BoundingBoxSearchDto } from './dto/bounding-box-search.dto';
import {
  GeoJsonFeatureCollectionDto,
  LocationResponseDto,
  LocationSuggestionDto,
  LocationWithDistanceDto,
} from './dto/location-response.dto';

@ApiTags('Locations')
@Public()
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('search')
  @ApiOperation({
    summary:
      'Recherche textuelle et filtrage administratif des localisations (ville, quartier, commune, région)',
  })
  @ApiResponse({
    status: 200,
    description: 'Localisations correspondant aux critères',
    type: LocationResponseDto,
  })
  search(@Query() dto: LocationSearchDto) {
    return this.locationsService.search(dto);
  }

  @Get('radius')
  @ApiOperation({
    summary:
      "Recherche géospatiale par rayon autour d'une latitude/longitude (formule de Haversine)",
  })
  @ApiResponse({
    status: 200,
    description:
      'Localisations dans le rayon spécifié, triées par distance croissante',
    type: [LocationWithDistanceDto],
  })
  searchByRadius(
    @Query() dto: RadiusSearchDto,
  ): Promise<LocationWithDistanceDto[]> {
    return this.locationsService.searchByRadius(dto);
  }

  @Get('bounding-box')
  @ApiOperation({
    summary:
      'Recherche par fenêtre cartographique (Bounding Box / Viewport) — idéale pour les cartes interactives Leaflet / Google Maps',
  })
  @ApiResponse({
    status: 200,
    description: 'Localisations dans la boîte englobante spécifiée',
    type: [LocationResponseDto],
  })
  searchByBoundingBox(
    @Query() dto: BoundingBoxSearchDto,
  ): Promise<LocationResponseDto[]> {
    return this.locationsService.searchByBoundingBox(dto);
  }

  @Get('geojson')
  @ApiOperation({
    summary:
      'Flux GeoJSON RFC 7946 (FeatureCollection) — compatible OpenStreetMap, Leaflet, Mapbox GL, Google Maps sans dépendance fournisseur',
  })
  @ApiQuery({
    name: 'minLat',
    required: false,
    type: Number,
    description: 'Latitude minimale (filtre optionnel)',
  })
  @ApiQuery({
    name: 'maxLat',
    required: false,
    type: Number,
    description: 'Latitude maximale (filtre optionnel)',
  })
  @ApiQuery({
    name: 'minLng',
    required: false,
    type: Number,
    description: 'Longitude minimale (filtre optionnel)',
  })
  @ApiQuery({
    name: 'maxLng',
    required: false,
    type: Number,
    description: 'Longitude maximale (filtre optionnel)',
  })
  @ApiResponse({
    status: 200,
    description:
      'FeatureCollection GeoJSON prête à être consommée par un moteur cartographique',
    type: GeoJsonFeatureCollectionDto,
  })
  getGeoJson(
    @Query() filter: Partial<BoundingBoxSearchDto>,
  ): Promise<GeoJsonFeatureCollectionDto> {
    return this.locationsService.getGeoJson(filter);
  }

  @Get('suggestions')
  @ApiOperation({
    summary:
      'Autocomplétion — suggestions rapides de villes, quartiers et codes postaux pour les barres de recherche',
  })
  @ApiQuery({
    name: 'query',
    required: true,
    type: String,
    description: 'Terme de recherche (minimum 2 caractères)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre maximum de suggestions (défaut : 10)',
  })
  @ApiResponse({
    status: 200,
    description: "Suggestions de localisation pour l'autocomplétion UI",
    type: [LocationSuggestionDto],
  })
  getSuggestions(
    @Query('query') query: string,
    @Query('limit') limit?: number,
  ): Promise<LocationSuggestionDto[]> {
    return this.locationsService.getSuggestions(query, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: "Récupérer les détails d'une localisation par son identifiant",
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de la localisation',
    type: LocationResponseDto,
  })
  findOne(@Param('id') id: string): Promise<LocationResponseDto> {
    return this.locationsService.findOne(id);
  }
}
