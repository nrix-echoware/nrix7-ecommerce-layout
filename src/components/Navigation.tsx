
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { toggleCart } from '../store/slices/cartSlice';
import { AnimationController } from '../utils/animations';
import { Menu } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const navRef = useRef<HTMLNavElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Products' },
  ];

  useEffect(() => {
    if (navRef.current) {
      AnimationController.navbarScrollEffect(navRef.current);
    }
  }, []);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav 
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-playfair font-light tracking-wider hover:opacity-70 transition-opacity"
          >
            Ethereal
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative text-sm font-light tracking-wide transition-colors hover:text-foreground/70 ${
                  location.pathname === item.path 
                    ? 'text-foreground' 
                    : 'text-foreground/60'
                }`}
              >
                {item.label}
                {location.pathname === item.path && (
                  <div className="absolute -bottom-1 left-0 right-0 h-px bg-foreground transform origin-left transition-transform duration-300" />
                )}
              </Link>
            ))}
          </div>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => dispatch(toggleCart())}
              className="relative text-sm font-light tracking-wide hover:opacity-70 transition-opacity"
            >
              Cart
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-foreground text-background text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="block py-2 text-sm font-light tracking-wide hover:opacity-70 transition-opacity"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        nav.scrolled {
          @apply glass-morphism elegant-shadow;
        }
      `}</style>
    </nav>
  );
};

export default Navigation;
