import { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useProfile } from "@/hooks/useProfile";

const { width } = Dimensions.get("window");

const CARDS = [
  {
    emoji: "🔍",
    title: "작은 행동으로\n나를 발견해요",
    description:
      "unverb는 매일 작은 미션을 통해\n나도 몰랐던 나의 패턴을 발견하는 앱이에요.\n\n거창한 자기분석이 아니라,\n일상 속 작은 관찰에서 시작해요.",
  },
  {
    emoji: "📋",
    title: "미션 → 기록 → 발견",
    description:
      "학술 연구에 기반한 미션을 수행하고,\n그 경험을 사진과 글로 기록하면,\nAI가 당신만의 패턴을 찾아줘요.\n\n모든 미션에는 학술 출처가 있어요.",
  },
  {
    emoji: "✨",
    title: "오늘부터\n시작해볼까요?",
    description: "첫 번째 미션이 기다리고 있어요.\n하루 한 가지, 나를 발견하는 시간.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useProfile();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  };

  const handleStart = async () => {
    await completeOnboarding();
    router.replace("/(tabs)/mission/index");
  };

  const handleNext = () => {
    if (currentPage < CARDS.length - 1) {
      scrollRef.current?.scrollTo({
        x: (currentPage + 1) * width,
        animated: true,
      });
    }
  };

  const isLastPage = currentPage === CARDS.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* 스와이프 카드 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        className="flex-1"
      >
        {CARDS.map((card, index) => (
          <View
            key={index}
            style={{ width }}
            className="flex-1 justify-center items-center px-10"
          >
            <Text className="text-6xl mb-8">{card.emoji}</Text>
            <Text className="text-3xl font-bold text-gray-900 text-center mb-6 leading-10">
              {card.title}
            </Text>
            <Text className="text-base text-gray-500 text-center leading-7">
              {card.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* 하단: 페이지 인디케이터 + 버튼 */}
      <View className="px-8 pb-8">
        {/* 페이지 인디케이터 */}
        <View className="flex-row justify-center mb-8">
          {CARDS.map((_, index) => (
            <View
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${
                index === currentPage ? "bg-gray-900" : "bg-gray-300"
              }`}
            />
          ))}
        </View>

        {/* 버튼 */}
        <Pressable
          onPress={isLastPage ? handleStart : handleNext}
          className="bg-gray-900 py-4 rounded-xl items-center"
        >
          <Text className="text-white text-base font-semibold">
            {isLastPage ? "시작하기" : "다음"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
