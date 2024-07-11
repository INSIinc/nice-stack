import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { HelloService } from './hello.service';

@Injectable()
export class HelloRouter {
    constructor(private readonly trpc: TrpcService, private readonly hello: HelloService) { }
    router = this.trpc.router({
        hello: this.trpc.procedure.query(() => this.hello.helloWorld()),
    });
}

