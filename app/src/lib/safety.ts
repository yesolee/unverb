// 위기 키워드 감지 시스템
// config/safety_rules.json 기반 3단계 키워드 매칭
import type { CrisisDetectionResult } from "@/types/database";

// 위기 키워드 정의 (config/safety_rules.json과 동기화)
const RISK_KEYWORDS = {
  level_1: {
    keywords: ["힘들다", "지친다", "피곤하다", "지루하다", "귀찮다"],
    action: "empathy_only" as const,
  },
  level_2: {
    keywords: ["우울", "불안", "무기력", "외롭다", "슬프다", "공허하다"],
    action: "suggest_support" as const,
  },
  level_3: {
    keywords: ["죽고싶", "자해", "끝내고싶", "사라지고싶", "소멸", "자살"],
    action: "show_crisis_screen" as const,
  },
};

// 위기상담 연결처
const HELPLINES = [
  { name: "정신건강 위기상담", number: "1577-0199" },
  { name: "자살예방 상담전화", number: "1393" },
];

// 텍스트 내 공백/특수문자 제거 후 키워드 매칭
function normalizeText(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

/**
 * 텍스트에서 위기 키워드를 감지합니다.
 * Level 3 → Level 2 → Level 1 순으로 우선 검사 (높은 위험도 우선)
 */
export function detectCrisis(text: string): CrisisDetectionResult {
  const normalized = normalizeText(text);

  // Level 3 (red) — 즉시 위기상담 연결
  for (const keyword of RISK_KEYWORDS.level_3.keywords) {
    if (normalized.includes(keyword)) {
      return {
        crisis_detected: true,
        level: 3,
        action: "show_crisis_screen",
        matched_keyword: keyword,
        helplines: HELPLINES,
      };
    }
  }

  // Level 2 (yellow) — 전문 상담 제안
  for (const keyword of RISK_KEYWORDS.level_2.keywords) {
    if (normalized.includes(keyword)) {
      return {
        crisis_detected: false,
        level: 2,
        action: "suggest_support",
        matched_keyword: keyword,
      };
    }
  }

  // Level 1 (green) — 공감만 제공
  for (const keyword of RISK_KEYWORDS.level_1.keywords) {
    if (normalized.includes(keyword)) {
      return {
        crisis_detected: false,
        level: 1,
        action: "empathy_only",
        matched_keyword: keyword,
      };
    }
  }

  // 키워드 미감지
  return {
    crisis_detected: false,
    level: 1,
    action: "empathy_only",
  };
}

/**
 * Level 3 위기 키워드가 포함되어 있는지 빠르게 체크
 */
export function hasLevel3Crisis(text: string): boolean {
  const normalized = normalizeText(text);
  return RISK_KEYWORDS.level_3.keywords.some((kw) => normalized.includes(kw));
}
