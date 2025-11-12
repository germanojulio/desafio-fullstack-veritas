package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
)

type Task struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

const (
	StatusTodo       = "todo"
	StatusInProgress = "in_progress"
	StatusDone       = "done"
)

var (
	mu     sync.Mutex
	tasks  = map[int64]*Task{}
	nextID int64 = 1
)

func isValidStatus(s string) bool {
	switch s {
	case StatusTodo, StatusInProgress, StatusDone:
		return true
	default:
		return false
	}
}


func listTasksHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.NotFound(w, r)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	list := make([]*Task, 0, len(tasks))
	for _, t := range tasks {
		copy := *t
		list = append(list, &copy)
	}

	writeJSON(w, http.StatusOK, list)
}

func createTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.NotFound(w, r)
		return
	}

	var in Task
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}
	defer r.Body.Close()

	if strings.TrimSpace(in.Title) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title é obrigatório"})
		return
	}

	if in.Status == "" {
		in.Status = StatusTodo
	}

	if !isValidStatus(in.Status) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "status inválido"})
		return
	}

	mu.Lock()
	in.ID = nextID
	nextID++
	copy := in
	tasks[in.ID] = &copy
	mu.Unlock()

	writeJSON(w, http.StatusCreated, in)
}

func updateTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.NotFound(w, r)
		return
	}

	id, ok := parseID(r.URL.Path)
	if !ok {
		http.NotFound(w, r)
		return
	}

	var in Task
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON inválido"})
		return
	}
	defer r.Body.Close()

	mu.Lock()
	defer mu.Unlock()

	existing, found := tasks[id]
	if !found {
		http.NotFound(w, r)
		return
	}

	if strings.TrimSpace(in.Title) != "" {
		existing.Title = in.Title
	}

	if in.Description != "" || in.Description == "" {
		existing.Description = in.Description
	}

	if in.Status != "" {
		if !isValidStatus(in.Status) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "status inválido"})
			return
		}
		existing.Status = in.Status
	}

	writeJSON(w, http.StatusOK, existing)
}

func deleteTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.NotFound(w, r)
		return
	}

	id, ok := parseID(r.URL.Path)
	if !ok {
		http.NotFound(w, r)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	if _, found := tasks[id]; !found {
		http.NotFound(w, r)
		return
	}

	delete(tasks, id)
	w.WriteHeader(http.StatusNoContent)
}

func parseID(path string) (int64, bool) {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) != 2 || parts[0] != "tasks" {
		return 0, false
	}
	id, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return 0, false
	}
	return id, true
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}


func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/tasks", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			listTasksHandler(w, r)
		case http.MethodPost:
			createTaskHandler(w, r)
		default:
			http.NotFound(w, r)
		}
	})

	mux.HandleFunc("/tasks/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			updateTaskHandler(w, r)
		case http.MethodDelete:
			deleteTaskHandler(w, r)
		default:
			http.NotFound(w, r)
		}
	})

	handler := withCORS(mux)

	addr := ":8080"
	log.Println("Backend ouvindo em", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}
