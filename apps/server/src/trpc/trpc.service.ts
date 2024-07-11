import { Injectable } from '@nestjs/common';
import { initTRPC } from '@trpc/server';
import superjson from 'superjson-cjs';

@Injectable()
export class TrpcService {
    trpc = initTRPC.create({
        transformer: superjson
    });
    procedure = this.trpc.procedure;
    router = this.trpc.router;
    mergeRouters = this.trpc.mergeRouters;
}
