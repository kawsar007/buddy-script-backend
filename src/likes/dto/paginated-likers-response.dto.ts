import { ApiProperty } from '@nestjs/swagger';
import { LikerResponseDto } from './liker-response.dto';

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

/** Documentation-only shape for Swagger — used by both "who liked this" endpoints. */
export class PaginatedLikersResponseDto {
  @ApiProperty({ type: [LikerResponseDto] })
  data: LikerResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
