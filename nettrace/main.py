import asyncio
import json
from pathlib import Path

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from traceroute import run_traceroute
from geolocation import geolocate


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"


# ---------------------------------------------------------
# FastAPI
# ---------------------------------------------------------

app = FastAPI(
    title="NetTrace API",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Concurrency Control
# ---------------------------------------------------------

CONCURRENCY_LIMITER = asyncio.Semaphore(5)


# ---------------------------------------------------------
# Health
# ---------------------------------------------------------

@app.get("/api/health")
async def health():

    return {
        "status": "ok",
        "service": "nettrace",
    }


# ---------------------------------------------------------
# Real traceroute
# ---------------------------------------------------------

@app.get("/api/traceroute")
async def traceroute(
    target: str = Query(
        ...,
        min_length=1,
        max_length=253,
    )
):

    async def event_stream():

        try:
            async with CONCURRENCY_LIMITER:
                async for event in run_traceroute(target):

                    if event["type"] == "hop":

                        if event.get("ip"):

                            geo = await geolocate(
                                event["ip"]
                            )

                            event.update(geo)

                    yield (
                        f"data: "
                        f"{json.dumps(event)}"
                        f"\n\n"
                    )

        except Exception as exc:

            error = {
                "type": "error",
                "message": str(exc),
            }

            yield (
                f"data: "
                f"{json.dumps(error)}"
                f"\n\n"
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------
# Frontend & Static Files
# ---------------------------------------------------------

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static",
)

app.mount(
    "/",
    StaticFiles(directory=FRONTEND_DIR, html=True),
    name="frontend",
)

