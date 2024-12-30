import { createReadStream } from "fs";
import { createInterface } from "readline";

import {  db } from '@nicestack/common';
import * as tus from "tus-js-client";
import ExcelJS from 'exceljs';

export function truncateStringByByte(str, maxBytes) {
    let byteCount = 0;
    let index = 0;
    while (index < str.length && byteCount + new TextEncoder().encode(str[index]).length <= maxBytes) {
        byteCount += new TextEncoder().encode(str[index]).length;
        index++;
    }
    return str.substring(0, index) + (index < str.length ? "..." : "");
}
export async function loadPoliciesFromCSV(filePath: string) {
    const policies = {
        p: [],
        g: []
    };
    const stream = createReadStream(filePath);
    const rl = createInterface({
        input: stream,
        crlfDelay: Infinity
    });

    // Updated regex to handle commas inside parentheses as part of a single field
    const regex = /(?:\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)|"(?:\\"|[^"])*"|[^,"()\s]+)(?=\s*,|\s*$)/g;

    for await (const line of rl) {
        // Ignore empty lines and comments
        if (line.trim() && !line.startsWith("#")) {
            const parts = [];
            let match;
            while ((match = regex.exec(line)) !== null) {
                // Remove quotes if present and trim whitespace
                parts.push(match[0].replace(/^"|"$/g, '').trim());
            }

            // Check policy type (p or g)
            const ptype = parts[0];
            const rule = parts.slice(1);

            if (ptype === 'p' || ptype === 'g') {
                policies[ptype].push(rule);
            } else {
                console.warn(`Unknown policy type '${ptype}' in policy: ${line}`);
            }
        }
    }

    return policies;
}

export function uploadFile(blob: any, fileName: string) {
    return new Promise((resolve, reject) => {
        const upload = new tus.Upload(blob, {
            endpoint: `${process.env.TUS_URL}/files/`,
            retryDelays: [0, 1000, 3000, 5000],
            metadata: {
                filename: fileName,
                filetype:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
            onError: (error) => {
                console.error("Failed because: " + error);
                reject(error); // 错误时，我们要拒绝 promise
            },
            onProgress: (bytesUploaded, bytesTotal) => {
                const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
                // console.log(bytesUploaded, bytesTotal, `${percentage}%`);
            },
            onSuccess: () => {
                // console.log('Upload finished:', upload.url);
                resolve(upload.url); // 成功后，我们解析 promise，并返回上传的 URL
            },
        });
        upload.start();
    });
}


class TreeNode {
    value: string;
    children: TreeNode[];

    constructor(value: string) {
        this.value = value;
        this.children = [];
    }

    addChild(childValue: string): TreeNode {
        let newChild = undefined
        if (this.children.findIndex(child => child.value === childValue) === -1) {
            newChild = new TreeNode(childValue);
            this.children.push(newChild)

        }
        return this.children.find(child => child.value === childValue)

    }
}
function buildTree(data: string[][]): TreeNode {
    const root = new TreeNode('root');
    try {
        for (const path of data) {
            let currentNode = root;
            for (const value of path) {
                currentNode = currentNode.addChild(value);
            }
        }
        return root;
    }
    catch (error) {
        console.error(error)
    }


}
export function printTree(node: TreeNode, level: number = 0): void {
    const indent = '  '.repeat(level);
    // console.log(`${indent}${node.value}`);
    for (const child of node.children) {
        printTree(child, level + 1);
    }
}
export async function generateTreeFromFile(file: Buffer): Promise<TreeNode> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file);
    const worksheet = workbook.getWorksheet(1);

    const data: string[][] = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row if any
            const rowData: string[] = (row.values as string[]).slice(2).map(cell => (cell || '').toString());
            data.push(rowData.map(value => value.trim()));
        }
    });
    // Fill forward values
    for (let i = 1; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            if (!data[i][j]) data[i][j] = data[i - 1][j];
        }
    }
    return buildTree(data);
}