package orders

import (
    "context"
    "encoding/json"
    "ecommerce-backend/internal/config"
    "ecommerce-backend/core/products"
    "ecommerce-backend/core/users"
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
    "github.com/google/uuid"
    "github.com/sirupsen/logrus"
    "net/http"
    "strconv"
    "time"
)

type Controller struct {
    svc         OrderService
    validate    *validator.Validate
    authMW      gin.HandlerFunc
    productRepo products.ProductRepository
    userRepo    users.UserRepository
}

func NewController(s OrderService, authMW gin.HandlerFunc, pr products.ProductRepository, ur users.UserRepository) *Controller {
    return &Controller{svc: s, validate: validator.New(), authMW: authMW, productRepo: pr, userRepo: ur}
}

type createOrderItem struct {
    ProductID string `json:"product_id" validate:"required"`
    VariantID string `json:"variant_id"`
    VariantSKU string `json:"variant_sku"`
    Quantity  int    `json:"quantity" validate:"gt=0"`
    Price     int    `json:"price" validate:"gte=0"`
}

type createOrderRequest struct {
    UserID        string            `json:"user_id"`
    Items         []createOrderItem `json:"items" validate:"required,dive"`
    Shipping      ShippingAddress   `json:"shipping"`
    FrontendTotal int               `json:"total" validate:"gte=0"`
}

func adminKeyMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        expected := config.Get().AdminAPIKey
        provided := c.GetHeader("X-Admin-API-Key")
        if expected == "" || provided == "" || provided != expected {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }
        c.Next()
    }
}

func (c *Controller) RegisterRoutes(r *gin.Engine) {
    g := r.Group("/orders")
    g.POST("", c.Create)
    g.GET("", adminKeyMiddleware(), c.List)
    g.GET(":id", adminKeyMiddleware(), c.Get)
    g.POST(":id/status", adminKeyMiddleware(), c.AppendStatus)
    g.GET(":id/status", adminKeyMiddleware(), c.ListStatuses)

    ug := r.Group("/user/orders")
    if c.authMW != nil {
        ug.Use(c.authMW)
    }
    ug.POST("", c.CreateForUser)
    ug.GET("", c.ListMine)
    ug.GET(":id", c.GetMine)
    ug.GET(":id/status", c.ListStatusesMine)
    ug.POST(":id/cancel", c.CancelMine)
    ug.POST(":id/refund", c.RequestRefund)
}

func (c *Controller) Create(ctx *gin.Context) {
    var req createOrderRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if err := c.validate.Struct(req); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    items := make([]OrderItem, len(req.Items))
    for i, it := range req.Items {
        items[i] = OrderItem{ProductID: it.ProductID, VariantID: it.VariantID, VariantSKU: it.VariantSKU, Quantity: it.Quantity, Price: it.Price}
    }
    id, backendTotal, err := c.svc.Create(context.Background(), req.UserID, items, req.Shipping, req.FrontendTotal)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    // log comparison for admin observability
    m := map[string]any{"order_id": id, "frontend_total": req.FrontendTotal, "backend_total": backendTotal}
    b, _ := json.Marshal(m)
    logrus.WithField("type", "order_total_check").Info(string(b))
    ctx.JSON(http.StatusOK, gin.H{"id": id, "backend_total": backendTotal})
}

// User-scoped endpoints
type createOrderRequestAuthed struct {
    Items         []createOrderItem `json:"items" validate:"required,dive"`
    Shipping      ShippingAddress   `json:"shipping"`
    FrontendTotal int               `json:"total" validate:"gte=0"`
}

func (c *Controller) CreateForUser(ctx *gin.Context) {
    userIDVal, ok := ctx.Get("user_id")
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    userUUID, ok := userIDVal.(uuid.UUID)
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
        return
    }
    var req createOrderRequestAuthed
    if err := ctx.ShouldBindJSON(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if err := c.validate.Struct(req); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    items := make([]OrderItem, len(req.Items))
    for i, it := range req.Items {
        items[i] = OrderItem{ProductID: it.ProductID, VariantID: it.VariantID, VariantSKU: it.VariantSKU, Quantity: it.Quantity, Price: it.Price}
    }
    id, backendTotal, err := c.svc.Create(context.Background(), userUUID.String(), items, req.Shipping, req.FrontendTotal)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    m := map[string]any{"order_id": id, "frontend_total": req.FrontendTotal, "backend_total": backendTotal}
    b, _ := json.Marshal(m)
    logrus.WithField("type", "order_total_check").Info(string(b))
    ctx.JSON(http.StatusOK, gin.H{"id": id, "backend_total": backendTotal})
}

func (c *Controller) ListMine(ctx *gin.Context) {
    userIDVal, ok := ctx.Get("user_id")
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    userUUID, ok := userIDVal.(uuid.UUID)
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
        return
    }
    skip, _ := strconv.Atoi(ctx.DefaultQuery("skip", "0"))
    take, _ := strconv.Atoi(ctx.DefaultQuery("take", "10"))
    list, _, err := c.svc.ListByUser(context.Background(), userUUID.String(), skip, take)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    ctx.JSON(http.StatusOK, list)
}

func (c *Controller) GetMine(ctx *gin.Context) {
    userIDVal, ok := ctx.Get("user_id")
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    userUUID, ok := userIDVal.(uuid.UUID)
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
        return
    }
    id := ctx.Param("id")
    o, err := c.svc.GetByUser(context.Background(), id, userUUID.String())
    if err != nil {
        ctx.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
        return
    }
    ctx.JSON(http.StatusOK, o)
}

func (c *Controller) ListStatusesMine(ctx *gin.Context) {
    userIDVal, ok := ctx.Get("user_id")
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    userUUID, ok := userIDVal.(uuid.UUID)
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
        return
    }
    id := ctx.Param("id")
    // verify ownership
    if _, err := c.svc.GetByUser(context.Background(), id, userUUID.String()); err != nil {
        ctx.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
        return
    }
    list, err := c.svc.ListStatuses(context.Background(), id)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    ctx.JSON(http.StatusOK, list)
}

func (c *Controller) CancelMine(ctx *gin.Context) {
    userIDVal, ok := ctx.Get("user_id")
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    userUUID, ok := userIDVal.(uuid.UUID)
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
        return
    }
    id := ctx.Param("id")
    if err := c.svc.UserCancel(context.Background(), id, userUUID.String()); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    ctx.JSON(http.StatusOK, gin.H{"cancelled": true})
}

func (c *Controller) RequestRefund(ctx *gin.Context) {
    userIDVal, ok := ctx.Get("user_id")
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    userUUID, ok := userIDVal.(uuid.UUID)
    if !ok {
        ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
        return
    }
    id := ctx.Param("id")
    if err := c.svc.RequestRefund(context.Background(), id, userUUID.String()); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    ctx.JSON(http.StatusOK, gin.H{"requested": true})
}

func (c *Controller) Get(ctx *gin.Context) {
    id := ctx.Param("id")
    o, err := c.svc.Get(context.Background(), id)
    if err != nil {
        ctx.JSON(http.StatusNotFound, gin.H{"error": "order not found"})
        return
    }
    type enrichedItem struct {
        ProductID   string            `json:"product_id"`
        VariantID   string            `json:"variant_id"`
        VariantSKU  string            `json:"variant_sku"`
        Quantity    int               `json:"quantity"`
        Price       int               `json:"price"`
        ProductName string            `json:"product_name"`
        VariantPrice int              `json:"variant_price"`
        VariantAttrs map[string]string `json:"variant_attributes"`
    }
    type adminDetail struct {
        ID            string         `json:"id"`
        UserID        string         `json:"user_id"`
        BackendTotal  int            `json:"backend_total"`
        FrontendTotal int            `json:"frontend_total"`
        CurrentStatus string         `json:"current_status"`
        CreatedAt     string         `json:"created_at"`
        Items         []enrichedItem `json:"items"`
        Shipping      any            `json:"shipping"`
    }
    var items []OrderItem
    _ = json.Unmarshal(o.ItemsJSON, &items)
    enriched := make([]enrichedItem, 0, len(items))
    for _, it := range items {
        ei := enrichedItem{
            ProductID: it.ProductID,
            VariantID: it.VariantID,
            VariantSKU: it.VariantSKU,
            Quantity: it.Quantity,
            Price: it.Price,
        }
        if p, err := c.productRepo.GetByID(context.Background(), it.ProductID); err == nil {
            ei.ProductName = p.Name
            if it.VariantID != "" {
                for _, v := range p.Variants {
                    if v.ID == it.VariantID {
                        ei.VariantPrice = v.Price
                        var attrsArr []map[string]string
                        _ = json.Unmarshal(v.Attributes, &attrsArr)
                        attrs := make(map[string]string)
                        for _, kv := range attrsArr {
                            if name, ok := kv["name"]; ok {
                                attrs[name] = kv["value"]
                            }
                        }
                        ei.VariantAttrs = attrs
                        break
                    }
                }
            }
        }
        enriched = append(enriched, ei)
    }
    var shipping any
    _ = json.Unmarshal(o.ShippingJSON, &shipping)
    resp := adminDetail{
        ID: o.ID,
        UserID: o.UserID,
        BackendTotal: o.BackendTotal,
        FrontendTotal: o.FrontendTotal,
        CurrentStatus: o.CurrentStatus,
        CreatedAt: o.CreatedAt.Format(time.RFC3339),
        Items: enriched,
        Shipping: shipping,
    }
    ctx.JSON(http.StatusOK, resp)
}

func (c *Controller) List(ctx *gin.Context) {
    skip, _ := strconv.Atoi(ctx.DefaultQuery("skip", "0"))
    take, _ := strconv.Atoi(ctx.DefaultQuery("take", "10"))
    list, _, err := c.svc.List(context.Background(), skip, take)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    type adminListItem struct {
        ID           string `json:"id"`
        UserEmail    string `json:"user_email"`
        BackendTotal int    `json:"backend_total"`
        CurrentStatus string `json:"current_status"`
        CreatedAt    string `json:"created_at"`
        TotalItems   int    `json:"total_items"`
    }
    resp := make([]adminListItem, 0, len(list))
    for _, o := range list {
        userEmail := ""
        if u, err := c.userRepo.GetByID(context.Background(), uuid.MustParse(o.UserID)); err == nil {
            userEmail = u.Email
        }
        var items []OrderItem
        _ = json.Unmarshal(o.ItemsJSON, &items)
        totalQty := 0
        for _, it := range items {
            totalQty += it.Quantity
        }
        resp = append(resp, adminListItem{
            ID: o.ID,
            UserEmail: userEmail,
            BackendTotal: o.BackendTotal,
            CurrentStatus: o.CurrentStatus,
            CreatedAt: o.CreatedAt.Format(time.RFC3339),
            TotalItems: totalQty,
        })
    }
    ctx.JSON(http.StatusOK, resp)
}

type statusReq struct {
    Status string `json:"new_status" validate:"required"`
    Reason string `json:"reason"`
}

func (c *Controller) AppendStatus(ctx *gin.Context) {
    id := ctx.Param("id")
    var req statusReq
    if err := ctx.ShouldBindJSON(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if err := c.validate.Struct(req); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if err := c.svc.AppendStatus(context.Background(), id, req.Status, req.Reason); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    ctx.JSON(http.StatusOK, gin.H{"updated": true})
}

func (c *Controller) ListStatuses(ctx *gin.Context) {
    id := ctx.Param("id")
    list, err := c.svc.ListStatuses(context.Background(), id)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    ctx.JSON(http.StatusOK, list)
}

func (c *Controller) Name() string { return "orders" }


