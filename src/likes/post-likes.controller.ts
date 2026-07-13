import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { LikeActionResponseDto } from './dto/like-action-response.dto';
import { PaginatedLikersResponseDto } from './dto/paginated-likers-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Likes')
@ApiBearerAuth('access-token')
@Controller('posts')
export class PostLikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':id/like')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Like a post' })
  @ApiCreatedResponse({
    description: 'Post liked',
    type: LikeActionResponseDto,
  })
  @ApiConflictResponse({ description: 'You have already liked this post' })
  @ApiNotFoundResponse({ description: 'Post not found or not visible to you' })
  like(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LikeActionResponseDto> {
    return this.likesService.likePost(userId, id);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiOkResponse({ description: 'Post unliked', type: LikeActionResponseDto })
  @ApiNotFoundResponse({
    description: 'Post not found, not visible, or not liked by you',
  })
  unlike(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LikeActionResponseDto> {
    return this.likesService.unlikePost(userId, id);
  }

  @Get(':id/likes')
  @ApiOperation({
    summary: 'List users who liked this post, newest first, paginated',
  })
  @ApiOkResponse({
    description: 'Paginated likers',
    type: PaginatedLikersResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Post not found or not visible to you' })
  listLikers(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ): ReturnType<LikesService['listPostLikers']> {
    return this.likesService.listPostLikers(userId, id, query);
  }
}
