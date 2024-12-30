import { Avatar, Button, Dropdown, theme } from "antd";
import { useAuth } from "@web/src/providers/auth-provider";
import { Icon } from "@nicestack/iconer";
import { useNavigate } from "react-router-dom";

export default function UserHeader() {
	const { logout, user, isAuthenticated } = useAuth();
	const { token } = theme.useToken();

	const navigate = useNavigate();
	return (
		<div className="p-2  flex items-center justify-end bg-gradient-to-r from-primary to-primaryActive">
			<div className=" flex items-center gap-4">
				<div
					style={{ color: token.colorTextLightSolid }}
					className="rounded flex items-center select-none justify-between">
					<div
						className="flex hover:bg-primaryHover rounded px-2  items-center gap-4 hover:cursor-pointer"
						onClick={() => {
							// if (user?.pilot?.id) {
							// 	navigate(`/pilots/${user?.pilot.id}`);
							// }
						}}>

						<Avatar
							shape={"circle"}
							// src={user?.pilot?.photo}
							style={{ background: token.colorPrimary }}>
							{(user?.showname || user?.username)
								?.slice(0, 1)
								.toUpperCase()}
						</Avatar>
						<span>{user?.showname || user?.username}</span>
						{user?.department && <>
							<Icon name="org"></Icon>
							<span className=" font-bold">{user?.department?.name}</span></>}
					</div>
				</div>
				<div
					onClick={async () => {
						await logout()
					}}
					className="active:bg-gray-100/60 flex items-center gap-2 text-white hover:bg-gray-100/30 px-2 rounded py-1 cursor-pointer">
					<Icon name="logout" />
					注销
				</div>
			</div>
		</div>
	);
}
