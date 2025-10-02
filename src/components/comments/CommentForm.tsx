import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface CommentFormProps {
  onSubmit: (comment: string, repliedTo?: string | null) => void;
  onCancel?: () => void;
  isReply?: boolean;
  parentCommentAuthor?: string;
  isLoading?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  isReply = false,
  parentCommentAuthor,
  isLoading = false
}) => {
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      toast.error('Please enter a comment');
      return;
    }

    if (trimmedComment.length > 1000) {
      toast.error('Comment cannot exceed 1000 characters');
      return;
    }

    onSubmit(trimmedComment);
    setComment('');
  };

  const handleCancel = () => {
    setComment('');
    onCancel?.();
  };

  return (
    <div className={`bg-white rounded-lg border border-neutral-300 p-4 ${isReply ? 'ml-6 border-l-4 border-l-neutral-900' : ''}`}>
      {isReply && parentCommentAuthor && (
        <div className="flex items-center gap-2 mb-3 text-sm text-neutral-700">
          <MessageCircle size={14} />
          <span>Replying to <strong className="text-neutral-900">{parentCommentAuthor}</strong></span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="ml-auto p-1 h-auto text-neutral-600 hover:text-neutral-900"
          >
            <X size={14} />
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={isReply ? "Write your reply..." : "Share your thoughts about this product..."}
          className="min-h-[100px] resize-none bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-500"
          disabled={isLoading}
        />

        <div className="flex items-center justify-between">
          <div className="text-xs text-neutral-600">
            {comment.length}/1000 characters
          </div>

          <div className="flex gap-2">
            {!isReply && onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
                className="border-neutral-300 text-neutral-900 hover:bg-neutral-100"
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !comment.trim()}
              className="bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              {isLoading ? 'Posting...' : isReply ? 'Reply' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
