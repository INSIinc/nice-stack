// import { api } from "@/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { Button, message } from "antd";
import { useMemo, useRef, useState } from "react";

import { SizeType } from "antd/es/config-provider/SizeContext";
import { useTransform } from "@web/src/hooks/useTransform";
import { api } from "@web/src/utils/trpc";

export function ExcelImporter({
	type = "trouble",
	className,
	name = "导入",
	taxonomyId,
	parentId,
	size = "small",
	domainId,
	refresh = true,
	disabled = false,
	ghost = true,
}: {
	disabled?: boolean;
	type?: "trouble" | "term" | "dept" | "staff";
	className?: string;
	name?: string;
	domainId?: string;
	taxonomyId?: string;
	parentId?: string;
	size?: SizeType;
	refresh?: boolean;
	ghost?: boolean;
}) {
	const fileInput = useRef<HTMLInputElement>(null);
	const [loading, setLoading] = useState(false);
	const { importTerms, importDepts, importStaffs } =
		useTransform();

	return (
		<div className={className}>
			<Button
				size={size}
				ghost={ghost}
				type="primary"
				loading={loading}
				disabled={loading || disabled}
				onClick={() => {
					fileInput.current?.click();
				}}>
				{name}
			</Button>
			<input
				ref={fileInput}
				accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				type="file"
				onChange={async (e) => {
					const files = Array.from(e.target.files || []);
					if (!files.length) return; // 如果没有文件被选中, 直接返回

					const file = files[0];
					if (file) {
						const isExcel =
							file.type === "application/vnd.ms-excel" ||
							file.type ===
								"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
							file.type === "application/wps-office.xlsx";

						if (!isExcel) {
							message.warning("请选择Excel文件");
							return;
						}
						const arrayBuffer = await file.arrayBuffer();
						const buffer = Buffer.from(arrayBuffer);
						const bufferToBase64 = buffer.toString("base64");

						try {
							setLoading(true);
							let data = undefined;
							// if (type === "trouble") {
							// 	data = await importTrouble.mutateAsync({
							// 		base64: bufferToBase64,
							// 		domainId,
							// 	});
							// }
							if (type === "term") {
								data = await importTerms.mutateAsync({
									base64: bufferToBase64,
									domainId,
									taxonomyId,
									parentId,
								});
							}
							if (type === "dept") {
								data = await importDepts.mutateAsync({
									base64: bufferToBase64,
									domainId,
									parentId,
								});
							}
							if (type === "staff") {
								data = await importStaffs.mutateAsync({
									base64: bufferToBase64,
									domainId,
								});
							}
							// const data = res.data;
							console.log(`%cdata:${data}`, "color:red");
							if (!data?.error) {
								// message.success("导入成功");
								// if (type === "trouble") {
								message.success(`已经导入${data.count}条数据`);
								// }
								// queryClient.invalidateQueries({ queryKey });
								if (refresh && type !== "trouble") {
									setTimeout(() => {
										window.location.reload();
									}, 700);
								}
							} else {
								console.log(
									`%cerror:${JSON.stringify(data.error)}`,
									"color:red"
								);
								console.log(JSON.stringify(data.error));
								message.error(JSON.stringify(data.error));
							}
						} catch (error) {
							console.error(`${error}`);
							message.error(`${error}`);
						} finally {
							if (fileInput.current) {
								fileInput.current.value = ""; // 清空文件输入
							}
							setLoading(false);
						}
					}
				}}
				style={{ display: "none" }}
			/>
		</div>
	);
}
