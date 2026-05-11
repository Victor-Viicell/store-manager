import React, { useState, useEffect } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import {
  Menu,
  MenuItem,
  MenuItemLabel,
} from "@/components/ui/menu";
import { SkeletonText } from "@/components/ui/skeleton";
import {
  Search,
  X,
  Pencil,
  Users,
  MoreVertical,
  Trash2,
  Plus,
  Edit2
} from "lucide-react-native";
import { EmptyState } from "@/components/empty-state";
import { Pressable, ScrollView, Switch, Alert, Modal, ActivityIndicator } from "react-native";

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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";

export default function Customers() {
  const [viewMode, setViewMode] = useState<"list" | "edit">("list");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<any>(null);

  // Form State for Edit
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [storeName, setStoreName] = useState("");
  const [isManager, setIsManager] = useState(false);
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
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('@store_profiles');
        if (cached) setProfiles(JSON.parse(cached));
      } catch (e) {}
      fetchProfiles();
    };
    loadCache();
  }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
      
    if (data) {
      setProfiles(data);
      AsyncStorage.setItem('@store_profiles', JSON.stringify(data)).catch(() => {});
    } else if (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const openEditView = (profile: any) => {
    setEditingProfile(profile);
    setFullName(profile.full_name || "");
    setUsername(profile.username || "");
    setPhone(profile.phone || "");
    setWhatsapp(profile.whatsapp || "");
    setInstagram(profile.instagram || "");
    setWebsite(profile.website || "");
    setStoreName(profile.store_name || "");
    setIsManager(profile.is_manager || false);
    setViewMode("edit");
    fetchAddresses(profile.id);
  };

  const fetchAddresses = async (userId: string) => {
    setIsLoadingAddresses(true);
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false });
    
    if (data) setAddresses(data);
    setIsLoadingAddresses(false);
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
    if (!editingProfile) return;
    if (!street || !city || !state) {
      Alert.alert("Erro", "Rua, cidade e estado são obrigatórios.");
      return;
    }

    setIsSavingAddress(true);
    const payload = {
      user_id: editingProfile.id,
      label: label.trim() || "Endereço do Usuário",
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
    fetchAddresses(editingProfile.id);
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert("Excluir", "Tem certeza que deseja excluir este endereço?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
          await supabase.from("addresses").delete().eq("id", id);
          if (editingProfile) fetchAddresses(editingProfile.id);
      }}
    ]);
  };

  const handleSetDefault = async (id: string) => {
    if (!editingProfile) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", editingProfile.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    fetchAddresses(editingProfile.id);
  };
  
  const closeEditView = () => {
    setEditingProfile(null);
    setViewMode("list");
  };

  const handleToggleManager = (newValue: boolean) => {
    const actionText = newValue ? "promover este usuário a Lojista" : "rebaixar este Lojista a Cliente";
    Alert.alert(
      "Confirmar alteração",
      `Tem certeza que deseja ${actionText}? ${newValue ? "Ele terá acesso total ao painel de administração." : "Ele perderá o acesso ao painel."}`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          style: newValue ? "default" : "destructive",
          onPress: () => setIsManager(newValue) 
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!editingProfile) return;

    const payload = {
      full_name: fullName.trim() || null,
      username: username.trim() || null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      instagram: instagram.trim() || null,
      website: website.trim() || null,
      store_name: storeName.trim() || null,
      is_manager: isManager,
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', editingProfile.id)
      .select();

    if (data && data.length > 0) {
      const updated = profiles.map(p => p.id === editingProfile.id ? data[0] : p);
      setProfiles(updated);
      AsyncStorage.setItem('@store_profiles', JSON.stringify(updated)).catch(() => {});
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      closeEditView();
    } else if (error) {
      Alert.alert("Erro", error.message);
      console.error(error);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const name = p.full_name || p.username || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (p.phone && p.phone.includes(searchQuery));
  });
  const handleDeleteUser = () => {
    if (!editingProfile) return;
    Alert.alert(
      "Excluir Conta",
      "Tem certeza que deseja excluir esta conta? Itens da loja criados por este usuário serão transferidos para você. A conta será deletada permanentemente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.rpc('delete_user_and_transfer_data', {
              target_user_id: editingProfile.id
            });
            if (error) {
              Alert.alert("Erro ao excluir", error.message);
            } else {
              Alert.alert("Sucesso", "Conta excluída e dados transferidos.");
              const updated = profiles.filter(p => p.id !== editingProfile.id);
              setProfiles(updated);
              AsyncStorage.setItem('@store_profiles', JSON.stringify(updated)).catch(() => {});
              closeEditView();
            }
          }
        }
      ]
    );
  };

  if (viewMode === "edit") {
    return (
      <VStack style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center' }}>
          <VStack space="xl" style={{ maxWidth: 500, width: '100%', paddingBottom: 40, paddingTop: 16 }}>

            {/* Header */}
            <HStack space="sm" className="items-center w-full mb-2">
              <Pressable onPress={closeEditView} className="p-2 rounded-full active:bg-slate-200 -ml-2">
                <Icon as={X} size="xl" color="#0f172a" />
              </Pressable>
              <Heading size="lg" className="text-slate-900 font-bold" numberOfLines={1}>
                Editar perfil
              </Heading>
            </HStack>

            {/* Form Content */}
            <VStack space="2xl">
              
              {/* Visão Geral */}
              <Box className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <Heading size="md" className="text-slate-900 font-bold mb-5">Visão geral</Heading>
                <VStack space="lg">
                  <VStack space="xs">
                    <Text className="text-sm font-semibold text-slate-500">Nome completo</Text>
                    <Input className="rounded-xl border-slate-200 bg-white h-12">
                      <InputField placeholder="Nome do usuário" value={fullName} onChangeText={setFullName} />
                    </Input>
                  </VStack>
                  <VStack space="xs">
                    <Text className="text-sm font-semibold text-slate-500">Nome de usuário (Username)</Text>
                    <Input className="rounded-xl border-slate-200 bg-white h-12">
                      <InputField placeholder="@usuario" value={username} onChangeText={setUsername} autoCapitalize="none" />
                    </Input>
                  </VStack>
                  <VStack space="xs">
                    <Text className="text-sm font-semibold text-slate-500">Telefone</Text>
                    <Input className="rounded-xl border-slate-200 bg-white h-12">
                      <InputField placeholder="(11) 99999-9999" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
                    </Input>
                  </VStack>
                </VStack>
              </Box>

              {/* Informações da Loja / Redes Sociais */}
              <Box className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <Heading size="md" className="text-slate-900 font-bold mb-5">Redes Sociais & Contato</Heading>
                <VStack space="lg">
                  <VStack space="xs">
                    <Text className="text-sm font-semibold text-slate-500">Nome da Loja (Opcional)</Text>
                    <Input className="rounded-xl border-slate-200 bg-white h-12">
                      <InputField placeholder="Minha Loja" value={storeName} onChangeText={setStoreName} />
                    </Input>
                  </VStack>
                  <VStack space="xs">
                    <Text className="text-sm font-semibold text-slate-500">WhatsApp</Text>
                    <Input className="rounded-xl border-slate-200 bg-white h-12">
                      <InputField placeholder="(11) 99999-9999" keyboardType="phone-pad" value={whatsapp} onChangeText={setWhatsapp} />
                    </Input>
                  </VStack>
                  <VStack space="xs">
                    <Text className="text-sm font-semibold text-slate-500">Instagram</Text>
                    <Input className="rounded-xl border-slate-200 bg-white h-12">
                      <InputField placeholder="@instagram" value={instagram} onChangeText={setInstagram} autoCapitalize="none" />
                    </Input>
                  </VStack>
                  <VStack space="xs">
                    <Text className="text-sm font-semibold text-slate-500">Website</Text>
                    <Input className="rounded-xl border-slate-200 bg-white h-12">
                      <InputField placeholder="https://..." value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" />
                    </Input>
                  </VStack>
                </VStack>
              </Box>

              {/* Addresses Box */}
              <Box className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <HStack className="justify-between items-center mb-4">
                  <Heading size="md" className="text-slate-900 font-bold">Endereços do Usuário</Heading>
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

              {/* Permissões */}
              <Box className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <Heading size="md" className="text-slate-900 font-bold mb-5">Permissões de acesso</Heading>
                <HStack className="justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <VStack space="xs" className="flex-1 mr-4">
                    <Text className="text-sm font-bold text-slate-900">Perfil Lojista</Text>
                    <Text className="text-xs text-slate-500 leading-snug">
                      Ao ativar, este usuário terá acesso total ao painel de administração da loja.
                    </Text>
                  </VStack>
                  <Switch 
                    value={isManager} 
                    onValueChange={handleToggleManager} 
                    trackColor={{ false: "#cbd5e1", true: "#0f172a" }}
                    thumbColor="#ffffff"
                  />
                </HStack>
              </Box>

              {/* Zona de Perigo */}
              <Box className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm">
                <Heading size="md" className="text-red-700 font-bold mb-3">Zona de perigo</Heading>
                <Text className="text-sm text-slate-600 mb-5 leading-snug">
                  Excluir permanentemente esta conta. Todos os itens de loja vinculados serão transferidos para sua conta.
                </Text>
                <Button action="negative" variant="outline" onPress={handleDeleteUser} className="rounded-xl border-red-200 h-12">
                  <ButtonText className="text-red-600 font-bold">Excluir Usuário</ButtonText>
                </Button>
              </Box>

            </VStack>
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

        {/* Bottom Save Bar */}
        <Box className="px-4 py-3 border-t border-slate-100 bg-white items-center">
          <Button action="primary" className="rounded-xl bg-slate-950 h-12 w-full max-w-[500px]" onPress={handleSave}>
            <ButtonText className="font-bold">Salvar alterações</ButtonText>
          </Button>
        </Box>
      </VStack>
    );
  }

  return (
    <VStack space="xl" className="flex-1 max-w-[1200px] w-full mx-auto">
      {/* Header */}
      <HStack className="justify-between items-center mb-2">
        <Heading size="xl" className="text-slate-900 font-bold">Perfis</Heading>
      </HStack>

      {/* Search Bar */}
      <HStack className="items-center mt-2">
        <Input className="flex-1 rounded-xl border-slate-200 bg-white h-12">
          <InputSlot className="pl-4">
            <InputIcon as={Search} size="sm" color="#94a3b8" />
          </InputSlot>
          <InputField 
            placeholder="Pesquisar por nome ou telefone..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="text-sm" 
          />
        </Input>
      </HStack>

      {/* Profiles List */}
      <VStack className="mt-4 pb-24">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <VStack key={index} space="xs" className="p-4 border-b border-slate-50 justify-center">
              <SkeletonText _lines={1} className="w-40 h-4" />
              <SkeletonText _lines={1} className="w-32 h-3 mt-1" />
            </VStack>
          ))
        ) : filteredProfiles.length === 0 ? (
          <EmptyState icon={Users} message="Nenhum perfil encontrado." />
        ) : (
          filteredProfiles.map((profile) => (
            <Box 
              key={profile.id} 
              className="p-4 border-b flex-row items-center justify-between bg-white rounded-xl mb-2 shadow-sm border border-slate-100"
            >
              <VStack space="xs" className="flex-1 pr-4">
                <HStack space="sm" className="items-center">
                  <Text className="text-slate-900 font-bold text-[15px]">{profile.full_name || profile.username || "Sem nome"}</Text>
                  {profile.is_manager && (
                    <Box className="bg-slate-900 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] text-white font-bold uppercase tracking-wider">Lojista</Text>
                    </Box>
                  )}
                </HStack>
                <Text className="text-slate-500 text-sm">{profile.phone || "Sem telefone cadastrado"}</Text>
              </VStack>
              <Pressable onPress={() => openEditView(profile)} className="p-2 rounded-lg bg-slate-50 border border-slate-200 active:bg-slate-100">
                <Icon as={Pencil} size="sm" color="#0f172a" />
              </Pressable>
            </Box>
          ))
        )}
      </VStack>
    </VStack>
  );
}