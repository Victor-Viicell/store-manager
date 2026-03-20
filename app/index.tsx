import { useRouter } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Home</Text>
      <Text onPress={() => router.push("/app/dashboard")}>Merchant Interface</Text>
      <Text onPress={() => router.push("/web/store")}>Store</Text>
    </View>
  );
}
