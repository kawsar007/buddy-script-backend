import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { PublicUserResponseDto } from './dto/public-user-response.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /users/me — full profile of the authenticated user. Re-fetches from
   * the DB rather than trusting the JWT payload, since bio/avatar/etc. are
   * not (and should not be) embedded in the token.
   */
  async getCurrentUser(userId: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      // Shouldn't happen — JwtStrategy already validated the user exists —
      // but a service should never assume a controller's guard is the only
      // caller, so we defend here too.
      throw new NotFoundException('User not found');
    }

    return this.toUserResponse(user);
  }

  /**
   * PATCH /users/me — partial update of the caller's own profile.
   * Email and password are intentionally not editable here (email changes
   * would need re-verification; password changes get their own dedicated
   * flow in a later phase, not a generic profile PATCH).
   */
  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    if (Object.keys(dto).length === 0) {
      // Nothing to update — fetch and return current state rather than
      // issuing a no-op UPDATE statement.
      return this.getCurrentUser(userId);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: dto,
      });
      return this.toUserResponse(user);
    } catch {
      // update() throws P2025 if the row vanished between the guard check
      // and this call (e.g. account deleted mid-request) — surfaced by the
      // GlobalExceptionFilter as 404, but we translate defensively here too
      // in case of any other constraint issue on this narrow field set.
      throw new NotFoundException('User not found');
    }
  }

  /**
   * GET /users/:id — public-facing profile. Deactivated or missing users
   * return the same 404 so a caller can't distinguish "never existed" from
   * "deactivated" (avoids leaking account status).
   */
  async getPublicProfile(userId: number): Promise<PublicUserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    return new PublicUserResponseDto({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
    });
  }

  private toUserResponse(user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    bio: string | null;
    role: Role;
    createdAt: Date;
  }): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      createdAt: user.createdAt,
    });
  }
}
