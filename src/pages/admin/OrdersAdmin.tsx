import { useEffect, useMemo, useState } from 'react';
import { listOrders, listOrderStatus } from '../../api/ordersApi';
import { Link } from 'react-router-dom';

const ADMIN_KEY_STORAGE = 'admin_api_key';

interface OrderRow {
  id: string;
  user_email: string;
  backend_total: number;
  current_status: string;
  created_at: string;
  total_items: number;
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const adminKey = sessionStorage.getItem(ADMIN_KEY_STORAGE) || undefined;
        const data = await listOrders(skip, take, adminKey || undefined);
        if (!mounted) return;
        setOrders(data as OrderRow[]);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [skip, take]);

  const filtered = useMemo(() => {
    return statusFilter ? orders.filter(o => o.current_status === statusFilter) : orders;
  }, [orders, statusFilter]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="flex items-center gap-3">
          <select
            className="border px-3 py-2 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">pending</option>
            <option value="seller_notified">seller_notified</option>
            <option value="seller_processing">seller_processing</option>
            <option value="seller_waiting_dispatch">seller_waiting_dispatch</option>
            <option value="seller_dispatched">seller_dispatched</option>
            <option value="agent_picked">agent_picked</option>
            <option value="agent_transporting">agent_transporting</option>
            <option value="agent_out_for_delivery">agent_out_for_delivery</option>
            <option value="order_delivered">order_delivered</option>
            <option value="user_cancelled">user_cancelled</option>
            <option value="user_returned">user_returned</option>
          </select>
          <select className="border px-3 py-2 rounded" value={take} onChange={(e)=> setTake(parseInt(e.target.value)||10)}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {loading && <div className="py-10 text-center">Loading...</div>}
      {error && <div className="py-10 text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">User</th>
                <th className="text-right p-3">Backend Total</th>
                <th className="text-right p-3">Items</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono">
                    <Link to={`/admin/orders/${o.id}`} className="text-blue-600 hover:underline">
                      {o.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="p-3">{o.user_email}</td>
                  <td className="p-3 text-right">₹{o.backend_total?.toFixed ? o.backend_total.toFixed(2) : Number(o.backend_total).toFixed(2)}</td>
                  <td className="p-3 text-right">{o.total_items}</td>
                  <td className="p-3">{o.current_status}</td>
                  <td className="p-3">{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={6}>No orders</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <button className="px-3 py-2 border rounded disabled:opacity-50" disabled={skip===0} onClick={()=> setSkip(Math.max(0, skip-take))}>Prev</button>
        <div className="text-sm text-gray-600">Offset: {skip}</div>
        <button className="px-3 py-2 border rounded" onClick={()=> setSkip(skip+take)}>Next</button>
      </div>
    </div>
  );
}


