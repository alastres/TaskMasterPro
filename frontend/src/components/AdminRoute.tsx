import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

const AdminRoute = ({ children }: { children: JSX.Element }) => {
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
