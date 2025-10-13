from src.config import ORG, PROJECT, PAT
from src.ado_api import get_work_item, extract_text_fields, create_test_case, add_to_suite
from src.embeddings import embed_and_store, query_similar
from src.llm_file import load_prompt, call_llm
from src.utils import normalize_to_json
from src.excel_export import export_test_plan_to_excel
from src.config import ORG, PROJECT, PAT, WORK_ITEM_IDS
from src.evaluation import evaluate_generated_cases


if not WORK_ITEM_IDS:
    raise ValueError("❌ No WORK_ITEM_IDS found in .env — please add WORK_ITEM_IDS=12345,67890")

# --- Step 1: Fetch + Embed ---
for wid in WORK_ITEM_IDS:
    wi = get_work_item(ORG, PROJECT, wid, PAT)
    full_text = extract_text_fields(wi)
    embed_and_store(wid, full_text, wi["fields"].get("System.Title", ""))
    
story_title = wi["fields"].get("System.Title", "")

# --- Step 2: Query ---
results = query_similar("Learner has correct name and email format", top_k=3)
best_docs = results["documents"][0]
best_ids = results["ids"][0]

requirements_text = ""
for wid, doc in zip(best_ids, best_docs):
    requirements_text += f"\n\n---\nRequirement ID: {wid}\n{doc}\n"

# --- Step 3: LLM ---
prompt = load_prompt(requirements_text)  # <-- replaces the f-string
raw_output = call_llm(prompt)
test_cases = normalize_to_json(raw_output)

# --- Step 4: Excel Export ---
export_test_plan_to_excel(test_cases)

# --- Step 5: Push to ADO ---
for block in test_cases:
    tc_id = create_test_case(block,story_title)
    if tc_id:
        add_to_suite(tc_id)
        print(f"✅ Added Test Case {tc_id} to Test Plan Suite")

# --- Step 6: Evaluate ---
# evaluation_results = evaluate_generated_cases(requirements_text, test_cases)
# print("\n=== Evaluation Summary ===")
# for k, v in evaluation_results.items():
#     print(f"{k}: {v}")
# print("===========================\n")