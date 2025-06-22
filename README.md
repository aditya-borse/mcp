# AI Agent for File Editing

Application that allows users to upload a folder and use natural language prompts to perform filesystem operations (create, edit, delete). 

## Video Demo 
[Check out the demo on Youtube](https://youtu.be/XFnAwdAtG_k)

## Tech Stack

*   **Frontend**: Next.js
*   **Backend (API and MCP Client)**: FastAPI server that does two things:
    1.  Handles file uploads/downloads and user prompts.
    2.  Makes calls to the AI agent.
*   **MCP Server**: Python script that exposes filesystem tools (`create_file`, `edit_file`, `delete_file`) according to the MCP spec.
*   **LLM**: Claude API


## Architecture 

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI["Next.js Web App<br/>- File Upload Interface<br/>- Natural Language Prompt Input<br/>- File Tree Display<br/>- Project Download"]
    end
    
    subgraph "Backend API Layer"
        API["FastAPI Server<br/>- File Upload Handler<br/>- Session Management<br/>- Prompt Handler<br/>- Download Handler"]
    end
    
    subgraph "AI & MCP Layer"
        MCP_CLIENT["MCP Client<br/>- Tool Discovery<br/>- Tool Execution<br/>- Response Handling"]
        CLAUDE["Claude AI<br/>- Natural Language Understanding<br/>- Tool Selection<br/>- Command Generation"]
        MCP_SERVER["MCP File Server<br/>- create_file()<br/>- edit_file()<br/>- delete_file()"]
    end
    
    subgraph "Storage Layer"
        WORKSPACES["File Workspaces<br/>- Session-based directories<br/>- Uploaded project files<br/>- Modified files"]
    end
    
    UI -->|"HTTP Requests<br/>(upload/prompt/download)"| API
    API -->|"Natural Language Prompt"| MCP_CLIENT
    MCP_CLIENT -->|"Tool Schema & Prompt"| CLAUDE
    CLAUDE -->|"Tool Calls & Instructions"| MCP_CLIENT
    MCP_CLIENT -->|"Execute Tools"| MCP_SERVER
    MCP_SERVER -->|"File Operations"| WORKSPACES
    API -->|"File Storage/Retrieval"| WORKSPACES
    
    API -->|"Response & File Tree"| UI
    MCP_SERVER -->|"Tool Results"| MCP_CLIENT
    MCP_CLIENT -->|"Execution Results"| API
    
    style UI fill:#e1f5fe
    style API fill:#f3e5f5
    style MCP_CLIENT fill:#fff3e0
    style CLAUDE fill:#e8f5e8
    style MCP_SERVER fill:#fff3e0
    style WORKSPACES fill:#fce4ec
```

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/aditya-borse/mcp.git
    cd mcp
    ```

2.  **Create a .env file**
    ```bash
    cd server
    cp .env.example .env
    ```
    Fill in the values for the environment variables.

3.  **Install Backend Dependencies:**
    ```bash
    cd server
    python3 -m venv .venv # For Windows users: python -m venv .venv
    source .venv/bin/activate # For Windows users: .venv\Scripts\activate
    pip install -r requirements.txt
    ```

4.  **Install Frontend Dependencies:**
    ```bash
    cd frontend
    npm install
    ```

## Run

1.  **Start the Backend Server:**
    ```bash
    cd server
    uvicorn main:app --reload
    ```
    The backend will be available at `http://localhost:8000`.

2.  **Start the Frontend Server:**
    ```bash
    cd frontend
    npm run dev
    ```
    The frontend will be available at `http://localhost:3000`.

3.  **Use the Application:**
    Open `http://localhost:3000` in your browser, upload a `.zip` file, and start giving commands to the agent.