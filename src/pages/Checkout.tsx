import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import { clearCart } from '../store/slices/cartSlice';
import { CheckoutForm } from '../types/checkout';
import { AnimationController } from '../utils/animations';
import { ArrowLeft, Check, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, total } = useSelector((state: RootState) => state.cart);
  const { user, isAuthenticated } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<CheckoutForm>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    zipCode: '',
    paymentMethod: 'cod',
    upiId: ''
  });

  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});

  useEffect(() => {
    if (items.length === 0 && !showSuccess) {
      navigate('/cart');
    }
  }, [items.length, navigate, showSuccess]);

  useEffect(() => {
    if (formRef.current) {
      AnimationController.pageTransition(formRef.current, 'in');
    }
  }, []);

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const fullName = `${user.first_name} ${user.last_name}`.trim();
      const address = [user.address_line1, user.address_line2, user.city, user.state]
        .filter(Boolean)
        .join(', ');
      
      setFormData(prev => ({
        ...prev,
        fullName: fullName || prev.fullName,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        address: address || prev.address,
        zipCode: user.postal_code || prev.zipCode
      }));
    }
  }, [isAuthenticated, user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutForm> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setShowSuccess(true);
    if (successRef.current) {
      AnimationController.staggerFadeIn([successRef.current], 0.1);
    }
    setTimeout(() => {
      dispatch(clearCart());
      navigate('/');
    }, 3000);
  };

  const handleInputChange = (field: keyof CheckoutForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const shipping = 0;
  const finalTotal = total + shipping;

  if (showSuccess) {
    return (
      <div className="min-h-screen pb-16 bg-white flex items-center justify-center">
        <div ref={successRef} className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-light mb-4 text-neutral-900">Order Placed!</h1>
          <p className="text-neutral-600 mb-6">
            Thank you for your order. You'll receive a confirmation email shortly.
          </p>
          <p className="text-sm text-neutral-500">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 bg-gradient-to-b from-neutral-50 to-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-8 hover:gap-3 transition-all"
        >
          <ArrowLeft size={16} />
          Back to Cart
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-3">
            <h1 className="text-4xl font-light mb-8 text-neutral-900 tracking-tight">Complete Your <span className="italic font-serif">Order</span></h1>
            
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <div className="space-y-4 bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-medium text-neutral-900 mb-4">Contact Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors ${
                      errors.fullName ? 'border-red-500' : 'border-neutral-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors ${
                        errors.phone ? 'border-red-500' : 'border-neutral-300'
                      }`}
                      placeholder="10-digit phone number"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors ${
                        errors.email ? 'border-red-500' : 'border-neutral-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-4 bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-medium text-neutral-900 mb-4">Shipping Address</h2>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors resize-none ${
                      errors.address ? 'border-red-500' : 'border-neutral-300'
                    }`}
                    placeholder="Street address, apartment, suite, etc."
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className={`w-full md:w-48 px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors ${
                      errors.zipCode ? 'border-red-500' : 'border-neutral-300'
                    }`}
                    placeholder="ZIP Code"
                  />
                  {errors.zipCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4 bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-medium text-neutral-900 mb-4">Payment Method</h2>
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="text-green-600" size={24} />
                  <div>
                    <p className="font-medium text-green-900">Cash on Delivery</p>
                    <p className="text-sm text-green-700">Pay when you receive your order</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-5 rounded-xl font-medium text-lg transition-all duration-300 shadow-lg ${
                  isSubmitting
                    ? 'bg-neutral-400 text-white cursor-not-allowed'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Placing Order...
                  </span>
                ) : (
                  'Complete Order'
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-2xl shadow-lg sticky top-32 border border-neutral-100">
              <h2 className="text-2xl font-medium text-neutral-900 mb-6">Order Summary</h2>
              
              <div className="space-y-5 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-3 bg-neutral-50 rounded-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{item.name}</p>
                      {item.attributes && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {Object.entries(item.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-neutral-600">Qty: {item.quantity}</p>
                        <p className="font-medium text-neutral-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t-2 border-neutral-200 pt-5">
                <div className="flex justify-between text-base">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="text-neutral-900 font-medium">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-2xl font-bold pt-3 border-t-2 border-neutral-900">
                  <span className="text-neutral-900">Total</span>
                  <span className="text-neutral-900">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
