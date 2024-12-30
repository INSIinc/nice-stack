import React, {
	useMemo,
	useState,
	useCallback,
	useRef,
	useEffect,
} from "react";
import { AgGridReact, AgGridReactProps } from "@ag-grid-community/react";
import {
	GetContextMenuItemsParams,
	GridApi,
	GridReadyEvent,
	MenuItemDef,
	StatusPanelDef,
	StoreRefreshedEvent,
	ModuleRegistry,
	ColumnRowGroupChangedEvent,
	IServerSideGetRowsParams,
	IServerSideDatasource,
	GridState,
} from "@ag-grid-community/core";
import { ColumnsToolPanelModule } from "@ag-grid-enterprise/column-tool-panel";
import { FiltersToolPanelModule } from "@ag-grid-enterprise/filter-tool-panel";
import { RangeSelectionModule } from "@ag-grid-enterprise/range-selection";
import { SetFilterModule } from "@ag-grid-enterprise/set-filter";
import { MasterDetailModule } from "@ag-grid-enterprise/master-detail";
import { StatusBarModule } from "@ag-grid-enterprise/status-bar";
import { ClipboardModule } from "@ag-grid-enterprise/clipboard";
import { MenuModule } from "@ag-grid-enterprise/menu";
import { ServerSideRowModelModule } from "@ag-grid-enterprise/server-side-row-model";
import { AG_GRID_LOCALE_CH } from "@web/src/locale/ag-grid-locale";
import { api, CrudOperation, emitDataChange } from "@nicestack/client"
import { message } from "antd";
import { useLocation } from "react-router-dom";
import { useAuth } from "@web/src/providers/auth-provider";
import { EventBus } from "@nicestack/client";
import { ObjectType } from "@nicestack/common";

ModuleRegistry.registerModules([
	MasterDetailModule,
	ColumnsToolPanelModule,
	FiltersToolPanelModule,
	MenuModule,
	SetFilterModule,
	RangeSelectionModule,
	StatusBarModule,
	ClipboardModule,
	ServerSideRowModelModule,
]);
interface AgTableSpecificProps {
	objectType?: ObjectType;
	onChange?: (selectedIds: string[]) => void;
	height?: string | number;
	defaultExpandedRows?: (string | number)[];
	defaultRowGroupColumns?: string[];
	params?: Record<string, any>;
	rowHeight?: number
}
type AgTableProps = AgTableSpecificProps &
	Omit<AgGridReactProps, keyof AgTableSpecificProps>;
const AgServerTable: React.FC<AgTableProps> = ({
	objectType,
	onChange,
	height = 400,
	defaultExpandedRows = [],
	defaultRowGroupColumns = [],
	params: queryParams,
	rowHeight = 50,
	...restProps // Catch all other passed props
}) => {
	const utils = api.useUtils();
	const { sessionId } = useAuth()
	const location = useLocation()
	// const { agTheme } = useAppTheme();
	const [expandedRows, setExpandedRows] =
		useState<any[]>(defaultExpandedRows);
	const gridApi = useRef<GridApi | null>(null);
	const groupFieldsRef = useRef<string[]>()
	const rowRecordRef = useRef<Record<string, any>>()
	const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
	useEffect(() => {
		const onDataChange = async ({ operation, data, type }) => {
			if (type === objectType) {
				console.log(objectType, operation, data)
				// 确保 data 转换为数组
				const dataArray = Array.isArray(data) ? data : [data];
				saveExpandedRowsState();
				refreshData(dataArray);
			}
		}
		EventBus.on("dataChanged", onDataChange)
		return () => {
			EventBus.off("dataChanged", onDataChange)
		}
	}, [])
	const getRows = useCallback(
		async (params: IServerSideGetRowsParams) => {
			try {

				const request = { ...params.request, ...queryParams };
				console.log(request)
				const result = await utils.client[objectType].getRows.query(request as any)
				console.log(result)
				params.success({
					rowData: result?.rowData,
					rowCount: result?.rowCount,
				});


			} catch (error) {
				console.error("Error in getRows function:", error);
				params.fail();
			}
		},
		[objectType, queryParams, utils]
	);
	const datasource = useMemo<IServerSideDatasource>(() => {
		return {
			getRows,
		};
	}, [getRows]);
	useEffect(() => {
		if (gridApi.current) {

			gridApi.current.setGridOption("serverSideDatasource", datasource);
		}
	}, [datasource]);
	const statusBar = useMemo<{
		statusPanels: StatusPanelDef[];
	}>(() => {
		return {
			statusPanels: [
				{ statusPanel: "agSelectedRowCountComponent" },
				{ statusPanel: "agAggregationComponent" },
			],
		};
	}, []);
	const getContextMenuItems = useCallback(
		(params: GetContextMenuItemsParams): (string | MenuItemDef)[] => {
			return ["copy", "separator", "export"];
		},
		[]
	);
	const onFirstDataRendered = useCallback(
		(params) => {
			restoreExpandedRowsState();
		},
		[expandedRows]
	);
	const containerStyle = useMemo(
		() => ({
			width: "100%",
			display: "flex",
		}),
		[]
	);
	const gridStyle = useMemo(
		() => ({
			width: "100%",
			flexGrow: 1,
			backgroundColor: "#ffffff",
		}),
		[]
	);
	function updateGroupFields(api: GridApi) {
		if (restProps.treeData) {
			groupFieldsRef.current = ['id']
		} else {
			const colState = api.getColumnState();
			const groupedColumns = colState.filter((state) => state.rowGroup);
			groupedColumns.sort((a, b) => a.rowGroupIndex! - b.rowGroupIndex!);
			groupFieldsRef.current = groupedColumns.map((col) =>
				col.colId.replace(".", "_")
			) || [];

		}

	}
	function onColumnRowGroupChanged(event: ColumnRowGroupChangedEvent) {

		updateGroupFields(event.api)
		if (gridApi.current) {
			gridApi.current.refreshServerSide({
				purge: true
			});
		}
	}

	const saveExpandedRowsState = () => {
		if (gridApi.current) {
			const expandedNodes: string[] = [];
			gridApi.current.forEachNode((node) => {
				if (node.expanded && (node.key || node.id)) {
					expandedNodes.push(node.key || node.id);
				}
			});
			setExpandedRows(expandedNodes);
			return expandedNodes;
		}
	};
	const restoreExpandedRowsState = () => {
		if (gridApi.current) {
			gridApi.current.forEachNode((node) => {
				if (
					expandedRows.includes(node.key || node.id) ||
					defaultExpandedRows.includes(node.key || node.id)
				) {
					node.setExpanded(true);
				}
			});
		}
	};
	const firstRowIndexRef = useRef(-1)
	const initialState = useMemo<GridState & { rowIndex: number }>(() => {
		const statekey = `${objectType}-${location.pathname}-${sessionId}-agstate`
		const storedState = localStorage.getItem(statekey)
		if (storedState) {
			const parsedState = JSON.parse(storedState)
			return parsedState
		}
	}, [])
	const handleStoreState = useCallback((state: GridState) => {
		const statekey = `${objectType}-${location.pathname}-${sessionId}-agstate`
		localStorage.setItem(statekey, JSON.stringify({ ...state, rowIndex: firstRowIndexRef.current }))
	}, [])
	const containerRef = useRef<HTMLDivElement>(null)
	const containerHeight = useMemo(() => {
		if (containerRef.current) {
			// console.log('grid view height', containerRef.current.clientHeight - 100)
			return containerRef.current.clientHeight - 100
		}
		return 700
	}, [containerRef.current])
	const initialRowCount = useMemo(() => {

		if (initialState && !initialState.rowGroup) {
			// console.log('rowCount', initialState?.rowIndex + containerHeight / rowHeight)
			const rowCount = initialState?.rowIndex + containerHeight / rowHeight

			return rowCount < 31 ? 31 : rowCount
		}
	}, [containerHeight, initialState])
	const onGridReady = useCallback(
		(params: GridReadyEvent) => {
			gridApi.current = params.api;
			gridApi.current.setGridOption("serverSideDatasource", datasource);
			// if (!isInit) {
			if (!initialState?.rowGroup && initialState?.rowIndex !== -1) {
				gridApi.current.ensureIndexVisible(initialState?.rowIndex, "top")
				// setIsInit(true)
			}
			// }
			gridApi.current.addEventListener("gridPreDestroyed", (event) => handleStoreState(event.state))

			gridApi.current.addEventListener("bodyScroll", (event) => {
				firstRowIndexRef.current = Math.round(event.top / rowHeight)
			})

			updateGroupFields(params.api)
			// if (defaultRowGroupColumns.length > 0) {
			// 	params.api.applyColumnState({
			// 		state: defaultRowGroupColumns.map((colId) => ({
			// 			colId,
			// 			rowGroup: true,
			// 			hide: true,
			// 		})),
			// 		applyOrder: true,
			// 	});
			// }

		},
		[datasource]
	);


	const refreshData = useCallback((rows: any[]) => {
		if (!gridApi.current) return;
		const rowData = Object.values(rowRecordRef.current)
		// 对于树形数据，需要特殊处理
		const refreshRouteForTreeData = (item: any) => {
			// 如果是树形数据，使用父级路径来刷新
			const getParentRoute = (data: any): string[] => {
				const route: string[] = [];
				let currentParent = data.parent_id;

				while (currentParent) {
					const parentNode = rowData?.find(row => row.id === currentParent);
					console.log(parentNode)
					if (parentNode) {
						// 使用父节点的分组字段构建路由
						const parentRoute = groupFieldsRef.current?.map(field => parentNode[field]).filter(Boolean);
						if (parentRoute && parentRoute.length) {
							route.unshift(...parentRoute);
						}
						currentParent = parentNode.parent_id;
					} else {
						break;
					}
				}
				return route;
			};

			// 获取父级路由
			const ancestorRoute = getParentRoute(item);
			console.log('ancestor route', ancestorRoute)
			// 刷新父级路由
			if (ancestorRoute) {
				let parentRoute = [...ancestorRoute]
				parentRoute.pop()
				if (parentRoute) {
					console.log('parent route', parentRoute)
					gridApi.current.refreshServerSide({ route: parentRoute });
				}
				gridApi.current.refreshServerSide({ route: ancestorRoute });

			}


		};
		console.log('refresh data', rows)
		console.log('rowdata', rowData)
		console.log(groupFieldsRef.current)
		console.log('tree fresh', restProps.treeData)
		// 处理每一个更新的行
		rows.forEach(item => {
			// 检查是否存在于当前数据中
			const existingItem = rowData?.find(row => row.id === item.id);
			// console.log('exsit item', existingItem)
			if (restProps.treeData) {

				refreshRouteForTreeData(item);
			} else {
				// 对于非树形数据，使用原有的分组刷新逻辑
				for (let i = 0; i <= (groupFieldsRef.current?.length || 0); i++) {
					const newSliceRoute = groupFieldsRef.current
						?.slice(0, i)
						.map((field) => item[field])
						.filter(Boolean);

					const oldSliceRoute = groupFieldsRef.current
						?.slice(0, i)
						.map((field) => existingItem?.[field])
						.filter(Boolean);

					if (newSliceRoute && oldSliceRoute &&
						newSliceRoute.join("-") !== oldSliceRoute.join("-")) {
						gridApi.current.refreshServerSide({
							route: oldSliceRoute,
						});
					}

					if (newSliceRoute) {
						gridApi.current.refreshServerSide({ route: newSliceRoute });
					}
				}
			}
		});
	}, [groupFieldsRef.current, gridApi.current, rowRecordRef.current]);


	return (
		<div
			ref={containerRef}
			style={{
				...containerStyle,
				flexDirection: "column",
				height,
			}}>
			<div style={{ ...gridStyle }} className="ag-theme-alpine">
				<AgGridReact

					serverSideInitialRowCount={initialRowCount}
					localeText={AG_GRID_LOCALE_CH}
					defaultColDef={{
						flex: 1,
						minWidth: 150,
						resizable: true,
						sortable: false,
						// menuTabs: ['filterMenuTab'],
						suppressHeaderMenuButton: true,
						floatingFilter: true

					}}

					getChildCount={(data) => {
						return data?.child_count;
					}}
					onColumnRowGroupChanged={onColumnRowGroupChanged}

					statusBar={statusBar}
					// theme={agTheme}
					initialState={initialState}
					rowModelType={"serverSide"}
					onStoreRefreshed={(params: StoreRefreshedEvent) => {
						restoreExpandedRowsState();

					}}
					isServerSideGroupOpenByDefault={(params) => {
						return expandedRows.includes(
							params.rowNode.key || params.rowNode.id
						);
					}}

					getRowId={(params) => {
						let rowId = "";

						if (params.parentKeys && params.parentKeys.length) {
							rowId += params.parentKeys.join("-") + "-";
						}

						const groupCols = params.api.getRowGroupColumns();
						if (groupCols.length > params.level) {
							const thisGroupCol = groupCols[params.level];
							rowId +=
								params.data[
								thisGroupCol.getColDef().field.replace(".", "_")
								] + "-";
						}

						if (params.data.id) {
							rowId = params.data.id;
						}

						rowRecordRef.current = { ...rowRecordRef.current, [rowId]: params.data }

						// setRowRecord((prevRowRecord) => ({
						// 	...prevRowRecord,
						// 	[rowId]: params.data,
						// }));

						return rowId;
					}}
					blockLoadDebounceMillis={100}
					onFirstDataRendered={onFirstDataRendered}
					detailRowAutoHeight={true}
					cellSelection={true}
					// loadThemeGoogleFonts={false}
					suppressServerSideFullWidthLoadingRow={true}
					allowContextMenuWithControlKey={true}
					getContextMenuItems={getContextMenuItems}
					onGridReady={onGridReady}

					onRowDragEnd={async (event) => {
						setDragOverNodeId(undefined);
						const { overNode, node: draggedNode } = event;
						if (!overNode || !draggedNode) return;
						const { id: overId, data: overData } = overNode;
						const { id: draggedId, data: draggedData } = draggedNode;
						// 合并条件判断，简化逻辑
						if (!overData?.id || !draggedData?.id || overId === draggedId) return;
						try {
							console.log(overData, draggedData)
							if (overData?.parent_id === draggedData?.parent_id) {
								message.info("更新排序");
								const result = await utils.client[objectType].updateOrder.mutate({ id: draggedId, overId: overId });
								emitDataChange(objectType, result, CrudOperation.UPDATED)
							}
						} catch (error) {
							console.error("更新排序失败:", error);
							message.error("无法更新排序，请稍后重试。");
						}
					}}
					rowHeight={rowHeight}
					cacheBlockSize={30}
					onRowDragLeave={(event) => {
						setDragOverNodeId(undefined);
					}}

					onRowDragEnter={(event) => {
						const overNode = event.overNode;
						setDragOverNodeId(overNode.id);

					}}
					onRowDragMove={(event) => {
						setDragOverNodeId(event.overNode.id);
					}}
					// debug={!import.meta.env.PROD}
					rowClassRules={{
						"ag-custom-dragging-class": (params) => {

							return params.data &&
								params.data.id &&
								params.data.id === dragOverNodeId
						},
					}}

					{...restProps}

				/>
			</div>
		</div>
	);
};
export default AgServerTable;
