
import { useRef, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Product, CartItem } from '../types/product';
import { addToCart } from '../store/slices/cartSlice';
import { AnimationController } from '../utils/animations';
import { gsap } from 'gsap';

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const dispatch = useDispatch();
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (cardRef.current) {
      const animation = AnimationController.scrollReveal(cardRef.current, {
        delay: index * 0.05
      });

      return () => {
        animation.kill();
      };
    }
  }, [index]);

  useEffect(() => {
    const element = cardRef.current;
    if (!element || !imageRef.current || !overlayRef.current) return;

    const handleMouseEnter = () => {
      gsap.to(imageRef.current, {
        scale: 1.05,
        duration: 0.4,
        ease: "power2.out"
      });
      
      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3
      });

      // Switch to alternate image if available
      if (product.images.length > 1) {
        setTimeout(() => {
          setCurrentImageIndex(1);
        }, 150);
      }
    };

    const handleMouseLeave = () => {
      gsap.to(imageRef.current, {
        scale: 1,
        duration: 0.4,
        ease: "power2.out"
      });
      
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3
      });

      // Switch back to main image
      setCurrentImageIndex(0);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [product.images.length]);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // For products without variants, add directly to cart
    if (!product.variants || product.variants.length === 0) {
      const cartItem: CartItem = {
        id: product.id,
        productId: product.id,
        name: product.name,
        image: product.images[0],
        price: product.price,
        quantity: 1
      };
      dispatch(addToCart(cartItem));
    }
    // For products with variants, redirect to product detail page
  };

  const displayPrice = product.variants && product.variants.length > 0
    ? `From $${Math.min(...product.variants.map(v => v.price))}`
    : `$${product.price}`;

  return (
    <div 
      ref={cardRef}
      className="group cursor-pointer"
    >
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative overflow-hidden bg-neutral-50 rounded mb-4">
          <img
            ref={imageRef}
            src={product.images[currentImageIndex]}
            alt={product.name}
            className="w-full aspect-[4/5] object-cover transition-opacity duration-300"
            loading="lazy"
          />
          
          <div 
            ref={overlayRef}
            className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-300"
          />
          
          {/* Quick add button for non-variant products */}
          {(!product.variants || product.variants.length === 0) && (
            <button
              onClick={handleQuickAdd}
              className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm text-neutral-900 py-2 px-4 rounded text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white border border-neutral-200"
            >
              Add to Cart
            </button>
          )}
          
          {/* View options button for variant products */}
          {product.variants && product.variants.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button className="w-full bg-white/95 backdrop-blur-sm text-neutral-900 py-2 px-4 rounded text-sm font-medium hover:bg-white border border-neutral-200">
                View Options
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="font-medium text-sm text-neutral-900">{product.name}</h3>
          <p className="text-sm text-neutral-600">{displayPrice}</p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
