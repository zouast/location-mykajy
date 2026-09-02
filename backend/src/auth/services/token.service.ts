import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  generateOpaqueToken(): string {
    return randomBytes(48).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds =
      this.configService.get<number>('auth.bcryptSaltRounds') ?? 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  signAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  getAccessTokenExpiresIn(): string {
    return this.configService.get<string>('jwt.expiresIn') ?? '15m';
  }

  getRefreshTokenExpiresAt(): Date {
    const expiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const days = parseInt(expiresIn.replace('d', ''), 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (Number.isNaN(days) ? 7 : days));
    return expiresAt;
  }

  getPasswordResetExpiresAt(): Date {
    const hours =
      this.configService.get<number>('auth.passwordResetExpiresInHours') ?? 1;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  getEmailVerificationExpiresAt(): Date {
    const hours =
      this.configService.get<number>('auth.emailVerificationExpiresInHours') ??
      24;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  async createRefreshToken(userId: string): Promise<string> {
    const plainToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(plainToken);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: this.getRefreshTokenExpiresAt(),
      },
    });

    return plainToken;
  }

  async validateRefreshToken(plainToken: string) {
    const tokenHash = this.hashToken(plainToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      !stored.user.isActive ||
      stored.user.deletedAt
    ) {
      return null;
    }

    return stored;
  }

  async revokeRefreshToken(plainToken: string): Promise<void> {
    const tokenHash = this.hashToken(plainToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async rotateRefreshToken(
    plainToken: string,
  ): Promise<{ user: User; refreshToken: string } | null> {
    const stored = await this.validateRefreshToken(plainToken);
    if (!stored) {
      return null;
    }

    await this.revokeRefreshToken(plainToken);
    const newRefreshToken = await this.createRefreshToken(stored.userId);

    return { user: stored.user, refreshToken: newRefreshToken };
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    const plainToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(plainToken);

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: this.getPasswordResetExpiresAt(),
      },
    });

    return plainToken;
  }

  async validatePasswordResetToken(plainToken: string) {
    const tokenHash = this.hashToken(plainToken);
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !stored ||
      stored.usedAt ||
      stored.expiresAt < new Date() ||
      !stored.user.isActive ||
      stored.user.deletedAt
    ) {
      return null;
    }

    return stored;
  }

  async markPasswordResetTokenUsed(plainToken: string): Promise<void> {
    const tokenHash = this.hashToken(plainToken);
    await this.prisma.passwordResetToken.updateMany({
      where: { tokenHash },
      data: { usedAt: new Date() },
    });
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    const plainToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(plainToken);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: this.getEmailVerificationExpiresAt(),
      },
    });

    return plainToken;
  }

  async validateEmailVerificationToken(plainToken: string) {
    const tokenHash = this.hashToken(plainToken);
    const stored = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !stored ||
      stored.usedAt ||
      stored.expiresAt < new Date() ||
      stored.user.deletedAt
    ) {
      return null;
    }

    return stored;
  }

  async markEmailVerificationTokenUsed(plainToken: string): Promise<void> {
    const tokenHash = this.hashToken(plainToken);
    await this.prisma.emailVerificationToken.updateMany({
      where: { tokenHash },
      data: { usedAt: new Date() },
    });
  }
}
