# 정보처리기사 CBT

모바일에서 사용하는 정보처리기사 필기 PWA 문제은행입니다. 기존 ISTQB 모바일 앱의 화면 구조, 시험 진행, 자동 채점, 오답 누적·재시험, localStorage 저장, 결과 공유 구조를 재사용했습니다.

## 공개 데이터 정책

- 첨부 PDF 2개(267쪽)는 전체 페이지를 읽기 전용으로 분석했습니다.
- 출판사 저작권 안내가 있는 원문·선지·해설·그림은 저장소에 포함하지 않습니다.
- 공개 `question-bank.json`은 개념과 유형 통계만 참고해 독립적으로 작성한 예상문제입니다.
- 출제 범위는 Q-Net 정보처리기사 종목별 출제기준의 5과목 체계를 기준으로 정규화했습니다.

## 빌드

```powershell
python tools/build_public_bank.py
```

생성 결과는 `bank.js`, `question-bank.json`, `reports/public-bank-report.json`입니다. 정답 위치와 데이터 누락·중복은 빌드에서 검증합니다.

## 로컬 실행

```powershell
python -m http.server 4173
```

브라우저에서 `http://localhost:4173`을 엽니다. GitHub Pages에서는 정적 파일만으로 동작합니다.

## 저장 구조

- 진행 상태: `jeongbo-cbt-session-v1`
- 오답 기록: `jeongbo-cbt-wrongs-v1`
- 응시 결과: `jeongbo-cbt-results-v1`

오답은 문항 고유 ID를 키로 저장하므로 중복 생성되지 않습니다. 다시 틀리면 횟수가 증가하고, 맞히면 활성 목록에서 제외되지만 이력은 유지됩니다.
