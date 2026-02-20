import requests

def test_jira_connection(url: str, token: str):
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{url}/rest/api/3/project", headers=headers)
        if response.status_code == 200:
            return True, "Jira connection successful."
        elif response.status_code == 401:
            return False, "Invalid Jira token."
        else:
            return False, f"Jira returned {response.status_code}"
    except Exception as e:
        return False, str(e)
