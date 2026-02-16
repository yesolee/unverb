// 기록 플로우 관리 훅
// 사진 선택 + 텍스트 입력 + 저장까지의 상태 관리
import { useState, useCallback } from "react";
import { uploadPhoto, saveRecording, completeMission } from "@/lib/recording";
import { useAuth } from "./useAuth";
import type { Recording } from "@/types/database";

export function useRecording(userMissionId: string | null) {
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [textContent, setTextContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRecording, setSavedRecording] = useState<Recording | null>(null);

  // 사진 선택
  const selectImage = useCallback((uri: string) => {
    setImageUri(uri);
  }, []);

  // 사진 제거
  const removeImage = useCallback(() => {
    setImageUri(null);
  }, []);

  // 텍스트 변경 (500자 제한)
  const updateText = useCallback((text: string) => {
    if (text.length <= 500) {
      setTextContent(text);
    }
  }, []);

  // 기록 저장
  const save = useCallback(async (): Promise<Recording | null> => {
    if (!user || !userMissionId) return null;
    if (!textContent.trim() && !imageUri) {
      setError("사진 또는 텍스트를 입력해주세요.");
      return null;
    }

    setSaving(true);
    setError(null);

    try {
      // 사진 업로드 (있는 경우)
      let photoUrl: string | null = null;
      if (imageUri) {
        photoUrl = await uploadPhoto(user.id, imageUri);
      }

      // 기록 저장
      const recording = await saveRecording({
        userId: user.id,
        userMissionId,
        photoUrl,
        textContent: textContent.trim(),
      });

      // 미션 완료 처리
      await completeMission(userMissionId);

      setSavedRecording(recording);
      return recording;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "저장에 실패했습니다.";
      setError(message);
      return null;
    } finally {
      setSaving(false);
    }
  }, [user, userMissionId, imageUri, textContent]);

  // 유효성 검사 — 저장 가능 여부
  const canSave = (textContent.trim().length > 0 || imageUri !== null) && !saving;

  return {
    imageUri,
    textContent,
    saving,
    error,
    savedRecording,
    canSave,
    selectImage,
    removeImage,
    updateText,
    save,
  };
}
