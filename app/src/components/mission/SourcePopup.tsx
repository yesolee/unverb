import { View, Text, Pressable, Modal, Linking } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  doi: string;
};

export default function SourcePopup({ visible, onClose, title, doi }: Props) {
  const doiUrl = `https://doi.org/${doi}`;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-t-2xl p-6"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-lg font-bold text-gray-900 mb-3">
            학술 출처
          </Text>

          <Text className="text-base text-gray-700 leading-6 mb-4">
            {title}
          </Text>

          <Pressable
            onPress={() => Linking.openURL(doiUrl).catch(() => {})}
            className="mb-4"
          >
            <Text className="text-sm text-blue-600 underline">
              {doiUrl}
            </Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            className="bg-gray-100 py-3 rounded-xl items-center"
          >
            <Text className="text-gray-700 font-medium">닫기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
