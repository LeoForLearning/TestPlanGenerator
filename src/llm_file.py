import yaml
from string import Template
import os
import ollama
from openai import OpenAI
from openai import AzureOpenAI
from src.config import OLLAMA_HOST, LLM_MODEL, LLM_PROVIDER, OPENAI_API_KEY, AZURE_ENDPOINT, OPENAI_API_KEY, AZURE_API_VERSION, OPENAI_LLM_MODEL

def load_prompt(requirements_text):
    with open("prompt.yml", "r") as f:
        prompt_config = yaml.safe_load(f)
    template = Template(prompt_config["qa_test_case_prompt"])
    return template.substitute(requirements_text=requirements_text)

#def call_llm(prompt):
#    client = ollama.Client(host=OLLAMA_HOST)
#    response = client.chat(model=LLM_MODEL, messages=[{"role": "user", "content": prompt}])
#    return response["message"]["content"]

def call_llm(prompt):
   # Initialize the Azure OpenAI client using your custom AzureOpenAI class
    client = AzureOpenAI(
        api_version=AZURE_API_VERSION,
        azure_endpoint=AZURE_ENDPOINT,
        api_key=OPENAI_API_KEY,
    )
    provider = LLM_PROVIDER.lower().strip()

    if provider == "openai":
        print("🧠 Using OpenAI for LLM generation...")
        response = client.chat.completions.create(
            model=OPENAI_LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )
        return response.choices[0].message.content

    elif provider == "ollama":
        print("🧠 Using Ollama (local) for LLM generation...")
        client = ollama.Client(host=OLLAMA_HOST)
        response = client.chat(model=LLM_MODEL, messages=[{"role": "user", "content": prompt}])
        return response["message"]["content"]

    else:
        raise ValueError(f"❌ Unsupported LLM provider: {provider}")