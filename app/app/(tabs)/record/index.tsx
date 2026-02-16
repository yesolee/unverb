// 기록 화면 — 스텝 기반 상태 머신
// idle → recording → reflection → feedback → done
import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "expo-router";
import { useMission } from "@/hooks/useMission";
import { useRecording } from "@/hooks/useRecording";
import { useReflection } from "@/hooks/useReflection";
import { useAiFeedback } from "@/hooks/useAiFeedback";
import PhotoInput from "@/components/record/PhotoInput";
import ReflectionCard from "@/components/record/ReflectionCard";
import FeedbackCard from "@/components/record/FeedbackCard";
import CrisisScreen from "@/components/record/CrisisScreen";
import type { RecordStep } from "@/types/database";

export default function RecordScreen() {
  const { mission, loading: missionLoading, refetch } = useMission();
  const navigation = useNavigation();
  const [step, setStep] = useState<RecordStep>("idle");

  // 탭 포커스 시 미션 데이터 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refetch();
    });
    return unsubscribe;
  }, [navigation, refetch]);

  // 훅 초기화
  const recording = useRecording(mission?.id ?? null);
  const reflection = useReflection(recording.savedRecording?.id ?? null);
  const aiFeedback = useAiFeedback();

  // 기록 시작
  const startRecording = useCallback(() => {
    setStep("recording");
  }, []);

  // 기록 저장 → 성찰 질문으로 이동
  const handleSaveRecording = useCallback(async () => {
    const saved = await recording.save();
    if (saved) {
      setStep("reflection");
    }
  }, [recording]);

  // 성찰 응답 저장 → AI 피드백 요청
  const handleSaveReflection = useCallback(async () => {
    if (!mission || !recording.savedRecording) return;

    const success = await reflection.save();
    if (success) {
      setStep("feedback");

      // AI 피드백 요청
      const m = mission.missions;
      aiFeedback.requestFeedback({
        recordingId: recording.savedRecording.id,
        missionText: m.mission_text,
        missionType: m.mission_type,
        meaningText: m.meaning_text,
        textContent: recording.textContent,
      });
    }
  }, [mission, recording.savedRecording, recording.textContent, reflection, aiFeedback.requestFeedback]);

  // 완료
  const handleDone = useCallback(() => {
    setStep("done");
  }, []);

  // 위기 화면에서 돌아가기
  const handleCrisisClose = useCallback(() => {
    aiFeedback.clearCrisis();
    setStep("done");
  }, [aiFeedback]);

  // 로딩 중
  if (missionLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#111827" />
      </SafeAreaView>
    );
  }

  // 위기 감지 — Level 3
  if (aiFeedback.crisis?.level === 3 && aiFeedback.crisis.helplines) {
    return (
      <CrisisScreen
        helplines={aiFeedback.crisis.helplines}
        onClose={handleCrisisClose}
      />
    );
  }

  // idle — 미션이 있으면 기록 시작 유도
  if (step === "idle") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView className="flex-1 px-5 pt-6">
          <Text className="text-sm text-gray-500 mb-1">오늘의 기록</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            경험을 기록해보세요
          </Text>

          {mission && mission.completed ? (
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center">
              <Text className="text-4xl mb-4">✏️</Text>
              <Text className="text-lg font-bold text-gray-900 mb-2">
                미션을 수행하셨네요!
              </Text>
              <Text className="text-base text-gray-600 text-center leading-6 mb-6">
                오늘의 경험을 사진과 글로 남겨보세요.
              </Text>
              <Pressable
                onPress={startRecording}
                className="bg-gray-900 py-4 px-8 rounded-xl w-full"
              >
                <Text className="text-base font-semibold text-white text-center">
                  기록 시작하기
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center">
              <Text className="text-4xl mb-4">📋</Text>
              <Text className="text-lg font-bold text-gray-900 mb-2">
                미션을 먼저 완료해주세요
              </Text>
              <Text className="text-base text-gray-500 text-center">
                미션 탭에서 오늘의 미션을 확인하고{"\n"}완료 후 기록할 수 있어요.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // recording — 사진 + 텍스트 입력
  if (step === "recording") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView className="flex-1 px-5 pt-6">
            <Text className="text-sm text-gray-500 mb-1">
              {mission?.missions.mission_type === "observe" ? "🔍 관찰 미션" : "🌱 탐색 미션"}
            </Text>
            <Text className="text-xl font-bold text-gray-900 mb-6">
              {mission?.missions.mission_text}
            </Text>

            {/* 사진 입력 */}
            <View className="mb-6">
              <PhotoInput
                imageUri={recording.imageUri}
                onImageSelected={recording.selectImage}
                onImageRemoved={recording.removeImage}
              />
            </View>

            {/* 텍스트 입력 */}
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <TextInput
                className="text-base text-gray-900 min-h-[120px]"
                placeholder="오늘의 경험을 적어보세요 (3줄 이내 권장)"
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                value={recording.textContent}
                onChangeText={recording.updateText}
                maxLength={500}
              />
              <Text className="text-sm text-gray-400 text-right mt-2">
                {recording.textContent.length}/500
              </Text>
            </View>

            {/* 에러 메시지 */}
            {recording.error && (
              <Text className="text-red-500 text-center mb-4">
                {recording.error}
              </Text>
            )}
          </ScrollView>

          {/* 하단 버튼 */}
          <View className="px-5 pb-6">
            <Pressable
              onPress={handleSaveRecording}
              disabled={!recording.canSave}
              className={`py-4 rounded-xl items-center ${
                recording.canSave ? "bg-gray-900" : "bg-gray-300"
              }`}
            >
              {recording.saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  다음
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // reflection — 성찰 질문
  if (step === "reflection") {
    if (reflection.loading) {
      return (
        <SafeAreaView className="flex-1 bg-white justify-center items-center">
          <ActivityIndicator size="large" color="#111827" />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView className="flex-1 px-5 pt-6">
          <Text className="text-sm text-gray-500 mb-1">성찰 시간</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            잠깐 생각해볼까요?
          </Text>

          {reflection.question && (
            <ReflectionCard
              question={reflection.question}
              selectedOption={reflection.selectedOption}
              onSelectOption={reflection.selectOption}
            />
          )}

          {reflection.error && (
            <Text className="text-red-500 text-center mt-4">
              {reflection.error}
            </Text>
          )}
        </ScrollView>

        <View className="px-5 pb-6">
          <Pressable
            onPress={handleSaveReflection}
            disabled={!reflection.canSave}
            className={`py-4 rounded-xl items-center ${
              reflection.canSave ? "bg-gray-900" : "bg-gray-300"
            }`}
          >
            {reflection.saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-semibold text-white">
                다음
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // feedback — AI 피드백
  if (step === "feedback") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView className="flex-1 px-5 pt-6">
          <Text className="text-sm text-gray-500 mb-1">AI 담임선생님</Text>
          <Text className="text-2xl font-bold text-gray-900 mb-6">
            오늘의 피드백
          </Text>

          {aiFeedback.loading || aiFeedback.feedback ? (
            <FeedbackCard
              feedback={aiFeedback.feedback ?? { empathy: "", discovery: "", hint: "" }}
              loading={aiFeedback.loading}
            />
          ) : (
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center">
              <Text className="text-red-500 text-center">
                피드백을 불러올 수 없습니다.
              </Text>
            </View>
          )}

          {aiFeedback.error && (
            <Text className="text-red-500 text-center mt-4">
              {aiFeedback.error}
            </Text>
          )}
        </ScrollView>

        {!aiFeedback.loading && (
          <View className="px-5 pb-6">
            <Pressable
              onPress={handleDone}
              className="bg-gray-900 py-4 rounded-xl items-center"
            >
              <Text className="text-base font-semibold text-white">
                완료
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // done — 완료 화면
  return (
    <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-5">
      <Text className="text-5xl mb-6">🎉</Text>
      <Text className="text-2xl font-bold text-gray-900 mb-3">
        오늘의 기록 완료!
      </Text>
      <Text className="text-base text-gray-600 text-center leading-6">
        내일도 새로운 발견이 기다리고 있어요.
      </Text>
    </SafeAreaView>
  );
}
