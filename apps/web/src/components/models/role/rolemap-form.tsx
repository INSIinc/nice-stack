import { Button, Form, Input, message } from "antd";
import { FormInstance } from "antd";
import { useEffect, useRef, useState } from "react";
import { ObjectType, Staff } from "@nicestack/common"; // Adjust the import path if necessary
import { useRoleMap } from "@web/src/hooks/useRoleMap";
import { api } from "@web/src/utils/trpc";
import DepartmentSelect from "../department/department-select";
import DomainSelect from "../domain/domain-select";
import StaffSelect from "../staff/staff-select";

export default function RoleMapForm({
	roleId,
	domainId,
	roleType = "both",
}: {
	roleId: string;
	domainId?: string;
	roleType?: "dept" | "staff" | "both";
}) {
	const { createManyObjects } = useRoleMap();
	const [loading, setLoading] = useState(false);
	const [selectedDomainId, setSelectedDomainId] = useState(domainId || null);
	const { data } = api.rolemap.getRoleMapDetail.useQuery({
		roleId,
		domainId: selectedDomainId ? selectedDomainId : null,
	});
	const formRef = useRef<FormInstance>(null);
	useEffect(() => {
		if (domainId) {
			setSelectedDomainId(domainId);
			formRef.current?.setFieldValue("domainId", domainId);
		}
	}, [domainId]);
	useEffect(() => {
		if (data) {
			console.log("data.deptIds", data.deptIds);
			formRef.current?.setFieldValue("deptIds", data.deptIds);
			formRef.current?.setFieldValue("staffIds", data.staffIds);
		}
	}, [data, domainId]);
	return (
		<Form
			initialValues={data}
			ref={formRef}
			layout="vertical"
			requiredMark="optional"
			onFinish={async (values) => {
				console.log("Received values:", values);
				const { deptIds, staffIds, domainId = null } = values;
				setLoading(true);
				try {
					console.log(deptIds);
					if (roleType === "dept" || roleType === "both") {
						await createManyObjects.mutateAsync({
							domainId,
							objectType: ObjectType.DEPARTMENT,
							objectIds: deptIds,
							roleId,
						});
					}
					if (roleType === "staff" || roleType === "both") {
						await createManyObjects.mutateAsync({
							domainId,
							objectType: ObjectType.STAFF,
							objectIds: staffIds,
							roleId,
						});
					}
				} catch (err) {
					message.error("更新失败");
				}
				setLoading(false);
			}}>
			<Form.Item name={"domainId"} label="所属域">
				<DomainSelect
					onChange={(value) => {
						setSelectedDomainId(value);
						formRef.current?.setFieldValue("domainId", value);
					}}
				/>
			</Form.Item>
			{(roleType === "staff" || roleType === "both") && (
				<Form.Item name={"staffIds"} label="分配给人员">
					<StaffSelect
						domainId={selectedDomainId}
						multiple></StaffSelect>
				</Form.Item>
			)}
			{(roleType === "dept" || roleType === "both") && (
				<Form.Item name={"deptIds"} label="分配给单位">
					<DepartmentSelect

						rootId={selectedDomainId}
						multiple></DepartmentSelect>
				</Form.Item>
			)}
			<div className="flex justify-center items-center p-2">
				<Button loading={loading} htmlType="submit" type="primary">
					提交
				</Button>
			</div>
		</Form>
	);
}
