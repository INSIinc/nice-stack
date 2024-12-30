import { message, Progress, Spin, theme } from 'antd';
import React, { useState, useEffect, useRef, ReactNode, CSSProperties } from 'react';
import { useLocalSettings } from '@web/src/hooks/useLocalSetting';
import { uploaderPromise } from '@web/src/io';

interface ImageUploaderProps {
    value?: string;
    onChange?: (url: string) => void;
    className?: string; // Add className prop
    placeholder?: ReactNode
    style?: CSSProperties
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ style, value, onChange, className, placeholder = '点击上传' }) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(value || '');
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadSpeed, setUploadSpeed] = useState<number>(0);
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null);
    const { token } = theme.useToken()
    const { tusUrl } = useLocalSettings()
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    useEffect(() => {
        const handleUpload = async () => {
            if (!file) return;
            try {
                const endpoint = tusUrl;
                setUploading(true)
                const resultUrl = await uploaderPromise(endpoint, file, (percentage, speed) => {
                    setUploadProgress(percentage);
                    setUploadSpeed(speed);
                });

                setUploadProgress(0);  // Reset upload progress to hide overlay

                // Call the onChange callback with the uploaded URL
                if (onChange) {
                    onChange(resultUrl);
                }

            } catch (error) {
                message.error('图片上传失败');
            }
            finally {
                setUploading(false)
            }
        };

        if (file) {
            handleUpload();
        }
    }, [file]);

    // Effect to update previewUrl when the value prop changes
    useEffect(() => {
        if (!value) {
            setFile(null);
            setPreviewUrl('');
        } else {
            setPreviewUrl(value);
        }
    }, [value]);

    const handleAreaClick = () => {
        inputRef.current?.click();
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            <div
                onClick={handleAreaClick}
                style={style}
                className={`rounded-lg overflow-hidden bg-gray-100 hover:bg-gray-50 transition-all flex justify-center items-center cursor-pointer relative ${className}`}
            >
                {previewUrl ? (
                    <>
                        <img src={previewUrl} alt="Selected" className="w-full h-full object-cover" />
                        {uploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center">

                                <Progress percent={uploadProgress} showInfo={false} strokeColor={token.colorSuccessBg} className="w-3/4 " />

                            </div>
                        )}
                    </>
                ) : (
                    <span className="text-tertiary">
                        {placeholder}
                    </span>
                )}
            </div>
        </>
    );
};

export default ImageUploader;
