
import { useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Product } from '../store/slices/productsSlice';
import { addToCart } from '../store/slices/cartSlice';
import { AnimationController } from '../utils/animations';

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const dispatch = useDispatch();
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      // Stagger animation on mount
      const animation = AnimationController.scrollReveal(cardRef.current, {
        delay: index * 0.1
      });

      return () => animation.kill();
    }
  }, [index]);

  useEffect(() => {
    let hoverAnimation: any;

    if (imageRef.current) {
      hoverAnimation = AnimationController.hoverScale(imageRef.current);

      const handleMouseEnter = () => hoverAnimation.play();
      const handleMouseLeave = () => hoverAnimation.reverse();

      const element = cardRef.current;
      if (element) {
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
          element.removeEventListener('mouseenter', handleMouseEnter);
          element.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    }
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart(product));
  };

  return (
    <div 
      ref={cardRef}
      className="group cursor-pointer"
    >
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative overflow-hidden rounded-lg mb-4">
          <img
            ref={imageRef}
            src={product.image}
            alt={product.name}
            className="w-full aspect-[4/5] object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm text-black py-2 px-4 rounded text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
          >
            Add to Cart
          </button>
        </div>

        <div className="text-center">
          <h3 className="font-medium text-sm mb-1">{product.name}</h3>
          <p className="text-muted-foreground text-sm">${product.price}</p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
