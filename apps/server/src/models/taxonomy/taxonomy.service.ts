import { Injectable } from '@nestjs/common';
import { db, TaxonomyMethodSchema,  Prisma } from '@nicestack/common';
import { redis } from '@server/utils/redis/redis.service';
import { deleteByPattern } from '@server/utils/redis/utils';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

@Injectable()
export class TaxonomyService {
  constructor() { }

  /**
   * 清除分页缓存，删除所有以'taxonomies:page:'开头的键
   */
  private async invalidatePaginationCache() {
    deleteByPattern('taxonomies:page:*')
  }

  /**
   * 创建新的分类记录
   * @param input 分类创建信息
   * @returns 新创建的分类记录
   */
  async create(input: z.infer<typeof TaxonomyMethodSchema.create>) {
    // 获取当前分类数量，设置新分类的order值为count + 1
    const count = await db.taxonomy.count();
    const taxonomy = await db.taxonomy.create({
      data: { ...input, order: count + 1 },
    });

    // 删除该分类的缓存及分页缓存
    await redis.del(`taxonomy:${taxonomy.id}`);
    await this.invalidatePaginationCache();
    return taxonomy;
  }

  /**
   * 根据name查找分类记录
   * @param input 包含分类name的对象
   * @returns 查找到的分类记录
   */
  async findByName(input: z.infer<typeof TaxonomyMethodSchema.findByName>) {
    const { name } = input;
    const cacheKey = `taxonomy:${name}`;
    let cachedTaxonomy = await redis.get(cacheKey);
    if (cachedTaxonomy) {
      return JSON.parse(cachedTaxonomy);
    }
    const taxonomy = await db.taxonomy.findUnique({ where: { name } });
    if (taxonomy) {
      await redis.setex(cacheKey, 60, JSON.stringify(taxonomy));
    }
    return taxonomy;
  }
  async findBySlug(input: z.infer<typeof TaxonomyMethodSchema.findBySlug>) {
    const { slug } = input;
    const cacheKey = `taxonomy-slug:${slug}`;
    let cachedTaxonomy = await redis.get(cacheKey);
    if (cachedTaxonomy) {
      return JSON.parse(cachedTaxonomy);
    }
    const taxonomy = await db.taxonomy.findUnique({ where: { slug } });
    if (taxonomy) {
      await redis.setex(cacheKey, 60, JSON.stringify(taxonomy));
    }
    return taxonomy;
  }
  /**
   * 根据ID查找分类记录
   * @param input 包含分类ID的对象
   * @returns 查找到的分类记录
   */
  async findById(input: z.infer<typeof TaxonomyMethodSchema.findById>) {
    const cacheKey = `taxonomy:${input.id}`;
    let cachedTaxonomy = await redis.get(cacheKey);
    if (cachedTaxonomy) {
      return JSON.parse(cachedTaxonomy);
    }
    const taxonomy = await db.taxonomy.findUnique({ where: { id: input.id } });
    if (taxonomy) {
      await redis.setex(cacheKey, 60, JSON.stringify(taxonomy));
    }
    return taxonomy;
  }

  /**
   * 更新分类记录
   * @param input 包含ID和其他更新字段的对象
   * @returns 更新后的分类记录
   */
  async update(input: any) {
    const { id, ...data } = input;
    const updatedTaxonomy = await db.taxonomy.update({ where: { id }, data });

    // 删除该分类的缓存及分页缓存
    await redis.del(`taxonomy:${updatedTaxonomy.id}`);
    await this.invalidatePaginationCache();
    return updatedTaxonomy;
  }

  /**
   * 删除分类记录（软删除）
   * @param input 包含分类ID的对象
   * @returns 删除后的分类记录
   */
  async delete(input: any) {
    const deletedTaxonomy = await db.taxonomy.update({
      where: { id: input.id },
      data: { deletedAt: new Date() },
    });

    // 删除该分类的缓存及分页缓存
    await redis.del(`taxonomy:${deletedTaxonomy.id}`);
    await this.invalidatePaginationCache();
    return deletedTaxonomy;
  }

  /**
   * 批量删除分类记录（软删除）
   * @param input 包含要删除的分类ID数组的对象
   * @returns 删除操作结果，包括删除的记录数
   */
  async deleteMany(input: any) {
    const { ids } = input;
    if (!ids || ids.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No IDs provided for deletion.',
      });
    }
    const deletedTaxonomies = await db.taxonomy.updateMany({
      where: {
        id: { in: ids },
      },
      data: { deletedAt: new Date() },
    });
    // 删除每个分类的缓存及分页缓存
    await Promise.all(
      ids.map(async (id: string) => redis.del(`taxonomy:${id}`)),
    );
    await this.invalidatePaginationCache();
    return { success: true, count: deletedTaxonomies.count };
  }

  /**
   * 分页查询分类记录
   * @param input 包含分页参数的对象
   * @returns 分类列表及总记录数
   */
  async paginate(input: any) {
    const cacheKey = `taxonomies:page:${input.page}:size:${input.pageSize}`;
    let cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    const { page, pageSize } = input;
    const [items, totalCount] = await Promise.all([
      db.taxonomy.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { order: 'asc' },
        where: { deletedAt: null },
      }),
      db.taxonomy.count({ where: { deletedAt: null } }),
    ]);
    const result = { items, totalCount };

    // 缓存结果并设置过期时间
    await redis.setex(cacheKey, 60, JSON.stringify(result));
    return result;
  }

  /**
   * 获取所有未删除的分类记录
   * @returns 分类记录列表
   */
  async getAll(input: z.infer<typeof TaxonomyMethodSchema.getAll>) {
    const { type } = input;
    let filter: Prisma.TaxonomyWhereInput = {
      deletedAt: null,
    };

    if (type !== undefined) {
      filter = {
        ...filter,
        OR: [
          { objectType: { has: type } }, // objectType 包含 type
        ],
      };
    }
    return db.taxonomy.findMany({
      where: filter,
      orderBy: { order: 'asc' },
      select: {
        name: true,
        id: true,
        slug: true,
        objectType: true,
        order: true,
      }
    });
  }
}
