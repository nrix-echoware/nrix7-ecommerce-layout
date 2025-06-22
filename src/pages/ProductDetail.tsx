import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setSelectedProduct, clearSelectedProduct } from '../store/slices/productsSlice';
import { addToCart } from '../store/slices/cartSlice';
import { AnimationController } from '../utils/animations';
import { ArrowLeft } from 'lucide-react';
import VariantSelector from '../components/VariantSelector';
import { Variant, CartItem } from '../types/product';

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items: products, selectedProduct } = useSelector((state: RootState) => state.products);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();

  // Always get product by id from products, not from selectedProduct
  const product = products.find(p => p.id === id);

  useEffect(() => {
    if (product) {
      dispatch(setSelectedProduct(product));
      // Auto-select first available variant
      if (product.variants && product.variants.length > 0) {
        const firstAvailable = product.variants.find(v => v.inStock);
        if (firstAvailable) {
          setSelectedVariant(firstAvailable);
        }
      }
    }
    return () => {
      dispatch(clearSelectedProduct());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (imageRef.current && contentRef.current) {
      AnimationController.staggerFadeIn([imageRef.current, contentRef.current], 0.2);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Product not found</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.variants && product.variants.length > 0) {
      if (!selectedVariant) {
        alert('Please select product options');
        return;
      }
      const cartItem: CartItem = {
        id: selectedVariant.id,
        productId: product.id,
        name: product.name,
        attributes: selectedVariant.attributes,
        image: selectedVariant.image,
        price: selectedVariant.price,
        quantity: 1
      };
      dispatch(addToCart(cartItem));
    } else {
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
  };

  const canAddToCart = product.variants 
    ? selectedVariant?.inStock 
    : true;

  const displayPrice = selectedVariant 
    ? `₹${selectedVariant.price}` 
    : `₹${product.price}`;

  const displayImage = selectedVariant 
    ? selectedVariant.image 
    : product.images[selectedImageIndex];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="container mx-auto px-6">
        {/* Back Button */}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative">
              <img
                ref={imageRef}
                src={displayImage}
                alt={product.name}
                className="w-full aspect-[4/5] object-cover rounded"
              />
            </div>
            {/* Image thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index 
                        ? 'border-neutral-900' 
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div 
            ref={contentRef}
            className="space-y-8"
          >
            <div>
              <span className="text-sm text-neutral-500 uppercase tracking-wider">
                {product.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-light mt-2 mb-4 text-neutral-900">
                {product.name}
              </h1>
              <p className="text-3xl font-light text-neutral-900">
                {displayPrice}
              </p>
            </div>

            <p className="text-neutral-600 leading-relaxed">
              {product.description}
            </p>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
              />
            )}

            {/* Add to Cart */}
            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`w-full py-4 rounded font-medium transition-all duration-200 ${
                  canAddToCart
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {canAddToCart ? 'Add to Cart' : 'Out of Stock'}
              </button>

              <p className="text-sm text-neutral-500 text-center">
                Free shipping on orders over ₹500
              </p>
            </div>

            {/* Product Details */}
            <div className="space-y-6 pt-8 border-t border-neutral-200">
              <div>
                <h3 className="font-medium mb-2 text-neutral-900">Details</h3>
                <p className="text-sm text-neutral-600">
                  Crafted with attention to detail and sustainable materials. 
                  Each piece is designed to last and age beautifully with time.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2 text-neutral-900">Care Instructions</h3>
                <p className="text-sm text-neutral-600">
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
