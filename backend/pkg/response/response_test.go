package response_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/slowsocial/backend/pkg/response"
)

func TestJSONResponse(t *testing.T) {
	w := httptest.NewRecorder()
	data := map[string]string{"status": "ok"}

	response.JSON(w, http.StatusOK, data)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	contentType := w.Header().Get("Content-Type")
	if contentType != "application/json; charset=utf-8" {
		t.Fatalf("expected application/json header, got %s", contentType)
	}

	var res map[string]string
	if err := json.NewDecoder(w.Body).Decode(&res); err != nil {
		t.Fatalf("failed to decode json body: %v", err)
	}

	if res["status"] != "ok" {
		t.Fatalf("expected status 'ok', got '%s'", res["status"])
	}
}

func TestSuccessResponse(t *testing.T) {
	w := httptest.NewRecorder()
	response.Success(w, http.StatusCreated, "item criado", map[string]int{"id": 42})

	if w.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", w.Code)
	}

	var res response.APIResponse
	if err := json.NewDecoder(w.Body).Decode(&res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if !res.Success {
		t.Fatal("expected success true")
	}
	if res.Message != "item criado" {
		t.Fatalf("expected message 'item criado', got '%s'", res.Message)
	}
}

func TestErrorResponses(t *testing.T) {
	tests := []struct {
		name       string
		fn         func(http.ResponseWriter, string)
		expected   int
		errMessage string
	}{
		{"BadRequest", response.BadRequest, http.StatusBadRequest, "invalid request"},
		{"Unauthorized", response.Unauthorized, http.StatusUnauthorized, "token expired"},
		{"NotFound", response.NotFound, http.StatusNotFound, "not found"},
		{"InternalServerError", response.InternalServerError, http.StatusInternalServerError, "db error"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			tc.fn(w, tc.errMessage)

			if w.Code != tc.expected {
				t.Fatalf("expected status %d, got %d", tc.expected, w.Code)
			}

			var res response.APIResponse
			if err := json.NewDecoder(w.Body).Decode(&res); err != nil {
				t.Fatalf("failed to decode json: %v", err)
			}

			if res.Success {
				t.Fatal("expected success to be false")
			}
			if res.Error != tc.errMessage {
				t.Fatalf("expected error message '%s', got '%s'", tc.errMessage, res.Error)
			}
		})
	}
}
