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
    const inTabs = segments[0] === "(tabs)";

    if (!session) {
      // 미인증 → 로그인으로
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    } else if (inAuthGroup) {
      // 인증 완료인데 로그인 화면 → 온보딩 또는 탭으로
      if (profile && !profile.onboarding_completed) {
        router.replace("/(onboarding)");
      } else {
        router.replace("/(tabs)/mission");
      }
    } else if (profile && !profile.onboarding_completed && !inOnboardingGroup) {
      // 온보딩 미완료 → 온보딩으로
      router.replace("/(onboarding)");
    } else if (profile && profile.onboarding_completed && !inTabs && !inOnboardingGroup) {
      // 온보딩 완료인데 탭 밖(루트 등) → 탭으로
      router.replace("/(tabs)/mission");
    }
  }, [session, authLoading, profileLoading, profile, segments]);

  return <Slot />;
}
