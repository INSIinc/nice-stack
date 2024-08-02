import { IconName } from "../generated/icon-names";
import { useLazySvgImport } from "../utils/useLazySvgImport";

interface IProps {
    name: IconName;
    className?: string,
    svgProp?: React.SVGProps<SVGSVGElement>;
    size?: 'small' | 'middle' | 'large' | number;
}
const sizeMap: { [key: string]: number } = {
    small: 16,
    middle: 24,
    large: 32
};
function Icon(props: IProps) {
    const { name, svgProp, className = '', size = 'middle' } = props;
    const { loading, Svg } = useLazySvgImport(name);
    const finalSize = typeof size === 'number' ? size : sizeMap[size] || sizeMap.middle;
    const svgStyle = {
        width: finalSize,
        height: finalSize,
        ...(svgProp?.style) // 如果svgProp中包含style，则合并样式
    };
    return (
        <>
            {loading && (
                <div className={` ${className}`} style={{
                    borderRadius: "100%",
                    height: 24,
                    width: 24
                }}></div>
            )}
            {Svg && (
                <span className={className}> <Svg style={svgStyle}   {...svgProp} /></span>
            )}
        </>
    );
}

export default Icon;