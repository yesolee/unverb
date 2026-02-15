# unverb 프로젝트

## 프로젝트 요약
자기 발견 앱 — 행동 미션 수행 + 그림일기 기록 + AI 피드백 + 주간 동사 발견

## Phase 0 목표: 콘텐츠 DB 구축
학술 논문 50편에서 검증된 콘텐츠를 추출하여 신뢰할 수 있는 미션 DB를 만든다.

**목표 콘텐츠**:
- 관찰 미션 15개 (이미 하는 것 속에서 발견)
- 탐색 미션 15개 (작은 새로운 경험)
- 성찰 질문 30개 (탭 선택지 2-3개씩)
- **모든 콘텐츠에 학술 출처(DOI) 필수**

## 서브에이전트 시스템 (4개)

### 🔵 paper-collector
논문 수집 에이전트. Semantic Scholar/OpenAlex API로 신뢰할 수 있는 논문 50편을 수집한다.
- 결과: `content/01-papers-raw.json`

### 🟢 content-extractor
콘텐츠 추출 에이전트. 논문 abstract에서 미션과 질문을 추출하여 변환한다.
- 결과: `content/02-content-extracted.json`

### 🟡 safety-validator
안전 검증 에이전트. 금지 표현, 위험 키워드, 출처를 검증한다.
- 결과: `content/03-content-validated.json`

### 🚀 pipeline-runner
오케스트레이터. 3개 에이전트를 순차 실행하고 결과를 종합한다.

## 안전 규칙 (핵심)

### 금지 표현
- 진단: "우울증입니다", "당신은 ADHD예요"
- 의료 조언: "약을 먹어보세요", "병원에 가세요"
- 근거 없는 낙관: "다 괜찮아질 거예요", "힘내세요"
- 감정 축소: "별거 아니야", "다들 그래"

### 위험 키워드 3단계
- Level 1 (green): 힘들다, 지친다
- Level 2 (yellow): 우울, 불안, 무기력
- Level 3 (red): 죽고싶, 자해, 끝내고싶 → 즉시 제거

## 콘텐츠 구조

### 미션 구조
```
미션 = 행동 지시(20자 이내) + 의미(2-3문장) + 출처(DOI)
```

### JSON 스키마 참고
- config/keywords.json — 검색 키워드
- config/safety_rules.json — 안전 규칙 상세
- config/trusted_sources.json — 신뢰 소스 목록

## 기술 스택
- Frontend: Expo (React Native) + TypeScript + NativeWind
- Backend: Supabase
- AI: Claude Code 서브에이전트 (프로토타입) → Claude Agent SDK (프로덕션)

## 코딩 규칙
- 언어: 한국어 (코드 주석, 커밋, 문서)
- 변수명/함수명: 영어
- 들여쓰기: 2칸
