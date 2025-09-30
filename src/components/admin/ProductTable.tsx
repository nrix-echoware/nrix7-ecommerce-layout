import { Product } from '../../types/product';

interface Props {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductTable({ products, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-md border">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-50 border-b">
            <th className="py-3 px-4 text-neutral-700">Image</th>
            <th className="py-3 px-4 text-neutral-700">Name</th>
            <th className="py-3 px-4 text-neutral-700">Category</th>
            <th className="py-3 px-4 text-neutral-700">Price</th>
            <th className="py-3 px-4 text-neutral-700">Variants</th>
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
  );
} 