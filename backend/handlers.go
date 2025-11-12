package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

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
	existing.Description = in.Description
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
