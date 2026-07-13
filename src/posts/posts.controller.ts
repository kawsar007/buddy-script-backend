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
  Post as HttpPost,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { PaginatedPostsResponseDto } from './dto/paginated-posts-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { imageMulterOptions } from '../common/utils/multer-image.config';

@ApiTags('Posts')
@ApiBearerAuth('access-token')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', imageMulterOptions('posts')))
  @ApiOperation({
    summary: 'Create a post, optionally with an image attachment',
  })
  @ApiCreatedResponse({ description: 'Post created', type: PostResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<PostResponseDto> {
    return this.postsService.create(userId, dto, file);
  }

  // NOTE: requires auth (no @Public()) rather than allowing anonymous
  // access — the feed needs to know the caller's identity to decide which
  // PRIVATE posts (their own) belong alongside the PUBLIC ones. An
  // "optional auth" guard could relax this later if an anonymous/public
  // feed view becomes a requirement.
  @Get()
  @ApiOperation({ summary: 'List posts — newest first, paginated' })
  @ApiOkResponse({
    description:
      "Public posts plus the caller's own private posts, newest first",
    type: PaginatedPostsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  findAll(
    @CurrentUser('id') userId: number,
    @Query() query: PaginationQueryDto,
  ): ReturnType<PostsService['findAll']> {
    return this.postsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  @ApiOkResponse({ description: 'Post detail', type: PostResponseDto })
  @ApiNotFoundResponse({ description: 'Post not found or not visible to you' })
  findOne(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PostResponseDto> {
    return this.postsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', imageMulterOptions('posts')))
  @ApiOperation({
    summary: 'Update your own post (content, visibility, or image)',
  })
  @ApiOkResponse({ description: 'Post updated', type: PostResponseDto })
  @ApiForbiddenResponse({ description: 'You do not own this post' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<PostResponseDto> {
    return this.postsService.update(userId, id, dto, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete your own post' })
  @ApiOkResponse({ description: 'Post deleted' })
  @ApiForbiddenResponse({ description: 'You do not own this post' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  async remove(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string; data: null }> {
    await this.postsService.remove(userId, id);
    return { message: 'Post deleted successfully', data: null };
  }
}
