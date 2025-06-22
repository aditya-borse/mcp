import uuid
import zipfile
import shutil
from pathlib import Path
from typing import List, Dict
import subprocess
import asyncio
from mcp.client.stdio import stdio_client
from mcp import ClientSession, StdioServerParameters
import anthropic
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

WORKSPACES_DIR = Path("workspaces")
WORKSPACES_DIR.mkdir(exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UploadResponse(BaseModel):
    session_id: str
    file_tree: List[Dict]


class PromptRequest(BaseModel):
    prompt: str


class PromptResponse(BaseModel):
    status: str
    message: str
    file_tree: List[Dict]


try:
    anthropic_client = anthropic.Anthropic()
except Exception as e:
    print(f"Error initializing Anthropic client: {e}")
    print("ANTHROPIC_API_KEY environment variable is not set.")
    anthropic_client = None


def get_file_tree(directory: Path) -> List[Dict]:
    """Scans a directory and returns its structure as a list of dicts."""
    tree = []
    for path in sorted(directory.rglob("*")):
        if path.is_file():
            tree.append(
                {
                    "path": str(path.relative_to(directory)),
                }
            )
    return tree


@app.get("/")
def read_root():
    return {"message": "Hello World"}


@app.post("/upload", response_model=UploadResponse)
async def upload_project(file: UploadFile):
    """
    Handles the upload of a ZIP file.
    """
    session_id = str(uuid.uuid4())
    session_path = WORKSPACES_DIR / session_id
    session_path.mkdir()

    temp_zip_path = session_path / "upload.zip"

    try:
        with temp_zip_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        with zipfile.ZipFile(temp_zip_path, "r") as zip_ref:
            zip_ref.extractall(session_path)

    except zipfile.BadZipFile:
        shutil.rmtree(session_path)
        raise HTTPException(
            status_code=400, detail="Uploaded file is not a valid ZIP file."
        )
    except Exception as e:
        shutil.rmtree(session_path)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}"
        )
    finally:
        if temp_zip_path.exists():
            temp_zip_path.unlink()

    file_tree = get_file_tree(session_path)
    return {"session_id": session_id, "file_tree": file_tree}


@app.get("/files/{session_id}")
def get_files(session_id: str):
    """Returns the current file tree for a given session."""
    session_path = WORKSPACES_DIR / session_id
    if not session_path.is_dir():
        raise HTTPException(status_code=404, detail="Session not found")
    return {"file_tree": get_file_tree(session_path)}


@app.get("/download/{session_id}")
async def download_project(session_id: str):
    """
    Zips the contents of a session directory and returns it for download.
    """
    session_path = WORKSPACES_DIR / session_id
    if not session_path.is_dir():
        raise HTTPException(status_code=404, detail="Session not found.")

    zip_path = WORKSPACES_DIR / f"{session_id}.zip"

    shutil.make_archive(
        base_name=str(WORKSPACES_DIR / session_id), format="zip", root_dir=session_path
    )

    return FileResponse(
        path=zip_path,
        filename=f"project_{session_id}.zip",
        media_type="application/zip",
    )


@app.post("/prompt/{session_id}", response_model=PromptResponse)
async def handle_prompt(session_id: str, request: PromptRequest):
    if not anthropic_client:
        raise HTTPException(status_code=500, detail="Anthropic client not configured.")

    session_path = WORKSPACES_DIR / session_id
    if not session_path.is_dir():
        raise HTTPException(status_code=404, detail="Session not found")

    mcp_server_path = Path("./mcp_file_server.py").resolve()

    server_params = StdioServerParameters(
        command="python", args=[str(mcp_server_path), str(session_path)]
    )

    async with stdio_client(server_params) as streams:
        async with ClientSession(streams[0], streams[1]) as mcp_client:
            await mcp_client.initialize()

            tools_response = await mcp_client.list_tools()
            available_tools = [tool.model_dump() for tool in tools_response.tools]

            system_prompt = "You are a helpful assistant with access to a file system. You can create, edit, read, and delete files. Use the available tools to help the user with their requests."

            messages = [{"role": "user", "content": request.prompt}]

            claude_response = anthropic_client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=1024,
                system=system_prompt,
                messages=messages,
                tools=available_tools,
            )

            response_parts = []
            tool_results = []

            for content in claude_response.content:
                if content.type == "text":
                    response_parts.append(content.text)
                elif content.type == "tool_use":
                    tool_name = content.name
                    tool_input = content.input

                    try:
                        mcp_tool_result = await mcp_client.call_tool(
                            tool_name, tool_input
                        )
                        if mcp_tool_result.content:
                            tool_output = (
                                mcp_tool_result.content[0].text
                                if mcp_tool_result.content[0].text
                                else "Tool executed successfully with no output."
                            )
                        else:
                            tool_output = "Tool executed successfully."

                        tool_results.append(f"Executed {tool_name}: {tool_output}")

                    except Exception as e:
                        error_msg = f"Error executing {tool_name}: {str(e)}"
                        tool_results.append(error_msg)

            final_response = []
            if response_parts:
                final_response.extend(response_parts)
            if tool_results:
                final_response.extend(tool_results)

            if not final_response:
                final_response = ["No response generated."]

            updated_file_tree = get_file_tree(session_path)

            return {
                "status": "success",
                "message": "\n".join(final_response),
                "file_tree": updated_file_tree,
            }
