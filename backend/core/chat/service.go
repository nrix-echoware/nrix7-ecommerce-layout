package chat

import (
	"context"
	"ecommerce-backend/core/orders"
	"errors"
	"time"
)

type EventEmitter interface {
	EmitAdminEvent(event interface{})
	EmitUserEvent(userID string, event interface{})
}

type ThreadService interface {
	CreateThreadForOrder(ctx context.Context, orderID string) (*Thread, error)
	GetThreadByOrderID(ctx context.Context, orderID string) (*Thread, error)
	GetThreadByID(ctx context.Context, threadID string) (*Thread, error)
	CloseThread(ctx context.Context, threadID string) error
}

type MessageService interface {
	CreateMessage(ctx context.Context, threadID string, content string, mediaData []byte, owner MessageOwner) (*Message, error)
	GetMessagesByThread(ctx context.Context, threadID string, skip, take int) ([]Message, int64, error)
	GetMessageByID(ctx context.Context, messageID string) (*Message, error)
}

type threadService struct {
	threadRepo ThreadRepository
	eventEmitter EventEmitter
}

type messageService struct {
	messageRepo  MessageRepository
	threadRepo   ThreadRepository
	orderRepo    orders.OrderRepository
	eventEmitter EventEmitter
}

func NewThreadService(tr ThreadRepository, emitter EventEmitter) ThreadService {
	return &threadService{threadRepo: tr, eventEmitter: emitter}
}

func NewMessageService(mr MessageRepository, tr ThreadRepository, or orders.OrderRepository, emitter EventEmitter) MessageService {
	return &messageService{messageRepo: mr, threadRepo: tr, orderRepo: or, eventEmitter: emitter}
}

func (s *threadService) CreateThreadForOrder(ctx context.Context, orderID string) (*Thread, error) {
	thread := &Thread{
		OrderID:  orderID,
		IsActive: true,
	}
	if err := s.threadRepo.Create(ctx, thread); err != nil {
		return nil, err
	}
	return thread, nil
}

func (s *threadService) GetThreadByOrderID(ctx context.Context, orderID string) (*Thread, error) {
	return s.threadRepo.GetByOrderID(ctx, orderID)
}

func (s *threadService) GetThreadByID(ctx context.Context, threadID string) (*Thread, error) {
	return s.threadRepo.GetByID(ctx, threadID)
}

func (s *threadService) CloseThread(ctx context.Context, threadID string) error {
	if err := s.threadRepo.CloseThread(ctx, threadID); err != nil {
		return err
	}
	
	if s.eventEmitter != nil {
		s.eventEmitter.EmitAdminEvent(map[string]interface{}{
			"resource":     "threads",
			"resource_type": "threads.closed",
			"data": map[string]interface{}{
				"thread_id": threadID,
			},
		})
	}
	
	return nil
}

func (s *messageService) CreateMessage(ctx context.Context, threadID string, content string, mediaData []byte, owner MessageOwner) (*Message, error) {
	if len(mediaData) > 5*1024*1024 {
		return nil, errors.New("media file too large, maximum 5MB allowed")
	}
	
	thread, err := s.threadRepo.GetByID(ctx, threadID)
	if err != nil {
		return nil, err
	}
	if !thread.IsActive {
		return nil, errors.New("thread is closed")
	}
	
	message := &Message{
		ThreadID:      threadID,
		MessageContent: content,
		MediaData:     mediaData,
		Owner:         owner,
	}
	
	if err := s.messageRepo.Create(ctx, message); err != nil {
		return nil, err
	}
	
	thread.UpdatedAt = time.Now()
	if err := s.threadRepo.Update(ctx, thread); err != nil {
		return nil, err
	}
	
	if s.eventEmitter != nil {
		eventData := map[string]interface{}{
			"resource":     "messages",
			"resource_type": "messages.new",
			"data": map[string]interface{}{
				"thread_id": threadID,
				"message_id": message.MessageID,
				"order_id": thread.OrderID,
			},
		}
		s.eventEmitter.EmitAdminEvent(eventData)
		
		if order, err := s.orderRepo.GetByID(ctx, thread.OrderID); err == nil {
			s.eventEmitter.EmitUserEvent(order.UserID, eventData)
		}
	}
	
	return message, nil
}

func (s *messageService) GetMessagesByThread(ctx context.Context, threadID string, skip, take int) ([]Message, int64, error) {
	return s.messageRepo.GetByThreadID(ctx, threadID, skip, take)
}

func (s *messageService) GetMessageByID(ctx context.Context, messageID string) (*Message, error) {
	return s.messageRepo.GetByID(ctx, messageID)
}

