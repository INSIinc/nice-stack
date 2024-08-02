import { IconName } from "../generated/icon-names";
interface IProps {
    name: IconName;
    className?: string;
    svgProp?: React.SVGProps<SVGSVGElement>;
    size?: 'small' | 'middle' | 'large' | number;
}
declare function Icon(props: IProps): import("react/jsx-runtime").JSX.Element;
export default Icon;
