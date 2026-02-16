import { View, Text, ActivityIndicator, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMission } from "@/hooks/useMission";
import MissionCard from "@/components/mission/MissionCard";

export default function MissionScreen() {
  const router = useRouter();
  const { mission, loading, error, toggleComplete } = useMission();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#111827" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-8">
        <Text className="text-red-500 text-center">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5 pt-6">
        {/* 헤더 */}
        <Text className="text-sm text-gray-500 mb-1">오늘의 미션</Text>
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          나를 발견하는 시간
        </Text>

        {/* 미션 카드 */}
        {mission ? (
          <>
            <MissionCard mission={mission} onToggleComplete={toggleComplete} />

            {/* 미션 완료 후 기록하기 CTA */}
            {mission.completed && (
              <Pressable
                onPress={() => router.push("/(tabs)/record")}
                className="bg-gray-900 py-4 rounded-xl items-center mt-6"
              >
                <Text className="text-base font-semibold text-white">
                  기록하러 가기 ✏️
                </Text>
              </Pressable>
            )}
          </>
        ) : (
          <View className="bg-white rounded-2xl p-6 items-center">
            <Text className="text-gray-500">미션을 준비하고 있어요...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
