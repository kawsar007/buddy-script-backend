import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PublicUserResponseDto {
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
  @ApiProperty({ example: null, nullable: true })
  avatarUrl: string | null;

  @Expose()
  @ApiProperty({ example: null, nullable: true })
  bio: string | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  constructor(partial: Partial<PublicUserResponseDto>) {
    Object.assign(this, partial);
  }
}
