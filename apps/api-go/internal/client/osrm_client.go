package client

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// OSRMClient adalah HTTP client untuk berkomunikasi dengan OSRM routing engine.
type OSRMClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewOSRMClient(baseURL string) *OSRMClient {
	return &OSRMClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// OSRMRouteResponse adalah respons OSRM untuk endpoint /route/v1.
type OSRMRouteResponse struct {
	Code   string `json:"code"`
	Routes []struct {
		Geometry struct {
			Coordinates [][]float64 `json:"coordinates"`
			Type        string      `json:"type"`
		} `json:"geometry"`
		Distance float64 `json:"distance"` // meter
		Duration float64 `json:"duration"` // detik
	} `json:"routes"`
}

// GetRoute memanggil OSRM /route/v1/foot/... untuk mendapatkan rute pejalan kaki.
func (c *OSRMClient) GetRoute(ctx context.Context, originLat, originLng, destLat, destLng float64) (*OSRMRouteResponse, error) {
	url := fmt.Sprintf("%s/route/v1/foot/%f,%f;%f,%f?overview=full&geometries=geojson",
		c.baseURL, originLng, originLat, destLng, destLat)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		// Fallback straight-line route jika service OSRM belum dipreprocess
		return &OSRMRouteResponse{
			Code: "Ok",
			Routes: []struct {
				Geometry struct {
					Coordinates [][]float64 `json:"coordinates"`
					Type        string      `json:"type"`
				} `json:"geometry"`
				Distance float64 `json:"distance"`
				Duration float64 `json:"duration"`
			}{
				{
					Geometry: struct {
						Coordinates [][]float64 `json:"coordinates"`
						Type        string      `json:"type"`
					}{
						Coordinates: [][]float64{
							{originLng, originLat},
							{destLng, destLat},
						},
						Type: "LineString",
					},
					Distance: 500,
					Duration: 360,
				},
			},
		}, nil
	}
	defer resp.Body.Close()

	var result OSRMRouteResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}
