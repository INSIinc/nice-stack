import { useAuth } from "@web/src/providers/auth-provider";
import { RolePerms } from "@nicestack/common";
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import DeniedPage from "@web/src/app/denied";
import { Spin } from "antd";

// Define a type for the props that the HOC will accept.
interface WithAuthProps {
	orPermissions?: RolePerms[];
	andPermissions?: RolePerms[];
}

// Create the HOC function.
export default function WithAuth({
	options = {},
	children,
}: {
	children: ReactNode;
	options?: WithAuthProps;
}) {
	const {
		isAuthenticated,
		user,
		hasEveryPermissions,
		hasSomePermissions,
		isLoading,
	} = useAuth();
	const location = useLocation();
	
	if (isLoading) {
		return (
			<div className=" flex items-center justify-center  pt-64">
				<Spin size="large"></Spin>
			</div>
		);
	}

	// If the user is not authenticated, redirect them to the login page.
	if (!isAuthenticated) {
		return <Navigate to={`/login?redirect_url=${location.pathname}`} />;
	}
	if (user) {
		// Check orPermissions
		if (
			options.orPermissions &&
			!hasSomePermissions(...options.orPermissions)
		) {
			return <DeniedPage></DeniedPage>;
		}

		// Check andPermissions
		if (
			options.andPermissions &&
			!hasEveryPermissions(...options.andPermissions)
		) {
			return <DeniedPage></DeniedPage>;
		}
	}
	// Return the children if all permission checks pass.
	return children;
}
