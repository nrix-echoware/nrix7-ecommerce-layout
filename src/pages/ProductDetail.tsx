import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProductById } from '../api/productsApi';
import { AnimationController } from '../utils/animations';
import { ArrowLeft } from 'lucide-react';
import VariantSelector from '../components/VariantSelector';
import { Variant, Product, CartItem } from '../types/product';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [imageOverrideUrl, setImageOverrideUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetchProductById(id)
      .then((data) => {
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          const firstAvailable = data.variants.find(v => v.inStock) || data.variants[0];
          setSelectedVariant(firstAvailable);
        } else {
          setSelectedVariant(null);
        }
        setSelectedImageIndex(0);
        setImageOverrideUrl(null);
      })
      .catch(() => {
        setError('Product not found');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (imageRef.current && contentRef.current && product) {
      AnimationController.staggerFadeIn([imageRef.current, contentRef.current], 0.2);
    }
  }, [product]);

  // Sync to variant image if present; clear manual override on variant change
  useEffect(() => {
    if (!product) return;
    setImageOverrideUrl(null);
    if (selectedVariant) {
      const idx = product.images.findIndex(img => img === selectedVariant.image);
      if (idx >= 0) setSelectedImageIndex(idx);
    }
  }, [selectedVariant, product]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">{error || 'Product not found'}</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.variants && product.variants.length > 0) {
      if (!selectedVariant) {
        toast.error('Please select product options');
        return;
      }
      if (!selectedVariant.inStock) {
        toast.error('Selected variant is out of stock');
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
      toast.success('Added to cart');
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
      toast.success('Added to cart');
    }
  };

  const canAddToCart = product.variants 
    ? selectedVariant?.inStock 
    : true;

  const displayPrice = selectedVariant ? `₹${selectedVariant.price}` : `₹${product.price}`;

  const displayImage = imageOverrideUrl
    ? imageOverrideUrl
    : (selectedVariant && selectedVariant.image) ? selectedVariant.image : product.images[selectedImageIndex];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="container mx-auto px-6">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
          <div className="space-y-4">
            <div className="relative">
              <img
                ref={imageRef}
                src={displayImage}
                alt={product.name}
                className="w-full aspect-[4/5] object-cover rounded"
              />
            </div>
            {(product.images.length > 1 || (selectedVariant && !product.images.includes(selectedVariant.image))) && (
              <div className="flex gap-2 flex-wrap">
                {product.images.map((image, index) => (
                  <button
                    key={`thumb-${index}`}
                    onClick={() => { setSelectedImageIndex(index); setImageOverrideUrl(product.images[index]); }}
                    className={`w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                      (imageOverrideUrl ? product.images[index] === imageOverrideUrl : selectedImageIndex === index)
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
                {selectedVariant && selectedVariant.image && !product.images.includes(selectedVariant.image) && (
                  <button
                    key={`thumb-variant`}
                    onClick={() => { setImageOverrideUrl(selectedVariant.image); }}
                    className={`w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                      imageOverrideUrl === selectedVariant.image ? 'border-neutral-900' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <img src={selectedVariant.image} alt={`Variant`} className="w-full h-full object-cover" />
                  </button>
                )}
              </div>
            )}
          </div>

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

            {product.variants && product.variants.length > 0 && (
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onVariantChange={(v) => {
                  setSelectedVariant(v);
                }}
              />
            )}

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
