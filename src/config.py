import os
import getpass
from dotenv import load_dotenv

load_dotenv()

ORG = os.getenv("ORG")
PROJECT = os.getenv("PROJECT")
PAT = os.getenv("PAT")
PLAN_ID = int(os.getenv("PLAN_ID"))
SUITE_ID = int(os.getenv("SUITE_ID"))


# --- Embeddings Config ---
EMBED_MODEL = "all-MiniLM-L6-v2"
CHROMA_COLLECTION = "azure_work_items"


# Load .env values first

def prompt_or_env(key: str, prompt_text: str, secret: bool = False, default: str = None) -> str:
    """
    Ask user for input. If left blank, fall back to .env or default.
    """
    if secret:
        user_val = getpass.getpass(f"{prompt_text} (press Enter to use .env value): ")
    else:
        user_val = input(f"{prompt_text} (press Enter to use .env value): ")

    if user_val.strip():
        return user_val
    
    # Fallback
    return os.getenv(key, default)


# === Azure DevOps Config ===
ORG = prompt_or_env("ORG", "Enter your ADO Organization", default="my-org")
PROJECT = prompt_or_env("PROJECT", "Enter your ADO Project Name", default="my-project")
PLAN_ID = prompt_or_env("PLAN_ID", "Enter your Test Plan ID", default="123")
SUITE_ID = prompt_or_env("SUITE_ID", "Enter your Suite ID", default="456")
PAT = prompt_or_env("PAT", "Enter your Personal Access Token", secret=True)
# === Work Item IDs ===
work_item_input = prompt_or_env(
    "WORK_ITEM_ID",
    "Enter comma-separated Work Item IDs (e.g., 123,456)",
    default=os.getenv("WORK_ITEM_ID", "")
)

# Convert to list of integers
WORK_ITEM_IDS = [int(x.strip()) for x in work_item_input.split(",") if x.strip().isdigit()]

# === LLM Config ===
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()

OPENAI_API_KEY = None
OLLAMA_HOST = None
LLM_MODEL = None
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_API_VERSION = os.getenv("AZURE_API_VERSION")
OPENAI_LLM_MODEL = os.getenv("OPENAI_LLM_MODEL")

if LLM_PROVIDER == "openai":
    OPENAI_API_KEY = prompt_or_env("OPENAI_API_KEY", "Enter your OpenAI API Key", secret=True)

else:
    OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:")
    LLM_MODEL = os.getenv("LLM_MODEL", "llama3")

USE_RAGAS = bool(OPENAI_API_KEY)    

# === Optional GitHub / Repo Config ===
REPO_ID = prompt_or_env("REPO_ID", "Enter your Repo ID (optional)")
PR_ID = prompt_or_env("PR_ID", "Enter Pull Request ID (optional)")

# --- Print summary (masking secrets) ---
print("\n=== Loaded Configuration ===")
print(f"ORG      : {ORG}")
print(f"WORK_ITEM_ID      : {WORK_ITEM_IDS}")
print(f"PROJECT  : {PROJECT}")
print(f"PLAN_ID  : {PLAN_ID}")
print(f"SUITE_ID : {SUITE_ID}")
print(f"PAT      : {'*' * 10 if PAT else 'Not Provided'}")
print(f"LLM_PROVIDER  : {LLM_PROVIDER}")
print(f"USE_RAGAS : {USE_RAGAS}")
print(f"REPO_ID  : {REPO_ID or 'N/A'}")
print(f"PR_ID    : {PR_ID or 'N/A'}")
print("=============================\n")