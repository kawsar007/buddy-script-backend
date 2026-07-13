import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CommentsService } from './comments.service';
import { PaginatedCommentsResponseDto } from './dto/paginated-comments-response.dto';

@ApiTags('Comments')
@ApiBearerAuth('access-token')
@Controller('posts')
export class PostCommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @Get(':postId/comments')
  @ApiOperation({
    summary: 'List top-level comments on a post, newest first, paginated',
  })
  @ApiOkResponse({
    description: 'Paginated comments',
    type: PaginatedCommentsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Post not found or not visible to you' })
  listComments(
    @CurrentUser('id') userId: number,
    @Param('postId', ParseIntPipe) postId: number,
    @Query() query: PaginationQueryDto,
  ): ReturnType<CommentsService['listTopLevelComments']> {
    return this.commentsService.listTopLevelComments(userId, postId, query);
  }
}
