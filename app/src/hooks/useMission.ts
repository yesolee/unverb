import { useState, useEffect, useCallback } from "react";
import { assignTodayMission, getToday } from "@/lib/mission-assignment";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";
import type { UserMissionWithDetails } from "@/types/database";

export function useMission() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [mission, setMission] = useState<UserMissionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 인증/프로필 로딩 중이면 대기
    if (authLoading || profileLoading) return;

    // 로그인 안 됐거나 프로필 없으면 종료
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const today = getToday();
        const data = await assignTodayMission(user.id, today);
        setMission(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user, profile, authLoading, profileLoading]);

  // 미션 완료 토글
  const toggleComplete = useCallback(async () => {
    if (!mission) return;

    const newCompleted = !mission.completed;
    const completedAt = newCompleted ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("user_missions")
      .update({ completed: newCompleted, completed_at: completedAt })
      .eq("id", mission.id);

    if (!error) {
      setMission({ ...mission, completed: newCompleted, completed_at: completedAt });
    }
  }, [mission]);

  return { mission, loading, error, toggleComplete };
}
