// AI 피드백 인터페이스
// Stage 1: mock → Stage 2: 직접호출 → Stage 3: Edge Function
// 현재는 mock 사용, 나중에 이 파일만 수정하면 전환 완료
import { generateMockFeedback } from "./ai-feedback-mock";
import { detectCrisis, hasLevel3Crisis } from "./safety";
import type { AiFeedbackResponse, CrisisDetectionResult } from "@/types/database";

// 현재 AI 피드백 모드
const AI_MODE: "mock" | "direct" | "edge_function" = "mock";

type FeedbackInput = {
  missionText: string;
  missionType: "observe" | "explore";
  meaningText: string;
  textContent: string;
};

type FeedbackResult = {
  feedback: AiFeedbackResponse | null;
  crisis: CrisisDetectionResult;
};

/**
 * AI 피드백 생성 (안전 체크 포함)
 *
 * 1. Level 3 위기 키워드 체크 → 감지 시 피드백 생성 중단
 * 2. 모드에 따라 피드백 생성 (mock/direct/edge_function)
 * 3. 위기 감지 결과와 함께 반환
 */
export async function generateFeedback(
  input: FeedbackInput
): Promise<FeedbackResult> {
  // 1. 안전 체크 — Level 3 감지 시 즉시 중단
  const crisis = detectCrisis(input.textContent);

  if (crisis.level === 3) {
    return {
      feedback: null,
      crisis,
    };
  }

  // 2. 피드백 생성
  let feedback: AiFeedbackResponse;

  switch (AI_MODE) {
    case "mock":
      feedback = await generateMockFeedback(input);
      break;
    case "direct":
      // Stage 2: Claude API 직접 호출 (추후 구현)
      feedback = await generateMockFeedback(input);
      break;
    case "edge_function":
      // Stage 3: Supabase Edge Function 호출 (추후 구현)
      feedback = await generateMockFeedback(input);
      break;
  }

  return {
    feedback,
    crisis,
  };
}
