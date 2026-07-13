import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync } from 'fs';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port')!;
  const apiPrefix = configService.get<string>('apiPrefix')!;
  const corsOrigin = configService.get<string>('cors.origin')!;
  const uploadDest = configService.get<string>('upload.dest')!;

  for (const subdir of ['posts', 'avatars']) {
    mkdirSync(join(process.cwd(), uploadDest, subdir), { recursive: true });
  }

  app.use(helmet());

  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
  });

  // versioning is baked into API_PREFIX (default "api/v1")
  app.setGlobalPrefix(apiPrefix);

  app.useStaticAssets(join(process.cwd(), uploadDest), {
    prefix: '/uploads',
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: 422,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Social Feed API')
    .setDescription(
      'REST API for the Social Feed application — Auth, Users, Posts, Comments, Likes',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the access token returned from /auth/login',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);

  Logger.log(
    `🚀 Application running on: http://localhost:${port}/${apiPrefix}`,
    'Bootstrap',
  );
  Logger.log(
    `📘 Swagger docs available at: http://localhost:${port}/docs`,
    'Bootstrap',
  );
}

bootstrap();
