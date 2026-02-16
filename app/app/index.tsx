// 루트 인덱스 — 앱 시작 시 URL "/" 매칭용
// 실제 라우팅은 _layout.tsx의 useEffect에서 처리
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#111827" />
    </View>
  );
}
