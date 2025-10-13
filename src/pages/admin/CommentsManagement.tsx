import { useEffect, useState } from 'react';
import { getAllComments, deleteComment as deleteCommentApi, approveComment, rejectComment, Comment } from '../../api/commentsApi';
import { RefreshCw, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CommentsManagementProps {
  onAuthError: () => void;
}

export default function CommentsManagement({ onAuthError }: CommentsManagementProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const limit = 50;

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllComments(limit, page * limit, filter);
      setComments(response.comments);
      setTotal(response.total);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        onAuthError();
      } else {
        setError(e?.message || 'Failed to load comments');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, filter]);

  async function handleDelete(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(commentId);
      setError(null);
      await deleteCommentApi(commentId);
      toast.success('Comment deleted successfully');
      await load();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        onAuthError();
      } else {
        setError(e?.message || 'Failed to delete comment');
        toast.error('Failed to delete comment');
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleApprove(commentId: string) {
    try {
      setProcessingId(commentId);
      setError(null);
      await approveComment(commentId);
      toast.success('Comment approved successfully');
      await load();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        onAuthError();
      } else {
        setError(e?.message || 'Failed to approve comment');
        toast.error('Failed to approve comment');
      }
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(commentId: string) {
    try {
      setProcessingId(commentId);
      setError(null);
      await rejectComment(commentId);
      toast.success('Comment rejected successfully');
      await load();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        onAuthError();
      } else {
        setError(e?.message || 'Failed to reject comment');
        toast.error('Failed to reject comment');
      }
    } finally {
      setProcessingId(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Comments Management</h1>
          <p className="text-gray-600 mt-1">
            Review and moderate user comments ({total} total)
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
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {filter === 'all' ? 'All Comments' : filter === 'approved' ? 'Approved Comments' : 'Pending Comments'}
            </h2>
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
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium mr-2">Filter:</span>
            <button
              onClick={() => { setFilter('all'); setPage(0); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setFilter('approved'); setPage(0); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'approved'
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => { setFilter('pending'); setPage(0); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-100 text-yellow-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No comments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {comment.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                      <div className="line-clamp-2">{comment.comment}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {comment.product_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          comment.is_verified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {comment.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                      {comment.replied_to && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Reply
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {!comment.is_verified ? (
                          <button
                            onClick={() => handleApprove(comment.id)}
                            disabled={processingId === comment.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 inline-flex items-center gap-1 px-2 py-1 border border-green-300 rounded hover:bg-green-50 transition-colors"
                            title="Approve comment"
                          >
                            <CheckCircle size={16} />
                            {processingId === comment.id ? 'Approving...' : 'Approve'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReject(comment.id)}
                            disabled={processingId === comment.id}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50 inline-flex items-center gap-1 px-2 py-1 border border-orange-300 rounded hover:bg-orange-50 transition-colors"
                            title="Reject comment"
                          >
                            <XCircle size={16} />
                            {processingId === comment.id ? 'Rejecting...' : 'Reject'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 inline-flex items-center gap-1 px-2 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 size={16} />
                          {deletingId === comment.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
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

