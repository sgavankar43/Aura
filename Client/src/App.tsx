import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RealTimeProvider } from './contexts/RealTimeProvider';
import AuditLog from './pages/AuditLog';
import FeatureGrid from './pages/FeatureGrid';
import Login from './pages/Login';
import ProjectDetail from './pages/ProjectDetail';
import ProjectList from './pages/ProjectList';
import Register from './pages/Register';
const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealTimeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/projects" element={<ProjectList />} />
                <Route path="/projects/:id" element={<ProjectDetail />}>
                  <Route index element={<FeatureGrid />} />
                  <Route path="audit" element={<AuditLog />} />
                  <Route path="settings" element={<div>Settings pending...</div>} />
                </Route>
                <Route path="/" element={<Navigate to="/projects" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </RealTimeProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
