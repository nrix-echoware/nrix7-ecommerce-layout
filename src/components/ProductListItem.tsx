import { Link } from 'react-router-dom';
import { Product } from '../types/product';

export default function ProductListItem({ product }: { product: Product }) {
  const price = product.variants && product.variants.length > 0
    ? Math.min(...product.variants.map(v => v.price))
    : product.price;

  return (
    <div className="w-full border-b border-neutral-200 py-4">
      {/* Mobile Layout - Vertical Card */}
      <div className="block sm:hidden">
        <div className="space-y-3">
          <Link to={`/products/${product.id}`} className="block">
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full h-56 object-contain rounded" 
            />
          </Link>
          <div className="space-y-2">
            <Link to={`/products/${product.id}`} className="block">
              <h3 className="text-lg font-medium text-neutral-900 hover:underline">
                {product.name}
              </h3>
            </Link>
            <div className="text-xl font-semibold text-neutral-900">₹{price}</div>
            <div className="text-xs text-neutral-500">Inclusive of taxes</div>
            {product.description && (
              <p
                className="text-sm text-neutral-700"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {product.description}
              </p>
            )}
            <Link
              to={`/products/${product.id}`}
              className="inline-block mt-2 px-4 py-2 bg-neutral-900 text-white rounded text-sm hover:bg-neutral-800"
            >
              View details
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Horizontal List */}
      <div className="hidden sm:flex gap-4" style={{alignItems: 'center'}}>
        <div className="w-48 flex-shrink-0">
          <Link to={`/products/${product.id}`} className="block">
            <img src={product.images[0]} alt={product.name} className="w-full h-auto object-cover rounded" />
          </Link>
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/products/${product.id}`} className="block">
            <h3 className="text-lg font-medium text-neutral-900 hover:underline truncate">
              {product.name}
            </h3>
          </Link>
          {product.description && (
            <p
              className="text-sm text-neutral-700 mt-2"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {product.description}
            </p>
          )}
        </div>
        <div className="w-40 flex-shrink-0 text-right">
          <div className="text-xl font-semibold text-neutral-900">₹{price}</div>
          <div className="text-xs text-neutral-500">Inclusive of taxes</div>
          <Link
            to={`/products/${product.id}`}
            className="inline-block mt-3 px-3 py-2 bg-neutral-900 text-white rounded text-sm hover:bg-neutral-800"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  );
} 
