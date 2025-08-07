import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { env } from 'process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: env.FRONTEND_URL || 'http://localhost:3000', // Your Next.js frontend URL
    credentials: true, // Allow cookies to be sent
  });
  app.use(cookieParser());
  await app.listen(env.PORT || 300); // Or any port you prefer
}
bootstrap();
