package orders

import (
    "encoding/json"
    "ecommerce-backend/common/constants"
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
    constants.ORDER_STATUS_PENDING:                  {},
    constants.ORDER_STATUS_CANCELED:                 {},
    constants.ORDER_STATUS_REJECTED:                 {},
    constants.ORDER_STATUS_REJECTED_BY_USER:         {},
    constants.ORDER_STATUS_SELLER_NOTIFIED:          {},
    constants.ORDER_STATUS_SELLER_PROCESSING:        {},
    constants.ORDER_STATUS_SELLER_WAITING_DISPATCH:  {},
    constants.ORDER_STATUS_SELLER_DISPATCHED:        {},
    constants.ORDER_STATUS_AGENT_PICKED:             {},
    constants.ORDER_STATUS_AGENT_TRANSPORTING:      {},
    constants.ORDER_STATUS_AGENT_OUT_FOR_DELIVERY:   {},
    constants.ORDER_STATUS_ORDER_DELIVERED:           {},
    constants.ORDER_STATUS_USER_CANCELLED_ON_ARRIVAL: {},
    constants.ORDER_STATUS_USER_CANCELLED:           {},
    constants.ORDER_STATUS_USER_RETURNED:            {},
    constants.ORDER_STATUS_USER_RETURNING:           {},
    constants.ORDER_STATUS_USER_RETURN_RECEIVED:     {},
    constants.ORDER_STATUS_USER_REFUND_INITIATED:    {},
    constants.ORDER_STATUS_USER_REFUND_FAILED:       {},
    constants.ORDER_STATUS_USER_REFUND_PROCESSED:     {},
}


