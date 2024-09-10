import { ConfigProvider, theme } from "antd";
import { ReactNode, useEffect, useMemo } from "react";

export interface TailwindTheme {
    [key: string]: string;
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
    const token = theme.getDesignToken();

    const applyTheme = (tailwindTheme: TailwindTheme) => {
        for (let key in tailwindTheme) {
            document.documentElement.style.setProperty(key, tailwindTheme[key]);
        }
    };

    const tailwindTheme: TailwindTheme = useMemo(() => ({
        '--color-primary': token.colorPrimary,
        '--color-text-secondary': token.colorTextSecondary,
        '--color-text-tertiary': token.colorTextTertiary,
        '--bg-container': token.colorBgContainer,
        '--bg-layout': token.colorBgLayout,
        '--bg-mask': token.colorBgMask,
        '--primary-bg': token.colorPrimaryBg,
        '--color-text': token.colorText,
        '--color-text-quaternary': token.colorTextQuaternary,
        '--color-text-placeholder': token.colorTextPlaceholder,
        '--color-text-description': token.colorTextDescription,
        '--color-border': token.colorBorder,
        '--primary-text': token.colorPrimaryText
    }), [token]);

    useEffect(() => {
        applyTheme(tailwindTheme);
    }, [tailwindTheme]);

    return (
        <ConfigProvider theme={{
            algorithm: theme.defaultAlgorithm,
            // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
        }}>
            {children}
        </ConfigProvider>
    );
}
