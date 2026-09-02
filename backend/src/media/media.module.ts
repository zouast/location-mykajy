import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { MediaController, MediaItemController } from './media.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    // Utilise le stockage mémoire pour passer le Buffer directement au StorageService
    // Ne jamais stocker les fichiers sur disque ici : le StorageService gère le stockage
    MulterModule.register({ storage: memoryStorage() }),
    StorageModule,
  ],
  controllers: [MediaController, MediaItemController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
