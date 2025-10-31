package orders

import (
    "context"
    "ecommerce-backend/common/constants"
    "ecommerce-backend/core/products"
    "errors"
    "github.com/sirupsen/logrus"
)

type EventEmitter interface {
    Emit(event interface{})
}

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
    ordersRepo   OrderRepository
    statusRepo   OrderStatusRepository
    productRepo  products.ProductRepository
    eventEmitter EventEmitter
}

func NewOrderService(or OrderRepository, sr OrderStatusRepository, pr products.ProductRepository) OrderService {
    return &orderService{ordersRepo: or, statusRepo: sr, productRepo: pr, eventEmitter: nil}
}

func NewOrderServiceWithEvents(or OrderRepository, sr OrderStatusRepository, pr products.ProductRepository, emitter EventEmitter) OrderService {
    return &orderService{ordersRepo: or, statusRepo: sr, productRepo: pr, eventEmitter: emitter}
}

func (s *orderService) Create(ctx context.Context, userID string, items []OrderItem, ship ShippingAddress, frontendTotal int) (string, int, error) {
    if len(items) == 0 {
        return "", 0, errors.New("no items")
    }
    backendTotal := 0
    for _, it := range items {
        // Always use database price - never trust frontend price
        p, err := s.productRepo.GetByID(ctx, it.ProductID)
        if err != nil {
            return "", 0, err
        }
        
        var unit int
        var variantMatched bool
        var matchedVariantID string
        
        // Case 1: Product has variants
        if len(p.Variants) > 0 {
            if it.VariantID != "" {
                // Explicit variant ID provided - use it
                variantMatched = false
                for _, v := range p.Variants {
                    if v.ID == it.VariantID {
                        unit = v.Price
                        variantMatched = true
                        matchedVariantID = v.ID
                        logrus.WithFields(logrus.Fields{
                            "order_item": it.ProductID,
                            "variant_id": it.VariantID,
                            "variant_price": unit,
                            "quantity": it.Quantity,
                            "match_type": "explicit_variant_id",
                        }).Info("Variant matched by explicit ID")
                        break
                    }
                }
                if !variantMatched {
                    logrus.WithFields(logrus.Fields{
                        "order_item": it.ProductID,
                        "variant_id": it.VariantID,
                        "available_variants": len(p.Variants),
                    }).Error("Variant ID not found, falling back to price matching")
                    // Fall through to price matching
                }
            }
            // If VariantSKU provided, try to match by SKU
            if !variantMatched && it.VariantSKU != "" {
                for _, v := range p.Variants {
                    if v.SKU == it.VariantSKU {
                        unit = v.Price
                        variantMatched = true
                        matchedVariantID = v.ID
                        logrus.WithFields(logrus.Fields{
                            "order_item": it.ProductID,
                            "variant_sku": it.VariantSKU,
                            "matched_variant_id": v.ID,
                            "variant_price": unit,
                            "quantity": it.Quantity,
                            "match_type": "sku_match",
                        }).Info("Variant matched by SKU")
                        break
                    }
                }
            }
            
            // Case 2: No variant ID but variants exist - match by price
            if it.VariantID == "" || !variantMatched {
                variantMatched = false
                for _, v := range p.Variants {
                    if v.Price == it.Price {
                        unit = v.Price
                        variantMatched = true
                        matchedVariantID = v.ID
                        logrus.WithFields(logrus.Fields{
                            "order_item": it.ProductID,
                            "frontend_price": it.Price,
                            "matched_variant_id": v.ID,
                            "variant_price": unit,
                            "quantity": it.Quantity,
                            "match_type": "price_match",
                        }).Info("Variant matched by price")
                        break
                    }
                }
                if !variantMatched {
                    prices := make([]int, len(p.Variants))
                    for i, v := range p.Variants {
                        prices[i] = v.Price
                    }
                    logrus.WithFields(logrus.Fields{
                        "order_item": it.ProductID,
                        "frontend_price": it.Price,
                        "available_variants": len(p.Variants),
                        "available_variant_prices": prices,
                    }).Error("No variant matched by price, using product base price")
                    unit = p.Price
                }
            }
        } else {
            // Case 3: Product has no variants - use product base price
            unit = p.Price
            logrus.WithFields(logrus.Fields{
                "order_item": it.ProductID,
                "product_price": unit,
                "quantity": it.Quantity,
                "match_type": "no_variants",
            }).Info("Product has no variants, using base price")
        }
        
        backendTotal += unit * it.Quantity
        
        // Log price mismatch for audit
        if it.Price != unit {
            logrus.WithFields(logrus.Fields{
                "order_item": it.ProductID,
                "variant_id_sent": it.VariantID,
                "variant_id_matched": matchedVariantID,
                "frontend_price": it.Price,
                "db_price": unit,
                "quantity": it.Quantity,
                "has_variants": len(p.Variants) > 0,
            }).Warn("Price mismatch: frontend price differs from database price")
        }
    }

    o := &Order{UserID: userID, FrontendTotal: frontendTotal, BackendTotal: backendTotal, CurrentStatus: constants.ORDER_STATUS_PENDING}
    o.SetItems(items)
    o.SetShipping(ship)
    if err := s.ordersRepo.Create(ctx, o); err != nil {
        return "", 0, err
    }
    // initial status event
    _ = s.statusRepo.Append(ctx, &OrderStatusEvent{OrderID: o.ID, Status: o.CurrentStatus, Reason: "order created"})
    
    // Emit plugin event
    if s.eventEmitter != nil {
        s.eventEmitter.Emit(map[string]interface{}{
            "name":   constants.EVENT_ORDER_CREATED,
            "target": constants.PLUGIN_TARGET_DISCORD_ORDERS,
            "data": map[string]interface{}{
                "order_id": o.ID,
                "user_id":  userID,
                "total":    backendTotal,
            },
        })
    }
    
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
    if err := s.ordersRepo.UpdateCurrentStatus(ctx, id, status); err != nil {
        return err
    }
    
    // Emit plugin event
    if s.eventEmitter != nil {
        s.eventEmitter.Emit(map[string]interface{}{
            "name":   constants.EVENT_ORDER_UPDATED,
            "target": constants.PLUGIN_TARGET_DISCORD_ORDERS,
            "data": map[string]interface{}{
                "order_id": id,
                "status":   status,
                "reason":   reason,
            },
        })
    }
    
    return nil
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
    if o.CurrentStatus == constants.ORDER_STATUS_ORDER_DELIVERED || o.CurrentStatus == constants.ORDER_STATUS_AGENT_OUT_FOR_DELIVERY {
        return errors.New("cannot cancel after out for delivery")
    }
    if err := s.statusRepo.Append(ctx, &OrderStatusEvent{OrderID: id, Status: constants.ORDER_STATUS_USER_CANCELLED, Reason: "cancelled by user"}); err != nil {
        return err
    }
    return s.ordersRepo.UpdateCurrentStatus(ctx, id, constants.ORDER_STATUS_USER_CANCELLED)
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
        if ev.Status == constants.ORDER_STATUS_ORDER_DELIVERED {
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
    if err := s.statusRepo.Append(ctx, &OrderStatusEvent{OrderID: id, Status: constants.ORDER_STATUS_USER_RETURNING, Reason: "refund requested by user"}); err != nil {
        return err
    }
    return s.ordersRepo.UpdateCurrentStatus(ctx, id, constants.ORDER_STATUS_USER_RETURNING)
}


