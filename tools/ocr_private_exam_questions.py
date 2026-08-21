"""OCR damaged-text questions in the ignored private exam pack.

This utility never writes source text into the public application. It produces
an ignored review/recovery JSON that is consumed by build_private_exam_pack.py.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
import pdfplumber


def load_builder():
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import build_private_exam_pack as builder

    return builder


def source_index(source_root: Path) -> dict[str, Path]:
    manifest = json.loads((source_root / "_generated" / "source-manifest.json").read_text(encoding="utf-8"))
    return {row["source_file"]: source_root / row["relative_path"] for row in manifest["records"]}


def segments_for(pdf, builder):
    segments = []
    for page_index, page in enumerate(pdf.pages[:-1]):
        halves = ((0, 0, page.width / 2, page.height), (page.width / 2, 0, page.width, page.height))
        for half in halves:
            segments.append((page_index, page, half, builder.question_positions(page, half)))
    return segments


def location_for(segments, number: int):
    return next(
        ((page_index, half) for page_index, _, half, positions in segments if any(candidate == number for candidate, _ in positions)),
        None,
    )


def top_left(box):
    return min(point[1] for point in box), min(point[0] for point in box)


def clean_ocr_line(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--pack", type=Path, default=Path("private-source/jeongbo-2020-2025-private-pack.json"))
    parser.add_argument("--output", type=Path, default=Path("private-source/ocr-review.json"))
    parser.add_argument("--module-root", type=Path, required=True)
    parser.add_argument("--model-root", type=Path, required=True)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--unresolved-only", action="store_true")
    parser.add_argument("--image-dir", type=Path)
    parser.add_argument("--native-only", action="store_true")
    args = parser.parse_args()

    builder = load_builder()
    pack = json.loads(args.pack.read_text(encoding="utf-8"))
    targets = [question for question in pack["questions"] if question.get("stem", "").startswith("원문 이미지")]
    if args.limit:
        targets = targets[: args.limit]
    sources = source_index(args.source_root)
    reader = None
    if not args.native_only:
        sys.path.insert(0, str(args.module_root.resolve()))
        import easyocr

        reader = easyocr.Reader(
            ["ko", "en"],
            gpu=False,
            model_storage_directory=str(args.model_root),
            download_enabled=False,
            verbose=False,
        )
    rows = {}
    for source_name in dict.fromkeys(question["sourceLabel"] for question in targets):
        selected = [question for question in targets if question["sourceLabel"] == source_name]
        with pdfplumber.open(sources[source_name]) as pdf:
            segments = segments_for(pdf, builder)
            for question in selected:
                number = question["sourceQuestionNumber"]
                location = location_for(segments, number)
                native = builder.structured_text_for_question(segments, number, location)
                if args.unresolved_only and native:
                    continue
                image = builder.question_image(segments, number, location, resolution=240) if not args.native_only or args.image_dir else None
                if image is None and not args.native_only:
                    raise RuntimeError(f"문항 이미지를 만들 수 없습니다: {question['id']}")
                detections = [] if reader is None else reader.readtext(np.asarray(image), detail=1, paragraph=False, batch_size=1)
                detections.sort(key=lambda row: top_left(row[0]))
                key = f"{question['year']}-{question['round'].split('년 ')[1].split('회')[0].replace('1·2', '1-2')}-{number}"
                if args.image_dir and image is not None:
                    args.image_dir.mkdir(parents=True, exist_ok=True)
                    image.save(args.image_dir / f"{key}.jpg", quality=92)
                rows[key] = {
                    "id": question["id"],
                    "source": source_name,
                    "number": number,
                    "nativeText": "\n---\n".join(
                        (crop.extract_text(x_tolerance=2, y_tolerance=3) or "")
                        for crop, _, _ in builder.question_crops(segments, number, location)
                    ),
                    "lines": [clean_ocr_line(text) for _, text, confidence in detections if confidence >= 0.18],
                    "detections": [
                        {
                            "box": [[round(float(x), 2), round(float(y), 2)] for x, y in box],
                            "text": clean_ocr_line(text),
                            "confidence": round(float(confidence), 4),
                        }
                        for box, text, confidence in detections
                        if confidence >= 0.18
                    ],
                }
                print(json.dumps({"key": key, "lines": rows[key]["lines"]}, ensure_ascii=False), flush=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"questions": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output.resolve()), "questions": len(rows)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
