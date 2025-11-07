import { Product } from '../../types/product';

interface Props {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductTable({ products, onEdit, onDelete }: Props) {
  return (
    <div className="space-y-4">
      <div className="hidden md:block rounded-md border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b">
              <th className="py-3 px-4 text-neutral-700">Image</th>
              <th className="py-3 px-4 text-neutral-700">Name</th>
              <th className="py-3 px-4 text-neutral-700">Category</th>
              <th className="py-3 px-4 text-neutral-700">Price</th>
              <th className="py-3 px-4 text-neutral-700">Variants</th>
              <th className="py-3 px-4 text-neutral-700">Status</th>
              <th className="py-3 px-4 text-neutral-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b hover:bg-neutral-50">
                <td className="py-3 px-4">
                  <div className="h-10 w-10 rounded overflow-hidden bg-neutral-100">
                    <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="max-w-xs truncate font-medium text-neutral-900" title={p.name}>{p.name}</div>
                </td>
                <td className="py-3 px-4">{p.category}</td>
                <td className="py-3 px-4">{p.price}</td>
                <td className="py-3 px-4">{p.variants?.length || 0}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    p.is_active !== false 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {p.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="px-3 py-1 border rounded" onClick={() => onEdit(p)}>Edit</button>
                    <button className="px-3 py-1 border rounded" onClick={() => onDelete(p.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {products.map((p) => (
          <div key={p.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-16 w-16 rounded overflow-hidden bg-neutral-100 flex-shrink-0">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-neutral-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-neutral-900 break-words">{p.name}</div>
                <div className="text-sm text-neutral-600 mt-1">{p.category}</div>
                <div className="text-sm text-neutral-600 mt-1">Price: ₹{p.price}</div>
                <div className="text-sm text-neutral-600">Variants: {p.variants?.length || 0}</div>
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    p.is_active !== false 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {p.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <button className="px-3 py-2 border rounded" onClick={() => onEdit(p)}>Edit</button>
              <button className="px-3 py-2 border rounded" onClick={() => onDelete(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 