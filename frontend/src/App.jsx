import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AuthProvider from './context/AuthProvider';
import ToastProvider from './context/ToastProvider';
import useAuth from './hooks/useAuth';

// Layouts
import Layout from './components/layout/Layout';

// Eagerly loaded pages (critical path)
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Lazily loaded pages (only loaded when visited)
const DashboardPage     = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage      = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const PipelineDetailPage= lazy(() => import('./pages/PipelineDetailPage'));
const AuditLogPage      = lazy(() => import('./pages/AuditLogPage'));
const MLServicePage     = lazy(() => import('./pages/MLServicePage'));
const SettingsPage      = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage'));

// Shared loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      <div className="text-text-muted text-xs font-black uppercase tracking-[0.2em] animate-pulse">Initializing...</div>
    </div>
  </div>
);

// Protected route: redirect to /login if not authenticated
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bg-base">
       <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <div className="text-text-muted text-xs font-black uppercase tracking-[0.2em] animate-pulse">Securing Session...</div>
      </div>
    </div>
  );
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Public-only route: redirect to /dashboard if already logged in
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
    <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

    {/* Protected — inside the dashboard Layout */}
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
        <Route path="/projects" element={<Suspense fallback={<PageLoader />}><ProjectsPage /></Suspense>} />
        <Route path="/projects/:id" element={<Suspense fallback={<PageLoader />}><ProjectDetailPage /></Suspense>} />
        <Route path="/pipelines/:id" element={<Suspense fallback={<PageLoader />}><PipelineDetailPage /></Suspense>} />
        <Route path="/audit" element={<Suspense fallback={<PageLoader />}><AuditLogPage /></Suspense>} />
        <Route path="/ml" element={<Suspense fallback={<PageLoader />}><MLServicePage /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
      </Route>
    </Route>

    <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;