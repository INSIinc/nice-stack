import { ComponentProps, FC, useEffect, useRef, useState } from "react";

export const useLazySvgImport = (name: string) => {
    const importRef = useRef<FC<ComponentProps<"svg">>>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error>();

    useEffect(() => {
        setLoading(true);
        const importIcon = async () => {
            try {
                importRef.current = (
                    await import(`../icons/${name}.svg?react`)
                ).default; // We use `?react` here following `vite-plugin-svgr`'s convention.
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };
        importIcon();
    }, [name]);

    return {
        error,
        loading,
        Svg: importRef.current,
    };
};