from __future__ import annotations

import json
import re
import sys
from typing import Any


CHINESE_CHANGE_TERMS = (
    "\u63d0\u4ea4|\u63a8\u9001|\u91cd\u6784|\u4fee\u6539|"
    "\u65b0\u589e|\u4fee\u590d|\u6539\u52a8|\u66f4\u65b0"
)

CHINESE_ARCH_TERMS = (
    "\u67b6\u6784\u81ea\u68c0|\u67b6\u6784\u68c0\u67e5|\u67b6\u6784 gate|"
    "\u91cd\u6784\u6e05\u5355|\u81ea\u68c0\u6e05\u5355"
)


CHANGE_RE = re.compile(
    r"\b(added|changed|created|updated|modified|implemented|fixed|refactored|wrote|edited|patched|committed|pushed)\b|"
    f"({CHINESE_CHANGE_TERMS})",
    re.IGNORECASE,
)

CODE_PATH_RE = re.compile(
    r"(`[^`]+\.(js|mjs|ts|tsx|rs|ps1|json|md)`|\b(main|commands|render|events|io)\.js\b)",
    re.IGNORECASE,
)

ARCH_RE = re.compile(
    r"(Validate\.cmd|check-architecture\.ps1|Architecture check passed|architecture check passed|"
    r"architecture self-check|architecture check|architecture gate|refactor-architecture-checklist|"
    f"{CHINESE_ARCH_TERMS})",
    re.IGNORECASE,
)


def read_event() -> dict[str, Any]:
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            return {}
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def continue_turn(reason: str) -> None:
    sys.stdout.write(json.dumps({"decision": "block", "reason": reason.strip()}, ensure_ascii=True, separators=(",", ":")))


def main() -> None:
    event = read_event()
    if event.get("stop_hook_active"):
        return

    last_message = str(event.get("last_assistant_message") or "")
    if not last_message:
        return

    if (CHANGE_RE.search(last_message) or CODE_PATH_RE.search(last_message)) and not ARCH_RE.search(last_message):
        continue_turn(
            "RustAndLogic code/refactor work must report architecture self-check evidence. Run or mention Validate.cmd, scripts/check-architecture.ps1, or docs/refactor-architecture-checklist.md before the final answer."
        )


if __name__ == "__main__":
    main()
