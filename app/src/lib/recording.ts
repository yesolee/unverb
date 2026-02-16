// 기록(recording) Supabase CRUD
// 사진 업로드 + 기록 저장 + 성찰 응답 저장 + AI 피드백 저장
import { supabase } from "./supabase";
import type {
  Recording,
  UserReflection,
  AiFeedback,
  AiFeedbackResponse,
} from "@/types/database";

/**
 * 사진을 Supabase Storage에 업로드하고 public URL 반환
 */
export async function uploadPhoto(
  userId: string,
  imageUri: string
): Promise<string> {
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  // 이미지 파일을 blob으로 변환
  const response = await fetch(imageUri);
  if (!response.ok) {
    throw new Error(`이미지 로드 실패: ${response.status}`);
  }
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from("recording-photos")
    .upload(fileName, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(`사진 업로드 실패: ${error.message}`);
  }

  // public URL 생성
  const { data: urlData } = supabase.storage
    .from("recording-photos")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * 기록 저장 (recordings 테이블)
 */
export async function saveRecording(params: {
  userId: string;
  userMissionId: string;
  photoUrl: string | null;
  textContent: string;
}): Promise<Recording> {
  const { data, error } = await supabase
    .from("recordings")
    .insert({
      user_id: params.userId,
      user_mission_id: params.userMissionId,
      photo_url: params.photoUrl,
      text_content: params.textContent,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`기록 저장 실패: ${error.message}`);
  }

  return data;
}

/**
 * 성찰 응답 저장 (user_reflections 테이블)
 */
export async function saveReflection(params: {
  userId: string;
  recordingId: string;
  questionId: number;
  responseText: string;
}): Promise<UserReflection> {
  const { data, error } = await supabase
    .from("user_reflections")
    .insert({
      user_id: params.userId,
      recording_id: params.recordingId,
      question_id: params.questionId,
      response_text: params.responseText,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`성찰 응답 저장 실패: ${error.message}`);
  }

  return data;
}

/**
 * AI 피드백 저장 (ai_feedbacks 테이블)
 */
export async function saveAiFeedback(params: {
  userId: string;
  recordingId: string;
  feedback: AiFeedbackResponse;
}): Promise<AiFeedback> {
  const { data, error } = await supabase
    .from("ai_feedbacks")
    .insert({
      user_id: params.userId,
      recording_id: params.recordingId,
      empathy: params.feedback.empathy,
      discovery: params.feedback.discovery,
      hint: params.feedback.hint,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`AI 피드백 저장 실패: ${error.message}`);
  }

  return data;
}

/**
 * 미션 완료 처리 (user_missions 테이블)
 */
export async function completeMission(userMissionId: string): Promise<void> {
  const { error } = await supabase
    .from("user_missions")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", userMissionId);

  if (error) {
    throw new Error(`미션 완료 처리 실패: ${error.message}`);
  }
}

/**
 * 랜덤 성찰 질문 1개 가져오기
 */
export async function getRandomQuestion() {
  // 전체 질문 수 조회 후 랜덤 선택
  const { data, error } = await supabase
    .from("questions")
    .select("*");

  if (error || !data || data.length === 0) {
    throw new Error("성찰 질문을 가져올 수 없습니다.");
  }

  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex];
}
