import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";

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
      <Button variant="solid" size="md" action="primary" onPress={() => router.push("/app/dashboard")}>
        <ButtonText>
          Merchant Interface
        </ButtonText>
      </Button>
      <Button variant="solid" size="md" action="primary" onPress={() => router.push("/web/store")}>
        <ButtonText>
          Store
        </ButtonText>
      </Button>
    </View>
  );
}