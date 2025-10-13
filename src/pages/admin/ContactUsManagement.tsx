import { useEffect, useState } from 'react';
import { getAllContactUs, ContactUsResponse, updateContactUsStatus } from '../../api/contactusApi';
import { RefreshCw, AlertCircle, Mail, Clock, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface ContactUsManagementProps {
  onAuthError: () => void;
}

export default function ContactUsManagement({ onAuthError }: ContactUsManagementProps) {
  const [contacts, setContacts] = useState<ContactUsResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const limit = 50;

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllContactUs(limit, page * limit);
      setContacts(response.contacts);
      setTotal(response.total);
    } catch (e: any) {
      if (e?.response?.status === 401 || e?.message?.includes('Admin key required')) {
        onAuthError();
      } else {
        setError(e?.message || 'Failed to load contact submissions');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  async function handleStatusUpdate(id: string, status: 'pending' | 'in_progress' | 'resolved' | 'closed') {
    try {
      setUpdatingId(id);
      await updateContactUsStatus(id, status);
      toast.success('Status updated successfully');
      await load();
    } catch (e: any) {
      if (e?.response?.status === 401 || e?.message?.includes('Admin key required')) {
        onAuthError();
      } else {
        setError(e?.message || 'Failed to update status');
        toast.error('Failed to update status');
      }
    } finally {
      setUpdatingId(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inquiry':
        return 'bg-blue-100 text-blue-800';
      case 'order_problem':
        return 'bg-red-100 text-red-800';
      case 'return_exchange':
        return 'bg-orange-100 text-orange-800';
      case 'bug_report':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'inquiry':
        return 'General Inquiry';
      case 'order_problem':
        return 'Order Problem';
      case 'return_exchange':
        return 'Return/Exchange';
      case 'bug_report':
        return 'Bug Report';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Contact Us Submissions</h1>
          <p className="text-gray-600 mt-1">
            View and manage customer inquiries ({total} total)
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 text-red-700 bg-red-50 flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">All Submissions</h2>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <div className="text-sm text-gray-600 font-medium">
              Page {page + 1} of {totalPages || 1}
            </div>
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading submissions...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No submissions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Tag size={14} />
                      Type
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      Contact Info
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Extras
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      Date
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(contact.type)}`}>
                        {getTypeLabel(contact.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {contact.extras?.email && (
                        <div className="mb-1">
                          <span className="font-medium">Email:</span> {contact.extras.email}
                        </div>
                      )}
                      {contact.extras?.phone && (
                        <div className="mb-1">
                          <span className="font-medium">Phone:</span> {contact.extras.phone}
                        </div>
                      )}
                      {contact.extras?.name && (
                        <div>
                          <span className="font-medium">Name:</span> {contact.extras.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                      <div className="line-clamp-3">{contact.message}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      {contact.extras?.orderId && (
                        <div className="mb-1">
                          <span className="font-medium">Order ID:</span> {contact.extras.orderId}
                        </div>
                      )}
                      {contact.extras?.issue && (
                        <div className="mb-1">
                          <span className="font-medium">Issue:</span> {contact.extras.issue}
                        </div>
                      )}
                      {contact.extras?.reason && (
                        <div className="mb-1">
                          <span className="font-medium">Reason:</span> {contact.extras.reason}
                        </div>
                      )}
                      {contact.extras?.url && (
                        <div className="mb-1">
                          <span className="font-medium">URL:</span> <a href={contact.extras.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{contact.extras.url}</a>
                        </div>
                      )}
                      {contact.extras?.browser && (
                        <div>
                          <span className="font-medium">Browser:</span> {contact.extras.browser}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={contact.status || 'pending'}
                        onChange={(e) => handleStatusUpdate(contact.id, e.target.value as any)}
                        disabled={updatingId === contact.id}
                        className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer disabled:opacity-50 ${getStatusColor(contact.status || 'pending')}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contact.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

