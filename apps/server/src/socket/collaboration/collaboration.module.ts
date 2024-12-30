import { Module } from '@nestjs/common';
import { YjsServer } from './yjs.server';

@Module({
  providers: [YjsServer],
  exports: [YjsServer]
})
export class CollaborationModule { }
