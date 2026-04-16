import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { PageLoader } from '@/components/feedback/PageLoader';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RealTimeProvider } from '@/contexts/RealTimeProvider';
import AuditLog from '@/pages/AuditLog';
import EnvironmentsPage from '@/pages/Environments';
import FeatureGrid from '@/pages/FeatureGrid';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import ProjectDetail from '@/pages/ProjectDetail';
import ProjectList from '@/pages/ProjectList';
import ProjectSettings from '@/pages/ProjectSettings';
import Register from '@/pages/Register';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: true,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader className="min-h-screen" />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader className="min-h-screen" />;
  }
  if (user) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RealTimeProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route
                  path="/login"
                  element={
                    <GuestRoute>
                      <Login />
                    </GuestRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <GuestRoute>
                      <Register />
                    </GuestRoute>
                  }
                />

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
                    <Route path="environments" element={<EnvironmentsPage />} />
                    <Route path="audit" element={<AuditLog />} />
                    <Route path="settings" element={<ProjectSettings />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </RealTimeProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
