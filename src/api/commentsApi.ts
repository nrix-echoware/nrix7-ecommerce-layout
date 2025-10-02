import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9997/api/v1';

export interface Comment {
  id: string;
  product_id: string;
  email: string;
  comment: string;
  is_verified: boolean;
  replied_to?: string | null;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export interface CreateCommentRequest {
  product_id: string;
  email: string;
  comment: string;
  replied_to?: string | null;
}

export interface UpdateCommentRequest {
  comment: string;
}

// Get comments for a product (tree structure)
export const getCommentsForProduct = async (productId: string, limit = 10, offset = 0): Promise<Comment[]> => {
  const response = await axios.get<Comment[]>(
    `${API_BASE_URL}/products/${productId}/comments`,
    {
      params: { limit, offset }
    }
  );
  return response.data;
};

// Create a new comment
export const createComment = async (request: CreateCommentRequest): Promise<Comment> => {
  const response = await axios.post<Comment>(
    `${API_BASE_URL}/products/${request.product_id}/comments`,
    request
  );
  return response.data;
};

// Update a comment
export const updateComment = async (commentId: string, request: UpdateCommentRequest): Promise<Comment> => {
  const response = await axios.put<Comment>(
    `${API_BASE_URL}/comments/${commentId}`,
    request
  );
  return response.data;
};

// Delete a comment
export const deleteComment = async (commentId: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/comments/${commentId}`);
};

// Get replies for a comment
export const getReplies = async (commentId: string, limit = 10, offset = 0): Promise<Comment[]> => {
  const response = await axios.get<Comment[]>(
    `${API_BASE_URL}/comments/${commentId}/replies`,
    {
      params: { limit, offset }
    }
  );
  return response.data;
};
