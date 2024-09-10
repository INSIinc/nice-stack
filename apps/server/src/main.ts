import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TrpcRouter } from './trpc/trpc.router';
import { env } from './env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [env.APP_URL],
    credentials: true
  });
  const trpc = app.get(TrpcRouter);
  trpc.applyMiddleware(app);
  await app.listen(3000);
}
bootstrap();
