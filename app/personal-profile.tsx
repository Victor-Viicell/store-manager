import React, { useEffect, useState } from "react";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Pressable, ScrollView, ActivityIndicator, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, User, MapPin, Plus, Trash2, Edit2, X } from "lucide-react-native";
import { useAuth } from "@/context/auth";
import { supabase } from "@/utils/supabase";

type Address = {
  id: string;
  label: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
};

export default function PersonalProfile() {
  const router = useRouter();
  const { user, profile } = useAuth();
  
  // Profile State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Address Form State
  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user?.id)
      .order("is_default", { ascending: false });
    
    if (data) setAddresses(data);
    setIsLoadingAddresses(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq("id", user.id);
    
    setIsSavingProfile(false);
    if (error) {
      Alert.alert("Erro", error.message);
    } else {
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    }
  };

  const openAddressModal = (addr?: Address) => {
    if (addr) {
      setEditingAddress(addr);
      setLabel(addr.label || "");
      setStreet(addr.street || "");
      setNumber(addr.number || "");
      setComplement(addr.complement || "");
      setNeighborhood(addr.neighborhood || "");
      setCity(addr.city || "");
      setState(addr.state || "");
      setZip(addr.zip || "");
    } else {
      setEditingAddress(null);
      setLabel("");
      setStreet("");
      setNumber("");
      setComplement("");
      setNeighborhood("");
      setCity("");
      setState("");
      setZip("");
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    if (!street || !city || !state) {
      Alert.alert("Erro", "Rua, cidade e estado são obrigatórios.");
      return;
    }

    setIsSavingAddress(true);
    const payload = {
      user_id: user.id,
      label: label.trim() || "Meu Endereço",
      street: street.trim(),
      number: number.trim(),
      complement: complement.trim(),
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
    };

    if (editingAddress) {
      const { error } = await supabase.from("addresses").update(payload).eq("id", editingAddress.id);
      if (error) Alert.alert("Erro", error.message);
    } else {
      const isFirst = addresses.length === 0;
      const { error } = await supabase.from("addresses").insert({ ...payload, is_default: isFirst });
      if (error) Alert.alert("Erro", error.message);
    }

    setIsSavingAddress(false);
    setShowAddressModal(false);
    fetchAddresses();
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert("Excluir", "Tem certeza que deseja excluir este endereço?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
          await supabase.from("addresses").delete().eq("id", id);
          fetchAddresses();
      }}
    ]);
  };

  const handleSetDefault = async (id: string) => {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user?.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    fetchAddresses();
  };

  return (
    <Box className="flex-1 bg-slate-50">
      <HStack className="h-16 items-center px-4 bg-white border-b border-slate-100">
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} className="p-2 -ml-2">
          <Icon as={ChevronLeft} size="xl" color="#0f172a" />
        </Pressable>
        <Heading size="md" className="ml-2">Meus Dados</Heading>
      </HStack>

      <ScrollView className="flex-1 p-4 md:p-6">
        <VStack space="xl" className="max-w-[600px] w-full mx-auto pb-10">
          
          {/* Personal Info */}
          <Box className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <Heading size="md" className="text-slate-900 font-bold mb-4">Informações Pessoais</Heading>
            <VStack space="md">
              <VStack space="xs">
                <Text className="text-sm font-semibold text-slate-500">Nome completo</Text>
                <Input className="rounded-xl border-slate-200 bg-white h-12">
                  <InputField value={fullName} onChangeText={setFullName} placeholder="Seu nome" />
                </Input>
              </VStack>
              <VStack space="xs">
                <Text className="text-sm font-semibold text-slate-500">E-mail</Text>
                <Input className="rounded-xl border-slate-200 bg-slate-50 h-12" isDisabled>
                  <InputField value={user?.email || ""} editable={false} />
                </Input>
              </VStack>
              <VStack space="xs">
                <Text className="text-sm font-semibold text-slate-500">Telefone / WhatsApp</Text>
                <Input className="rounded-xl border-slate-200 bg-white h-12">
                  <InputField value={phone} onChangeText={setPhone} placeholder="(11) 99999-9999" keyboardType="phone-pad" />
                </Input>
              </VStack>
              <Button action="primary" onPress={handleSaveProfile} isDisabled={isSavingProfile} className="rounded-xl bg-slate-900 h-12 mt-2">
                <ButtonText className="font-bold">{isSavingProfile ? "Salvando..." : "Salvar Informações"}</ButtonText>
              </Button>
            </VStack>
          </Box>

          {/* Addresses */}
          <Box className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <HStack className="justify-between items-center mb-4">
              <Heading size="md" className="text-slate-900 font-bold">Meus Endereços</Heading>
              <Pressable onPress={() => openAddressModal()} className="bg-slate-100 p-2 rounded-full">
                <Icon as={Plus} size="sm" color="#0f172a" />
              </Pressable>
            </HStack>

            {isLoadingAddresses ? (
              <ActivityIndicator size="small" color="#94a3b8" />
            ) : addresses.length === 0 ? (
              <Text className="text-slate-500 text-sm italic">Nenhum endereço cadastrado.</Text>
            ) : (
              <VStack space="md">
                {addresses.map((addr) => (
                  <Box key={addr.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50 relative">
                    <HStack className="justify-between items-start">
                      <VStack space="xs" className="flex-1 pr-4">
                        <HStack space="sm" className="items-center">
                          <Text className="font-bold text-slate-900">{addr.label}</Text>
                          {addr.is_default && (
                            <Box className="bg-slate-900 px-2 py-0.5 rounded-md">
                              <Text className="text-[10px] text-white font-bold uppercase tracking-wider">Principal</Text>
                            </Box>
                          )}
                        </HStack>
                        <Text className="text-slate-600 text-sm mt-1">
                          {addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ""}
                        </Text>
                        <Text className="text-slate-500 text-xs">
                          {addr.neighborhood} - {addr.city}/{addr.state}
                        </Text>
                        <Text className="text-slate-500 text-xs">CEP: {addr.zip}</Text>
                      </VStack>
                      <HStack space="sm">
                        <Pressable onPress={() => openAddressModal(addr)} className="p-2">
                          <Icon as={Edit2} size="sm" color="#64748b" />
                        </Pressable>
                        <Pressable onPress={() => handleDeleteAddress(addr.id)} className="p-2">
                          <Icon as={Trash2} size="sm" color="#dc2626" />
                        </Pressable>
                      </HStack>
                    </HStack>
                    {!addr.is_default && (
                      <Pressable onPress={() => handleSetDefault(addr.id)} className="mt-3 border-t border-slate-200 pt-3">
                        <Text className="text-primary-600 text-xs font-bold text-center">Tornar principal</Text>
                      </Pressable>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </ScrollView>

      {/* Address Modal */}
      <Modal visible={showAddressModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddressModal(false)}>
        <Box className="flex-1 bg-white">
          <HStack className="h-16 items-center justify-between px-4 border-b border-slate-100">
            <Heading size="md" className="text-slate-900">{editingAddress ? "Editar Endereço" : "Novo Endereço"}</Heading>
            <Pressable onPress={() => setShowAddressModal(false)} className="p-2 bg-slate-100 rounded-full">
              <Icon as={X} size="sm" color="#0f172a" />
            </Pressable>
          </HStack>
          <ScrollView className="flex-1 p-4">
            <VStack space="md" className="pb-10">
              <VStack space="xs">
                <Text className="text-sm font-semibold text-slate-500">Nome do local (Ex: Casa, Trabalho)</Text>
                <Input className="rounded-xl border-slate-200 bg-white h-12">
                  <InputField value={label} onChangeText={setLabel} placeholder="Casa" />
                </Input>
              </VStack>
              <VStack space="xs">
                <Text className="text-sm font-semibold text-slate-500">CEP</Text>
                <Input className="rounded-xl border-slate-200 bg-white h-12">
                  <InputField value={zip} onChangeText={setZip} placeholder="00000-000" keyboardType="numeric" />
                </Input>
              </VStack>
              <HStack space="md">
                <VStack space="xs" className="flex-1">
                  <Text className="text-sm font-semibold text-slate-500">Rua / Avenida</Text>
                  <Input className="rounded-xl border-slate-200 bg-white h-12">
                    <InputField value={street} onChangeText={setStreet} placeholder="Nome da rua" />
                  </Input>
                </VStack>
                <VStack space="xs" className="w-24">
                  <Text className="text-sm font-semibold text-slate-500">Número</Text>
                  <Input className="rounded-xl border-slate-200 bg-white h-12">
                    <InputField value={number} onChangeText={setNumber} placeholder="123" />
                  </Input>
                </VStack>
              </HStack>
              <VStack space="xs">
                <Text className="text-sm font-semibold text-slate-500">Complemento (Opcional)</Text>
                <Input className="rounded-xl border-slate-200 bg-white h-12">
                  <InputField value={complement} onChangeText={setComplement} placeholder="Apto 42, Bloco B" />
                </Input>
              </VStack>
              <VStack space="xs">
                <Text className="text-sm font-semibold text-slate-500">Bairro</Text>
                <Input className="rounded-xl border-slate-200 bg-white h-12">
                  <InputField value={neighborhood} onChangeText={setNeighborhood} placeholder="Centro" />
                </Input>
              </VStack>
              <HStack space="md">
                <VStack space="xs" className="flex-1">
                  <Text className="text-sm font-semibold text-slate-500">Cidade</Text>
                  <Input className="rounded-xl border-slate-200 bg-white h-12">
                    <InputField value={city} onChangeText={setCity} placeholder="São Paulo" />
                  </Input>
                </VStack>
                <VStack space="xs" className="w-24">
                  <Text className="text-sm font-semibold text-slate-500">Estado</Text>
                  <Input className="rounded-xl border-slate-200 bg-white h-12">
                    <InputField value={state} onChangeText={setState} placeholder="SP" maxLength={2} autoCapitalize="characters" />
                  </Input>
                </VStack>
              </HStack>
            </VStack>
          </ScrollView>
          <Box className="p-4 border-t border-slate-100 bg-white">
            <Button action="primary" onPress={handleSaveAddress} isDisabled={isSavingAddress} className="rounded-xl bg-slate-900 h-12">
              <ButtonText className="font-bold">{isSavingAddress ? "Salvando..." : "Salvar Endereço"}</ButtonText>
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
