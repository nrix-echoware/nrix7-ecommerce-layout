import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../store/store';
import { removeFromCart, updateQuantity } from '../store/slices/cartSlice';
import { AnimationController } from '../utils/animations';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';

const Cart = () => {
  const dispatch = useDispatch();
  const { items, total } = useSelector((state: RootState) => state.cart);
  const cartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cartRef.current) {
      AnimationController.pageTransition(cartRef.current, 'in');
    }
  }, []);

  const formatAttributeText = (attributes?: Record<string, string>) => {
    if (!attributes) return '';
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  const shipping = total > 200 ? 0 : 25;

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center py-16 max-w-md mx-auto">
            <h1 className="text-3xl font-light mb-4 text-neutral-900">Your Cart is Empty</h1>
            <p className="text-neutral-600 mb-8">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link
              to="/products"
              className="inline-block bg-neutral-900 text-white px-8 py-3 rounded font-medium hover:bg-neutral-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="container mx-auto px-6">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Continue Shopping
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-light mb-8 text-neutral-900">Shopping Cart</h1>
            
            <div ref={cartRef} className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border border-neutral-200 rounded-lg">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <h3 className="font-medium text-neutral-900">{item.name}</h3>
                    {item.attributes && (
                      <p className="text-sm text-neutral-500">
                        {formatAttributeText(item.attributes)}
                      </p>
                    )}
                    <p className="text-lg font-medium text-neutral-900">₹{item.price}</p>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => dispatch(updateQuantity({ 
                            id: item.id, 
                            quantity: item.quantity - 1 
                          }))}
                          className="w-8 h-8 border border-neutral-300 rounded flex items-center justify-center hover:bg-neutral-100 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-12 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(updateQuantity({ 
                            id: item.id, 
                            quantity: item.quantity + 1 
                          }))}
                          className="w-8 h-8 border border-neutral-300 rounded flex items-center justify-center hover:bg-neutral-100 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-medium text-neutral-900">
                      ₹{item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-neutral-50 p-6 rounded-lg sticky top-32">
              <h2 className="text-xl font-medium text-neutral-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Subtotal ({items.length} items)</span>
                  <span className="font-medium text-neutral-900">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Shipping</span>
                  <span className="font-medium text-neutral-900">
                    {shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex justify-between text-xl font-medium">
                    <span className="text-neutral-900">Total</span>
                    <span className="text-neutral-900">₹{(total + shipping).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {total < 200 && (
                <p className="text-sm text-neutral-600 mb-6 p-3 bg-blue-50 rounded">
                  Add ₹{(200 - total).toFixed(2)} more for free shipping!
                </p>
              )}

              <Link
                to="/checkout"
                className="block w-full bg-neutral-900 text-white text-center py-4 rounded font-medium hover:bg-neutral-800 transition-colors"
              >
                Proceed to Checkout
              </Link>

              <p className="text-xs text-center text-neutral-500 mt-4">
                Secure checkout with SSL encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
