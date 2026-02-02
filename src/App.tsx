import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "./pages/Login";
import AdminAgendamentos from "./pages/AdminAgendamentos";
import NeuryAgendamentos from "./pages/NeuryAgendamentos";
import ClientesAdmin from "./pages/ClientesAdmin";
import Dashboard from "./pages/Dashboard";
import Pagamentos from "./pages/Pagamentos";
import RecibosVerdes from "./pages/RecibosVerdes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route 
              path="/admin/agendamentos" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <AdminAgendamentos />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/neury/agendamentos" 
              element={
                <ProtectedRoute allowedRoles={['neury']}>
                  <AppLayout>
                    <NeuryAgendamentos />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/clientes" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <ClientesAdmin />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/pagamentos" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <Pagamentos />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/recibos-verdes" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <RecibosVerdes />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
