import React, { CSSProperties, useRef, useState } from 'react';

type NiceImgProps = React.HTMLAttributes<HTMLDivElement> & // Allow div props
    React.ImgHTMLAttributes<HTMLImageElement> & {
        fallbackSrc?: string;
        shape?: 'circle' | 'square'; // Shape of the avatar
        size?: 'small' | 'default' | 'large' | number; // Size of the avatar
        className?: string;
    };

const getSize = (size: 'small' | 'default' | 'large' | number) => {
    switch (size) {
        case 'small':
            return 24;
        case 'large':
            return 64;
        case 'default':
        default:
            return 30;
    }
};


const NiceImg: React.FC<NiceImgProps> = ({
    src,
    alt,
    fallbackSrc,
    shape = 'square',
    size = 'default',
    style,
    className,
    ...props
}) => {
    const [isError, setIsError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const dimension = typeof size === 'number' ? size : getSize(size);

    const combinedStyle: CSSProperties = {
        width: dimension,
        height: dimension,
        borderRadius: shape === 'circle' ? '50%' : '4px',
        objectFit: 'cover',
        ...style,
    };

    const handleError = () => {
        setIsError(true);
    };

    return (
        <>
            {isError || !src ? (
                <div
                    style={{
                        ...combinedStyle,
                        backgroundColor: '#f0f0f0',
                        lineHeight: `${dimension}px`,
                        textAlign: 'center'
                    }}
                    className={`bg-gray-100 overflow-hidden ${shape === 'circle' ? 'rounded-full' : 'rounded'} ${className}`}
                    {...props}
                >
                    {fallbackSrc && <img src={fallbackSrc} alt="fallback" style={{ width: '100%', height: '100%' }} />}
                </div>
            ) : (
                <img
                    ref={imgRef}
                    {...props}
                    className={`${className} ${shape === 'circle' ? 'rounded-full' : ''}`}
                    src={src}
                    alt={alt}
                    style={combinedStyle}
                    onError={handleError}
                />
            )}
        </>
    );
};

export default NiceImg;
