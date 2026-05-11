import React, { useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Key, Lock } from "lucide-react-native";
import { supabase } from "@/utils/supabase";

export default function LoginSecurity() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setIsUpdating(false);

    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      Alert.alert("Sucesso", "Sua senha foi atualizada com sucesso.");
      setNewPassword("");
    }
  };

  return (
    <Box className="flex-1 bg-slate-50">
      <HStack className="h-16 items-center px-4 bg-white border-b border-slate-100">
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#0f172a" />
        </Pressable>
        <Heading size="md" className="ml-2">Login e segurança</Heading>
      </HStack>

      <ScrollView className="flex-1 p-6">
        <VStack space="xl">
          <Box className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
            <VStack space="lg">
              <HStack space="md" className="items-center mb-2">
                <Box className="w-12 h-12 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                  <Key size={24} color="#0f172a" />
                </Box>
                <VStack>
                  <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">Segurança</Text>
                  <Text className="text-slate-600 text-sm">Atualize sua senha de acesso</Text>
                </VStack>
              </HStack>
              
              <Divider />
              
              <VStack space="xs" className="mt-2">
                <Text className="text-xs font-bold text-slate-700 ml-1">
                  Nova Senha
                </Text>
                <Input className="rounded-2xl border-slate-200 h-14 bg-slate-50/50 px-4">
                  <Lock size={20} color="#94a3b8" className="mr-2" />
                  <InputField 
                    placeholder="Mínimo 6 caracteres" 
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </Input>
              </VStack>

              <Button 
                onPress={handleUpdatePassword} 
                disabled={isUpdating || !newPassword}
                className="mt-4 rounded-xl bg-[#111827] h-12"
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <ButtonText className="font-bold text-base">Atualizar senha</ButtonText>
                )}
              </Button>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
}

const Divider = () => <Box className="h-[1px] bg-slate-100 w-full" />;
