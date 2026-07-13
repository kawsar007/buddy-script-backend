import { ApiProperty } from '@nestjs/swagger';
import { PostResponseDto } from './post-response.dto';

class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

/** Documentation-only shape for Swagger — GET /posts response body. */
export class PaginatedPostsResponseDto {
  @ApiProperty({ type: [PostResponseDto] })
  data: PostResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
