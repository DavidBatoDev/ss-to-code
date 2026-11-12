import asyncio
import logging
import os
import time

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from .prompts import STACKS, build_messages

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("ss-to-code")

MODEL = os.getenv("OPENAI_MODEL", "gpt-6-luna")
# Models users may pick (comma-separated). The default model is always allowed.
MODELS = list(dict.fromkeys([MODEL, *filter(None, os.getenv(
    "OPENAI_MODELS", "gpt-6-luna,gpt-6-sol,gpt-6-astra,gpt-5.5,gpt-5.4-mini").split(","))]))
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(8 * 1024 * 1024)))

app = FastAPI(title="ss-to-code API", version=os.getenv("APP_VERSION", "dev"))
# No CORS: CloudFront serves the frontend and /api/* from the same origin.

_client: AsyncOpenAI | None = None


def client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not os.getenv("OPENAI_API_KEY"):
            raise HTTPException(503, "OPENAI_API_KEY is not configured")
        _client = AsyncOpenAI(max_retries=3, timeout=300)
    return _client


class GenerateRequest(BaseModel):
    image: str | None = Field(None, description="data:image/...;base64,... URL")
    stack: str = "html_tailwind"
    code: str | None = None
    instruction: str | None = None
    model: str | None = None


@app.get("/health")
@app.get("/api/health")  # reachable through CloudFront's /api/* route
async def health():
    return {"status": "ok", "version": app.version}


@app.get("/api/stacks")
async def stacks():
    return list(STACKS.keys())


@app.get("/api/models")
async def models():
    return {"default": MODEL, "models": MODELS}


@app.post("/api/generate")
async def generate(req: GenerateRequest):
    if req.stack not in STACKS:
        raise HTTPException(400, f"Unknown stack {req.stack}")
    if not req.image and not (req.code and req.instruction):
        raise HTTPException(400, "Provide an image, or code + instruction")
    if req.image:
        if not req.image.startswith("data:image/"):
            raise HTTPException(400, "image must be a data:image URL")
        if len(req.image) * 3 / 4 > MAX_IMAGE_BYTES:
            raise HTTPException(413, "Image too large")

    model = req.model or MODEL
    if model not in MODELS:
        raise HTTPException(400, f"Model {model} is not enabled")
    messages = build_messages(req.image, req.stack, req.code, req.instruction)
    oa = client()

    async def stream():
        start = time.monotonic()
        sent = False
        try:
            for attempt in range(1, 4):
                try:
                    resp = await oa.chat.completions.create(
                        model=model, messages=messages, stream=True, max_completion_tokens=16000
                    )
                    async for chunk in resp:
                        if chunk.choices and chunk.choices[0].delta.content:
                            sent = True
                            yield chunk.choices[0].delta.content
                    return
                except Exception as e:  # noqa: BLE001 - any upstream failure triggers a retry
                    log.warning("generation attempt %d failed: %s", attempt, e)
                    # Can't transparently retry once output has reached the client.
                    if sent or attempt == 3:
                        msg = "The AI connection dropped mid-response. Please try again." if sent else (
                            f"OpenAI request failed after {attempt} attempts: {e}")
                        yield f"\n<!-- ERROR: {msg} -->"
                        return
                    await asyncio.sleep(attempt * 1.5)
        finally:
            log.info("generate model=%s stack=%s duration=%.1fs", model, req.stack, time.monotonic() - start)

    return StreamingResponse(stream(), media_type="text/plain; charset=utf-8",
                             headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"})
