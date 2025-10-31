package chat

import (
	"context"
)

type ThreadCreatorAdapter struct {
	threadService ThreadService
}

func NewThreadCreatorAdapter(ts ThreadService) *ThreadCreatorAdapter {
	return &ThreadCreatorAdapter{threadService: ts}
}

func (a *ThreadCreatorAdapter) CreateThreadForOrder(ctx context.Context, orderID string) error {
	_, err := a.threadService.CreateThreadForOrder(ctx, orderID)
	return err
}

