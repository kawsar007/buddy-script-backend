import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { PublicUserResponseDto } from '../../users/dto/public-user-response.dto';

@Exclude()
export class LikerResponseDto {
  @Expose()
  @Type(() => PublicUserResponseDto)
  @ApiProperty({ type: PublicUserResponseDto })
  user: PublicUserResponseDto;

  @Expose()
  @ApiProperty({ description: 'When this user liked the target' })
  likedAt: Date;

  constructor(partial: Partial<LikerResponseDto>) {
    Object.assign(this, partial);
  }
}
