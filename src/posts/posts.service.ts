import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Post, PostVisibility, Prisma } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  buildPaginationMeta,
  PaginationMeta,
} from '../common/utils/api-response.util';
import { buildImageUrl } from '../common/utils/multer-image.config';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUserResponseDto } from '../users/dto/public-user-response.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { UpdatePostDto } from './dto/update-post.dto';

type PostWithAuthor = Post & {
  author: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Date;
  };
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

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(
    authorId: number,
    dto: CreatePostDto,
    file?: Express.Multer.File,
  ): Promise<PostResponseDto> {
    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        visibility: dto.visibility ?? PostVisibility.PUBLIC,
        authorId,
        imageUrl: file ? buildImageUrl('posts', file.filename) : null,
      },
      include: { author: AUTHOR_SELECT },
    });

    return this.toResponse(post);
  }

  async findAll(
    currentUserId: number,
    query: PaginationQueryDto,
  ): Promise<{ data: PostResponseDto[]; meta: PaginationMeta }> {
    const where: Prisma.PostWhereInput = {
      OR: [
        { visibility: PostVisibility.PUBLIC },
        { visibility: PostVisibility.PRIVATE, authorId: currentUserId },
      ],
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: { author: AUTHOR_SELECT },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts.map((p: PostWithAuthor) => this.toResponse(p)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  // Confirms a post exists and is visible to the caller (PUBLIC, or PRIVATE)

  async assertPostAccessible(
    currentUserId: number,
    postId: number,
  ): Promise<{ id: number; authorId: number }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, visibility: true },
    });

    const isOwner = post?.authorId === currentUserId;
    const isVisible =
      post && (post.visibility === PostVisibility.PUBLIC || isOwner);

    if (!post || !isVisible) {
      throw new NotFoundException('Post not found');
    }

    return { id: post.id, authorId: post.authorId };
  }

  async findOne(
    currentUserId: number,
    postId: number,
  ): Promise<PostResponseDto> {
    const post = await this.findVisiblePostOrThrow(currentUserId, postId);
    return this.toResponse(post);
  }

  async update(
    currentUserId: number,
    postId: number,
    dto: UpdatePostDto,
    file?: Express.Multer.File,
  ): Promise<PostResponseDto> {
    const existing = await this.findOwnedPostOrThrow(currentUserId, postId);

    const previousImagePath = existing.imageUrl;

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
        ...(file ? { imageUrl: buildImageUrl('posts', file.filename) } : {}),
      },
      include: { author: AUTHOR_SELECT },
    });

    if (file && previousImagePath) {
      await this.deleteImageFile(previousImagePath);
    }

    return this.toResponse(updated);
  }

  async remove(currentUserId: number, postId: number): Promise<void> {
    const existing = await this.findOwnedPostOrThrow(currentUserId, postId);

    // Comments and likes cascade automatically via onDelete: Cascade in the
    // schema — no manual cleanup of child rows needed here.
    await this.prisma.post.delete({ where: { id: postId } });

    if (existing.imageUrl) {
      await this.deleteImageFile(existing.imageUrl);
    }
  }

  // --------------------
  // Internal helpers
  // --------------------

  private async findVisiblePostOrThrow(
    currentUserId: number,
    postId: number,
  ): Promise<PostWithAuthor> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { author: AUTHOR_SELECT },
    });

    const isOwner = post?.authorId === currentUserId;
    const isVisible =
      post && (post.visibility === PostVisibility.PUBLIC || isOwner);

    if (!post || !isVisible) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  private async findOwnedPostOrThrow(
    currentUserId: number,
    postId: number,
  ): Promise<PostWithAuthor> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { author: AUTHOR_SELECT },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== currentUserId) {
      throw new ForbiddenException(
        'You do not have permission to modify this post',
      );
    }

    return post;
  }

  /** Best-effort disk cleanup - a stale file is a nuisance, not a data-integrity issue. */
  private async deleteImageFile(imageUrl: string): Promise<void> {
    try {
      const relativePath = imageUrl.replace(/^\/uploads\//, '');
      const uploadRoot = process.env.UPLOAD_DEST ?? './uploads';
      await unlink(join(process.cwd(), uploadRoot, relativePath));
    } catch {
      // File already gone
    }
  }

  private toResponse(post: PostWithAuthor): PostResponseDto {
    return new PostResponseDto({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      visibility: post.visibility,
      author: new PublicUserResponseDto({
        id: post.author.id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        avatarUrl: post.author.avatarUrl,
        bio: post.author.bio,
        createdAt: post.author.createdAt,
      }),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  }
}
