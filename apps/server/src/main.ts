import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TrpcRouter } from './trpc/trpc.router';
import { WebSocketService } from './socket/websocket.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用 CORS 并允许所有来源
  app.enableCors({
    origin: "*",
  });
  const wsService = app.get(WebSocketService);
  await wsService.initialize(app.getHttpServer());
  const trpc = app.get(TrpcRouter);
  trpc.applyMiddleware(app);

  const port = process.env.SERVER_PORT || 3000;
 
  await app.listen(port);

}
bootstrap();
