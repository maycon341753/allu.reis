import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ClientDashboard from "./pages/ClientDashboard";
import ClientRentals from "./pages/ClientRentals";
import ClientPayments from "./pages/ClientPayments";
import ClientDocuments from "./pages/ClientDocuments";
import ClientSupport from "./pages/ClientSupport";
import ClientProfile from "./pages/ClientProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminContracts from "./pages/AdminContracts";
import AdminReports from "./pages/AdminReports";
import AdminOrders from "./pages/AdminOrders";
import AdminConfig from "./pages/AdminConfig";
import AdminDocuments from "./pages/AdminDocuments";
import AdminCredit from "./pages/AdminCredit";
import AdminProducts from "./pages/AdminProducts";
import AdminPayments from "./pages/AdminPayments";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import CheckoutAddress from "./pages/CheckoutAddress";
import CheckoutPayment from "./pages/CheckoutPayment";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/produtos" element={<Products />} />
          <Route path="/produtos/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/Conecte-se" element={<Login />} />
          <Route path="/cadastro" element={<Signup />} />
          <Route path="/cliente" element={<ClientDashboard />} />
          <Route path="/cliente/alugueis" element={<ClientRentals />} />
          <Route path="/cliente/pagamentos" element={<ClientPayments />} />
          <Route path="/cliente/documentos" element={<ClientDocuments />} />
          <Route path="/cliente/suporte" element={<ClientSupport />} />
          <Route path="/cliente/perfil" element={<ClientProfile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/admin/contratos" element={<AdminContracts />} />
          <Route path="/admin/relatorios" element={<AdminReports />} />
          <Route path="/admin/pedidos" element={<AdminOrders />} />
          <Route path="/admin/config" element={<AdminConfig />} />
          <Route path="/admin/documentos" element={<AdminDocuments />} />
          <Route path="/admin/credito" element={<AdminCredit />} />
          <Route path="/admin/produtos" element={<AdminProducts />} />
          <Route path="/admin/pagamentos" element={<AdminPayments />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/checkout/:id/endereco" element={<CheckoutAddress />} />
          <Route path="/checkout/:id/pagamento" element={<CheckoutPayment />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
