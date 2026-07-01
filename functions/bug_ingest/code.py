#input_type_name: BugIngestInput
#output_type_name: BugIngestResult
#function_name: bug_ingest

from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class BugIngestInput(BaseModel):
    raw_text: str
    source: str = 'manual'

class BugIngestResult(BaseModel):
    feedback_id: str
    workflow_run_id: str
    status: str

async def bug_ingest(ctx: FunctionContext, data: BugIngestInput) -> BugIngestResult:
    pod = Pod.from_env()
    rec = pod.records.create('feedback', {
        'raw_text': data.raw_text,
        'source': data.source,
        'status': 'pending',
    })
    feedback_id = str(rec['id'])
    run = pod.workflows.run('triage')
    pod.workflows.submit_form(run.id, node_id='intake', inputs={
        'raw_text': data.raw_text,
        'source': data.source,
        'feedback_id': feedback_id,
    })
    return BugIngestResult(
        feedback_id=feedback_id,
        workflow_run_id=str(run.id),
        status=str(run.status),
    )
