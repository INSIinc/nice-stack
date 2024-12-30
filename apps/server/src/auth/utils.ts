import { DepartmentService } from '@server/models/department/department.service';
import {
  UserProfile,
  db,
  JwtPayload,
  RolePerms,
  ObjectType,
} from '@nicestack/common';
import { JwtService } from '@nestjs/jwt';
import { env } from '@server/env';
import { redis } from '@server/utils/redis/redis.service';
import EventBus from '@server/utils/event-bus';
import { RoleMapService } from '@server/models/rbac/rolemap.service';

interface ProfileResult {
  staff: UserProfile | undefined;
  error?: string;
}

interface TokenVerifyResult {
  id?: string;
  error?: string;
}

export class UserProfileService {
  public static readonly instance = new UserProfileService();

  private readonly CACHE_TTL = 3600; // 缓存时间1小时
  private readonly jwtService: JwtService;
  private readonly departmentService: DepartmentService;
  private readonly roleMapService: RoleMapService;

  private constructor() {
    this.jwtService = new JwtService();
    this.departmentService = new DepartmentService();
    this.roleMapService = new RoleMapService(this.departmentService);
    EventBus.on("dataChanged", ({ type, data }) => {
      if (type === ObjectType.STAFF) {
        // 确保 data 是数组，如果不是则转换为数组
        const dataArray = Array.isArray(data) ? data : [data];
        for (const item of dataArray) {
          if (item.id) {
            redis.del(this.getProfileCacheKey(item.id));
          }
        }
      }
    });

  }
  public getProfileCacheKey(id: string) {
    return `user-profile-${id}`;
  }
  /**
   * 验证并解析token
   */
  public async verifyToken(token?: string): Promise<TokenVerifyResult> {
    if (!token) {
      return {};
    }
    try {
      const { sub: id } = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: env.JWT_SECRET,
      });
      return { id };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : 'Token verification failed',
      };
    }
  }

  /**
   * 通过Token获取用户信息
   */
  public async getUserProfileByToken(token?: string): Promise<ProfileResult> {
    const { id, error } = await this.verifyToken(token);
    if (error) {
      return {
        staff: undefined,
        error,
      };
    }
    return await this.getUserProfileById(id);
  }

  /**
   * 通过用户ID获取用户信息
   */
  public async getUserProfileById(id?: string): Promise<ProfileResult> {
    if (!id) {
      return { staff: undefined };
    }
    try {
      const cachedProfile = await this.getCachedProfile(id);
      if (cachedProfile) {
        return { staff: cachedProfile };
      }
      const staff = await this.getBaseProfile(id);
      if (!staff) {
        throw new Error(`User with id ${id} does not exist`);
      }

      await this.populateStaffExtras(staff);
      await this.cacheProfile(id, staff);

      return { staff };
    } catch (error) {
      return {
        staff: undefined,
        error:
          error instanceof Error ? error.message : 'Failed to get user profile',
      };
    }
  }

  /**
   * 从缓存获取用户信息
   */
  private async getCachedProfile(id: string): Promise<UserProfile | null> {
    const cachedData = await redis.get(this.getProfileCacheKey(id));
    if (!cachedData) return null;

    try {
      const profile = JSON.parse(cachedData) as UserProfile;
      return profile.id === id ? profile : null;
    } catch {
      return null;
    }
  }

  /**
   * 缓存用户信息
   */
  private async cacheProfile(id: string, profile: UserProfile): Promise<void> {
    await redis.set(
      this.getProfileCacheKey(id),
      JSON.stringify(profile),
      'EX',
      this.CACHE_TTL,
    );
  }

  /**
   * 获取基础用户信息
   */
  private async getBaseProfile(id: string): Promise<UserProfile | null> {
    return (await db.staff.findUnique({
      where: { id },
      select: {
        id: true,
        deptId: true,
        department: true,
        domainId: true,
        domain: true,
        showname: true,
        username: true,
        phoneNumber: true,
      },
    })) as unknown as UserProfile;
  }

  /**
   * 填充用户权限信息
   */
  private async populateStaffExtras(staff: UserProfile): Promise<void> {
    const [deptIds, parentDeptIds, permissions] = await Promise.all([
      staff.deptId
        ? this.departmentService.getDescendantIdsInDomain(staff.deptId)
        : [],
      staff.deptId
        ? this.departmentService.getAncestorIds([staff.deptId])
        : [],
      this.roleMapService.getPermsForObject({
        domainId: staff.domainId,
        staffId: staff.id,
        deptId: staff.deptId,
      }) as Promise<RolePerms[]>,
    ]);

    Object.assign(staff, {
      deptIds,
      parentDeptIds,
      permissions,
    });
  }
}
