package orders

import (
    "context"
    "ecommerce-backend/core/products"
    "errors"
)

type OrderService interface {
    Create(ctx context.Context, userID string, items []OrderItem, ship ShippingAddress, frontendTotal int) (string, int, error)
    Get(ctx context.Context, id string) (*Order, error)
    List(ctx context.Context, skip, take int) ([]Order, int64, error)
    GetByUser(ctx context.Context, id string, userID string) (*Order, error)
    ListByUser(ctx context.Context, userID string, skip, take int) ([]Order, int64, error)
    AppendStatus(ctx context.Context, id string, status, reason string) error
    ListStatuses(ctx context.Context, id string) ([]OrderStatusEvent, error)
    UserCancel(ctx context.Context, id, userID string) error
    RequestRefund(ctx context.Context, id, userID string) error
}

type orderService struct {
    ordersRepo  OrderRepository
    statusRepo  OrderStatusRepository
    productRepo products.ProductRepository
}

func NewOrderService(or OrderRepository, sr OrderStatusRepository, pr products.ProductRepository) OrderService {
    return &orderService{ordersRepo: or, statusRepo: sr, productRepo: pr}
}

func (s *orderService) Create(ctx context.Context, userID string, items []OrderItem, ship ShippingAddress, frontendTotal int) (string, int, error) {
    if len(items) == 0 {
        return "", 0, errors.New("no items")
    }
    backendTotal := 0
    for _, it := range items {
        // Prefer variant price if available; otherwise product price
        p, err := s.productRepo.GetByID(ctx, it.ProductID)
        if err != nil {
            return "", 0, err
        }
        unit := p.Price
        if it.VariantID != "" {
            for _, v := range p.Variants {
                if v.ID == it.VariantID {
                    unit = v.Price
                    break
                }
            }
        }
        backendTotal += unit * it.Quantity
    }

    o := &Order{UserID: userID, FrontendTotal: frontendTotal, BackendTotal: backendTotal, CurrentStatus: "pending"}
    o.SetItems(items)
    o.SetShipping(ship)
    if err := s.ordersRepo.Create(ctx, o); err != nil {
        return "", 0, err
    }
    // initial status event
    _ = s.statusRepo.Append(ctx, &OrderStatusEvent{OrderID: o.ID, Status: o.CurrentStatus, Reason: "order created"})
    return o.ID, backendTotal, nil
}

func (s *orderService) Get(ctx context.Context, id string) (*Order, error) {
    return s.ordersRepo.GetByID(ctx, id)
}

func (s *orderService) List(ctx context.Context, skip, take int) ([]Order, int64, error) {
    return s.ordersRepo.PaginatedList(ctx, skip, take)
}

func (s *orderService) GetByUser(ctx context.Context, id string, userID string) (*Order, error) {
    return s.ordersRepo.GetByIDAndUser(ctx, id, userID)
}

func (s *orderService) ListByUser(ctx context.Context, userID string, skip, take int) ([]Order, int64, error) {
    return s.ordersRepo.PaginatedListByUser(ctx, userID, skip, take)
}

func (s *orderService) AppendStatus(ctx context.Context, id string, status, reason string) error {
    if _, ok := AllowedStatuses[status]; !ok {
        return errors.New("invalid status")
    }
    if err := s.statusRepo.Append(ctx, &OrderStatusEvent{OrderID: id, Status: status, Reason: reason}); err != nil {
        return err
    }
    return s.ordersRepo.UpdateCurrentStatus(ctx, id, status)
}

func (s *orderService) ListStatuses(ctx context.Context, id string) ([]OrderStatusEvent, error) {
    return s.statusRepo.ListByOrder(ctx, id)
}

func (s *orderService) UserCancel(ctx context.Context, id, userID string) error {
    o, err := s.ordersRepo.GetByIDAndUser(ctx, id, userID)
    if err != nil {
        return err
    }
    // disallow cancel after delivery initiated
    if o.CurrentStatus == "order_delivered" || o.CurrentStatus == "agent_out_for_delivery" {
        return errors.New("cannot cancel after out for delivery")
    }
    if err := s.statusRepo.Append(ctx, &OrderStatusEvent{OrderID: id, Status: "user_cancelled", Reason: "cancelled by user"}); err != nil {
        return err
    }
    return s.ordersRepo.UpdateCurrentStatus(ctx, id, "user_cancelled")
}

func (s *orderService) RequestRefund(ctx context.Context, id, userID string) error {
    // ensure ownership
    if _, err := s.ordersRepo.GetByIDAndUser(ctx, id, userID); err != nil {
        return err
    }
    // check delivered within 2 days based on status events
    events, err := s.statusRepo.ListByOrder(ctx, id)
    if err != nil {
        return err
    }
    deliveredAt := int64(0)
    for _, ev := range events {
        if ev.Status == "order_delivered" {
            deliveredAt = ev.CreatedAt.Unix()
        }
    }
    if deliveredAt == 0 {
        return errors.New("order not delivered yet")
    }
    now := (int64)(0)
    now = events[len(events)-1].CreatedAt.Unix()
    // allow if within 2 days (172800 seconds)
    if now-deliveredAt > 172800 {
        return errors.New("refund window expired")
    }
    if err := s.statusRepo.Append(ctx, &OrderStatusEvent{OrderID: id, Status: "user_returning", Reason: "refund requested by user"}); err != nil {
        return err
    }
    return s.ordersRepo.UpdateCurrentStatus(ctx, id, "user_returning")
}


