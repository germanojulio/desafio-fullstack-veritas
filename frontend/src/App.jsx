import React, { useEffect, useState } from "react";
import { listTasks, createTask, updateTask, deleteTask } from "./api";

const ORDER = ["todo", "in_progress", "done"];

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draggingTask, setDraggingTask] = useState(null);

  async function loadTasks() {
    try {
      setError("");
      setLoading(true);
      const data = await listTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message || "Erro ao carregar tarefas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) {
      alert("Título é obrigatório");
      return;
    }
    try {
      setLoading(true);
      await createTask({
        title: title.trim(),
        description,
        status: "todo",
      });
      setTitle("");
      setDescription("");
      await loadTasks();
    } catch (err) {
      alert(err.message || "Erro ao criar tarefa");
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(task, direction) {
    const index = ORDER.indexOf(task.status);
    if (index === -1) return;

    const nextIndex = direction === "left" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= ORDER.length) return;

    const nextStatus = ORDER[nextIndex];

    try {
      await updateTask(task.id, {
        status: nextStatus,
        title: task.title,
        description: task.description || "",
      });
      await loadTasks();
    } catch (err) {
      alert(err.message || "Erro ao mover tarefa");
    } 
  }

  async function handleDrop(targetStatus) {
    if (!draggingTask) return;

    if (draggingTask.status === targetStatus) {
      setDraggingTask(null);
      return;
    }

    try {
      await updateTask(draggingTask.id, {
        status: targetStatus,
        title: draggingTask.title,
        description: draggingTask.description || "",
      });
      await loadTasks();
    } catch (err) {
      alert(err.message || "Erro ao mover tarefa");
    } finally {
      setDraggingTask(null);
    }
  }

  function handleDragStart(task) {
    setDraggingTask(task);
  }

  function handleDragEnd() {
    setDraggingTask(null);
  }

  async function handleEdit(task) {
    const newTitle = window.prompt("Novo título:", task.title);
    if (newTitle === null) return;
    if (!newTitle.trim()) {
      alert("Título não pode ser vazio");
      return;
    }
    const newDescription = window.prompt(
      "Nova descrição (opcional):",
      task.description || ""
    );
    if (newDescription === null) return;

    try {
      await updateTask(task.id, {
        title: newTitle.trim(),
        description: newDescription,
      });
      await loadTasks();
    } catch (err) {
      alert(err.message || "Erro ao editar tarefa");
    }
  }

  async function handleDelete(task) {
    const ok = window.confirm("Tem certeza que deseja excluir esta tarefa?");
    if (!ok) return;
    try {
      await deleteTask(task.id);
      await loadTasks();
    } catch (err) {
      alert(err.message || "Erro ao excluir tarefa");
    }
  }

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "sans-serif",
        background: "#e5e7eb",
        minHeight: "100vh",
        color: "#111827",
      }}
    >
      <h1 style={{ marginBottom: "4px" }}>Mini Kanban</h1>
      <p>Este é o quadro com 3 colunas: A Fazer, Em Progresso e Concluídas.</p>

      <form
        onSubmit={handleCreate}
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 3fr auto",
          gap: "8px",
          marginTop: "16px",
          marginBottom: "16px",
        }}
      >
        <input
          placeholder="Título da tarefa"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            background: "#f9fafb",
          }}
        />
        <input
          placeholder="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            background: "#f9fafb",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "none",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          {loading ? "Salvando..." : "Adicionar"}
        </button>
      </form>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#7f1d1d",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "8px",
            marginBottom: "12px",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          marginTop: "8px",
        }}
      >
        <Column
          title="A Fazer"
          status="todo"
          tasks={todoTasks}
          onMove={handleMove}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDragStartTask={handleDragStart}
          onDropStatus={handleDrop}
          onDragEndTask={handleDragEnd}
        />
        <Column
          title="Em Progresso"
          status="in_progress"
          tasks={inProgressTasks}
          onMove={handleMove}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDragStartTask={handleDragStart}
          onDropStatus={handleDrop}
          onDragEndTask={handleDragEnd}
        />
        <Column
          title="Concluídas"
          status="done"
          tasks={doneTasks}
          onMove={handleMove}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDragStartTask={handleDragStart}
          onDropStatus={handleDrop}
          onDragEndTask={handleDragEnd}
        />
      </div>
    </div>
  );
}

function Column({
  title,
  status,
  tasks,
  onMove,
  onEdit,
  onDelete,
  onDragStartTask,
  onDropStatus,
  onDragEndTask,
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "8px",
        padding: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        minHeight: "140px",
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDropStatus(status)}
    >
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {tasks.map((task) => (
        <div
          key={task.id}
          draggable
          onDragStart={() => onDragStartTask(task)}
          onDragEnd={onDragEndTask}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "8px",
            marginBottom: "8px",
            background: "#f9fafb",
          }}
        >
          <strong>{task.title}</strong>
          {task.description && (
            <p style={{ margin: "4px 0" }}>{task.description}</p>
          )}
          <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
            <button
              onClick={() => onMove(task, "left")}
              disabled={task.status === "todo"}
              style={{
                flex: 1,
                padding: "4px 6px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: task.status === "todo" ? "not-allowed" : "pointer",
              }}
            >
              ←
            </button>
            <button
              onClick={() => onMove(task, "right")}
              disabled={task.status === "done"}
              style={{
                flex: 1,
                padding: "4px 6px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: task.status === "done" ? "not-allowed" : "pointer",
              }}
            >
              →
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginTop: "4px",
            }}
          >
            <button
              onClick={() => onEdit(task)}
              style={{
                flex: 1,
                padding: "4px 6px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                background: "#e0f2fe",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(task)}
              style={{
                flex: 1,
                padding: "4px 6px",
                borderRadius: "6px",
                border: "1px solid #fecaca",
                background: "#fee2e2",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
