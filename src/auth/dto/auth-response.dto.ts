import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  @ApiProperty({ description: 'Short-lived JWT used to authenticate requests' })
  accessToken: string;

  @ApiProperty({
    description: 'Long-lived JWT used to obtain a new access token',
  })
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
