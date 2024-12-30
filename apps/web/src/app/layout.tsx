import React, {
	createContext,
	CSSProperties,
	useEffect,
	useState,
} from "react";
import { Outlet, useLocation } from "react-router-dom";
import "react-resizable/css/styles.css";
import { theme } from "antd";
import ResizableSidebar from "@web/src/components/layout/resizable-sidebar";
import SidebarContent from "@web/src/components/layout/sidebar-content";
import UserHeader from "@web/src/components/layout/user-header";
import { Icon } from "@nicestack/iconer";
import { env } from "@web/src/env";
import RoundedClip from "@web/src/components/svg/rounded-clip";
import {useTerm} from "@nicestack/client"

export const MainLayoutContext = createContext<{
	pageWidth?: number;
}>({
	pageWidth: undefined,
});
const ParallelogramTag = () => {
	const { token } = theme.useToken();
	const parallelogramStyle: CSSProperties = {
		display: "inline-flex",
		alignItems: "center", // 垂直居中
		transform: "skew(-20deg)",
		height: "25px", // 调整高度以适应文本
		padding: "0 20px",
		backgroundColor: token.colorPrimaryBg,
		// margin: '0 0 0 10px',
	};

	const contentStyle: CSSProperties = {
		transform: "skew(20deg)",
		fontSize: token.fontSize,
		fontWeight: "bold",
		color: token.colorPrimary,
	};

	return (
		<div className="shadow" style={parallelogramStyle}>
			<span style={contentStyle}>{env.VERSION}</span>
		</div>
	);
};
const MainLayoutPage: React.FC = () => {
	const { token } = theme.useToken();
	const [sidebarWidth, setSidebarWidth] = useState<number>();
	const [pageWidth, setPageWidth] = useState<number>();
	useTerm();
	const updateWidth = () => {
		const remainingWidth =
			window.innerWidth - Math.max(sidebarWidth || 0, 200);
		setPageWidth(remainingWidth);
	};
	useEffect(() => {
		window.addEventListener("resize", updateWidth);
		return () => window.removeEventListener("resize", updateWidth);
	}, []);
	useEffect(() => {
		updateWidth();
	}, [sidebarWidth]);
	useEffect(() => {
		document.title = `${env.APP_NAME}`;
	}, []);

	return (
		<MainLayoutContext.Provider value={{ pageWidth }}>
			<div>
				<div className=" absolute top-1 left-5  text-white    flex  items-center  gap-4 ">
					<Icon
						size={36}
						className=" text-blue-200"
						name="loop"></Icon>
					<div
						className=" flex  justify-center items-center  font-extrabold   "
						style={{
							fontSize: token.fontSizeHeading4,
							lineHeight: token.lineHeightHeading4,
						}}>
						{env.APP_NAME || "loop sys"}
					</div>
					<ParallelogramTag></ParallelogramTag>
				</div>
				<div
					className=" bg-primary"
					style={{
						display: "flex",
						height: "calc(100vh)",
					}}>
					<ResizableSidebar
						onWidthChange={setSidebarWidth}
						className="py-2 px-4 ">
						<SidebarContent></SidebarContent>
					</ResizableSidebar>
					<div
						className=" flex-grow"
						style={{ backgroundColor: token.colorBgContainer }}>
						<UserHeader></UserHeader>
						<div
							className="relative"
							style={{ height: "calc(100vh - 48px)" }}>
							<RoundedClip></RoundedClip>
							<Outlet />
						</div>
					</div>
				</div>
			</div>
		</MainLayoutContext.Provider>
	);
};

export default MainLayoutPage;
