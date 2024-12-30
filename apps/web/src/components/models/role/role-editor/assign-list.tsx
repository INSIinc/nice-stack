import AgServerTable from "@web/src/components/presentation/ag-server-table";
import { ObjectType } from "@nicestack/common"
import { ICellRendererParams } from "@ag-grid-community/core";
import { Menu, MenuItem } from "@web/src/components/presentation/dropdown-menu";
import { DeleteOutlined, EllipsisOutlined, PlusOutlined } from "@ant-design/icons";
import { ColDef, ValueGetterParams } from "@ag-grid-community/core";
import { Button } from "antd";
import DepartmentSelect from "../../department/department-select";
import { useContext, useEffect } from "react";
import { RoleEditorContext } from "./role-editor";
import { useAuth } from "@web/src/providers/auth-provider";
import { useRoleMap } from "@nicestack/client"
const OpreationRenderer = ({ props }: { props: ICellRendererParams }) => {
    const { deleteMany } = useRoleMap()
    return (
        <div>
            <Menu
                node={
                    <EllipsisOutlined className=" hover:bg-textHover p-1 rounded" />
                }>
                <MenuItem
                    label="移除"
                    onClick={() => {
                        deleteMany.mutateAsync({
                            ids: [props?.data?.id],
                        });
                    }}
                    icon={<DeleteOutlined></DeleteOutlined>}></MenuItem>
            </Menu>
        </div>
    );

};
export default function AssignList() {
    const { user, hasSomePermissions } = useAuth();
    const { domainId, setModalOpen, role, setDomainId, canManageRole } =
        useContext(RoleEditorContext);
    useEffect(() => {
        if (user) {
            setDomainId?.(user.domainId);
        }
    }, [user]);
    const columnDefs: ColDef[] = [
        {
            headerName: "帐号",
            field: "staff.username",
            sort: "desc",
            valueGetter: (params: ValueGetterParams) => {
                return params.data?.staff_username;
            },
            filter: "agTextColumnFilter",
            maxWidth: 300,
        },
        {
            headerName: "姓名",
            field: "staff.showname",
            sort: "desc",
            valueGetter: (params: ValueGetterParams) => {
                return params.data?.staff_showname;
            },
            filter: "agTextColumnFilter",
            maxWidth: 300,
        },
        {
            headerName: "证件号",
            field: "staff.officer_id",
            sort: "desc",
            valueGetter: (params: ValueGetterParams) => {
                return params.data?.staff_officer_id;
            },
            filter: "agTextColumnFilter",
        },
        {
            headerName: "所在单位",
            field: "department.name",
            sort: "desc",
            valueGetter: (params: ValueGetterParams) => {
                return params.data?.department_name;
            },
            filter: "agTextColumnFilter",
            maxWidth: 300,
        },

        {
            headerName: "操作",
            sortable: true,

            cellRenderer: (props) => <OpreationRenderer props={props}></OpreationRenderer>, // 指定 cellRenderer
            maxWidth: 100,
        },
    ];
    return <div className=" flex-grow">
        <div className="p-2 border-b  flex items-center justify-between">
            <div className="flex items-center gap-2 ">
                <span className="">   {role?.name}</span>
                <span className=" text-tertiary "> 角色成员列表</span>

            </div>
            <div className=" flex items-center gap-4">
                <DepartmentSelect onChange={(value) => setDomainId(value as string)} rootId={user?.domainId} value={domainId} disabled={!canManageRole} domain={true} className=" w-48"></DepartmentSelect>
                {canManageRole && <Button
                    onClick={() => {
                        setModalOpen(true)
                    }}
                    type="primary" icon={<PlusOutlined></PlusOutlined>}>添加成员</Button>}
            </div>

        </div>
        <AgServerTable
            rowGroupPanelShow="onlyWhenGrouping"
            height={"calc(100vh - 48px - 49px - 49px)"}
            columnDefs={columnDefs}
            rowHeight={50}
            params={{ domainId, roleId: role?.id }}
            objectType={ObjectType.ROLE_MAP}
        />
    </div>
}
