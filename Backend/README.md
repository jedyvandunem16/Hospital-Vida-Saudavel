
# 🏥 Hospital Vida Saudável — Backend API

Backend REST completo em **Node.js + Express + MySQL** para o Hospital Vida Saudável, Luanda.

---

## 📁 Estrutura do Projecto

```
hospital-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Conexão MySQL (pool)
│   │   └── setupDatabase.js     # Cria tabelas + dados iniciais
│   ├── controllers/
│   │   ├── authController.js        # Login, utilizadores
│   │   ├── medicosController.js     # CRUD médicos + disponibilidade
│   │   ├── consultasController.js   # Marcações + dashboard
│   │   ├── pacientesController.js   # Gestão de pacientes
│   │   ├── mensagensController.js   # Formulário de contacto
│   │   └── especialidadesController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT autenticar + autorizar
│   │   └── validators.js        # express-validator + error handler
│   ├── routes/
│   │   └── index.js             # Todas as rotas
│   ├── utils/
│   │   └── email.js             # Nodemailer (confirmações)
│   └── server.js                # Entry point
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Instalação e Arranque

### 1. Pré-requisitos
- Node.js 18+
- MySQL 8+

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Editar .env com os teus dados MySQL e email
```

### 4. Criar base de dados e tabelas
```bash
npm run db:setup
```
> Isto cria a base de dados, todas as tabelas, especialidades, médicos de exemplo e o utilizador admin.

### 5. Iniciar o servidor

**Desenvolvimento** (com auto-reload):
```bash
npm run dev
# Requer: npm install -g nodemon
```

**Produção:**
```bash
npm start
```

O servidor arranca em: `http://localhost:3000`

---

## 🔑 Autenticação

A API usa **JWT (Bearer Token)**.

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@vidasaudavel.co.ao",
  "password": "Admin@123456"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "utilizador": { "id": 1, "nome": "Administrador", "role": "admin" }
}
```

Usar o token nos pedidos autenticados:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 📡 Endpoints da API

### 🔐 Auth
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/api/auth/login` | Público | Login |
| GET | `/api/auth/me` | Autenticado | Dados do utilizador actual |
| PUT | `/api/auth/password` | Autenticado | Alterar password |
| POST | `/api/auth/utilizadores` | Admin | Criar utilizador |

### 🏥 Especialidades
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/api/especialidades` | Público | Listar especialidades |
| POST | `/api/especialidades` | Admin | Criar especialidade |

### 👨‍⚕️ Médicos
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/api/medicos` | Público | Listar médicos (`?especialidade=Cardiologia`) |
| GET | `/api/medicos/:id` | Público | Detalhe + disponibilidade semanal |
| GET | `/api/medicos/:id/disponibilidade?data=YYYY-MM-DD` | Público | Slots livres numa data |
| POST | `/api/medicos` | Admin | Criar médico |
| PUT | `/api/medicos/:id` | Admin | Atualizar médico |
| DELETE | `/api/medicos/:id` | Admin | Desativar médico |

### 📅 Consultas
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/api/consultas` | Público | Marcar consulta online |
| GET | `/api/consultas` | Autenticado | Listar (`?estado=&medico_id=&data_inicio=`) |
| GET | `/api/consultas/dashboard` | Admin/Recepção | Estatísticas |
| GET | `/api/consultas/:id` | Autenticado | Detalhe |
| PATCH | `/api/consultas/:id/estado` | Autenticado | Atualizar estado |
| DELETE | `/api/consultas/:id` | Admin/Recepção | Cancelar |

### 👥 Pacientes
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/api/pacientes` | Autenticado | Listar (`?q=pesquisa`) |
| GET | `/api/pacientes/:id` | Autenticado | Detalhe + histórico |
| POST | `/api/pacientes` | Autenticado | Criar paciente |
| PUT | `/api/pacientes/:id` | Autenticado | Atualizar |

### ✉️ Mensagens
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/api/mensagens` | Público | Enviar mensagem de contacto |
| GET | `/api/mensagens` | Admin/Recepção | Listar mensagens |
| PATCH | `/api/mensagens/:id/lida` | Admin/Recepção | Marcar como lida |

---

## 📖 Exemplos de Uso

### Marcar consulta (do frontend)
```javascript
const response = await fetch('http://localhost:3000/api/consultas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paciente_nome: 'Maria Silva',
    paciente_email: 'maria@email.com',
    paciente_telefone: '+244 900 111 222',
    medico_id: 1,
    especialidade_id: 1,
    data_hora: '2026-04-15T09:00:00',
    tipo: 'presencial',
    motivo: 'Dor no peito'
  })
});
const data = await response.json();
// { id: 42, mensagem: 'Consulta agendada com sucesso!' }
```

### Ver slots disponíveis
```javascript
const res = await fetch('/api/medicos/1/disponibilidade?data=2026-04-15');
const data = await res.json();
// { data: '2026-04-15', horarios: [{ hora: '08:00', disponivel: true }, ...] }
```

---

## 🔒 Roles de Utilizador

| Role | Permissões |
|------|-----------|
| `admin` | Acesso total |
| `medico` | Ver/atualizar as suas consultas |
| `recepcao` | Gerir consultas e pacientes, ver mensagens |

---

## 🌐 Variáveis de Ambiente (.env)

```env
PORT=
NODE_ENV=

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=
JWT_EXPIRES_IN=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=

FRONTEND_URL=
```

---

## 🏗️ Deploy em Produção

**Opção recomendada: Railway.app**
1. Criar conta em [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Adicionar serviço MySQL no mesmo projecto
4. Configurar variáveis de ambiente no dashboard
5. Railway detecta automaticamente o Node.js e faz deploy

**Alternativas gratuitas:** Render.com, Fly.io
