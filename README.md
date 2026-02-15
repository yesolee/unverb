# unverb

> 좋아하는 것 뒤에 숨은 진짜 동사를 발견하는 앱

"나는 카페를 좋아해" → "나는 사실 **'혼자이기'**를 좋아하는 사람이었어"

## What is unverb?

unverb는 행동 미션과 가이드된 성찰을 통해 자기 이해를 넓혀가는 앱입니다.

매일 작은 미션을 수행하고, 느낀 것을 기록하고, AI 담임선생님의 피드백을 받으며, 일주일에 한 번 자신의 패턴 속에서 "진짜 동사"를 발견합니다.

## Key Features

- **관찰 미션** — 이미 하는 것 속에서 "왜?"를 발견
- **탐색 미션** — 작은 새로운 경험으로 몰랐던 나를 발견
- **그림일기 기록** — 사진 + 글로 간단하게
- **AI 담임선생님** — 따뜻한 피드백
- **한 주 정리** — 주간 패턴 분석 + 동사 발견
- **증거 기반** — 모든 미션에 학술 논문 출처 표시

## Project Structure

```
unverb/
├── docs/           # 기획 문서
│   ├── 01-concept.md
│   ├── 02-features.md
│   ├── 03-architecture.md
│   ├── 04-competitive-analysis.md
│   ├── 05-prd.md
│   └── 06-roadmap.md
├── src/
│   ├── frontend/   # React Native
│   └── backend/    # Python FastAPI
├── content/        # 미션/질문 콘텐츠 DB
└── README.md
```

## Tech Stack

- **Frontend**: React Native
- **Backend**: Python FastAPI
- **Database**: PostgreSQL + Pinecone
- **AI**: Claude API
- **Push**: Firebase Cloud Messaging

## Status

📋 기획 완료 → Phase 0 (콘텐츠 DB 구축) 준비 중
