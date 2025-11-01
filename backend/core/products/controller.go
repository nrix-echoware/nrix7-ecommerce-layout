package products

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"ecommerce-backend/common/middleware"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
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
	IsActive    bool                `json:"is_active"`
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
	IsActive   bool                `json:"is_active"`
}

func (c *ProductController) RegisterRoutes(r *gin.Engine) {
	group := r.Group("/products")
	// Register specific routes before parameterized routes to avoid conflicts
	group.GET("/cart/hash", c.GetCartHash)
	group.POST("", middleware.AdminKeyMiddleware(), c.CreateProduct)
	group.PUT(":id", middleware.AdminKeyMiddleware(), c.UpdateProduct)
	group.DELETE(":id", middleware.AdminKeyMiddleware(), c.DeleteProduct)
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
		IsActive:    req.IsActive,
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
			IsActive:   v.IsActive,
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
		IsActive:    req.IsActive,
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
			IsActive:   v.IsActive,
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
	
	isAdmin := ctx.GetHeader("X-Admin-API-Key") != "" || ctx.Query("admin_key") != ""
	if !isAdmin && !product.IsActive {
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
	
	isAdmin := ctx.GetHeader("X-Admin-API-Key") != "" || ctx.Query("admin_key") != ""
	
	responses := make([]ProductResponse, 0)
	for _, p := range products {
		if !isAdmin && !p.IsActive {
			continue
		}
		responses = append(responses, TransformProductToResponse(&p))
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
