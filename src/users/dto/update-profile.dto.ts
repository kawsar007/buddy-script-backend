import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Kawsar' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName?: string;

  @ApiPropertyOptional({ example: 'Ahmed' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @ApiPropertyOptional({
    example: 'Full Stack Engineer | Vue.js & React',
    maxLength: 280,
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.socialfeed.dev/avatars/user-1.jpg',
    description:
      'Direct URL to an already-uploaded image. Use POST /uploads/image (Uploads module) to obtain this URL first.',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(512)
  avatarUrl?: string;
}
