package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// OSRMClient adalah HTTP client untuk berkomunikasi dengan OSRM routing engine.
// Dokumentasi OSRM API: http://project-osrm.org/docs/v5.5.1/api/
// TODO: implementasi GetRoute dan GetIsochrone
type OSRMClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewOSRMClient(baseURL string) *OSRMClient {
	return &OSRMClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// OSRMRouteResponse adalah struktur respons OSRM untuk endpoint /route/v1
// TODO: implementasi field sesuai OSRM API response
type OSRMRouteResponse struct {
	Code   string      `json:"code"`
	Routes interface{} `json:"routes"`
}

// GetRoute memanggil OSRM /route/v1/driving/{coords} untuk mendapatkan rute.
// TODO: implementasi
func (c *OSRMClient) GetRoute(ctx context.Context, originLat, originLng, destLat, destLng float64) (*OSRMRouteResponse, error) {
	// TODO: implementasi
	// url := fmt.Sprintf("%s/route/v1/foot/%f,%f;%f,%f?overview=full&geometries=geojson", ...)
	_ = ctx
	return nil, fmt.Errorf("belum diimplementasi")
}

// post adalah helper untuk HTTP POST ke OSRM.
func (c *OSRMClient) post(ctx context.Context, path string, body interface{}) ([]byte, error) {
	b, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OSRM error: status %d", resp.StatusCode)
	}

	var buf bytes.Buffer
	_, err = buf.ReadFrom(resp.Body)
	return buf.Bytes(), err
}
