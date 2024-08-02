import { FC } from "react";
export declare const useLazySvgImport: (name: string) => {
    error: Error | undefined;
    loading: boolean;
    Svg: FC<import("react").SVGProps<SVGSVGElement>> | undefined;
};
