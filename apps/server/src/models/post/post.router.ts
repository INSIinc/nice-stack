import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { Prisma } from '@nicestack/common';
import { PostService } from './post.service';
import { z, ZodType } from 'zod';
const PostCreateArgsSchema: ZodType<Prisma.PostCreateArgs> = z.any();
const PostUpdateArgsSchema: ZodType<Prisma.PostUpdateArgs> = z.any();
const PostFindFirstArgsSchema: ZodType<Prisma.PostFindFirstArgs> = z.any();
const PostDeleteManyArgsSchema: ZodType<Prisma.PostDeleteManyArgs> = z.any();
const PostWhereInputSchema: ZodType<Prisma.PostWhereInput> = z.any();
const PostSelectSchema: ZodType<Prisma.PostSelect> = z.any();
const PostUpdateInputSchema: ZodType<Prisma.PostUpdateInput> = z.any();
@Injectable()
export class PostRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly postService: PostService,
  ) { }
  router = this.trpc.router({
    create: this.trpc.protectProcedure
      .input(PostCreateArgsSchema)
      .mutation(async ({ ctx, input }) => {
        const { staff } = ctx;
        return await this.postService.create(input, { staff });
      }),
    softDeleteByIds: this.trpc.protectProcedure
      .input(
        z.object({
          ids: z.array(z.string()),
          data: PostUpdateInputSchema.nullish(),
        }),
      )
      .mutation(async ({ input }) => {
        return await this.postService.softDeleteByIds(input.ids, input.data);
      }),
    restoreByIds: this.trpc.protectProcedure
      .input(
        z.object({
          ids: z.array(z.string()),
          args: PostUpdateInputSchema.nullish(),
        }),
      )
      .mutation(async ({ input }) => {
        return await this.postService.restoreByIds(input.ids, input.args);
      }),
    update: this.trpc.protectProcedure
      .input(PostUpdateArgsSchema)
      .mutation(async ({ ctx, input }) => {
        const { staff } = ctx;
        return await this.postService.update(input, staff);
      }),
    findById: this.trpc.protectProcedure
      .input(z.object({ id: z.string(), args: PostFindFirstArgsSchema }))
      .query(async ({ ctx, input }) => {
        const { staff } = ctx;
        return await this.postService.findById(input.id, input.args);
      }),
    deleteMany: this.trpc.protectProcedure
      .input(PostDeleteManyArgsSchema)
      .mutation(async ({ input }) => {
        return await this.postService.deleteMany(input);
      }),
    findManyWithCursor: this.trpc.protectProcedure
      .input(
        z.object({
          cursor: z.any().nullish(),
          take: z.number().nullish(),
          where: PostWhereInputSchema.nullish(),
          select: PostSelectSchema.nullish(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { staff } = ctx;
        return await this.postService.findManyWithCursor(input, staff);
      }),
  });
}
