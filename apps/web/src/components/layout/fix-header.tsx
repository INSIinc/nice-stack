import { useAuth } from "@web/src/providers/auth-provider";
import { Avatar, Tag, theme, Tooltip } from "antd";
import React, { ReactNode, useEffect, useState, useRef, CSSProperties } from "react";
import { SyncOutlined } from "@ant-design/icons";
import Breadcrumb from "../layout/breadcrumb";
import * as Y from "yjs";
import { stringToColor, YWsProvider } from "@nicestack/common";
import { lightenColor } from "@nicestack/client"
import { useLocalSettings } from "@web/src/hooks/useLocalSetting";
interface FixedHeaderProps {
	children?: ReactNode;
	roomId?: string;
	awarePlaceholder?: string;
	borderless?: boolean;
	style?: CSSProperties;
	className?: string;
}

const FixedHeader: React.FC<FixedHeaderProps> = ({
	className,
	style,
	borderless = false,
	children,
	roomId,
	awarePlaceholder = '协作人员'
}) => {
	const { user, sessionId, accessToken } = useAuth();
	const [userStates, setUserStates] = useState<Map<string, any>>(new Map());
	const { token } = theme.useToken();
	const providerRef = useRef<YWsProvider | null>(null);
	const { websocketUrl } = useLocalSettings();

	useEffect(() => {
		let cleanup: (() => void) | undefined;
		// 如果已经连接或缺少必要参数，则返回
		if (!user || !roomId || !websocketUrl) {
			return;
		}
		// 设置延时，避免立即连接
		const connectTimeout = setTimeout(() => {
			try {
				const ydoc = new Y.Doc();
				const provider = new YWsProvider(websocketUrl + "/yjs", roomId, ydoc, {
					params: {
						userId: user?.id,
						sessionId
					}
				});
				providerRef.current = provider;
				const { awareness } = provider;
				const updateAwarenessData = () => {
					const uniqueStates = new Map<string, any>();
					awareness.getStates().forEach((value, key) => {
						const sessionId = value?.user?.sessionId;
						if (sessionId) {
							uniqueStates.set(sessionId, value);
						}
					});
					setUserStates(uniqueStates);
				};

				const localState = {
					user: {
						id: user.id,
						showname: user.showname || user.username,
						deptName: user.department?.name,
						sessionId,
					},
				};

				awareness.setLocalStateField("user", localState.user);
				awareness.on("change", updateAwarenessData);
				updateAwarenessData();

				const handleBeforeUnload = () => {
					awareness.setLocalState(null);
					provider.disconnect();
				};

				window.addEventListener("beforeunload", handleBeforeUnload);

				// 定义清理函数
				cleanup = () => {
					if (providerRef.current) {
						awareness.off("change", updateAwarenessData);
						awareness.setLocalState(null);
						provider.disconnect();
						providerRef.current = null;
					}

					setUserStates(new Map());
					window.removeEventListener("beforeunload", handleBeforeUnload);
				};

			} catch (error) {
				console.error('WebSocket connection error:', error);
			}
		}, 100);

		// 返回清理函数
		return () => {
			clearTimeout(connectTimeout);
			if (cleanup) {
				cleanup();
			}
		};
	}, [roomId, user, websocketUrl, sessionId]);


	// 其余渲染代码保持不变...
	const renderAvatars = () =>
		Array.from(userStates.entries()).map(([key, value]) => (
			<Tooltip
				color="white"
				title={
					<span className="text-tertiary">
						{value?.user.deptName && (
							<span className="mr-2 text-primary">{value?.user?.deptName}</span>
						)}
						<span className="">{value?.user?.showname || "匿名用户"}</span>
					</span>
				}
				key={key}
			>
				<Avatar
					className="cursor-pointer"
					src={value?.user?.avatarUrl}
					size={35}
					style={{
						borderColor: lightenColor(stringToColor(value?.user?.sessionId), 30),
						borderWidth: 3,
						color: lightenColor(stringToColor(value?.user?.sessionId), 30),
						fontWeight: "bold",
						background: stringToColor(value?.user?.sessionId),
					}}
				>
					{!value?.user?.avatarUrl &&
						(value?.user?.showname?.toUpperCase() || "匿名用户")}
				</Avatar>
			</Tooltip>
		));

	return (
		<div
			className={`flex-shrink-0 p-2 border-gray-200 flex justify-between ${borderless ? "" : "border-b"
				} ${className}`}
			style={{ height: "49px", ...style }}
		>
			<div className="flex items-center gap-4">
				<Breadcrumb />
				<div className="flex items-center gap-2">
					{roomId && (
						<Tag icon={<SyncOutlined spin />} color={token.colorPrimaryHover}>
							{awarePlaceholder}
						</Tag>
					)}
					<Avatar.Group
						max={{
							count: 35,
							style: {
								backgroundColor: token.colorPrimaryBg,
								color: token.colorPrimary,
								padding: 10,
							},
						}}
					>
						{renderAvatars()}
					</Avatar.Group>
				</div>
			</div>
			{children}
		</div>
	);
};

export default FixedHeader;
