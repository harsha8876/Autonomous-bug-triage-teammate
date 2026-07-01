#input_type_name: FetchCandidatesInput
#output_type_name: FetchCandidatesResult
#function_name: fetch_candidates

from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class FetchCandidatesInput(BaseModel):
    feedback_id: str

class FetchCandidatesResult(BaseModel):
    candidates_text: str

async def fetch_candidates(ctx: FunctionContext, data: FetchCandidatesInput) -> FetchCandidatesResult:
    pod = Pod.from_env()
    all_issues = pod.records.list('issues', sort=[{'field': 'created_at', 'direction': 'desc'}], limit=30)
    rows = []
    if hasattr(all_issues, 'items'):
        for item in all_issues.items:
            row = item.to_dict()
            if str(row.get('feedback_id')) != str(data.feedback_id):
                rows.append(f"- id: {row.get('id')}, title: {row.get('title')}, component: {row.get('component')}")
            if len(rows) >= 10:
                break
    candidates_text = '\n'.join(rows) if rows else 'No other issues exist yet.'
    return FetchCandidatesResult(candidates_text=candidates_text)
