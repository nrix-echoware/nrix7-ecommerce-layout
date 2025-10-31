import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyOrders } from '../api/ordersApi';
import { useAuth } from '../contexts/AuthContext';
import { Package, Calendar, ShoppingBag, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';

interface Order {
  id: string;
  user_id: string;
  frontend_total: number;
  backend_total: number;
  current_status: string;
  created_at: string;
  items_json?: string | any[];
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { bg: string; text: string; label: string }> = {
    'order_delivered': { bg: 'bg-green-50', text: 'text-green-700', label: 'Delivered' },
    'pending': { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
    'user_cancelled': { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
    'order_confirmed': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Confirmed' },
    'order_shipped': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Shipped' },
    'order_processing': { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Processing' },
    'refund_requested': { bg: 'bg-pink-50', text: 'text-pink-700', label: 'Refund Requested' },
    'refunded': { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Refunded' },
  };
  
  const config = statusMap[status] || { bg: 'bg-gray-50', text: 'text-gray-700', label: status.replace(/_/g, ' ') };
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
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

  const getItemCount = (items: string | any[] | undefined): number => {
    if (!items) return 0;
    try {
      const parsed = typeof items === 'string' ? JSON.parse(items) : items;
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <Package className="w-16 h-16 sm:w-20 sm:h-20 text-neutral-300 mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl font-light mb-3 text-neutral-900">Please sign in</h2>
          <p className="text-neutral-600 mb-6 text-sm sm:text-base">You need to be signed in to view your orders</p>
          <Link 
            to="/login" 
            className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm sm:text-base"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 sm:pb-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-6 sm:py-8 lg:py-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light mb-6 sm:mb-8 text-neutral-900 tracking-tight">
          My <span className="italic font-serif">Orders</span>
        </h1>
        
        {loading && (
          <div className="py-12 sm:py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
            <p className="mt-4 text-neutral-600 text-sm sm:text-base">Loading orders...</p>
          </div>
        )}
        
        {error && (
          <div className="py-8 text-center bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm sm:text-base">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-12 sm:py-20">
                <Package className="w-16 h-16 sm:w-20 sm:h-20 text-neutral-300 mx-auto mb-6" />
                <h2 className="text-xl sm:text-2xl font-light mb-3 text-neutral-900">No orders yet</h2>
                <p className="text-neutral-600 mb-6 text-sm sm:text-base max-w-md mx-auto">
                  Start shopping to see your orders here
                </p>
                <Link 
                  to="/products" 
                  className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm sm:text-base"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {orders.map(order => {
                  const itemCount = getItemCount(order.items_json);
                  const orderDate = new Date(order.created_at);
                  
                  return (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="block bg-white border border-neutral-200 rounded-lg sm:rounded-xl hover:border-neutral-300 hover:shadow-lg transition-all duration-200 overflow-hidden group"
                    >
                      <div className="p-4 sm:p-6">
                        {/* Mobile Layout */}
                        <div className="flex flex-col sm:hidden space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-neutral-500">Order #{order.id.slice(0, 8)}</span>
                              </div>
                              <div className="mb-3">
                                {getStatusBadge(order.current_status)}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-neutral-600">
                                <Calendar className="w-3 h-3" />
                                <span>{orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 transition-colors flex-shrink-0" />
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                            <div className="flex items-center gap-2 text-xs text-neutral-600">
                              <ShoppingBag className="w-4 h-4" />
                              <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-neutral-900">
                                ₹{order.backend_total.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-sm font-medium text-neutral-600">Order #{order.id.slice(0, 8)}</span>
                              {getStatusBadge(order.current_status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{orderDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" />
                                <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-1">
                                ₹{order.backend_total.toLocaleString('en-IN')}
                              </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-neutral-400 group-hover:text-neutral-600 transition-colors flex-shrink-0" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {orders.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 sm:mt-8 pt-6 border-t border-neutral-200">
                <button
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors text-sm sm:text-base font-medium text-neutral-700"
                  disabled={skip === 0}
                  onClick={() => setSkip(Math.max(0, skip - take))}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <div className="text-sm sm:text-base text-neutral-600 font-medium">
                  Page {Math.floor(skip / take) + 1}
                </div>
                <button
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors text-sm sm:text-base font-medium text-neutral-700"
                  disabled={orders.length < take}
                  onClick={() => setSkip(skip + take)}
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

