import React, {
	createContext,
	useContext,
	ReactNode,
	useEffect,
	useMemo,
} from "react";
import { theme } from "antd";
export interface TailwindTheme {
	[key: string]: string;
}

// Create a context for the agTheme
const AppThemeContext = createContext<{}>(
	null
);

export const useAppTheme = () => useContext(AppThemeContext);

export default function ThemeProvider({ children }: { children: ReactNode }) {
	const { token } = theme.useToken();

	const applyTheme = (tailwindTheme: TailwindTheme) => {
		for (let key in tailwindTheme) {
			document.documentElement.style.setProperty(key, tailwindTheme[key]);
		}
	};

	// const agTheme = useMemo(
	// 	() =>
	// 		themeQuartz.withPart(iconSetQuartzLight).withParams({
	// 			accentColor: token.colorPrimary,
	// 			backgroundColor: token.colorBgContainer,
	// 			borderColor: token.colorBorderSecondary,
	// 			// borderRadius: 2,
	// 			browserColorScheme: "light",
	// 			cellHorizontalPaddingScale: 0.7,

	// 			fontSize: token.fontSize,
	// 			foregroundColor: token.colorText,
	// 			headerBackgroundColor: token.colorFillQuaternary,
	// 			headerFontSize: token.fontSize,
	// 			headerFontWeight: 600,
	// 			headerTextColor: token.colorPrimary,
	// 			rowBorder: true,
	// 			rowVerticalPaddingScale: 0.9,
	// 			sidePanelBorder: true,
	// 			spacing: 6,
	// 			oddRowBackgroundColor: token.colorFillQuaternary,
	// 			wrapperBorder: true,
	// 			wrapperBorderRadius: 0,

	// 			// headerRowBorder: true,
	// 			// columnBorder: true,
	// 			// headerRowBorder: true,
	// 			pinnedRowBorder: true
	// 		}),
	// 	[token]
	// );
	// const subTableTheme = useMemo(
	// 	() =>
	// 		themeQuartz.withPart(iconSetQuartzLight).withParams({
	// 			accentColor: token.colorTextSecondary, // 可以使用不同的强调色
	// 			backgroundColor: token.colorBgLayout,
	// 			borderColor: token.colorBorderSecondary,
	// 			fontSize: token.fontSizeSM, // 可以使用不同的字体大小
	// 			foregroundColor: token.colorTextSecondary,
	// 			headerBackgroundColor: token.colorFillSecondary,
	// 			headerFontSize: token.fontSizeSM,
	// 			headerFontWeight: 500, // 可以使用不同的字体粗细
	// 			headerTextColor: token.colorTextTertiary,
	// 			rowBorder: false, // 可以选择不显示行边框
	// 			rowVerticalPaddingScale: 0.6,
	// 			sidePanelBorder: false,
	// 			spacing: 4,
	// 			oddRowBackgroundColor: token.colorFillQuaternary,
	// 			wrapperBorder: false,
	// 			wrapperBorderRadius: 0,
	// 			columnBorder: false,
	// 		}),
	// 	[token]
	// );
	const tailwindTheme: TailwindTheme = useMemo(
		() => ({
			"--color-primary": token.colorPrimary,
			"--color-primary-active": token.colorPrimaryActive,
			"--color-primary-hover": token.colorPrimaryHover,
			"--color-bg-primary-hover": token.colorPrimaryBgHover,
			"--color-text-secondary": token.colorTextSecondary,
			"--color-text-tertiary": token.colorTextTertiary,
			"--color-bg-text-hover": token.colorBgTextHover,
			"--color-bg-container": token.colorBgContainer,
			"--color-bg-layout": token.colorBgLayout,
			"--color-bg-mask": token.colorBgMask,
			"--color-bg-primary": token.colorPrimary,
			"--color-text": token.colorText,
			"--color-text-heading": token.colorTextHeading,
			"--color-text-label": token.colorTextLabel,
			"--color-text-lightsolid": token.colorTextLightSolid,
			"--color-text-quaternary": token.colorTextQuaternary,
			"--color-text-placeholder": token.colorTextPlaceholder,
			"--color-text-description": token.colorTextDescription,
			"--color-border": token.colorBorder,
			"--color-border-secondary": token.colorBorderSecondary,
			"--color-border-primary": token.colorPrimaryBorder,
			"--color-text-primary": token.colorPrimaryText,
			"--color-error": token.colorError,
			"--color-warning": token.colorWarning,
			"--color-info": token.colorInfo,
			"--color-success": token.colorSuccess,
			"--color-error-bg": token.colorErrorBg,
			"--color-warning-bg": token.colorWarningBg,
			"--color-info-bg": token.colorInfoBg,
			"--color-success-bg": token.colorSuccessBg,
			"--color-link": token.colorLink,
			"--color-highlight": token.colorHighlight,
			'--color-fill-quaternary': token.colorFillQuaternary,
			"--color-fill-tertiary": token.colorFillTertiary,
			"--color-fill-secondary": token.colorFillSecondary
		}),
		[token]
	);

	useEffect(() => {
		applyTheme(tailwindTheme);
	}, [tailwindTheme]);

	return (
		<AppThemeContext.Provider value={{}}>
			{children}
		</AppThemeContext.Provider>
	);
}
