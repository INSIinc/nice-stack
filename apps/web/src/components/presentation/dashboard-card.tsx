import { theme } from "antd";
import { ReactNode, CSSProperties } from "react";
import { motion } from "framer-motion";

export default function DashboardCard({
	children,
	title,
	className,
	contentClassName,
	titleClassName,
	extra,
	style,
	contentStyle,
}: {
	contentClassName?: string;
	contentStyle?: CSSProperties;
	extra?: ReactNode;
	title?: ReactNode;
	children?: ReactNode;
	titleClassName?: string;
	className?: string;
	style?: CSSProperties;
}) {
	const { token } = theme.useToken();

	return (
		<motion.div
			className={`rounded-xl p-4  flex-col flex hover:bg-white bg-gray-50 transition-all ease-in-out shadow-elegant border-white border-2 ${className}`}
			style={style}
			initial={{ opacity: 0, scale: 0.8, x: -20 }} // 添加x轴位移，让动画有入场效果
			animate={{
				opacity: 1,
				scale: 1.0,
				x: 0, // 回到原位
				transition: {
					duration: 0.3, // 增加动画持续时间
					ease: "easeOut", // 使用easeOut缓动函数，让动画结束时减速
				},
			}}>
			<div className="flex justify-between items-center">
				<div
					className={titleClassName}
					style={{
						lineHeight: token.lineHeightLG,
						fontSize: token.fontSizeLG,
						fontWeight: "bold",
						color: token.colorPrimaryText,
					}}>
					{title}
				</div>
				{extra && <div>{extra}</div>}
			</div>
			{children && (
				<div
					style={contentStyle}
					className={`${contentClassName} flex-grow`}>
					{children}
				</div>
			)}
		</motion.div>
	);
}
