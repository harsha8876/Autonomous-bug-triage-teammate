#input_type_name: ParseDedupInput
#output_type_name: ParseDedupResult
#function_name: parse_dedup

import json
from pydantic import BaseModel
from lemma_sdk import FunctionContext

class ParseDedupInput(BaseModel):
    answer: str

class ParseDedupResult(BaseModel):
    is_duplicate: bool = False
    duplicate_id: str | None = None
    similarity: float = 0.0

async def parse_dedup(ctx: FunctionContext, data: ParseDedupInput) -> ParseDedupResult:
    try:
        parsed = json.loads(data.answer)
        inner = parsed.get('output', parsed)
        return ParseDedupResult(
            is_duplicate=bool(inner.get('is_duplicate', False)),
            duplicate_id=inner.get('duplicate_id'),
            similarity=float(inner.get('similarity', 0.0)),
        )
    except Exception:
        return ParseDedupResult(is_duplicate=False, duplicate_id=None, similarity=0.0)
