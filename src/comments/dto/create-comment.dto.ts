import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 1, description: 'ID of the post being commented on' })
  @IsInt()
  @Min(1)
  postId: number;

  @ApiProperty({ example: 'Great post!', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
