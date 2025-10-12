import { useEffect, useState } from 'react';
import { getAllComments, deleteComment as deleteCommentApi, Comment } from '../../api/commentsApi';
import { RefreshCw, Trash2, AlertCircle } from 'lucide-react';

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
  const limit = 50;

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllComments(limit, page * limit);
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
  }, [page]);

  async function handleDelete(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(commentId);
      setError(null);
      await deleteCommentApi(commentId);
      await load();
    } catch (e: any) {
      if (e?.response?.status === 401) {
        onAuthError();
      } else {
        setError(e?.message || 'Failed to delete comment');
      }
    } finally {
      setDeletingId(null);
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
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">All Comments</h2>
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
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                        {deletingId === comment.id ? 'Deleting...' : 'Delete'}
                      </button>
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

