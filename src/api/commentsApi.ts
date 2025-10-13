import axios from 'axios';
import { TokenManager } from './authApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:9997';

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
  comment: string;
  replied_to?: string | null;
}

export interface UpdateCommentRequest {
  comment: string;
}

// Get comments for a product (tree structure)
export const getCommentsForProduct = async (productId: string, limit = 10, offset = 0): Promise<Comment[]> => {
  const response = await axios.get<Comment[]>(
    `${API_BASE_URL}/comments/products/${productId}/comments`,
    {
      params: { limit, offset }
    }
  );
  return response.data;
};

// Create a new comment
export const createComment = async (request: CreateCommentRequest): Promise<Comment> => {
  const accessToken = TokenManager.getAccessToken();
  if (!accessToken) {
    throw new Error('Authentication required to post comments');
  }

  const response = await axios.post<Comment>(
    `${API_BASE_URL}/comments/products/${request.product_id}/comments`,
    request,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
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
  await axios.delete(`${API_BASE_URL}/comments/${commentId}`, {
    headers: {
      'X-Admin-API-Key': sessionStorage.getItem('admin_api_key') || ''
    }
  });
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

export interface GetAllCommentsResponse {
  comments: Comment[];
  total: number;
  limit: number;
  offset: number;
  filter?: string;
}

// Get all comments (Admin) with optional filter
export const getAllComments = async (
  limit = 50, 
  offset = 0, 
  filter: 'all' | 'approved' | 'pending' = 'all'
): Promise<GetAllCommentsResponse> => {
  const response = await axios.get<GetAllCommentsResponse>(
    `${API_BASE_URL}/comments`,
    {
      params: { limit, offset, filter },
      headers: {
        'X-Admin-API-Key': sessionStorage.getItem('admin_api_key') || ''
      }
    }
  );
  return response.data;
};

// Approve a comment (Admin)
export const approveComment = async (commentId: string): Promise<{ message: string }> => {
  const response = await axios.post<{ message: string }>(
    `${API_BASE_URL}/comments/${commentId}/approve`,
    {},
    {
      headers: {
        'X-Admin-API-Key': sessionStorage.getItem('admin_api_key') || ''
      }
    }
  );
  return response.data;
};

// Reject a comment (Admin)
export const rejectComment = async (commentId: string): Promise<{ message: string }> => {
  const response = await axios.post<{ message: string }>(
    `${API_BASE_URL}/comments/${commentId}/reject`,
    {},
    {
      headers: {
        'X-Admin-API-Key': sessionStorage.getItem('admin_api_key') || ''
      }
    }
  );
  return response.data;
};
