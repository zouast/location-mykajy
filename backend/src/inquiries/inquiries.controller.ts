import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto';
import { InquiryResponseDto } from './dto/inquiry-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../auth/decorators/public.decorator';
import { InquiryStatus } from '@prisma/client';

@ApiTags('Inquiries')
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Envoyer une demande de contact / information sur un bien' })
  @ApiResponse({ status: 201, type: InquiryResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() createDto: CreateInquiryDto,
  ): Promise<InquiryResponseDto> {
    return this.inquiriesService.create(user?.id || null, createDto);
  }

  @ApiBearerAuth()
  @Get('sent')
  @ApiOperation({ summary: 'Consulter l’historique de ses demandes envoyées (Espace Client)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiResponse({ status: 200, description: 'Demandes envoyées récupérées' })
  async getMySentInquiries(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.inquiriesService.findMySentInquiries(user.id, pageNum, limitNum);
  }

  @ApiBearerAuth()
  @Get('received')
  @ApiOperation({ summary: 'Espace de gestion : Consulter les demandes reçues (Agent / Propriétaire)' })
  @ApiQuery({ name: 'status', required: false, enum: InquiryStatus })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 12 })
  @ApiResponse({ status: 200, description: 'Demandes reçues récupérées' })
  async getReceivedInquiries(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: InquiryStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.inquiriesService.findReceivedInquiries(user.id, user.role, status, pageNum, limitNum);
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Consulter le détail d’une demande par ID' })
  @ApiParam({ name: 'id', description: 'ID de la demande' })
  @ApiResponse({ status: 200, type: InquiryResponseDto })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InquiryResponseDto> {
    return this.inquiriesService.findOne(user.id, id);
  }

  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut et/ou répondre à une demande (Agent / Propriétaire)' })
  @ApiParam({ name: 'id', description: 'ID de la demande' })
  @ApiResponse({ status: 200, type: InquiryResponseDto })
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInquiryStatusDto,
  ): Promise<InquiryResponseDto> {
    return this.inquiriesService.updateStatus(user.id, id, updateDto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une demande' })
  @ApiParam({ name: 'id', description: 'ID de la demande' })
  @ApiResponse({ status: 200, schema: { example: { success: true, message: 'Supprimée' } } })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.inquiriesService.remove(user.id, id);
  }
}
