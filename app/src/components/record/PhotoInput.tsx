import { useState } from "react";
import { View, Text, Pressable, Image, Alert, ActionSheetIOS, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

type Props = {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  onImageRemoved: () => void;
};

export default function PhotoInput({ imageUri, onImageSelected, onImageRemoved }: Props) {
  const [loading, setLoading] = useState(false);

  // 카메라 권한 요청 및 촬영
  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "카메라 권한이 필요합니다.");
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("오류", "사진 촬영 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 갤러리에서 선택
  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "사진 라이브러리 접근 권한이 필요합니다.");
        return;
      }

      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("오류", "사진 선택 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ActionSheet 표시
  const showActionSheet = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["취소", "카메라로 촬영", "갤러리에서 선택"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleCamera();
          } else if (buttonIndex === 2) {
            handleGallery();
          }
        }
      );
    } else {
      // Android의 경우 Alert로 처리
      Alert.alert("사진 선택", "어떤 방법으로 사진을 가져올까요?", [
        { text: "취소", style: "cancel" },
        { text: "카메라로 촬영", onPress: handleCamera },
        { text: "갤러리에서 선택", onPress: handleGallery },
      ]);
    }
  };

  // 사진이 없을 때: 선택 UI
  if (!imageUri) {
    return (
      <Pressable
        onPress={showActionSheet}
        disabled={loading}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-12 items-center justify-center bg-gray-50"
      >
        <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
        <Text className="text-base text-gray-400 mt-4">
          {loading ? "처리 중..." : "사진을 찍거나 골라보세요"}
        </Text>
      </Pressable>
    );
  }

  // 사진이 있을 때: 프리뷰 + 삭제 버튼
  return (
    <View className="relative">
      <Image
        source={{ uri: imageUri }}
        className="w-full aspect-[4/3] rounded-2xl"
        resizeMode="cover"
      />
      <Pressable
        onPress={onImageRemoved}
        className="absolute top-3 right-3 bg-gray-900/80 rounded-full p-2"
      >
        <Ionicons name="close" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
