import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectUri = makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );

        if (result.type === "success" && result.url) {
          // URL에서 토큰 추출
          const url = new URL(result.url);
          const params = new URLSearchParams(
            url.hash ? url.hash.substring(1) : url.search.substring(1)
          );
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    } catch (err: any) {
      Alert.alert("로그인 실패", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white px-8">
      <Text className="text-4xl font-bold mb-4 text-gray-900">unverb</Text>
      <Text className="text-base text-gray-500 mb-16 text-center leading-6">
        매일 작은 미션으로{"\n"}나의 동사를 발견하세요
      </Text>

      <Pressable
        onPress={handleGoogleLogin}
        disabled={loading}
        className="bg-gray-900 w-full py-4 rounded-xl items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-base font-semibold">
            Google로 시작하기
          </Text>
        )}
      </Pressable>
    </View>
  );
}
