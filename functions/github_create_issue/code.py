#input_type_name: GithubCreateIssueInput
#output_type_name: GithubCreateIssueResult
#function_name: github_create_issue

import httpx
from pydantic import BaseModel
from lemma_sdk import FunctionContext, Pod

REPO = "harsha8876/JavaProject"
SAFE_LABELS = {"bug", "documentation", "duplicate", "enhancement", "good first issue", "help wanted", "invalid", "question", "wontfix"}

class GithubCreateIssueInput(BaseModel):
    title: str
    body: str = ""
    labels: list[str] = []
    debug: bool = False

class GithubCreateIssueResult(BaseModel):
    ok: bool
    issue_url: str | None = None
    issue_number: int | None = None
    error: str | None = None

async def github_create_issue(ctx: FunctionContext, data: GithubCreateIssueInput) -> GithubCreateIssueResult:
    pod = Pod.from_env()
    try:
        rows = pod.records.list("secrets", filter=[{"field": "key", "op": "eq", "value": "github_pat"}])
        items = rows.items if hasattr(rows, "items") else rows
        if not items:
            return GithubCreateIssueResult(ok=False, error="github_pat not found in secrets table")
        item = items[0]
        # additional_properties holds the flat record fields on RecordListResponseItemsItem
        props = getattr(item, "additional_properties", None)
        if props and props.get("value"):
            token = str(props["value"])
        else:
            dump = item.model_dump() if hasattr(item, "model_dump") else dict(item)
            token = str(dump.get("value") or (dump.get("additional_properties") or {}).get("value") or "")
        safe_labels = [l for l in data.labels if l.lower() in SAFE_LABELS]

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.github.com/repos/{REPO}/issues",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github+json",
                },
                json={"title": data.title, "body": data.body, "labels": safe_labels},
                timeout=20,
            )
        if resp.status_code >= 300:
            return GithubCreateIssueResult(ok=False, error=f"{resp.status_code}: {resp.text[:300]}")
        out = resp.json()
        return GithubCreateIssueResult(ok=True, issue_url=out.get("html_url"), issue_number=out.get("number"))
    except Exception as e:
        return GithubCreateIssueResult(ok=False, error=str(e))
