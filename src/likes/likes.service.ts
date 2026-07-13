import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentsService } from '../comments/comments.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  buildPaginationMeta,
  PaginationMeta,
} from '../common/utils/api-response.util';
import { PostsService } from '../posts/posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUserResponseDto } from '../users/dto/public-user-response.dto';
import { LikeActionResponseDto } from './dto/like-action-response.dto';
import { LikerResponseDto } from './dto/liker-response.dto';

const LIKER_SELECT = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    bio: true,
    createdAt: true,
  },
};

type LikeWithUser = {
  createdAt: Date;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Date;
  };
};

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) { }

  // -----------------
  // Post likes
  // -----------------

  async likePost(
    userId: number,
    postId: number,
  ): Promise<LikeActionResponseDto> {
    await this.postsService.assertPostAccessible(userId, postId);

    const existing = await this.prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      throw new ConflictException('You have already liked this post');
    }

    await this.prisma.postLike.create({ data: { userId, postId } });

    const likesCount = await this.prisma.postLike.count({ where: { postId } });

    return new LikeActionResponseDto({ targetId: postId, likesCount });
  }

  async unlikePost(
    userId: number,
    postId: number,
  ): Promise<LikeActionResponseDto> {
    await this.postsService.assertPostAccessible(userId, postId);

    const existing = await this.prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existing) {
      throw new NotFoundException('You have not liked this post');
    }

    await this.prisma.postLike.delete({ where: { id: existing.id } });

    const likesCount = await this.prisma.postLike.count({ where: { postId } });

    return new LikeActionResponseDto({ targetId: postId, likesCount });
  }

  async listPostLikers(
    userId: number,
    postId: number,
    query: PaginationQueryDto,
  ): Promise<{ data: LikerResponseDto[]; meta: PaginationMeta }> {
    await this.postsService.assertPostAccessible(userId, postId);

    const where = { postId };

    const [likes, total] = await Promise.all([
      this.prisma.postLike.findMany({
        where,
        include: { user: LIKER_SELECT },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.postLike.count({ where }),
    ]);

    return {
      data: likes.map((l: LikeWithUser) => this.toLikerResponse(l)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async likeComment(
    userId: number,
    commentId: number,
  ): Promise<LikeActionResponseDto> {
    await this.commentsService.assertCommentAccessible(userId, commentId);

    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      throw new ConflictException('You have already liked this comment');
    }

    await this.prisma.commentLike.create({ data: { userId, commentId } });

    const likesCount = await this.prisma.commentLike.count({
      where: { commentId },
    });

    return new LikeActionResponseDto({ targetId: commentId, likesCount });
  }

  async unlikeComment(
    userId: number,
    commentId: number,
  ): Promise<LikeActionResponseDto> {
    await this.commentsService.assertCommentAccessible(userId, commentId);

    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (!existing) {
      throw new NotFoundException('You have not liked this comment');
    }

    await this.prisma.commentLike.delete({ where: { id: existing.id } });

    const likesCount = await this.prisma.commentLike.count({
      where: { commentId },
    });

    return new LikeActionResponseDto({ targetId: commentId, likesCount });
  }

  async listCommentLikers(
    userId: number,
    commentId: number,
    query: PaginationQueryDto,
  ): Promise<{ data: LikerResponseDto[]; meta: PaginationMeta }> {
    await this.commentsService.assertCommentAccessible(userId, commentId);

    const where = { commentId };

    const [likes, total] = await Promise.all([
      this.prisma.commentLike.findMany({
        where,
        include: { user: LIKER_SELECT },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.commentLike.count({ where }),
    ]);

    return {
      data: likes.map((l: LikeWithUser) => this.toLikerResponse(l)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  // ---------------------
  // Internal helpers
  // --------------------

  private toLikerResponse(like: LikeWithUser): LikerResponseDto {
    return new LikerResponseDto({
      user: new PublicUserResponseDto({
        id: like.user.id,
        firstName: like.user.firstName,
        lastName: like.user.lastName,
        avatarUrl: like.user.avatarUrl,
        bio: like.user.bio,
        createdAt: like.user.createdAt,
      }),
      likedAt: like.createdAt,
    });
  }
}
