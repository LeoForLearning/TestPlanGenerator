import requests

def test_ado_connection(org: str, project: str, token: str):
    """
    Tests Azure DevOps connection.
    Returns True if reachable, False otherwise.
    """
    try:
        # Validate org/project combo by querying the specific project endpoint.
        # The previous URL included the project before `_apis/projects`, which Azure
        # treats as an invalid route and returns a 404 even when the project exists.
        url = f"https://dev.azure.com/{org}/_apis/projects/{project}?api-version=7.0"
        response = requests.get(url, auth=("", token))
        if response.status_code == 200:
            return True, "Azure DevOps connection successful."
        elif response.status_code == 401:
            return False, "Invalid Azure DevOps token."
        elif response.status_code == 404:
            return False, "Organization or project not found. Check names and access rights."
        else:
            return False, f"Azure returned {response.status_code}"
    except Exception as e:
        return False, str(e)
