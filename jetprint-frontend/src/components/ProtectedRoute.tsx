import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // While checking for authentication, show a loading message
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If the user is authenticated, render the child component (e.g., OrdersPage)
  // The <Outlet /> component from react-router-dom is a placeholder for the child route's element.
  if (isAuthenticated) {
    return <Outlet />;
  }

  // If the user is not authenticated, redirect them to the login page
  return <Navigate to="/login" />;
};

export default ProtectedRoute;