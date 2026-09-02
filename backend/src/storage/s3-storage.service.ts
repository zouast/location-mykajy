import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  StorageService,
  StorageUploadOptions,
  StorageUploadResult,
} from './storage.service';

/**
 * Implémentation S3-compatible du StorageService.
 *
 * Compatible avec :
 *  - AWS S3
 *  - MinIO (auto-hébergé)
 *  - Cloudflare R2
 *  - DigitalOcean Spaces
 *  - Tout autre service compatible avec l'API S3
 *
 * Configuration via variables d'environnement :
 *   STORAGE_DRIVER=s3
 *   AWS_REGION=eu-west-3
 *   AWS_ACCESS_KEY_ID=...
 *   AWS_SECRET_ACCESS_KEY=...
 *   AWS_S3_BUCKET=immo-mykajy-media
 *   AWS_S3_ENDPOINT=https://... (optionnel pour MinIO/R2/Spaces)
 *   AWS_S3_PUBLIC_URL=https://cdn.example.com (optionnel, CDN ou URL publique)
 */
@Injectable()
export class S3StorageService extends StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly logger = new Logger(S3StorageService.name);

  constructor(private readonly config: ConfigService) {
    super();

    const region = config.get<string>('AWS_REGION', 'eu-west-3');
    const endpoint = config.get<string>('AWS_S3_ENDPOINT');
    this.bucket = config.getOrThrow<string>('AWS_S3_BUCKET');
    this.publicUrl =
      config.get<string>('AWS_S3_PUBLIC_URL') ??
      `https://${this.bucket}.s3.${region}.amazonaws.com`;

    this.client = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      credentials: {
        accessKeyId: config.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async upload(
    file: Buffer,
    options: StorageUploadOptions,
  ): Promise<StorageUploadResult> {
    const folder = options.folder ?? 'uploads';
    const key = `${folder}/${Date.now()}-${options.fileName}`;

    this.logger.log(`Uploading file to S3: ${key}`);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: options.mimeType,
        ...(options.isPublic !== false ? { ACL: 'public-read' } : {}),
      }),
    );

    return {
      key,
      url: this.getUrl(key),
      size: file.byteLength,
    };
  }

  async delete(key: string): Promise<void> {
    this.logger.log(`Deleting file from S3: ${key}`);

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
