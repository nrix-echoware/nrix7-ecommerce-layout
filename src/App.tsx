
import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimationController } from './utils/animations';
import AestheticLoader from './components/AestheticLoader';
import TransitionWrapper from './components/TransitionWrapper';
import Navigation from './components/Navigation';
import CartOverlay from './components/CartOverlay';
import { useScrollToTop } from './hooks/useScrollToTop';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Contact from './pages/Contact';
import VoiceContact from './pages/VoiceContact';
import Policies from './pages/Policies';
import NotFound from './pages/NotFound';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import ForgetPassword from './pages/ForgetPassword';
import DeliveryVisualization from './components/DeliveryVisualization';
import { logVisitor } from './api/analyticsApi';
import { CartHashValidator } from './components/CartHashValidator';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { websocketService } from './services/websocketService';
import { sseService } from './services/sseService';
import axios from 'axios';

const queryClient = new QueryClient();

function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    logVisitor(location.pathname);
  }, [location.pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const isAdminPage = location.pathname.startsWith('/admin');

  // Scroll to top on route change
  useScrollToTop();

  // Initialize WebSocket connection
  useEffect(() => {
    // WebSocket service is already initialized as a singleton
    // It will automatically connect when the service is imported
    console.log('WebSocket service initialized');
    
    return () => {
      // Cleanup on unmount
      websocketService.disconnect();
    };
  }, []);

  // Initialize SSE connections
  useEffect(() => {
    if (isAdminPage) {
      sseService.connectAdmin();
      return () => sseService.disconnectAdmin();
    }
    
    if (isAuthenticated && user?.id) {
      sseService.connectUser(user.id);
      return () => sseService.disconnectUser();
    }
    
    return () => {
      sseService.disconnectAdmin();
      sseService.disconnectUser();
    };
  }, [location.pathname, isAuthenticated, user?.id, isAdminPage]);

  return (
    <div className="relative">
      {!isAdminPage && <Navigation />}
      <main>
        <TransitionWrapper>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/voice-contact" element={<VoiceContact />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/forgetpassword" element={<ForgetPassword />} />
            <Route path="/admin/*" element={<AdminPanel />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/how-we-work" element={<DeliveryVisualization />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TransitionWrapper>
      </main>
      {!isAdminPage && <CartOverlay />}
    </div>
  );
}

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize GSAP
    AnimationController.init();
    
    return () => {
      AnimationController.cleanup();
    };
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              {isLoading && <AestheticLoader onComplete={handleLoadingComplete} />}
              <AnalyticsTracker />
              <CartHashValidator />
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
