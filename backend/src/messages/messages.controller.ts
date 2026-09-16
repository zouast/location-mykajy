import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationQueryDto, MessageQueryDto } from './dto/conversation-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Créer une nouvelle conversation ou envoyer le premier message
   */
  @Post()
  async createConversation(@Request() req: any, @Body() dto: CreateConversationDto) {
    const userId = req.user.id || req.user.userId;
    return this.messagesService.createConversation(userId, dto);
  }

  /**
   * Lister toutes les conversations de l'utilisateur connecté
   */
  @Get()
  async getMyConversations(@Request() req: any, @Query() query: ConversationQueryDto) {
    const userId = req.user.id || req.user.userId;
    return this.messagesService.getUserConversations(userId, query);
  }

  /**
   * Récupérer les détails d'une conversation
   */
  @Get(':id')
  async getConversation(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    return this.messagesService.getConversationById(id, userId);
  }

  /**
   * Récupérer les messages paginés d'une conversation
   */
  @Get(':id/messages')
  async getMessages(
    @Request() req: any,
    @Param('id') id: string,
    @Query() query: MessageQueryDto,
  ) {
    const userId = req.user.id || req.user.userId;
    return this.messagesService.getConversationMessages(id, userId, query);
  }

  /**
   * Envoyer un message dans une conversation
   */
  @Post(':id/messages')
  async sendMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const userId = req.user.id || req.user.userId;
    return this.messagesService.sendMessage(id, userId, dto);
  }

  /**
   * Marquer tous les messages d'une conversation comme lus
   */
  @Patch(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    return this.messagesService.markAsRead(id, userId);
  }

  /**
   * Archiver ou désarchiver une conversation
   */
  @Patch(':id/archive')
  async toggleArchive(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    return this.messagesService.toggleArchive(id, userId);
  }
}
