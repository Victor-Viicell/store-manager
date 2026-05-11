import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { AuthProvider } from '@/context/auth';
import { CartProvider } from '@/context/cart';
import '@/global.css';

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <GluestackUIProvider mode="light">
            <Stack screenOptions={{ headerShown: false }} />
          </GluestackUIProvider>
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
