import { Injectable, Logger } from '@nestjs/common';
import { db, InitAppConfigs, InitRoles, InitTaxonomies, ObjectType } from "@nicestack/common";
import { AuthService } from '@server/auth/auth.service';
import { MinioService } from '@server/utils/minio/minio.service';
import { AppConfigService } from '@server/models/app-config/app-config.service';
import { GenDevService } from './gendev.service';

@Injectable()
export class InitService {
    private readonly logger = new Logger(InitService.name);
    constructor(
        private readonly appConfigService: AppConfigService,
        private readonly minioService: MinioService,
        private readonly authService: AuthService,
        private readonly genDevService: GenDevService
    ) { }
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
    private async createOrUpdateTaxonomy() {
        this.logger.log('Checking existing taxonomies');

        const existingTaxonomies = await db.taxonomy.findMany();
        const existingTaxonomyMap = new Map(existingTaxonomies.map(taxonomy => [taxonomy.name, taxonomy]));

        for (const [index, taxonomy] of InitTaxonomies.entries()) {
            const existingTaxonomy = existingTaxonomyMap.get(taxonomy.name);

            if (!existingTaxonomy) {
                // Create new taxonomy
                await db.taxonomy.create({
                    data: {
                        ...taxonomy,
                        order: index,
                    },
                });
                this.logger.log(`Created new taxonomy: ${taxonomy.name}`);
            } else {
                // Check for differences and update if necessary
                const differences = Object.keys(taxonomy).filter(key => taxonomy[key] !== existingTaxonomy[key]);

                if (differences.length > 0) {
                    await db.taxonomy.update({
                        where: { id: existingTaxonomy.id },
                        data: {
                            ...taxonomy,
                            order: index,
                        },
                    });
                    this.logger.log(`Updated taxonomy: ${taxonomy.name}`);
                } else {
                    this.logger.log(`No changes for taxonomy: ${taxonomy.name}`);
                }
            }
        }
    }
    private async createRoot() {
        this.logger.log('Checking for root account');

        const rootAccountExists = await db.staff.findFirst({
            where: {
                OR: [
                    {
                        phoneNumber: process.env.ADMIN_PHONE_NUMBER || '000000',
                    },
                    {
                        username: 'root',
                    },
                ],
            },
        });

        if (!rootAccountExists) {
            this.logger.log('Creating root account');
            const rootStaff = await this.authService.signUp({
                username: 'root',
                password: 'root',
            });
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
    private async createBucket() {
        await this.minioService.createBucket('app')
    }
    private async initAppConfigs() {
        const existingConfigs = await db.appConfig.findMany();
        const existingConfigSlugs = existingConfigs.map((config) => config.slug);
        for (const [index, config] of InitAppConfigs.entries()) {
            if (!existingConfigSlugs.includes(config.slug)) {
                this.logger.log(`create Option Page ${config.title}`);
                await this.appConfigService.create({ data: config });
            } else {
                this.logger.log(`AppConfig already exists: ${config.title}`);
            }
        }
    }
    async init() {
        this.logger.log('Initializing system roles');
        await this.createRoles();
        this.logger.log('Initializing root account');
        await this.createRoot();
        this.logger.log('Initializing taxonomies');
        await this.createOrUpdateTaxonomy()
        this.logger.log('Initialize minio')
        await this.createBucket()
        this.logger.log('Initializing appConfigs');
        await this.initAppConfigs();
        if (process.env.NODE_ENV === 'development') {
            try {
                await this.genDevService.genDataEvent();
            } catch (err: any) {
                this.logger.error(err.message);
            }
        }


    }
}
