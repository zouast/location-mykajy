import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
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
import { AuthResponseDto, MessageResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly authMailService: AuthMailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.usersService.findOneByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const hashedPassword = await this.tokenService.hashPassword(
      registerDto.password,
    );

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });

    const verificationToken =
      await this.tokenService.createEmailVerificationToken(user.id);
    await this.authMailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findOneByEmail(loginDto.email, true);

    if (!user?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isMatch = await this.tokenService.comparePassword(
      loginDto.password,
      user.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
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
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { user, refreshToken } = rotated;

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Account is inactive');
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

    return { message: 'Logged out successfully.' };
  }

  async changePassword(
    user: AuthenticatedUser,
    changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password.',
      );
    }

    const dbUser = await this.usersService.findOneByIdWithPassword(user.id);

    if (!dbUser?.password) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await this.tokenService.comparePassword(
      changePasswordDto.currentPassword,
      dbUser.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await this.tokenService.hashPassword(
      changePasswordDto.newPassword,
    );

    await this.usersService.updatePassword(user.id, hashedPassword);
    await this.tokenService.revokeAllRefreshTokens(user.id);

    return { message: 'Password changed successfully.' };
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
        'If an account exists with this email, a password reset link has been sent.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    const stored = await this.tokenService.validatePasswordResetToken(
      resetPasswordDto.token,
    );

    if (!stored) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await this.tokenService.hashPassword(
      resetPasswordDto.newPassword,
    );

    await this.usersService.updatePassword(stored.userId, hashedPassword);
    await this.tokenService.markPasswordResetTokenUsed(resetPasswordDto.token);
    await this.tokenService.revokeAllRefreshTokens(stored.userId);

    return { message: 'Password reset successfully.' };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<MessageResponseDto> {
    const stored = await this.tokenService.validateEmailVerificationToken(
      verifyEmailDto.token,
    );

    if (!stored) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (stored.user.isVerified) {
      return { message: 'Email is already verified.' };
    }

    await this.usersService.markEmailVerified(stored.userId);
    await this.tokenService.markEmailVerificationTokenUsed(
      verifyEmailDto.token,
    );

    return { message: 'Email verified successfully.' };
  }

  async resendVerificationEmail(
    user: AuthenticatedUser,
  ): Promise<MessageResponseDto> {
    if (user.isVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    const verificationToken =
      await this.tokenService.createEmailVerificationToken(user.id);
    await this.authMailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return { message: 'Verification email sent.' };
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
