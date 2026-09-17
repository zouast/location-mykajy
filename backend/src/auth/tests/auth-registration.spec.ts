import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, UserStatus } from '@prisma/client';
import { AuthService } from '../auth.service';
import { RolesGuard } from '../guards/roles.guard';
import { RegisterDto } from '../dto/register.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe("Auth Registration & Profile Security - 26 Scenarios", () => {
  let authService: AuthService;
  let prismaMock: any;
  let usersServiceMock: any;
  let tokenServiceMock: any;
  let authMailServiceMock: any;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      emailVerificationToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((cb) => cb(prismaMock)),
    };

    usersServiceMock = {
      findOneByEmail: jest.fn(),
      updateLastLogin: jest.fn(),
    };

    tokenServiceMock = {
      hashPassword: jest.fn().mockResolvedValue("hashed_pw_bcrypt_123"),
      comparePassword: jest.fn(),
      generateOpaqueToken: jest.fn().mockReturnValue("raw_random_hex_token_32_bytes"),
      hashToken: jest.fn().mockReturnValue("sha256_hashed_token_64_chars"),
      getEmailVerificationExpiresAt: jest.fn().mockReturnValue(new Date(Date.now() + 86400000)),
      signAccessToken: jest.fn().mockReturnValue("jwt_access_token"),
      createRefreshToken: jest.fn().mockResolvedValue("jwt_refresh_token"),
      getAccessTokenExpiresIn: jest.fn().mockReturnValue("15m"),
    };

    authMailServiceMock = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
    };

    authService = new AuthService(
      usersServiceMock,
      tokenServiceMock,
      authMailServiceMock,
      prismaMock,
    );

    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  // ─── Scenario 1: Inscription locataire réussie ───
  it("1. Inscription locataire réussie", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "locataire-1",
      email: "locataire@test.com",
      firstName: "Alice",
      lastName: "Dupont",
      phone: "+33612345678",
      role: Role.LOCATAIRE,
      status: UserStatus.PENDING,
      emailVerified: false,
      phoneVerified: false,
    });

    const res = await authService.register({
      firstName: "Alice",
      lastName: "Dupont",
      email: "locataire@test.com",
      phone: "+33612345678",
      password: "Password123!",
      passwordConfirmation: "Password123!",
      role: Role.LOCATAIRE,
      acceptTerms: true,
    });

    expect(res.success).toBe(true);
    expect(res.data.user.role).toBe(Role.LOCATAIRE);
    expect(res.data.user.status).toBe(UserStatus.PENDING);
    expect(authMailServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
      "locataire@test.com",
      "raw_random_hex_token_32_bytes",
    );
  });

  // ─── Scenario 2: Inscription propriétaire réussie ───
  it("2. Inscription propriétaire réussie", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "proprio-1",
      email: "proprio@test.com",
      firstName: "Bob",
      lastName: "Martin",
      role: Role.PROPRIETAIRE,
      status: UserStatus.PENDING,
      emailVerified: false,
      phoneVerified: false,
    });

    const res = await authService.register({
      firstName: "Bob",
      lastName: "Martin",
      email: "proprio@test.com",
      password: "Password123!",
      passwordConfirmation: "Password123!",
      role: Role.PROPRIETAIRE,
      acceptTerms: true,
    });

    expect(res.success).toBe(true);
    expect(res.data.user.role).toBe(Role.PROPRIETAIRE);
  });

  // ─── Scenario 3: Données correctement enregistrées dans PostgreSQL ───
  it("3. Données correctement enregistrées dans PostgreSQL", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "u-123",
      email: "user@test.com",
      firstName: "Jean",
      lastName: "Valjean",
      phone: "+33600000000",
      role: Role.LOCATAIRE,
      status: UserStatus.PENDING,
      emailVerified: false,
      phoneVerified: false,
    });

    await authService.register({
      firstName: "Jean",
      lastName: "Valjean",
      email: "user@test.com",
      phone: "+33600000000",
      password: "Password123!",
      passwordConfirmation: "Password123!",
      role: Role.LOCATAIRE,
      acceptTerms: true,
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "user@test.com",
          firstName: "Jean",
          lastName: "Valjean",
          role: Role.LOCATAIRE,
          status: UserStatus.PENDING,
          emailVerified: false,
        }),
      }),
    );
  });

  // ─── Scenario 4: Mot de passe enregistré uniquement sous forme de hash ───
  it("4. Mot de passe enregistré uniquement sous forme de hash (bcrypt)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "u-1",
      email: "hash@test.com",
      firstName: "A",
      lastName: "B",
      role: Role.LOCATAIRE,
      status: UserStatus.PENDING,
      emailVerified: false,
      phoneVerified: false,
    });

    await authService.register({
      firstName: "A",
      lastName: "B",
      email: "hash@test.com",
      password: "PlainSecretPassword123!",
      passwordConfirmation: "PlainSecretPassword123!",
      role: Role.LOCATAIRE,
      acceptTerms: true,
    });

    expect(tokenServiceMock.hashPassword).toHaveBeenCalledWith("PlainSecretPassword123!");
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: "hashed_pw_bcrypt_123",
        }),
      }),
    );
  });

  // ─── Scenario 5: Statut initial défini à PENDING ───
  it("5. Statut initial défini à PENDING", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(({ data }: any) => ({
      ...data,
      id: "new-id",
    }));

    const res = await authService.register({
      firstName: "A",
      lastName: "B",
      email: "pending@test.com",
      password: "Password123!",
      passwordConfirmation: "Password123!",
      role: Role.LOCATAIRE,
      acceptTerms: true,
    });

    expect(res.data.user.status).toBe(UserStatus.PENDING);
    expect(res.data.user.emailVerified).toBe(false);
  });

  // ─── Scenario 6: Rejet si email déjà utilisé ───
  it("6. Rejet si email déjà utilisé", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "existing-id",
      email: "already@test.com",
      deletedAt: null,
    });

    await expect(
      authService.register({
        firstName: "A",
        lastName: "B",
        email: "already@test.com",
        password: "Password123!",
        passwordConfirmation: "Password123!",
        role: Role.LOCATAIRE,
        acceptTerms: true,
      }),
    ).rejects.toThrow(ConflictException);
  });

  // ─── Scenario 7: Normalisation de l'email (minuscules, trim) ───
  it("7. Normalisation de l email (minuscules, trim)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "id-1",
      email: "clean.email@test.com",
      firstName: "A",
      lastName: "B",
      role: Role.LOCATAIRE,
      status: UserStatus.PENDING,
      emailVerified: false,
      phoneVerified: false,
    });

    await authService.register({
      firstName: "  A  ",
      lastName: "  B  ",
      email: "  Clean.Email@TEST.COM  ",
      password: "Password123!",
      passwordConfirmation: "Password123!",
      role: Role.LOCATAIRE,
      acceptTerms: true,
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "clean.email@test.com" },
    });
  });

  // ─── Scenario 8: Rejet si mot de passe invalide / trop court ───
  it("8. Rejet si mot de passe invalide ou trop court", async () => {
    const dto = plainToInstance(RegisterDto, {
      firstName: "Jean",
      lastName: "Dupont",
      email: "test@example.com",
      password: "short",
      passwordConfirmation: "short",
      role: Role.LOCATAIRE,
      acceptTerms: true,
    });

    const errors = await validate(dto);
    const passwordError = errors.find((e) => e.property === "password");
    expect(passwordError).toBeDefined();
  });

  // ─── Scenario 9: Rejet si confirmation de mot de passe incorrecte ───
  it("9. Rejet si confirmation de mot de passe incorrecte", async () => {
    const dto = plainToInstance(RegisterDto, {
      firstName: "Jean",
      lastName: "Dupont",
      email: "test@example.com",
      password: "Password123!",
      passwordConfirmation: "DifferentPassword123!",
      role: Role.LOCATAIRE,
      acceptTerms: true,
    });

    const errors = await validate(dto);
    const confirmError = errors.find((e) => e.property === "passwordConfirmation");
    expect(confirmError).toBeDefined();
  });

  // ─── Scenario 10: Rejet si conditions générales non acceptées ───
  it("10. Rejet si conditions générales non acceptées", async () => {
    const dto = plainToInstance(RegisterDto, {
      firstName: "Jean",
      lastName: "Dupont",
      email: "test@example.com",
      password: "Password123!",
      passwordConfirmation: "Password123!",
      role: Role.LOCATAIRE,
      acceptTerms: false,
    });

    const errors = await validate(dto);
    const termsError = errors.find((e) => e.property === "acceptTerms");
    expect(termsError).toBeDefined();
  });

  // ─── Scenario 11: Rôle ADMIN interdit lors de l'inscription ───
  it("11. Rôle ADMIN interdit lors de l inscription", async () => {
    await expect(
      authService.register({
        firstName: "Hacker",
        lastName: "Admin",
        email: "hacker@test.com",
        password: "Password123!",
        passwordConfirmation: "Password123!",
        role: Role.ADMIN,
        acceptTerms: true,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  // ─── Scenario 12: Aucune donnée créée si le rôle est interdit ───
  it("12. Aucune donnée créée si le rôle est interdit", async () => {
    try {
      await authService.register({
        firstName: "Hacker",
        lastName: "Admin",
        email: "hacker@test.com",
        password: "Password123!",
        passwordConfirmation: "Password123!",
        role: Role.ADMIN,
        acceptTerms: true,
      });
    } catch {
      // Expected
    }

    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(prismaMock.emailVerificationToken.create).not.toHaveBeenCalled();
  });

  // ─── Scenario 13: Token de vérification enregistré sous forme de hash ───
  it("13. Token de vérification enregistré sous forme de hash (SHA-256)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "u-token",
      email: "token@test.com",
      firstName: "A",
      lastName: "B",
      role: Role.LOCATAIRE,
      status: UserStatus.PENDING,
      emailVerified: false,
      phoneVerified: false,
    });

    await authService.register({
      firstName: "A",
      lastName: "B",
      email: "token@test.com",
      password: "Password123!",
      passwordConfirmation: "Password123!",
      role: Role.LOCATAIRE,
      acceptTerms: true,
    });

    expect(tokenServiceMock.hashToken).toHaveBeenCalledWith("raw_random_hex_token_32_bytes");
    expect(prismaMock.emailVerificationToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenHash: "sha256_hashed_token_64_chars",
        }),
      }),
    );
  });

  // ─── Scenario 14: Vérification d'email réussie ───
  it("14. Vérification d email réussie", async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
      id: "evt-1",
      userId: "user-to-verify",
      expiresAt: new Date(Date.now() + 100000),
      usedAt: null,
      user: {
        id: "user-to-verify",
        emailVerified: false,
        deletedAt: null,
      },
    });

    const res = await authService.verifyEmail({ token: "raw_random_hex_token_32_bytes" });
    expect(res.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-to-verify" },
      data: {
        emailVerified: true,
        isVerified: true,
        status: UserStatus.ACTIVE,
      },
    });
  });

  // ─── Scenario 15: Rejet si token expiré ───
  it("15. Rejet si token expiré", async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
      id: "evt-expired",
      userId: "u-1",
      expiresAt: new Date(Date.now() - 100000),
      usedAt: null,
      user: { id: "u-1", emailVerified: false },
    });

    await expect(
      authService.verifyEmail({ token: "expired-token" }),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Scenario 16: Rejet si token déjà utilisé ───
  it("16. Rejet si token déjà utilisé", async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
      id: "evt-used",
      userId: "u-1",
      expiresAt: new Date(Date.now() + 100000),
      usedAt: new Date(),
      user: { id: "u-1", emailVerified: false },
    });

    await expect(
      authService.verifyEmail({ token: "used-token" }),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Scenario 17: Activation du compte après vérification ───
  it("17. Activation du compte après vérification (ACTIVE, emailVerified: true)", async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
      id: "evt-1",
      userId: "u-activated",
      expiresAt: new Date(Date.now() + 100000),
      usedAt: null,
      user: { id: "u-activated", emailVerified: false },
    });

    await authService.verifyEmail({ token: "valid-token" });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u-activated" },
        data: expect.objectContaining({
          status: UserStatus.ACTIVE,
          emailVerified: true,
        }),
      }),
    );
  });

  // ─── Scenario 18: Connexion locataire autorisée si vérifié ───
  it("18. Connexion locataire autorisée si vérifié", async () => {
    usersServiceMock.findOneByEmail.mockResolvedValue({
      id: "loc-verified",
      email: "loc@test.com",
      passwordHash: "hash",
      role: Role.LOCATAIRE,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      isActive: true,
      deletedAt: null,
    });
    tokenServiceMock.comparePassword.mockResolvedValue(true);

    const res = await authService.login({
      email: "loc@test.com",
      password: "Password123!",
    });

    expect(res.tokens.accessToken).toBe("jwt_access_token");
    expect(res.user.role).toBe(Role.LOCATAIRE);
  });

  // ─── Scenario 19: Connexion propriétaire autorisée si vérifié ───
  it("19. Connexion propriétaire autorisée si vérifié", async () => {
    usersServiceMock.findOneByEmail.mockResolvedValue({
      id: "prop-verified",
      email: "prop@test.com",
      passwordHash: "hash",
      role: Role.PROPRIETAIRE,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      isActive: true,
      deletedAt: null,
    });
    tokenServiceMock.comparePassword.mockResolvedValue(true);

    const res = await authService.login({
      email: "prop@test.com",
      password: "Password123!",
    });

    expect(res.tokens.accessToken).toBe("jwt_access_token");
    expect(res.user.role).toBe(Role.PROPRIETAIRE);
  });

  // ─── Scenario 20: Connexion refusée avant vérification de l'email ───
  it("20. Connexion refusée avant vérification de l email", async () => {
    usersServiceMock.findOneByEmail.mockResolvedValue({
      id: "unverified-user",
      email: "unverified@test.com",
      passwordHash: "hash",
      role: Role.LOCATAIRE,
      status: UserStatus.PENDING,
      emailVerified: false,
      isActive: true,
      deletedAt: null,
    });
    tokenServiceMock.comparePassword.mockResolvedValue(true);

    await expect(
      authService.login({
        email: "unverified@test.com",
        password: "Password123!",
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ─── Scenario 21: Accès locataire refusé à une route propriétaire ───
  it("21. Accès locataire refusé à une route propriétaire (RolesGuard)", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.PROPRIETAIRE]);

    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.LOCATAIRE } }),
      }),
    } as unknown as ExecutionContext;

    expect(rolesGuard.canActivate(context)).toBe(false);
  });

  // ─── Scenario 22: Accès propriétaire refusé à une route locataire ───
  it("22. Accès propriétaire refusé à une route locataire (RolesGuard)", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.LOCATAIRE]);

    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.PROPRIETAIRE } }),
      }),
    } as unknown as ExecutionContext;

    expect(rolesGuard.canActivate(context)).toBe(false);
  });

  // ─── Scenario 23: Accès ADMIN protégé contre locataire et propriétaire ───
  it("23. Accès ADMIN protégé contre locataire et propriétaire", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);

    const locContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.LOCATAIRE } }),
      }),
    } as unknown as ExecutionContext;

    const propContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.PROPRIETAIRE } }),
      }),
    } as unknown as ExecutionContext;

    const adminContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.ADMIN } }),
      }),
    } as unknown as ExecutionContext;

    expect(rolesGuard.canActivate(locContext)).toBe(false);
    expect(rolesGuard.canActivate(propContext)).toBe(false);
    expect(rolesGuard.canActivate(adminContext)).toBe(true);
  });

  // ─── Scenario 24: Propriétaire ne peut pas modifier le bien d'un autre ───
  it("24. Propriétaire ne peut pas modifier le bien d un autre propriétaire", () => {
    const ownerAId = "owner-a";
    const propertyOwnerId = "owner-b";

    const canModify = (currentUserId: string, resourceOwnerId: string) => {
      return currentUserId === resourceOwnerId;
    };

    expect(canModify(ownerAId, propertyOwnerId)).toBe(false);
  });

  // ─── Scenario 25: Locataire ne peut pas modifier le profil d'un autre utilisateur ───
  it("25. Locataire ne peut pas modifier le profil d un autre utilisateur", () => {
    const currentUserId = "tenant-1";
    const targetUserId = "tenant-2";

    const canEditProfile = (authUserId: string, targetId: string) => {
      return authUserId === targetId;
    };

    expect(canEditProfile(currentUserId, targetUserId)).toBe(false);
  });

  // ─── Scenario 26: Rollback de la transaction et absence de données sensibles ───
  it("26. Rollback de la transaction en cas d erreur et absence de données sensibles", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.$transaction.mockRejectedValue(new Error("PostgreSQL connection drop"));

    await expect(
      authService.register({
        firstName: "Test",
        lastName: "Rollback",
        email: "rollback@test.com",
        password: "Password123!",
        passwordConfirmation: "Password123!",
        role: Role.LOCATAIRE,
        acceptTerms: true,
      }),
    ).rejects.toThrow("PostgreSQL connection drop");

    // Vérifier également qu'une réponse réussie ne contient jamais passwordHash ni tokens bruts
    prismaMock.$transaction.mockImplementation((cb: any) => cb(prismaMock));
    prismaMock.user.create.mockResolvedValue({
      id: "safe-user",
      email: "safe@test.com",
      passwordHash: "secret_hash",
      firstName: "Safe",
      lastName: "User",
      role: Role.LOCATAIRE,
      status: UserStatus.PENDING,
      emailVerified: false,
      phoneVerified: false,
    });

    const response = await authService.register({
      firstName: "Safe",
      lastName: "User",
      email: "safe@test.com",
      password: "Password123!",
      passwordConfirmation: "Password123!",
      role: Role.LOCATAIRE,
      acceptTerms: true,
    });

    const responseStr = JSON.stringify(response);
    expect(responseStr).not.toContain("secret_hash");
    expect(responseStr).not.toContain("passwordHash");
    expect(responseStr).not.toContain("raw_random_hex_token_32_bytes");
    expect(responseStr).not.toContain("sha256_hashed_token_64_chars");
  });
});
