import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminKeyPrompt from '../components/admin/AdminKeyPrompt';
import AdminLayout from '../components/admin/AdminLayout';
import ProductsList from './admin/ProductsList';
import ProductFormPage from './admin/ProductForm';
import CommentsManagement from './admin/CommentsManagement';

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

export default function AdminPanel() {
  const { needsPrompt, save, clear } = useAdminKey();

  if (needsPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <AdminKeyPrompt onSubmit={save} />
      </div>
    );
  }

  return (
    <AdminLayout onLogout={clear}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/products" replace />} />
        <Route path="/products" element={<ProductsList onAuthError={clear} />} />
        <Route path="/products/create" element={<ProductFormPage onAuthError={clear} />} />
        <Route path="/products/edit/:id" element={<ProductFormPage onAuthError={clear} />} />
        <Route path="/comments" element={<CommentsManagement onAuthError={clear} />} />
      </Routes>
    </AdminLayout>
  );
} 