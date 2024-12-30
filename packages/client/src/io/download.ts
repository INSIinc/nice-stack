/**
 * 处理文件下载功能
 * @param url - 要下载的文件URL，可能为undefined
 * @throws {Error} 当URL无效或下载过程中发生错误时抛出异常
 */
export const handleDownload = (url: string | undefined): void => {
    if (!url) {
        throw new Error("Invalid URL provided for download");
    }
    const link = document.createElement("a");
    try {
        link.href = url;
        link.download = extractFileNameFromUrl(url);
        link.style.display = "none"; // 避免影响页面布局
        document.body.appendChild(link);
        link.click();
    } finally {
        // 确保无论成功与否都清理DOM元素
        if (link) {
            document.body.removeChild(link);
        }
    }
};

/**
 * 从URL中提取文件名，若无法提取则返回随机文件名
 * @param url - 文件URL
 * @returns 提取的文件名或随机文件名
 */
const extractFileNameFromUrl = (url: string): string => {
    const fileName = url.split("/").pop();
    return fileName ? fileName : generateRandomFileName();
};

/**
 * 生成随机文件名
 * @returns 随机文件名
 */
const generateRandomFileName = (): string => {
    const randomString = Math.random().toString(36).substring(2, 15);
    return `file_${randomString}`;
};