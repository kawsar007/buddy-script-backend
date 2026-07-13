import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Comment, Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  buildPaginationMeta,
  PaginationMeta,
} from '../common/utils/api-response.util';
import { PostsService } from '../posts/posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUserResponseDto } from '../users/dto/public-user-response.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

type CommentWithAuthorAndCount = Comment & {
  author: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Date;
  };
  _count: { replies: number };
};

const AUTHOR_SELECT = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    bio: true,
    createdAt: true,
  },
} satisfies { select: Prisma.UserSelect };

const INCLUDE_AUTHOR_AND_REPLY_COUNT = {
  author: AUTHOR_SELECT,
  _count: { select: { replies: true } },
} satisfies Prisma.CommentInclude;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postsService: PostsService,
  ) { }

  /** Creates a top-level comment (parentId = null) on a post. */
  async createComment(
    userId: number,
    dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    await this.postsService.assertPostAccessible(userId, dto.postId);

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        postId: dto.postId,
        authorId: userId,
        parentId: null,
      },
      include: INCLUDE_AUTHOR_AND_REPLY_COUNT,
    });

    return this.toResponse(comment);
  }

  async createReply(
    userId: number,
    parentCommentId: number,
    dto: CreateReplyDto,
  ): Promise<CommentResponseDto> {
    const parent = await this.prisma.comment.findUnique({
      where: { id: parentCommentId },
      select: { id: true, postId: true },
    });

    if (!parent) {
      throw new NotFoundException('Comment not found');
    }

    await this.postsService.assertPostAccessible(userId, parent.postId);

    const reply = await this.prisma.comment.create({
      data: {
        content: dto.content,
        postId: parent.postId,
        authorId: userId,
        parentId: parent.id,
      },
      include: INCLUDE_AUTHOR_AND_REPLY_COUNT,
    });

    return this.toResponse(reply);
  }

  async listTopLevelComments(
    userId: number,
    postId: number,
    query: PaginationQueryDto,
  ): Promise<{ data: CommentResponseDto[]; meta: PaginationMeta }> {
    await this.postsService.assertPostAccessible(userId, postId);

    const where: Prisma.CommentWhereInput = { postId, parentId: null };

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: INCLUDE_AUTHOR_AND_REPLY_COUNT,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      data: comments.map((c: CommentWithAuthorAndCount) => this.toResponse(c)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async listReplies(
    userId: number,
    commentId: number,
    query: PaginationQueryDto,
  ): Promise<{ data: CommentResponseDto[]; meta: PaginationMeta }> {
    const parent = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true },
    });

    if (!parent) {
      throw new NotFoundException('Comment not found');
    }

    await this.postsService.assertPostAccessible(userId, parent.postId);

    const where: Prisma.CommentWhereInput = { parentId: commentId };

    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: INCLUDE_AUTHOR_AND_REPLY_COUNT,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      data: replies.map((c: CommentWithAuthorAndCount) => this.toResponse(c)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async update(
    userId: number,
    commentId: number,
    dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const existing = await this.findOwnedCommentOrThrow(userId, commentId);

    const updated = await this.prisma.comment.update({
      where: { id: existing.id },
      data: { content: dto.content },
      include: INCLUDE_AUTHOR_AND_REPLY_COUNT,
    });

    return this.toResponse(updated);
  }

  async remove(userId: number, commentId: number): Promise<void> {
    const existing = await this.findOwnedCommentOrThrow(userId, commentId);

    await this.prisma.comment.delete({ where: { id: existing.id } });
  }

  /**
 * Confirms a comment exists and its parent post is visible to the caller.
 * Used by the Likes module so a comment (or reply — same table) can't be
 * liked, unliked, or have its likers listed without also being visible —
 * same defense-in-depth reasoning as createReply()'s post-visibility
 * re-check above.
 */
  async assertCommentAccessible(
    userId: number,
    commentId: number,
  ): Promise<{ id: number; postId: number }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.postsService.assertPostAccessible(userId, comment.postId);

    return comment;
  }

  // --------------------------------------------------------------------
  // Internal helpers
  // --------------------------------------------------------------------

  private async findOwnedCommentOrThrow(
    userId: number,
    commentId: number,
  ): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this comment',
      );
    }

    return comment;
  }

  private toResponse(comment: CommentWithAuthorAndCount): CommentResponseDto {
    return new CommentResponseDto({
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      parentId: comment.parentId,
      author: new PublicUserResponseDto({
        id: comment.author.id,
        firstName: comment.author.firstName,
        lastName: comment.author.lastName,
        avatarUrl: comment.author.avatarUrl,
        bio: comment.author.bio,
        createdAt: comment.author.createdAt,
      }),
      repliesCount: comment._count.replies,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    });
  }
}
