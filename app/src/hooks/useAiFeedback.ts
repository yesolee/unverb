// AI 피드백 관리 훅
// 피드백 요청 + 위기 감지 + 결과 저장
import { useState, useCallback } from "react";
import { generateFeedback } from "@/lib/ai-feedback";
import { saveAiFeedback } from "@/lib/recording";
import { useAuth } from "./useAuth";
import type { AiFeedbackResponse, CrisisDetectionResult } from "@/types/database";

export function useAiFeedback() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<AiFeedbackResponse | null>(null);
  const [crisis, setCrisis] = useState<CrisisDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 피드백 요청
  const requestFeedback = useCallback(
    async (params: {
      recordingId: string;
      missionText: string;
      missionType: "observe" | "explore";
      meaningText: string;
      textContent: string;
    }) => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const result = await generateFeedback({
          missionText: params.missionText,
          missionType: params.missionType,
          meaningText: params.meaningText,
          textContent: params.textContent,
        });

        setCrisis(result.crisis);

        // Level 3 위기 → 피드백 없이 종료
        if (result.crisis.level === 3) {
          setLoading(false);
          return;
        }

        if (result.feedback) {
          setFeedback(result.feedback);

          // DB에 피드백 저장
          await saveAiFeedback({
            userId: user.id,
            recordingId: params.recordingId,
            feedback: result.feedback,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "피드백 생성에 실패했습니다.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // 위기 상태 초기화
  const clearCrisis = useCallback(() => {
    setCrisis(null);
  }, []);

  return {
    feedback,
    crisis,
    loading,
    error,
    requestFeedback,
    clearCrisis,
  };
}
