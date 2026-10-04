import asyncio
import ipaddress
import re
import socket
from typing import AsyncGenerator


HOP_RE = re.compile(
    r"^\s*(\d+)\s+"
    r"(?:(\d{1,3}(?:\.\d{1,3}){3})|\*)"
    r"(?:\s+.*?(\d+(?:\.\d+)?)\s*ms)?"
)


def validate_target(target: str) -> str:
    target = target.strip()

    if not target:
        raise ValueError("Target cannot be empty")

    if len(target) > 253:
        raise ValueError("Target is too long")

    # Remove URL scheme if user enters it accidentally.
    target = re.sub(r"^https?://", "", target, flags=re.IGNORECASE)

    # Remove path.
    target = target.split("/")[0]

    # Allow IP addresses.
    try:
        ipaddress.ip_address(target)
        return target
    except ValueError:
        pass

    # Validate hostname.
    if not re.fullmatch(
        r"[A-Za-z0-9](?:[A-Za-z0-9.-]{0,251}[A-Za-z0-9])?",
        target,
    ):
        raise ValueError("Invalid hostname")

    return target


async def resolve_target(target: str) -> str:
    loop = asyncio.get_running_loop()
    try:
        info = await loop.getaddrinfo(
            target,
            None,
            family=socket.AF_INET,
            type=socket.SOCK_DGRAM,
        )

        if not info:
            raise ValueError("Unable to resolve target")

        return info[0][4][0]

    except socket.gaierror as exc:
        raise ValueError(f"DNS resolution failed: {exc}") from exc


def parse_traceroute_line(line: str):
    match = HOP_RE.match(line)

    if not match:
        return None

    hop_number = int(match.group(1))
    ip = match.group(2)
    latency = match.group(3)

    return {
        "hop": hop_number,
        "ip": ip,
        "latency_ms": float(latency) if latency else None,
        "timeout": ip is None,
    }


async def run_traceroute(target: str) -> AsyncGenerator[dict, None]:

    target = validate_target(target)
    resolved_ip = await resolve_target(target)

    command = [
        "traceroute",
        "-n",
        "-q",
        "1",
        "-w",
        "1",
        "-m",
        "20",
        "-4",
        "--",
        target,
    ]

    process = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
    )

    try:
        yield {
            "type": "start",
            "target": target,
            "resolved_ip": resolved_ip,
        }

        assert process.stdout is not None

        async for raw_line in process.stdout:
            line = raw_line.decode("utf-8", errors="replace").strip()

            if not line:
                continue

            parsed = parse_traceroute_line(line)

            if parsed:
                parsed["raw"] = line

                yield {
                    "type": "hop",
                    **parsed,
                }

        return_code = await process.wait()

        yield {
            "type": "complete",
            "return_code": return_code,
        }
    finally:
        if process.returncode is None:
            try:
                process.terminate()
                await process.wait()
            except ProcessLookupError:
                pass

