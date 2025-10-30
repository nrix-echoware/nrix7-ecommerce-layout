package orders

import (
    "context"
    "encoding/json"
    "ecommerce-backend/internal/config"
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
    "github.com/google/uuid"
    "github.com/sirupsen/logrus"
    "net/http"
    "strconv"
)

type Controller struct {
    svc       OrderService
    validate  *validator.Validate
    authMW    gin.HandlerFunc
}

func NewController(s OrderService, authMW gin.HandlerFunc) *Controller {
    return &Controller{svc: s, validate: validator.New(), authMW: authMW}
}

type createOrderItem struct {
    ProductID string `json:"product_id" validate:"required"`
    VariantID string `json:"variant_id"`
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
        items[i] = OrderItem{ProductID: it.ProductID, VariantID: it.VariantID, Quantity: it.Quantity, Price: it.Price}
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
        items[i] = OrderItem{ProductID: it.ProductID, VariantID: it.VariantID, Quantity: it.Quantity, Price: it.Price}
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
    ctx.JSON(http.StatusOK, o)
}

func (c *Controller) List(ctx *gin.Context) {
    skip, _ := strconv.Atoi(ctx.DefaultQuery("skip", "0"))
    take, _ := strconv.Atoi(ctx.DefaultQuery("take", "10"))
    list, _, err := c.svc.List(context.Background(), skip, take)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    ctx.JSON(http.StatusOK, list)
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


