
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { AnimationController } from '../utils/animations';
import ProductCard from '../components/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap } from 'gsap';

const Home = () => {
  const { items: products } = useSelector((state: RootState) => state.products);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuredRef = useScrollAnimation();
  const textRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const featuredProducts = products.filter(p => p.featured);
  const heroProducts = featuredProducts.slice(0, 3);

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

      // Auto-advance carousel
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroProducts.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [heroProducts.length]);

  useEffect(() => {
    if (carouselRef.current) {
      gsap.to(carouselRef.current, {
        x: -currentSlide * 100 + '%',
        duration: 0.8,
        ease: "power2.inOut"
      });
    }
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroProducts.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Carousel */}
      <section 
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden bg-neutral-50"
      >
        {/* Hero Carousel */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            ref={carouselRef}
            className="flex h-full"
            style={{ width: `${heroProducts.length * 100}%` }}
          >
            {heroProducts.map((product, index) => (
              <div
                key={product.id}
                className="w-full h-full flex items-center justify-center relative"
                style={{ width: `${100 / heroProducts.length}%` }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white max-w-2xl mx-auto px-6">
                    <h2 className="text-4xl md:text-6xl font-light mb-4">
                      {product.name}
                    </h2>
                    <p className="text-lg md:text-xl mb-8 opacity-90">
                      {product.description}
                    </p>
                    <Link
                      to={`/products/${product.id}`}
                      className="inline-block bg-white text-neutral-900 px-8 py-3 rounded font-medium hover:bg-neutral-100 transition-colors"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors z-10"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors z-10"
        >
          <ChevronRight size={24} />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Hero Text Overlay */}
        <div 
          ref={textRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center max-w-4xl mx-auto px-6 z-10 pointer-events-none"
        >
          <h1 className="text-6xl md:text-8xl font-light mb-6 tracking-tight text-white mix-blend-difference">
            Minimal
          </h1>
          <h2 className="text-6xl md:text-8xl font-light mb-8 tracking-tight text-white mix-blend-difference">
            Luxury
          </h2>
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
          <p className="text-lg text-neutral-600 leading-relaxed mb-12">
            Less is more. Beauty lies in restraint. Elegance is found in the essential.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-neutral-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-medium mb-2 text-neutral-900">Quality</h3>
              <p className="text-neutral-600">Premium materials and craftsmanship in every piece.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-neutral-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-medium mb-2 text-neutral-900">Minimal</h3>
              <p className="text-neutral-600">Clean lines and essential forms that stand the test of time.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-neutral-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-medium mb-2 text-neutral-900">Sustainable</h3>
              <p className="text-neutral-600">Responsible sourcing and eco-friendly practices.</p>
            </div>
          </div>

          <div className="mt-16">
            <Link
              to="/about"
              className="inline-block bg-neutral-900 text-white px-8 py-3 rounded font-medium hover:bg-neutral-800 transition-colors"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-4 text-neutral-900">
            Stay Updated
          </h2>
          <p className="text-neutral-600 mb-8">
            Subscribe to our newsletter for early access to new collections and exclusive offers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
            <button className="bg-neutral-900 text-white px-6 py-3 rounded font-medium hover:bg-neutral-800 transition-colors">
              Subscribe
            </button>
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
