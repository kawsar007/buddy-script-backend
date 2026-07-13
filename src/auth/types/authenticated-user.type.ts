import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: Role;
}

/** Payload encoded inside the JWT itself. */
export interface JwtPayload {
  sub: number; // user id
  email: string;
  role: Role;
  type: 'access' | 'refresh';
}
