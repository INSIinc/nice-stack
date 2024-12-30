import { theme } from "antd";

export default function RoundedClip() {
	const { token } = theme.useToken();
	return (
		<div className="absolute top-0 left-0">
			<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<mask id="quarter-circle-mask">
						<rect width="10" height="10" fill="white" />

						<path
							d="M10,10 L10,0 A10,10 0 0,0 0,10 Z"
							fill="black"
						/>
					</mask>
				</defs>

				<rect
					width="10"
					height="10"
					fill={token.colorPrimary}
					mask="url(#quarter-circle-mask)"
				/>
			</svg>
		</div>
	);
}
