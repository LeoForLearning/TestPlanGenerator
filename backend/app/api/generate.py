from fastapi import APIRouter, HTTPException
import requests
from bs4 import BeautifulSoup
from typing import Dict, Any, Optional

from app.models.test_case import GenerateRequest
from app.models.response import APIResponse
from app.rag import retriever, generator
from app.services.app_store import load_store
from app.services import ado_push

router = APIRouter()


@router.post("/")
async def generate_tests(payload: GenerateRequest, top_k: int = 5):
    """
    Generate test cases using RAG:
    - fetch ticket details from Jira/Azure using saved connections
    - retrieve relevant chunks from the vector store using ticket + prompt
    - build a prompt with context and delegate to generator.
    """
    # Load connection settings
    store = load_store()
    connections = store.get("connections", {})
    tool, conn = select_connection(connections, payload.tool, payload.ticketId)

    # Fetch ticket details from Azure DevOps or Jira
    ticket_text = fetch_ticket_details(tool, payload.ticketId, conn)

    # Build the query text using ticket + user prompt
    query_text = f"{ticket_text}\n\nUser Prompt:\n{payload.prompt}"

    # Retrieve context
    context = retriever.retrieve(query_text, top_k=top_k)

    # Build prompt + generate (live LLM via generator.py)
    try:
        result = generator.generate_test_cases(query_text, context)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}")

    return APIResponse(
        success=True,
        message="Generated test cases (RAG pipeline).",
        data={
            "prompt": result.get("prompt"),
            "testCases": result.get("testCases", []),
            "note": result.get("note"),
            "context": context,
            "ticket": {"id": payload.ticketId, "tool": tool, "text": ticket_text},
        },
    )


@router.post("/push")
async def push_to_azure(data: Dict[str, Any]):
    """
    Push generated test cases to Azure DevOps:
    - Requires a saved Azure connection (org/project/token)
    - Uses planId/suiteId from settings unless provided in payload
    Payload: { testCases: [{title, steps, expected}], planId?, suiteId? }
    """
    store = load_store()
    conn = store.get("connections", {}).get("azure")
    if not conn or conn.get("status") != "connected":
        raise HTTPException(status_code=400, detail="Azure connection not found or not connected.")

    settings = store.get("settings", {})
    plan_id = data.get("planId") or settings.get("planId")
    suite_id = data.get("suiteId") or settings.get("suiteId")
    if not plan_id or not suite_id:
        raise HTTPException(status_code=400, detail="planId and suiteId are required (in payload or settings).")

    test_cases = data.get("testCases") or []
    if not isinstance(test_cases, list) or not test_cases:
        raise HTTPException(status_code=400, detail="testCases must be a non-empty list.")

    created_ids = []
    try:
        for tc in test_cases:
            tc_id = ado_push.create_test_case(conn.get("org"), conn.get("project"), conn.get("token"), tc)
            ado_push.add_to_suite(conn.get("org"), conn.get("project"), conn.get("token"), plan_id, suite_id, tc_id)
            created_ids.append(tc_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to push to Azure DevOps: {exc}")

    return APIResponse(
        success=True,
        message=f"Pushed {len(created_ids)} test cases to Azure DevOps.",
        data={"ids": created_ids, "planId": plan_id, "suiteId": suite_id},
    )


def select_connection(connections: Dict[str, Any], requested_tool: Optional[str], ticket_id: str):
    """
    Decide which tool/connection to use.
    NOTE: Currently we support only one active connection. If multiple exist, return an error.
    """
    connected = {k: v for k, v in connections.items() if v.get("status") == "connected"}

    if requested_tool:
        conn = connected.get(requested_tool)
        if not conn:
            raise HTTPException(status_code=400, detail=f"No saved connection for tool '{requested_tool}'")
        if len(connected) > 1:
            raise HTTPException(status_code=400, detail="Multiple connections found; only one active connection is supported.")
        return requested_tool, conn

    if len(connected) == 1:
        tool, conn = next(iter(connected.items()))
        return tool, conn

    if len(connected) > 1:
        raise HTTPException(status_code=400, detail="Multiple connections found; only one active connection is supported. Please keep a single Azure or Jira connection.")

    raise HTTPException(status_code=400, detail="No connected tools available. Save a Jira/Azure connection first.")


def fetch_ticket_details(tool: str, ticket_id: str, conn: dict) -> str:
    """
    Fetch ticket details from Azure DevOps or Jira using stored connection.
    """
    if tool == "azure":
        org = conn.get("org")
        project = conn.get("project")
        token = conn.get("token")
        if not all([org, project, token]):
            raise HTTPException(status_code=400, detail="Azure connection is missing org/project/token.")
        url = f"https://dev.azure.com/{org}/{project}/_apis/wit/workitems/{ticket_id}?api-version=7.0"
        resp = requests.get(url, auth=("", token))
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"Azure returned {resp.status_code}: {resp.text}")
        data = resp.json()
        fields = data.get("fields", {})
        title = fields.get("System.Title", "")
        desc_html = fields.get("System.Description", "")
        ac_html = fields.get("Microsoft.VSTS.Common.AcceptanceCriteria", "")
        desc = clean_html(desc_html)
        ac = clean_html(ac_html)
        return f"Ticket: {ticket_id}\nTitle: {title}\n\nDescription:\n{desc}\n\nAcceptance Criteria:\n{ac}"

    if tool == "jira":
        base_url = conn.get("url")
        token = conn.get("token")
        if not base_url or not token:
            raise HTTPException(status_code=400, detail="Jira connection is missing url/token.")
        resp = requests.get(
            f"{base_url.rstrip('/')}/rest/api/3/issue/{ticket_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"Jira returned {resp.status_code}: {resp.text}")
        data = resp.json()
        fields = data.get("fields", {})
        summary = fields.get("summary", "") or fields.get("Summary", "")
        desc_field = fields.get("description", "") or fields.get("Description", "")
        desc = parse_jira_description(desc_field)
        return f"Ticket: {ticket_id}\nTitle: {summary}\n\nDescription:\n{desc}"

    raise HTTPException(status_code=400, detail=f"Unknown tool '{tool}'. Expected 'azure' or 'jira'.")


def clean_html(text: str) -> str:
    if not text:
        return ""
    return BeautifulSoup(text, "html.parser").get_text("\n").strip()


def parse_jira_description(desc_field) -> str:
    """
    Handle Jira description which may be a string or Atlassian Document Format.
    """
    if isinstance(desc_field, str):
        return desc_field
    if isinstance(desc_field, dict) and "content" in desc_field:
        # Simple extractor for ADF
        parts = []
        for block in desc_field.get("content", []):
            if isinstance(block, dict):
                for item in block.get("content", []):
                    text = item.get("text")
                    if text:
                        parts.append(text)
        return "\n".join(parts)
    return ""
