import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import NewOrderPage from './pages/NewOrderPage';
import AssignmentsPage from './pages/AssignmentsPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import OrderDetailPage from './pages/OrderDetailPage';
import AdminRoute from './components/AdminRoute';
import NotificationToast from './components/NotificationToast';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes for all logged-in users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/orders" />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/new-order" element={<NewOrderPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          {/* Nested Protected Route for Admins ONLY */}
          <Route path="/dashboard" element={<AdminRoute />}>
            <Route path="" element={<DashboardPage />} />
          </Route>
        </Route>
      </Routes>
      <NotificationToast />
      <Toaster />
    </Router>
  );
}

export default App;
