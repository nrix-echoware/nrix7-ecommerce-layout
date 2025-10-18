import React, { useState, useEffect, useRef } from 'react';
import HeroSlider from '../components/HeroSlider';
import ParallaxSection from '../components/ParallaxSection';
import ProductCarousel from '../components/ProductCarousel';
import CTAButton from '../components/CTAButton';
import PageLoader from '../components/PageLoader';
import PromotionalReels from '../components/PromotionalReels';
import DeliveryVisualization from '../components/DeliveryVisualization';
import Footer from '../components/Footer';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchProductsPaginated } from '../api/productsApi';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Package, Truck, CheckCircle, Star } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState([]);
  const config = useSelector((s: RootState) => s.siteConfig.config);
  const reels = useSelector((s: RootState) => s.siteConfig.config.reels);
  const statsRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const deliveryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProductsPaginated(0, config.featured.take || 3)
      .then((products) => setFeatured(products ?? []))
      .catch(() => setFeatured([]));
  }, [config.featured.take]);

  useEffect(() => {
    if (!config.animations.enabled) return;
    const ctx = gsap.context(() => {
      if (config.animations.scrollReveal) {
        // Featured products animation
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

        // Trust badges animation
        gsap.utils.toArray('.trust-badge').forEach((el, i) => {
          gsap.fromTo(
            el as Element,
            { opacity: 0, scale: 0.8 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.6,
              delay: i * 0.1,
              ease: 'back.out(1.7)',
              scrollTrigger: {
                trigger: el as Element,
                start: 'top 85%',
              },
            }
          );
        });

        // Delivery section animation
        if (deliveryRef.current) {
          gsap.fromTo(
            deliveryRef.current,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: deliveryRef.current,
                start: 'top 80%',
              },
            }
          );
        }
      }
    });

    return () => ctx.revert();
  }, [featured, config.animations]);

  if (loading) {
    return <PageLoader onComplete={() => setLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <HeroSlider />

      {/* Stats Section */}
      {config.stats && config.stats.length > 0 && (
        <section ref={statsRef} className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-neutral-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {config.stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-neutral-900 mb-1 sm:mb-2">{s.value}</div>
                  <p className="text-xs sm:text-sm md:text-base text-neutral-600">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Badges */}
      <section className="py-6 sm:py-10 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            <div className="trust-badge flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-neutral-50 rounded-full">
              <Package className="text-neutral-900" size={18} />
              <span className="text-neutral-900 font-medium text-xs sm:text-sm md:text-base">Free Shipping</span>
            </div>
            <div className="trust-badge flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-neutral-50 rounded-full">
              <Truck className="text-neutral-900" size={18} />
              <span className="text-neutral-900 font-medium text-xs sm:text-sm md:text-base">Fast Delivery</span>
            </div>
            <div className="trust-badge flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-neutral-50 rounded-full">
              <CheckCircle className="text-neutral-900" size={18} />
              <span className="text-neutral-900 font-medium text-xs sm:text-sm md:text-base">Quality Assured</span>
            </div>
            <div className="trust-badge flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-neutral-50 rounded-full">
              <Star className="text-neutral-900" size={18} />
              <span className="text-neutral-900 font-medium text-xs sm:text-sm md:text-base">Top Rated</span>
            </div>
          </div>
        </div>
      </section>

      {config.parallax.map((sec, i) => (
        <ParallaxSection key={i}
          title={sec.title}
          bgImage={sec.bgImage}
          fgImage={sec.fgImage}
        >
          {sec.text && (
            <p className="text-black text-neutral-600 max-w-xl mx-auto mb-4">{sec.text}</p>
          )}
          {sec.cta && (
            <CTAButton href={sec.cta.href}>{sec.cta.text}</CTAButton>
          )}
        </ParallaxSection>
      ))}

      <section id="featured-magazine" className="py-8 sm:py-12 md:py-16 lg:py-20 px-2 sm:px-4 md:px-0 bg-white">
        <div className="container mx-auto max-w-5xl px-0 sm:px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light text-neutral-900 mb-6 sm:mb-10 md:mb-16 lg:mb-20 text-center tracking-tight luxury-title">
            Featured <span className="italic font-serif">Edit</span>
          </h2>
          <div className="flex flex-col gap-8 sm:gap-12 md:gap-16 lg:gap-24 xl:gap-32">
            {featured?.map((product, idx) => (
              <div
                key={product.id}
                className={`relative flex flex-col md:flex-row items-center md:items-stretch gap-4 sm:gap-6 md:gap-0 group magazine-featured-product ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="relative z-10 w-full md:w-1/2 flex justify-center items-center px-2 sm:px-4 md:px-0">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl sm:shadow-2xl object-cover w-full max-w-[240px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[420px] aspect-[4/5] grayscale-[0.1] hover:grayscale-0 transition-all duration-700 magazine-img"
                    loading="lazy"
                  />
                </div>
                <div className="relative z-10 w-full md:w-1/2 flex flex-col justify-center px-2 sm:px-4 md:px-8 lg:px-12 py-4 sm:py-6 md:py-0">
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif font-light mb-2 sm:mb-3 md:mb-4 text-neutral-900 tracking-tight luxury-product-title" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.name}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg text-neutral-600 mb-3 sm:mb-4 md:mb-6 lg:mb-8 max-w-lg luxury-product-desc" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.description}
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
                    <span className="text-lg sm:text-xl md:text-xl lg:text-2xl font-medium text-neutral-900 luxury-product-price">
                      {product.variants && product.variants.length > 0
                        ? `From ₹${Math.min(...product.variants.map(v => v.price))}`
                        : `₹${product.price}`}
                    </span>
                    <CTAButton href={`/products/${product.id}`}>View Product</CTAButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PromotionalReels reels={reels} />

      {/* Delivery Process Section */}
      <section ref={deliveryRef} className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-neutral-900 mb-2 sm:mb-3 md:mb-4 tracking-tight">
            Seamless <span className="italic font-serif">Delivery</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl mx-auto mb-4 sm:mb-6 md:mb-8">
            Experience transparent logistics from seller to your doorstep
          </p>
          <CTAButton href="/how-we-work">Watch Our Process</CTAButton>
        </div>
      </section>

      {config.faq && config.faq.length > 0 && (
        <section className="py-8 sm:py-12 md:py-16 bg-neutral-50">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-neutral-900 mb-4 sm:mb-6 md:mb-8">FAQs</h2>
            <div className="space-y-3 sm:space-y-4">
              {config.faq.slice(0, 3).map((item, i) => (
                <div key={i} className="border rounded p-3 sm:p-4 bg-white">
                  <h3 className="font-medium text-neutral-900 text-sm sm:text-base">{item.question}</h3>
                  <p className="text-neutral-700 mt-1 text-xs sm:text-sm md:text-base">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer - Only on Homepage */}
      <Footer />
    </div>
  );
};

export default Home;
