import { Injectable, Logger } from '@nestjs/common';
import { db, InitRoles, InitTaxonomies, ObjectType } from "@nicestack/common";
import { AuthService } from '@server/auth/auth.service';
import { MinioService } from '@server/minio/minio.service';

@Injectable()
export class InitService {
    private readonly logger = new Logger(InitService.name);
    constructor(private readonly authService: AuthService, private readonly minioService: MinioService) { }
    private async createRoles() {
        this.logger.log('Checking existing system roles');
        for (const role of InitRoles) {
            const existingRole = await db.role.findUnique({
                where: { name: role.name },
            });

            if (!existingRole) {
                this.logger.log(`Creating role: ${role.name}`);
                await db.role.create({
                    data: { ...role, system: true },
                });
            } else {
                this.logger.log(`Role already exists: ${role.name}`);
            }
        }
    }
    private async createTaxonomy() {
        this.logger.log('Checking existing taxonomies');
        const existingTaxonomies = await db.taxonomy.findMany();
        const existingTaxonomyNames = existingTaxonomies.map(taxonomy => taxonomy.name);
        for (const [index, taxonomy] of InitTaxonomies.entries()) {
            if (!existingTaxonomyNames.includes(taxonomy.name)) {
                this.logger.log(`Creating taxonomy: ${taxonomy.name}`);
                await db.taxonomy.create({
                    data: {
                        ...taxonomy,
                        order: index,
                    },
                });
            } else {
                this.logger.log(`Taxonomy already exists: ${taxonomy.name}`);
            }
        }
    }
    private async createBucket() {
        await this.minioService.createBucket('app')
    }
    private async createRoot() {
        this.logger.log('Checking for root account');
        const rootAccountExists = await db.staff.findFirst({
            where: {
                OR: [
                    {
                        phoneNumber: process.env.ADMIN_PHONE_NUMBER || '000000'
                    },
                    {
                        username: 'root'
                    }
                ]
            },
        });
        if (!rootAccountExists) {
            this.logger.log('Creating root account');
            const rootStaff = await this.authService.signUp({
                username: 'root',
                password: 'root'
            })
            const rootRole = await db.role.findUnique({
                where: { name: '根管理员' },
            });
            if (rootRole) {
                this.logger.log('Assigning root role to root account');
                await db.roleMap.create({
                    data: {
                        objectType: ObjectType.STAFF,
                        objectId: rootStaff.id,
                        roleId: rootRole.id,
                    },
                });
            } else {
                this.logger.error('Root role does not exist');
            }
        } else {
            this.logger.log('Root account already exists');
        }
    }

    async init() {
        this.logger.log('Initializing system roles');
        await this.createRoles();

        this.logger.log('Initializing root account');
        await this.createRoot();

        this.logger.log('Initializing taxonomies');
        await this.createTaxonomy();

        this.logger.log('Initialize minio')
        await this.createBucket()
    }
}
