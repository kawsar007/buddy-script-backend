import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { PublicUserResponseDto } from '../../users/dto/public-user-response.dto';

/**
 * `repliesCount` lets a client show "12 replies" and decide whether to call
 * GET /comments/:id/replies, without the server ever returning a deep,
 * unbounded reply tree in one response. Nested threads are walked one
 * level at a time by the client — see README for the full rationale.
 */
@Exclude()
export class CommentResponseDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'Great post!' })
  content: string;

  @Expose()
  @ApiProperty({ example: 10 })
  postId: number;

  @Expose()
  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Null for a top-level comment',
  })
  parentId: number | null;

  @Expose()
  @Type(() => PublicUserResponseDto)
  @ApiProperty({ type: PublicUserResponseDto })
  author: PublicUserResponseDto;

  @Expose()
  @ApiProperty({
    example: 0,
    description: 'Number of direct replies to this comment',
  })
  repliesCount: number;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<CommentResponseDto>) {
    Object.assign(this, partial);
  }
}
