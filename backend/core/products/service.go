package products

import (
	"context"
)

type ProductService interface {
	CreateProduct(ctx context.Context, product *Product) (string, error)
	UpdateProduct(ctx context.Context, product *Product) error
	DeleteProduct(ctx context.Context, id string) error
	GetProductByID(ctx context.Context, id string) (*Product, error)
	PaginatedListProducts(ctx context.Context, skip, take int) ([]Product, int64, error)
	GetCartHash(ctx context.Context) (string, error)
}

type productService struct {
	repo         ProductRepository
	invalidation CartInvalidationRepository
}

func NewProductService(repo ProductRepository, invalidation CartInvalidationRepository) ProductService {
	return &productService{
		repo:         repo,
		invalidation: invalidation,
	}
}

func (s *productService) CreateProduct(ctx context.Context, product *Product) (string, error) {
	if err := s.repo.Create(ctx, product); err != nil {
		return "", err
	}
	// Invalidate cart when a new product is created
	_, _ = s.invalidation.InvalidateCart(ctx)
	return product.ID, nil
}

func (s *productService) UpdateProduct(ctx context.Context, product *Product) error {
	if err := s.repo.Update(ctx, product); err != nil {
		return err
	}
	// Invalidate cart when a product is updated
	_, _ = s.invalidation.InvalidateCart(ctx)
	return nil
}

func (s *productService) DeleteProduct(ctx context.Context, id string) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	// Invalidate cart when a product is deleted
	_, _ = s.invalidation.InvalidateCart(ctx)
	return nil
}

func (s *productService) GetProductByID(ctx context.Context, id string) (*Product, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *productService) PaginatedListProducts(ctx context.Context, skip, take int) ([]Product, int64, error) {
	return s.repo.PaginatedList(ctx, skip, take)
}

func (s *productService) GetCartHash(ctx context.Context) (string, error) {
	return s.invalidation.GetCurrentHash(ctx)
} 