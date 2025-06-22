
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { AnimationController } from '../utils/animations';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const { items: products } = useSelector((state: RootState) => state.products);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuredRef = useScrollAnimation();
  const textRef = useRef<HTMLDivElement>(null);

  const featuredProducts = products.filter(p => p.featured).slice(0, 6);

  useEffect(() => {
    if (heroRef.current && textRef.current) {
      const tl = AnimationController.tl;
      
      tl.fromTo(textRef.current.children,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power2.out",
          delay: 0.5
        }
      );

      // Parallax effect for hero
      AnimationController.parallaxScroll(heroRef.current, 0.3);
    }

    return () => {
      AnimationController.cleanup();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden bg-neutral-50"
      >
        <div 
          ref={textRef}
          className="text-center max-w-4xl mx-auto px-6 z-10"
        >
          <h1 className="text-6xl md:text-8xl font-light mb-6 tracking-tight text-neutral-900">
            Minimal
          </h1>
          <h2 className="text-6xl md:text-8xl font-light mb-8 tracking-tight text-neutral-900">
            Luxury
          </h2>
          <p className="text-lg md:text-xl text-neutral-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Discover our curated collection of minimal design pieces that embody elegance and functionality.
          </p>
          <Link
            to="/products"
            className="inline-block bg-neutral-900 text-white px-8 py-3 rounded text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Explore Collection
          </Link>
        </div>

        {/* Floating geometric shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-neutral-300 rounded-full animate-[morph_8s_ease-in-out_infinite] opacity-50" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-neutral-300 animate-[morph_6s_ease-in-out_infinite_reverse] opacity-50" />
        </div>
      </section>

      {/* Featured Products */}
      <section 
        ref={featuredRef}
        className="py-24 px-6"
      >
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light mb-4 text-neutral-900">
              Featured Products
            </h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Handpicked pieces that represent the essence of minimal luxury and timeless design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {featuredProducts.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                index={index}
              />
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              to="/products"
              className="inline-block border border-neutral-900 text-neutral-900 px-8 py-3 rounded text-sm font-medium hover:bg-neutral-900 hover:text-white transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-6 bg-neutral-50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-8 text-neutral-900">
            Philosophy
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed mb-8">
            We believe in the power of simplicity. Every piece in our collection is carefully selected 
            to embody the principles of minimal design while maintaining the highest standards of quality and functionality.
          </p>
          <p className="text-lg text-neutral-600 leading-relaxed">
            Less is more. Beauty lies in restraint. Elegance is found in the essential.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
