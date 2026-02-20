from openpyxl import Workbook
import pandas as pd

def export_test_plan_to_excel(response_content_json, output_file="test_cases.xlsx"):
    wb = Workbook()
    ws = wb.active
    ws.title = "Test Plan"
    headers = ["Test Case ID", "Steps", "Expected Result"]
    ws.append(headers)
    rows = []
    for block in response_content_json:
        for tc in block["test_cases"]:
            steps_numbered = "\n".join([f"Step {i+1}: {s}" for i, s in enumerate(tc["steps"])])
            rows.append({
                "Test Case ID": tc["id"],
                "Steps": steps_numbered,
                "Expected Result": tc["expected_result"]
            })
    df = pd.DataFrame(rows)
    df.to_excel(output_file, index=False)
    print(f"✅ Test cases written to {output_file}")
