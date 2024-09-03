import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { TransformService } from './transform.service';


@Injectable()
export class TransformRouter {
    constructor(private readonly trpc: TrpcService, private readonly transformService: TransformService) { }

    router = this.trpc.router({

    });
}
