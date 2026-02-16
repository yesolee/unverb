import { supabase } from "./supabase";
import type { UserMissionWithDetails } from "@/types/database";

/**
 * 오늘의 미션 할당
 * 규칙: 관찰↔탐색 번갈아, 카테고리 분산, 소진 시 재순환
 */
export async function assignTodayMission(
  userId: string,
  date: string
): Promise<UserMissionWithDetails | null> {
  // 1. 오늘 이미 할당됐으면 반환
  const { data: existing } = await supabase
    .from("user_missions")
    .select("*, missions(*)")
    .eq("user_id", userId)
    .eq("assigned_date", date)
    .single();

  if (existing) return existing as UserMissionWithDetails;

  // 2. 어제 미션 타입 확인 → 번갈아 할당
  const yesterday = getYesterday(date);
  const { data: prevMission } = await supabase
    .from("user_missions")
    .select("mission_id, missions(mission_type)")
    .eq("user_id", userId)
    .eq("assigned_date", yesterday)
    .single();

  // 첫 미션은 관찰부터
  let targetType: "observe" | "explore" = "observe";
  if (prevMission) {
    const prev = prevMission as any;
    targetType = prev.missions.mission_type === "observe" ? "explore" : "observe";
  }

  // 3. 이미 본 미션 ID 목록
  const { data: seenMissions } = await supabase
    .from("user_missions")
    .select("mission_id")
    .eq("user_id", userId);

  const seenIds = seenMissions?.map((m) => m.mission_id) || [];

  // 4. 최근 3일 카테고리
  const recentCategories = await getRecentCategories(userId);

  // 5. 후보 미션 조회
  let candidates = await getCandidates(targetType, seenIds);

  // 소진 시 재순환 (seenIds 무시)
  if (candidates.length === 0) {
    candidates = await getCandidates(targetType, []);
  }

  if (candidates.length === 0) return null;

  // 6. 카테고리 분산 점수 → 선택
  const preferred = candidates.filter(
    (m) => !recentCategories.includes(m.category)
  );
  const pool = preferred.length > 0 ? preferred : candidates;
  const selected = pool[Math.floor(Math.random() * pool.length)];

  // 7. user_missions에 INSERT
  const { data: newMission, error: insertError } = await supabase
    .from("user_missions")
    .insert({
      user_id: userId,
      mission_id: selected.id,
      assigned_date: date,
    })
    .select("*, missions(*)")
    .single();

  if (insertError) {
    throw new Error(`미션 할당 실패: ${insertError.message}`);
  }

  return newMission as UserMissionWithDetails;
}

/** 후보 미션 조회 (타입 필터 + 이미 본 미션 제외) */
async function getCandidates(
  type: "observe" | "explore",
  excludeIds: number[]
) {
  let query = supabase
    .from("missions")
    .select("*")
    .eq("mission_type", type);

  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data } = await query;
  return data || [];
}

/** 최근 3일간 할당된 미션 카테고리 */
async function getRecentCategories(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("user_missions")
    .select("missions(category)")
    .eq("user_id", userId)
    .order("assigned_date", { ascending: false })
    .limit(3);

  return data?.map((m: any) => m.missions?.category).filter(Boolean) || [];
}

/** 어제 날짜 (YYYY-MM-DD) */
function getYesterday(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

/** 오늘 날짜 (YYYY-MM-DD) */
export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}
