import base64
from typing import List
import requests


def _steps_to_xml(test_case: dict) -> str:
    """
    Convert test case dict with steps/expected into ADO steps XML.
    """
    steps = test_case.get("steps", []) or []
    expected = test_case.get("expected", "")
    all_steps = []
    step_id = 1
    for i, step in enumerate(steps):
        exp = expected if i == len(steps) - 1 else ""
        all_steps.append(
            {
                "id": step_id,
                "action": step,
                "expected": exp,
            }
        )
        step_id += 1

    steps_xml = f"<steps id='0' last='{len(all_steps)}'>"
    for s in all_steps:
        steps_xml += f"""
    <step id="{s['id']}" type="ActionStep">
        <parameterizedString isformatted="true">{s['action']}</parameterizedString>
        <parameterizedString isformatted="true">{s['expected']}</parameterizedString>
    </step>"""
    steps_xml += "\n</steps>"
    return steps_xml


def create_test_case(org: str, project: str, pat: str, test_case: dict) -> int:
    url = f"https://dev.azure.com/{org}/{project}/_apis/wit/workitems/$Test%20Case?api-version=7.1-preview.3"
    headers = {
        "Content-Type": "application/json-patch+json",
        "Authorization": "Basic " + base64.b64encode((":" + pat).encode()).decode(),
    }
    steps_xml = _steps_to_xml(test_case)
    payload = [
        {"op": "add", "path": "/fields/System.Title", "value": test_case.get("title", "Generated Test Case")},
        {"op": "add", "path": "/fields/Microsoft.VSTS.TCM.Steps", "value": steps_xml},
    ]
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    return data.get("id")


def add_to_suite(org: str, project: str, pat: str, plan_id: str, suite_id: str, test_case_id: int):
    url = f"https://dev.azure.com/{org}/{project}/_apis/test/plans/{plan_id}/suites/{suite_id}/testcases/{test_case_id}?api-version=7.1-preview.2"
    headers = {"Authorization": "Basic " + base64.b64encode((":" + pat).encode()).decode()}
    resp = requests.post(url, headers=headers, timeout=60)
    resp.raise_for_status()
    return resp.json()
