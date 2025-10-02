package comments

import (
	"gorm.io/gorm"
)

type CommentRepository interface {
	Create(comment *Comment) error
	GetByProductID(productID string, limit, offset int) ([]Comment, error)
	GetByID(id string) (*Comment, error)
	Update(id string, comment *Comment) error
	Delete(id string) error
	GetReplies(parentID string, limit, offset int) ([]Comment, error)
	GetCommentTree(productID string, limit, offset int, depth int) ([]CommentResponse, error)
}

type commentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &commentRepository{db: db}
}

func (r *commentRepository) Create(comment *Comment) error {
	return r.db.Create(comment).Error
}

func (r *commentRepository) GetByProductID(productID string, limit, offset int) ([]Comment, error) {
	var comments []Comment
	err := r.db.Where("product_id = ? AND replied_to IS NULL", productID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&comments).Error
	return comments, err
}

func (r *commentRepository) GetByID(id string) (*Comment, error) {
	var comment Comment
	err := r.db.First(&comment, "id = ?", id).Error
	return &comment, err
}

func (r *commentRepository) Update(id string, comment *Comment) error {
	return r.db.Model(&Comment{}).Where("id = ?", id).Updates(comment).Error
}

func (r *commentRepository) Delete(id string) error {
	return r.db.Delete(&Comment{}, "id = ?", id).Error
}

func (r *commentRepository) GetReplies(parentID string, limit, offset int) ([]Comment, error) {
	var comments []Comment
	err := r.db.Where("replied_to = ?", parentID).
		Order("created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&comments).Error
	return comments, err
}

// loadRepliesRecursive loads replies for a comment up to maxDepth levels
func (r *commentRepository) loadRepliesRecursive(comment *Comment, currentDepth, maxDepth int) error {
	if currentDepth >= maxDepth {
		return nil
	}

	var replies []Comment
	err := r.db.Where("replied_to = ?", comment.ID).
		Order("created_at ASC").
		Find(&replies).Error
	
	if err != nil {
		return err
	}

	comment.Replies = replies

	// Recursively load replies for each reply
	for i := range comment.Replies {
		err := r.loadRepliesRecursive(&comment.Replies[i], currentDepth+1, maxDepth)
		if err != nil {
			return err
		}
	}

	return nil
}

func (r *commentRepository) GetCommentTree(productID string, limit, offset int, depth int) ([]CommentResponse, error) {
	// Default depth to 5 if not specified or if it's too high
	if depth <= 0 || depth > 10 {
		depth = 5
	}

	var rootComments []Comment
	err := r.db.Where("product_id = ? AND replied_to IS NULL", productID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&rootComments).Error
	
	if err != nil {
		return nil, err
	}

	// Load replies recursively for each root comment
	for i := range rootComments {
		err := r.loadRepliesRecursive(&rootComments[i], 0, depth)
		if err != nil {
			return nil, err
		}
	}

	var responses []CommentResponse
	for _, comment := range rootComments {
		responses = append(responses, TransformCommentToResponse(&comment))
	}

	return responses, nil
}
