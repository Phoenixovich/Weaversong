import asyncio
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, List

import httpx

BASE_URL = "http://localhost:8000"
OUTPUT_PATH = Path(__file__).resolve().parent / "citypulse_ai_analysis_results.json"

PROMPTS: List[Dict[str, Any]] = [
    {
        "name": "fire_magheru",
        "text": "URGENT: Fire reported in apartment building on Bulevardul Magheru. Fire department on scene. Evacuate immediately if in the area.",
        "user_lat": 44.4247,
        "user_lng": 26.0907,
        "is_speech": False,
    },
    {
        "name": "lost_dog_herastrau",
        "text": "Lost golden retriever near Herastrau Park. Wearing a blue collar. Please call 0700-123-456 if found.",
        "user_lat": None,
        "user_lng": None,
        "is_speech": False,
    },
    {
        "name": "road_closure_cvictoriei",
        "text": "Heads up: Road closure on Calea Victoriei between Universitate and Piata Romana due to overnight construction. Expect delays.",
        "user_lat": 44.4398,
        "user_lng": 26.0976,
        "is_speech": False,
    },
    {
        "name": "not_an_alert",
        "text": "Anyone know a good pizza place in Bucharest?",
        "user_lat": None,
        "user_lng": None,
        "is_speech": False,
    },
]


def build_payload(entry: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "text": entry["text"],
        "user_lat": entry.get("user_lat"),
        "user_lng": entry.get("user_lng"),
        "is_speech": entry.get("is_speech", False),
    }


async def run_suite() -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        for entry in PROMPTS:
            payload = build_payload(entry)
            record: Dict[str, Any] = {
                "name": entry["name"],
                "text": entry["text"],
                "payload": payload,
                "timestamp": datetime.now(UTC).isoformat(),
            }
            try:
                response = await client.post("/citypulse/alerts/analyze", json=payload)
                record["status_code"] = response.status_code
                try:
                    record["response"] = response.json()
                except json.JSONDecodeError:
                    record["response"] = response.text
                print(f"[{entry['name']}] status={response.status_code} response={record['response']}")
            except httpx.HTTPError as exc:
                record["status_code"] = None
                record["error"] = str(exc)
                print(f"[{entry['name']}] error={record['error']}")
            results.append(record)
    return results


async def main() -> None:
    results = await run_suite()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Saved CityPulse AI analysis results to {OUTPUT_PATH}")


if __name__ == "__main__":
    asyncio.run(main())
