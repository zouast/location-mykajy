export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'mykajy_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      process.env.JWT_SECRET ||
      'super-secret-refresh-key-change-me',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  },
  auth: {
    passwordResetExpiresInHours: parseInt(
      process.env.PASSWORD_RESET_EXPIRES_HOURS || '1',
      10,
    ),
    emailVerificationExpiresInHours: parseInt(
      process.env.EMAIL_VERIFICATION_EXPIRES_HOURS || '24',
      10,
    ),
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  },
});
