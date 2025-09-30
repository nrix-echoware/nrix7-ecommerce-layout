import { Product } from '../../types/product';

export default function TopProductCards({ products, onEdit }: { products: Product[]; onEdit: (p: Product) => void; }) {
  const top = products.slice(0, 2);
  if (top.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {top.map((p) => (
        <div key={p.id} className="rounded-xl border overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
          <div className="aspect-[16/8] bg-neutral-100">
            <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-medium text-neutral-900 truncate max-w-xs" title={p.name}>{p.name}</div>
              <div className="text-sm text-neutral-500">{p.category} • {p.variants?.length || 0} variants</div>
            </div>
            <button className="px-3 py-1 border rounded" onClick={() => onEdit(p)}>Edit</button>
          </div>
        </div>
      ))}
    </div>
  );
} 