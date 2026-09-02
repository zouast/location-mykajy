import { User } from '@prisma/client';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

export function omitPassword(user: User): AuthenticatedUser {
  const { password, ...userWithoutPassword } = user;
  void password;
  return userWithoutPassword;
}
