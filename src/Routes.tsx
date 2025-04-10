import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import History from "./pages/History";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import Waitlist from "./pages/Waitlist";

// RouteGuard component to check if user is allowed to access the app
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if user is authorized
    // This could be from localStorage, a cookie, or an API call
    const checkAuth = async () => {
      try {
        // For demo, we'll use localStorage
        const isAuth = localStorage.getItem('syndicateAuth') === 'true';
        setIsAuthorized(isAuth);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthorized(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Show loading state while checking auth
  if (isAuthorized === null) {
    return <div className="flex items-center justify-center min-h-screen bg-syndicate-dark">Loading...</div>;
  }
  
  // Redirect to waitlist if not authorized
  if (!isAuthorized) {
    return <Navigate to="/waitlist" replace />;
  }
  
  // Render children if authorized
  return <>{children}</>;
};

const Routes = () => {
  return (
    <RouterRoutes>
      {/* Waitlist page is publicly accessible */}
      <Route path="/waitlist" element={<Waitlist />} />
      
      {/* Protected routes that require authorization */}
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      } />
      <Route path="/help" element={
        <ProtectedRoute>
          <Help />
        </ProtectedRoute>
      } />
      
      {/* Redirect any other routes to waitlist */}
      <Route path="*" element={<Navigate to="/waitlist" replace />} />
    </RouterRoutes>
  );
};

export default Routes;
