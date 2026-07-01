#input_type_name: MarkDuplicateInput
#output_type_name: MarkDuplicateResult
#function_name: mark_duplicate

from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class MarkDuplicateInput(BaseModel):
    feedback_id: str
    duplicate_of: str | None = None
    similarity: float = 0.0

class MarkDuplicateResult(BaseModel):
    issue_id: str
    status: str = 'duplicate'

async def mark_duplicate(ctx: FunctionContext, data: MarkDuplicateInput) -> MarkDuplicateResult:
    pod = Pod.from_env()
    all_issues = pod.records.list('issues', sort=[{'field': 'created_at', 'direction': 'desc'}], limit=20)
    issue_id = None
    if hasattr(all_issues, 'items') and all_issues.items:
        for item in all_issues.items:
            row = item.to_dict()
            if str(row.get('feedback_id')) == str(data.feedback_id):
                issue_id = str(row['id'])
                break
    if not issue_id:
        raise ValueError(f'No issue found for feedback_id {data.feedback_id}')
    pod.records.update('issues', issue_id, {
        'status': 'duplicate',
        'similarity_score': data.similarity,
    })
    pod.records.create('operator_runs', {'action': 'duplicate_found', 'issue_id': issue_id})
    return MarkDuplicateResult(issue_id=issue_id, status='duplicate')
