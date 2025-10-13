import base64
from bs4 import BeautifulSoup
import requests
from src.config import ORG, PROJECT, PAT, PLAN_ID, SUITE_ID


def get_work_item(ORG, PROJECT, WORK_ITEM_ID, PAT):
    # --- Build API URL ---
    url = f"https://dev.azure.com/{ORG}/{PROJECT}/_apis/wit/workitems/{WORK_ITEM_ID}?api-version=7.0"
 
    # --- Auth Header ---
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Basic " + base64.b64encode((":"+PAT).encode()).decode()
    }
 
    # --- Make Request ---
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

def extract_text_fields(wi):
    title = wi["fields"].get("System.Title", "")
    desc_html = wi["fields"].get("System.Description", "")
    desc = BeautifulSoup(desc_html, "html.parser").get_text("\n") if desc_html else "N/A"
    ac_html = wi["fields"].get("Microsoft.VSTS.Common.AcceptanceCriteria", "")
    ac = BeautifulSoup(ac_html, "html.parser").get_text("\n") if ac_html else "N/A"

    return f"Title: {title}\n\nDescription:\n{desc}\n\nAcceptance Criteria:\n{ac}"


def build_steps_xml(block):
    all_steps = []
    step_id = 1

    for case in block["test_cases"]:
        for i, s in enumerate(case["steps"]):
            # For the last step in this test case, add expected result
            if i == len(case["steps"]) - 1:
                expected = case["expected_result"]
            else:
                expected = ""
            all_steps.append({
                "id": step_id,
                "action": f"TC{case['id']} - {s}",
                "expected": expected
            })
            step_id += 1

    steps_xml = f"<steps id='0' last='{len(all_steps)}'>"
    for step in all_steps:
        steps_xml += f"""
    <step id="{step['id']}" type="ActionStep">
        <parameterizedString isformatted="true">{step['action']}</parameterizedString>
        <parameterizedString isformatted="true">{step['expected']}</parameterizedString>
    </step>"""
    steps_xml += "\n</steps>"

    return steps_xml

def create_test_case(block,title):
    """
    Creates a new Test Case in Azure DevOps with the given title and steps.
    """
     
    url = f"https://dev.azure.com/{ORG}/{PROJECT}/_apis/wit/workitems/$Test%20Case?api-version=7.1-preview.3"
    headers = {
        "Content-Type": "application/json-patch+json",
        "Authorization": "Basic " + base64.b64encode((":" + PAT).encode()).decode()
    }

    # Build steps XML directly (ADO expects raw XML, not escaped)
    steps_xml = build_steps_xml(block)
    print("DEBUG - Steps XML being sent:\n", steps_xml)

    payload = [
        {
            "op": "add",
            "path": "/fields/System.Title",
            "value": title
        },
        {
            "op": "add",
            "path": "/fields/Microsoft.VSTS.TCM.Steps",
            "value": steps_xml
        }
    ]

    response = requests.post(url, headers=headers, json=payload)
    if response.status_code not in (200, 201):
        print("❌ Failed to create test case:", response.text)
        return None
    else:
        data = response.json()
        print("✅ Test case created:", data.get("id"))
        # Debug: Confirm ADO stored steps
        print("Stored Steps XML in ADO:\n", data["fields"].get("Microsoft.VSTS.TCM.Steps"))
        return data.get("id")


def add_to_suite(test_case_id):
    url = f"https://dev.azure.com/{ORG}/{PROJECT}/_apis/test/plans/{PLAN_ID}/suites/{SUITE_ID}/testcases/{test_case_id}?api-version=7.1-preview.2"
    headers = {
        "Authorization": "Basic " + base64.b64encode((":" + PAT).encode()).decode()
    }
    response = requests.post(url, headers=headers)
    response.raise_for_status()
    return response.json()