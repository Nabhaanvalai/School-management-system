import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LoginForm } from "./components/auth/LoginForm";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminOnly, TeacherOnly, StudentOnly } from "./components/auth/RoleGuard";

// Demo dashboard components
const AdminDashboard = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
    <p>Welcome to the admin dashboard. You have full system access.</p>
  </div>
);

const TeacherDashboard = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Teacher Dashboard</h2>
    <p>Welcome to the teacher dashboard. You can manage your classes and attendance.</p>
  </div>
);

const StudentDashboard = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Student Dashboard</h2>
    <p>Welcome to the student dashboard. You can view your academic information.</p>
  </div>
);

const Dashboard = () => (
  <div className="min-h-screen bg-gray-50">
    <AdminOnly>
      <AdminDashboard />
    </AdminOnly>
    <TeacherOnly>
      <TeacherDashboard />
    </TeacherOnly>
    <StudentOnly>
      <StudentDashboard />
    </StudentOnly>
  </div>
);

const LoginPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
      <LoginForm onSuccess={() => window.location.href = '/dashboard'} />
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
