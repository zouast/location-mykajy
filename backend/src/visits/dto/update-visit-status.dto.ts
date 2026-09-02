import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { VisitStatus } from '@prisma/client';

export class UpdateVisitStatusDto {
  @ApiPropertyOptional({ example: VisitStatus.CONFIRMED })
  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @ApiPropertyOptional({ example: 'Client unavailable, reschedule' })
  @IsOptional()
  @IsString()
  reason?: string;
}
