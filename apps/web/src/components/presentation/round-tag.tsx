import { CSSProperties, ReactNode, HTMLAttributes } from "react";

interface RoundTagProps extends HTMLAttributes<HTMLDivElement> { }

export default function RoundTag({
    className,
    style,
    children,
    ...props
}: RoundTagProps) {
    return (
        <div
            className={`text-center rounded-full text-sm px-4 py-1 ${className}`}
            style={style}
            {...props}
        >
            {children}
        </div>
    );
}
