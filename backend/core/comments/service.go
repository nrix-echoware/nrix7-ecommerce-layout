package comments

import (
	"errors"
	"strings"
)

type CommentService interface {
	CreateComment(req *CreateCommentRequest) (*Comment, error)
	GetCommentsForProduct(productID string, limit, offset int) ([]CommentResponse, error)
	GetCommentByID(id string) (*Comment, error)
	UpdateComment(id string, req *UpdateCommentRequest) (*Comment, error)
	DeleteComment(id string) error
	GetReplies(parentID string, limit, offset int) ([]Comment, error)
}

type commentService struct {
	repo CommentRepository
}

func NewCommentService(repo CommentRepository) CommentService {
	return &commentService{repo: repo}
}

func (s *commentService) CreateComment(req *CreateCommentRequest) (*Comment, error) {
	// Validate email
	if strings.TrimSpace(req.Email) == "" {
		return nil, errors.New("email is required")
	}
	
	// Validate comment length
	comment := strings.TrimSpace(req.Comment)
	if len(comment) == 0 {
		return nil, errors.New("comment cannot be empty")
	}
	if len(comment) > 1000 {
		return nil, errors.New("comment cannot exceed 1000 characters")
	}

	// If replying to a comment, validate that the parent comment exists
	if req.RepliedTo != nil {
		parent, err := s.repo.GetByID(*req.RepliedTo)
		if err != nil {
			return nil, errors.New("parent comment not found")
		}
		// Ensure the parent comment belongs to the same product
		if parent.ProductID != req.ProductID {
			return nil, errors.New("parent comment does not belong to the same product")
		}
	}

	commentModel := &Comment{
		ProductID:  req.ProductID,
		Email:      strings.ToLower(strings.TrimSpace(req.Email)),
		Comment:    comment,
		RepliedTo:  req.RepliedTo,
		IsVerified: false, // Can be set to true based on some verification logic
	}

	err := s.repo.Create(commentModel)
	if err != nil {
		return nil, err
	}

	// Return the comment with replies preloaded if it's a root comment
	if req.RepliedTo == nil {
		return s.repo.GetByID(commentModel.ID)
	}

	return commentModel, nil
}

func (s *commentService) GetCommentsForProduct(productID string, limit, offset int) ([]CommentResponse, error) {
	if limit <= 0 {
		limit = 10 // Default limit
	}
	if offset < 0 {
		offset = 0
	}
	if limit > 50 {
		limit = 50 // Max limit to prevent abuse
	}

	// Load 5 levels of nested replies by default
	return s.repo.GetCommentTree(productID, limit, offset, 5)
}

func (s *commentService) GetCommentByID(id string) (*Comment, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("comment ID is required")
	}

	return s.repo.GetByID(id)
}

func (s *commentService) UpdateComment(id string, req *UpdateCommentRequest) (*Comment, error) {
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("comment ID is required")
	}

	// Validate comment length
	comment := strings.TrimSpace(req.Comment)
	if len(comment) == 0 {
		return nil, errors.New("comment cannot be empty")
	}
	if len(comment) > 1000 {
		return nil, errors.New("comment cannot exceed 1000 characters")
	}


	// Update the comment
	updateData := &Comment{
		Comment: comment,
	}

	var err error
	err = s.repo.Update(id, updateData)
	if err != nil {
		return nil, err
	}

	// Return updated comment
	return s.repo.GetByID(id)
}

func (s *commentService) DeleteComment(id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("comment ID is required")
	}

	// Check if comment exists
	_, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("comment not found")
	}

	return s.repo.Delete(id)
}

func (s *commentService) GetReplies(parentID string, limit, offset int) ([]Comment, error) {
	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	if limit > 50 {
		limit = 50
	}

	return s.repo.GetReplies(parentID, limit, offset)
}
