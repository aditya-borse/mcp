import sys
import os
from pathlib import Path
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("filesystem")


def get_safe_path(relative_path: str) -> Path | None:
    """Validates a relative path and returns a safe, absolute Path object or None if invalid."""
    if not hasattr(mcp, "workspace_path"):
        return None

    workspace = mcp.workspace_path

    try:
        absolute_path = (workspace / relative_path).resolve()
        absolute_path.relative_to(workspace)
        return absolute_path
    except ValueError:
        return None


@mcp.tool()
def create_file(path: str, content: str = "") -> str:
    """
    Creates a new file at a given path within the workspace.
    If the file already exists, it will be overwritten.

    Args:
        path: The relative path for the new file (e.g., "src/index.js").
        content: The text content to write into the file.
    """
    safe_path = get_safe_path(path)
    if not safe_path:
        return f"Error: Path '{path}' is invalid or outside of the workspace."

    try:
        safe_path.parent.mkdir(parents=True, exist_ok=True)
        safe_path.write_text(content, encoding="utf-8")
        return f"File '{path}' created successfully."
    except Exception as e:
        return f"Error creating file '{path}': {e}"


@mcp.tool()
def delete_file(path: str) -> str:
    """
    Deletes a file at a given path within the workspace.

    Args:
        path: The relative path of the file to delete.
    """
    safe_path = get_safe_path(path)
    if not safe_path:
        return f"Error: Path '{path}' is invalid or outside of the workspace."

    if not safe_path.is_file():
        return f"Error: File not found at '{path}'."

    try:
        safe_path.unlink()
        return f"File '{path}' deleted successfully."
    except Exception as e:
        return f"Error deleting file '{path}': {e}"


@mcp.tool()
def edit_file(path: str, search_text: str, replace_text: str) -> str:
    """
    Finds and replaces text within a specified file.

    Args:
        path: The relative path of the file to edit.
        search_text: The text to search for.
        replace_text: The text to replace it with.
    """
    safe_path = get_safe_path(path)
    if not safe_path:
        return f"Error: Path '{path}' is invalid or outside of the workspace."

    if not safe_path.is_file():
        return f"Error: File not found at '{path}'."

    try:
        original_content = safe_path.read_text(encoding="utf-8")
        new_content = original_content.replace(search_text, replace_text)
        safe_path.write_text(new_content, encoding="utf-8")
        return f"File '{path}' edited successfully."
    except Exception as e:
        return f"Error editing file '{path}': {e}"


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: Please provide a workspace directory path.", file=sys.stderr)
        sys.exit(1)

    WORKSPACE_PATH = Path(sys.argv[1]).resolve()

    if not os.path.isdir(WORKSPACE_PATH):
        print(
            f"Error: Workspace directory not found at '{WORKSPACE_PATH}'",
            file=sys.stderr,
        )
        sys.exit(1)

    mcp.workspace_path = WORKSPACE_PATH
    print(f"File server starting. Workspace: {WORKSPACE_PATH}", file=sys.stderr)

    mcp.run(transport="stdio")
