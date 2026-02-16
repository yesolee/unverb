import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function MypageScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("로그아웃", "정말 로그아웃할까요?", [
      { text: "취소", style: "cancel" },
      { text: "로그아웃", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-6">
        <Text className="text-2xl font-bold text-gray-900 mb-8">마이</Text>

        {/* 프로필 카드 */}
        <View className="bg-white rounded-2xl p-5 mb-4">
          <Text className="text-lg font-semibold text-gray-900">
            {profile?.nickname || "사용자"}
          </Text>
          <Text className="text-sm text-gray-400 mt-1">
            {user?.email}
          </Text>
        </View>

        {/* 앱 소개 다시보기 */}
        <Pressable
          onPress={() => router.push("/(onboarding)")}
          className="bg-white rounded-2xl p-4 items-center mb-3"
        >
          <Text className="text-gray-700 font-medium">앱 소개 다시보기</Text>
        </Pressable>

        {/* 로그아웃 버튼 */}
        <Pressable
          onPress={handleSignOut}
          className="bg-white rounded-2xl p-4 items-center"
        >
          <Text className="text-red-500 font-medium">로그아웃</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
