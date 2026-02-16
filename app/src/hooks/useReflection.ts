// 성찰 질문 관리 훅
// 랜덤 질문 로드 + 옵션 선택 + 응답 저장
import { useState, useEffect, useCallback } from "react";
import { getRandomQuestion, saveReflection } from "@/lib/recording";
import { useAuth } from "./useAuth";
import type { Question } from "@/types/database";

export function useReflection(recordingId: string | null) {
  const { user } = useAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 질문 로드
  useEffect(() => {
    if (!recordingId) return;

    const fetchQuestion = async () => {
      try {
        const q = await getRandomQuestion();
        setQuestion(q);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "질문을 가져올 수 없습니다.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [recordingId]);

  // 옵션 선택
  const selectOption = useCallback((option: string) => {
    setSelectedOption(option);
  }, []);

  // 응답 저장 (옵션 텍스트를 response_text에 저장)
  const save = useCallback(async (): Promise<boolean> => {
    if (!user || !recordingId || !question || !selectedOption) return false;

    setSaving(true);
    setError(null);

    try {
      await saveReflection({
        userId: user.id,
        recordingId,
        questionId: question.id,
        responseText: selectedOption,
      });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "응답 저장에 실패했습니다.";
      setError(message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, recordingId, question, selectedOption]);

  const canSave = selectedOption !== null && !saving;

  return {
    question,
    selectedOption,
    loading,
    saving,
    error,
    canSave,
    selectOption,
    save,
  };
}
