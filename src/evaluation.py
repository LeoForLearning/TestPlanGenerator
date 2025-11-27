import json
from sentence_transformers import SentenceTransformer, util
from src.config import USE_RAGAS, OPENAI_API_KEY
from src.utils import print_score_summary

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def evaluate_generated_cases(requirements_text, generated_json):
    """
    Evaluates generated test cases.
    Uses RAGAS if OpenAI key is present, else falls back to embedding-based offline evaluator.
    """
    if USE_RAGAS:
        return evaluate_with_ragas(requirements_text, generated_json)
    else:
        return evaluate_offline(requirements_text, generated_json)

def evaluate_offline(requirements_text, generated_json):
    """Offline evaluation using embedding similarity (for Ollama users)."""
    try:
        gen_data = json.loads(generated_json)
    except:
        gen_data = generated_json

    req_embedding = embedding_model.encode(requirements_text, convert_to_tensor=True)

    all_scores = []
    total_steps = 0

    for block in gen_data:
        for tc in block.get("test_cases", []):
            test_text = " ".join(tc.get("steps", [])) + " " + tc.get("expected_result", "")
            test_embedding = embedding_model.encode(test_text, convert_to_tensor=True)
            similarity = util.cos_sim(req_embedding, test_embedding).item()

            all_scores.append(similarity)
            total_steps += 1

    relevance_score = sum(all_scores) / len(all_scores) if all_scores else 0
    faithfulness_score = relevance_score
    completeness_score = min(1.0, total_steps / 10)
    final_score = (relevance_score + faithfulness_score + completeness_score) / 3

    results = {
        "mode": "offline",
        "relevance": round(relevance_score, 3),
        "faithfulness": round(faithfulness_score, 3),
        "completeness": round(completeness_score, 3),
        "final_score": round(final_score, 3),
        "total_cases": total_steps
    }
    print_score_summary(results)
    return results

def evaluate_with_ragas(requirements_text, generated_json):
    """Online evaluation using RAGAS (requires OpenAI key)."""
    try:
        from datasets import Dataset
        from ragas import evaluate
        from ragas.metrics import faithfulness, answer_relevancy, context_precision
    except ImportError:
        raise ImportError("Please install ragas: pip install ragas[eval] datasets")

    # Prepare RAGAS dataset
    data = json.loads(generated_json)
    samples = []
    for block in data:
        for tc in block.get("test_cases", []):
            samples.append({
                "question": requirements_text,
                "answer": " ".join(tc.get("steps", [])) + " " + tc.get("expected_result", ""),
                "contexts": [requirements_text],
            })
    dataset = Dataset.from_list(samples)

    # Evaluate with RAGAS
    scores = evaluate(dataset=dataset, metrics=[faithfulness, answer_relevancy, context_precision])
    ragas_scores = scores.to_pandas().mean().to_dict()

    resutls = {
        "mode": "ragas",
        "faithfulness": round(ragas_scores.get("faithfulness", 0), 3),
        "relevance": round(ragas_scores.get("answer_relevancy", 0), 3),
        "completeness": round(ragas_scores.get("context_precision", 0), 3),
        "final_score": round(sum(ragas_scores.values()) / len(ragas_scores), 3),
        "total_cases": len(samples),
    }
    print_score_summary(resutls)
    return resutls
