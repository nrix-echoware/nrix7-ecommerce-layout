import { useEffect, useRef, useState } from 'react';
import { Product, Variant } from '../../types/product';
import VariantSelector from '../VariantSelector';
import { AnimationController } from '../../utils/animations';

export default function ProductPreview({ product }: { product: Product }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const firstAvailable = product.variants.find(v => v.inStock);
      if (firstAvailable) setSelectedVariant(firstAvailable);
    }
  }, [product]);

  useEffect(() => {
    if (imageRef.current && contentRef.current && product) {
      AnimationController.staggerFadeIn([imageRef.current, contentRef.current], 0.2);
    }
  }, [product]);

  const displayPrice = selectedVariant 
    ? `₹${selectedVariant.price}` 
    : `₹${product.price}`;

  const displayImage = selectedVariant 
    ? selectedVariant.image 
    : product.images[selectedImageIndex];

  return (
    <div className="bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div className="space-y-4">
          <div className="relative">
            <img
              ref={imageRef}
              src={displayImage}
              alt={product.name}
              className="w-full aspect-[4/5] object-cover rounded"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-14 h-14 rounded overflow-hidden border-2 transition-colors ${
                    selectedImageIndex === index 
                      ? 'border-neutral-900' 
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={contentRef} className="space-y-6">
          <div>
            <span className="text-sm text-neutral-500 uppercase tracking-wider">
              {product.category}
            </span>
            <h1 className="text-3xl font-light mt-2 mb-3 text-neutral-900 truncate" title={product.name}>
              {product.name}
            </h1>
            <p className="text-2xl font-light text-neutral-900">
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
              onVariantChange={setSelectedVariant}
            />
          )}
        </div>
      </div>
    </div>
  );
} 