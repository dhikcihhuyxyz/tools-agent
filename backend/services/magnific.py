import httpx
from sqlalchemy.orm import Session
from services.key_rotator import (
    get_available_keys,
    mark_key_as_limited,
    mark_key_as_used,
    mark_key_error,
)
from services.activity_logger import create_activity_log

MAGNIFIC_BASE_URL = "https://api.magnific.com"


# ─── Model endpoint mapping ───────────────────────
MODEL_CONFIG = {
    "kling-2.6-motion": {
        "generate": "/v1/ai/video/kling-v2-6-motion-control-pro",
        "status": "/v1/ai/image-to-video/kling-v2-6",
    },
    "kling-2.6-std-motion": {
        "generate": "/v1/ai/video/kling-v2-6-motion-control-std",
        "status": "/v1/ai/image-to-video/kling-v2-6",
    },
    "kling-2.6-pro": {
        "generate": "/v1/ai/image-to-video/kling-v2-6-pro",
        "status": "/v1/ai/image-to-video/kling-v2-6",
    },
    "kling-o1-pro": {
        "generate": "/v1/ai/image-to-video/kling-o1-pro",
        "status": "/v1/ai/image-to-video/kling-o1",
    },
    "kling-o1-std": {
        "generate": "/v1/ai/image-to-video/kling-o1-std",
        "status": "/v1/ai/image-to-video/kling-o1",
    },
    "kling-v3-pro": {
        "generate": "/v1/ai/video/kling-v3-pro",
        "status": "/v1/ai/video/kling-v3",
    },
    "kling-v3-std": {
        "generate": "/v1/ai/video/kling-v3-std",
        "status": "/v1/ai/video/kling-v3",
    },
    "kling-v3-motion-pro": {
        "generate": "/v1/ai/video/kling-v3-motion-control-pro",
        "status": "/v1/ai/video/kling-v3-motion-control-pro",
    },
    "kling-4k-i2v": {
        "generate": "/v1/ai/video/kling-4k-i2v",
        "status": "/v1/ai/video/kling-4k-i2v",
    },
    "kling-2.5-pro": {
        "generate": "/v1/ai/image-to-video/kling-v2-5-pro",
        "status": "/v1/ai/image-to-video/kling-v2-5-pro",
    },
}


def extract_task_id(result: dict) -> str | None:
    if not isinstance(result, dict):
        return None

    data = result.get("data") if isinstance(result.get("data"), dict) else {}

    return (
        result.get("task_id") or
        result.get("id") or
        result.get("taskId") or
        data.get("task_id") or
        data.get("id") or
        data.get("taskId")
    )


def normalize_status_response(result: dict) -> dict:
    if not isinstance(result, dict):
        return {
            "task_id": None,
            "status": "processing",
            "result_url": None,
            "progress": 0,
            "raw_response": result,
        }

    data = result.get("data") if isinstance(result.get("data"), dict) else result

    raw_status = data.get("status") or result.get("status") or "processing"
    raw_status = str(raw_status).lower()

    status_map = {
        "completed": "completed",
        "complete": "completed",
        "success": "completed",
        "succeeded": "completed",
        "done": "completed",

        "failed": "failed",
        "failure": "failed",
        "error": "failed",

        "processing": "processing",
        "running": "processing",
        "in_progress": "processing",
        "generating": "processing",

        "queued": "queued",
        "pending": "queued",
    }

    status = status_map.get(raw_status, raw_status)

    generated = data.get("generated") or result.get("generated")
    result_url = None

    if isinstance(generated, list) and len(generated) > 0:
        result_url = generated[0]
    elif isinstance(generated, str):
        result_url = generated

    result_url = (
        result_url or
        data.get("result_url") or
        result.get("result_url") or
        data.get("video_url") or
        result.get("video_url") or
        data.get("output_url") or
        result.get("output_url") or
        data.get("url") or
        result.get("url")
    )

    task_id = (
        data.get("task_id") or
        result.get("task_id") or
        data.get("id") or
        result.get("id") or
        data.get("taskId") or
        result.get("taskId")
    )

    progress = data.get("progress") or result.get("progress")

    if progress is None:
        progress = 100 if status == "completed" else 0

    return {
        "task_id": task_id,
        "status": status,
        "result_url": result_url,
        "progress": progress,
        "raw_response": result,
    }


def is_limit_error(status_code: int, response_text: str) -> bool:
    text = (response_text or "").lower()

    limit_keywords = [
        "rate limit",
        "ratelimit",
        "quota",
        "too many requests",
        "limit exceeded",
        "insufficient quota",
        "credits",
        "credit",
    ]

    if status_code == 429:
        return True

    return any(keyword in text for keyword in limit_keywords)


async def generate_video(
    model: str,
    prompt: str,
    image_url: str,
    video_ref_url: str | None,
    duration: int,
    aspect_ratio: str,
    db: Session,
    user_id: int | None = None,
) -> dict:
    config = MODEL_CONFIG.get(model)

    if not config:
        return {"error": f"Model '{model}' tidak dikenali."}

    available_keys = get_available_keys("magnific", db, user_id=user_id)

    if not available_keys:
        create_activity_log(
            db=db,
            user_id=user_id,
            action="generate_failed",
            module="magnific",
            status="failed",
            title="Generate gagal",
            description="Tidak ada API key Magnific aktif untuk akun ini.",
            metadata={
                "model": model,
                "reason": "no_active_api_key",
            },
        )

        return {
            "error": "Tidak ada API key Magnific aktif untuk akun ini. Tambahkan API key di API Vault."
        }

    payload = {
        "prompt": prompt,
        "image_url": image_url,
        "duration": duration,
        "aspect_ratio": aspect_ratio,
    }

    if video_ref_url:
        payload["video_url"] = video_ref_url

    print(f"[Magnific] Sending to: {MAGNIFIC_BASE_URL}{config['generate']}")
    print(f"[Magnific] Payload: {payload}")
    print(f"[Magnific] Available keys for failover: {len(available_keys)}")

    last_error = None

    async with httpx.AsyncClient(timeout=30) as client:
        for index, key in enumerate(available_keys):
            headers = {
                "x-magnific-api-key": key.key_value,
                "Content-Type": "application/json",
            }

            print(f"[Magnific] Trying API key: {key.name} priority={key.priority}")

            try:
                response = await client.post(
                    f"{MAGNIFIC_BASE_URL}{config['generate']}",
                    json=payload,
                    headers=headers,
                )

                print(f"[Magnific] Response {response.status_code}: {response.text}")

                if response.status_code in [200, 201]:
                    result = response.json()
                    task_id = extract_task_id(result)

                    if not task_id:
                        last_error = f"Magnific tidak mengembalikan task_id: {result}"

                        mark_key_error(
                            key.key_value,
                            "magnific",
                            db,
                            last_error,
                            user_id=user_id,
                        )

                        create_activity_log(
                            db=db,
                            user_id=user_id,
                            action="generate_failed",
                            module="magnific",
                            status="failed",
                            title="Generate gagal",
                            description="Magnific tidak mengembalikan task_id.",
                            metadata={
                                "model": model,
                                "key_id": key.id,
                                "key_name": key.name,
                                "error": last_error,
                            },
                        )

                        continue

                    mark_key_as_used(
                        key.key_value,
                        "magnific",
                        db,
                        user_id=user_id,
                    )

                    create_activity_log(
                        db=db,
                        user_id=user_id,
                        action="api_key_used",
                        module="magnific",
                        status="success",
                        title="API key berhasil digunakan",
                        description=f"API key '{key.name}' berhasil digunakan untuk generate video.",
                        metadata={
                            "key_id": key.id,
                            "key_name": key.name,
                            "service": "magnific",
                            "model": model,
                            "task_id": task_id,
                        },
                    )

                    result["task_id"] = task_id
                    result["_used_key_id"] = key.id
                    result["_used_key_name"] = key.name

                    return result

                if is_limit_error(response.status_code, response.text):
                    last_error = f"Key limit/quota: HTTP {response.status_code}: {response.text}"

                    mark_key_as_limited(
                        key.key_value,
                        "magnific",
                        db,
                        error_message=last_error,
                        user_id=user_id,
                    )

                    if index < len(available_keys) - 1:
                        next_key = available_keys[index + 1]

                        create_activity_log(
                            db=db,
                            user_id=user_id,
                            action="api_key_failover",
                            module="magnific",
                            status="warning",
                            title="API key failover",
                            description=f"API key '{key.name}' terkena limit. Sistem mencoba key berikutnya: '{next_key.name}'.",
                            metadata={
                                "failed_key_id": key.id,
                                "failed_key_name": key.name,
                                "next_key_id": next_key.id,
                                "next_key_name": next_key.name,
                                "service": "magnific",
                                "model": model,
                                "error": last_error,
                            },
                        )

                    print(f"[Magnific] Key {key.name} limited, trying next key...")
                    continue

                last_error = f"Magnific API error {response.status_code}: {response.text}"

                mark_key_error(
                    key.key_value,
                    "magnific",
                    db,
                    last_error,
                    user_id=user_id,
                )

                if index < len(available_keys) - 1:
                    next_key = available_keys[index + 1]

                    create_activity_log(
                        db=db,
                        user_id=user_id,
                        action="api_key_failover",
                        module="magnific",
                        status="warning",
                        title="API key failover",
                        description=f"API key '{key.name}' gagal. Sistem mencoba key berikutnya: '{next_key.name}'.",
                        metadata={
                            "failed_key_id": key.id,
                            "failed_key_name": key.name,
                            "next_key_id": next_key.id,
                            "next_key_name": next_key.name,
                            "service": "magnific",
                            "model": model,
                            "error": last_error,
                        },
                    )

                continue

            except Exception as e:
                last_error = f"Magnific request exception: {str(e)}"

                mark_key_error(
                    key.key_value,
                    "magnific",
                    db,
                    last_error,
                    user_id=user_id,
                )

                if index < len(available_keys) - 1:
                    next_key = available_keys[index + 1]

                    create_activity_log(
                        db=db,
                        user_id=user_id,
                        action="api_key_failover",
                        module="magnific",
                        status="warning",
                        title="API key failover",
                        description=f"API key '{key.name}' error. Sistem mencoba key berikutnya: '{next_key.name}'.",
                        metadata={
                            "failed_key_id": key.id,
                            "failed_key_name": key.name,
                            "next_key_id": next_key.id,
                            "next_key_name": next_key.name,
                            "service": "magnific",
                            "model": model,
                            "error": last_error,
                        },
                    )

                print(f"[Magnific] Exception with key {key.name}: {str(e)}")
                continue

    create_activity_log(
        db=db,
        user_id=user_id,
        action="generate_failed",
        module="magnific",
        status="failed",
        title="Generate gagal",
        description="Semua API key Magnific gagal atau terkena limit.",
        metadata={
            "model": model,
            "available_keys": len(available_keys),
            "last_error": last_error,
        },
    )

    return {
        "error": (
            "Semua API key Magnific gagal atau terkena limit. "
            f"Error terakhir: {last_error or 'Tidak diketahui'}"
        )
    }


async def check_video_status(
    model: str,
    task_id: str,
    db: Session,
    user_id: int | None = None,
) -> dict:
    config = MODEL_CONFIG.get(model, {})
    status_base = config.get("status", "/v1/ai/image-to-video/kling-v2-6")
    endpoint = f"{status_base}/{task_id}"

    available_keys = get_available_keys("magnific", db, user_id=user_id)

    if not available_keys:
        create_activity_log(
            db=db,
            user_id=user_id,
            action="status_check_failed",
            module="magnific",
            status="failed",
            title="Cek status gagal",
            description="Tidak ada API key Magnific aktif untuk akun ini.",
            metadata={
                "model": model,
                "task_id": task_id,
                "reason": "no_active_api_key",
            },
        )

        return {
            "error": "Tidak ada API key Magnific aktif untuk akun ini. Tambahkan API key di API Vault."
        }

    last_error = None

    async with httpx.AsyncClient(timeout=30) as client:
        for index, key in enumerate(available_keys):
            headers = {
                "x-magnific-api-key": key.key_value,
            }

            print(f"[Magnific] Checking status with key: {key.name}")

            try:
                response = await client.get(
                    f"{MAGNIFIC_BASE_URL}{endpoint}",
                    headers=headers,
                )

                print(f"[Magnific] Status Response {response.status_code}: {response.text}")

                if response.status_code == 200:
                    mark_key_as_used(
                        key.key_value,
                        "magnific",
                        db,
                        user_id=user_id,
                    )

                    result = response.json()
                    normalized = normalize_status_response(result)
                    normalized["_used_key_id"] = key.id
                    normalized["_used_key_name"] = key.name

                    return normalized

                if is_limit_error(response.status_code, response.text):
                    last_error = f"Key limit/quota saat cek status: HTTP {response.status_code}: {response.text}"

                    mark_key_as_limited(
                        key.key_value,
                        "magnific",
                        db,
                        error_message=last_error,
                        user_id=user_id,
                    )

                    if index < len(available_keys) - 1:
                        next_key = available_keys[index + 1]

                        create_activity_log(
                            db=db,
                            user_id=user_id,
                            action="api_key_failover",
                            module="magnific",
                            status="warning",
                            title="API key failover saat cek status",
                            description=f"API key '{key.name}' terkena limit saat cek status. Sistem mencoba key berikutnya: '{next_key.name}'.",
                            metadata={
                                "task_id": task_id,
                                "failed_key_id": key.id,
                                "failed_key_name": key.name,
                                "next_key_id": next_key.id,
                                "next_key_name": next_key.name,
                                "service": "magnific",
                                "model": model,
                                "error": last_error,
                            },
                        )

                    print(f"[Magnific] Key {key.name} limited on status check, trying next key...")
                    continue

                last_error = f"Gagal cek status: HTTP {response.status_code}: {response.text}"

                mark_key_error(
                    key.key_value,
                    "magnific",
                    db,
                    last_error,
                    user_id=user_id,
                )

                continue

            except Exception as e:
                last_error = f"Magnific status exception: {str(e)}"

                mark_key_error(
                    key.key_value,
                    "magnific",
                    db,
                    last_error,
                    user_id=user_id,
                )

                print(f"[Magnific] Status exception with key {key.name}: {str(e)}")
                continue

    create_activity_log(
        db=db,
        user_id=user_id,
        action="status_check_failed",
        module="magnific",
        status="failed",
        title="Cek status gagal",
        description="Semua API key Magnific gagal saat cek status.",
        metadata={
            "task_id": task_id,
            "model": model,
            "available_keys": len(available_keys),
            "last_error": last_error,
        },
    )

    return {
        "error": (
            "Semua API key Magnific gagal saat cek status. "
            f"Error terakhir: {last_error or 'Tidak diketahui'}"
        )
    }