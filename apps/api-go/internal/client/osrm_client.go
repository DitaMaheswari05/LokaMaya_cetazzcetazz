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
	if baseURL == "" || baseURL == "http://osrm:5000" {
		baseURL = "https://router.project-osrm.org"
	}
	return &OSRMClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 6 * time.Second,
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

// GetRoute memanggil OSRM driving profile untuk mendapatkan rute jaringan jalan riil perkotaan.
func (c *OSRMClient) GetRoute(ctx context.Context, originLat, originLng, destLat, destLng float64) (*OSRMRouteResponse, error) {
	return c.GetProfileRoute(ctx, "driving", originLat, originLng, destLat, destLng)
}

// GetFootRoute memanggil OSRM foot profile untuk rute pejalan kaki / pedestrian.
func (c *OSRMClient) GetFootRoute(ctx context.Context, originLat, originLng, destLat, destLng float64) (*OSRMRouteResponse, error) {
	return c.GetProfileRoute(ctx, "foot", originLat, originLng, destLat, destLng)
}

// GetProfileRoute memanggil OSRM dengan profil tertentu ('driving' atau 'foot')
// dengan fallback otomatis ke router public OSM jika baseURL lokal offline.
func (c *OSRMClient) GetProfileRoute(ctx context.Context, profile string, originLat, originLng, destLat, destLng float64) (*OSRMRouteResponse, error) {
	if profile == "" {
		profile = "driving"
	}

	urls := []string{
		fmt.Sprintf("%s/route/v1/%s/%f,%f;%f,%f?overview=full&geometries=geojson",
			c.baseURL, profile, originLng, originLat, destLng, destLat),
	}
	if c.baseURL != "https://router.project-osrm.org" {
		urls = append(urls, fmt.Sprintf("https://router.project-osrm.org/route/v1/%s/%f,%f;%f,%f?overview=full&geometries=geojson",
			profile, originLng, originLat, destLng, destLat))
	}

	var lastErr error
	for _, targetURL := range urls {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, targetURL, nil)
		if err != nil {
			lastErr = err
			continue
		}
		req.Header.Set("User-Agent", "LokaMaya-Transit/1.0 (Jakarta Urban Planning Platform)")

		resp, err := c.httpClient.Do(req)
		if err != nil {
			lastErr = err
			continue
		}
		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			lastErr = fmt.Errorf("OSRM status %d", resp.StatusCode)
			continue
		}

		var result OSRMRouteResponse
		decodeErr := json.NewDecoder(resp.Body).Decode(&result)
		resp.Body.Close()
		if decodeErr != nil {
			lastErr = decodeErr
			continue
		}

		if result.Code == "Ok" && len(result.Routes) > 0 && len(result.Routes[0].Geometry.Coordinates) > 1 {
			return &result, nil
		}
	}

	return nil, lastErr
}

// OSRMNearestResponse adalah respons OSRM untuk endpoint /nearest/v1.
type OSRMNearestResponse struct {
	Code      string `json:"code"`
	Waypoints []struct {
		Location []float64 `json:"location"` // [lng, lat]
		Name     string    `json:"name"`
		Distance float64   `json:"distance"` // meter
	} `json:"waypoints"`
}

// GetNearest mencari titik sumbu jalan drivable terdekat beserta nama jalan resminya.
func (c *OSRMClient) GetNearest(ctx context.Context, lat, lng float64) (float64, float64, string, float64, error) {
	urls := []string{
		fmt.Sprintf("%s/nearest/v1/driving/%f,%f", c.baseURL, lng, lat),
	}
	if c.baseURL != "https://router.project-osrm.org" {
		urls = append(urls, fmt.Sprintf("https://router.project-osrm.org/nearest/v1/driving/%f,%f", lng, lat))
	}

	var lastErr error
	for _, targetURL := range urls {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, targetURL, nil)
		if err != nil {
			lastErr = err
			continue
		}
		req.Header.Set("User-Agent", "LokaMaya-Transit/1.0 (Jakarta Urban Planning Platform)")

		resp, err := c.httpClient.Do(req)
		if err != nil {
			lastErr = err
			continue
		}
		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			lastErr = fmt.Errorf("OSRM nearest status %d", resp.StatusCode)
			continue
		}

		var result OSRMNearestResponse
		decodeErr := json.NewDecoder(resp.Body).Decode(&result)
		resp.Body.Close()
		if decodeErr != nil {
			lastErr = decodeErr
			continue
		}

		if result.Code == "Ok" && len(result.Waypoints) > 0 {
			wp := result.Waypoints[0]
			if len(wp.Location) >= 2 {
				return wp.Location[1], wp.Location[0], wp.Name, wp.Distance, nil
			}
		}
	}

	return 0, 0, "", 0, lastErr
}

