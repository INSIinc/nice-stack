import { theme } from "antd";
import { motion } from "framer-motion";
import { CSSProperties } from "react";

export default function AnimateProgress({ progress, text, className, style }: {
    progress: number, text?: string, className?: string, style?: CSSProperties
}) {
    const { token } = theme.useToken()
    return (
        <div className={`relative w-full   rounded-full overflow-hidden ${className}`} style={{
            background: token.colorPrimaryBgHover
            , ...style
        }}>
            <motion.div
                className="h-full absolute top-0 left-0"
                initial={{ width: '0%', backgroundColor: '#ff0000' }}
                animate={{
                    width: `${progress}%`,
                    backgroundColor: token.colorPrimary,
                }}
                transition={{ duration: 0.5 }}
            />
            <div className="absolute w-full h-full flex items-center justify-center text-white font-bold">
                {text}
            </div>
        </div>
    );
}