from pydantic import BaseModel
from typing import List, Optional

class TestCase(BaseModel):
    title: str
    steps: List[str]
    expected: str
    bdd: Optional[str] = None
    boundary: Optional[List[str]] = None

class GenerateRequest(BaseModel):
    ticketId: str
    tool: Optional[str] = None
    prompt: str
    accuracy: int
