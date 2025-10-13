import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeToNewsletter, 
  unsubscribeFromNewsletter, 
  getNewsletterStatus,
  NewsletterStatusResponse 
} from '../api/newsletterApi';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Heart,
  Shield,
  Truck,
  RotateCcw,
  CreditCard,
  Clock,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function Footer() {
  const config = useSelector((state: RootState) => state.siteConfig.config);
  const { isAuthenticated, user } = useAuth();
  const [newsletterStatus, setNewsletterStatus] = useState<NewsletterStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check newsletter status when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      checkNewsletterStatus();
    } else {
      setNewsletterStatus(null);
    }
  }, [isAuthenticated, user]);

  const checkNewsletterStatus = async () => {
    try {
      console.log('Checking newsletter status for user:', user?.email);
      const status = await getNewsletterStatus();
      console.log('Newsletter status received:', status);
      setNewsletterStatus(status);
    } catch (error) {
      console.error('Failed to check newsletter status:', error);
    }
  };

  const handleNewsletterAction = async () => {
    console.log('Newsletter action triggered', { isAuthenticated, user: user?.email, newsletterStatus });
    
    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe to our newsletter');
      return;
    }

    setIsLoading(true);
    try {
      if (newsletterStatus?.is_subscribed) {
        console.log('Unsubscribing from newsletter...');
        await unsubscribeFromNewsletter();
        toast.success('Successfully unsubscribed from newsletter');
      } else {
        console.log('Subscribing to newsletter...');
        await subscribeToNewsletter();
        toast.success('Successfully subscribed to newsletter!');
      }
      // Refresh status
      console.log('Refreshing newsletter status...');
      await checkNewsletterStatus();
    } catch (error: any) {
      console.error('Newsletter action failed:', error);
      toast.error(error?.response?.data?.error || error?.message || 'Failed to update newsletter subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const footerLinks = {
    shop: [
      { label: 'All Products', path: '/products' },
      { label: 'New Arrivals', path: '/products?filter=new' },
      { label: 'Best Sellers', path: '/products?filter=bestsellers' },
      { label: 'Sale', path: '/products?filter=sale' }
    ],
    support: [
      { label: 'Contact Us', path: '/contact' },
      { label: 'FAQ', path: '/faq' },
    ],
    company: [
      { label: 'About Us', path: '/about' },
    ],
    legal: [
      { label: 'Privacy Policy', path: '/policies' },
      { label: 'Cookie Policy', path: '/policies' }
    ]
  };

  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders over ₹999'
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      description: '30-day return policy'
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure checkout'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Customer service'
    }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Features Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 rounded-full mb-4">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Shop Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="text-2xl font-bold text-orange-500 mb-4 block">
              {config.shopName}
            </Link>
            <p className="text-gray-400 mb-6 max-w-md">
              Discover our curated selection of timeless, minimal pieces. 
              Modern essentials for the contemporary lifestyle.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-orange-500" />
                <a 
                  href={`mailto:${config.storeOwner.email}`}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {config.storeOwner.email}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-orange-500" />
                <a 
                  href={`tel:${config.storeOwner.phone}`}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {config.storeOwner.phone}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-orange-500" />
                <span className="text-gray-400">Pan India Delivery</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Subscribe to our newsletter for exclusive offers, new arrivals, and style tips.
            </p>
            
            {isAuthenticated ? (
              <div className="max-w-md mx-auto">
                {newsletterStatus && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400">
                      {newsletterStatus.is_subscribed 
                        ? `Subscribed as ${newsletterStatus.email}` 
                        : `Not subscribed (${newsletterStatus.email})`
                      }
                    </p>
                  </div>
                )}
                <button
                  onClick={handleNewsletterAction}
                  disabled={isLoading}
                  className={`px-8 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 mx-auto ${
                    newsletterStatus?.is_subscribed
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {newsletterStatus?.is_subscribed ? 'Unsubscribing...' : 'Subscribing...'}
                    </>
                  ) : (
                    <>
                      {newsletterStatus?.is_subscribed ? (
                        <>
                          <X size={16} />
                          Unsubscribe
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          Subscribe
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <p className="text-gray-400 mb-4 text-sm">
                  Please sign in to subscribe to our newsletter
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
                >
                  <Mail size={16} />
                  Sign In to Subscribe
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 {config.shopName}. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              {footerLinks.legal.map((link, index) => (
                <Link 
                  key={index}
                  to={link.path}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-gray-500 text-sm flex items-center justify-center">
              Made with <Heart className="w-4 h-4 text-red-500 mx-1" /> in India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
