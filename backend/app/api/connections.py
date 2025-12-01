from fastapi import APIRouter, HTTPException
from app.services.app_store import load_store, save_store
from app.models.response import APIResponse
from app.services import ado_client, jira_client

router = APIRouter(tags=["Connections"])


@router.post("/save")
async def save_connection(config: dict):
    """
    Save or update a connection config in the unified JSON store.
    Automatically sets status = 'connected' if test passes.
    NOTE: Only one active connection is supported at a time. Saving replaces existing.
    """
    tool = config.get("tool")
    if not tool:
        tool = infer_tool(config)
        if not tool:
            raise HTTPException(status_code=400, detail="Unable to infer tool. Provide 'tool' or include Jira URL or Azure org/project.")

    # Load existing store
    store = load_store()

    # Test connection before saving
    if tool == "azure":
        ok, msg = ado_client.test_ado_connection(config.get("org"), config.get("project"), config.get("token"))
    elif tool == "jira":
        ok, msg = jira_client.test_jira_connection(config.get("url"), config.get("token"))
    else:
        raise HTTPException(status_code=400, detail="Unknown tool type")

    # Enforce single connection: replace with current tool only
    store["connections"] = {
        tool: {
        **config,
        "status": "connected" if ok else "failed",
        "lastMessage": msg,
        }
    }

    # Save back
    save_store(store)

    return APIResponse(
        success=ok,
        message=msg,
        data=store["connections"][tool],
    )


@router.get("/status")
async def get_connection_status():
    """
    Load all connection configs and return statuses.
    """
    store = load_store()
    connections = store.get("connections", {})
    return APIResponse(
        success=True,
        message="Connections loaded successfully",
        data=connections,
    )


def infer_tool(config: dict) -> str:
    """
    Infer tool based on payload:
    - If url contains 'atlassian.net' -> jira
    - If org/project present -> azure
    """
    url = (config.get("url") or "").lower()
    org = config.get("org")
    project = config.get("project")
    if "atlassian.net" in url:
        return "jira"
    if org or project:
        return "azure"
    return ""


@router.post("/test")
async def test_connection(config: dict):
    """
    Test the given connection (without saving).
    """
    tool = config.get("tool")
    if not tool:
        raise HTTPException(status_code=400, detail="Missing 'tool' field ('azure' or 'jira')")

    if tool == "azure":
        ok, msg = ado_client.test_ado_connection(config.get("org"), config.get("project"), config.get("token"))
    elif tool == "jira":
        ok, msg = jira_client.test_jira_connection(config.get("url"), config.get("token"))
    else:
        raise HTTPException(status_code=400, detail="Unknown tool type")

    return APIResponse(success=ok, message=msg)
