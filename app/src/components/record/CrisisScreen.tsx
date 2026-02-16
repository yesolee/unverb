import { View, Text, Pressable, Linking, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  helplines: { name: string; number: string }[];
  onClose: () => void;
};

export default function CrisisScreen({ helplines, onClose }: Props) {
  // 전화 연결
  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-6">
        {/* 타이틀 */}
        <Text className="text-2xl font-bold text-gray-900 mb-3">
          잠깐, 이야기를 나눠볼까요?
        </Text>

        {/* 설명 */}
        <Text className="text-base text-gray-600 leading-6 mb-8">
          혹시 힘든 마음이 있다면, 전문가와 이야기를 나눠보는 것도 좋아요.
          {"\n"}
          언제든 연락할 수 있는 곳이 있어요.
        </Text>

        {/* 전화번호 목록 */}
        <View className="mb-6">
          {helplines.map((helpline, index) => (
            <Pressable
              key={index}
              onPress={() => handleCall(helpline.number)}
              className="bg-blue-50 rounded-xl p-4 flex-row items-center mb-3"
            >
              <View className="bg-blue-100 rounded-full p-3 mr-4">
                <Ionicons name="call" size={24} color="#1D4ED8" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">
                  {helpline.name}
                </Text>
                <Text className="text-lg font-bold text-blue-700">
                  {helpline.number}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </Pressable>
          ))}
        </View>

        {/* 추가 안내 */}
        <View className="bg-gray-50 rounded-xl p-4 mb-6">
          <Text className="text-sm text-gray-600 leading-5">
            💙 모든 상담은 무료이며 익명으로 진행됩니다.
            {"\n"}
            💙 24시간 언제든 연락할 수 있습니다.
            {"\n"}
            💙 당신은 혼자가 아니에요.
          </Text>
        </View>
      </ScrollView>

      {/* 하단: 돌아가기 버튼 */}
      <View className="px-5 pb-6">
        <Pressable
          onPress={onClose}
          className="bg-gray-200 rounded-xl py-4 items-center"
        >
          <Text className="text-base font-semibold text-gray-700">
            돌아가기
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
