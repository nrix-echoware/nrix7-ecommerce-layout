import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Accepts the full Product type from types/product
import { Product } from '../types/product';

interface ProductCarouselProps {
  products: Product[];
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ products }) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!carouselRef.current) return;
    gsap.fromTo(
      carouselRef.current.children,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power2.out' }
    );
  }, [products]);

  return (
    <section className="py-24 px-6 bg-white" id="products">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-light mb-4 text-neutral-900">
            Featured Products
          </h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Handpicked pieces that represent the essence of minimal luxury and timeless design.
          </p>
        </div>
        <div
          ref={carouselRef}
          className="flex gap-8 overflow-x-auto pb-4 snap-x snap-mandatory max-w-6xl mx-auto"
        >
          {products.map((product, idx) => {
            // Use the first image for the card
            const image = product.images[0];
            // If product has variants, show the lowest price
            const price = product.variants && product.variants.length > 0
              ? Math.min(...product.variants.map(v => v.price))
              : product.price;
            // Tag for demo: show 'New' if featured
            const tag = product.featured ? 'New' : undefined;
            return (
              <div
                key={product.id}
                className="min-w-[320px] max-w-xs bg-white rounded-xl shadow minimal-shadow hover-lift transition-all duration-300 group relative snap-center"
              >
                <div className="relative overflow-hidden rounded-t-xl">
                  <img
                    src={image}
                    alt={product.name}
                    className="w-full h-64 object-cover transition-all duration-500 group-hover:scale-105"
                  />
                  {tag && (
                    <span className="absolute top-4 left-4 bg-neutral-900 text-white px-3 py-1 rounded-full text-xs font-semibold rotate-[-12deg] shadow-lg group-hover:rotate-0 transition-transform duration-300">
                      {tag}
                    </span>
                  )}
                </div>
                <div className="p-6 flex flex-col items-center">
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">{product.name}</h3>
                  <p className="text-neutral-600 mb-4">₹{price}</p>
                  <a
                    href={`/products/${product.id}`}
                    className="inline-block border-b-2 border-transparent hover:border-neutral-900 transition-all duration-300 text-neutral-900 font-medium"
                  >
                    View Product
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
