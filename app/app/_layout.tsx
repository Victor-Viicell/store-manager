import { Box } from "@/components/ui/box";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerHeader
} from "@/components/ui/drawer";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Redirect, Slot, usePathname, useRouter } from "expo-router";
import {
  Box as BoxIcon,
  ChevronRight,
  LayoutDashboard,
  List,
  Menu as MenuIcon,
  Package,
  Settings2,
  ShoppingBag,
  SquareSlash,
  Store,
  Ticket,
  User,
  Users,
  X
} from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { ProfileDrawer } from "@/components/profile-drawer";

const SidebarItem = ({ icon: IconComponent, label, path, onClose }: { icon: any, label: string, path: string, onClose?: () => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === path || (path !== "/app/dashboard" && pathname.startsWith(path));

  return (
    <Pressable
      onPress={() => {
        router.push(path as any);
        if (onClose) onClose();
      }}
      className={`flex-row items-center px-4 py-3 rounded-xl mb-1 transition-all ${isActive ? 'bg-primary-500/10' : 'active:bg-slate-100'
        }`}
    >
      <Box className={`p-2 rounded-lg ${isActive ? 'bg-primary-500' : 'bg-slate-100'}`}>
        <IconComponent
          size={18}
          color={isActive ? "white" : "#64748b"}
        />
      </Box>
      <Text
        className={`ml-3 flex-1 font-semibold ${isActive ? 'text-primary-700' : 'text-slate-600'}`}
      >
        {label}
      </Text>
      {isActive && <ChevronRight size={16} color="#0891b2" />}
    </Pressable>
  );
};

const MobileNavItem = ({ icon: IconComponent, label, path, onPress }: any) => {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = path ? (pathname === path || (path !== "/app/dashboard" && pathname.startsWith(path))) : false;

  return (
    <Pressable
      onPress={onPress || (() => router.push(path))}
      className="items-center justify-center flex-1 h-full"
    >
      <IconComponent
        size={22}
        color={isActive ? "#0891b2" : "#94a3b8"}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <Text className={`text-[10px] mt-1 font-bold ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
        {label}
      </Text>
    </Pressable>
  );
};

import { supabase } from "@/utils/supabase";

export default function AppLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isManager, setIsManager] = useState<boolean>(false);

  React.useEffect(() => {
    const checkAuthAndRole = async (sessionData: any) => {
      setSession(sessionData);
      if (sessionData?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_manager')
          .eq('id', sessionData.user.id)
          .single();
        
        setIsManager(data?.is_manager || false);
      }
      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuthAndRole(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoading(true);
      checkAuthAndRole(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <Box className="flex-1 bg-white items-center justify-center">
        <Text>Carregando...</Text>
      </Box>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!isManager) {
    return <Redirect href="/web/store" />;
  }

  const NavigationContent = ({ onClose }: { onClose?: () => void }) => (
    <VStack space="xs" className="flex-1">
      <Text className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mb-2 mt-4">
        Vendas
      </Text>
      <SidebarItem icon={ShoppingBag} label="Pedidos" path="/app/orders" onClose={onClose} />

      <Text className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mb-2 mt-8">
        Itens
      </Text>
      <SidebarItem icon={Package} label="Biblioteca" path="/app/items" onClose={onClose} />

      <Text className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-8 mb-2">
        Gerenciar
      </Text>
      <SidebarItem icon={Settings2} label="Categorias" path="/app/categories" onClose={onClose} />
      <SidebarItem icon={BoxIcon} label="Estoque" path="/app/inventory" onClose={onClose} />
      <SidebarItem icon={Settings2} label="Modificações" path="/app/modifiers" onClose={onClose} />
      <SidebarItem icon={List} label="Conjuntos de opções" path="/app/options" onClose={onClose} />

      <Text className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-8 mb-2">
        Ofertas
      </Text>
      <SidebarItem icon={Ticket} label="Descontos" path="/app/discounts" onClose={onClose} />

      <Text className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-8 mb-2">
        Sistema
      </Text>
      <SidebarItem icon={LayoutDashboard} label="Painel" path="/app/dashboard" onClose={onClose} />
      <SidebarItem icon={Users} label="Clientes" path="/app/costumers" onClose={onClose} />
    </VStack>
  );

  const getPageTitle = () => {
    const path = pathname || "";
    if (path.includes("/orders")) return "Pedidos";
    if (path.includes("/items")) return "Itens";
    if (path.includes("/dashboard")) return "Painel";
    if (path.includes("/inventory")) return "Estoque";
    if (path.includes("/categories")) return "Categorias";
    if (path.includes("/modifiers")) return "Modificações";
    if (path.includes("/options")) return "Conjuntos";
    if (path.includes("/discounts")) return "Descontos";
    if (path.includes("/costumers")) return "Clientes";
    return "Store Manager";
  };

  return (
    <HStack className="flex-1 bg-white">
      {/* Sidebar - Desktop Only */}
      <VStack className="w-80 border-r border-slate-200 bg-white hidden md:flex">
        <Box className="p-8">
          <HStack space="md" className="items-center">
            <Box className="bg-primary-600 p-2 rounded-xl">
              <Store size={24} color="white" />
            </Box>
            <VStack>
              <Text className="text-xl font-bold text-slate-900 leading-none">Store Manager</Text>
              <Text className="text-xs font-medium text-slate-500 mt-1">Portal do Lojista</Text>
            </VStack>
          </HStack>
        </Box>

        <ScrollView className="flex-1 px-4">
          <NavigationContent />
        </ScrollView>

        <Box className="p-6 border-t border-slate-100">
          <Pressable
            onPress={() => router.replace("/")}
            className="flex-row items-center justify-center px-4 py-3 rounded-xl border border-slate-200 active:bg-slate-50"
          >
            <Text className="text-slate-600 font-bold">Sair do Modo Lojista</Text>
          </Pressable>
        </Box>
      </VStack>

      {/* Main Content Area - Mobile First */}
      <VStack className="flex-1 bg-slate-50/50">
        {/* Top Bar - Mobile Only */}
        <HStack className="h-14 bg-white border-b border-slate-200 md:hidden items-center justify-between px-0">
          <HStack className="items-center h-full">
            <Pressable onPress={() => setShowDrawer(true)} className="w-14 h-full items-center justify-center active:bg-slate-50">
              <MenuIcon size={24} color="#0f172a" />
            </Pressable>
            <Box className="w-[1px] h-full bg-slate-200" />
            <HStack space="sm" className="items-center px-4 h-full justify-center">
              <Box className="bg-slate-900 w-6 h-6 rounded-md items-center justify-center">
                <SquareSlash size={14} color="white" />
              </Box>
              <Text className="text-base font-semibold text-slate-900">{getPageTitle()}</Text>
            </HStack>
          </HStack>
          <HStack className="items-center h-full">
            <Box className="w-[1px] h-full bg-slate-200" />
            <Pressable 
              onPress={() => router.push("/")}
              className="w-12 h-full items-center justify-center active:bg-slate-50"
            >
              <Store size={20} color="#0f172a" />
            </Pressable>
            <Box className="w-[1px] h-full bg-slate-200" />
            <Pressable 
              onPress={() => {
                if (session?.user) {
                  setShowProfile(true);
                } else {
                  router.push("/login");
                }
              }} 
              className="w-12 h-full items-center justify-center active:bg-slate-50"
            >
              <User size={20} color="#0f172a" />
            </Pressable>
          </HStack>
        </HStack>

        <ProfileDrawer 
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          user={session?.user}
          isManager={isManager}
        />

        {/* Top Bar - Desktop Only */}
        <HStack className="h-20 bg-white border-b border-slate-200 items-center justify-between px-8 hidden md:flex">
          <VStack>
            <Text className="text-sm font-medium text-slate-500 uppercase tracking-wider">Espaço de Trabalho</Text>
            <Text className="text-lg font-bold text-slate-900">Loja Principal</Text>
          </VStack>
          <HStack space="md" className="items-center">
            <Box className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center">
              <Users size={20} color="#64748b" />
            </Box>
          </HStack>
        </HStack>

        {/* Page Content - Each page handles its own ScrollView */}
        <Box className="flex-1">
          <Slot />
        </Box>

        {/* Bottom Navigation removed as per user request */}
      </VStack>

      {/* Mobile Drawer Navigation */}
      <Drawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        size="lg"
        anchor="left"
      >
        <DrawerBackdrop />
        <DrawerContent className="p-0">
          <DrawerHeader className="p-6 border-b border-slate-50">
            <HStack className="items-center justify-between w-full">
              <HStack space="md" className="items-center">
                <Box className="bg-primary-600 p-2 rounded-xl">
                  <Store size={20} color="white" />
                </Box>
                <Text className="text-xl font-bold text-slate-900">Menu</Text>
              </HStack>
              <Pressable onPress={() => setShowDrawer(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} color="#64748b" />
              </Pressable>
            </HStack>
          </DrawerHeader>
          <DrawerBody className="p-4">
            <NavigationContent onClose={() => setShowDrawer(false)} />

            <Box className="mt-8 pt-6 border-t border-slate-100">
              <Pressable
                onPress={() => {
                  setShowDrawer(false);
                  router.replace("/");
                }}
                className="flex-row items-center justify-center px-4 py-4 rounded-xl bg-slate-100 active:bg-slate-200"
              >
                <Text className="text-slate-600 font-bold">Sair do Modo Lojista</Text>
              </Pressable>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </HStack>
  );
}
