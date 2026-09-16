import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { TokenService } from './services/token.service';
import { AuthMailService } from './services/auth-mail.service';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';
import { omitPassword } from './utils/omit-password.util';
import {
  AuthResponseDto,
  MessageResponseDto,
  RegisterResponseDto,
} from './dto/auth-response.dto';

const ALLOWED_REGISTER_ROLES: Role[] = [Role.LOCATAIRE, Role.PROPRIETAIRE];

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly authMailService: AuthMailService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Inscription publique — uniquement LOCATAIRE ou PROPRIETAIRE.
   * Exécutée dans une transaction Prisma atomique.
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    // 1. Sécurité serveur : rejeter ADMIN et tout rôle non autorisé
    if (!ALLOWED_REGISTER_ROLES.includes(registerDto.role)) {
      throw new ForbiddenException(
        `Le rôle sélectionné n'est pas autorisé pour l'inscription publique. Seuls LOCATAIRE et PROPRIETAIRE sont acceptés.`,
      );
    }

    // 2. Normalisation des données
    const email = registerDto.email.trim().toLowerCase();
    const firstName = registerDto.firstName.trim();
    const lastName = registerDto.lastName.trim();

    // 3. Vérification unicité email
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) {
      throw new ConflictException(
        'Un compte avec cette adresse email existe déjà.',
      );
    }

    // 4. Hash du mot de passe
    const passwordHash = await this.tokenService.hashPassword(
      registerDto.password,
    );

    // 5. Transaction atomique : créer l'utilisateur + le token de vérification
    const { user, plainToken } = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          phone: registerDto.phone?.trim() ?? null,
          role: registerDto.role,
          status: UserStatus.PENDING,
          emailVerified: false,
          phoneVerified: false,
          isActive: true,
          isVerified: false,
        },
      });

      // Générer un token aléatoire sécurisé (32 octets = 64 chars hex)
      const rawToken = this.tokenService.generateOpaqueToken();
      const tokenHash = this.tokenService.hashToken(rawToken);
      const expiresAt = this.tokenService.getEmailVerificationExpiresAt();

      await tx.emailVerificationToken.create({
        data: {
          userId: newUser.id,
          tokenHash,
          expiresAt,
        },
      });

      return { user: newUser, plainToken: rawToken };
    });

    // 6. Envoi de l'email de vérification (hors transaction pour ne pas bloquer si l'SMTP échoue)
    try {
      await this.authMailService.sendVerificationEmail(user.email, plainToken);
    } catch {
      // Log silencieux — le token est en base, l'utilisateur peut renvoyer via resend-verification
    }

    // 7. Retour standardisé sans données sensibles
    return {
      success: true,
      message:
        'Votre compte a été créé avec succès. Veuillez vérifier votre adresse email pour activer votre compte.',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        },
      },
    };
  }

  /**
   * Connexion — bloquée si l'email n'est pas encore vérifié.
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findOneByEmail(loginDto.email, true);

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Ce compte a été supprimé.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Ce compte est inactif.');
    }

    const isMatch = await this.tokenService.comparePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    // Bloquer la connexion si l'email n'est pas vérifié
    if (!user.emailVerified || user.status === UserStatus.PENDING) {
      throw new UnauthorizedException(
        `Veuillez vérifier votre adresse email avant de vous connecter. Consultez votre boîte de réception ou renvoyez l'email de vérification.`,
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Ce compte est suspendu.');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('Ce compte a été bloqué.');
    }

    await this.usersService.updateLastLogin(user.id);

    return this.buildAuthResponse(user);
  }

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    const rotated = await this.tokenService.rotateRefreshToken(
      refreshTokenDto.refreshToken,
    );

    if (!rotated) {
      throw new UnauthorizedException('Refresh token invalide ou expiré.');
    }

    const { user, refreshToken } = rotated;

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Ce compte est inactif.');
    }

    return {
      user: omitPassword(user),
      tokens: {
        accessToken: this.tokenService.signAccessToken(user),
        refreshToken,
        expiresIn: this.tokenService.getAccessTokenExpiresIn(),
      },
    };
  }

  async logout(
    user: AuthenticatedUser,
    logoutDto: LogoutDto,
  ): Promise<MessageResponseDto> {
    if (logoutDto.refreshToken) {
      await this.tokenService.revokeRefreshToken(logoutDto.refreshToken);
    } else {
      await this.tokenService.revokeAllRefreshTokens(user.id);
    }

    return { message: 'Déconnexion réussie.', success: true };
  }

  async changePassword(
    user: AuthenticatedUser,
    changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent du mot de passe actuel.',
      );
    }

    const dbUser = await this.usersService.findOneByIdWithPassword(user.id);

    if (!dbUser?.passwordHash) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    const isMatch = await this.tokenService.comparePassword(
      changePasswordDto.currentPassword,
      dbUser.passwordHash,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Le mot de passe actuel est incorrect.');
    }

    const hashedPassword = await this.tokenService.hashPassword(
      changePasswordDto.newPassword,
    );

    await this.usersService.updatePassword(user.id, hashedPassword);
    await this.tokenService.revokeAllRefreshTokens(user.id);

    return { message: 'Mot de passe modifié avec succès.', success: true };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    const user = await this.usersService.findOneByEmail(
      forgotPasswordDto.email,
    );

    if (user && user.isActive && !user.deletedAt) {
      const resetToken = await this.tokenService.createPasswordResetToken(
        user.id,
      );
      await this.authMailService.sendPasswordResetEmail(user.email, resetToken);
    }

    return {
      message:
        'Si un compte existe avec cette adresse email, un lien de réinitialisation a été envoyé.',
      success: true,
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    const stored = await this.tokenService.validatePasswordResetToken(
      resetPasswordDto.token,
    );

    if (!stored) {
      throw new BadRequestException('Token de réinitialisation invalide ou expiré.');
    }

    const hashedPassword = await this.tokenService.hashPassword(
      resetPasswordDto.newPassword,
    );

    await this.usersService.updatePassword(stored.userId, hashedPassword);
    await this.tokenService.markPasswordResetTokenUsed(resetPasswordDto.token);
    await this.tokenService.revokeAllRefreshTokens(stored.userId);

    return { message: 'Mot de passe réinitialisé avec succès.', success: true };
  }

  /**
   * Vérification d'email — transaction atomique pour activer le compte.
   */
  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<MessageResponseDto> {
    const tokenHash = this.tokenService.hashToken(verifyEmailDto.token);

    return this.prisma.$transaction(async (tx) => {
      const stored = await tx.emailVerificationToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!stored || stored.usedAt || stored.expiresAt < new Date() || stored.user.deletedAt) {
        throw new BadRequestException('Token de vérification invalide ou expiré.');
      }

      if (stored.user.emailVerified) {
        return {
          message: 'Votre adresse email est déjà vérifiée.',
          success: true,
        };
      }

      // Activer le compte
      await tx.user.update({
        where: { id: stored.userId },
        data: {
          emailVerified: true,
          isVerified: true,
          status: UserStatus.ACTIVE,
        },
      });

      // Invalider tous les tokens non utilisés pour cet utilisateur
      await tx.emailVerificationToken.updateMany({
        where: { userId: stored.userId, usedAt: null },
        data: { usedAt: new Date() },
      });

      return {
        message:
          'Adresse email vérifiée avec succès. Vous pouvez maintenant vous connecter.',
        success: true,
      };
    });
  }

  async resendVerificationEmail(
    user: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    if (user.emailVerified) {
      throw new BadRequestException('Votre adresse email est déjà vérifiée.');
    }

    const verificationToken =
      await this.tokenService.createEmailVerificationToken(user.id);
    await this.authMailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return {
      message: 'Email de vérification renvoyé.',
      success: true,
    };
  }

  private async buildAuthResponse(
    user: Parameters<typeof omitPassword>[0],
  ): Promise<AuthResponseDto> {
    const refreshToken = await this.tokenService.createRefreshToken(user.id);

    return {
      user: omitPassword(user),
      tokens: {
        accessToken: this.tokenService.signAccessToken(user),
        refreshToken,
        expiresIn: this.tokenService.getAccessTokenExpiresIn(),
      },
    };
  }
}
