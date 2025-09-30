
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { closeCart, removeFromCart, updateQuantity } from '../store/slices/cartSlice';
import { gsap } from 'gsap';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartOverlay = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, isOpen, total } = useSelector((state: RootState) => state.cart);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (overlayRef.current && panelRef.current) {
      if (isOpen) {
        gsap.set(overlayRef.current, { display: 'flex' });
        gsap.fromTo(overlayRef.current, 
          { opacity: 0 },
          { opacity: 1, duration: 0.3 }
        );
        gsap.fromTo(panelRef.current,
          { x: '100%' },
          { x: '0%', duration: 0.4, ease: "power2.out" }
        );
      } else {
        gsap.to(panelRef.current, {
          x: '100%',
          duration: 0.3,
          ease: "power2.in"
        });
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            gsap.set(overlayRef.current, { display: 'none' });
          }
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatAttributeText = (attributes?: Record<string, string>) => {
    if (!attributes) return '';
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  const goToCheckout = () => {
    dispatch(closeCart());
    navigate('/checkout');
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 hidden items-center justify-end"
      onClick={() => dispatch(closeCart())}
    >
      <div 
        ref={panelRef}
        className="bg-white w-full max-w-md h-full p-6 shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-light text-neutral-900">Shopping Cart</h2>
          <button
            onClick={() => dispatch(closeCart())}
            className="p-2 hover:bg-neutral-100 rounded transition-colors"
          >
            <X size={20} className="text-neutral-600" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-500 mb-4">Your cart is empty</p>
            <button
              onClick={() => dispatch(closeCart())}
              className="text-sm text-neutral-900 underline hover:no-underline"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-6 mb-8">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded bg-neutral-50"
                  />
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium text-sm text-neutral-900">{item.name}</h3>
                    {item.attributes && (
                      <p className="text-xs text-neutral-500">
                        {formatAttributeText(item.attributes)}
                      </p>
                    )}
                    <p className="text-sm text-neutral-700">₹{item.price}</p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => dispatch(updateQuantity({ 
                            id: item.id, 
                            quantity: item.quantity - 1 
                          }))}
                          className="w-6 h-6 border border-neutral-300 rounded text-xs hover:bg-neutral-100 transition-colors flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(updateQuantity({ 
                            id: item.id, 
                            quantity: item.quantity + 1 
                          }))}
                          className="w-6 h-6 border border-neutral-300 rounded text-xs hover:bg-neutral-100 transition-colors flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="text-neutral-500 hover:text-neutral-700 transition-colors text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="font-medium text-neutral-900">Total</span>
                <span className="font-medium text-lg text-neutral-900">₹{total.toFixed(2)}</span>
              </div>
              <button onClick={goToCheckout} className="w-full bg-neutral-900 text-white py-3 rounded font-medium hover:bg-neutral-800 transition-colors">
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartOverlay;
