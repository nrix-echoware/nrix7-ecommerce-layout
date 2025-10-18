import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setCategory } from '../store/slices/productsSlice';
import ProductListItem from '../components/ProductListItem';
import { fetchProductsPaginated } from '../api/productsApi';

const TAKE = 12;

const Products = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { category } = useSelector((state: RootState) => state.products);
  const gridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<any[]>([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [emptyHits, setEmptyHits] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const next = await fetchProductsPaginated(skip, TAKE);
      if (!next || next.length === 0) {
        setEmptyHits((e) => e + 1);
      } else {
        setItems((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const merged = [...prev, ...next.filter((p) => !existingIds.has(p.id))];
          return merged;
        });
        setSkip((s) => s + TAKE);
        setEmptyHits(0);
      }
    } catch (e) {
      // no-op; keep current state
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, skip]);

  useEffect(() => {
    setHasMore(emptyHits < 2);
  }, [emptyHits]);

  useEffect(() => {
    // initial load
    if (items.length === 0) {
      loadMore();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [loadMore]);

  const filtered = category === 'all' ? items : items.filter((p) => p.category === category);

  const handleCategoryChange = (newCategory: 'all' | 'fashion' | 'electronics') => {
    dispatch(setCategory(newCategory));
  };

  return (
    <div className="min-h-screen pb-16 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light mb-4 text-neutral-900">
            Collection
          </h1>
          <p className="text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Discover our carefully curated selection of minimal luxury pieces designed for the modern aesthetic.
          </p>
        </div>

        {/* Optional filters (kept hidden/commented) */}
        {/* <div className="flex justify-center mb-6">
          <div className="flex gap-1 p-1 bg-neutral-100 rounded">
            {['all','fashion','electronics'].map((v) => (
              <button
                key={v}
                onClick={() => handleCategoryChange(v as any)}
                className={`px-6 py-2 rounded text-sm font-medium transition-all duration-300 ${
                  category === v
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div> */}

        <div 
          ref={gridRef}
          className="max-w-6xl w-full px-4 sm:px-0 mx-auto"
        >
          <div className="text-sm text-neutral-500 mb-4 text-center sm:text-left">{filtered.length} results</div>
          <div className="space-y-6 sm:space-y-0 sm:divide-y sm:divide-neutral-200">
            {filtered.map((product, index) => (
              <div key={`${product.id}-${index}`}>
                <ProductListItem product={product} />
              </div>
            ))}
          </div>
        </div>

        <div ref={sentinelRef} className="w-full h-12 flex items-center justify-center mt-8">
          {loading && <span className="text-neutral-500 text-sm">Loading more…</span>}
          {!hasMore && <span className="text-neutral-400 text-sm">You’ve reached the end.</span>}
        </div>
      </div>
    </div>
  );
};

export default Products;
