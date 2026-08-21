# 정보처리기사 CBT

모바일에서 사용하는 정보처리기사 필기 PWA 문제은행입니다. 2020~2025년 기출 18회분을 개인용 기출팩으로 불러와 사용합니다.

## 데이터 정책

- 예상문제는 앱과 저장소에 포함하지 않습니다.
- 출판사 저작권 안내가 있는 기출 원문은 GitHub 저장소와 Pages 배포물에 포함하지 않습니다.
- 개인용 기출팩은 사용자가 파일 선택기로 불러오며 IndexedDB와 본인 Google Drive의 숨겨진 앱 전용 공간에 저장됩니다.
- Drive OAuth 권한은 `drive.appdata` 하나만 사용하며 일반 Drive 파일에는 접근하지 않습니다.
- 기출팩은 2020~2025년 18회, 1,800문항을 가져야 앱에서 승인됩니다.

## 빌드

```powershell
python tools/build_private_exam_pack.py --source-root "<private-source 경로>"
```

생성 결과는 Git에서 제외된 `private-source/jeongbo-2020-2025-private-pack.json`입니다. 18회·1,800문항, 고유 ID, 원문 이미지 연결을 빌드에서 검증합니다.

## 로컬 실행

```powershell
node tools/dev_server.mjs
```

브라우저에서 `http://localhost:4173`을 엽니다. GitHub Pages에서는 정적 파일만으로 동작합니다.

## 저장 구조

- 개인용 기출팩: IndexedDB `jeongbo-private-pack-v2`
- 진행 상태: `jeongbo-cbt-session-v2`
- 오답 기록: `jeongbo-cbt-wrongs-v2`
- 응시 결과: `jeongbo-cbt-results-v2`
- Drive 비공개 동기화: `jeongbo-private-pack-v2.json`, `jeongbo-progress-v2.json` (`appDataFolder`)

오답은 문항 고유 ID를 키로 저장하므로 중복 생성되지 않습니다. 다시 틀리면 횟수가 증가하고, 맞히면 활성 목록에서 제외되지만 이력은 유지됩니다.

## 학습 분석

- 학습모드: 정답·해설·핵심 개념 3줄·암기 포인트·헷갈리는 개념·키워드
- 선지별 판단: A~D 각각 정답·오답 여부, 이유, 근거 유형을 분리 표시
- 확신도: 맞힌 문제도 `애매해요`로 표시해 취약 개념에 포함
- 시험 결과: 과목별 점수, 정규 100문항 합격 기준, 취약 개념 TOP10
- 출제 빈도: 보유 기출 최근 6회에서 개념별 빈도를 상·중·하로 표시
- 오늘 복습 TOP20: 최근 오답·정답률·최근 6회 출제 빈도를 합산해 홈에서 우선순위 표시
- Notion: 문제 원문 없이 개념·횟수·정답률·암기 포인트를 복사해 학습 허브에 정리
