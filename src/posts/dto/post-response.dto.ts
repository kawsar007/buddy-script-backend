import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { PostVisibility } from '@prisma/client';
import { PublicUserResponseDto } from '../../users/dto/public-user-response.dto';

/**
 * Feed/detail responses embed the author using PublicUserResponseDto (no
 * email) — never the full UserResponseDto. A post is fetched by many people
 * who are not its author, so the embedded author must use the same
 * public-trust-level shape as GET /users/:id.
 */
@Exclude()
export class PostResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'Just shipped a new feature at work 🚀' })
  content: string;

  @Expose()
  @ApiProperty({ example: null, nullable: true })
  imageUrl: string | null;

  @Expose()
  @ApiProperty({ enum: PostVisibility, example: PostVisibility.PUBLIC })
  visibility: PostVisibility;

  @Expose()
  @Type(() => PublicUserResponseDto)
  @ApiProperty({ type: PublicUserResponseDto })
  author: PublicUserResponseDto;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<PostResponseDto>) {
    Object.assign(this, partial);
  }
}
