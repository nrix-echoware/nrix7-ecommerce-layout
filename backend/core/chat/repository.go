package chat

import (
	"context"
	"gorm.io/gorm"
)

type ThreadRepository interface {
	Create(ctx context.Context, thread *Thread) error
	GetByOrderID(ctx context.Context, orderID string) (*Thread, error)
	GetByID(ctx context.Context, threadID string) (*Thread, error)
	Update(ctx context.Context, thread *Thread) error
	CloseThread(ctx context.Context, threadID string) error
}

type MessageRepository interface {
	Create(ctx context.Context, message *Message) error
	GetByThreadID(ctx context.Context, threadID string, skip, take int) ([]Message, int64, error)
	GetByID(ctx context.Context, messageID string) (*Message, error)
}

type threadRepository struct {
	db *gorm.DB
}

type messageRepository struct {
	db *gorm.DB
}

func NewThreadRepository(db *gorm.DB) ThreadRepository {
	return &threadRepository{db: db}
}

func NewMessageRepository(db *gorm.DB) MessageRepository {
	return &messageRepository{db: db}
}

func (r *threadRepository) Create(ctx context.Context, thread *Thread) error {
	return r.db.WithContext(ctx).Create(thread).Error
}

func (r *threadRepository) GetByOrderID(ctx context.Context, orderID string) (*Thread, error) {
	var thread Thread
	if err := r.db.WithContext(ctx).Where("order_id = ?", orderID).First(&thread).Error; err != nil {
		return nil, err
	}
	return &thread, nil
}

func (r *threadRepository) GetByID(ctx context.Context, threadID string) (*Thread, error) {
	var thread Thread
	if err := r.db.WithContext(ctx).Where("thread_id = ?", threadID).First(&thread).Error; err != nil {
		return nil, err
	}
	return &thread, nil
}

func (r *threadRepository) Update(ctx context.Context, thread *Thread) error {
	return r.db.WithContext(ctx).Save(thread).Error
}

func (r *threadRepository) CloseThread(ctx context.Context, threadID string) error {
	return r.db.WithContext(ctx).Model(&Thread{}).Where("thread_id = ?", threadID).Update("is_active", false).Error
}

func (r *messageRepository) Create(ctx context.Context, message *Message) error {
	return r.db.WithContext(ctx).Create(message).Error
}

func (r *messageRepository) GetByThreadID(ctx context.Context, threadID string, skip, take int) ([]Message, int64, error) {
	var messages []Message
	var count int64
	dbq := r.db.WithContext(ctx).Model(&Message{}).Where("thread_id = ?", threadID)
	dbq.Count(&count)
	if err := dbq.Offset(skip).Limit(take).Order("created_at ASC").Find(&messages).Error; err != nil {
		return nil, 0, err
	}
	return messages, count, nil
}

func (r *messageRepository) GetByID(ctx context.Context, messageID string) (*Message, error) {
	var message Message
	if err := r.db.WithContext(ctx).Where("message_id = ?", messageID).First(&message).Error; err != nil {
		return nil, err
	}
	return &message, nil
}

