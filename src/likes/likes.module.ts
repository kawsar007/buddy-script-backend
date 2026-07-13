import { Module } from '@nestjs/common';
import { PostsModule } from '../posts/posts.module';
import { CommentsModule } from '../comments/comments.module';
import { PostLikesController } from './post-likes.controller';
import { CommentLikesController } from './comment-likes.controller';
import { LikesService } from './likes.service';

@Module({
  imports: [PostsModule, CommentsModule],
  controllers: [PostLikesController, CommentLikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
