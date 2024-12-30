import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@nicestack/iconer";
import { theme } from "antd";
import { motion } from "framer-motion"; // Import Framer Motion

// Define types for the props
interface CollapsibleSectionProps {
	items: Array<MenuItem>;
	className?: string;
	defaultExpandedKeys?: string[];
}

interface MenuItem {
	key: string;
	link?: string;
	blank?: boolean
	icon?: React.ReactNode;
	label: string;
	children?: Array<MenuItem>;
	extra?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
	items,
	className,
	defaultExpandedKeys = [],
}) => {
	const location = useLocation();
	const navigate = useNavigate();
	const currentPath = location.pathname;
	const currentSearchParams = new URLSearchParams(location.search);
	const { token } = theme.useToken();

	const [expandedSections, setExpandedSections] = useState<{
		[key: string]: boolean;
	}>(() =>
		defaultExpandedKeys.reduce(
			(acc, key) => {
				acc[key] = true;
				return acc;
			},
			{} as { [key: string]: boolean }
		)
	);

	const toggleChildCollapse = (key: string): void => {
		setExpandedSections((prevState) => ({
			...prevState,
			[key]: !prevState[key],
		}));
	};

	const renderItems = (
		items: Array<MenuItem>,
		level: number
	): React.ReactNode => {
		return items.map((item) => {
			const itemUrl = new URL(item.link, window.location.origin);
			const itemPath = itemUrl.pathname;
			const itemSearchParams = new URLSearchParams(itemUrl.search);
			const hasChildren = item.children && item.children.length > 0;
			const isActive =
				currentPath === itemPath &&
				Array.from(itemSearchParams.entries()).every(
					([key, value]) => currentSearchParams.get(key) === value
				);

			const isChildCollapsed = !expandedSections[item.key];

			return (
				<div key={item.key} className="flex flex-col mb-2 select-none" style={{ color: token.colorTextLightSolid }}>
					<motion.div
						className={`flex items-center justify-between px-4 py-2 rounded-full ${hasChildren ? "cursor-pointer" : ""} `}
						onClick={() => {
							if (hasChildren) {
								toggleChildCollapse(item.key);
							}
							if (item.link) {
								if (!item.blank) {
									navigate(item.link, { replace: true });
								} else {
									window.open(item.link, "_blank");
								}
							}
						}}
						initial={false}
						animate={{
							backgroundColor: isActive ? token.colorPrimaryBorder : token.colorPrimary,
						}}
						whileHover={{ backgroundColor: token.colorPrimaryHover }}
						transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.3 }}
						style={{ marginLeft: `${level * 16}px` }}
					>
						<div className="flex items-center justify-between">
							<div className=" items-center flex gap-2">
								{item.icon && <span>{item.icon}</span>}
								<span>{item.label}</span>
							</div>
							{hasChildren && (
								<Icon
									name={"caret-right"}
									className={`ml-1  transition-transform duration-300 ${!isChildCollapsed ? "rotate-90" : ""}`}
								></Icon>
							)}
						</div>
						{item.extra && <div className="ml-4">{item.extra}</div>}
					</motion.div>
					{hasChildren && (
						<motion.div
							initial={false}
							animate={{ height: isChildCollapsed ? 0 : "auto" }}
							transition={{
								// type: "spring",
								// stiffness: 200,
								// damping: 20,
								type: "tween",
								duration: 0.2
							}}
							style={{ overflow: "hidden" }}
							className="mt-1"
						>
							{renderItems(item.children, level + 1)}
						</motion.div>
					)}
				</div>
			);
		});
	};

	return <div className={className}>{renderItems(items, 0)}</div>;
};

export default CollapsibleSection;
