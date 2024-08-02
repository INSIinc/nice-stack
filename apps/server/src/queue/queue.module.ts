import { BullModule } from '@nestjs/bullmq';
import { Logger, Module } from '@nestjs/common';

import { join } from 'path';
import { SocketGateway } from '@server/socket/socket.gateway';

@Module({
    imports: [
        BullModule.forRoot({
            connection: {
                host: 'localhost',
                port: 6379,
            },
        }), BullModule.registerQueue({
            name: 'general',
            processors: [join(__dirname, 'worker/processor.js')],
        })
    ],
    providers: [Logger, SocketGateway],
    exports: []
})
export class QueueModule { }
