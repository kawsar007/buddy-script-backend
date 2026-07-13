import { Module } from '@nestjs/common';
import { PostsModule } from '../posts/posts.module';
import { CommentsController } from './comments.controller';
import { PostCommentsController } from './post-comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [PostsModule],
  controllers: [CommentsController, PostCommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
