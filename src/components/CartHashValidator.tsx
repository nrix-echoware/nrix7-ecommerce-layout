import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateCartHash } from '../store/slices/cartSlice';
import { fetchCartHash } from '../api/productsApi';
import { toast } from '@/hooks/use-toast';
import { RootState } from '../store/store';

/**
 * CartHashValidator component
 * This component validates the cart hash on mount and keeps it synchronized
 * with the backend to ensure cart data is always fresh
 */
export function CartHashValidator() {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const storedHash = useSelector((state: RootState) => state.cart.hash);

  useEffect(() => {
    const validateHash = async () => {
      try {
        const currentHash = await fetchCartHash();
        
        // Check if cart will be cleared before dispatching
        const hadItems = cartItems.length > 0;
        const willClear = storedHash && storedHash !== currentHash && hadItems;
        
        dispatch(validateCartHash(currentHash));
        
        // Show notification if cart was cleared
        if (willClear) {
          toast({
            title: "Cart Updated",
            description: "Your cart has been cleared because product information was updated. Please add items again.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error('Failed to validate cart hash:', error);
      }
    };

    // Validate immediately on mount
    validateHash();

    // Optionally validate periodically (e.g., every 5 minutes)
    const interval = setInterval(validateHash, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]); // Only run once on mount

  return null;
} 