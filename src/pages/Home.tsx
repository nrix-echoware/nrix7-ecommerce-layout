import React, { useState, useEffect } from 'react';
import HeroSlider from '../components/HeroSlider';
import ParallaxSection from '../components/ParallaxSection';
import ProductCarousel from '../components/ProductCarousel';
import CTAButton from '../components/CTAButton';
import PageLoader from '../components/PageLoader';
import PromotionalReels from '../components/PromotionalReels';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchProductsPaginated } from '../api/productsApi';
import { promotionalReels } from '../data/promotionalReels';

gsap.registerPlugin(ScrollTrigger);

const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    fetchProductsPaginated(0, 3)
      .then((products) => setFeatured(products))
      .catch(() => setFeatured([]));
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // GSAP animations can be added here if needed
    });

    return () => ctx.revert(); // cleanup
  }, []);

  useEffect(() => {
    // GSAP entrance for magazine featured products
    gsap.utils.toArray('.magazine-featured-product').forEach((el, i) => {
      gsap.fromTo(
        el as Element,
        { opacity: 0, y: 80 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          delay: 0.2 + i * 0.18,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el as Element,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
  }, [featured]);

  if (loading) {
    return <PageLoader onComplete={() => setLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with scroll hijack and GSAP timeline */}
      <HeroSlider />

      <div style={{marginTop: '7rem'}}></div>
      {/* Parallax Panels for categories */}
      <ParallaxSection
        title="Modern Essentials"
        bgImage="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=80&fit=crop"
        fgImage="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80&fit=crop"
      >
        <p className="text-black text-neutral-600 max-w-xl mx-auto mb-4">
          Discover our curated selection of timeless, minimal pieces.
        </p>
        <CTAButton href="/products">Shop Now</CTAButton>
      </ParallaxSection>
      <ParallaxSection
        title="Sculpted Accessories"
        bgImage="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=1200&q=80&fit=crop"
        fgImage="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80&fit=crop"
      >
        <p className="text-black text-neutral-600 max-w-xl mx-auto mb-4">
          Elevate your look with sculpted bags and refined details.
        </p>
      </ParallaxSection>

      {/* Luxury Magazine-Style Featured Products Section */}
      <section id="featured-magazine" className="py-20 px-2 sm:px-4 md:px-0 bg-white">
        <div className="container mx-auto max-w-5xl px-0 sm:px-4">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-light text-neutral-900 mb-12 sm:mb-20 text-center tracking-tight luxury-title">
            Featured <span className="italic font-serif">Edit</span>
          </h2>
          <div className="flex flex-col gap-16 sm:gap-24 md:gap-32">
            {featured.map((product, idx) => (
              <div
                key={product.id}
                className={`relative flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-0 group magazine-featured-product ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                style={{ minHeight: '420px' }}
              >
                {/* Accent SVG shape with GSAP morphing */}
                <svg
                  className={`absolute z-0 ${idx % 2 === 0 ? 'left-[-40px] sm:left-[-80px] md:left-[-120px]' : 'right-[-40px] sm:right-[-80px] md:right-[-120px]'} top-1/2 -translate-y-1/2 opacity-20 pointer-events-none magazine-svg-accent`}
                  width="240" height="320" viewBox="0 0 340 420" fill="none"
                >
                  <path id={`magazine-shape-${idx}`} d="M60,60 Q170,0 280,60 Q340,210 170,420 Q0,210 60,60 Z" fill="#222" />
                </svg>
                {/* Product Image */}
                <div className="relative z-10 w-full md:w-1/2 flex justify-center items-center px-2 sm:px-4 md:px-0">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="rounded-2xl sm:rounded-3xl shadow-2xl object-cover w-full max-w-[320px] sm:max-w-[420px] aspect-[4/5] grayscale-[0.1] hover:grayscale-0 transition-all duration-700 magazine-img"
                    loading="lazy"
                  />
                </div>
                {/* Product Details */}
                <div className="relative z-10 w-full md:w-1/2 flex flex-col justify-center px-2 sm:px-6 md:px-12 py-8 md:py-0">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light mb-4 sm:mb-6 text-neutral-900 tracking-tight luxury-product-title">
                    {product.name}
                  </h3>
                  <p className="text-base sm:text-lg md:text-xl text-neutral-600 mb-6 sm:mb-8 max-w-lg luxury-product-desc">
                    {product.description}
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-8">
                    <span className="text-xl sm:text-2xl font-medium text-neutral-900 luxury-product-price">
                      {product.variants && product.variants.length > 0
                        ? `From ₹${Math.min(...product.variants.map(v => v.price))}`
                        : `₹${product.price}`}
                    </span>
                    <CTAButton href={`/products/${product.id}`}>View Product</CTAButton>
                  </div>
                  {/* {product.featured && (
                    <span className="inline-block bg-neutral-900 text-white px-4 py-1 rounded-full text-xs font-semibold tracking-widest shadow magazine-featured-tag animate-pulse">
                      Featured
                    </span>
                  )} */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Reels Section */}
      <PromotionalReels reels={promotionalReels} />

      {/* Newsletter/CTA Section */}
      <section className="py-24 px-6 bg-neutral-50">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-4 text-neutral-900">
            Stay Updated
          </h2>
          <p className="text-neutral-600 mb-8">
            Subscribe for early access to new collections and exclusive offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
            <CTAButton>Subscribe</CTAButton>
          </div>
          <p className="text-xs text-neutral-500 mt-4">
            No spam, unsubscribe at any time.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
