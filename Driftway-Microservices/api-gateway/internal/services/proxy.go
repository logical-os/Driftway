package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

type ProxyService struct {
	textServiceURL  string
	voiceServiceURL string
	httpClient      *http.Client
}

func NewProxyService(textURL, voiceURL string) *ProxyService {
	return &ProxyService{
		textServiceURL:  textURL,
		voiceServiceURL: voiceURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (s *ProxyService) ProxyToTextService(method, path string, body []byte, headers map[string]string) (*http.Response, error) {
	return s.proxyRequest(s.textServiceURL, method, path, body, headers)
}

func (s *ProxyService) ProxyToVoiceService(method, path string, body []byte, headers map[string]string) (*http.Response, error) {
	return s.proxyRequest(s.voiceServiceURL, method, path, body, headers)
}

func (s *ProxyService) proxyRequest(baseURL, method, path string, body []byte, headers map[string]string) (*http.Response, error) {
	// Construct full URL
	fullURL, err := url.JoinPath(baseURL, path)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}

	// Create request
	var bodyReader io.Reader
	if body != nil {
		bodyReader = bytes.NewReader(body)
	}

	req, err := http.NewRequest(method, fullURL, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add headers
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	// Set default content type if not provided
	if req.Header.Get("Content-Type") == "" && body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	// Make request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	return resp, nil
}

// Helper function to forward WebSocket connections
func (s *ProxyService) GetTextServiceWebSocketURL(path string) string {
	// Convert HTTP URL to WebSocket URL
	wsURL := s.textServiceURL
	if len(wsURL) > 4 && wsURL[:4] == "http" {
		wsURL = "ws" + wsURL[4:]
	}
	return wsURL + path
}

func (s *ProxyService) GetVoiceServiceWebSocketURL(path string) string {
	// Convert HTTP URL to WebSocket URL
	wsURL := s.voiceServiceURL
	if len(wsURL) > 4 && wsURL[:4] == "http" {
		wsURL = "ws" + wsURL[4:]
	}
	return wsURL + path
}

// Health check methods
func (s *ProxyService) CheckTextServiceHealth() error {
	resp, err := s.httpClient.Get(s.textServiceURL + "/health")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("text service unhealthy: status %d", resp.StatusCode)
	}

	return nil
}

func (s *ProxyService) CheckVoiceServiceHealth() error {
	resp, err := s.httpClient.Get(s.voiceServiceURL + "/health")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("voice service unhealthy: status %d", resp.StatusCode)
	}

	return nil
}

// Service discovery and load balancing could be added here
type ServiceInstance struct {
	URL    string `json:"url"`
	Health string `json:"health"`
	Load   int    `json:"load"`
}

func (s *ProxyService) GetHealthStatus() map[string]interface{} {
	status := make(map[string]interface{})

	// Check text service
	if err := s.CheckTextServiceHealth(); err != nil {
		status["text_service"] = map[string]interface{}{
			"status": "unhealthy",
			"error":  err.Error(),
		}
	} else {
		status["text_service"] = map[string]interface{}{
			"status": "healthy",
			"url":    s.textServiceURL,
		}
	}

	// Check voice service
	if err := s.CheckVoiceServiceHealth(); err != nil {
		status["voice_service"] = map[string]interface{}{
			"status": "unhealthy",
			"error":  err.Error(),
		}
	} else {
		status["voice_service"] = map[string]interface{}{
			"status": "healthy",
			"url":    s.voiceServiceURL,
		}
	}

	return status
}