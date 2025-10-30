import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyOrders } from '../api/ordersApi';
import { useAuth } from '../contexts/AuthContext';
import { Package } from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  frontend_total: number;
  backend_total: number;
  current_status: string;
  created_at: string;
  items_json?: string | any[];
}

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const take = 10;

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listMyOrders(skip, take);
        if (!mounted) return;
        setOrders(data as Order[]);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load orders');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [isAuthenticated, skip]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Please sign in</h2>
          <p className="text-gray-600 mb-4">You need to be signed in to view your orders</p>
          <Link to="/login" className="text-blue-600 hover:underline">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 bg-gradient-to-b from-neutral-50 to-white">
      <div className="container mx-auto px-6 max-w-6xl py-8">
        <h1 className="text-4xl font-light mb-8 text-neutral-900 tracking-tight">My <span className="italic font-serif">Orders</span></h1>
        
        {loading && <div className="py-10 text-center">Loading...</div>}
        {error && <div className="py-10 text-red-600 text-center">{error}</div>}

        {!loading && !error && (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
                <Link to="/products" className="text-blue-600 hover:underline">Browse Products</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.current_status === 'order_delivered' ? 'bg-green-100 text-green-800' :
                            order.current_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.current_status === 'user_cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.current_status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Placed on {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold text-neutral-900">
                          ₹{order.backend_total.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {(() => {
                            if (!order.items_json) return '0 items';
                            try {
                              const items = typeof order.items_json === 'string' 
                                ? JSON.parse(order.items_json) 
                                : order.items_json;
                              return Array.isArray(items) ? `${items.length} items` : '0 items';
                            } catch {
                              return '0 items';
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <button
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - take))}
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">Page {Math.floor(skip / take) + 1}</div>
              <button
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                disabled={orders.length < take}
                onClick={() => setSkip(skip + take)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

