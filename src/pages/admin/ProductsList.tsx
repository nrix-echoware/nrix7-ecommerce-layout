import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types/product';
import { listProducts, deleteProduct } from '../../api/adminProductsApi';
import ProductTable from '../../components/admin/ProductTable';
import TopProductCards from '../../components/admin/TopProductCards';
import { Plus, RefreshCw } from 'lucide-react';

interface ProductsListProps {
  onAuthError: () => void;
}

export default function ProductsList({ onAuthError }: ProductsListProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const take = 10;

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const items = await listProducts(page * take, take);
      setProducts(items);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        onAuthError();
      } else {
        setError(e?.message || 'Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  async function handleDelete(id: string) {
    try {
      await deleteProduct(id);
      await load();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        onAuthError();
      } else {
        setError(e?.message || 'Failed to delete');
      }
    }
  }

  function handleEdit(product: Product) {
    navigate(`/admin/products/edit/${product.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your product catalog</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/admin/products/create')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            New Product
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 text-red-700 bg-red-50">
          {error}
        </div>
      )}

      {!loading && products.length > 0 && (
        <TopProductCards products={products} onEdit={handleEdit} />
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">All Products</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <div className="text-sm text-gray-600 font-medium">Page {page + 1}</div>
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}

