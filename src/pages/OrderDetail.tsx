import { useEffect, useState } from 'react';
import { getMyOrder, listOrderStatusForUser, cancelMyOrder, requestRefund } from '../api/ordersApi';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Package, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  full_name: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
}

interface Order {
  id: string;
  user_id: string;
  items_json: string;
  shipping_json: string;
  frontend_total: number;
  backend_total: number;
  current_status: string;
  created_at: string;
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
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const o = await getMyOrder(id);
        const s = await listOrderStatusForUser(id);
        if (!mounted) return;
        setOrder(o as Order);
        setEvents(s as StatusEvent[]);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load order');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, isAuthenticated]);

  const handleCancel = async () => {
    if (!id || !window.confirm('Are you sure you want to cancel this order?')) return;
    setProcessing(true);
    try {
      await cancelMyOrder(id);
      toast.success('Order cancelled successfully');
      const o = await getMyOrder(id);
      const s = await listOrderStatusForUser(id);
      setOrder(o as Order);
      setEvents(s as StatusEvent[]);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to cancel order');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefund = async () => {
    if (!id || !window.confirm('Request refund for this order?')) return;
    setProcessing(true);
    try {
      await requestRefund(id);
      toast.success('Refund requested successfully');
      const o = await getMyOrder(id);
      const s = await listOrderStatusForUser(id);
      setOrder(o as Order);
      setEvents(s as StatusEvent[]);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to request refund');
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Please sign in</h2>
          <Link to="/login" className="text-blue-600 hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!order) return null;

  const items: OrderItem[] = JSON.parse(order.items_json || '[]');
  const shipping: ShippingAddress = JSON.parse(order.shipping_json || '{}');
  const canCancel = order.current_status !== 'order_delivered' && order.current_status !== 'agent_out_for_delivery' && order.current_status !== 'user_cancelled';
  const deliveredEvent = events.find(e => e.status === 'order_delivered');
  const canRefund = deliveredEvent && (() => {
    const deliveredAt = new Date(deliveredEvent.created_at).getTime();
    const now = Date.now();
    return (now - deliveredAt) / (1000 * 60 * 60 * 24) <= 2;
  })();

  return (
    <div className="min-h-screen pb-16 bg-gradient-to-b from-neutral-50 to-white">
      <div className="container mx-auto px-6 max-w-6xl py-8">
        <Link
          to="/orders"
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-neutral-900 mb-2">Order Details</h1>
              <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 text-sm rounded-full inline-block ${
                order.current_status === 'order_delivered' ? 'bg-green-100 text-green-800' :
                order.current_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.current_status === 'user_cancelled' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {order.current_status.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-medium mb-4">Items</h2>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">Product {item.product_id.slice(0, 8)}</div>
                      {item.variant_id && <div className="text-sm text-gray-600">Variant {item.variant_id.slice(0, 8)}</div>}
                      <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{(item.price * item.quantity / 100).toFixed(2)}</div>
                      <div className="text-sm text-gray-600">₹{(item.price / 100).toFixed(2)} each</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-medium mb-4">Shipping Address</h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{shipping.full_name}</div>
                  <div>{shipping.line1}</div>
                  {shipping.line2 && <div>{shipping.line2}</div>}
                  {(shipping.city || shipping.state) && (
                    <div>{shipping.city}{shipping.city && shipping.state ? ', ' : ''}{shipping.state}</div>
                  )}
                  {shipping.postal_code && <div>{shipping.postal_code}</div>}
                  {shipping.country && <div>{shipping.country}</div>}
                  {shipping.phone && <div className="mt-2">Phone: {shipping.phone}</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-end">
              <div className="text-right space-y-2">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-3xl font-semibold text-neutral-900">
                  ₹{(order.backend_total / 100).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {(canCancel || canRefund) && (
            <div className="border-t pt-6 flex gap-4">
              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Cancel Order
                </button>
              )}
              {canRefund && (
                <button
                  onClick={handleRefund}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                >
                  <RefreshCw size={16} />
                  Request Refund
                </button>
              )}
            </div>
          )}

          <div className="border-t pt-6">
            <h2 className="text-xl font-medium mb-4">Status History</h2>
            <div className="space-y-3">
              {events.map((ev, idx) => (
                <div key={ev.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{ev.status.replace(/_/g, ' ')}</div>
                    {ev.reason && <div className="text-sm text-gray-600 mt-1">{ev.reason}</div>}
                    <div className="text-xs text-gray-500 mt-1">{new Date(ev.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {events.length === 0 && <div className="text-gray-500 text-center py-4">No status updates</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

