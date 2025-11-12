const API_URL = "http://localhost:8080";

export async function listTasks() {
  const res = await fetch(`${API_URL}/tasks`);
  if (!res.ok) {
    throw new Error("Erro ao listar tarefas");
  }
  return res.json();
}

export async function createTask(task) {
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  if (!res.ok) {
    throw new Error("Erro ao criar tarefa");
  }
  return res.json();
}

export async function updateTask(id, patch) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error("Erro ao atualizar tarefa");
  }
  return res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Erro ao excluir tarefa");
  }
}
