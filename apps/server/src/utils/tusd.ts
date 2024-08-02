import * as tus from 'tus-js-client';
import { promises as fs } from 'fs';
import * as mime from 'mime-types';

export const uploader = async (
    endpoint: string = 'http://localhost:8080',
    input: Buffer | string,
    externalFileName: string = 'unknown', // 允许外部传入文件名
    onProgress?: (percentage: number) => void,
    onSuccess?: (url: string) => void,
    onError?: (error: Error) => void
) => {
    let fileBuffer: Buffer;
    let fileName: string;
    let fileType: string;

    // 确定输入是Buffer还是文件路径
    if (typeof input === 'string') {
        try {
            fileBuffer = await fs.readFile(input);
            fileName = input.split('/').pop() || 'unknown';
            fileType = mime.lookup(input) || 'application/octet-stream';
        } catch (error: any) {
            console.error("读取文件失败: " + error.message);
            if (onError) onError(error);
            return;
        }
    } else {
        fileBuffer = input;
        fileName = externalFileName; // 使用外部传入的文件名
        // 尝试获取文件类型，这里简化处理，实际应用中可能需要更复杂的逻辑
        fileType = mime.lookup(fileName) || 'application/octet-stream';
    }

    const upload = new tus.Upload(fileBuffer as any, {
        endpoint: `${endpoint}/files/`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: { filename: fileName, filetype: fileType },
        onError: (error) => {
            console.error("上传失败: " + error.message);
            if (onError) onError(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = (bytesUploaded / bytesTotal) * 100;
            if (onProgress) onProgress(percentage);
        },
        onSuccess: () => {
            console.log("上传完成");
            if (onSuccess) onSuccess(upload.url!);
        },
    });

    // 寻找并继续之前的上传
    upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads && previousUploads.length > 0) {
            upload.resumeFromPreviousUpload(previousUploads[0]!);
        }
    });

    return upload;
};

export const uploaderPromise = (
    endpoint: string,
    input: Buffer | string,
    externalFileName: string = 'unknown', // 允许外部传入文件名
    onProgress?: (percentage: number) => void
): Promise<string> => {
    return new Promise((resolve, reject) => {
        uploader(endpoint, input, externalFileName, onProgress, resolve, reject)
            .then((upload) => {
                upload!.start();
            })
            .catch(reject);
    });
};