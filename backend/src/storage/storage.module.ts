import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { S3StorageService } from './s3-storage.service';
import { LocalStorageService } from './local-storage.service';

/**
 * StorageModule — Module d'injection de dépendance pour le stockage de fichiers.
 *
 * Sélection du fournisseur via la variable d'environnement `STORAGE_DRIVER` :
 *   - `s3`    → AWS S3 / MinIO / Cloudflare R2 / DigitalOcean Spaces
 *   - `local` → Stockage local sur disque (développement / tests)
 *
 * Pour ajouter un nouveau fournisseur (Cloudinary, Azure Blob…) :
 *   1. Créer une classe `XyzStorageService extends StorageService`
 *   2. Ajouter le cas dans la factory ci-dessous
 *   3. Zéro modification du code métier (MediaService, etc.)
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: StorageService,
      useFactory: (config: ConfigService) => {
        const driver = config.get<string>('STORAGE_DRIVER', 'local');

        switch (driver) {
          case 's3':
            return new S3StorageService(config);
          case 'local':
          default:
            return new LocalStorageService();
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
