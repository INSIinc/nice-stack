import { Injectable, Logger } from '@nestjs/common';
import { DepartmentService } from '@server/models/department/department.service';
import { AppConfigService } from '@server/models/app-config/app-config.service';
import { TermService } from '@server/models/term/term.service';
import {
  db,
  Department,
  getRandomElement,
  getRandomElements,
  Staff,
  TaxonomySlug,
  Term,
  TroubleType,
} from '@nicestack/common';
import * as argon2 from 'argon2';
import EventBus from '@server/utils/event-bus';
import {
  calculateTroubleAttributes,
  capitalizeFirstLetter,
  determineState,
  DevDataCounts,
  getCounts,
  getRandomImageLinks
} from './utils';
import { StaffService } from '@server/models/staff/staff.service';
@Injectable()
export class GenDevService {
  private readonly logger = new Logger(GenDevService.name);
  counts = {} as DevDataCounts;
  deptStaffRecord: Record<string, Staff[]> = {};
  terms: Record<TaxonomySlug, Term[]> = {
    [TaxonomySlug.CATEGORY]: [],
    [TaxonomySlug.UNIT]: [],
    [TaxonomySlug.TAG]: [],
  };
  depts: Department[] = [];
  domains: Department[] = [];
  domainDepts: Record<string, Department[]> = {};
  staffs: Staff[] = [];
  deptGeneratedCount = 0;
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly departmentService: DepartmentService,
    private readonly staffService: StaffService,
    private readonly termService: TermService,
  ) { }
  async genDataEvent() {
    EventBus.emit('genDataEvent', { type: 'start' });
    try {
      await this.calculateCounts();
      await this.generateDepartments(3, 6);
      await this.generateTerms(2, 6);
      await this.generateStaffs(4);

    } catch (err) {
      this.logger.error(err);
    }
    EventBus.emit('genDataEvent', { type: 'end' });
  }
  private async calculateCounts() {
    this.counts = await getCounts();
    Object.entries(this.counts).forEach(([key, value]) => {
      this.logger.log(`${capitalizeFirstLetter(key)} count: ${value}`);
    });
  }
  private async generateTerms(depth: number = 2, count: number = 10) {
    if (this.counts.termCount === 0) {
      this.logger.log('Generate terms');
      await this.createTerms(null, TaxonomySlug.CATEGORY, depth, count);
      const domains = this.depts.filter((item) => item.isDomain);
      for (const domain of domains) {
        await this.createTerms(domain, TaxonomySlug.CATEGORY, depth, count);
        await this.createTerms(domain, TaxonomySlug.UNIT, depth, count);
      }
    }
    const termCount = await db.term.count();
    this.logger.log(`terms ${termCount} generated`);
  }
  private async generateDepartments(depth: number = 3, count: number = 6) {
    if (this.counts.deptCount !== 0) return;
    const totalDepts = this.calculateTotalDepartments(depth, count);
    this.logger.log('Starting department generation...');
    await this.generateSubDepartments(null, 1, depth, count, totalDepts);
    this.depts = await db.department.findMany();
    this.domains.forEach((domain) => {
      this.domainDepts[domain.id] = this.getAllChildDepartments(domain.id);
      this.logger.log(
        `Domain: ${domain.name} has ${this.domainDepts[domain.id].length} child departments`,
      );
    });
    this.logger.log(`Completed: Generated ${this.depts.length} departments.`);
  }

  private async generateSubDepartments(
    parentId: string,
    currentDepth: number,
    maxDepth: number,
    count: number,
    total: number,
  ) {
    if (currentDepth > maxDepth) return;

    for (let i = 0; i < count; i++) {
      const deptName = `${parentId?.slice(0, 4) || '根'}公司${currentDepth}-${i}`;
      const newDept = await this.createDepartment(
        deptName,
        parentId,
        currentDepth,
      );
      if (newDept.isDomain) {
        this.domains.push(newDept);
      }
      this.deptGeneratedCount++;
      this.logger.log(
        `Generated ${this.deptGeneratedCount}/${total} departments`,
      );
      await this.generateSubDepartments(
        newDept.id,
        currentDepth + 1,
        maxDepth,
        count,
        total,
      );
    }
  }

  // Helper function to calculate the total number of departments to be generated
  private calculateTotalDepartments(depth: number, count: number): number {
    // The total number of departments is the sum of departments at each level.
    let total = 0;
    for (let i = 1; i <= depth; i++) {
      total += Math.pow(count, i);
    }
    return total;
  }

  private getAllChildDepartments(domainId: string): Department[] {
    const children: Department[] = [];
    const collectChildren = (parentId: string) => {
      const directChildren = this.depts.filter(
        (dept) => dept.parentId === parentId,
      );
      children.push(...directChildren);
      directChildren.forEach((child) => {
        collectChildren(child.id);
      });
    };
    collectChildren(domainId);
    return children;
  }
  private async generateStaffs(countPerDept: number = 3) {
    if (this.counts.staffCount === 1) {
      this.logger.log('Generating staffs...');
      // Calculate the total number of staffs to be generated
      const totalStaffs = this.domains.reduce((sum, domain) => {
        return sum + (this.domainDepts[domain.id]?.length || 0) * countPerDept;
      }, 0);
      let staffsGenerated = 0;
      for (const domain of this.domains) {
        for (const dept of this.domainDepts[domain.id]) {
          if (!this.deptStaffRecord[dept.id]) {
            this.deptStaffRecord[dept.id] = [];
          }
          for (let i = 0; i < countPerDept; i++) {
            const staff = await this.staffService.create({
              data: {
                showname: `${dept.name}-user${i}`,
                username: `${dept.name}-user${i}`,
                deptId: dept.id,
                domainId: domain.id
              }
            });
            // Update both deptStaffRecord and staffs array
            this.deptStaffRecord[dept.id].push(staff);
            staffsGenerated++;
            // Log the progress after each staff is created
            this.logger.log(
              `Generated ${staffsGenerated}/${totalStaffs} staffs`,
            );
          }
        }
      }
    }
  }


  private async createDepartment(
    name: string,
    parentId?: string,
    currentDepth: number = 1,
  ) {
    const department = await this.departmentService.create({
      data: {
        name,
        isDomain: currentDepth === 1 ? true : false,
        parentId,
      }
    });
    return department;
  }
  private async createTerms(
    domain: Department,
    taxonomySlug: TaxonomySlug,
    depth: number,
    nodesPerLevel: number,
  ) {
    const taxonomy = await db.taxonomy.findFirst({
      where: { slug: taxonomySlug },
    });
    let counter = 1;
    const createTermTree = async (
      parentId: string | null,
      currentDepth: number,
    ) => {
      if (currentDepth > depth) return;
      for (let i = 0; i < nodesPerLevel; i++) {
        const name = `${taxonomySlug}-${domain?.name || 'public'}-${currentDepth}-${counter++} `;
        const newTerm = await this.termService.create({
          data: {
            name,
            taxonomyId: taxonomy.id,
            domainId: domain?.id,
            parentId,
          }
        });
        this.terms[taxonomySlug].push(newTerm);
        await createTermTree(newTerm.id, currentDepth + 1);
      }
    };
    // Start creating the tree from root level

    await createTermTree(null, 1);
  }
}
