import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  // CORS Config
  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(' ');
  const corsOptions = {
    origin: (origin, callback) => {
      console.log(origin);
      if (allowedOrigins.indexOf(origin) !== -1 || origin === undefined) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  };

  // App Startup
  const app = await NestFactory.create(AppModule, {
    cors: corsOptions,
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb' }));
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT || 3001);
}

bootstrap();
