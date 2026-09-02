import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto';
import {
  UserProfileResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { TokenService } from '../auth/services/token.service';
import { AuthMailService } from '../auth/services/auth-mail.service';
import { omitPassword } from '../auth/utils/omit-password.util';

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'email',
  'firstName',
  'lastName',
  'lastLoginAt',
  'role',
];

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => TokenService))
    private readonly tokenService: TokenService,
    @Inject(forwardRef(() => AuthMailService))
    private readonly authMailService: AuthMailService,
  ) {}

  // ── Méthodes Internes & Auth ───────────────────────────────────────────────

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: createUserDto.password,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      },
    });
  }

  async findOneByEmail(
    email: string,
    selectPassword: true,
  ): Promise<User | null>;
  async findOneByEmail(
    email: string,
    selectPassword?: false,
  ): Promise<Omit<User, 'password'> | null>;
  async findOneByEmail(
    email: string,
    selectPassword = false,
  ): Promise<User | Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || selectPassword) {
      return user;
    }

    return omitPassword(user);
  }

  async findOneById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findOneByIdWithPassword(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async markEmailVerified(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isVerified: true },
    });
  }

  async updateLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async ensureExists(id: string): Promise<User> {
    const user = await this.findOneById(id);
    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  // ── Espace Utilisateur Connecté (/users/me) ────────────────────────────────

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        agentProfile: true,
        ownerProfile: true,
        clientProfile: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const { password, ...safeUser } = user;
    void password;
    return safeUser;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    await this.ensureExists(userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
      },
    });

    return omitPassword(updated);
  }

  async updatePhone(
    userId: string,
    dto: UpdatePhoneDto,
  ): Promise<UserResponseDto> {
    await this.ensureExists(userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: dto.phone,
      },
    });

    return omitPassword(updated);
  }

  async updateEmail(
    userId: string,
    dto: UpdateEmailDto,
  ): Promise<{ user: UserResponseDto; message: string }> {
    const user = await this.findOneByIdWithPassword(userId);
    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const isPasswordValid = await this.tokenService.comparePassword(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    if (user.email.toLowerCase() === dto.newEmail.toLowerCase()) {
      throw new BadRequestException(
        'La nouvelle adresse email doit être différente de l’adresse actuelle',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.newEmail },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictException('Cette adresse email est déjà utilisée');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: dto.newEmail,
        isVerified: false,
      },
    });

    // Générer token de vérification et envoyer l'email de confirmation
    const verificationToken =
      await this.tokenService.createEmailVerificationToken(userId);
    await this.authMailService.sendVerificationEmail(
      updated.email,
      verificationToken,
    );

    return {
      user: omitPassword(updated),
      message:
        'Adresse email mise à jour avec succès. Un email de vérification a été envoyé.',
    };
  }

  async updateAvatar(
    userId: string,
    dto: UpdateAvatarDto,
  ): Promise<UserResponseDto> {
    await this.ensureExists(userId);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: dto.avatarUrl,
      },
    });

    return omitPassword(updated);
  }

  async deactivateAccount(
    userId: string,
    dto: DeactivateAccountDto,
  ): Promise<{ message: string }> {
    const user = await this.findOneByIdWithPassword(userId);
    if (!user || user.deletedAt) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const isPasswordValid = await this.tokenService.comparePassword(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe de confirmation incorrect');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Révoquer toutes les sessions / refresh tokens
    await this.tokenService.revokeAllRefreshTokens(userId);

    return {
      message:
        'Votre compte a été désactivé avec succès et toutes vos sessions ont été fermées.',
    };
  }

  // ── Espace Administration (/admin/users) ──────────────────────────────────

  async findAll(
    query: QueryUsersDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      isVerified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const validatedSortBy = ALLOWED_SORT_FIELDS.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(isVerified !== undefined && { isVerified }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [validatedSortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: users.map((user) => omitPassword(user)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async adminFindOne(id: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        agentProfile: true,
        ownerProfile: true,
        clientProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return omitPassword(user);
  }

  async adminCreate(dto: AdminCreateUserDto): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const hashedPassword = await this.tokenService.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        gender: dto.gender,
        avatarUrl: dto.avatarUrl,
        role: dto.role ?? Role.CLIENT,
        isActive: dto.isActive ?? true,
        isVerified: dto.isVerified ?? false,
      },
    });

    return omitPassword(user);
  }

  async adminUpdate(
    id: string,
    dto: AdminUpdateUserDto,
  ): Promise<UserResponseDto> {
    await this.ensureExists(id);

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Cette adresse email est déjà utilisée');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.email && { email: dto.email }),
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isVerified !== undefined && { isVerified: dto.isVerified }),
      },
    });

    if (dto.isActive === false) {
      await this.tokenService.revokeAllRefreshTokens(id);
    }

    return omitPassword(updated);
  }

  async adminUpdateStatus(
    id: string,
    dto: AdminUpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    await this.ensureExists(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: dto.isActive,
      },
    });

    if (!dto.isActive) {
      await this.tokenService.revokeAllRefreshTokens(id);
    }

    return omitPassword(updated);
  }

  async adminDelete(id: string): Promise<{ message: string }> {
    await this.ensureExists(id);

    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await this.tokenService.revokeAllRefreshTokens(id);

    return {
      message: 'Utilisateur supprimé (désactivé) avec succès.',
    };
  }
}
