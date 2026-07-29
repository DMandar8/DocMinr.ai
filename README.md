<div align="center">

# 🚀 DocMinr.ai

### Enterprise Knowledge Intelligence Platform

Transform unstructured documents into intelligent, searchable knowledge using **Retrieval-Augmented Generation (RAG)**, **Semantic Search**, and **Agentic AI**.

---

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active%20Development-3b82f6?style=for-the-badge)](https://github.com/DMandar8/DocMinr.ai)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-Framework-success?style=for-the-badge)
![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_AI-orange?style=for-the-badge)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector_Database-DC244C?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)


---

**Build AI-powered enterprise knowledge systems instead of simple document chatbots.**

</div>

---

# 📖 Overview

Modern organizations generate an enormous amount of knowledge every day.

- Technical documentation
- SOPs
- Contracts
- Research papers
- Product manuals
- Client documents
- Internal wikis
- Meeting notes
- Reports

Unfortunately, most of this knowledge remains **unstructured**, **fragmented**, and **difficult to retrieve**.

Traditional keyword search often fails because it cannot understand context or meaning, while Large Language Models cannot directly reason over thousands of enterprise documents without an efficient retrieval mechanism.

**DocMinr.ai** bridges this gap by transforming document collections into intelligent knowledge bases powered by Retrieval-Augmented Generation (RAG), semantic search, vector embeddings, and agentic AI workflows.

Instead of simply answering questions, DocMinr.ai provides the foundation for building enterprise AI applications that can search, reason, automate workflows, and assist teams using organizational knowledge.

---

# 🎯 Vision

Our vision is to build a platform where organizations can securely transform their documents into living knowledge systems.

Rather than functioning as another "Chat with PDF" application, DocMinr.ai aims to become an **Enterprise Knowledge Intelligence Platform** capable of:

- Intelligent document retrieval
- Enterprise search
- AI-assisted knowledge discovery
- Context-aware question answering
- Multi-agent workflows
- Knowledge automation
- Internal AI assistants
- Organizational memory

---

# ❓ Why DocMinr.ai?

Many RAG projects stop after implementing:

```
PDF
↓

Embeddings
↓

Vector DB
↓

Chatbot
```

While this demonstrates the concept, real-world enterprise systems require significantly more.

DocMinr.ai focuses on solving challenges encountered in production environments:

- Multiple knowledge bases
- Large-scale document ingestion
- Metadata management
- Enterprise authentication
- Microservice architecture
- Configurable chunking strategies
- Agentic workflows
- Long-term maintainability
- Scalable deployment

The objective is not simply to build a chatbot, but to engineer a reusable platform for AI-powered enterprise applications.

---

# ✨ Core Features

## 📄 Document Intelligence

- PDF document ingestion
- DOCX support
- TXT support
- ZIP archive upload
- Recursive folder processing
- Metadata extraction
- Duplicate detection *(planned)*
- OCR support *(planned)*

---

## 🧠 AI Pipeline

- Recursive chunking
- Semantic chunking
- Configurable chunk sizes
- Embedding generation
- Vector indexing
- Retrieval-Augmented Generation (RAG)
- Prompt orchestration
- Context optimization

---

## 🤖 Agentic AI

- Planner Agent *(planned)*
- Retriever Agent
- Validator Agent *(planned)*
- Generator Agent
- Reflection Agent *(planned)*
- Memory-aware conversations *(planned)*

---

## 🏢 Enterprise Features

- JWT Authentication
- Role-Based Access Control
- Knowledge Base Management
- REST APIs
- Docker deployment
- Microservice architecture
- Environment-based configuration
- Scalable backend design

---

# 🏗 Architecture Overview

```text
                      User
                        │
                        ▼
                React Frontend
                        │
                        ▼
              Node.js Backend API
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
 Authentication                 Knowledge Service
                                        │
                                        ▼
                              FastAPI AI Service
                                        │
              ┌─────────────────────────┴────────────────────────┐
              │                                                  │
              ▼                                                  ▼
     Document Processing                                Query Processing
              │                                                  │
              ▼                                                  ▼
        Chunk Generation                               Query Embedding
              │                                                  │
              ▼                                                  ▼
      Embedding Model                                   Vector Search
              │                                                  │
              └──────────────► Qdrant ◄──────────────────────────┘
                                        │
                                        ▼
                                  Context Builder
                                        │
                                        ▼
                                 Language Model
                                        │
                                        ▼
                                AI Generated Response
```

---

# 🧩 Design Principles

DocMinr.ai follows several engineering principles:

### Modular

Each service has a single responsibility.

### Scalable

Components should be replaceable without rewriting the platform.

### Production-Oriented

Architecture prioritizes maintainability over quick demos.

### Cloud Ready

Designed to run locally, in Docker, or on cloud infrastructure.

### Framework Agnostic

LLMs, embedding providers, and vector databases should be interchangeable.

### Enterprise Friendly

Authentication, authorization, metadata, observability, and extensibility are treated as first-class citizens.

---

# 🚀 Current Status

| Module | Status |
|----------|----------|
| Authentication | ✅ Complete |
| Knowledge Bases | ✅ Complete |
| Document Upload | ✅ Complete |
| PDF Parsing | ✅ Complete |
| DOCX Parsing | ✅ Complete |
| TXT Parsing | ✅ Complete |
| Recursive Chunking | ✅ Complete |
| Semantic Chunking | 🚧 In Progress |
| Embedding Pipeline | ✅ Complete |
| Qdrant Integration | ✅ Complete |
| RAG Pipeline | ✅ Complete |
| LangGraph Agents | 🚧 In Progress |
| Memory System | 🚧 Planned |
| AWS Deployment | 🚧 Planned |

---

# 🏗 Project Structure

The project follows a modular microservice architecture to separate concerns between the frontend, backend, and AI workloads.

```
DocMinr.ai
│
├── frontend/                  # React application
│
├── backend/                   # Node.js + Express API
│   ├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   └── config/
│
├── ai-service/                # FastAPI AI Engine
│   ├── app/
│   ├── chunking/
│   ├── embeddings/
│   ├── retriever/
│   ├── agents/
│   ├── memory/
│   ├── prompts/
│   └── models/
│
├── docker/
│
├── docs/
│
├── README.md
├── LICENSE
├── CHANGELOG.md
└── ROADMAP.md
```

---

# ⚙ Technology Stack

## Frontend

| Technology | Purpose |
|------------|---------|
| React | User Interface |
| Tailwind CSS | Styling |
| React Router | Routing |
| Axios | API Communication |

---

## Backend

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | REST APIs |
| JWT | Authentication |
| Multer | File Upload |
| MySQL | Metadata Storage |

---

## AI Service

| Technology | Purpose |
|------------|---------|
| Python | AI Runtime |
| FastAPI | AI APIs |
| LangChain | RAG Framework |
| LangGraph | Agentic Workflows |
| Pydantic | Data Validation |

---

## AI Models

| Component | Purpose |
|-----------|---------|
| Embedding Model | Vector Embeddings |
| LLM | Response Generation |
| Prompt Templates | Context Engineering |

> The platform is provider-agnostic and is designed to support OpenAI, Ollama, Anthropic, Gemini, or other compatible models.

---

## Databases

| Technology | Purpose |
|------------|---------|
| MySQL | Metadata |
| Qdrant | Vector Database |
| MongoDB *(planned)* | Long-Term Memory |

---

## DevOps

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local Orchestration |
| GitHub | Version Control |

---

# 🚀 Getting Started

## Prerequisites

Before running DocMinr.ai, ensure the following are installed:

- Node.js 20+
- Python 3.11+
- Docker Desktop
- MySQL
- Qdrant
- Git

---

## Clone Repository

```bash
git clone https://github.com/DMandar8/docminr-ai.git

cd docminr-ai
```

---

## Backend Setup

```bash
cd backend

npm install

npm run dev
```

---

## AI Service Setup

```bash
cd ai-service

python -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# 🐳 Running with Docker

The recommended way to run DocMinr.ai locally is through Docker.

```bash
docker compose up --build
```

This starts:

- Frontend
- Backend
- AI Service
- MySQL
- Qdrant

Once all services are healthy, open:

```
http://localhost:5173
```

---

## Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update the values in `.env` as needed before running the application.

> **Note:** Never commit your `.env` file. It may contain secrets such as API keys and database credentials.

---

AI Service

```env
OPENAI_API_KEY=

QDRANT_URL=

QDRANT_COLLECTION=

EMBEDDING_MODEL=

CHAT_MODEL=
```

---

# 🔄 Request Lifecycle

A typical request follows this flow:

```
User

↓

Frontend

↓

Node Backend

↓

FastAPI AI Service

↓

Embedding

↓

Qdrant Retrieval

↓

Prompt Construction

↓

Language Model

↓

Response

↓

Frontend
```

---

# 📡 REST APIs

## Authentication

```
POST /auth/register

POST /auth/login

POST /auth/logout

POST /auth/refresh
```

---

## Knowledge Bases

```
GET /knowledge-bases

POST /knowledge-bases

PUT /knowledge-bases/:id

DELETE /knowledge-bases/:id
```

---

## Documents

```
POST /documents/upload

POST /documents/upload-zip

GET /documents

DELETE /documents/:id
```

---

## AI

```
POST /chat

POST /search

POST /embeddings

POST /rerank
```

---

# 📈 Performance Goals

The project is designed with the following engineering objectives:

| Goal | Target |
|------|---------|
| Authentication | <100ms |
| Metadata APIs | <200ms |
| Vector Search | <500ms |
| Chat Response | 2–6 seconds |
| Chunk Processing | Async |
| Uploads | Up to 500MB |

---

# 🔐 Security

Security is considered a core design principle.

Current protections include:

- JWT Authentication
- Password Hashing
- HTTP-only Cookies
- Input Validation
- Request Validation
- Secure File Upload
- Environment-based Secrets

Future enhancements:

- Rate Limiting
- Audit Logs
- RBAC
- OAuth
- SSO
- Encryption at Rest

---

# 🛣 Roadmap

## Phase 1

- Authentication
- Knowledge Bases
- Upload Pipeline
- RAG
- Docker

---

## Phase 2

- LangGraph Agents
- Memory
- Prompt Templates
- Semantic Chunking

---

## Phase 3

- Hybrid Search
- OCR
- Multi-modal Documents
- Citations
- Streaming Responses

---

## Phase 4

- AWS Deployment
- Kubernetes
- Monitoring
- CI/CD
- Team Collaboration

---

# 🤝 Contributing

Contributions are welcome.

Please read:

- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- SECURITY.md

before opening issues or pull requests.

---

# 📜 License

This project is licensed under the MIT License.

See the LICENSE file for details.

---

# 💡 Engineering Philosophy

DocMinr.ai is not intended to be another "chat with PDF" demo.

It is being built as an extensible AI platform where retrieval, reasoning, and automation work together to create intelligent enterprise applications.

Every architectural decision is made with scalability, maintainability, and production-readiness in mind.

---

<div align="center">

## ⭐ Support the Project

If you find this repository useful, consider giving it a ⭐.

It motivates continued development and helps others discover the project.

---

Built with ❤️ by **Mandar Deshmukh**

</div>
