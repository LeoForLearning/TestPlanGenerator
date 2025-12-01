from fastapi import APIRouter
from app.models.response import APIResponse

router = APIRouter()


@router.get("/")
async def get_dashboard_status():
    """
    Returns combined dashboard metrics.
    Later this will read from:
    - connection settings
    - chroma DB file index
    - activity log store
    - Jira/Azure sync metadata
    - test generation history
    """

    # For now: mock data
    response = {
        "connectedTool": "Azure DevOps",     # or "JIRA" or None
        "storedDocuments": 46,
        "generatedTestsCount": 182,
        "lastSync": "2h ago",

        "recentTickets": [
            {"id": "JIRA-231", "title": "Login failing on OTP"},
            {"id": "JIRA-228", "title": "API timeout issue"},
            {"id": "ADO-110", "title": "Incorrect table rendering"},
            {"id": "ADO-108", "title": "Rate limiter not resetting"},
        ],

        "storedFiles": [
            {"name": "TestSuite_v1.xlsx", "status": "Embedded"},
            {"name": "RegressionCases.xlsx", "status": "Embedded"},
            {"name": "MobileTests.xlsx", "status": "Pending"},
        ],

        "recentActivity": [
            "🧪 Test cases generated for ticket JIRA-231 (5 mins ago)",
            "📄 Uploaded RegressionCases.xlsx to ChromaDB (1 hr ago)",
            "🔌 Connected to Azure DevOps instance (Today 09:15 AM)"
        ]
    }

    return APIResponse(success=True, message="Dashboard data ready", data=response)
