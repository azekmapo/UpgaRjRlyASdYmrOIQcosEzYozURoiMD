import "./App.css";
import { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from "./components/theme-provider";

import LoadingSpinner from './components/loading-spinner';

import { DashboardLayout } from './components/layout';
import { ProtectedRoute } from './components/auth';
import { appRoutes } from './config';
import type { UserRole } from './config';
import { NotificationProvider } from "./contexts/NotificationContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

function App() {
  const dashboardIndex = appRoutes.dashboard.find(r => r.path === '/');
  const dashboardRoles = dashboardIndex?.roles || [];
  const DashboardComponent = dashboardIndex?.component;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="pfe-theme">
        <AuthProvider>
          <Router>
            <NotificationProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  {appRoutes.public.map((route) => (
                    <Route 
                      key={route.path} 
                      path={route.path} 
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <route.component />
                        </Suspense>
                      } 
                    />
                  ))}
                  
                  {/* Protected Dashboard Routes */}
                  <Route 
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Dashboard index route */}
                    <Route
                      index
                      element={
                        <Suspense fallback={<PageLoader />}>
                          {DashboardComponent && (
                            <ProtectedRoute
                              roles={dashboardRoles as UserRole[]}
                              component={DashboardComponent}
                            />
                          )}
                        </Suspense>
                      }
                    />
                    
                    {/* All other dashboard routes */}
                    {appRoutes.dashboard
                      .filter(route => route.path !== '/') // Skip the main dashboard route
                      .map((route) => (
                        <Route
                          key={route.path}
                          path={route.path.replace('/', '')} // Remove leading slash for nested routes
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <ProtectedRoute
                                roles={route.roles as UserRole[]}
                                component={route.component}
                              />
                            </Suspense>
                          }
                        />
                      ))}
                  </Route>
                  
                  {/* 404 Route */}
                  <Route
                    path="*"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <appRoutes.notFound.component />
                      </Suspense>
                    }
                  />
                </Routes>

                <Toaster richColors position="top-right" closeButton />
              </Suspense>
            </NotificationProvider>
          </Router> 
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
