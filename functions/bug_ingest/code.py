#input_type_name: BugIngestInput
#output_type_name: BugIngestResult
#function_name: bug_ingest

import json
import re
import time
from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class BugIngestInput(BaseModel):
    raw_text: str
    source: str = 'manual'

class BugIngestResult(BaseModel):
    feedback_id: str
    workflow_run_id: str
    status: str
    is_duplicate: bool = False
    duplicate_id: str | None = None
    similarity: float = 0.0
    dedup_error: str | None = None

def _extract_answer(output):
    """Extract answer string from output, whether dict or object."""
    if output is None:
        return None
    if isinstance(output, dict):
        return output.get('answer') or output.get('text') or None
    for attr in ('answer', 'text'):
        val = getattr(output, attr, None)
        if val:
            return str(val)
    return str(output) if output else None

def _parse_json_from_text(raw):
    """Parse JSON from text, handling markdown fences and embedded JSON objects."""
    text = raw.strip()
    # Strip markdown fences
    text = re.sub(r'^```json\s*|\s*```$', '', text).strip()
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Extract first {...} block from prose
    m = re.search(r'\{[^{}]*\}', text, re.DOTALL)
    if m:
        return json.loads(m.group(0))
    raise ValueError(f'No JSON found in: {text[:80]}')

def run_agent_and_get_response(pod, agent_name, message):
    conv = pod.agents.run(agent_name, message)
    # pod.agents.run() is synchronous — output may already be on conv
    raw = _extract_answer(getattr(conv, 'output', None))
    if raw and raw.strip():
        return _parse_json_from_text(raw)
    # Fall back to polling if output not ready
    cid = str(conv.id)
    c = conv
    while True:
        c = pod.conversations.get(cid)
        status = getattr(c, 'last_run_status', None) or getattr(c, 'status', None)
        if status in ('COMPLETED', 'FAILED', 'STOPPED'):
            break
        time.sleep(1)
    raw = _extract_answer(getattr(c, 'output', None))
    if raw and raw.strip():
        return _parse_json_from_text(raw)
    return None

async def bug_ingest(ctx: FunctionContext, data: BugIngestInput) -> BugIngestResult:
    pod = Pod.from_env()
    rec = pod.records.create('feedback', {
        'raw_text': data.raw_text,
        'source': data.source,
        'status': 'pending',
    })
    feedback_id = str(rec['id'])

    is_duplicate = False
    duplicate_id = None
    similarity = 0.0
    dedup_error = None
    try:
        result = run_agent_and_get_response(pod, 'dedup-confirmer', f'Check if this is a duplicate: {data.raw_text}')
        if result:
            is_duplicate = bool(result.get('is_duplicate', False))
            duplicate_id = result.get('duplicate_id') or None
            similarity = float(result.get('similarity', 0.0))
    except Exception as e:
        dedup_error = str(e)[:100]
        similarity = -1.0

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
        is_duplicate=is_duplicate,
        duplicate_id=str(duplicate_id) if duplicate_id else None,
        similarity=similarity,
        dedup_error=dedup_error,
    )
