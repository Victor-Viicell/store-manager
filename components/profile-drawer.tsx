import React from "react";
import { Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/utils/supabase";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Divider } from "@/components/ui/divider";
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@/components/ui/drawer";
import {
  User,
  Key,
  LogOut,
  ChevronRight,
  X,
  Contact,
  Building2,
  Palette,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react-native";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  isManager: boolean;
}

const ProfileItem = ({ icon: IconComp, label, description, onPress }: any) => (
  <Pressable 
    onPress={onPress}
    className="flex-row items-center py-4 px-3 active:bg-slate-100/50 rounded-2xl transition-all"
  >
    <Box className="w-11 h-11 rounded-xl bg-slate-50 items-center justify-center border border-slate-100">
      <IconComp size={20} color="#0f172a" strokeWidth={2} />
    </Box>
    <VStack className="ml-4 flex-1">
      <Text className="font-bold text-slate-900 text-[15px] leading-tight">{label}</Text>
      {description && (
        <Text className="text-[12px] text-slate-500 mt-1 leading-snug font-medium">
          {description}
        </Text>
      )}
    </VStack>
    <ChevronRight size={18} color="#cbd5e1" strokeWidth={2.5} />
  </Pressable>
);

export const ProfileDrawer = ({ isOpen, onClose, user, isManager }: ProfileDrawerProps) => {
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      onClose();
      router.replace("/login");
    } else {
      Alert.alert("Erro ao sair", error.message);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      anchor="right"
    >
      <DrawerBackdrop />
      <DrawerContent className="bg-white">
        <DrawerHeader className="justify-end p-4">
          <Pressable onPress={onClose} className="p-2 bg-slate-100 rounded-full">
            <X size={20} color="#64748b" />
          </Pressable>
        </DrawerHeader>
        <DrawerBody className="px-6" contentContainerStyle={{ paddingBottom: 40 }}>
          <VStack space="2xl" className="items-center mt-6">
            {/* Avatar Section */}
            <VStack space="lg" className="items-center w-full">
              <Box className="w-28 h-28 bg-slate-900 rounded-full items-center justify-center shadow-lg border-4 border-white">
                <User size={56} color="white" strokeWidth={1.5} />
              </Box>
              
              <VStack space="xs" className="items-center">
                <Heading size="xl" className="text-slate-900 text-center font-extrabold tracking-tight">
                  {user?.user_metadata?.full_name || "Usuário"}
                </Heading>
                <Text className="text-slate-500 text-center font-medium">
                  {user?.email || "email@exemplo.com"}
                </Text>
              </VStack>
            </VStack>

            {/* Menu Sections */}
            <VStack className="w-full mt-6" space="xl">
              {/* Account Section */}
              <VStack space="md">
                <Box className="bg-white border border-slate-100 rounded-[24px] p-2 shadow-sm">
                  <ProfileItem 
                    icon={Contact} 
                    label="Informações pessoais" 
                    description="Veja as informações como nome e endereço"
                    onPress={() => {
                      onClose();
                      router.push("/personal-profile");
                    }}
                  />
                  <Divider className="bg-slate-50 mx-4 h-[1px]" />
                  <ProfileItem 
                    icon={Key} 
                    label="Login e segurança" 
                    description="Altere sua senha, telefone etc."
                    onPress={() => {
                      onClose();
                      router.push("/login-security");
                    }}
                  />
                </Box>
              </VStack>

              {/* Orders Section */}
              <VStack space="md">
                <Heading size="xs" className="text-slate-400 font-bold ml-4 uppercase tracking-[1.5px]">Compras</Heading>
                <Box className="bg-white border border-slate-100 rounded-[24px] p-2 shadow-sm">
                  <ProfileItem 
                    icon={ShoppingBag} 
                    label="Meus pedidos" 
                    description="Veja o histórico dos seus pedidos"
                    onPress={() => {
                      onClose();
                      router.push("/web/my-orders");
                    }}
                  />
                </Box>
              </VStack>
              
              {isManager && (
                <VStack space="md">
                  <Heading size="xs" className="text-slate-400 font-bold ml-4 uppercase tracking-[1.5px]">Marca e imagem</Heading>
                  <Box className="bg-white border border-slate-100 rounded-[24px] p-2 shadow-sm">
                    <ProfileItem 
                      icon={Building2} 
                      label="Perfil da empresa" 
                      description="Gerencie suas informações comerciais públicas"
                      onPress={() => {
                        onClose();
                        router.push("/store-profile");
                      }}
                    />
                    <Divider className="bg-slate-50 mx-4 h-[1px]" />
                    <ProfileItem 
                      icon={Palette} 
                      label="Identidade visual" 
                      description="Defina as cores e imagens da sua marca"
                      onPress={() => {
                        onClose();
                        router.push("/store-branding");
                      }}
                    />
                  </Box>
                </VStack>
              )}

              {isManager && (
                <VStack space="md">
                  <Heading size="xs" className="text-slate-400 font-bold ml-4 uppercase tracking-[1.5px]">Gerenciamento</Heading>
                  <Box className="bg-white border border-slate-100 rounded-[24px] p-2 shadow-sm">
                    <ProfileItem 
                      icon={LayoutDashboard} 
                      label="Gerenciar Loja" 
                      description="Acesse o portal administrativo completo"
                      onPress={() => {
                        onClose();
                        router.push("/app/dashboard");
                      }} 
                    />
                  </Box>
                </VStack>
              )}
              
              {/* Sign Out */}
              <Box className="mt-4">
                <Pressable 
                  onPress={handleSignOut}
                  className="flex-row items-center py-4 bg-slate-100/80 px-5 rounded-[22px] active:bg-slate-200 transition-colors"
                >
                  <Box className="w-10 h-10 rounded-xl bg-white items-center justify-center shadow-sm">
                    <LogOut size={20} color="#0f172a" />
                  </Box>
                  <Text className="ml-4 flex-1 font-bold text-slate-900 text-[16px]">Sair</Text>
                  <ChevronRight size={18} color="#94a3b8" strokeWidth={2.5} />
                </Pressable>
              </Box>
            </VStack>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
