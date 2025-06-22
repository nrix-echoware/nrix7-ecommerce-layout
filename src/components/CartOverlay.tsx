
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { closeCart, removeFromCart, updateQuantity } from '../store/slices/cartSlice';
import { gsap } from 'gsap';

const CartOverlay = () => {
  const dispatch = useDispatch();
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

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 hidden items-center justify-end"
      onClick={() => dispatch(closeCart())}
    >
      <div 
        ref={panelRef}
        className="bg-background w-full max-w-md h-full p-6 elegant-shadow overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-playfair">Shopping Cart</h2>
          <button
            onClick={() => dispatch(closeCart())}
            className="text-2xl hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <button
              onClick={() => dispatch(closeCart())}
              className="text-sm underline hover:no-underline"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-6 mb-8">
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-4">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.product.name}</h3>
                    <p className="text-xs text-muted-foreground">${item.product.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => dispatch(updateQuantity({ 
                          id: item.product.id, 
                          quantity: item.quantity - 1 
                        }))}
                        className="w-6 h-6 border border-border rounded text-xs hover:bg-muted transition-colors"
                      >
                        −
                      </button>
                      <span className="text-xs w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => dispatch(updateQuantity({ 
                          id: item.product.id, 
                          quantity: item.quantity + 1 
                        }))}
                        className="w-6 h-6 border border-border rounded text-xs hover:bg-muted transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => dispatch(removeFromCart(item.product.id))}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="font-medium">Total</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>
              <button className="w-full bg-foreground text-background py-3 rounded font-medium hover:opacity-90 transition-opacity">
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
