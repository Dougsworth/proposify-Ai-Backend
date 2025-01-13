import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'debug', 'log'],
  });

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: true, // Temporarily allow all origins during development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: [
      'Content-Range',
      'X-Content-Range',
      'Content-Security-Policy',
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Resource-Policy',
      'Origin-Agent-Cluster',
      'X-DNS-Prefetch-Control',
      'X-Download-Options',
      'X-Frame-Options',
      'X-Permitted-Cross-Domain-Policies',
      'X-Render-Origin-Server',
      'X-XSS-Protection',
    ],
    maxAge: 3600,
  });

  // Trust proxy if behind a reverse proxy
  app.set('trust proxy', 1);

  // Global prefix for all routes (optional)
  app.setGlobalPrefix('api');

  // Start the server
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});
