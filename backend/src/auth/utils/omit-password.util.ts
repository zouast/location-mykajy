import { User } from '@prisma/client';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

export function omitPassword(user: User): AuthenticatedUser {
  const { passwordHash, ...userWithoutPassword } = user;
  void passwordHash;
  return userWithoutPassword;
}
