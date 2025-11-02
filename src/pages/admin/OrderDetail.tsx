import { useEffect, useMemo, useState } from 'react';
import { appendOrderStatus, getOrder, listOrderStatus } from '../../api/ordersApi';
import { fetchProductById } from '../../api/productsApi';
import { useParams, Link } from 'react-router-dom';
import OrderChatWidget from '../../components/OrderChatWidget';

const ADMIN_KEY_STORAGE = 'admin_api_key';

interface Order {
  id: string;
  user_id: string;
  frontend_total: number;
  backend_total: number;
  current_status: string;
  created_at: string;
  items?: Array<{
    product_id: string;
    variant_id?: string;
    variant_sku?: string;
    quantity: number;
    price: number;
    product_name?: string;
    variant_price?: number;
    variant_attributes?: Record<string,string> | null;
  }>;
  shipping?: any;
}

interface StatusEvent {
  id: number;
  order_id: string;
  status: string;
  reason: string;
  created_at: string;
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [productsMap, setProductsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const adminKey = sessionStorage.getItem(ADMIN_KEY_STORAGE) || undefined;
        const o = await getOrder(id, adminKey || undefined);
        const s = await listOrderStatus(id, adminKey || undefined);
        if (!mounted) return;
        setOrder(o as Order);
        setEvents(s as StatusEvent[]);
        const items = (o as any).items as Order['items'] | undefined;
        if (items && items.length > 0) {
          const uniqueIds = Array.from(new Set(items.map(i => i.product_id)));
          const entries = await Promise.all(uniqueIds.map(async pid => {
            try {
              const p = await fetchProductById(pid);
              return [pid, p] as const;
            } catch {
              return [pid, null] as const;
            }
          }));
          const map: Record<string, any> = {};
          for (const [pid, p] of entries) map[pid] = p;
          setProductsMap(map);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !status) return;
    const adminKey = sessionStorage.getItem(ADMIN_KEY_STORAGE) || undefined;
    await appendOrderStatus(id, status, reason || undefined, adminKey || undefined);
    const s = await listOrderStatus(id, adminKey || undefined);
    setEvents(s as StatusEvent[]);
    setStatus('');
    setReason('');
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <Link to="/admin/orders" className="text-sm text-blue-600">Back</Link>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {order && (
        <div className="space-y-6">
          <div className="border rounded p-4">
            <h2 className="font-semibold text-lg mb-2">Order</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-600">ID:</span> {order.id}</div>
              <div><span className="text-gray-600">User:</span> {order.user_id}</div>
              <div><span className="text-gray-600">Frontend Total:</span> ₹{order.frontend_total.toFixed(2)}</div>
              <div><span className="text-gray-600">Backend Total:</span> ₹{order.backend_total.toFixed(2)}</div>
              <div><span className="text-gray-600">Status:</span> {order.current_status}</div>
              <div><span className="text-gray-600">Created:</span> {new Date(order.created_at).toLocaleString()}</div>
            </div>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-semibold text-lg mb-2">Products</h2>
            <div className="space-y-3">
              {order.items?.map((it, idx) => {
                const p = productsMap[it.product_id];
                let image = '';
                let currentPrice = p?.price;
                if (p?.variants && p.variants.length > 0) {
                  const v = p.variants.find((vv: any) => vv.id === it.variant_id);
                  if (v) {
                    currentPrice = v.price;
                    image = v.image;
                  }
                }
                if (!image && p?.images && p.images.length > 0) image = p.images[0];
                return (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                    {image ? <img src={image} className="w-16 h-16 object-cover rounded" /> : <div className="w-16 h-16 bg-gray-200 rounded" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{(it as any).product_name || p?.name || it.product_id}</div>
                      {it.variant_attributes && (
                        <div className="text-xs text-gray-600 mt-1">
                          {Object.entries(it.variant_attributes).map(([k,v]) => `${k}: ${v}`).join(', ')}
                        </div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">Qty: {it.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Ordered price</div>
                      <div className="font-semibold">₹{(it.price * it.quantity).toFixed(2)}</div>
                      <div className="text-xs text-gray-500 mt-1">Current price: ₹{Number(currentPrice ?? 0).toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
              {!order.items?.length && <div className="text-gray-500 text-sm">No items</div>}
            </div>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-semibold text-lg mb-2">Update Status</h2>
            <form onSubmit={handleUpdate} className="flex items-center gap-3">
              <select value={status} onChange={(e)=> setStatus(e.target.value)} className="border px-3 py-2 rounded">
                <option value="">Select status</option>
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
                <option value="user_returning">user_returning</option>
                <option value="user_return_received">user_return_received</option>
                <option value="user_refund_initiated">user_refund_initiated</option>
                <option value="user_refund_failed">user_refund_failed</option>
                <option value="user_refund_processed">user_refund_processed</option>
              </select>
              <input value={reason} onChange={(e)=> setReason(e.target.value)} placeholder="Reason (optional)" className="border px-3 py-2 rounded flex-1" />
              <button className="px-4 py-2 border rounded">Update</button>
            </form>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-semibold text-lg mb-2">Status History</h2>
            <div className="divide-y">
              {events.map(ev => (
                <div key={ev.id} className="py-2 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-mono">{ev.status}</div>
                    {ev.reason && <div className="text-gray-600">{ev.reason}</div>}
                  </div>
                  <div className="text-gray-600">{new Date(ev.created_at).toLocaleString()}</div>
                </div>
              ))}
              {events.length === 0 && <div className="text-gray-500">No events</div>}
            </div>
          </div>
        </div>
      )}
      {id && <OrderChatWidget orderId={id} isAdmin={true} />}
    </div>
  );
}
