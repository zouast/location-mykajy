import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** Récupérer les notifications de l'utilisateur connecté */
  @Get()
  async getMyNotifications(@Request() req: any, @Query() query: NotificationQueryDto) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.getUserNotifications(userId, query);
  }

  /** Récupérer le nombre de notifications non lues */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.getUnreadCount(userId);
  }

  /** Marquer toutes les notifications comme lues */
  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.markAllAsRead(userId);
  }

  /** Marquer une notification spécifique comme lue */
  @Patch(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.markAsRead(id, userId);
  }

  /** Supprimer l'historique des notifications lues */
  @Delete('clear-read')
  async clearReadNotifications(@Request() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.clearAll(userId);
  }

  /** Supprimer une notification */
  @Delete(':id')
  async deleteNotification(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.deleteNotification(id, userId);
  }

  /** Envoi de notification (test ou utilisation programmatique) */
  @Post('send')
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationsService.send(dto);
  }
}
