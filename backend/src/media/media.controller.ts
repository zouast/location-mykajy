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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MediaService } from './media.service';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UploadMediaDto, ReorderMediaDto } from './dto/upload-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';

@ApiTags('Property Media')
@Controller('properties/:propertyId/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // ── Upload d'un fichier média ────────────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier binaire à uploader',
        },
        type: {
          type: 'string',
          enum: ['IMAGE', 'VIDEO', 'VIRTUAL_TOUR', 'FLOOR_PLAN', 'DOCUMENT'],
        },
        title: { type: 'string', description: 'Titre du média (optionnel)' },
        description: {
          type: 'string',
          description: 'Description du média (optionnel)',
        },
        sortOrder: {
          type: 'number',
          description: "Ordre d'affichage (optionnel)",
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiOperation({
    summary:
      'Uploader un fichier média (photo, vidéo, plan, document PDF) pour un bien immobilier',
  })
  @ApiResponse({
    status: 201,
    description: 'Média uploadé et enregistré avec succès',
    type: MediaResponseDto,
  })
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
  ): Promise<MediaResponseDto> {
    return this.mediaService.upload(user, propertyId, file, dto);
  }

  // ── Récupération des médias ──────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({
    summary:
      "Récupérer tous les médias d'un bien immobilier (triés par ordre d'affichage)",
  })
  @ApiResponse({
    status: 200,
    description: 'Médias récupérés avec succès',
    type: [MediaResponseDto],
  })
  findAll(
    @Param('propertyId') propertyId: string,
  ): Promise<MediaResponseDto[]> {
    return this.mediaService.findAllByProperty(propertyId);
  }

  // ── Réorganiser l'ordre d'affichage ─────────────────────────────────────────

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Patch('reorder')
  @ApiOperation({
    summary:
      "Réorganiser l'ordre d'affichage des médias en fournissant un tableau d'identifiants ordonné",
  })
  @ApiResponse({
    status: 200,
    description: "Ordre d'affichage mis à jour avec succès",
    type: [MediaResponseDto],
  })
  reorder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: ReorderMediaDto,
  ): Promise<MediaResponseDto[]> {
    return this.mediaService.reorder(user, propertyId, dto);
  }
}

// ── Endpoints sans context de bien (sur /media/:mediaId) ──────────────────────

@ApiTags('Property Media')
@Controller('media')
export class MediaItemController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Patch(':mediaId/primary')
  @ApiOperation({
    summary:
      'Définir un média comme photo principale du bien (réinitialise automatiquement les autres)',
  })
  @ApiResponse({
    status: 200,
    description: 'Photo principale mise à jour avec succès',
    type: MediaResponseDto,
  })
  setPrimary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('mediaId') mediaId: string,
  ): Promise<MediaResponseDto> {
    return this.mediaService.setPrimary(user, mediaId);
  }

  @ApiBearerAuth()
  @Roles(Role.OWNER, Role.AGENT, Role.AGENCY_ADMIN, Role.ADMIN)
  @Delete(':mediaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Supprimer un média (suppression en base ET dans le fournisseur de stockage)',
  })
  @ApiResponse({
    status: 200,
    description: 'Média supprimé avec succès',
    schema: { example: { message: 'Média supprimé avec succès.' } },
  })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('mediaId') mediaId: string,
  ): Promise<{ message: string }> {
    return this.mediaService.remove(user, mediaId);
  }
}
