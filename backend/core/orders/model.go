package orders

import (
    "encoding/json"
    "github.com/google/uuid"
    "gorm.io/datatypes"
    "gorm.io/gorm"
    "time"
)

type OrderItem struct {
    ProductID string `json:"product_id"`
    VariantID string `json:"variant_id"`
    VariantSKU string `json:"variant_sku"`
    Quantity  int    `json:"quantity"`
    Price     int    `json:"price"` // price per unit from frontend for audit
}

type ShippingAddress struct {
    FullName   string `json:"full_name"`
    Line1      string `json:"line1"`
    Line2      string `json:"line2"`
    City       string `json:"city"`
    State      string `json:"state"`
    PostalCode string `json:"postal_code"`
    Country    string `json:"country"`
    Phone      string `json:"phone"`
}

type Order struct {
    ID             string         `gorm:"primaryKey" json:"id"`
    UserID         string         `json:"user_id"`
    ItemsJSON      datatypes.JSON `json:"items_json"`      // snapshot of cart items as JSON
    ShippingJSON   datatypes.JSON `json:"shipping_json"`   // snapshot of shipping address
    FrontendTotal  int            `json:"frontend_total"`  // provided by client for audit
    BackendTotal   int            `json:"backend_total"`   // computed from products table
    CurrentStatus  string         `json:"current_status"`
    CreatedAt      time.Time      `gorm:"autoCreateTime" json:"created_at"`
}

func (o *Order) BeforeCreate(tx *gorm.DB) (err error) {
    if o.ID == "" {
        o.ID = uuid.New().String()
    }
    return
}

func (o *Order) SetItems(items []OrderItem) {
    b, _ := json.Marshal(items)
    o.ItemsJSON = b
}

func (o *Order) SetShipping(addr ShippingAddress) {
    b, _ := json.Marshal(addr)
    o.ShippingJSON = b
}

type OrderStatusEvent struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    OrderID   string    `gorm:"index" json:"order_id"`
    Status    string    `json:"status"`
    Reason    string    `json:"reason"`
    CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// Allowed statuses for validation
var AllowedStatuses = map[string]struct{}{
    // ORDER PLACED
    "pending":               {},
    "canceled":              {},
    "rejected":              {},
    "rejected_by_user":      {},
    // SELLER DISPATCH
    "seller_notified":       {},
    "seller_processing":     {},
    "seller_waiting_dispatch": {},
    "seller_dispatched":     {},
    // SHIPPING AGENT
    "agent_picked":          {},
    "agent_transporting":    {},
    "agent_out_for_delivery": {},
    "order_delivered":       {},
    // USERS
    "user_cancelled_on_arrival": {},
    "user_cancelled":           {},
    "user_returned":            {},
    // PAYMENT DISPUTE / REFUND FLOW
    "user_returning":        {},
    "user_return_received":  {},
    "user_refund_initiated": {},
    "user_refund_failed":    {},
    "user_refund_processed": {},
}


