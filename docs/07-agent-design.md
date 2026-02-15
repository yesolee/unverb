# 07. 서브에이전트 설계 + 스킬 매핑

## 개요

Phase 0 콘텐츠 DB 구축에 사용하는 4개 Claude Code 서브에이전트.
각 에이전트는 기본 도구(Tools)와 설치된 스킬(Skills)을 조합하여 작업한다.

---

## 에이전트 목록

| 에이전트 | 모델 | 역할 |
|----------|------|------|
| paper-collector | haiku | 논문 50편 수집 (Semantic Scholar + OpenAlex) |
| content-extractor | sonnet | 논문 → 관찰미션 15 + 탐색미션 15 + 성찰질문 30 변환 |
| safety-validator | sonnet | 금지 표현 / 위험 키워드 / DOI 출처 검증 |
| pipeline-runner | sonnet | 위 3개 에이전트를 순차 실행하고 결과 종합 |

---

## 1. paper-collector (논문 수집)

### 기본 도구 (Tools)
`Bash`, `Read`, `Write`, `Grep`, `Glob`, `WebFetch`

### 스킬 매핑

| 우선순위 | 스킬 | 용도 |
|----------|------|------|
| 필수 | `scientific-skills:openalex-database` | OpenAlex API 논문 검색 |
| 필수 | `scientific-skills:pubmed-database` | PubMed 보조 검색 |
| 필수 | `scientific-skills:literature-review` | 체계적 문헌 리뷰 방법론 적용 |
| 권장 | `scientific-skills:citation-management` | 수집 논문 인용 정보 정리 |
| 권장 | `scientific-skills:research-lookup` | Perplexity로 최신 연구 동향 확인 |
| 선택 | `scientific-skills:biorxiv-database` | 프리프린트 보조 검색 |

### 출력
- `content/01-papers-raw.json`

---

## 2. content-extractor (콘텐츠 추출)

### 기본 도구 (Tools)
`Read`, `Write`, `Glob`

### 스킬 매핑

| 우선순위 | 스킬 | 용도 |
|----------|------|------|
| 필수 | `scientific-skills:pdf` | 논문 PDF 텍스트/테이블 추출 |
| 필수 | `scientific-skills:scientific-writing` | 미션 문구 학술 근거 기반 작성 |
| 필수 | `scientific-skills:hypothesis-generation` | 논문 발견 → 구조적 미션 변환 |
| 권장 | `scientific-skills:scientific-critical-thinking` | 근거 품질 평가 후 추출 |
| 선택 | `scientific-skills:exploratory-data-analysis` | 추출 데이터 패턴 탐색 |
| 선택 | `scientific-skills:xlsx` | 미션/질문 스프레드시트 정리 |

### 출력
- `content/02-content-extracted.json`

---

## 3. safety-validator (안전 검증)

### 기본 도구 (Tools)
`Read`, `Write`, `Grep`, `Glob`

### 스킬 매핑

| 우선순위 | 스킬 | 용도 |
|----------|------|------|
| 필수 | `scientific-skills:peer-review` | 체크리스트 기반 체계적 검증 |
| 필수 | `scientific-skills:scholar-evaluation` | 출처(DOI) 학술 품질 평가 |
| 필수 | `scientific-skills:scientific-critical-thinking` | 과학적 근거 유효성 판단 |
| 권장 | `scientific-skills:clinical-decision-support` | 임상 안전성 가이드라인 참조 |
| 선택 | `scientific-skills:statistical-analysis` | 인용수/영향력 통계 검증 |

### 검증 규칙 (config/safety_rules.json 참조)
- 금지 표현 4종 (진단, 의료 조언, 근거 없는 낙관, 감정 축소)
- 위험 키워드 3단계 (green → yellow → red)
- Level 3(red) 콘텐츠: 즉시 제거
- DOI 필수, 인용 100회+ 필터

### 출력
- `content/03-content-validated.json`

---

## 4. pipeline-runner (오케스트레이터)

### 기본 도구 (Tools)
`Read`, `Write`, `Glob`

### 스킬 매핑

| 우선순위 | 스킬 | 용도 |
|----------|------|------|
| 필수 | `scientific-skills:xlsx` | 최종 결과 스프레드시트 생성 |
| 권장 | `scientific-skills:docx` | 검증 보고서 문서화 |
| 권장 | `scientific-skills:exploratory-data-analysis` | 전체 파이프라인 결과 분석 |
| 선택 | `scientific-skills:scientific-visualization` | 결과 시각화 (분포, 카테고리별) |

### 실행 순서
```
paper-collector → 01-papers-raw.json
    → content-extractor → 02-content-extracted.json
        → safety-validator → 03-content-validated.json
```

---

## 공통 인프라 스킬

| 스킬 | 용도 | 사용 시점 |
|------|------|----------|
| `agent-sdk-dev:new-sdk-app` | Agent SDK 앱 초기 세팅 | Phase 0 코드 구현 시 |
| `explanatory-output-style` | 실행 과정 설명 출력 | 전 에이전트 |
| `claude-md-management` | CLAUDE.md 업데이트 | 프로젝트 설정 변경 시 |

---

## 미사용 스킬 (Phase 1+ 대비)

| 스킬 | 활용 시점 |
|------|----------|
| `figma:implement-design` | Phase 1 앱 UI 구현 |
| `supabase` | Phase 1 DB/인증 연동 |
| `frontend-design` | Phase 1 화면 설계 |
| `playwright` | Phase 1+ E2E 테스트 |
| `hookify` | 개발 워크플로우 자동화 |

---

## 파이프라인 비용

- 1회 실행: ~$4
- max_budget_usd: 5.0
- 예상 반복: 2~3회 → 총 ~$12
