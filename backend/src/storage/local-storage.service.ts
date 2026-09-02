import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import {
  StorageService,
  StorageUploadOptions,
  StorageUploadResult,
} from './storage.service';

/**
 * Implémentation de stockage local sur disque.
 *
 * Usage : développement local, tests d'intégration, ou environnements sans accès cloud.
 * Pour passer en production, remplacer par S3StorageService via la configuration.
 *
 * Configuration :
 *   STORAGE_DRIVER=local
 *   LOCAL_STORAGE_PATH=./uploads
 *   LOCAL_STORAGE_BASE_URL=http://localhost:3000/uploads
 */
@Injectable()
export class LocalStorageService extends StorageService {
  private readonly storagePath: string;
  private readonly baseUrl: string;
  private readonly logger = new Logger(LocalStorageService.name);

  constructor() {
    super();
    this.storagePath = process.env['LOCAL_STORAGE_PATH'] ?? './uploads';
    this.baseUrl =
      process.env['LOCAL_STORAGE_BASE_URL'] ?? 'http://localhost:3000/uploads';

    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async upload(
    file: Buffer,
    options: StorageUploadOptions,
  ): Promise<StorageUploadResult> {
    const folder = options.folder ?? 'uploads';
    const subDir = join(this.storagePath, folder);

    if (!existsSync(subDir)) {
      mkdirSync(subDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${options.fileName}`;
    const key = `${folder}/${fileName}`;
    const filePath = join(this.storagePath, key);

    this.logger.log(`Saving file locally: ${filePath}`);
    writeFileSync(filePath, file);

    return {
      key,
      url: this.getUrl(key),
      size: file.byteLength,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.storagePath, key);
    this.logger.log(`Deleting local file: ${filePath}`);

    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}
