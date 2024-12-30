import React, { useState } from "react";
import { Upload, message } from "antd";
import { InboxOutlined, FileExcelOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload/interface";

interface ExcelToBase64UploaderProps {
	onBase64: (base64: string) => void;
}

const ExcelToBase64Uploader: React.FC<ExcelToBase64UploaderProps> = ({
	onBase64,
}) => {
	const [fileName, setFileName] = useState<string>("");

	const beforeUpload = (file: RcFile): boolean => {
		const isExcel =
			file.type ===
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
			file.type === "application/vnd.ms-excel" ||
			file.name.endsWith(".xls") ||
			file.name.endsWith(".xlsx");
		if (!isExcel) {
			message.error("请选择一个有效的 Excel 文件");
			return false;
		}
		return true;
	};

	const handleFileChange = async (file: RcFile) => {
		try {
			const base64 = await fileToBase64(file);
			onBase64(base64);
			setFileName(file.name);
		} catch (err: any) {
			message.error("文件转换失败");
			console.error(err);
		}
	};

	const fileToBase64 = (file: RcFile): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result;
				if (typeof result === "string") {
					resolve(result.split(",")[1]); // 返回 base64 部分
				} else {
					reject(new Error("无法读取文件"));
				}
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	};

	return (
		<div>
			<Upload.Dragger
				beforeUpload={beforeUpload}
				customRequest={({ file, onSuccess }) => {
					handleFileChange(file as RcFile);
					onSuccess && onSuccess("ok");
				}}
				showUploadList={false}
				style={{
					width: "100%",
					padding: "20px",
					border: "1px dashed #d9d9d9",
					borderRadius: "4px",
				}}>
				<p className="ant-upload-drag-icon">
					{fileName ? <FileExcelOutlined /> : <InboxOutlined />}
				</p>
				<p className="ant-upload-text">
					{fileName || "点击或拖拽文件到此区域进行上传"}
				</p>
				{!fileName && (
					<p className="ant-upload-hint">仅支持 .xls 和 .xlsx 文件</p>
				)}
			</Upload.Dragger>
		</div>
	);
};

export default ExcelToBase64Uploader;
