package tryons

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	svc Service
}

func NewController(svc Service) *Controller {
	return &Controller{svc: svc}
}

func (c *Controller) Name() string {
	return "genai_tryons"
}

func (c *Controller) RegisterRoutes(r *gin.Engine) {
	g := r.Group("/genai/tryons")
	g.POST("/jobs", c.createJob)
	g.GET("/jobs", c.listJobs)
	g.GET("/jobs/:id", c.getJob)
	g.GET("/medias", c.listMedias)
}

func (c *Controller) createJob(ctx *gin.Context) {
	var req CreateJobRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	job, err := c.svc.CreateAndRun(ctx, req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusAccepted, gin.H{"id": job.ID, "status": job.Status})
}

func (c *Controller) listJobs(ctx *gin.Context) {
	limitStr := ctx.Query("limit")
	limit := 50
	if limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil {
			limit = v
		}
	}
	items, err := c.svc.List(ctx, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, items)
}

func (c *Controller) getJob(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	item, err := c.svc.Get(ctx, uint(id64))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, item)
}

func (c *Controller) listMedias(ctx *gin.Context) {
	limit := 20
	offset := 0
	if v := ctx.Query("limit"); v != "" {
		if i, err := strconv.Atoi(v); err == nil && i > 0 {
			limit = i
		}
	}
	if v := ctx.Query("offset"); v != "" {
		if i, err := strconv.Atoi(v); err == nil && i >= 0 {
			offset = i
		}
	}
	items, total, err := c.svc.ListMedias(ctx, limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"items": items,
		"total": total,
		"limit": limit,
		"offset": offset,
	})
}


