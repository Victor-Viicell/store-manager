import React from "react";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Palette, Image as ImageIcon, Type } from "lucide-react-native";

export default function StoreBranding() {
  const router = useRouter();

  return (
    <Box className="flex-1 bg-slate-50">
      <HStack className="h-16 items-center px-4 bg-white border-b border-slate-100">
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#0f172a" />
        </Pressable>
        <Heading size="md" className="ml-2">Identidade visual</Heading>
      </HStack>

      <ScrollView className="flex-1 p-6">
        <VStack space="xl">
          <Box className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
            <VStack space="xl">
              <BrandingItem 
                icon={Palette} 
                label="Cores da Marca" 
                description="Defina as cores primárias e secundárias" 
              />
              <Divider />
              <BrandingItem 
                icon={ImageIcon} 
                label="Logotipo" 
                description="Upload do logo em alta resolução" 
              />
              <Divider />
              <BrandingItem 
                icon={Type} 
                label="Tipografia" 
                description="Escolha as fontes para o seu catálogo" 
              />
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
}

const Divider = () => <Box className="h-[1px] bg-slate-100 w-full" />;

const BrandingItem = ({ icon: IconComp, label, description }: { icon: any, label: string, description: string }) => (
  <HStack space="md" className="items-center py-2">
    <Box className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100">
      <IconComp size={20} color="#0f172a" />
    </Box>
    <VStack className="flex-1">
      <Text className="text-slate-900 font-bold text-sm">{label}</Text>
      <Text className="text-slate-500 text-xs font-medium">{description}</Text>
    </VStack>
    <Pressable className="border border-slate-200 px-4 py-2 rounded-lg">
      <Text className="text-slate-600 text-xs font-bold">Configurar</Text>
    </Pressable>
  </HStack>
);
