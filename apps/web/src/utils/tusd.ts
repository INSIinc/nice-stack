import * as tus from "tus-js-client";
import imageCompression from "browser-image-compression";
export const uploader = async (
    endpoint: string,
    file: File,
    onProgress?: (percentage: number, speed: number) => void,
    onSuccess?: (url: string) => void,
    onError?: (error: Error) => void
) => {
    let previousUploadedSize = 0;
    let previousTimestamp = Date.now();

    // 压缩图像为WebP格式
    const compressImage = async (file: File): Promise<File> => {
        const options = {
            maxSizeMB: 0.6, // 最大文件大小（MB）
            maxWidthOrHeight: 2560, // 最大宽高
            useWebWorker: true,
            fileType: "image/webp", // 输出文件格式
        };
        const compressedFile = await imageCompression(file, options);
        return new File([compressedFile], `${file.name.split(".")[0]}.webp`, {
            type: "image/webp",
        });
    };

    let fileToUpload: File;

    // 检查并压缩图片文件
    if (file.type.startsWith("image/")) {
        try {
            fileToUpload = await compressImage(file);
        } catch (error: any) {
            console.error("图像压缩失败: " + error.message);
            if (onError) onError(error);
            throw error; // 如果压缩失败，抛出错误并终止上传
        }
    } else {
        fileToUpload = file; // 非图片文件，不进行压缩
    }

    const upload = new tus.Upload(fileToUpload, {
        // Replace this with tusd's upload creation URL
        endpoint: `${endpoint}/files/`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
            filename: fileToUpload.name,
            filetype: fileToUpload.type,
        },
        onError: function (error) {
            console.error("上传失败: " + error.message);
            if (onError) onError(error);
        },
        onProgress: function (bytesUploaded: number, bytesTotal: number) {
            const currentTimestamp = Date.now();
            const timeElapsed = (currentTimestamp - previousTimestamp) / 1000; // in seconds
            const bytesUploadedSinceLastTime = bytesUploaded - previousUploadedSize;
            const speed = bytesUploadedSinceLastTime / timeElapsed; // bytes per second
            previousUploadedSize = bytesUploaded;
            previousTimestamp = currentTimestamp;
            const percentage = (bytesUploaded / bytesTotal) * 100;
            if (onProgress) onProgress(percentage, speed);
        },
        onSuccess: function () {
            console.log("上传文件类型", fileToUpload.type);
            console.log("上传文件名称", fileToUpload.name);
            if (onSuccess) onSuccess(upload.url!);
            console.log("Download %s from %s", fileToUpload.name, upload.url);
        },
    });

    // Check if there are any previous uploads to continue.
    upload.findPreviousUploads().then(function (previousUploads) {
        // Found previous uploads so we select the first one.
        if (previousUploads && previousUploads.length > 0) {
            upload.resumeFromPreviousUpload(previousUploads[0]!);
        }
    });

    return upload;
};

export const uploaderPromise = (
    endpoint: string,
    file: File,
    onProgress?: (percentage: number, speed: number) => void
): Promise<string> => {
    return new Promise((resolve, reject) => {
        uploader(endpoint, file, onProgress, resolve, reject)
            .then((upload) => {
                upload.start();
            })
            .catch(reject);
    });
};