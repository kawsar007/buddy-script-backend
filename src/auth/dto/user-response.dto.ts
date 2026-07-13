import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'Kawsar' })
  firstName: string;

  @Expose()
  @ApiProperty({ example: 'Ahmed' })
  lastName: string;

  @Expose()
  @ApiProperty({ example: 'kawsar@example.com' })
  email: string;

  @Expose()
  @ApiProperty({ example: null, nullable: true })
  avatarUrl: string | null;

  @Expose()
  @ApiProperty({ example: null, nullable: true })
  bio: string | null;

  @Expose()
  @ApiProperty({ enum: Role, example: Role.USER })
  role: Role;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
