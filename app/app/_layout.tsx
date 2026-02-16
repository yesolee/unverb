import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import "../global.css";

// 루트 레이아웃: 인증 + 온보딩 가드
export default function RootLayout() {
  const { session, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || profileLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    if (!session && !inAuthGroup) {
      // 미인증 → 로그인으로
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      // 인증 완료 → 온보딩 여부 확인
      if (profile && !profile.onboarding_completed) {
        router.replace("/(onboarding)");
      } else {
        router.replace("/(tabs)/mission/index");
      }
    } else if (session && !inOnboardingGroup && !inAuthGroup && profile && !profile.onboarding_completed) {
      // 온보딩 미완료인데 탭에 있으면 → 온보딩으로
      router.replace("/(onboarding)");
    }
  }, [session, authLoading, profileLoading, profile, segments]);

  return <Slot />;
}
