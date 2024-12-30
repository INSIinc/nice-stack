import { CSSProperties, ReactNode, HTMLAttributes } from "react";

interface RoundedRectangleTagProps extends HTMLAttributes<HTMLDivElement> {}

export default function RoundedRectangleTag({
	className,
	style,
	children,
	...props
}: RoundedRectangleTagProps) {
	return (
		<div
			className={`text-center rounded text-sm px-4 py-1 ${className}`}
			style={style}
			{...props}>
			{children}
		</div>
	);
}
