import { View, Text, Pressable } from "react-native";
import type { Question } from "@/types/database";

type Props = {
  question: Question;
  selectedOption: string | null;
  onSelectOption: (option: string) => void;
};

export default function ReflectionCard({ question, selectedOption, onSelectOption }: Props) {
  return (
    <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* 상단: 카테고리 배지 + 성찰 질문 라벨 */}
      <View className="flex-row items-center mb-4">
        {question.category && (
          <View className="bg-purple-50 px-3 py-1 rounded-full mr-2">
            <Text className="text-sm font-medium text-purple-700">
              {question.category}
            </Text>
          </View>
        )}
        <Text className="text-sm text-gray-500">성찰 질문</Text>
      </View>

      {/* 질문 텍스트 */}
      <Text className="text-xl font-bold text-gray-900 mb-6">
        {question.question_text}
      </Text>

      {/* 옵션 목록 */}
      <View className="mb-4">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === option;
          return (
            <Pressable
              key={index}
              onPress={() => onSelectOption(option)}
              className={`p-4 rounded-xl mb-3 ${
                isSelected
                  ? "bg-gray-900 border border-gray-900"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <Text
                className={`text-base ${
                  isSelected ? "text-white font-medium" : "text-gray-700"
                }`}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 파생 질문 — 옵션 선택 후 표시 */}
      {selectedOption && question.followup_hints && question.followup_hints.length > 0 && (
        <View className="bg-amber-50 rounded-xl p-4 mb-4">
          <Text className="text-sm font-medium text-amber-800 mb-2">
            💡 조금 더 생각해보세요
          </Text>
          {question.followup_hints.map((hint, index) => (
            <Text key={index} className="text-sm text-amber-700 leading-5 mb-1">
              • {hint}
            </Text>
          ))}
        </View>
      )}

      {/* 하단: 출처 정보 */}
      <View className="pt-4 border-t border-gray-100">
        <Text className="text-sm text-gray-400">
          출처: {question.source_title}
        </Text>
      </View>
    </View>
  );
}
