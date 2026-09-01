import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();

  // Serve uploaded files statically
  if (!process.env.STORAGE_PATH) {
    throw new Error('STORAGE_PATH environment variable is required for production uploads');
  }
  
  app.useStaticAssets(join(process.cwd(), process.env.STORAGE_PATH), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
