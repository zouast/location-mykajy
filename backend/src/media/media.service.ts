import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, Role } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import type { UploadMediaDto, ReorderMediaDto } from './dto/upload-media.dto';
import type { MediaResponseDto } from './dto/media-response.dto';

const ALLOWED_MIME_TYPES: Record<MediaType, string[]> = {
  [MediaType.IMAGE]: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  [MediaType.VIDEO]: ['video/mp4', 'video/quicktime', 'video/webm'],
  [MediaType.VIRTUAL_TOUR]: ['video/mp4', 'video/webm'],
  [MediaType.FLOOR_PLAN]: ['image/jpeg', 'image/png', 'application/pdf'],
  [MediaType.DOCUMENT]: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

const FOLDER_BY_TYPE: Record<MediaType, string> = {
  [MediaType.IMAGE]: 'properties/photos',
  [MediaType.VIDEO]: 'properties/videos',
  [MediaType.VIRTUAL_TOUR]: 'properties/virtual-tours',
  [MediaType.FLOOR_PLAN]: 'properties/floor-plans',
  [MediaType.DOCUMENT]: 'properties/documents',
};

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // Vérification de l'autorisation sur le bien
  // ─────────────────────────────────────────────────────────────────────────────

  private async checkPropertyAccess(
    propertyId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true, agentId: true, agencyId: true },
    });

    if (!property) {
      throw new NotFoundException(
        `Bien immobilier introuvable (id: ${propertyId})`,
      );
    }

    if (user.role === Role.ADMIN) return;

    if (user.role === Role.OWNER) {
      const ownerProfile = await this.prisma.owner.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!ownerProfile || property.ownerId !== ownerProfile.id) {
        throw new ForbiddenException(
          'Vous ne pouvez gérer que les médias de vos propres biens.',
        );
      }
      return;
    }

    if (user.role === Role.AGENT) {
      const agentProfile = await this.prisma.agent.findUnique({
        where: { userId: user.id },
        select: { id: true, agencyId: true },
      });
      if (
        !agentProfile ||
        (property.agentId !== agentProfile.id &&
          property.agencyId !== agentProfile.agencyId)
      ) {
        throw new ForbiddenException(
          'Vous ne pouvez gérer que les médias des biens qui vous sont affectés.',
        );
      }
      return;
    }

    if (user.role === Role.AGENCY_ADMIN) {
      const agentProfile = await this.prisma.agent.findUnique({
        where: { userId: user.id },
        select: { agencyId: true },
      });
      if (!agentProfile || property.agencyId !== agentProfile.agencyId) {
        throw new ForbiddenException(
          'Vous ne pouvez gérer que les médias des biens de votre agence.',
        );
      }
      return;
    }

    throw new ForbiddenException('Accès non autorisé.');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Upload d'un fichier média
  // ─────────────────────────────────────────────────────────────────────────────

  async upload(
    user: AuthenticatedUser,
    propertyId: string,
    file: Express.Multer.File,
    dto: UploadMediaDto,
  ): Promise<MediaResponseDto> {
    await this.checkPropertyAccess(propertyId, user);

    // Validation du type MIME
    const allowedMimes = ALLOWED_MIME_TYPES[dto.type];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé pour un média ${dto.type}. ` +
          `Types acceptés : ${allowedMimes.join(', ')}`,
      );
    }

    // Validation de la taille
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `Fichier trop volumineux (max : ${MAX_FILE_SIZE_BYTES / 1024 / 1024} Mo)`,
      );
    }

    // Upload vers le fournisseur de stockage (S3, local…)
    const { key, url } = await this.storage.upload(file.buffer, {
      fileName: file.originalname,
      mimeType: file.mimetype,
      folder: FOLDER_BY_TYPE[dto.type],
      isPublic: true,
    });

    this.logger.log(
      `Media uploaded: property=${propertyId}, key=${key}, type=${dto.type}`,
    );

    // Persistance en base (URL uniquement, pas de binaire)
    const media = await this.prisma.propertyMedia.create({
      data: {
        propertyId,
        url,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        isPrimary: false,
      },
    });

    return this.toResponseDto(media);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Récupération des médias d'un bien
  // ─────────────────────────────────────────────────────────────────────────────

  async findAllByProperty(propertyId: string): Promise<MediaResponseDto[]> {
    // Vérifie que le bien existe
    const exists = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(
        `Bien immobilier introuvable (id: ${propertyId})`,
      );
    }

    const medias = await this.prisma.propertyMedia.findMany({
      where: { propertyId },
      orderBy: [
        { isPrimary: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return medias.map(this.toResponseDto);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Définir la photo principale
  // ─────────────────────────────────────────────────────────────────────────────

  async setPrimary(
    user: AuthenticatedUser,
    mediaId: string,
  ): Promise<MediaResponseDto> {
    const media = await this.prisma.propertyMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media) {
      throw new NotFoundException(`Média introuvable (id: ${mediaId})`);
    }

    if (media.type !== MediaType.IMAGE) {
      throw new BadRequestException(
        'Seules les images peuvent être définies comme photo principale.',
      );
    }

    await this.checkPropertyAccess(media.propertyId, user);

    // Transaction atomique : reset de l'ancien primary + set du nouveau
    const [, updated] = await this.prisma.$transaction([
      this.prisma.propertyMedia.updateMany({
        where: { propertyId: media.propertyId, isPrimary: true },
        data: { isPrimary: false },
      }),
      this.prisma.propertyMedia.update({
        where: { id: mediaId },
        data: { isPrimary: true },
      }),
    ]);

    this.logger.log(
      `Primary media set: property=${media.propertyId}, media=${mediaId}`,
    );

    return this.toResponseDto(updated);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Réorganiser l'ordre d'affichage
  // ─────────────────────────────────────────────────────────────────────────────

  async reorder(
    user: AuthenticatedUser,
    propertyId: string,
    dto: ReorderMediaDto,
  ): Promise<MediaResponseDto[]> {
    await this.checkPropertyAccess(propertyId, user);

    // Validation : tous les IDs appartiennent bien au bien
    const existing = await this.prisma.propertyMedia.findMany({
      where: { propertyId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((m) => m.id));
    const invalid = dto.orderedIds.filter((id) => !existingIds.has(id));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Médias non trouvés pour ce bien : ${invalid.join(', ')}`,
      );
    }

    // Mise à jour atomique de tous les sortOrder
    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.propertyMedia.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.findAllByProperty(propertyId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Suppression d'un média
  // ─────────────────────────────────────────────────────────────────────────────

  async remove(
    user: AuthenticatedUser,
    mediaId: string,
  ): Promise<{ message: string }> {
    const media = await this.prisma.propertyMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media) {
      throw new NotFoundException(`Média introuvable (id: ${mediaId})`);
    }

    await this.checkPropertyAccess(media.propertyId, user);

    // Extraction de la clé depuis l'URL pour supprimer le fichier distant
    // La clé est le chemin relatif au bucket (ex: properties/photos/1234-photo.jpg)
    const key = this.extractKeyFromUrl(media.url);

    // Suppression du fichier dans le fournisseur de stockage
    if (key) {
      await this.storage.delete(key);
    }

    // Suppression de l'enregistrement en base
    await this.prisma.propertyMedia.delete({ where: { id: mediaId } });

    this.logger.log(`Media deleted: id=${mediaId}, key=${key}`);

    return { message: 'Média supprimé avec succès.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utilitaires
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Extrait la clé de stockage depuis une URL publique.
   * Fonctionne avec S3, CDN, ou stockage local.
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      const segments = new URL(url).pathname;
      // Retire le slash initial et retourne le chemin
      return segments.startsWith('/') ? segments.slice(1) : segments;
    } catch {
      return null;
    }
  }

  private toResponseDto(media: any): MediaResponseDto {
    return {
      id: media.id,
      propertyId: media.propertyId,
      url: media.url,
      type: media.type,
      title: media.title ?? undefined,
      description: media.description ?? undefined,
      isPrimary: media.isPrimary,
      sortOrder: media.sortOrder,
      createdAt: media.createdAt,
    };
  }
}
