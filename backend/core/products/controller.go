package products

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"ecommerce-backend/internal/config"
)

type ProductController struct {
	service   ProductService
	validator *validator.Validate
}

func NewProductController(s ProductService) *ProductController {
	return &ProductController{
		service:   s,
		validator: validator.New(),
	}
}

type ProductRequest struct {
	ID          string              `json:"id"`
	Name        string              `json:"name" validate:"required"`
	Category    string              `json:"category"`
	Description string              `json:"description"`
	Price       int                 `json:"price"`
	Featured    bool                `json:"featured"`
	Images      []string            `json:"images"`
	Variants    []ProductVariantReq `json:"variants"`
}

type ProductVariantReq struct {
	ID         string              `json:"id"`
	SKU        string              `json:"sku"`
	Attributes []map[string]string `json:"attributes"`
	Image      string              `json:"image_url"`
	Price      int                 `json:"price"`
	InStock    bool                `json:"in_stock"`
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

func (c *ProductController) RegisterRoutes(r *gin.Engine) {
	group := r.Group("/products")
	// Register specific routes before parameterized routes to avoid conflicts
	group.GET("/cart/hash", c.GetCartHash)
	group.POST("", adminKeyMiddleware(), c.CreateProduct)
	group.PUT(":id", adminKeyMiddleware(), c.UpdateProduct)
	group.DELETE(":id", adminKeyMiddleware(), c.DeleteProduct)
	group.GET(":id", c.GetProduct)
	group.GET("", c.ListProducts)
}

func (c *ProductController) CreateProduct(ctx *gin.Context) {
	var req ProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.validator.Struct(req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	product := &Product{
		ID:          req.ID,
		Name:        req.Name,
		Category:    req.Category,
		Description: req.Description,
		Price:       req.Price,
		Featured:    req.Featured,
	}
	for _, img := range req.Images {
		product.Images = append(product.Images, ProductImage{ImageURL: img})
	}
	for _, v := range req.Variants {
		attrJSON, _ := json.Marshal(v.Attributes)
		product.Variants = append(product.Variants, ProductVariant{
			ID:         v.ID,
			SKU:        v.SKU,
			Attributes: attrJSON,
			ImageURL:   v.Image,
			Price:      v.Price,
			InStock:    v.InStock,
		})
	}
	id, err := c.service.CreateProduct(context.Background(), product)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"id": id})
}

func (c *ProductController) UpdateProduct(ctx *gin.Context) {
	id := ctx.Param("id")
	var req ProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.validator.Struct(req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	product := &Product{
		ID:          id,
		Name:        req.Name,
		Category:    req.Category,
		Description: req.Description,
		Price:       req.Price,
		Featured:    req.Featured,
	}

	for _, img := range req.Images {
		product.Images = append(product.Images, ProductImage{ImageURL: img, ProductID: id})
	}
	for _, v := range req.Variants {
		attrJSON, _ := json.Marshal(v.Attributes)
		product.Variants = append(product.Variants, ProductVariant{
			ID:         v.ID,
			SKU:        v.SKU,
			Attributes: attrJSON,
			ImageURL:   v.Image,
			Price:      v.Price,
			InStock:    v.InStock,
			ProductID:  id,
		})
	}
	if err := c.service.UpdateProduct(context.Background(), product); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"id": id})
}

func (c *ProductController) DeleteProduct(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := c.service.DeleteProduct(context.Background(), id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"deleted": true})
}

func (c *ProductController) GetProduct(ctx *gin.Context) {
	id := ctx.Param("id")
	product, err := c.service.GetProductByID(context.Background(), id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
		return
	}
	resp := TransformProductToResponse(product)
	ctx.JSON(http.StatusOK, resp)
}

func (c *ProductController) ListProducts(ctx *gin.Context) {
	skip, _ := strconv.Atoi(ctx.DefaultQuery("skip", "0"))
	take, _ := strconv.Atoi(ctx.DefaultQuery("take", "10"))
	products, _, err := c.service.PaginatedListProducts(context.Background(), skip, take)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	responses := make([]ProductResponse, len(products))
	for i, p := range products {
		responses[i] = TransformProductToResponse(&p)
	}
	ctx.JSON(http.StatusOK, responses)
}

func (c *ProductController) Name() string {
	return "products"
}

func (c *ProductController) GetCartHash(ctx *gin.Context) {
	hash, err := c.service.GetCartHash(context.Background())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"hash": hash})
}
