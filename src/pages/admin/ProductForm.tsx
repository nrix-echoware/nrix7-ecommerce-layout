import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product } from '../../types/product';
import { createProduct, updateProduct, getProduct } from '../../api/adminProductsApi';
import ProductFormComponent from '../../components/admin/ProductForm';
import { generateId } from '../../lib/admin';
import { ArrowLeft } from 'lucide-react';

interface ProductFormPageProps {
  onAuthError: () => void;
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

export default function ProductFormPage({ onAuthError }: ProductFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [product, setProduct] = useState<Product>(emptyProduct());
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadProduct(id);
    }
  }, [id, isEditing]);

  async function loadProduct(productId: string) {
    try {
      setLoading(true);
      setError(null);
      const productData = await getProduct(productId);
      setProduct(productData);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        onAuthError();
      } else if (e?.response?.status === 404) {
        setError('Product not found');
      } else {
        setError(e?.message || 'Failed to load product');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(productData: Product) {
    try {
      setError(null);
      if (isEditing && id) {
        await updateProduct(id, productData);
      } else {
        await createProduct(productData);
      }
      navigate('/admin/products');
    } catch (e: any) {
      if (e?.response?.status === 401) {
        onAuthError();
      } else {
        setError(e?.message || 'Failed to save product');
      }
    }
  }

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Products
        </button>
        <h1 className="text-3xl font-semibold text-gray-900">
          {isEditing ? 'Edit Product' : 'Create Product'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Update product information' : 'Add a new product to your catalog'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 text-red-700 bg-red-50">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <ProductFormComponent
            initial={product}
            isEditing={isEditing}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </div>
  );
}

