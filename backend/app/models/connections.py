from pydantic import BaseModel, Field
from typing import Literal, Optional

class ConnectionConfig(BaseModel):
    tool: Literal["azure", "jira"]
    org: Optional[str] = None
    project: Optional[str] = None
    token: str = Field(..., min_length=10)
    url: Optional[str] = None  # JIRA site URL

class ConnectionResponse(BaseModel):
    success: bool
    message: str
    details: Optional[dict] = None
