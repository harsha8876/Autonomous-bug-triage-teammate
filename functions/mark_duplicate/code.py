#input_type_name: MarkDuplicateInput
#output_type_name: MarkDuplicateResult
#function_name: mark_duplicate

from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class MarkDuplicateInput(BaseModel):
    feedback_id: str
    raw_text: str
    duplicate_id: str
    similarity: float
    explanation: str

class MarkDuplicateResult(BaseModel):
    issue_row_id: str
    status: str = 'duplicate'

async def mark_duplicate(ctx: FunctionContext, data: MarkDuplicateInput) -> MarkDuplicateResult:
    pod = Pod.from_env()
    issue = pod.records.create('issues', {
        'title': data.raw_text[:90],
        'severity': 'P3',
        'component': 'unknown',
        'repro_steps': [],
        'labels': ['duplicate', 'auto-flagged'],
        'reasoning': data.explanation,
        'confidence': data.similarity,
        'status': 'duplicate',
        'feedback_id': data.feedback_id,
    })
    pod.records.create('operator_runs', {
        'action': 'duplicate_marked',
        'detail': data.explanation,
        'feedback_id': data.feedback_id,
        'issue_id': issue.id,
    })
    return MarkDuplicateResult(issue_row_id=issue.id, status='duplicate')
