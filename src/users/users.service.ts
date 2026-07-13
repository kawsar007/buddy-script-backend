import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUserResponseDto } from './dto/public-user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async getCurrentUser(userId: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUserResponse(user);
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    if (Object.keys(dto).length === 0) {
      return this.getCurrentUser(userId);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: dto,
      });
      return this.toUserResponse(user);
    } catch {
      throw new NotFoundException('User not found');
    }
  }

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
