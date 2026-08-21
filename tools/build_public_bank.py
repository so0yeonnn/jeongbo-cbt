from __future__ import annotations

import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONCEPTS = json.loads((ROOT / "data" / "concepts.json").read_text(encoding="utf-8"))
SUBJECT_ORDER = list(CONCEPTS)
CRITERIA = {
    "소프트웨어 설계": "요구사항 확인, 화면 설계, 애플리케이션 설계, 인터페이스 설계",
    "소프트웨어 개발": "데이터 입출력 구현, 통합 구현, 제품 소프트웨어 패키징, 애플리케이션 테스트, 인터페이스 구현",
    "데이터베이스 구축": "SQL 응용, SQL 활용, 논리 데이터베이스 설계, 물리 데이터베이스 설계, 데이터 전환",
    "프로그래밍 언어 활용": "서버 프로그램 구현, 프로그래밍 언어 활용, 응용 SW 기초 기술 활용",
    "정보시스템 구축관리": "소프트웨어 개발 방법론, IT 프로젝트 정보시스템 구축관리, 소프트웨어 개발 보안, 시스템 보안 구축",
}
TYPES = ["키워드", "개념판별", "문장판별", "응용"]
DIFFICULTIES = ["하", "중", "중", "상"]


def rotate(correct: str, distractors: list[str], answer_index: int) -> list[str]:
    pool = [correct, *distractors[:3]]
    return pool[-answer_index:] + pool[:-answer_index] if answer_index else pool


def make_question(subject: str, item_index: int, variant: int, global_index: int) -> dict:
    items = CONCEPTS[subject]
    term, definition = items[item_index]
    near = [items[(item_index + step) % len(items)] for step in (1, 4, 7)]
    answer_index = global_index % 4
    qtype = TYPES[variant]

    if variant in (0, 3):
        options = rotate(term, [row[0] for row in near], answer_index)
        stem = (
            f"다음 설명에 해당하는 개념은?\n{definition}"
            if variant == 0
            else f"학습자가 다음 조건을 구분해야 한다. 가장 먼저 적용할 개념은?\n{definition}"
        )
        option_reasons = []
        definitions = {t: d for t, d in items}
        for option in options:
            if option == term:
                option_reasons.append(f"정답이다. {term}은(는) 제시된 조건을 그대로 설명한다.")
            else:
                option_reasons.append(f"{option}은(는) ‘{definitions[option]}’를 뜻하므로 제시된 조건과 다르다.")
    else:
        options = rotate(definition, [row[1] for row in near], answer_index)
        stem = (
            f"{term}에 대한 설명으로 가장 적절한 것은?"
            if variant == 1
            else f"다음 중 {term}의 핵심 특징을 옳게 설명한 것은?"
        )
        reverse = {d: t for t, d in items}
        option_reasons = []
        for option in options:
            if option == definition:
                option_reasons.append(f"정답이다. {term}의 정의와 핵심 특징에 맞는다.")
            else:
                option_reasons.append(f"이 설명은 {reverse[option]}에 해당하므로 {term}의 설명이 아니다.")

    round_no = (global_index % 6) + 1
    return {
        "id": f"JBG-2026-{SUBJECT_ORDER.index(subject)+1}-{item_index+1:02d}-{variant+1}",
        "examName": "정보처리기사 필기",
        "year": 2026,
        "round": f"예상 {round_no}회",
        "subject": subject,
        "unit": term,
        "learningObjective": f"{term}의 정의를 설명하고 유사 개념과 구분할 수 있다.",
        "criteria": CRITERIA[subject],
        "difficulty": DIFFICULTIES[variant],
        "type": qtype,
        "stem": stem,
        "options": options,
        "answer": [answer_index],
        "explanation": f"{term}: {definition}",
        "optionReasons": option_reasons,
        "sourceType": "독자 예상",
        "source": {
            "policy": "original-rewrite",
            "label": "제공 자료의 개념·유형 통계를 참고해 독립 작성",
            "officialCriteria": "Q-Net 정보처리기사 종목별 출제기준",
            "version": "2026-08-21",
        },
        "layout": {"kind": "text", "html": ""},
        "conceptDetail": definition,
        "clue": f"지문에서 ‘{definition}’에 해당하는 조건이 직접 제시되는지 확인한다.",
        "judgmentRule": f"용어의 이름보다 정의의 핵심 동작·대상·제약을 먼저 찾고 {term}과 유사 개념을 구분한다.",
        "reviewStatus": "validated",
    }


def validate(rows: list[dict]) -> dict:
    required = {
        "id", "examName", "year", "round", "subject", "unit", "learningObjective",
        "difficulty", "type", "stem", "options", "answer", "explanation",
        "optionReasons", "sourceType", "layout",
    }
    errors = []
    ids = set()
    signatures = set()
    for row in rows:
        missing = sorted(required - row.keys())
        if missing:
            errors.append({"id": row.get("id"), "error": "missing", "fields": missing})
        if row["id"] in ids:
            errors.append({"id": row["id"], "error": "duplicate-id"})
        ids.add(row["id"])
        signature = (row["stem"], tuple(row["options"]))
        if signature in signatures:
            errors.append({"id": row["id"], "error": "duplicate-question"})
        signatures.add(signature)
        if len(row["options"]) != 4 or len(row["optionReasons"]) != 4:
            errors.append({"id": row["id"], "error": "option-count"})
        if row["answer"] != [rows.index(row) % 4]:
            errors.append({"id": row["id"], "error": "answer-position"})
    return {
        "questions": len(rows),
        "errors": errors,
        "bySubject": Counter(row["subject"] for row in rows),
        "byType": Counter(row["type"] for row in rows),
        "byRound": Counter(row["round"] for row in rows),
        "answerDistribution": Counter("ABCD"[row["answer"][0]] for row in rows),
        "sourceTypes": Counter(row["sourceType"] for row in rows),
    }


def main() -> None:
    rows = []
    for subject in SUBJECT_ORDER:
        for item_index in range(len(CONCEPTS[subject])):
            for variant in range(4):
                rows.append(make_question(subject, item_index, variant, len(rows)))
    report = validate(rows)
    if report["errors"]:
        raise SystemExit(json.dumps(report["errors"], ensure_ascii=False, indent=2))
    (ROOT / "question-bank.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "bank.js").write_text(
        "globalThis.QUESTION_BANK=" + json.dumps(rows, ensure_ascii=False, separators=(",", ":")) + ";\n"
        + "globalThis.CBT_META=" + json.dumps({"version": "2026-08-21", "sets": 6, "publicPolicy": "original-only"}, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    (ROOT / "reports" / "public-bank-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "reports" / "review-pending.json").write_text("[]\n", encoding="utf-8")
    print(json.dumps({"questions": len(rows), "reviewPending": 0, "answers": report["answerDistribution"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
