import { ApiProperty } from '@nestjs/swagger';

export class LikeActionResponseDto {
  @ApiProperty({ example: 10, description: 'ID of the liked post or comment' })
  targetId: number;

  @ApiProperty({
    example: 42,
    description: 'Total likes on this target after the action',
  })
  likesCount: number;

  constructor(partial: LikeActionResponseDto) {
    Object.assign(this, partial);
  }
}
