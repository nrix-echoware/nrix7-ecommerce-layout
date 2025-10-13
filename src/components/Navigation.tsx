import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { toggleCart } from '../store/slices/cartSlice';
import { AnimationController } from '../utils/animations';
import { 
  Menu, 
  ShoppingCart, 
  Search, 
  MapPin, 
  ChevronDown,
  Heart,
  User,
  Package,
  Truck,
  Shield,
  Star,
  Mail,
  Settings,
  LogOut,
  UserPlus,
  LogIn
} from 'lucide-react';
import ContactUsModal from './ContactUsModal';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const config = useSelector((s: RootState) => s.siteConfig.config);
  const { user, isAuthenticated, signOut } = useAuth();
  const navRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowAccountMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Navigation items are now loaded from site config
  const navItems = (config.navigation || []).map(item => ({
    ...item,
    icon: item.icon === 'Menu' ? Menu : 
          item.icon === 'Package' ? Package :
          item.icon === 'Star' ? Star :
          item.icon === 'Shield' ? Shield : Menu
  }));

  // Categories are now loaded from site config
  const categories = config.categories || [];

  useEffect(() => {
    if (navRef.current) {
      AnimationController.navbarScrollEffect(navRef.current);
    }
    // Custom scroll effect for background
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowCategories(false);
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Main Navigation Bar */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200"
      >
        {/* Top Bar - Commented out to reduce navbar height */}
        {/* <div className="bg-gray-900 text-white py-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <MapPin size={14} />
                  <span>Deliver to</span>
                  <span className="font-medium">India</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/products" className="hover:text-gray-300">Today's Deals</Link>
                <Link to="/about" className="hover:text-gray-300">Customer Service</Link>
                <Link to="/policies" className="hover:text-gray-300">Registry</Link>
                <Link to="/policies" className="hover:text-gray-300">Gift Cards</Link>
                <Link to="/policies" className="hover:text-gray-300">Sell</Link>
              </div>
            </div>
          </div>
        </div> */}

        {/* Main Navigation */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Desktop Layout */}
            <div className="hidden md:flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center">
                <div className="text-2xl font-bold text-orange-500">
                  {config.shopName}
                </div>
              </Link>

              {/* Search Bar - Desktop */}
              <div className="flex-1 max-w-2xl mx-8">
                <div className="flex h-10">
                  {/* Category Dropdown */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => setShowCategories(!showCategories)}
                      className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-l-md text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 h-full"
                    >
                      <Menu size={16} className="mr-2" />
                      {config.navbar?.categoryDropdownLabel || 'All'}
                      <ChevronDown size={16} className="ml-1" />
                    </button>
                    
                    {/* Categories Dropdown */}
                    {showCategories && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                        <div className="py-2">
                          {categories.map((category) => (
                            <Link
                              key={category.path}
                              to={category.path}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setShowCategories(false)}
                            >
                              {category.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
                        }
                      }}
                      placeholder={config.navbar?.searchPlaceholder || 'Search products...'}
                      className="w-full h-full px-4 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  {/* Search Button */}
                  <button 
                    onClick={() => {
                      if (searchQuery.trim()) {
                        window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
                      }
                    }}
                    className="px-6 py-2 bg-orange-500 text-white rounded-r-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 h-full flex items-center justify-center"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </div>

              {/* Right Side Actions - Desktop */}
              <div className="flex items-center space-x-4">
                {/* Account */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center space-x-1 text-sm hover:text-orange-500 min-w-0"
                  >
                    <User size={20} className="flex-shrink-0" />
                    <div className="hidden sm:block text-left min-w-0 max-w-32">
                      {isAuthenticated && user ? (
                        <>
                          <div className="text-xs text-gray-500 truncate">Hello, {user.first_name || user.email.split('@')[0]}</div>
                          <div className="font-medium truncate">Account</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-gray-500 truncate">Hello, Sign in</div>
                          <div className="font-medium truncate">Account & Lists</div>
                        </>
                      )}
                    </div>
                    <ChevronDown size={16} className="flex-shrink-0" />
                  </button>
                  
                  {/* Account Dropdown */}
                  {showAccountMenu && (
                    <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <div className="py-2">
                        {isAuthenticated && user ? (
                          <>
                            <div className="px-4 py-2 border-b border-gray-100">
                              <div className="text-sm font-medium text-gray-900 truncate" title={user.email}>{user.email}</div>
                              {user.first_name && (
                                <div className="text-sm text-gray-500">{user.first_name} {user.last_name}</div>
                              )}
                            </div>
                            <div className="py-1">
                              <Link
                                to="/profile"
                                onClick={() => setShowAccountMenu(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <User className="h-4 w-4" />
                                My Profile
                              </Link>
                              <Link
                                to="/settings"
                                onClick={() => setShowAccountMenu(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <Settings className="h-4 w-4" />
                                Settings
                              </Link>
                            </div>
                            <div className="border-t border-gray-100 pt-1">
                              <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                              >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="py-1">
                            <Link
                              to="/login"
                              onClick={() => setShowAccountMenu(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <LogIn className="h-4 w-4" />
                              Sign In
                            </Link>
                            <Link
                              to="/signup"
                              onClick={() => setShowAccountMenu(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <UserPlus className="h-4 w-4" />
                              Sign Up
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart */}
                <button
                  onClick={() => dispatch(toggleCart())}
                  className="relative flex items-center space-x-1 text-sm hover:text-orange-500"
                >
                  <ShoppingCart size={20} />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs text-gray-500">Cart</div>
                    <div className="font-medium">{cartItemCount}</div>
                  </div>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
              {/* Top Row - Logo and Actions */}
              <div className="flex items-center justify-between h-14">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-gray-700 hover:text-orange-500"
                >
                  <Menu size={24} />
                </button>

                {/* Logo */}
                <Link to="/" className="flex items-center">
                  <div className="text-xl font-bold text-orange-500">
                    {config.shopName}
                  </div>
                </Link>

                {/* Mobile Actions */}
                <div className="flex items-center space-x-2">
                  {/* Cart - Mobile */}
                  <button
                    onClick={() => dispatch(toggleCart())}
                    className="relative p-2 text-gray-700 hover:text-orange-500"
                  >
                    <ShoppingCart size={20} />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-xs">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Search Bar - Mobile */}
              <div className="pb-3">
                <div className="flex h-10">
                  {/* Category Dropdown - Mobile */}
                  <div className="relative dropdown-container">
                    <button
                      onClick={() => setShowCategories(!showCategories)}
                      className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-l-md text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 h-full"
                    >
                      <Menu size={14} className="mr-1" />
                      <span className="hidden xs:inline">{config.navbar?.categoryDropdownLabel || 'All'}</span>
                      <ChevronDown size={14} className="ml-1" />
                    </button>
                    
                    {/* Categories Dropdown - Mobile */}
                    {showCategories && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                        <div className="py-2">
                          {categories.map((category) => (
                            <Link
                              key={category.path}
                              to={category.path}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setShowCategories(false)}
                            >
                              {category.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search Input - Mobile */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
                        }
                      }}
                      placeholder={config.navbar?.searchPlaceholderMobile || 'Search...'}
                      className="w-full h-full px-3 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Search Button - Mobile */}
                  <button 
                    onClick={() => {
                      if (searchQuery.trim()) {
                        window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
                      }
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-r-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 h-full flex items-center justify-center"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Navigation - Commented out to reduce navbar height */}
        {/* <div className="bg-gray-100 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-8 py-2">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'text-orange-500'
                        : 'text-gray-700 hover:text-orange-500'
                    }`}
                  >
                    <IconComponent size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              <Link to="/products" className="text-sm font-medium text-gray-700 hover:text-orange-500">
                Today's Deals
              </Link>
            </div>
          </div>
        </div> */}
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-lg overflow-y-auto">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="text-xl font-bold text-orange-500">{config.shopName}</div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  <Menu size={20} />
                </button>
              </div>
              
              {/* Navigation Links */}
              <div className="space-y-2 mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Navigation</h3>
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 text-gray-700 hover:text-orange-500 py-3 px-2 rounded-md transition-colors ${
                        location.pathname === item.path ? 'bg-orange-50 text-orange-600' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <IconComponent size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Categories */}
              <div className="space-y-2 mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Categories</h3>
                {categories.map((category) => (
                  <Link
                    key={category.path}
                    to={category.path}
                    className="block py-2 px-2 text-gray-700 hover:text-orange-500 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {category.label}
                  </Link>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                <button
                  onClick={() => {
                    dispatch(toggleCart());
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 text-gray-700 hover:text-orange-500 py-3 px-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ShoppingCart size={20} />
                  <span className="font-medium">View Cart ({cartItemCount})</span>
                </button>
                <button
                  onClick={() => {
                    setContactOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 text-gray-700 hover:text-orange-500 py-3 px-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Mail size={20} />
                  <span className="font-medium">Contact Us</span>
                </button>
              </div>

              {/* Account Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-3">
                  {isAuthenticated && user ? (
                    <>
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 text-gray-700 hover:text-orange-500"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User size={20} />
                        <span className="font-medium">My Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-3 text-gray-700 hover:text-orange-500"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings size={20} />
                        <span className="font-medium">Settings</span>
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 text-red-600 hover:text-red-700 w-full text-left"
                      >
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="flex items-center space-x-3 text-gray-700 hover:text-orange-500"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <LogIn size={20} />
                        <span className="font-medium">Sign In</span>
                      </Link>
                      <Link
                        to="/signup"
                        className="flex items-center space-x-3 text-gray-700 hover:text-orange-500"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <UserPlus size={20} />
                        <span className="font-medium">Sign Up</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ContactUsModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
};

export default Navigation;
