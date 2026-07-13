import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PublicUserResponseDto } from './dto/public-user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @ApiOperation({ summary: "Get the authenticated user's full profile" })
  @ApiOkResponse({ description: 'Current user profile', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  getCurrentUser(@CurrentUser('id') userId: number): Promise<UserResponseDto> {
    return this.usersService.getCurrentUser(userId);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update the authenticated user's own profile" })
  @ApiOkResponse({ description: 'Profile updated', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  updateProfile(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a public-facing user profile by ID' })
  @ApiOkResponse({
    description: 'Public user profile',
    type: PublicUserResponseDto,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  getPublicProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PublicUserResponseDto> {
    return this.usersService.getPublicProfile(id);
  }
}
