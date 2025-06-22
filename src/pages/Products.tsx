
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
    { value: 'all', label: 'All Products' },
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
      AnimationController.staggerFadeIn(Array.from(gridItems) as HTMLElement[], 0.03);
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
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-light mb-4 text-neutral-900">
            Collection
          </h1>
          <p className="text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Discover our carefully curated selection of minimal luxury pieces designed for the modern aesthetic.
          </p>
        </div>

        {/* Filters */}
        {/* <div 
          ref={filtersRef}
          className="flex justify-center mb-16"
        >
          <div className="flex gap-1 p-1 bg-neutral-100 rounded">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-6 py-2 rounded text-sm font-medium transition-all duration-300 ${
                  category === cat.value
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div> */}

        {/* Section Headings */}
        <div className="mb-8">
          <h2 className="text-2xl font-light text-neutral-900 mb-2">
            {category === 'all' ? 'All Products' : 
             category === 'fashion' ? 'Fashion Collection' : 
             'Electronics & Tech'}
          </h2>
          <p className="text-sm text-neutral-500">
            {filteredProducts.length} items
          </p>
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
            <p className="text-neutral-500">No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
