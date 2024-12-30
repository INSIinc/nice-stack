import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
    private readonly logger = new Logger(MinioService.name)
    private readonly minioClient: Minio.Client;
    constructor() {
        this.minioClient = new Minio.Client({
            endPoint: process.env.MINIO_HOST || 'localhost',
            port: parseInt(process.env.MINIO_PORT || '9000'),
            useSSL: false,
            accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
        });
    }
    async createBucket(bucketName: string): Promise<void> {
        const exists = await this.minioClient.bucketExists(bucketName);
        if (!exists) {
            await this.minioClient.makeBucket(bucketName, '');
            this.logger.log(`Bucket ${bucketName} created successfully.`);
        } else {
            this.logger.log(`Bucket ${bucketName} already exists.`);
        }
    }
}
