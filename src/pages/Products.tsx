
import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setCategory } from '../store/slices/productsSlice';
import { AnimationController } from '../utils/animations';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const dispatch = useDispatch();
  const { items: allProducts, category } = useSelector((state: RootState) => state.products);
  const gridRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [filteredProducts, setFilteredProducts] = useState(allProducts);

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'electronics', label: 'Electronics' }
  ] as const;

  useEffect(() => {
    const products = category === 'all' 
      ? allProducts 
      : allProducts.filter(p => p.category === category);
    
    setFilteredProducts(products);

    // Animate grid items when filter changes
    if (gridRef.current) {
      const gridItems = gridRef.current.children;
      AnimationController.staggerFadeIn(Array.from(gridItems) as HTMLElement[], 0.05);
    }
  }, [category, allProducts]);

  useEffect(() => {
    if (filtersRef.current) {
      AnimationController.pageTransition(filtersRef.current, 'in');
    }
  }, []);

  const handleCategoryChange = (newCategory: 'all' | 'fashion' | 'electronics') => {
    dispatch(setCategory(newCategory));
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-playfair font-light mb-4">
            Collection
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our carefully curated selection of minimal luxury pieces designed for the modern aesthetic.
          </p>
        </div>

        {/* Filters */}
        <div 
          ref={filtersRef}
          className="flex justify-center mb-12"
        >
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-6 py-2 rounded text-sm font-medium transition-all duration-300 ${
                  category === cat.value
                    ? 'bg-background text-foreground elegant-shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto"
        >
          {filteredProducts.map((product, index) => (
            <ProductCard 
              key={`${product.id}-${category}`} 
              product={product} 
              index={index}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
