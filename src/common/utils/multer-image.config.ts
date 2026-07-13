import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import type { Options } from 'multer';
import { diskStorage } from 'multer';
import { extname } from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function maxFileSizeBytes(): number {
  const mb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? 5);
  return mb * 1024 * 1024;
}

function uploadRoot(): string {
  return process.env.UPLOAD_DEST ?? './uploads';
}

export function imageMulterOptions(subdir: string): Options {
  return {
    storage: diskStorage({
      destination: `${uploadRoot()}/${subdir}`,
      filename: (_req, file, callback) => {
        const ext = extname(file.originalname).toLowerCase();
        callback(null, `${randomUUID()}${ext}`);
      },
    }),
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        callback(
          new BadRequestException(
            'Only JPEG, PNG, and WEBP images are allowed',
          ),
          false,
        );
        return;
      }
      callback(null, true);
    },
    limits: { fileSize: maxFileSizeBytes() },
  };
}

export function buildImageUrl(subdir: string, filename: string): string {
  return `/uploads/${subdir}/${filename}`;
}
