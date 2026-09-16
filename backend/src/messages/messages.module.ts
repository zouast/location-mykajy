import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConversationsWsService } from './conversations-ws.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [MessagesController],
  providers: [MessagesService, ConversationsWsService],
  exports: [MessagesService, ConversationsWsService],
})
export class MessagesModule {}
