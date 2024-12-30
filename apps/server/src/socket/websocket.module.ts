import { Module } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { RealTimeModule } from './realtime/realtime.module';
import { CollaborationModule } from './collaboration/collaboration.module';

@Module({
  imports: [RealTimeModule, CollaborationModule],
  providers: [WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule { }
