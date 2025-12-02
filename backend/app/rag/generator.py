import json
from typing import List, Dict, Any

import requests

from app.services.app_store import get_section

try:
    # Prefer official clients to avoid manual URL handling.
    from openai import AzureOpenAI, OpenAI
except Exception:
    AzureOpenAI = None
    OpenAI = None


def build_prompt(requirement: str, context_chunks: List[Dict[str, Any]], settings: Dict[str, Any]) -> str:
    """
    Build a prompt using the requirement + retrieved context + user settings (temperature, model).
    """
    ctx_text = "\n\n".join(chunk.get("document", "") for chunk in context_chunks)
    return (
        f"You are a QA engineer. Model: {settings.get('model', '')}. "
        "Generate concise, actionable test cases with steps and expected results.\n\n"
        f"Requirement and ticket details:\n{requirement}\n\n"
        f"Retrieved context:\n{ctx_text}\n\n"
        "Respond with a JSON list of test cases, where each item has: title, steps (array), expected.\n"
    )


def _mock_generate(prompt: str, temperature: float) -> List[Dict[str, Any]]:
    """
    Offline mock generator to keep the pipeline functional without external LLM calls.
    Produces a few synthetic test cases using the prompt hash.
    """
    import hashlib

    base = int(hashlib.md5(prompt.encode()).hexdigest(), 16)
    variants = [
        "happy path login",
        "invalid credential handling",
        "edge case validation",
        "session timeout",
        "data persistence",
    ]
    cases = []
    for i in range(3):
        title = f"TC-{(base + i) % 10000}: {variants[i % len(variants)]}"
        steps = [
            "Open the app",
            "Navigate to the relevant screen",
            "Perform the core action",
            "Verify expected outcome",
        ]
        expected = "The system responds according to the acceptance criteria."
        cases.append({"title": title, "steps": steps, "expected": expected})
    return cases


def _ollama_generate(prompt: str, settings: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Call Ollama chat API for generation.
    """
    base_url = (settings.get("embedBaseUrl") or "http://localhost:11434").rstrip("/")
    model = settings.get("model") or "llama3"
    temperature = float(settings.get("temperature", 0.7))

    resp = requests.post(
        f"{base_url}/api/chat",
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "options": {"temperature": temperature},
        },
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    content = data.get("message", {}).get("content", "")
    # Try to parse JSON list of test cases
    try:
        parsed = json.loads(content)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass
    # Fallback: wrap raw text into a single test case
    return [
        {
            "title": "Generated Test Case",
            "steps": [content],
            "expected": "Review content and refine.",
        }
    ]


def _openai_generate(prompt: str, settings: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Call OpenAI chat completions API for generation using provided apiKey/model.
    """
    api_key = settings.get("apiKey")
    model = settings.get("model") or "gpt-4o"
    temperature = float(settings.get("temperature", 0.7))
    base_url = (settings.get("baseUrl") or "https://api.openai.com/v1").rstrip("/")

    if not api_key:
        raise RuntimeError("OpenAI apiKey is missing in settings.")
    if not OpenAI:
        raise RuntimeError("Missing openai package. Install `openai>=1.0.0` to use the OpenAI client.")

    # Use the official OpenAI client; base_url can be overridden by payload/settings if needed.
    client = OpenAI(api_key=api_key, base_url=base_url)
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
    )
    content = response.choices[0].message.content
    try:
        parsed = json.loads(content)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass
    return [
        {
            "title": "Generated Test Case",
            "steps": [content],
            "expected": "Review content and refine.",
        }
    ]


def _azure_generate(prompt: str, settings: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Call Azure OpenAI chat completions API for generation using provided endpoint/deployment/apiKey.
    """
    api_key = settings.get("apiKey")
    endpoint = (settings.get("azureEndpoint") or "").rstrip("/")
    api_version = settings.get("azureApiVersion") or "2024-02-15-preview"
    deployment = settings.get("azureDeployment") or settings.get("model") or ""
    temperature = float(settings.get("temperature", 0.7))

    if not api_key or not endpoint or not deployment:
        raise RuntimeError("Azure OpenAI settings are incomplete (apiKey, endpoint, deployment required).")

    if not AzureOpenAI:
        raise RuntimeError("Missing openai package. Install `openai>=1.0.0` to use Azure OpenAI client.")

    # Use the official client to avoid hand-built URLs that can return 404s.
    client = AzureOpenAI(
        api_version=api_version,
        azure_endpoint=endpoint,
        api_key=api_key,
    )
    response = client.chat.completions.create(
        model=deployment,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
    )
    content = response.choices[0].message.content

    try:
        parsed = json.loads(content)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass
    return [
        {
            "title": "Generated Test Case",
            "steps": [content],
            "expected": "Review content and refine.",
        }
    ]


def generate_test_cases(requirement: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate test cases using stored settings. Picks provider: explicit llmProvider if set,
    else infer by model (gpt*/text- -> OpenAI, else Ollama). No mock fallback.
    """
    settings = get_section("settings")
    prompt = build_prompt(requirement, context_chunks, settings)

    test_cases, note = call_llm(prompt, settings)

    return {
        "prompt": prompt,
        "testCases": test_cases,
        "note": note,
    }


def call_llm(prompt: str, settings: Dict[str, Any]) -> (List[Dict[str, Any]], str):
    """
    Central LLM router (like the old llm_file.py): decides provider from settings/model and calls it.
    """
    model = (settings.get("model") or "").lower()
    provider = (settings.get("llmProvider") or "").lower().strip()
    azure_endpoint = (settings.get("azureEndpoint") or "").strip()

    # Prefer Azure when explicitly requested or when Azure endpoint is provided.
    if provider == "azure" or (not provider and azure_endpoint):
        return _azure_generate(prompt, settings), "Generated via Azure OpenAI."

    if provider == "openai":
        return _openai_generate(prompt, settings), "Generated via OpenAI."

    # pattern check if provider not specified
    if model.startswith("gpt") or model.startswith("text-"):
        return _openai_generate(prompt, settings), "Generated via OpenAI."

    # Default to Ollama
    return _ollama_generate(prompt, settings), "Generated via Ollama."
