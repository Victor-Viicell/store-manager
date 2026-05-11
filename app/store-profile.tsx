import React, { useEffect, useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/context/auth";
import {
  ChevronLeft,
  Building2,
  Globe,
  MapPin,
  Clock,
  MessageCircle,
  Instagram,
  Save,
} from "lucide-react-native";

export default function StoreProfile() {
  const router = useRouter();
  const { user } = useAuth();

  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("store_name, whatsapp, instagram")
      .eq("id", user.id)
      .single();

    if (data) {
      setStoreName(data.store_name || "");
      setWhatsapp(data.whatsapp || "");
      setInstagram(data.instagram || "");
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        store_name: storeName.trim() || null,
        whatsapp: whatsapp.trim() || null,
        instagram: instagram.trim() || null,
      })
      .eq("id", user.id);

    setIsSaving(false);

    if (error) {
      Alert.alert("Erro ao salvar", error.message);
    } else {
      Alert.alert("Salvo!", "Perfil da empresa atualizado com sucesso.");
    }
  };

  if (isLoading) {
    return (
      <Box className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0f172a" />
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-slate-50">
      <HStack className="h-16 items-center px-4 bg-white border-b border-slate-100">
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          className="p-2 -ml-2"
        >
          <ChevronLeft size={24} color="#0f172a" />
        </Pressable>
        <Heading size="md" className="ml-2">
          Perfil da empresa
        </Heading>
      </HStack>

      <ScrollView className="flex-1 p-6">
        <VStack space="xl">
          {/* Store Info */}
          <Box className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
            <VStack space="xl">
              {/* Store Name */}
              <VStack space="xs">
                <HStack space="sm" className="items-center">
                  <Box className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center border border-slate-100">
                    <Building2 size={20} color="#0f172a" />
                  </Box>
                  <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Nome da loja
                  </Text>
                </HStack>
                <Input className="rounded-xl border-slate-200 h-12 bg-white ml-12">
                  <InputField
                    placeholder="Ex: Minha Loja"
                    value={storeName}
                    onChangeText={setStoreName}
                    className="text-sm"
                  />
                </Input>
              </VStack>

              <Divider />

              {/* WhatsApp */}
              <VStack space="xs">
                <HStack space="sm" className="items-center">
                  <Box className="w-10 h-10 bg-green-50 rounded-xl items-center justify-center border border-green-100">
                    <MessageCircle size={20} color="#16a34a" />
                  </Box>
                  <VStack>
                    <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      WhatsApp
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      Clientes usarão para contato após pedir
                    </Text>
                  </VStack>
                </HStack>
                <Input className="rounded-xl border-slate-200 h-12 bg-white ml-12">
                  <InputField
                    placeholder="Ex: 5511999998888"
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                    className="text-sm"
                    keyboardType="phone-pad"
                  />
                </Input>
              </VStack>

              <Divider />

              {/* Instagram */}
              <VStack space="xs">
                <HStack space="sm" className="items-center">
                  <Box className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center border border-purple-100">
                    <Instagram size={20} color="#7e22ce" />
                  </Box>
                  <VStack>
                    <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Instagram
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      Outro canal de contato para os clientes
                    </Text>
                  </VStack>
                </HStack>
                <Input className="rounded-xl border-slate-200 h-12 bg-white ml-12">
                  <InputField
                    placeholder="Ex: @minhaloja"
                    value={instagram}
                    onChangeText={setInstagram}
                    className="text-sm"
                  />
                </Input>
              </VStack>
            </VStack>
          </Box>

          {/* Save Button */}
          <Button
            onPress={handleSave}
            isDisabled={isSaving}
            className="rounded-xl bg-[#111827] h-14"
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Save size={18} color="white" style={{ marginRight: 8 }} />
                <ButtonText className="font-bold text-base">
                  Salvar alterações
                </ButtonText>
              </>
            )}
          </Button>

          {/* Info */}
          <Box className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <Text className="text-xs text-blue-700 leading-relaxed">
              💡 Essas informações de contato serão exibidas para os clientes
              após eles enviarem um pedido, permitindo que entrem em contato para
              combinar pagamento e entrega.
            </Text>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
}

const Divider = () => <Box className="h-[1px] bg-slate-100 w-full" />;
