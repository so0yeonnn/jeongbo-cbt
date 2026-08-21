"""Build a personal-use 2021-2025 exam pack from supplied Sinagong PDFs.

The generated pack is written below the ignored private-source directory and
must never be committed or published. Text extraction is used where reliable;
questions with figures, tables, code, or extraction failures retain a cropped
image of the original layout.
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
from pypdf import PdfReader

YEARS = range(2021, 2026)
MARKS = "①②③④"
MARK_INDEX = {mark: index for index, mark in enumerate(MARKS)}
SUBJECTS = ["소프트웨어 설계", "소프트웨어 개발", "데이터베이스 구축", "프로그래밍 언어 활용", "정보시스템 구축관리"]
QSTART = re.compile(r"(?m)^\s*(\d{1,3})[.)]\s+")
ROUND_RE = re.compile(r"(?:^|년|\s)([123])회")
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


def source_round(filename: str) -> int | None:
    match = ROUND_RE.search(filename)
    return int(match.group(1)) if match else None


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


def image_for(page, half, number: int) -> str | None:
    positions = question_positions(page, half)
    match_index = next((index for index, row in enumerate(positions) if row[0] == number), None)
    if match_index is None:
        return None
    top = max(0, positions[match_index][1] - 8)
    bottom = positions[match_index + 1][1] - 5 if match_index + 1 < len(positions) else page.height - 24
    if bottom <= top + 16:
        return None
    crop = page.crop((half[0], top, half[2], min(page.height, bottom)))
    image = crop.to_image(resolution=150).original.convert("RGB")
    output = io.BytesIO()
    image.save(output, format="JPEG", quality=84, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(output.getvalue()).decode("ascii")


def layout_location(pdf, number: int):
    for page_index, page in enumerate(pdf.pages[:-1]):
        halves = ((0, 0, page.width / 2, page.height), (page.width / 2, 0, page.width, page.height))
        for half in halves:
            if any(candidate == number for candidate, _ in question_positions(page, half)):
                return page_index, half
    return None


def record_for(year: int, round_number: int, source: str, number: int, parsed, answer, void, image_data):
    subject = SUBJECTS[min((number - 1) // 20, 4)]
    if parsed:
        stem, options = parsed
    else:
        stem = f"원문 이미지의 {number}번 문항을 보고 답하세요."
        options = ["①", "②", "③", "④"]
    is_void = void or answer is None
    layout = {"kind": "image", "imageData": image_data, "alt": f"{year}년 {round_number}회 {number}번 원문"} if image_data else {"kind": "text"}
    digest = hashlib.sha1(f"{year}-{round_number}-{number}-{source}".encode("utf-8")).hexdigest()[:10]
    return {
        "id": f"PAST-{year}-{round_number}-{number:03d}-{digest}",
        "examName": "정보처리기사 필기",
        "year": year,
        "round": f"{year}년 {round_number}회",
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


def build_pdf(path: Path, year: int, round_number: int):
    with pdfplumber.open(path) as pdf:
        answers, voids = answer_map(pdf, path)
        parsed_by_number = {}
        location_by_number = {}
        for page_index, page in enumerate(pdf.pages[:-1]):
            halves = ((0, 0, page.width / 2, page.height), (page.width / 2, 0, page.width, page.height))
            for half in halves:
                text = page.crop(half).extract_text(x_tolerance=2, y_tolerance=3) or ""
                for number, body in split_blocks(text):
                    if 1 <= number <= 100:
                        parsed = parse_body(body)
                        if parsed:
                            parsed_by_number.setdefault(number, parsed)
                        location_by_number.setdefault(number, (page_index, half))
        questions = []
        image_count = 0
        for number in range(1, 101):
            parsed = parsed_by_number.get(number)
            needs_image = parsed is None or any(hint.lower() in (parsed[0].lower() if parsed else "") for hint in LAYOUT_HINTS)
            location = location_by_number.get(number) or layout_location(pdf, number)
            image_data = image_for(pdf.pages[location[0]], location[1], number) if needs_image and location else None
            if image_data:
                image_count += 1
            questions.append(record_for(year, round_number, path.name, number, parsed, answers.get(number), number in voids, image_data))
        return questions, {
            "year": year,
            "round": round_number,
            "source": path.name,
            "questions": len(questions),
            "parsed": len(parsed_by_number),
            "images": image_count,
            "void": sum(question["void"] for question in questions),
            "missingImages": [question["sourceQuestionNumber"] for question in questions if question["stem"].startswith("원문 이미지") and question["layout"]["kind"] != "image"],
        }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("private-source/jeongbo-2021-2025-private-pack.json"))
    args = parser.parse_args()
    manifest_path = args.source_root / "_generated" / "source-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    selected = []
    for source in manifest["records"]:
        year = source.get("year")
        round_number = source_round(source["source_file"])
        if year in YEARS and round_number and source.get("category") == "기출" and source.get("page_count", 0) <= 15:
            selected.append((year, round_number, args.source_root / source["relative_path"]))
    selected.sort(key=lambda row: (row[0], row[1]))
    if len(selected) != 15 or len({(year, round_number) for year, round_number, _ in selected}) != 15:
        raise SystemExit(f"2021-2025 15회분을 찾지 못했습니다: {[(y, r) for y, r, _ in selected]}")
    questions = []
    reports = []
    for year, round_number, path in selected:
        rows, report = build_pdf(path, year, round_number)
        questions.extend(rows)
        reports.append(report)
        print(json.dumps(report, ensure_ascii=False), flush=True)
    ids = [question["id"] for question in questions]
    if len(questions) != 1500 or len(set(ids)) != 1500:
        raise SystemExit(f"문항 수/ID 검증 실패: questions={len(questions)}, unique={len(set(ids))}")
    for year, round_number, _ in selected:
        rows = [question for question in questions if question["year"] == year and question["round"] == f"{year}년 {round_number}회"]
        numbers = {question["sourceQuestionNumber"] for question in rows}
        subject_counts = {subject: sum(question["subject"] == subject for question in rows) for subject in SUBJECTS}
        if len(rows) != 100 or numbers != set(range(1, 101)) or set(subject_counts.values()) != {20}:
            raise SystemExit(f"회차 구성 검증 실패: {year}-{round_number}, rows={len(rows)}, subjects={subject_counts}")
    malformed = [question["id"] for question in questions if len(question["options"]) != 4 or not question["stem"] or not question["answer"] or any(answer not in range(4) for answer in question["answer"])]
    if malformed:
        raise SystemExit(f"문항 구조 검증 실패: {malformed[:20]}")
    unresolved = [report for report in reports if report["missingImages"]]
    if unresolved:
        raise SystemExit(f"원문 이미지 연결 실패: {unresolved}")
    pack = {
        "meta": {
            "format": "jeongbo-private-pack-v1",
            "title": "정보처리기사 2021-2025 기출 15회",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "copyright": "개인 이용 전용 - 공개 저장소 및 다른 매체에 배포 금지",
            "setCount": 15,
            "questionCount": 1500,
            "years": list(YEARS),
            "reports": reports,
        },
        "questions": questions,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(pack, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({"output": str(args.output.resolve()), "sets": 15, "questions": 1500, "bytes": args.output.stat().st_size}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
