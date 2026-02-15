# 03. 기술 아키텍처

## 핵심 원칙

안전하고 신뢰할 수 있는 콘텐츠를 AI만으로 구축하되, **전문가가 이미 검증한 연구**를 기반으로 한다.

## 3-Tier 하이브리드 아키텍처

### Layer 1: Expert-Curated Content DB (기반층)

신뢰할 수 있는 학술 자료에서 추출한 검증된 콘텐츠 저장소.

**신뢰 소스 목록 (Trusted Sources Only)**
- Cochrane Library — 체계적 문헌 고찰의 최고 권위
- APA (미국심리학회) 가이드라인
- WHO 정신건강 가이드라인
- 메타분석 논문 (100회 이상 인용)
- Nature, Science, Lancet 등 상위 저널

**DB 구조**

| 필드 | 설명 | 예시 |
|------|------|------|
| mission_id | 고유 ID | MSN-001 |
| mission_type | 카테고리 | observe / explore |
| mission_text | 미션 내용 | "오늘 가장 오래 머문 장소에서 사진 찍기" |
| meaning_text | 왜 하는지 | "환경심리학에서 '장소 애착'은..." |
| source_doi | 출처 DOI | 10.1037/xxx |
| source_title | 논문 제목 | "Place Attachment and..." |
| safety_level | 안전 등급 | green / yellow / red |
| category | 분류 | 환경, 관계, 감각, 습관 |

### Layer 2: RAG 기반 개인화 엔진 (맥락층) — P2

사용자의 기록 패턴을 분석하여 가장 적합한 콘텐츠를 매칭.

**기술 스택**: Pinecone 또는 Weaviate + OpenAI text-embedding-3-small

**개인화 요소**:
- 사용자가 자주 쓰는 단어/감정
- 발견된 동사 패턴
- 관찰/탐색 미션 선호도
- 이전 미션 완료율/선호도

### Layer 3: LLM 전달층 (표현층)

검증된 콘텐츠를 사용자에게 자연스럽게 전달하는 AI 레이어.

**역할**: 담임선생님 톤으로 피드백 생성, 주간 패턴 분석, 동사 발견 인사이트

**엄격한 제약 조건**:
- Layer 1 DB에 없는 내용은 절대 생성 금지
- 의학적/심리학적 진단 표현 금지
- 모든 인사이트에 출처 표시 필수

## AI 콘텐츠 구축 파이프라인

### Phase 1: MVP (수동 + AI 보조)

목표: 핵심 논문 50편 → 미션 30개 + 질문 30개

1. **수집**: Semantic Scholar API / OpenAlex API로 논문 검색
   - 키워드: self-discovery, behavioral activation, journaling therapy, place attachment, sensory awareness, habit formation
   - 필터: 인용 100회+, 메타분석/체계적 리뷰 우선
2. **추출**: AI가 논문에서 핵심 발견 추출 → 미션/질문으로 변환
3. **검증**: AI 자동 안전성 체크 + 교차 검증(2개 이상 독립 논문) + 사람(개발자) 최종 리뷰

### Phase 2: 자동화 파이프라인
논문 모니터링 → AI 추출 → 자동 안전 체크 → 사람 승인 → DB 등록

### Phase 3: 스케일업 시 전문가 자문단
사용자 10만+ 도달 시 심리학/정신의학 자문위원 확보

## 안전 시스템 (Safety Guardrails)

### 원칙: Rule-based (AI 판단 아님)

안전 관련 판단은 AI에게 맡기지 않고, 규칙 기반으로 처리한다.

### 위험 키워드 감지 프로토콜

| 단계 | 트리거 예시 | 대응 |
|------|-----------|------|
| Level 1 (주의) | "힘들다", "지친다" | 공감 메시지 + 일반 위로 |
| Level 2 (경고) | "우울", "불안", "무기력" | 전문 상담 안내 부드럽게 제안 |
| Level 3 (위기) | "죽고싶", "자해", "끝내고싶" | 즉시 위기상담 연결 화면 |

### Level 3 위기 대응
1. AI 응답 즉시 중단
2. 전체 화면 위기상담 안내 표시
3. 정신건강 위기상담 전화: **1577-0199**
4. 자살예방 상담전화: **1393**
5. 원터치 전화 연결 버튼

### AI 응답 금지 목록 (Hardcoded)
- "당신은 우울증입니다" 등 진단 표현
- "약을 먹어보세요" 등 의료 조언
- "다 괜찮아질 거예요" 등 근거 없는 낙관
- "그건 별거 아니야" 등 감정 축소
- 특정 치료법 권유

## 기술 스택 (확정)

### 앱 개발

| 영역 | 기술 | 비고 |
|------|------|------|
| Frontend | React Native (Expo) | iOS + Android 동시 지원 |
| Backend/DB/인증/스토리지 | Supabase | PostgreSQL 포함, 서버 직접 안 만들어도 됨 |
| AI/LLM | Claude API | 담임선생님 피드백, 주간 분석 |
| Push 알림 | Firebase Cloud Messaging | 알람 시스템 |
| 논문 검색 | Semantic Scholar API | 무료 |
| 논문 보조 | OpenAlex API | 오픈소스 |
| 분석 | Mixpanel / Amplitude | 사용자 행동 |

### 개발 자동화 (서브에이전트)

| 영역 | 기술 | 비고 |
|------|------|------|
| 에이전트 프레임워크 | Claude Agent SDK (Python) | 콘텐츠 빌더, 안전 검증 등 |
