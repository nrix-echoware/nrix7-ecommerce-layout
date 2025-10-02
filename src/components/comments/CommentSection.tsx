import React, { useState, useEffect } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { EmailModal } from './EmailModal';
import { Comment, CreateCommentRequest, getCommentsForProduct, createComment, updateComment, deleteComment } from '../../api/commentsApi';
import { toast } from 'sonner';

interface CommentSectionProps {
  productId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ productId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingComment, setPendingComment] = useState<{ comment: string; repliedTo?: string | null } | null>(null);

  // Load comments when component mounts or productId changes
  useEffect(() => {
    loadComments();
  }, [productId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getCommentsForProduct(productId);
      setComments(data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = (commentText: string) => {
    // Store the pending comment and show email modal
    setPendingComment({ comment: commentText, repliedTo: replyingTo });
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async (userEmail: string) => {
    if (!pendingComment) {
      setShowEmailModal(false);
      return;
    }

    try {
      setSubmitting(true);
      const request: CreateCommentRequest = {
        product_id: productId,
        email: userEmail,
        comment: pendingComment.comment,
        replied_to: pendingComment.repliedTo || null
      };

      await createComment(request);
      toast.success('Comment posted successfully!');
      
      // Refresh comments
      await loadComments();
      
      // Reset all form state
      setShowCommentForm(false);
      setReplyingTo(null);
      setPendingComment(null);
      setShowEmailModal(false);
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    setShowCommentForm(true);
  };

  const handleUpdateComment = async (commentId: string, newComment: string) => {
    try {
      await updateComment(commentId, { comment: newComment });
      toast.success('Comment updated successfully!');
      await loadComments();
    } catch (error) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast.success('Comment deleted successfully!');
      await loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setShowCommentForm(false);
  };

  const findCommentById = (comments: Comment[], id: string): Comment | null => {
    for (const comment of comments) {
      if (comment.id === id) return comment;
      if (comment.replies && comment.replies.length > 0) {
        const found = findCommentById(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-900">
          Comments ({comments?.length || 0})
        </h3>
        <Button
          onClick={() => {
            setReplyingTo(null);
            setShowCommentForm(!showCommentForm);
          }}
          variant="outline"
          size="sm"
          className="gap-2 border-neutral-300 text-neutral-900 hover:bg-neutral-100"
        >
          <MessageCircle size={16} />
          {showCommentForm && !replyingTo ? 'Cancel' : 'Add Comment'}
        </Button>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <CommentForm
          onSubmit={handleCommentSubmit}
          onCancel={replyingTo ? handleCancelReply : () => setShowCommentForm(false)}
          isReply={!!replyingTo}
          parentCommentAuthor={
            replyingTo 
              ? findCommentById(comments, replyingTo)?.email 
              : undefined
          }
          isLoading={submitting}
        />
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-neutral-700" />
        </div>
      ) : !comments || comments.length === 0 ? (
        <div className="text-center py-8 text-neutral-700">
          <MessageCircle size={48} className="mx-auto mb-4 opacity-40" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}

      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setPendingComment(null);
        }}
        onSubmit={handleEmailSubmit}
        isLoading={submitting}
      />
    </div>
  );
};
