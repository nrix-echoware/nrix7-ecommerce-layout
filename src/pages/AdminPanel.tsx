import { useEffect, useMemo, useState } from 'react';
import { Product } from '../types/product';
import { listProducts, createProduct, updateProduct, deleteProduct } from '../api/adminProductsApi';
import ProductTable from '../components/admin/ProductTable';
import ProductForm from '../components/admin/ProductForm';
import AdminKeyPrompt from '../components/admin/AdminKeyPrompt';
import TopProductCards from '../components/admin/TopProductCards';
import { generateId } from '../lib/admin';

const ADMIN_KEY_STORAGE = 'admin_api_key';

function useAdminKey() {
  const [adminKey, setAdminKey] = useState<string | null>(() => sessionStorage.getItem(ADMIN_KEY_STORAGE));
  const [needsPrompt, setNeedsPrompt] = useState(!adminKey);

  const save = (key: string) => {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
    setAdminKey(key);
    setNeedsPrompt(false);
  };

  const clear = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey(null);
    setNeedsPrompt(true);
  };

  return { adminKey, needsPrompt, save, clear };
}

const emptyProduct = (): Product => ({
  id: generateId(),
  name: '',
  category: 'fashion',
  description: '',
  images: [''],
  price: 0,
  variants: [],
  featured: false,
});

export default function AdminPanel() {
  const { needsPrompt, save, clear } = useAdminKey();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Product | null>(null);

  const [page, setPage] = useState(0);
  const take = 10;

  const isEditing = useMemo(() => Boolean(editing), [editing]);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const items = await listProducts(page * take, take);
      setProducts(items);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        clear();
      } else {
        setError(e?.message || 'Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!needsPrompt) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsPrompt, page]);

  function startCreate() {
    setEditing(null);
  }

  function startEdit(p: Product) {
    setEditing(p);
  }

  async function handleSubmit(product: Product) {
    try {
      setError(null);
      if (isEditing && editing) {
        await updateProduct(editing.id, product);
      } else {
        await createProduct(product);
      }
      await load();
      startCreate();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        clear();
      } else {
        setError(e?.message || 'Failed to save product');
      }
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteProduct(id);
      await load();
      if (editing?.id === id) startCreate();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        clear();
      } else {
        setError(e?.message || 'Failed to delete');
      }
    }
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-light text-neutral-900">Admin Panel</h1>
          <div className="flex gap-2">
            <button className="px-4 py-2 border rounded" onClick={load}>Refresh</button>
            <button className="px-4 py-2 border rounded" onClick={startCreate}>New Product</button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 text-red-700 bg-red-50">{error}</div>
        )}

        {needsPrompt && (
          <AdminKeyPrompt onSubmit={save} />
        )}

        {/* Top row with two product cards */}
        {!loading && products.length > 0 && (
          <TopProductCards products={products} onEdit={startEdit} />
        )}

        {/* Paginated table */}
        <div className="border rounded p-4 overflow-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">Products</h2>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border rounded" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
              <div className="text-sm text-neutral-600">Page {page + 1}</div>
              <button className="px-3 py-1 border rounded" onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
          {loading ? (
            <div className="text-neutral-500">Loading...</div>
          ) : (
            <ProductTable products={products} onEdit={startEdit} onDelete={onDelete} />
          )}
        </div>

        {/* Form at bottom */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-medium mb-4">{isEditing ? 'Edit Product' : 'Create Product'}</h2>
          <ProductForm initial={(editing || emptyProduct())} isEditing={isEditing} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
} 