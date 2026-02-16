import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { Profile } from "@/types/database";

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchOrCreateProfile = async () => {
      // 기존 프로필 조회
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setLoading(false);
        return;
      }

      // 없으면 생성
      if (error?.code === "PGRST116") {
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            nickname: `사용자${Math.floor(Math.random() * 1000)}`,
            onboarding_completed: false,
          })
          .select()
          .single();

        setProfile(newProfile);
      }

      setLoading(false);
    };

    fetchOrCreateProfile();
  }, [user]);

  // 온보딩 완료 처리
  const completeOnboarding = useCallback(async () => {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", profile.id);

    if (!error) {
      setProfile({ ...profile, onboarding_completed: true });
    }
  }, [profile]);

  return { profile, loading, completeOnboarding };
}
