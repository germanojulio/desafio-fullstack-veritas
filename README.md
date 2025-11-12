Desafio FullStack Veritas

Mini Kanban de tarefas com React no frontend e Go no backend.

O usuario consegue:
- Criar tarefas com titulo (obrigatório) e descrição (opcional).
- Visualizar as tarefas em 3 colunas fixas: **A Fazer**, **Em Progresso** e **Concluidas**.
- Mover tarefas entre as colunas.
- Editar título e descrição.
- Excluir tarefas.

Os dados sao armazenados em memória no backend Go, conforme o escopo mínimo do desafio.

---

Tecnologias utilizadas

- Frontend: React + Vite + JavaScript
- Backend: Go (net/http, armazenamento em memória)
- Comunicação: API REST (`/tasks`)
- Documentação: Diagramas em Mermaid (User Flow e Data Flow)

---

Como rodar o backend

Requisitos: Go instalado.

```bash
cd backend
go run *.go
O backend sobe em:

http://localhost:8080

Endpoints principais:

GET /tasks — lista todas as tarefas

POST /tasks — cria tarefa

PUT /tasks/:id — atualiza tarefa (título, descricao e/ou status)

DELETE /tasks/:id — remove tarefa

Validacoes basicas:

title obrigatório (não pode ser vazio).

status precisa ser um de: "todo", "in_progress", "done".

Armazenamento:

As tarefas ficam em memoria em um map[int64]*Task.

Ao reiniciar o servidor, as tarefas são perdidas (comportamento esperado para o MVP).

Como rodar o frontend
Requisitos: Node.js e npm instalados.

bash
cd frontend
npm install
npm run dev
O frontend abre em:

http://localhost:5173

Por padrão, o frontend consome a API em:

http://localhost:8080

Se quiser mudar a URL da API, altere o arquivo src/api.js.

Fluxo do usuário (User Flow)
Fluxo basico:

Usuario abre o Mini Kanban.

O frontend chama GET /tasks para carregar as tarefas.

Usuario preenche título e descrição opcional e clica em Adicionar.

O frontend envia POST /tasks com status: "todo".

O backend valida e guarda a tarefa na memória.

O frontend recarrega com GET /tasks e mostra a tarefa em A Fazer.

Usuário pode:

Mover a tarefa entre colunas (botões de mover ou arrastar e soltar) → PUT /tasks/:id com novo status.

Editar título e descrição → PUT /tasks/:id.

Excluir tarefa → DELETE /tasks/:id.

O arquivo /docs/user-flow.png mostra esse fluxo em forma de diagrama.

Fluxo de dados (Data Flow)
O arquivo /docs/data-flow.png mostra como:

o usuário interage com o frontend,

o frontend chama a API Go,

a API salva e lê dados da memória,

e devolve as respostas para o frontend atualizar o quadro.

Limitações e melhorias futuras

Limitações atuais:
Dados não são persistidos em banco nem arquivo; se reiniciar o backend, as tarefas somem.
Não há autenticação nem controle de usuários.
A edição usa window.prompt, que é simples mas pouco amigavel.
Não há testes automatizados.

Possíveis melhorias:
Persistir tarefas em um arquivo JSON ou banco de dados.
Melhorar a experiência de arrastar e soltar com uma biblioteca específica de drag and drop.
Adicionar testes (unitários no Go e testes de componentes no React).
Melhorar UI/UX com uma biblioteca de componentes e layout responsivo.
Adicionar filtros, busca e prioridades nas tarefcdas.