import re
import json
from colorama import Fore, Style, init
init(autoreset=True)

def normalize_to_json(response_content):
    if not isinstance(response_content, str):
        try:
            response_content = str(response_content)
        except Exception as e:
            print("[normalize_to_json] ❌ Could not convert response_content to str:", e)
            return [{"test_cases": []}]
    response_content = response_content.strip()
    if response_content.startswith("```"):
        response_content = re.sub(r"^```(json)?", "", response_content)
        response_content = response_content.strip("`").strip()
    try:
        parsed = json.loads(response_content)
        print("[normalize_to_json] ✅ Parsed as direct JSON")
        return parsed
    except json.JSONDecodeError as e:
        print("[normalize_to_json] ❌ Direct JSON parse failed:", e)
    match = re.search(r"(\[.*?\]|\{.*?\})", response_content, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(0))
            print("[normalize_to_json] ✅ Parsed using regex extraction")
            return parsed
        except json.JSONDecodeError as e:
            print("[normalize_to_json] ❌ Regex extraction failed:", e)
    print("[normalize_to_json] ⚠️ Falling back to heuristic parsing")
    test_cases = []
    current_case = {"id": None, "steps": [], "expected_result": ""}
    for line in response_content.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.lower().startswith(("test case", "tc-")):
            if current_case["id"] or current_case["steps"]:
                test_cases.append(current_case)
                current_case = {"id": None, "steps": [], "expected_result": ""}
            current_case["id"] = line.split(":")[-1].strip()
        elif line.lower().startswith("step"):
            current_case["steps"].append(line)
        elif "expected" in line.lower():
            current_case["expected_result"] = line
    if current_case["id"] or current_case["steps"]:
        test_cases.append(current_case)
    return [{"test_cases": test_cases}]

def format_score(label, score):
    """Return a color-coded label with emoji based on score."""
    if score >= 0.8:
        color, icon = Fore.GREEN, "✅"
    elif score >= 0.5:
        color, icon = Fore.YELLOW, "⚠️"
    else:
        color, icon = Fore.RED, "❌"
    return f"{color}{icon} {label}: {score:.3f}{Style.RESET_ALL}"

def print_score_summary(results: dict):
    """
    Prints a visual summary of evaluation scores.
    Expects a dict with keys: relevance, faithfulness, completeness, final_score, total_cases
    """
    print("\n=== 🧠 Test Case Evaluation Summary ===")
    if "relevance" in results:
        print(format_score("Relevance", results["relevance"]))
    if "faithfulness" in results:
        print(format_score("Faithfulness", results["faithfulness"]))
    if "completeness" in results:
        print(format_score("Completeness", results["completeness"]))
    print("-" * 40)
    if "final_score" in results:
        print(format_score("Final Score", results["final_score"]))
    if "total_cases" in results:
        print(f"🧩 Total Cases Evaluated: {results['total_cases']}")
    print("=======================================\n")

