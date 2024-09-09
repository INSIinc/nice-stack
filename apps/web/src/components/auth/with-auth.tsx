import { useAuth } from '@web/src/providers/auth-provider';
import { RolePerms } from '@nicestack/common';
import { ReactNode } from 'react';
import { Navigate } from "react-router-dom";
// Define a type for the props that the HOC will accept.
interface WithAuthProps {
    permissions?: RolePerms[];
}

// Create the HOC function.
export default function WithAuth({ options = {}, children }: { children: ReactNode, options?: WithAuthProps }) {
    const { isAuthenticated, user, isLoading } = useAuth();
    if (isLoading) {
        return <div>Loading...</div>;
    }
    // If the user is not authenticated, redirect them to the login page.
    if (!isAuthenticated) {
        return <Navigate to={'/login'}></Navigate>

    }
    if (options.permissions && user) {
        const hasPermissions = options.permissions.every(permission => user.permissions.includes(permission));
        if (!hasPermissions) {
            return <div>You do not have the required permissions to view this page.</div>;
        }
    }
    // Return a new functional component.
    return children
}
