import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
@Controller('transform')
export class TransformController {
    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('type') type: string) {
        console.log(file);
        let result = 'test';
        switch (type) {
            default:
                throw new Error(`Unsupported import type: ${type}`);
        }

        return result;
    }
}
