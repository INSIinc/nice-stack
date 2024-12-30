import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { MessageService } from './message.service';
import { ChangedRows, Prisma } from '@nicestack/common';
import { z, ZodType } from 'zod';
const MessageUncheckedCreateInputSchema: ZodType<Prisma.MessageUncheckedCreateInput> = z.any()
const MessageWhereInputSchema: ZodType<Prisma.MessageWhereInput> = z.any()
const MessageSelectSchema: ZodType<Prisma.MessageSelect> = z.any()
@Injectable()
export class MessageRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly messageService: MessageService,
  ) { }
  router = this.trpc.router({
    create: this.trpc.procedure
      .input(MessageUncheckedCreateInputSchema)
      .mutation(async ({ ctx, input }) => {
        const { staff } = ctx;
        return await this.messageService.create({ data: input }, { staff });
      }),
    findManyWithCursor: this.trpc.protectProcedure
      .input(z.object({
        cursor: z.any().nullish(),
        take: z.number().nullish(),
        where: MessageWhereInputSchema.nullish(),
        select: MessageSelectSchema.nullish()
      }))
      .query(async ({ ctx, input }) => {
        const { staff } = ctx;
        return await this.messageService.findManyWithCursor(input, staff);
      }),
    getUnreadCount: this.trpc.protectProcedure
      .query(async ({ ctx }) => {
        const { staff } = ctx;
        return await this.messageService.getUnreadCount(staff);
      })
  })
}
