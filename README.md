# Azure DevOps Test Case Generator

This project automates the generation of test cases for Azure DevOps work items using a Retrieval-Augmented Generation (RAG) system with a local LLM (Ollama) and a ChromaDB vector database. It fetches work item details, finds relevant information using embeddings, and generates detailed test cases, exporting them to an Excel file.

## Features

- **Automated Test Case Generation**: Generates comprehensive test cases (including positive, negative, and edge cases) based on Azure DevOps work items.
- **RAG System**: Uses `sentence-transformers` for embeddings and `ChromaDB` for vector storage to retrieve the most relevant work item data.
- **Ollama Integration**: Leverages a local LLM (e.g., Llama 3) via the Ollama client for text generation.
- **Credential Management**: Securely handles Azure DevOps credentials using a `.env` file.
- **Excel Export**: Exports the generated test cases into a structured Excel spreadsheet.

## Prerequisites

- **Python 3.8+**
- **Ollama**: Make sure you have Ollama installed and a model (e.g., `llama3`) running locally. You can download Ollama from the [official website](https://ollama.com/).
- **Azure DevOps Personal Access Token (PAT)**: A PAT with read access to work items is required.

## Setup Instructions

Follow these steps to set up and run the project.

### 1. Clone the repository

```bash
git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
cd your-repository-name

```


### 2. Follow this to run the project ( How to Run this project )

- **1.Create a virtual environment**

```bash 

python3 -m venv venv

```

- **2.Activate the virtual environment**

```bash

source venv/bin/activate

```

- **3.Install dependencies**

```bash

pip3 install -r requirements.txt

```

- **4.Configure environment variables**

Create a file named `.env` in the root directory of the project and add your Azure DevOps credentials.

`
ORG="<your_organization_name>"
PROJECT="<your_project_name>"
PAT="<your_personal_access_token>"
`
Replace the placeholders with your actual values.

- **5.Run the script**

```bash

python3 main.py # for runnung manual

## To Run api 
uvicorn app.main:app --reload --port 8000


```

## How to run Frontend app?.

# 🚀 Running the Frontend Application 

Run the following commands one by one: 

```bash

cd src/ui

npm install

npm eun dev

```

## Happy coding 😄 ##


## Folder structure for dev understandings. 

TestPlanGenerator/
│
├── ui/                           # Frontend (React + Vite + Tailwind)
│   ├── public/
│   └── src/
│       ├── routes/
│       ├── components/
│       ├── hooks/
│       ├── services/             # axios api calls
│       └── pages/             # modules: dashboard, upload, settings...
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   │
│   │   ├── main.py               # FastAPI app entry point
│   │   │
│   │   ├── api/                  # Routing layer only (no business logic)
│   │   │   ├── __init__.py
│   │   │   ├── generate.py
│   │   │   ├── upload.py
│   │   │   ├── rag.py
│   │   │   ├── settings.py
│   │   │   ├── dashboard.py
│   │   │   └── connections.py
│   │   │
│   │   ├── models/               # Pydantic schemas + validation rules
│   │   │   ├── __init__.py
│   │   │   ├── response.py
│   │   │   ├── test_case.py
│   │   │   └── settings.py
│   │   │
│   │   ├── services/             # Business helpers not tied to RAG
│   │   │   ├── __init__.py
│   │   │   ├── json_store.py     # settings storage
│   │   │   ├── ado_client.py     # Azure DevOps client wrapper
│   │   │   └── jira_client.py    # Jira wrapper
│   │   │
│   │   ├── rag/                  # AI logic (core intelligence)
│   │   │   ├── __init__.py
│   │   │   ├── ingest.py         # XLS → cleaned dataset
│   │   │   ├── embedder.py       # LLM / OpenAI embedding calls
│   │   │   ├── vector_store.py   # ChromaDB interactions
│   │   │   ├── retriever.py      # Retrieve context for queries
│   │   │   └── generator.py      # RAG → Test generation
│   │   │
│   │   ├── workers/              # Background tasks (optional future Celery)
│   │   │   ├── __init__.py
│   │   │   └── tasks.py
│   │   │
│   │   └── core/                 # Security + config + constants
│   │       ├── __init__.py
│   │       ├── config.py
│   │       └── env.py
│   │
│   ├── requirements.txt
│   └── README.md
│
├── data/                         # Local uploaded files (user input)
│   └── uploaded/
│
├── rag_pipeline/ (optional future microservice)
│
└── docker-compose.yml (future)
