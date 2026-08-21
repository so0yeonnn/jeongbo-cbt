from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader


COPYRIGHT = re.compile(r"개인적인 용도로만|허락 없이 복제|상업적 용도|저작권 안내|무단[\s·]*(복제|배포)", re.I)
OFFICIAL = re.compile(r"한국산업인력공단|Q-Net|큐넷", re.I)


def analyze(path: Path) -> dict:
    reader = PdfReader(path)
    chars = 0
    low_text = []
    image_pages = 0
    copyright_pages = []
    official_pages = []
    for page_no, page in enumerate(reader.pages, 1):
        text = re.sub(r"\s+", " ", page.extract_text() or "").strip()
        chars += len(text)
        if len(text) < 80:
            low_text.append(page_no)
        resources = page.get("/Resources") or {}
        if resources.get("/XObject"):
            image_pages += 1
        if COPYRIGHT.search(text):
            copyright_pages.append(page_no)
        if OFFICIAL.search(text):
            official_pages.append(page_no)
    restricted = bool(copyright_pages)
    return {
        "fileName": path.name,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "format": "PDF",
        "pages": len(reader.pages),
        "textCharacters": chars,
        "lowTextPages": low_text,
        "pagesWithGraphics": image_pages,
        "copyrightNoticePages": copyright_pages,
        "officialMarkPages": official_pages,
        "classification": "공개 원문 사용 불가" if restricted else "공개 권한 검수 필요",
        "publicHandling": "개념·유형 통계만 사용하고 원문·선지·해설·그림은 저장소에서 제외",
        "privateHandling": "원본은 첨부 위치에서 읽기 전용 분석; 프로젝트와 Git에 복사하지 않음",
    }


def main() -> None:
    output = Path(sys.argv[1])
    sources = [Path(arg) for arg in sys.argv[2:]]
    rows = [analyze(path) for path in sources]
    report = {
        "analyzedAt": "2026-08-21",
        "sourceCount": len(rows),
        "totalPages": sum(row["pages"] for row in rows),
        "sources": rows,
        "decision": {
            "publicOriginalQuestions": 0,
            "publicOriginalText": False,
            "publicBankPolicy": "독자 예상문제만 배포",
            "manualReviewRequired": [row["fileName"] for row in rows if row["classification"] == "공개 권한 검수 필요"],
        },
    }
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"files": len(rows), "pages": report["totalPages"], "manualReview": len(report["decision"]["manualReviewRequired"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
