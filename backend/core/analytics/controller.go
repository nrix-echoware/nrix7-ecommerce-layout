package analytics

import (
	"context"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"net/http"
)

type Controller struct {
	service Service
}

func NewController(s Service) *Controller {
	return &Controller{service: s}
}

type VisitorRequest struct {
	Path     string                 `json:"path"`
	Referrer string                 `json:"referrer"`
	Extras   map[string]interface{} `json:"extras"`
}

func (c *Controller) RegisterRoutes(r *gin.Engine) {
	r.POST("/analytics/visitor", c.LogVisitor)
}

func (c *Controller) LogVisitor(ctx *gin.Context) {
	var req VisitorRequest
	_ = ctx.ShouldBindJSON(&req)
	ip := ctx.ClientIP()
	ua := ctx.Request.UserAgent()

	event := &VisitorEvent{
		IP:        ip,
		UserAgent: ua,
		Referrer:  req.Referrer,
		Path:      req.Path,
	}
	if req.Extras != nil {
		if b, err := jsonMarshal(req.Extras); err == nil {
			event.Extras = b
		}
	}
	id, err := c.service.LogVisitor(context.Background(), event)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"id": id})
}

// jsonMarshal is isolated to avoid adding a new import in signature
func jsonMarshal(v interface{}) ([]byte, error) {
	return json.Marshal(v)
}
