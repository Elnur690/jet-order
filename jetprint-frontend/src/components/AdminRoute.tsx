import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If the user is an admin, allow access to the nested route.
  if (user && user.role === 'ADMIN') {
    return <Outlet />;
  }

  // If not, redirect them to a safe page (e.g., the main orders list).
  return <Navigate to="/orders" />;
};

export default AdminRoute;