import requests

def test_ado_connection(org: str, project: str, token: str):
    """
    Tests Azure DevOps connection.
    Returns True if reachable, False otherwise.
    """
    try:
        url = f"https://dev.azure.com/{org}/{project}/_apis/projects?api-version=7.0"
        response = requests.get(url, auth=("", token))
        if response.status_code == 200:
            return True, "Azure DevOps connection successful."
        elif response.status_code == 401:
            return False, "Invalid Azure DevOps token."
        else:
            return False, f"Azure returned {response.status_code}"
    except Exception as e:
        return False, str(e)
