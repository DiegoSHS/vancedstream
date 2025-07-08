// @ts-ignore
import { NestFactory } from '@nestjs/core';
// @ts-ignore
import { AppModule } from './app.module.js';
// @ts-ignore
import { FastifyAdapter } from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter(),
  );
  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: [
      'Content-Range',
      'Accept-Ranges',
      'Content-Length',
      'Content-Type',
      'Content-Disposition',
    ],
  });
  await app.listen(3000, '0.0.0.0');
}

export { };

bootstrap();
