import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CommentsService } from './comments.service';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { PaginatedCommentsResponseDto } from './dto/paginated-comments-response.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@ApiBearerAuth('access-token')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a top-level comment on a post' })
  @ApiCreatedResponse({
    description: 'Comment created',
    type: CommentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Post not found or not visible to you' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.createComment(userId, dto);
  }

  @Post(':id/reply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reply to a comment (or to another reply, for nested threads)',
  })
  @ApiCreatedResponse({
    description: 'Reply created',
    type: CommentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  reply(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReplyDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.createReply(userId, id, dto);
  }

  @Get(':id/replies')
  @ApiOperation({
    summary: "List a comment's direct replies, newest first, paginated",
  })
  @ApiOkResponse({
    description: 'Paginated replies',
    type: PaginatedCommentsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  listReplies(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ): ReturnType<CommentsService['listReplies']> {
    return this.commentsService.listReplies(userId, id, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update your own comment or reply' })
  @ApiOkResponse({ description: 'Comment updated', type: CommentResponseDto })
  @ApiForbiddenResponse({ description: 'You do not own this comment' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete your own comment or reply (and its replies, if any)',
  })
  @ApiOkResponse({ description: 'Comment deleted' })
  @ApiForbiddenResponse({ description: 'You do not own this comment' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  async remove(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; data: null }> {
    await this.commentsService.remove(userId, id);
    return { message: 'Comment deleted successfully', data: null };
  }
}
