import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { UserMissionWithDetails } from "@/types/database";
import SourcePopup from "./SourcePopup";

type Props = {
  mission: UserMissionWithDetails;
  onToggleComplete: () => void;
};

export default function MissionCard({ mission, onToggleComplete }: Props) {
  const [showSource, setShowSource] = useState(false);
  const m = mission.missions;
  const isObserve = m.mission_type === "observe";

  return (
    <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* 미션 타입 배지 */}
      <View
        className={`self-start px-3 py-1 rounded-full mb-4 ${
          isObserve ? "bg-blue-50" : "bg-green-50"
        }`}
      >
        <Text
          className={`text-sm font-medium ${
            isObserve ? "text-blue-700" : "text-green-700"
          }`}
        >
          {isObserve ? "🔍 관찰 미션" : "🌱 탐색 미션"}
        </Text>
      </View>

      {/* 미션 텍스트 */}
      <Text className="text-2xl font-bold text-gray-900 mb-3">
        {m.mission_text}
      </Text>

      {/* 의미 설명 */}
      <Text className="text-base text-gray-600 leading-6 mb-4">
        {m.meaning_text}
      </Text>

      {/* 관찰/탐색 포인트 */}
      {m.hints && m.hints.length > 0 && (
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            {isObserve ? "🔍 관찰 포인트" : "🌱 탐색 포인트"}
          </Text>
          {m.hints.map((hint, index) => (
            <Text key={index} className="text-sm text-gray-600 leading-5 mb-1">
              • {hint}
            </Text>
          ))}
        </View>
      )}

      {/* 하단: 출처 + 완료 버튼 */}
      <View className="flex-row justify-between items-center mt-2">
        <Pressable onPress={() => setShowSource(true)}>
          <Text className="text-sm text-gray-400 underline">출처 보기</Text>
        </Pressable>

        <Pressable
          onPress={onToggleComplete}
          className={`flex-row items-center px-4 py-2 rounded-lg ${
            mission.completed ? "bg-gray-100" : "bg-gray-900"
          }`}
        >
          <Ionicons
            name={mission.completed ? "checkmark-circle" : "checkmark-circle-outline"}
            size={18}
            color={mission.completed ? "#6B7280" : "#FFFFFF"}
          />
          <Text
            className={`ml-1 font-medium ${
              mission.completed ? "text-gray-500" : "text-white"
            }`}
          >
            {mission.completed ? "완료됨" : "완료"}
          </Text>
        </Pressable>
      </View>

      {/* 출처 팝업 */}
      <SourcePopup
        visible={showSource}
        onClose={() => setShowSource(false)}
        title={m.source_title}
        doi={m.source_doi}
      />
    </View>
  );
}
