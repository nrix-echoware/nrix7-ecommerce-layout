import { useEffect, useState } from 'react';
import { appendOrderStatus, getOrder, listOrderStatus } from '../../api/ordersApi';
import { useParams, Link } from 'react-router-dom';

const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY as string | undefined;

interface Order {
  id: string;
  user_id: string;
  frontend_total: number;
  backend_total: number;
  current_status: string;
  created_at: string;
  items_json?: string;
  shipping_json?: string;
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

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const o = await getOrder(id);
        const s = await listOrderStatus(id, ADMIN_API_KEY);
        if (!mounted) return;
        setOrder(o as Order);
        setEvents(s as StatusEvent[]);
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
    await appendOrderStatus(id, status, reason || undefined, ADMIN_API_KEY);
    const s = await listOrderStatus(id, ADMIN_API_KEY);
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
              <div><span className="text-gray-600">Frontend Total:</span> ₹{(order.frontend_total/100).toFixed(2)}</div>
              <div><span className="text-gray-600">Backend Total:</span> ₹{(order.backend_total/100).toFixed(2)}</div>
              <div><span className="text-gray-600">Status:</span> {order.current_status}</div>
              <div><span className="text-gray-600">Created:</span> {new Date(order.created_at).toLocaleString()}</div>
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
    </div>
  );
}
