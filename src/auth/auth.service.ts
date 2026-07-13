import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtPayload } from './types/authenticated-user.type';
import { Role, User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      // Deliberately generic message — do not confirm/deny which field collided
      // beyond "email", and never hint whether an account is active/deleted.
      throw new ConflictException('An account with this email already exists');
    }

    const saltRounds = this.configService.get<number>('bcrypt.saltRounds')!;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Same error for "no such user" and "wrong password" — prevents
    // user-enumeration via response differences.
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer exists or is inactive');
    }

    return this.buildAuthResponse(user);
  }

  /**
   * Issues a fresh access/refresh token pair and shapes the safe user DTO.
   * Centralized here so register/login/refresh can't drift out of sync.
   */
  private async buildAuthResponse(user: User): Promise<AuthResponseDto> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, user.email, user.role, 'access'),
      this.signToken(user.id, user.email, user.role, 'refresh'),
    ]);

    return {
      accessToken,
      refreshToken,
      user: new UserResponseDto({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
      }),
    };
  }

  private signToken(
    userId: number,
    email: string,
    role: Role,
    type: 'access' | 'refresh',
  ): Promise<string> {
    const payload: JwtPayload = { sub: userId, email, role, type };

    const secret =
      type === 'access'
        ? this.configService.get<string>('jwt.accessSecret')
        : this.configService.get<string>('jwt.refreshSecret');

    const expiresIn =
      type === 'access'
        ? this.configService.get<string>('jwt.accessExpiresIn')
        : this.configService.get<string>('jwt.refreshExpiresIn');

    return this.jwtService.signAsync(payload, { secret, expiresIn });
  }
}
