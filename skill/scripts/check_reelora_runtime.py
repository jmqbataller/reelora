#!/usr/bin/env python3
"""Non-destructive runtime check for the Reelora ChatGPT Skill.

This script never edits media. It only reports whether FFmpeg/FFprobe are available
for deterministic local rendering. If unavailable, use the Reelora MCP backend.
"""

from __future__ import annotations

import json
import shutil
import subprocess


def version(binary: str) -> str | None:
    path = shutil.which(binary)
    if not path:
        return None
    try:
        result = subprocess.run(
            [path, "-version"],
            check=True,
            capture_output=True,
            text=True,
            timeout=8,
        )
        return result.stdout.splitlines()[0] if result.stdout else binary
    except Exception:
        return None


result = {
    "ffmpeg": version("ffmpeg"),
    "ffprobe": version("ffprobe"),
}
result["local_rendering_ready"] = bool(result["ffmpeg"] and result["ffprobe"])
result["recommended_path"] = (
    "deterministic_local_ffmpeg"
    if result["local_rendering_ready"]
    else "reelora_mcp_backend_required"
)
print(json.dumps(result, indent=2))
