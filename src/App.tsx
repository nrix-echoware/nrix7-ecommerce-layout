
import { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimationController } from './utils/animations';
import LoadingScreen from './components/LoadingScreen';
import Navigation from './components/Navigation';
import CartOverlay from './components/CartOverlay';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Policies from './pages/Policies';
import NotFound from './pages/NotFound';
import AdminPanel from './pages/AdminPanel';

const queryClient = new QueryClient();

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
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
            
            <div className="relative">
              <Navigation />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/policies" element={<Policies />} />
                  <Route path="/admin-panel" element={<AdminPanel />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <CartOverlay />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
