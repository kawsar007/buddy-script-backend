import { ApiProperty } from '@nestjs/swagger';
import { CommentResponseDto } from './comment-response.dto';

class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

/** Documentation-only shape for Swagger — used by both comment list endpoints. */
export class PaginatedCommentsResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  data: CommentResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
