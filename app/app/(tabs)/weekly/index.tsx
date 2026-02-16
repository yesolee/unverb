import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WeeklyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
      <Text className="text-gray-400 text-lg">한 주 (Phase 2에서 구현)</Text>
    </SafeAreaView>
  );
}
