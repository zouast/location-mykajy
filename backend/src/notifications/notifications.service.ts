import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationsService {
	constructor(private readonly prisma: PrismaService) {}

	async createNotification(userId: string, type: any, title: string, content: string, metadata?: any) {
		return this.prisma.notification.create({
			data: {
				userId,
				type,
				title,
				content,
				metadata,
			},
		});
	}
}
