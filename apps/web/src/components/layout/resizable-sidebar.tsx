import { useState, useEffect } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { theme } from 'antd';
import { ReactNode } from 'react';

type SidebarProps = {
    children: ReactNode;
    handlePosition?: 'left' | 'right';
    className?: string;
    minWidth?: number;
    maxWidth?: number;
    defaultWidth?: number;
    onWidthChange?: (width: number) => void; // New prop for handling width change
};

export default function ResizableSidebar({
    children,
    handlePosition = 'right',
    className = '',
    minWidth = 200,
    maxWidth = 400,
    defaultWidth = 200,
    onWidthChange
}: SidebarProps) {
    const [width, setWidth] = useState(defaultWidth);
    const [isDragging, setIsDragging] = useState(false);
    const [isHoveringHandle, setIsHoveringHandle] = useState(false);
    const { token } = theme.useToken();

    useEffect(() => {
        if (isDragging) {
            document.body.style.cursor = 'col-resize';
        } else {
            document.body.style.cursor = '';
        }

        return () => {
            document.body.style.cursor = ''; // Cleanup on unmount
        };
    }, [isDragging]);

    const handleResizeStop = (e, data) => {
        const newWidth = data.size.width;
        setWidth(newWidth);
        setIsDragging(false);

        if (onWidthChange) {
            onWidthChange(newWidth); // Call the callback with new width
        }
    };

    return (
        <ResizableBox
            width={width}
            height={Infinity}
            axis="x"
            resizeHandles={handlePosition === 'left' ? ['w'] : ['e']}
            minConstraints={[minWidth, Infinity]}
            maxConstraints={[maxWidth, Infinity]}
            onResizeStart={() => setIsDragging(true)}
            onResizeStop={handleResizeStop}
            handle={
                <span
                    style={{
                        position: 'absolute',
                        top: 0,
                        [handlePosition]: -7,
                        width: '14px',
                        height: '100%',
                        cursor: (isHoveringHandle || isDragging) ? 'col-resize' : "default",
                        zIndex: 1,
                        backgroundColor: 'transparent'
                    }}
                    onMouseEnter={() => setIsHoveringHandle(true)}
                    onMouseLeave={() => setIsHoveringHandle(false)}
                />
            }
            className={className}
            style={{
                overflow: 'hidden',
                position: 'relative',
                ...(handlePosition === 'right' && {
                    borderRight: (isDragging || isHoveringHandle) ? `2px solid ${token.colorPrimaryBorder}` : ``,
                }),
                ...(handlePosition === 'left' && {
                    borderLeft: (isDragging || isHoveringHandle) ? `2px solid ${token.colorPrimaryBorder}` : ``,
                }),
                transition: 'border-color 0.3s',
            }}
        >
            {children}
        </ResizableBox>
    );
}
