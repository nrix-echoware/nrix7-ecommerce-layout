# Product Comments System

A complete Reddit-style comment system for product pages with nested replies, email verification, and moderation features.

## Features

- **Nested Comments**: Infinite depth reply chains like Reddit
- **Email Modal**: Required email input for each comment submission  
- **Real-time Updates**: Comments load and update dynamically
- **User Management**: Edit/delete own comments with ownership verification
- **Responsive Design**: Works on all device sizes
- **Type Safety**: Full TypeScript support with proper interfaces

## Components

### CommentSection
Main component that manages the entire comment system for a product.

```tsx
<CommentSection productId={product.id} />
```

### CommentItem  
Displays individual comments with nested replies, edit/delete functionality.

### CommentForm
Form for adding new comments or replies with character limits and validation.

### EmailModal
Modal that appears before comment submission to collect user's email.

## API Integration

### Backend Endpoints
- `GET /api/v1/products/{product_id}/comments` - Get comment tree
- `POST /api/v1/products/{product_id}/comments` - Create comment/reply  
- `PUT /api/v1/comments/{id}` - Update comment
- `DELETE /api/v1/comments/{id}` - Delete comment
- `GET /api/v1/comments/{id}/replies` - Get replies for a comment

### Frontend API (`src/api/commentsApi.ts`)
```typescript
// Get comments for a product
const comments = await getCommentsForProduct(productId);

// Create a new comment
const newComment = await createComment({
  product_id: productId,
  email: "user@example.com", 
  comment: "This is my comment",
  replied_to: null // or parent comment ID for replies
});
```

## Database Schema

```sql
CREATE TABLE comments (
  id VARCHAR(255) PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  replied_to VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  INDEX idx_replied_to (replied_to),
  FOREIGN KEY (replied_to) REFERENCES comments(id) ON DELETE CASCADE
);
```

## Usage in Product Detail Page

The comment system is automatically integrated into product detail pages:

```tsx
{/* Comments Section */}
<div className="pt-8 border-t border-neutral-200">
  <CommentSection productId={product.id} />
</div>
```

## Features Implemented

✅ **Nested Comments**: Support for infinite reply depth  
✅ **Email Collection**: Modal asks for email on each comment  
✅ **Real-time Loading**: Comments load and update dynamically  
✅ **User Management**: Users can edit/delete their own comments  
✅ **Responsive UI**: Works on mobile and desktop  
✅ **Type Safety**: Full TypeScript with proper interfaces  
✅ **Error Handling**: Comprehensive error states and messages  
✅ **Loading States**: Proper loading indicators  
✅ **Character Limits**: 1000 character limit with counter  
✅ **Email Validation**: Basic email format validation  

## Future Enhancements

- [ ] Email verification system
- [ ] Comment moderation dashboard  
- [ ] Rich text editor for comments
- [ ] Comment voting/likes system
- [ ] Spam detection and filtering
- [ ] Comment search functionality

## Configuration

The comment system uses the existing API base URL configuration:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9997/api/v1';
```

Comments are only visible on product detail pages and automatically fetch data for the current product.
