#input_type_name: SlackNotifyInput
#output_type_name: SlackNotifyResult
#function_name: slack_notify

from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

class SlackNotifyInput(BaseModel):
    issue_id: str
    severity: str
    title: str
    approver: str
    decision: str
    channel: str = 'bug-triage'

class SlackNotifyResult(BaseModel):
    ok: bool
    channel: str
    ts: str | None = None
    error: str | None = None

def _sev_emoji(sev: str) -> str:
    return {'P0': 'rotating_light', 'P1': 'warning', 'P2': 'large_blue_circle', 'P3': 'white_check_mark'}.get(sev, 'bell')

async def slack_notify(ctx: FunctionContext, data: SlackNotifyInput) -> SlackNotifyResult:
    pod = Pod.from_env()
    emoji = _sev_emoji(data.severity)
    text = (
        f':{emoji}: *{data.decision.upper()}* — '
        f'`{data.issue_id}` {data.title}\n'
        f'> Reviewer: {data.approver}'
    )
    try:
        result = pod.connectors.execute(
            auth_config='slack',
            operation='chat_post_message',
            payload={'body': {'channel': data.channel, 'text': text}},
        )
        return SlackNotifyResult(ok=bool(result.ok), channel=data.channel, ts=result.ts)
    except Exception as e:
        return SlackNotifyResult(ok=False, channel=data.channel, error=str(e))
