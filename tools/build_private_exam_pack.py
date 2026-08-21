"""Build a personal-use 2020-2025 exam pack from supplied Sinagong PDFs.

The generated pack is written below the ignored private-source directory and
must never be committed or published. Text extraction is used where reliable.
A private OCR recovery file supplies questions whose embedded PDF text is
damaged. Figures may retain a focused crop, but a whole-question image is never
used as a text substitute.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import io
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber
from PIL import Image
from pypdf import PdfReader

YEARS = range(2020, 2026)
MARKS = "①②③④"
MARK_INDEX = {mark: index for index, mark in enumerate(MARKS)}
SUBJECTS = ["소프트웨어 설계", "소프트웨어 개발", "데이터베이스 구축", "프로그래밍 언어 활용", "정보시스템 구축관리"]
QSTART = re.compile(r"(?m)^\s*(\d{1,3})[.)]\s+")
ROUND_RE = re.compile(r"(?:^|년|\s)([1234])회")
ANSWER_RE = re.compile(r"(\d{1,3})\.\s*((?:[①②③④](?:\s*[,，]\s*)?)+|복수정답)")
LAYOUT_HINTS = (
    "다음 그림", "다음 트리", "다음 그래프", "다음 표", "다음 자료", "다음 코드",
    "다음 프로그램", "다음 릴레이션", "다음 SQL", "다음 네트워크", "다음 PERT",
    "실행 결과", "출력 결과", "관계대수식", "NS Chart",
)


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip().replace(" ", " ")


def split_blocks(text: str):
    matches = list(QSTART.finditer(text))
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        yield int(match.group(1)), text[match.end():end].strip()


def parse_body(body: str):
    body = re.sub(r"-\s*\d+\s*-?\s*$", "", body).strip()
    found = list(re.finditer(r"[①②③④]", body))[:4]
    if len(found) < 4:
        return None
    stem = clean(body[:found[0].start()])
    options = []
    for index, match in enumerate(found):
        end = found[index + 1].start() if index + 1 < len(found) else len(body)
        options.append(clean(body[match.end():end]))
    if len(stem) < 4 or any(not option for option in options):
        return None
    return stem, options


def answer_map(pdf, path: Path) -> tuple[dict[int, list[int]], set[int]]:
    text = "\n".join((page.extract_text() or "") for page in pdf.pages[-6:])
    if len(ANSWER_RE.findall(text)) < 90:
        reader = PdfReader(str(path))
        text += "\n" + "\n".join((page.extract_text() or "") for page in reader.pages[-6:])
    answers: dict[int, list[int]] = {}
    voids: set[int] = set()
    for number_text, value in ANSWER_RE.findall(text):
        number = int(number_text)
        if value == "복수정답":
            voids.add(number)
            continue
        found = [MARK_INDEX[mark] for mark in MARKS if mark in value]
        if found:
            answers[number] = found
    return answers, voids


def source_round(filename: str, year: int) -> str | None:
    if year == 2020 and re.search(r"1\s*[,·]\s*2회", filename):
        return "1-2"
    match = ROUND_RE.search(filename)
    return match.group(1) if match else None


def round_label(year: int, round_code: str) -> str:
    return "2020년 1·2회 통합" if year == 2020 and round_code == "1-2" else f"{year}년 {round_code}회"


def question_positions(page, half: tuple[float, float, float, float]):
    words = page.crop(half).extract_words() or []
    positions = []
    left = half[0]
    for word in words:
        match = re.fullmatch(r"(\d{1,3})\.", word.get("text", ""))
        if match and float(word["x0"]) <= left + 54:
            number = int(match.group(1))
            if 1 <= number <= 100:
                positions.append((number, float(word["top"])))
    unique = {}
    for number, top in positions:
        unique.setdefault(number, top)
    return sorted(unique.items(), key=lambda row: row[1])


def render_segment(page, half, top: float, bottom: float):
    top = max(0, top)
    bottom = min(page.height, bottom)
    if bottom <= top + 16:
        return None
    crop = page.crop((half[0], top, half[2], bottom))
    return crop.to_image(resolution=150).original.convert("RGB")


def question_crops(segments, number: int, location):
    start_index = next((index for index, row in enumerate(segments) if row[0] == location[0] and row[2] == location[1]), None)
    if start_index is None:
        return []
    start_positions = segments[start_index][3]
    start_top = next((top for candidate, top in start_positions if candidate == number), None)
    if start_top is None:
        return []
    end_index = None
    end_top = None
    for index in range(start_index, len(segments)):
        next_top = next((top for candidate, top in segments[index][3] if candidate == number + 1), None)
        if next_top is not None:
            end_index, end_top = index, next_top
            break
    if end_index is None:
        end_index = min(start_index + 1, len(segments) - 1)
        end_top = segments[end_index][1].height - 24
    crops = []
    for index in range(start_index, end_index + 1):
        _, page, half, _ = segments[index]
        top = start_top - 8 if index == start_index else 22
        bottom = end_top - 5 if index == end_index else page.height - 24
        if bottom > top + 16:
            crops.append((page.crop((half[0], max(0, top), half[2], min(page.height, bottom))), half, top))
    return crops


def question_image(segments, number: int, location, resolution: int = 150) -> Image.Image | None:
    pieces = [crop.to_image(resolution=resolution).original.convert("RGB") for crop, _, _ in question_crops(segments, number, location)]
    if not pieces:
        return None
    width = max(piece.width for piece in pieces)
    height = sum(piece.height for piece in pieces)
    image = pieces[0] if len(pieces) == 1 else Image.new("RGB", (width, height), "white")
    if len(pieces) > 1:
        offset = 0
        for piece in pieces:
            image.paste(piece, (0, offset))
            offset += piece.height
    return image


def structured_text_for_question(segments, number: int, location):
    """Recover a split question from positioned PDF words and skip distant banners."""
    lines = []
    y_offset = 0.0
    for crop, half, top in question_crops(segments, number, location):
        grouped = []
        words = crop.extract_words(x_tolerance=2, y_tolerance=3) or []
        for word in sorted(words, key=lambda row: (float(row["top"]), float(row["x0"]))):
            y = float(word["top"]) - top
            if not grouped or abs(grouped[-1]["y"] - y) > 2.5:
                grouped.append({"y": y, "words": []})
            grouped[-1]["words"].append((float(word["x0"]) - half[0], word["text"]))
        for line in grouped:
            lines.append({"y": y_offset + line["y"], "words": sorted(line["words"])})
        y_offset += crop.height + 24
    marker_rows = []
    for line_index, line in enumerate(lines):
        for word_index, (_, text) in enumerate(line["words"]):
            if text in MARKS:
                marker_rows.append((line_index, word_index, text))
    if [row[2] for row in marker_rows[:4]] != list(MARKS):
        return None
    marker_rows = marker_rows[:4]
    first_line, first_word, _ = marker_rows[0]
    stem_parts = []
    for line_index, line in enumerate(lines[: first_line + 1]):
        end = first_word if line_index == first_line else len(line["words"])
        texts = [text for _, text in line["words"][:end]]
        if line_index == 0 and texts and re.fullmatch(rf"{number}[.)]", texts[0]):
            texts = texts[1:]
        joined = " ".join(texts)
        if texts and not re.fullmatch(r"-?\s*\d+", joined):
            stem_parts.append(joined)
    options = []
    for index, (line_index, word_index, _) in enumerate(marker_rows):
        next_line = marker_rows[index + 1][0] if index + 1 < 4 else len(lines)
        parts = []
        previous_y = lines[line_index]["y"]
        for candidate_index in range(line_index, next_line):
            line = lines[candidate_index]
            if candidate_index > line_index and line["y"] - previous_y > 18:
                break
            start = word_index + 1 if candidate_index == line_index else 0
            texts = [text for _, text in line["words"][start:]]
            joined = " ".join(texts)
            if texts and not re.fullmatch(r"-?\s*\d+", joined):
                parts.append(joined)
                previous_y = line["y"]
        options.append(clean(" ".join(parts)))
    stem = clean(" ".join(stem_parts))
    if len(stem) < 4 or any(not option for option in options):
        return None
    return stem, options


def image_for_question(segments, number: int, location) -> str | None:
    image = question_image(segments, number, location)
    if image is None:
        return None
    output = io.BytesIO()
    image.save(output, format="JPEG", quality=84, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(output.getvalue()).decode("ascii")


def record_for(year: int, round_code: str, source: str, number: int, parsed, answer, void, image_data, recovery=None):
    subject = SUBJECTS[min((number - 1) // 20, 4)]
    recovery = recovery or {}
    if recovery:
        parsed = (recovery.get("stem", ""), recovery.get("options", []))
    if parsed:
        stem, options = parsed
    else:
        stem = f"원문 이미지의 {number}번 문항을 보고 답하세요."
        options = ["①", "②", "③", "④"]
    is_void = void or answer is None
    label = round_label(year, round_code)
    if recovery.get("layoutHtml"):
        layout = {"kind": "html", "html": recovery["layoutHtml"]}
    else:
        layout = {"kind": "image", "imageData": image_data, "alt": f"{label} {number}번 참고 자료"} if image_data else {"kind": "text"}
    digest = hashlib.sha1(f"{year}-{round_code}-{number}-{source}".encode("utf-8")).hexdigest()[:10]
    return {
        "id": f"PAST-{year}-{round_code}-{number:03d}-{digest}",
        "examName": "정보처리기사 필기",
        "year": year,
        "round": label,
        "subject": subject,
        "unit": "기출문제",
        "learningObjective": "실제 기출문항 풀이",
        "criteria": "개인 소장 기출자료",
        "difficulty": "중",
        "type": "기출",
        "stem": stem,
        "options": options,
        "answer": answer or [0],
        "acceptAny": bool(answer and len(answer) > 1),
        "void": is_void,
        "explanation": "정답표와 대조한 기출문항입니다." if not is_void else "원본 정답표에서 정답을 하나로 확정할 수 없어 채점에서 제외합니다.",
        "optionReasons": ["원본 기출 정답표를 기준으로 판단합니다."] * 4,
        "sourceType": "복원",
        "sourcePolicy": "private-source",
        "sourceLabel": source,
        "sourceQuestionNumber": number,
        "layout": layout,
    }


def build_pdf(path: Path, year: int, round_code: str, recoveries: dict):
    with pdfplumber.open(path) as pdf:
        answers, voids = answer_map(pdf, path)
        parsed_by_number = {}
        location_by_number = {}
        segments = []
        for page_index, page in enumerate(pdf.pages[:-1]):
            halves = ((0, 0, page.width / 2, page.height), (page.width / 2, 0, page.width, page.height))
            for half in halves:
                positions = question_positions(page, half)
                segments.append((page_index, page, half, positions))
                text = page.crop(half).extract_text(x_tolerance=2, y_tolerance=3) or ""
                for number, body in split_blocks(text):
                    if 1 <= number <= 100:
                        parsed = parse_body(body)
                        if parsed:
                            parsed_by_number.setdefault(number, parsed)
                        location_by_number.setdefault(number, (page_index, half))
        questions = []
        image_count = 0
        reconstructed_count = 0
        for number in range(1, 101):
            parsed = parsed_by_number.get(number)
            location = location_by_number.get(number)
            if location is None:
                location = next(((page_index, half) for page_index, _, half, positions in segments if any(candidate == number for candidate, _ in positions)), None)
            if parsed is None and location:
                parsed = structured_text_for_question(segments, number, location)
                if parsed:
                    reconstructed_count += 1
            recovery_key = f"{year}-{round_code}-{number}"
            recovery = recoveries.get(recovery_key)
            effective = parsed or ((recovery.get("stem"), recovery.get("options")) if recovery else None)
            needs_image = bool(effective and any(hint.lower() in effective[0].lower() for hint in LAYOUT_HINTS))
            image_data = image_for_question(segments, number, location) if needs_image and location else None
            if image_data:
                image_count += 1
            questions.append(record_for(year, round_code, path.name, number, parsed, answers.get(number), number in voids, image_data, recovery))
        return questions, {
            "year": year,
            "round": round_label(year, round_code),
            "roundCode": round_code,
            "source": path.name,
            "questions": len(questions),
            "parsed": len(parsed_by_number),
            "reconstructed": reconstructed_count,
            "images": image_count,
            "void": sum(question["void"] for question in questions),
            "missingImages": [question["sourceQuestionNumber"] for question in questions if question["stem"].startswith("원문 이미지") and question["layout"]["kind"] != "image"],
        }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("private-source/jeongbo-2020-2025-private-pack.json"))
    parser.add_argument("--ocr-recovery", type=Path, default=Path("private-source/ocr-recovery.json"))
    args = parser.parse_args()
    recoveries = {}
    if args.ocr_recovery.exists():
        recovery_data = json.loads(args.ocr_recovery.read_text(encoding="utf-8"))
        recoveries = recovery_data.get("questions", recovery_data)
    manifest_path = args.source_root / "_generated" / "source-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    selected = []
    for source in manifest["records"]:
        year = source.get("year")
        round_code = source_round(source["source_file"], year) if year else None
        if year in YEARS and round_code and source.get("category") == "기출" and source.get("page_count", 0) <= 15:
            selected.append((year, round_code, args.source_root / source["relative_path"]))
    round_order = {"1": 1, "1-2": 1, "2": 2, "3": 3, "4": 4}
    selected.sort(key=lambda row: (row[0], round_order[row[1]]))
    if len(selected) != 18 or len({(year, round_code) for year, round_code, _ in selected}) != 18:
        raise SystemExit(f"2020-2025 18회분을 찾지 못했습니다: {[(y, r) for y, r, _ in selected]}")
    questions = []
    reports = []
    for year, round_code, path in selected:
        rows, report = build_pdf(path, year, round_code, recoveries)
        questions.extend(rows)
        reports.append(report)
        print(json.dumps(report, ensure_ascii=False), flush=True)
    ids = [question["id"] for question in questions]
    if len(questions) != 1800 or len(set(ids)) != 1800:
        raise SystemExit(f"문항 수/ID 검증 실패: questions={len(questions)}, unique={len(set(ids))}")
    for year, round_code, _ in selected:
        label = round_label(year, round_code)
        rows = [question for question in questions if question["year"] == year and question["round"] == label]
        numbers = {question["sourceQuestionNumber"] for question in rows}
        subject_counts = {subject: sum(question["subject"] == subject for question in rows) for subject in SUBJECTS}
        if len(rows) != 100 or numbers != set(range(1, 101)) or set(subject_counts.values()) != {20}:
            raise SystemExit(f"회차 구성 검증 실패: {label}, rows={len(rows)}, subjects={subject_counts}")
    malformed = [question["id"] for question in questions if len(question["options"]) != 4 or not question["stem"] or not question["answer"] or any(answer not in range(4) for answer in question["answer"])]
    if malformed:
        raise SystemExit(f"문항 구조 검증 실패: {malformed[:20]}")
    unresolved = [report for report in reports if report["missingImages"]]
    if unresolved:
        raise SystemExit(f"원문 이미지 연결 실패: {unresolved}")
    image_placeholders = [question["id"] for question in questions if question["stem"].startswith("원문 이미지") or question["options"] == list(MARKS)]
    if image_placeholders:
        raise SystemExit(f"OCR 복원되지 않은 문항: {image_placeholders}")
    pack = {
        "meta": {
            "format": "jeongbo-private-pack-v2",
            "contentRevision": "ocr-text-v1",
            "title": "정보처리기사 2020-2025 기출 18회",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "copyright": "개인 이용 전용 - 공개 저장소 및 다른 매체에 배포 금지",
            "setCount": 18,
            "questionCount": 1800,
            "years": list(YEARS),
            "reports": reports,
        },
        "questions": questions,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(pack, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({"output": str(args.output.resolve()), "sets": 18, "questions": 1800, "bytes": args.output.stat().st_size}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
