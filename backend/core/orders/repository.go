package orders

import (
    "context"
    "gorm.io/gorm"
)

type OrderRepository interface {
    Create(ctx context.Context, order *Order) error
    GetByID(ctx context.Context, id string) (*Order, error)
    GetByIDAndUser(ctx context.Context, id string, userID string) (*Order, error)
    PaginatedList(ctx context.Context, skip, take int) ([]Order, int64, error)
    PaginatedListByUser(ctx context.Context, userID string, skip, take int) ([]Order, int64, error)
    UpdateCurrentStatus(ctx context.Context, id string, status string) error
}

type OrderStatusRepository interface {
    Append(ctx context.Context, ev *OrderStatusEvent) error
    ListByOrder(ctx context.Context, orderID string) ([]OrderStatusEvent, error)
}

type orderRepository struct {
    db *gorm.DB
}

type orderStatusRepository struct {
    db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
    return &orderRepository{db: db}
}

func NewOrderStatusRepository(db *gorm.DB) OrderStatusRepository {
    return &orderStatusRepository{db: db}
}

func (r *orderRepository) Create(ctx context.Context, order *Order) error {
    return r.db.WithContext(ctx).Create(order).Error
}

func (r *orderRepository) GetByID(ctx context.Context, id string) (*Order, error) {
    var o Order
    if err := r.db.WithContext(ctx).First(&o, "id = ?", id).Error; err != nil {
        return nil, err
    }
    return &o, nil
}

func (r *orderRepository) GetByIDAndUser(ctx context.Context, id string, userID string) (*Order, error) {
    var o Order
    if err := r.db.WithContext(ctx).First(&o, "id = ? AND user_id = ?", id, userID).Error; err != nil {
        return nil, err
    }
    return &o, nil
}

func (r *orderRepository) PaginatedList(ctx context.Context, skip, take int) ([]Order, int64, error) {
    var orders []Order
    var count int64
    dbq := r.db.WithContext(ctx).Model(&Order{})
    dbq.Count(&count)
    if err := dbq.Offset(skip).Limit(take).Order("created_at DESC").Find(&orders).Error; err != nil {
        return nil, 0, err
    }
    return orders, count, nil
}

func (r *orderRepository) PaginatedListByUser(ctx context.Context, userID string, skip, take int) ([]Order, int64, error) {
    var orders []Order
    var count int64
    dbq := r.db.WithContext(ctx).Model(&Order{}).Where("user_id = ?", userID)
    dbq.Count(&count)
    if err := dbq.Offset(skip).Limit(take).Order("created_at DESC").Find(&orders).Error; err != nil {
        return nil, 0, err
    }
    return orders, count, nil
}

func (r *orderRepository) UpdateCurrentStatus(ctx context.Context, id string, status string) error {
    return r.db.WithContext(ctx).Model(&Order{}).Where("id = ?", id).Update("current_status", status).Error
}

func (r *orderStatusRepository) Append(ctx context.Context, ev *OrderStatusEvent) error {
    return r.db.WithContext(ctx).Create(ev).Error
}

func (r *orderStatusRepository) ListByOrder(ctx context.Context, orderID string) ([]OrderStatusEvent, error) {
    var list []OrderStatusEvent
    if err := r.db.WithContext(ctx).Where("order_id = ?", orderID).Order("created_at ASC").Find(&list).Error; err != nil {
        return nil, err
    }
    return list, nil
}


