import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PostVisibility } from '@prisma/client';

export class CreatePostDto {
  @ApiProperty({
    example: 'Just shipped a new feature at work \ud83d\ude80',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    enum: PostVisibility,
    default: PostVisibility.PUBLIC,
    example: PostVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility = PostVisibility.PUBLIC;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional image attachment (JPEG, PNG, or WEBP)',
  })
  @IsOptional()
  image?: unknown; // documentation-only field; actual file arrives via FileInterceptor, not this DTO
}
