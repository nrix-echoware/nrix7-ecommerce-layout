
import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setSelectedProduct } from '../store/slices/productsSlice';
import { addToCart } from '../store/slices/cartSlice';
import { AnimationController } from '../utils/animations';
import { ArrowLeft } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items: products, selectedProduct } = useSelector((state: RootState) => state.products);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const product = selectedProduct || products.find(p => p.id === id);

  useEffect(() => {
    if (product) {
      dispatch(setSelectedProduct(product));
    }
  }, [product, dispatch]);

  useEffect(() => {
    if (imageRef.current && contentRef.current) {
      const tl = AnimationController.tl;
      
      tl.fromTo([imageRef.current, contentRef.current],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          delay: 0.3
        }
      );
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    dispatch(addToCart(product));
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6">
        {/* Back Button */}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
          {/* Product Image */}
          <div className="relative">
            <img
              ref={imageRef}
              src={product.image}
              alt={product.name}
              className="w-full aspect-[4/5] object-cover rounded-lg"
            />
          </div>

          {/* Product Info */}
          <div 
            ref={contentRef}
            className="flex flex-col justify-center"
          >
            <div className="mb-4">
              <span className="text-sm text-muted-foreground uppercase tracking-wider">
                {product.category}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-playfair font-light mb-6">
              {product.name}
            </h1>

            <p className="text-3xl font-light mb-8">
              ${product.price}
            </p>

            <p className="text-muted-foreground leading-relaxed mb-12">
              {product.description}
            </p>

            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                className="w-full bg-foreground text-background py-4 rounded font-medium hover:opacity-90 transition-opacity"
              >
                Add to Cart
              </button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Free shipping on orders over $200
                </p>
              </div>
            </div>

            {/* Product Details */}
            <div className="mt-16 space-y-6">
              <div>
                <h3 className="font-medium mb-2">Details</h3>
                <p className="text-sm text-muted-foreground">
                  Crafted with attention to detail and sustainable materials. 
                  Each piece is designed to last and age beautifully with time.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Care Instructions</h3>
                <p className="text-sm text-muted-foreground">
                  Handle with care. Store in a clean, dry place away from direct sunlight.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
