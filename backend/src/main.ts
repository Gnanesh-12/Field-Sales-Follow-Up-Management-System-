import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();

  // Serve uploaded files statically for legacy compatibility
  if (process.env.STORAGE_PATH) {
    app.useStaticAssets(join(process.cwd(), process.env.STORAGE_PATH), {
      prefix: '/uploads/',
    });
  } else {
    console.warn('STORAGE_PATH environment variable is missing. Local file serving for legacy uploads is disabled.');
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
