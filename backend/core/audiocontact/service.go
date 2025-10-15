package audiocontact

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"
	"crypto/rand"
	"encoding/hex"
)

type AudioContactService interface {
	CreateAudioContact(req *AudioContactRequest, userID *uint) (*AudioContactResponse, error)
	GetAudioContact(id uint) (*AudioContact, error)
	GetAllAudioContacts(limit, offset int) ([]AudioContactListResponse, error)
	GetAudioContactsByStatus(status string, limit, offset int) ([]AudioContactListResponse, error)
	UpdateAudioContactStatus(id uint, status string, notes string) error
	DeleteAudioContact(id uint) error
	GetAudioFile(audioContact *AudioContact) ([]byte, error)
	GetStats() (map[string]int64, error)
}

type audioContactService struct {
	repo   AudioContactRepository
	config *AudioConfig
}

type AudioConfig struct {
	StoragePath string
	BaseURL     string
}

func NewAudioContactService(repo AudioContactRepository, config *AudioConfig) AudioContactService {
	return &audioContactService{
		repo:   repo,
		config: config,
	}
}

func (s *audioContactService) CreateAudioContact(req *AudioContactRequest, userID *uint) (*AudioContactResponse, error) {
	// Decode base64 audio data
	audioData, err := base64.StdEncoding.DecodeString(req.AudioData)
	if err != nil {
		return nil, fmt.Errorf("failed to decode audio data: %v", err)
	}

	// Generate unique filename
	filename, err := s.generateUniqueFilename(req.MimeType)
	if err != nil {
		return nil, fmt.Errorf("failed to generate filename: %v", err)
	}

	// Ensure storage directory exists
	if err := os.MkdirAll(s.config.StoragePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory: %v", err)
	}

	// Save audio file
	filePath := filepath.Join(s.config.StoragePath, filename)
	if err := ioutil.WriteFile(filePath, audioData, 0644); err != nil {
		return nil, fmt.Errorf("failed to save audio file: %v", err)
	}

	// Create database record
	audioContact := &AudioContact{
		UserID:    userID,
		Email:     req.Email,
		Name:      req.Name,
		Phone:     req.Phone,
		AudioFile: filename,
		Duration:  req.Duration,
		FileSize:  int64(len(audioData)),
		MimeType:  req.MimeType,
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.repo.Create(audioContact); err != nil {
		// Clean up file if database save fails
		os.Remove(filePath)
		return nil, fmt.Errorf("failed to save audio contact record: %v", err)
	}

	return &AudioContactResponse{
		ID:        audioContact.ID,
		Message:   "Audio message submitted successfully",
		CreatedAt: audioContact.CreatedAt,
	}, nil
}

func (s *audioContactService) GetAudioContact(id uint) (*AudioContact, error) {
	return s.repo.GetByID(id)
}

func (s *audioContactService) GetAllAudioContacts(limit, offset int) ([]AudioContactListResponse, error) {
	audioContacts, err := s.repo.GetAll(limit, offset)
	if err != nil {
		return nil, err
	}

	return s.convertToResponseList(audioContacts), nil
}

func (s *audioContactService) GetAudioContactsByStatus(status string, limit, offset int) ([]AudioContactListResponse, error) {
	audioContacts, err := s.repo.GetByStatus(status, limit, offset)
	if err != nil {
		return nil, err
	}

	return s.convertToResponseList(audioContacts), nil
}

func (s *audioContactService) UpdateAudioContactStatus(id uint, status string, notes string) error {
	return s.repo.UpdateStatus(id, status, notes)
}

func (s *audioContactService) DeleteAudioContact(id uint) error {
	// Get the audio contact to find the file path
	audioContact, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	// Delete the database record
	if err := s.repo.Delete(id); err != nil {
		return err
	}

	// Delete the audio file
	filePath := filepath.Join(s.config.StoragePath, audioContact.AudioFile)
	os.Remove(filePath)

	return nil
}

func (s *audioContactService) GetAudioFile(audioContact *AudioContact) ([]byte, error) {
	filePath := filepath.Join(s.config.StoragePath, audioContact.AudioFile)
	return ioutil.ReadFile(filePath)
}

func (s *audioContactService) GetStats() (map[string]int64, error) {
	total, err := s.repo.GetCount()
	if err != nil {
		return nil, err
	}

	pending, err := s.repo.GetCountByStatus("pending")
	if err != nil {
		return nil, err
	}

	processed, err := s.repo.GetCountByStatus("processed")
	if err != nil {
		return nil, err
	}

	archived, err := s.repo.GetCountByStatus("archived")
	if err != nil {
		return nil, err
	}

	return map[string]int64{
		"total":     total,
		"pending":   pending,
		"processed": processed,
		"archived":  archived,
	}, nil
}

func (s *audioContactService) convertToResponseList(audioContacts []AudioContact) []AudioContactListResponse {
	responses := make([]AudioContactListResponse, len(audioContacts))
	for i, ac := range audioContacts {
		responses[i] = AudioContactListResponse{
			ID:          ac.ID,
			UserID:      ac.UserID,
			Email:       ac.Email,
			Name:        ac.Name,
			Phone:       ac.Phone,
			Duration:    ac.Duration,
			FileSize:    ac.FileSize,
			MimeType:    ac.MimeType,
			Status:      ac.Status,
			Notes:       ac.Notes,
			CreatedAt:   ac.CreatedAt,
			ProcessedAt: ac.ProcessedAt,
			AudioURL:    fmt.Sprintf("%s/audio/%d", s.config.BaseURL, ac.ID),
		}
	}
	return responses
}

func (s *audioContactService) generateUniqueFilename(mimeType string) (string, error) {
	// Generate random bytes
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}

	// Convert to hex string
	randomStr := hex.EncodeToString(randomBytes)

	// Get file extension from mime type
	extension := ".webm" // default
	switch {
	case strings.Contains(mimeType, "webm"):
		extension = ".webm"
	case strings.Contains(mimeType, "mp4"):
		extension = ".mp4"
	case strings.Contains(mimeType, "wav"):
		extension = ".wav"
	case strings.Contains(mimeType, "ogg"):
		extension = ".ogg"
	}

	// Add timestamp for uniqueness
	timestamp := time.Now().Unix()
	return fmt.Sprintf("audio_%d_%s%s", timestamp, randomStr, extension), nil
}
