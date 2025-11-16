package tryons

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"ecommerce-backend/core/genai/tryons/processors"
	"ecommerce-backend/internal/config"
	"github.com/sirupsen/logrus"
)

type UploadMedia struct {
	Data     string `json:"data"`
	MimeType string `json:"mimetype"`
}

type CreateJobRequest struct {
	Category string        `json:"category"`
	Prompt   string        `json:"prompt"`
	Medias   []UploadMedia `json:"medias"`
}

type Service interface {
	CreateAndRun(ctx context.Context, req CreateJobRequest) (*TryonJob, error)
	Get(ctx context.Context, id uint) (*TryonJob, error)
	List(ctx context.Context, limit int) ([]TryonJob, error)
	ListMedias(ctx context.Context, limit int, offset int) ([]TryonMedia, int64, error)
}

type service struct {
	repo         Repository
	storageRoot  string
	maxRetry     int
	pipeline     []processors.StageFunc
}

func NewService(repo Repository) Service {
	cfg := config.Get()
	return &service{
		repo:        repo,
		storageRoot: cfg.GenAIStorage.Path,
		maxRetry:    1,
		pipeline:    []processors.StageFunc{processors.Stage1},
	}
}

func (s *service) CreateAndRun(ctx context.Context, req CreateJobRequest) (*TryonJob, error) {
	if req.Category == "" || len(req.Medias) == 0 {
		return nil, errors.New("category and medias required")
	}
	job := &TryonJob{
		Category: req.Category,
		Prompt:   req.Prompt,
		Status:   TryonStatusPending,
	}
	if err := s.repo.CreateJob(ctx, job); err != nil {
		return nil, err
	}
	jobDir := filepath.Join(s.storageRoot, fmt.Sprintf("job-%d", job.ID))
	if err := os.MkdirAll(jobDir, 0o755); err != nil {
		return nil, err
	}
	var medias []*TryonMedia
	var filePaths []string
	for idx, m := range req.Medias {
		b, err := base64.StdEncoding.DecodeString(m.Data)
		if err != nil {
			return nil, fmt.Errorf("invalid media %d: %w", idx, err)
		}
		filename := fmt.Sprintf("media_%d", idx+1)
		ext := extFromMime(m.MimeType)
		if ext != "" {
			filename += "." + ext
		}
		relativePath := filepath.Join(fmt.Sprintf("job-%d", job.ID), filename)
		full := filepath.Join(s.storageRoot, relativePath)
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			return nil, err
		}
		if err := os.WriteFile(full, b, 0o644); err != nil {
			return nil, err
		}
		medias = append(medias, &TryonMedia{
			JobID:     job.ID,
			FilePath:  relativePath,
			MimeType:  m.MimeType,
			SizeBytes: int64(len(b)),
		})
		filePaths = append(filePaths, relativePath)
	}
	if err := s.repo.AddMedia(ctx, medias); err != nil {
		return nil, err
	}

	go s.runPipeline(job.ID, req.Category, req.Prompt, filePaths)
	return job, nil
}

func (s *service) runPipeline(jobID uint, category, prompt string, files []string) {
	ctx := context.Background()
	job, err := s.repo.FindJob(ctx, jobID)
	if err != nil {
		logrus.Errorf("tryons: job %d not found: %v", jobID, err)
		return
	}
	job.Status = TryonStatusProcessing
	if err := s.repo.UpdateJob(ctx, job); err != nil {
		logrus.Errorf("tryons: job %d status update: %v", jobID, err)
	}
	in := processors.StageInput{Category: category, Prompt: prompt, Files: files}
	for i, stage := range s.pipeline {
		_, err := stage(in)
		if err != nil {
			job.Status = TryonStatusError
			job.ErrorMsg = fmt.Sprintf("stage %d: %v", i+1, err)
			_ = s.repo.UpdateJob(ctx, job)
			return
		}
		// simulate processing time
		time.Sleep(200 * time.Millisecond)
	}
	job.Status = TryonStatusCompleted
	job.ErrorMsg = ""
	if err := s.repo.UpdateJob(ctx, job); err != nil {
		logrus.Errorf("tryons: job %d completion update failed: %v", jobID, err)
	}
}

func (s *service) Get(ctx context.Context, id uint) (*TryonJob, error) {
	return s.repo.FindJob(ctx, id)
}

func (s *service) List(ctx context.Context, limit int) ([]TryonJob, error) {
	return s.repo.ListJobs(ctx, limit)
}

func (s *service) ListMedias(ctx context.Context, limit int, offset int) ([]TryonMedia, int64, error) {
	return s.repo.ListMedias(ctx, limit, offset)
}

func extFromMime(mime string) string {
	switch mime {
	case "image/png":
		return "png"
	case "image/jpeg", "image/jpg":
		return "jpg"
	case "image/webp":
		return "webp"
	case "video/mp4":
	 return "mp4"
	default:
		return ""
	}
}


