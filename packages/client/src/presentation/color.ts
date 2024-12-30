import tinycolor from 'tinycolor2';

/**
 * 淡化指定颜色的函数
 * @param color - 输入的颜色，可以是任意有效的 CSS 颜色格式
 * @param amount - 淡化的程度，范围从 0 到 100
 * @returns 淡化后的颜色字符串
 */
export function lightenColor(color: string, amount: number): string {
    const tinyColorInstance = tinycolor(color);
    const lightenedColor = tinyColorInstance.lighten(amount);
    return lightenedColor.toString();
}