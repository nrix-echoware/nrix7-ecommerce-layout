import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import { Comment } from '../../api/commentsApi';
import { Button } from '../ui/button';

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  onReply?: (parentId: string) => void;
  onUpdate?: (commentId: string, newComment: string) => void;
  onDelete?: (commentId: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  depth = 0,
  onReply,
}) => {
  const maxDepth = 5; // Prevent infinite nesting

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-neutral-900 pl-4' : ''}`}>
      <div className="bg-white rounded-lg border border-neutral-300 p-4 mb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-neutral-900">
                {comment.email}
              </span>
              {comment.is_verified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-900 text-white">
                  Verified
                </span>
              )}
              <span className="text-xs text-neutral-600">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>

            <p className="text-neutral-800 leading-relaxed mb-3">
              {comment.comment}
            </p>

            {depth < maxDepth && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply?.(comment.id)}
                  className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
                >
                  <MessageCircle size={14} className="mr-1" />
                  Reply
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};
