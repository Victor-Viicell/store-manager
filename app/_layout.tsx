import { Stack } from "expo-router";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { AuthProvider } from '@/context/auth';
import '@/global.css';

export default function RootLayout() {

  return (
    <AuthProvider>
      <GluestackUIProvider mode="light">
        <Stack screenOptions={{ headerShown: false }} />
      </GluestackUIProvider>
    </AuthProvider>
  )
}
