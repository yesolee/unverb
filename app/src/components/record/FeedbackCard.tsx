import { View, Text, ActivityIndicator } from "react-native";
import type { AiFeedbackResponse } from "@/types/database";

type Props = {
  feedback: AiFeedbackResponse;
  loading?: boolean;
};

export default function FeedbackCard({ feedback, loading = false }: Props) {
  // 로딩 중: 스켈레톤 UI
  if (loading) {
    return (
      <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center">
        <Text className="text-xl font-bold text-gray-900 mb-6">
          담임선생님의 한마디
        </Text>
        <ActivityIndicator size="large" color="#111827" />
        <Text className="text-base text-gray-500 mt-4">
          피드백을 준비하고 있어요...
        </Text>
      </View>
    );
  }

  // 피드백 표시
  return (
    <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* 타이틀 */}
      <Text className="text-xl font-bold text-gray-900 mb-6">
        담임선생님의 한마디
      </Text>

      {/* 공감 (empathy) */}
      <View className="bg-blue-50 p-4 rounded-xl mb-3">
        <View className="flex-row items-start mb-2">
          <Text className="text-lg mr-2">💬</Text>
          <Text className="text-base font-semibold text-blue-900">공감</Text>
        </View>
        <Text className="text-base text-gray-700 leading-6">
          {feedback.empathy}
        </Text>
      </View>

      {/* 발견 (discovery) */}
      <View className="bg-amber-50 p-4 rounded-xl mb-3">
        <View className="flex-row items-start mb-2">
          <Text className="text-lg mr-2">🔍</Text>
          <Text className="text-base font-semibold text-amber-900">발견</Text>
        </View>
        <Text className="text-base text-gray-700 leading-6">
          {feedback.discovery}
        </Text>
      </View>

      {/* 힌트 (hint) */}
      <View className="bg-green-50 p-4 rounded-xl">
        <View className="flex-row items-start mb-2">
          <Text className="text-lg mr-2">💡</Text>
          <Text className="text-base font-semibold text-green-900">힌트</Text>
        </View>
        <Text className="text-base text-gray-700 leading-6">
          {feedback.hint}
        </Text>
      </View>
    </View>
  );
}
