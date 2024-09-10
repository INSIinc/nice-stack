import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
    z,
    db,
    Prisma,
    Staff,
    TransformSchema
} from '@nicestack/common';
import * as dayjs from 'dayjs';
import { StaffService } from '../models/staff/staff.service';
import { DepartmentService } from '../models/department/department.service';
import { TaxonomyService } from '@server/models/taxonomy/taxonomy.service';

class TreeNode {
    value: string;
    children: TreeNode[];

    constructor(value: string) {
        this.value = value;
        this.children = [];
    }

    addChild(childValue: string): TreeNode {
        let newChild = undefined;
        if (this.children.findIndex((child) => child.value === childValue) === -1) {
            newChild = new TreeNode(childValue);
            this.children.push(newChild);
        }
        return this.children.find((child) => child.value === childValue);
    }
}

@Injectable()
export class TransformService {
    constructor(
        private readonly departmentService: DepartmentService,
        private readonly staffService: StaffService,
        private readonly taxonomyService: TaxonomyService,
    ) { }
    private readonly logger = new Logger(TransformService.name);

    excelDateToISO(excelDate: number) {
        // 设置 Excel 序列号的起点
        const startDate = dayjs('1899-12-31');
        // 加上 Excel 中的天数（注意必须减去2，因为 Excel 错误地把1900年当作闰年）
        const date = startDate.add(excelDate, 'day');
        // 转换为 ISO 字符串
        return date.toDate();
    }
    async getDepts(domainId: string, cellStr: string) {
        const pattern = /[\s、，,；.。;\n]+/;
        const depts: string[] = [];
        if (pattern.test(cellStr)) {
            const deptNames = cellStr.split(pattern);
            for (const name of deptNames) {
                const dept = await this.departmentService.findByNameInDom(
                    domainId,
                    name,
                );
                if (dept) depts.push(dept.id);
            }
        } else {
            const dept = await this.departmentService.findByNameInDom(
                domainId,
                cellStr,
            );
            if (dept) depts.push(dept.id);
        }

        if (depts.length === 0) {
            this.logger.error(`未找到单位：${cellStr}`);
        }
        return depts;
    }
    async getStaffs(deptIds: string[], cellStr: string) {
        const staffs: string[] = [];
        const pattern = /[\s、，,；.。;\n]+/;
        const allStaffsArrays = await Promise.all(
            deptIds.map((deptId) => this.staffService.findByDept({ deptId })),
        );
        const combinedStaffs = allStaffsArrays.reduce(
            (acc, curr) => acc.concat(curr),
            [],
        );
        if (pattern.test(cellStr)) {
            const staffNames = cellStr.split(pattern);

            for (const name of staffNames) {
                if (combinedStaffs.map((staff, index) => staff.showname).includes(name)) {
                    const staffWithName = combinedStaffs.find(
                        (staff) => staff.showname === name,
                    );
                    if (staffWithName) {
                        // 将该员工的 ID 添加到 staffIds 数组中
                        staffs.push(staffWithName.id);
                    }
                }
                // if (staff) staffs.push(staff.staffId);
            }
        } else {
            // const staff = await this.lanxin.getStaffsByDepartment(deptIds);
            // if (staff) staffs.push(staff.staffId);
            if (combinedStaffs.map((staff, index) => staff.showname).includes(cellStr)) {
                const staffWithName = combinedStaffs.find(
                    (staff) => staff.showname === cellStr,
                );
                if (staffWithName) {
                    // 将该员工的 ID 添加到 staffIds 数组中
                    staffs.push(staffWithName.id);
                }
            }
        }
        if (staffs.length === 0) {
            this.logger.error(`未找到人员：${cellStr}`);
        }
        return staffs;
    }

    buildTree(data: string[][]): TreeNode {
        const root = new TreeNode('root');
        try {
            for (const path of data) {
                let currentNode = root;
                for (const value of path) {
                    currentNode = currentNode.addChild(value);
                }
            }
            return root;
        } catch (error) {
            console.error(error);
        }
    }
    async generateTreeFromFile(file: Buffer): Promise<{ tree: TreeNode }> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file);
        const worksheet = workbook.getWorksheet(1);

        const data: string[][] = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                // Skip header row if any
                try {
                    const rowData: string[] = (row.values as string[])
                        .slice(2)
                        .map((cell) => (cell || '').toString());
                    data.push(rowData.map((value) => value.trim()));
                } catch (error) {
                    throw new Error(`发生报错！位于第${rowNumber}行,错误: ${error}`);
                }
            }
        });
        // Fill forward values
        for (let i = 1; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                if (!data[i][j]) data[i][j] = data[i - 1][j];
            }
        }
        return { tree: this.buildTree(data) };
    }
    printTree(node: TreeNode, level: number = 0): void {
        const indent = '  '.repeat(level);
        console.log(`${indent}${node.value}`);
        for (const child of node.children) {
            this.printTree(child, level + 1);
        }
    }
    swapKeyValue<T extends Record<string, string>>(
        input: T,
    ): { [K in T[keyof T]]: Extract<keyof T, string> } {
        const result: Partial<{ [K in T[keyof T]]: Extract<keyof T, string> }> = {};
        for (const key in input) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                const value = input[key];
                result[value] = key;
            }
        }
        return result as { [K in T[keyof T]]: Extract<keyof T, string> };
    }
    isEmptyRow(row: any) {
        return row.every((cell: any) => {
            return !cell || cell.toString().trim() === '';
        });
    }

    async importStaffs(data: z.infer<typeof TransformSchema.importStaffs>) {
        const { base64, domainId } = data;
        this.logger.log('开始');
        const buffer = Buffer.from(base64, 'base64');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const importsStaffSchema = z.object({
            name: z.string(),
            phoneNumber: z.string().regex(/^\d+$/), // Assuming phone numbers should be numeric
            deptName: z.string(),
        });
        const worksheet = workbook.getWorksheet(1); // Assuming the data is in the first sheet
        const staffs: { name: string; phoneNumber: string; deptName: string }[] =
            [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                // Assuming the first row is headers
                const name = row.getCell(1).value as string;
                const phoneNumber = row.getCell(2).value as string;
                const deptName = row.getCell(3).value as string;
                try {
                    importsStaffSchema.parse({ name, phoneNumber, deptName });
                    staffs.push({ name, phoneNumber, deptName });
                } catch (error) {
                    throw new Error(`发生报错！位于第${rowNumber}行,错误: ${error}`);
                }
            }
        });
        // 获取所有唯一的部门名称
        const uniqueDeptNames = [...new Set(staffs.map((staff) => staff.deptName))];
        // 获取所有部门名称对应的部门ID
        const deptIdsMap = await this.departmentService.getDeptIdsByNames(
            uniqueDeptNames,
            domainId,
        );
        const count = await db.staff.count();
        // 为员工数据添加部门ID
        const staffsToCreate = staffs.map((staff, index) => ({
            showname: staff.name,
            username: staff.phoneNumber,
            phoneNumber: staff.phoneNumber,
            password: "123456",
            deptId: deptIdsMap[staff.deptName],
            domainId,
            order: index + count,
        }));
        // 批量创建员工数据
        const createdStaffs = await db.staff.createMany({
            data: staffsToCreate,
        });
        return createdStaffs;
    }
    async importTerms(
        staff: Staff,
        data: z.infer<typeof TransformSchema.importTerms>,
    ) {
        const { base64, domainId, taxonomyId, parentId } = data;
        this.logger.log('开始');
        const buffer = Buffer.from(base64, 'base64');
        const { tree: root } = await this.generateTreeFromFile(buffer);

        this.printTree(root);

        const termsData: Prisma.TermCreateManyInput[] = [];
        const termAncestriesData: Prisma.TermAncestryCreateManyInput[] = [];
        if (!taxonomyId) {
            throw new Error('未指定分类！');
        }
        this.logger.log('存在taxonomyId');
        const taxonomy = await db.taxonomy.findUnique({
            where: { id: taxonomyId },
        });
        if (!taxonomy) {
            throw new Error('未找到对应分类');
        }
        const count = await db.term.count({ where: { taxonomyId: taxonomyId } });
        let termIndex = 0;
        this.logger.log(count);

        const gatherTermsData = async (nodes: TreeNode[], depth = 0) => {
            let currentIndex = 0;
            console.log(`depth:${depth}`);
            for (const node of nodes) {
                const termData = {
                    name: node.value,
                    taxonomyId: taxonomyId,
                    domainId: domainId,
                    createdBy: staff.id,
                    order: count + termIndex + 1,
                };
                termsData.push(termData);
                termIndex++;
                // Debug: Log term data preparation
                console.log(`Prepared Term Data:`, termData);

                await gatherTermsData(node.children, depth + 1);
                currentIndex++;
            }
        };
        await gatherTermsData(root.children);
        console.log('最后准备的数据 Terms Data:', termsData);
        let createdTerms: { id: string; name: string }[] = [];
        try {
            createdTerms = await db.term.createManyAndReturn({
                data: termsData,
                select: { id: true, name: true },
            });
            // Debug: Log created terms
            console.log('创建的Terms:', createdTerms);
        } catch (error) {
            console.error('创建Terms报错:', error);
            throw new Error('创建失败');
        }
        const termsUpdate = [];

        const gatherAncestryData = (
            nodes: TreeNode[],
            ancestors: string[] = parentId ? [parentId] : [],
            depth = 0,
        ) => {
            let currentIndex = 0;

            console.log(`depth:${depth}`);
            for (const node of nodes) {
                // if (depth !== 0) {
                const dept = createdTerms.find((dept) => dept.name === node.value);
                if (dept) {
                    termsUpdate.push({
                        where: { id: dept.id },
                        data: { parentId: ancestors[ancestors.length - 1] },
                    });
                    for (let i = 0; i < ancestors.length; i++) {
                        const ancestryData = {
                            ancestorId: ancestors[i],
                            descendantId: dept.id,
                            relDepth: depth - i,
                        };
                        termAncestriesData.push(ancestryData);
                        console.log(`准备好的闭包表数据DeptAncestryData:`, ancestryData);
                    }
                    const newAncestors = [...ancestors, dept.id];
                    gatherAncestryData(node.children, newAncestors, depth + 1);
                }
                currentIndex++;
            }

            // console.log(`depth:${depth}`);
            // for (const node of nodes) {
            //   if (depth !== 0) {
            //     const term = createdTerms.find((term) => term.name === node.value);
            //     if (term) {
            //       termsUpdate.push({
            //         where: { id: term.id },
            //         data: { parentId: ancestors[ancestors.length - 1] },
            //       });
            //       for (let i = 0; i < ancestors.length; i++) {
            //         const ancestryData = {
            //           ancestorId: ancestors[i],
            //           descendantId: term.id,
            //           relDepth: depth - i,
            //         };
            //         termAncestriesData.push(ancestryData);
            //         console.log(`准备好的闭包表数据ATermAncestryData:`, ancestryData);
            //       }
            //       const newAncestors = [...ancestors, term.id];
            //       gatherAncestryData(node.children, newAncestors, depth + 1);
            //     }
            //   } else {
            //     gatherAncestryData(
            //       node.children,
            //       [createdTerms.find((term) => term.name === node.value).id],
            //       depth + 1,
            //     );
            //   }
            //   currentIndex++;
            // }
        };
        gatherAncestryData(root.children);

        this.logger.log('准备好闭包表数据 Ancestries Data:', termAncestriesData);
        try {
            const updatePromises = termsUpdate.map((update) =>
                db.term.update(update),
            );
            await Promise.all(updatePromises);
            await db.termAncestry.createMany({ data: termAncestriesData });

            console.log('Term闭包表 已创建:', termAncestriesData.length);
            return { count: createdTerms.length };
        } catch (error) {
            console.error('Error 更新Term或者创建Terms闭包表失败:', error);
            throw new Error('更新术语信息或者创建术语闭包表失败');
        }
    }
    async importDepts(
        staff: Staff,
        data: z.infer<typeof TransformSchema.importDepts>,
    ) {
        const { base64, domainId, parentId } = data;

        this.logger.log('开始', parentId);
        const buffer = Buffer.from(base64, 'base64');
        const { tree: root } = await this.generateTreeFromFile(buffer);

        this.printTree(root);

        const deptsData: Prisma.DepartmentCreateManyInput[] = [];
        const deptAncestriesData: Prisma.DeptAncestryCreateManyInput[] = [];
        const count = await db.department.count({ where: {} });
        let deptIndex = 0;
        // this.logger.log(count);

        const gatherDeptsData = async (
            nodes: TreeNode[],
            depth = 0,
            dept?: string,
        ) => {
            let currentIndex = 0;
            // console.log(`depth:${depth}`);
            for (const node of nodes) {
                const deptData = {
                    name: node.value,
                    // taxonomyId: taxonomyId,
                    // domainId: domainId,
                    // createdBy: staff.id,

                    order: count + deptIndex + 1,
                };
                deptsData.push(deptData);
                deptIndex++;
                // Debug: Log term data preparation
                console.log(`Prepared Dept Data:`, deptData);

                await gatherDeptsData(node.children, depth + 1);
                currentIndex++;
            }
        };
        await gatherDeptsData(root.children);
        console.log('最后准备的数据 Depts Data:', deptsData);
        let createdDepts: { id: string; name: string }[] = [];
        try {
            createdDepts = await db.department.createManyAndReturn({
                data: deptsData,
                select: { id: true, name: true },
            });
            // Debug: Log created terms
            console.log('创建的Depts:', createdDepts);
        } catch (error) {
            console.error('创建Depts报错:', error);
            throw new Error('创建失败');
        }
        const deptsUpdate = [];
        const gatherAncestryData = (
            nodes: TreeNode[],
            ancestors: string[] = parentId ? [parentId] : [],
            depth = 0,
        ) => {
            let currentIndex = 0;
            console.log(`depth:${depth}`);
            for (const node of nodes) {
                // if (depth !== 0) {
                const dept = createdDepts.find((dept) => dept.name === node.value);
                if (dept) {
                    deptsUpdate.push({
                        where: { id: dept.id },
                        data: { parentId: ancestors[ancestors.length - 1] },
                    });
                    for (let i = 0; i < ancestors.length; i++) {
                        const ancestryData = {
                            ancestorId: ancestors[i],
                            descendantId: dept.id,
                            relDepth: depth - i,
                        };
                        deptAncestriesData.push(ancestryData);
                        console.log(`准备好的闭包表数据DeptAncestryData:`, ancestryData);
                    }
                    const newAncestors = [...ancestors, dept.id];
                    gatherAncestryData(node.children, newAncestors, depth + 1);
                }
                // }
                // else {
                //   const dept = createdDepts.find((dept) => dept.name === node.value);

                //   gatherAncestryData(
                //     node.children,
                //     [createdDepts.find((dept) => dept.name === node.value).id],
                //     depth + 1,
                //   );
                // }
                currentIndex++;
            }
        };
        gatherAncestryData(root.children);

        this.logger.log('准备好闭包表数据 Ancestries Data:', deptAncestriesData);
        try {
            const updatePromises = deptsUpdate.map((update) =>
                db.department.update(update),
            );
            await Promise.all(updatePromises);
            await db.deptAncestry.createMany({ data: deptAncestriesData });
            console.log('Dept闭包表 已创建:', deptAncestriesData.length);
            return { count: createdDepts.length };
        } catch (error) {
            console.error('Error 更新Dept或者创建Depts闭包表失败:', error);
            throw new Error('更新单位信息或者创建单位闭包表失败');
        }
    }

}
