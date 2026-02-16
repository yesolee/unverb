# unverb 프로젝트

## 프로젝트 요약
자기 발견 앱 — 행동 미션 수행 + 사진 기록 + AI 피드백 + 주간 동사 발견

## 현재 상태: Phase 1 Week 1 완료

### 완료된 것
- **Phase 0**: 콘텐츠 DB 구축 완료 (논문 50편, 미션 30개, 질문 30개, 안전 검증)
- **Phase 1 Week 1**: Expo 앱 초기화 + Supabase 연동 + Google 로그인 + 미션 화면 + 온보딩

### 다음 작업: Phase 1 Week 2
- 기록 화면 (사진 + 텍스트)
- 성찰 질문 화면
- AI 피드백 (mock → Claude API)

## 기술 스택
- Frontend: Expo (React Native) + TypeScript + NativeWind + Expo Router v6
- Backend: Supabase (PostgreSQL, Auth, Storage)
- AI: Claude API (피드백) — mock → 직접호출 → Edge Function
- 인증: Google OAuth (Supabase Auth)

## 디렉토리 구조
```
unverb/
├── app/                    # Expo 앱 (프론트엔드)
│   ├── app/                # Expo Router 페이지
│   │   ├── _layout.tsx     # 인증 + 온보딩 가드
│   │   ├── (auth)/         # 로그인
│   │   ├── (onboarding)/   # 앱 소개 스와이프
│   │   └── (tabs)/         # 4탭 (미션/기록/한주/마이)
│   └── src/                # 소스 코드
│       ├── components/     # UI 컴포넌트
│       ├── hooks/          # useAuth, useProfile, useMission
│       ├── lib/            # supabase.ts, mission-assignment.ts
│       └── types/          # TypeScript 타입
├── supabase/migrations/    # DB 스키마 (SQL)
├── scripts/                # 시드 스크립트
├── content/                # Phase 0 콘텐츠 JSON
├── config/                 # 안전 규칙, 키워드 설정
└── docs/                   # 기획 문서 7개
```

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

## 콘텐츠 톤 수정 필요 (TODO)
Phase 0에서 AI가 논문 abstract 기반으로 자동 생성한 미션 의미(meaning_text)의 톤이
앱 목적과 맞지 않는 경우가 있음.
- **문제**: "심리적 회복", "스트레스 감소" 같은 치유/힐링 톤
- **앱 목적**: 자기 발견, 패턴 인식, 무의식적 취향 발견
- **예시**: "심리적 회복이 시작될 수 있어요" → "나의 무의식적 취향을 발견할 수 있어요"
- **작업**: content/03-content-validated.json의 meaning_text 전수 검토 + 톤 통일
- **시점**: Phase 1 완료 후 또는 별도 콘텐츠 리뷰 스프린트

## 코딩 규칙
- 언어: 한국어 (코드 주석, 커밋, 문서)
- 변수명/함수명: 영어
- 들여쓰기: 2칸
