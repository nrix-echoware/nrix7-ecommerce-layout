import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchProductById } from '../api/productsApi';
import { AnimationController } from '../utils/animations';
import { ArrowLeft } from 'lucide-react';
import VariantSelector from '../components/VariantSelector';
import { Variant, Product, CartItem } from '../types/product';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { toast } from 'sonner';
import { CommentSection } from '../components/comments';
import ContactUsModal from '@/components/ContactUsModal';
import { RootState } from '@/store/store';

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
  const [contactOpen, setContactOpen] = useState(false);
  const storeOwner = useSelector((s: RootState) => s.siteConfig.config.storeOwner);
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

  const canAddToCart = product.is_active !== false && (
    product.variants
      ? selectedVariant?.inStock && selectedVariant?.is_active !== false
      : true
  );

  const displayPrice = selectedVariant ? `₹${selectedVariant.price}` : `₹${product.price}`;

  const displayImage = imageOverrideUrl
    ? imageOverrideUrl
    : (selectedVariant && selectedVariant.image) ? selectedVariant.image : product.images[selectedImageIndex];

  // Create a unique set of images from product images and variant images
  const allImages = new Set<string>([
    ...product.images,
    ...(product.variants?.map(v => v.image).filter(Boolean) || [])
  ]);
  const uniqueImages = Array.from(allImages);

  return (
    <div className="min-h-screen pb-16 bg-white">
      <div className="container mx-auto px-6">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 max-w-6xl mx-auto">
          <div className="space-y-4">
            <div className="relative">
              <img
                ref={imageRef}
                src={displayImage}
                alt={product.name}
                className="w-full aspect-[4/5] object-cover rounded"
              />
            </div>
            {uniqueImages.length > 1 && (
              <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                {uniqueImages.map((image, index) => (
                  <button
                    key={`thumb-${image}`}
                    onClick={() => { setImageOverrideUrl(image); }}
                    className={`w-12 h-12 md:w-16 md:h-16 rounded overflow-hidden border-2 transition-colors ${imageOverrideUrl === image || (displayImage === image && !imageOverrideUrl)
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

          <div
            ref={contentRef}
            className="space-y-6 md:space-y-8 px-4 md:px-0"
          >
            <div className="text-center md:text-left space-y-3">
              <span className="text-sm text-neutral-500 uppercase tracking-wider block">
                {product.category}
              </span>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-light text-neutral-900 leading-tight">
                {product.name}
              </h1>
              <p className="text-xl md:text-3xl font-light text-neutral-900">
                {displayPrice}
              </p>
            </div>

            <div className="text-center md:text-left">
              <p className="text-neutral-600 leading-relaxed text-sm md:text-base">
                {product.description}
              </p>
            </div>

            {product.variants && product.variants.length > 0 && (
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onVariantChange={(v) => {
                  setSelectedVariant(v);
                }}
              />
            )}

            <div className="space-y-4 text-center md:text-left">
              {product.is_active === false && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-center">
                  <p className="text-sm text-yellow-800 font-medium">This product is currently unavailable for purchase.</p>
                  <p className="text-xs text-yellow-700 mt-1">It is displayed for viewing purposes only.</p>
                </div>
              )}
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`w-full py-3 md:py-4 rounded font-medium transition-all duration-200 text-sm md:text-base ${canAddToCart
                  ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
              >
                {canAddToCart 
                  ? 'Add to Cart' 
                  : product.is_active === false 
                    ? 'Product Unavailable' 
                    : 'Out of Stock'
                }
              </button>

              <p className="text-xs md:text-sm text-neutral-500">
                Free shipping on orders over ₹500
              </p>
            </div>

            {/* Comments Section */}
            <div className="pt-8 border-t border-neutral-200">
              <CommentSection productId={product.id} />
            </div>


            <div className="space-y-6 pt-8 border-t border-neutral-200">
              <div>
                <h3 className="font-medium mb-2 text-neutral-900">Need More Support?</h3>
                <div className="text-sm text-neutral-600">
                  {storeOwner && (storeOwner.email || storeOwner.phone) && (
                    <p className="text-sm text-neutral-600 mb-6">For urgent queries contact {storeOwner.name ? storeOwner.name + ' at ' : ''}
                      {storeOwner.email && (<a className="underline" href={`mailto:${storeOwner.email}`}>{storeOwner.email}</a>)}
                      {(storeOwner.email && storeOwner.phone) && ' or '}
                      {storeOwner.phone && (<a className="underline" href={`tel:${storeOwner.phone}`}>{storeOwner.phone}</a>)}</p>
                  )}
                  <button
                    onClick={() => setContactOpen(true)}
                    className="inline-block bg-neutral-900 text-white px-8 py-3 rounded font-medium hover:bg-neutral-800 transition-colors"
                  >
                    Contact Us
                  </button>
                  <ContactUsModal 
                    isOpen={contactOpen} 
                    onClose={() => setContactOpen(false)} 
                    message={`I have a question about the product ${product.name}`}
                  />
                </div> 
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
