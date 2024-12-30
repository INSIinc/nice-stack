import { Module } from '@nestjs/common';
import { RealtimeServer } from './realtime.server';


@Module({
    providers: [ RealtimeServer],
    exports: [ RealtimeServer]
})
export class RealTimeModule { }
