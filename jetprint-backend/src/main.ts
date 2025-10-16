import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable Cross-Origin Resource Sharing (CORS)
  app.enableCors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true,
  });

  // Serve uploaded files statically
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable global validation pipe to automatically validate DTOs
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(3000);
  console.log('🚀 Server is running on http://localhost:3000');
}
bootstrap();