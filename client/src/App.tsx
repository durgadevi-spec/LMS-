import { Switch, Route, useLocation } from "wouter";
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import { Layout } from '@/components/layout/Layout';
import EmployeeDashboard from '@/pages/employee/Dashboard';
import ApplyLeave from '@/pages/employee/ApplyLeave';
import LeaveHistory from '@/pages/employee/History';
import Profile from '@/pages/employee/Profile';
import AdminDashboard from '@/pages/admin/Dashboard';
import ViewLeaves from '@/pages/admin/ViewLeaves';
import Charts from '@/pages/admin/Charts';
import Employees from '@/pages/admin/Employees';
import Reports from '@/pages/Reports';

function ProtectedRoute({ component: Component, role }: { component: any, role?: 'Admin' | 'Employee' | 'HR' }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return null;

  if (!user) {
    // Redirect logic should probably be in useEffect to avoid state update during render
    // But for this mock, returning null and letting the parent re-render or the user click login is fine
    // However, we can use a redirect effect here
    if (window.location.pathname !== '/') {
        setTimeout(() => setLocation('/'), 0);
    }
    return null;
  }

  // Role check logic
  // Admin can access everything (in this simple mock, or we restrict them from employee pages?)
  // For now:
  // - Admin role requires user.role === 'Admin'
  // - HR role requires user.role === 'HR'
  // - Employee role allows 'Employee', 'HR' (since HR is also an employee), and 'Admin' (optional, but Admin usually has separate dash)
  
  if (role) {
    if (role === 'Admin' && user.role !== 'Admin' && user.role !== 'HR') {
         // Allow HR to access Admin pages like View Leaves?
         // We'll handle specific page permissions below or in the route definition
         return <div className="text-white p-8">Unauthorized Access</div>;
    }
    if (role === 'Employee' && (user.role !== 'Employee' && user.role !== 'HR' && user.role !== 'Admin')) {
        return <div className="text-white p-8">Unauthorized Access</div>;
    }
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      {/* Employee Routes - Accessible by Employee and HR */}
      <Route path="/employee/dashboard">
        <ProtectedRoute component={EmployeeDashboard} role="Employee" />
      </Route>
      <Route path="/employee/apply-leave">
        <ProtectedRoute component={ApplyLeave} role="Employee" />
      </Route>
      <Route path="/employee/history">
        <ProtectedRoute component={LeaveHistory} role="Employee" />
      </Route>
      <Route path="/employee/profile">
        <ProtectedRoute component={Profile} role="Employee" />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute component={AdminDashboard} role="Admin" />
      </Route>
      <Route path="/admin/view-leaves">
        {/* HR needs access to View Leaves */}
        <ProtectedRoute component={ViewLeaves} role="Admin" /> 
      </Route>
      <Route path="/admin/departments">
         <ProtectedRoute component={Employees} role="Admin" />
      </Route>
       <Route path="/admin/employees">
         <ProtectedRoute component={Employees} role="Admin" />
      </Route>
       <Route path="/admin/charts">
         <ProtectedRoute component={Charts} role="Admin" />
      </Route>

      {/* Reports - Accessible by Admin and HR */}
      <Route path="/reports">
        <ProtectedRoute component={Reports} role="Admin" />
      </Route>

      <Route>
        <div className="text-white p-8 text-center">404 - Page Not Found</div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
