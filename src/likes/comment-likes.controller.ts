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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { LikeActionResponseDto } from './dto/like-action-response.dto';
import { PaginatedLikersResponseDto } from './dto/paginated-likers-response.dto';
import { LikesService } from './likes.service';

@ApiTags('Likes')
@ApiBearerAuth('access-token')
@Controller('comments')
export class CommentLikesController {
  constructor(private readonly likesService: LikesService) { }

  @Post(':id/like')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Like a comment or reply' })
  @ApiCreatedResponse({
    description: 'Comment liked',
    type: LikeActionResponseDto,
  })
  @ApiConflictResponse({ description: 'You have already liked this comment' })
  @ApiNotFoundResponse({
    description: 'Comment not found or its post is not visible to you',
  })
  like(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LikeActionResponseDto> {
    return this.likesService.likeComment(userId, id);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlike a comment or reply' })
  @ApiOkResponse({
    description: 'Comment unliked',
    type: LikeActionResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Comment not found, not visible, or not liked by you',
  })
  unlike(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LikeActionResponseDto> {
    return this.likesService.unlikeComment(userId, id);
  }

  @Get(':id/likes')
  @ApiOperation({
    summary: 'List users who liked this comment/reply, newest first, paginated',
  })
  @ApiOkResponse({
    description: 'Paginated likers',
    type: PaginatedLikersResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Comment not found or its post is not visible to you',
  })
  listLikers(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ): ReturnType<LikesService['listCommentLikers']> {
    return this.likesService.listCommentLikers(userId, id, query);
  }
}
