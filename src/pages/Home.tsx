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
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

gsap.registerPlugin(ScrollTrigger);

const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState([]);
  const config = useSelector((s: RootState) => s.siteConfig.config);
  const reels = useSelector((s: RootState) => s.siteConfig.config.reels);

  useEffect(() => {
    fetchProductsPaginated(0, config.featured.take || 3)
      .then((products) => setFeatured(products ?? []))
      .catch(() => setFeatured([]));
  }, [config.featured.take]);

  useEffect(() => {
    if (!config.animations.enabled) return;
    const ctx = gsap.context(() => {
      if (config.animations.scrollReveal) {
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

      <div style={{marginTop: '7rem'}}></div>
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

      <section id="featured-magazine" className="py-20 px-2 sm:px-4 md:px-0 bg-white">
        <div className="container mx-auto max-w-5xl px-0 sm:px-4">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-light text-neutral-900 mb-12 sm:mb-20 text-center tracking-tight luxury-title">
            Featured <span className="italic font-serif">Edit</span>
          </h2>
          <div className="flex flex-col gap-16 sm:gap-24 md:gap-32">
            {featured?.map((product, idx) => (
              <div
                key={product.id}
                className={`relative flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-0 group magazine-featured-product ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                style={{ minHeight: '420px' }}
              >
                <div className="relative z-10 w-full md:w-1/2 flex justify-center items-center px-2 sm:px-4 md:px-0">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="rounded-2xl sm:rounded-3xl shadow-2xl object-cover w-full max-w-[320px] sm:max-w-[420px] aspect-[4/5] grayscale-[0.1] hover:grayscale-0 transition-all duration-700 magazine-img"
                    loading="lazy"
                  />
                </div>
                <div className="relative z-10 w-full md:w-1/2 flex flex-col justify-center px-2 sm:px-6 md:px-12 py-8 md:py-0">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-light mb-3 sm:mb-4 text-neutral-900 tracking-tight luxury-product-title" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.name}
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-neutral-600 mb-6 sm:mb-8 max-w-lg luxury-product-desc" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PromotionalReels reels={reels} />

      {config.faq && config.faq.length > 0 && (
        <section className="py-16 bg-neutral-50">
          <div className="container mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-light text-neutral-900 mb-8">FAQs</h2>
            <div className="space-y-4">
              {config.faq.map((item, i) => (
                <div key={i} className="border rounded p-4 bg-white">
                  <h3 className="font-medium text-neutral-900">{item.question}</h3>
                  <p className="text-neutral-700 mt-1">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
