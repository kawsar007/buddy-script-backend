import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostVisibility } from '@prisma/client';

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'Updated post content', maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({
    enum: PostVisibility,
    example: PostVisibility.PRIVATE,
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Replace the existing image (JPEG, PNG, or WEBP)',
  })
  @IsOptional()
  image?: unknown; // documentation-only field; actual file arrives via FileInterceptor
}
