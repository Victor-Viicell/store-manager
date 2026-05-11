import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Checkbox, CheckboxIcon, CheckboxIndicator } from "@/components/ui/checkbox";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { CheckIcon, Icon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import {
  Menu,
  MenuItem,
  MenuItemLabel,
  MenuSeparator
} from "@/components/ui/menu";
import {
  Table,
  TableBody,
  TableData,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  Download,
  Image as ImageIcon,
  MoreVertical,
  Pencil,
  Search,
  Settings2,
  Trash2,
  Upload,
  X,
  PackageOpen
} from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Pressable, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";
import { EmptyState } from "@/components/empty-state";

export default function ItemsLibrary() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isMobileSelectionMode, setIsMobileSelectionMode] = useState(false);
  
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('@store_items');
        if (cached) setItems(JSON.parse(cached));
      } catch (e) {}
      fetchItems();
    };
    loadCache();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
      
    if (data) {
      setItems(data);
      AsyncStorage.setItem('@store_items', JSON.stringify(data)).catch(() => {});
    } else if (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedItems);
    if (ids.length === 0) return;
    
    const { error } = await supabase
      .from('items')
      .delete()
      .in('id', ids);
      
    if (!error) {
      setSelectedItems(new Set());
      setIsMobileSelectionMode(false);
      fetchItems();
    }
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (!error) {
      setSelectedItems((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchItems();
    }
  };

  const isAllSelected = selectedItems.size === items.length && items.length > 0;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
      <VStack space="xl" className="flex-1 p-4 md:p-8">
        {/* Header */}
        <HStack className="justify-between items-center">
          <Heading size="xl" className="text-slate-900 font-bold">Biblioteca de itens</Heading>
          <HStack space="sm" className="hidden md:flex">
            <Button variant="outline" action="secondary" className="rounded-xl border-slate-200">
              <ButtonIcon as={Download} className="mr-2" size="sm" />
              <ButtonText className="text-slate-700 font-semibold">Importar</ButtonText>
            </Button>
            <Button variant="outline" action="secondary" className="rounded-xl border-slate-200">
              <ButtonIcon as={Upload} className="mr-2" size="sm" />
              <ButtonText className="text-slate-700 font-semibold text-sm">Exportar</ButtonText>
            </Button>
            <Button variant="outline" action="secondary" className="rounded-xl border-slate-200" onPress={() => router.push("/app/items/bulk-add")}>
              <ButtonText className="text-slate-700 font-semibold text-sm">Adicionar itens em massa</ButtonText>
            </Button>
            <Button action="primary" className="rounded-xl bg-slate-950" onPress={() => router.push("/app/items/create")}>
              <ButtonText className="font-bold text-sm">Adicionar item</ButtonText>
            </Button>
          </HStack>
        </HStack>

        {/* Filters & Search */}
        <Box className="flex-col md:flex-row md:justify-between md:items-center mt-4 gap-4">
          {/* Search - Top on mobile, Right on desktop */}
          <Input className="w-full md:w-72 rounded-xl border-slate-200 bg-white h-12 md:order-2">
            <InputSlot className="pl-3">
              <InputIcon as={Search} size="sm" color="#94a3b8" />
            </InputSlot>
            <InputField placeholder="Pesquisar por nome do item" className="text-sm" />
          </Input>

          {/* Filters - Bottom on mobile, Left on desktop */}
          <HStack space="md" className="items-center md:order-1">
            {selectedItems.size > 0 ? (
              <Menu
                offset={5}
                trigger={({ ...triggerProps }) => {
                  return (
                    <Button {...triggerProps} variant="outline" action="secondary" className="rounded-xl border-slate-200 px-4 bg-white h-10">
                      <ButtonText className="text-slate-700 font-semibold text-sm mr-2">Ações</ButtonText>
                      <ButtonIcon as={ChevronDown} size="xs" />
                    </Button>
                  );
                }}
              >
                <MenuItem key="change-category" textValue="Alterar categoria">
                  <MenuItemLabel size="sm" className="text-slate-700">Alterar categoria</MenuItemLabel>
                </MenuItem>
                <MenuItem key="change-price" textValue="Alterar preço">
                  <MenuItemLabel size="sm" className="text-slate-700">Alterar preço</MenuItemLabel>
                </MenuItem>
                <MenuItem key="add-modifiers" textValue="Adicionar conjunto de modificações">
                  <MenuItemLabel size="sm" className="text-slate-700">Adicionar conjunto de modificações</MenuItemLabel>
                </MenuItem>
                <MenuSeparator />
                <MenuItem key="delete" textValue="Excluir itens" className="hover:bg-red-50" onPress={handleDeleteSelected}>
                  <HStack space="sm" className="items-center">
                    <Icon as={Trash2} size="sm" color="#ef4444" />
                    <MenuItemLabel size="sm" className="text-red-500 font-medium">Excluir itens</MenuItemLabel>
                  </HStack>
                </MenuItem>
              </Menu>
            ) : (
              <>
                <Button variant="outline" action="secondary" className="rounded-xl border-slate-200 px-4 bg-white h-10">
                  <ButtonText className="text-slate-700 font-semibold text-sm mr-2">Categoria</ButtonText>
                  <ButtonIcon as={ChevronDown} size="xs" />
                </Button>
                <Button variant="outline" action="secondary" className="rounded-xl border-slate-200 px-4 bg-white h-10">
                  <ButtonText className="text-slate-700 font-semibold text-sm mr-2">Valor</ButtonText>
                  <ButtonIcon as={ChevronDown} size="xs" />
                </Button>
              </>
            )}
          </HStack>
        </Box>

        {/* Items List */}
        <VStack className="mt-2 pb-24">
          {isLoading ? (
            Array.from({ length: items.length > 0 ? items.length : 1 }).map((_, index) => (
              <HStack key={index} space="md" className="py-4 border-b border-slate-100 items-center">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <VStack space="xs" className="flex-1">
                  <SkeletonText _lines={1} className="w-32 h-4" />
                  <SkeletonText _lines={1} className="w-20 h-3" />
                </VStack>
              </HStack>
            ))
          ) : items.length === 0 ? (
            <EmptyState icon={PackageOpen} message="Nenhum item encontrado." />
          ) : (
            items.map((item) => (
              <Pressable 
                key={item.id} 
                className={`py-3 border-b border-slate-200 flex-row items-center justify-between ${selectedItems.has(item.id) ? 'bg-primary-50/30' : ''}`}
                disabled={!isMobileSelectionMode}
                onPress={() => {
                  if (isMobileSelectionMode) {
                    toggleSelectItem(item.id);
                  }
                }}
                android_ripple={{ color: isMobileSelectionMode ? '#e2e8f0' : 'transparent' }}
                style={({ pressed }) => ({
                  opacity: pressed && isMobileSelectionMode ? 0.7 : 1,
                })}
              >
                <HStack space="md" className="items-center flex-1">
                  {isMobileSelectionMode && (
                    <Checkbox
                      value={item.id}
                      size="sm"
                      isChecked={selectedItems.has(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="ml-2 pointer-events-none"
                    >
                      <CheckboxIndicator>
                        <CheckboxIcon as={CheckIcon} />
                      </CheckboxIndicator>
                    </Checkbox>
                  )}
                  <Box className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden items-center justify-center border border-slate-200">
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} alt={item.name} className="w-full h-full" />
                    ) : (
                      <ImageIcon size={20} color="#94a3b8" />
                    )}
                  </Box>
                  <VStack space="xs" className="flex-1">
                    <Text className="text-slate-900 font-medium text-base">{item.name}</Text>
                    <Text className="text-slate-500 text-sm">R$ {item.price !== null ? item.price.toString().replace('.', ',') : '0,00'}</Text>
                  </VStack>
                </HStack>
                {!isMobileSelectionMode && (
                  <Menu
                    offset={5}
                    placement="bottom right"
                    trigger={({ ...triggerProps }) => (
                      <Button {...triggerProps} variant="link" className="p-2 mr-2 w-10 h-10 justify-center items-center">
                        <MoreVertical size={20} color="#0f172a" />
                      </Button>
                    )}
                  >
                    <MenuItem key="edit" textValue="Editar" onPress={() => router.push({ pathname: '/app/items/edit', params: { id: item.id } })}>
                      <MenuItemLabel size="sm" className="text-slate-700">Editar</MenuItemLabel>
                    </MenuItem>
                    <MenuItem key="duplicate" textValue="Criar cópia">
                      <MenuItemLabel size="sm" className="text-slate-700">Criar cópia</MenuItemLabel>
                    </MenuItem>
                    <MenuSeparator />
                    <MenuItem key="delete" textValue="Excluir" className="hover:bg-red-50" onPress={() => handleDeleteItem(item.id)}>
                      <MenuItemLabel size="sm" className="text-red-500 font-medium">Excluir</MenuItemLabel>
                    </MenuItem>
                  </Menu>
                )}
              </Pressable>
            ))
          )}
        </VStack>

        {/* Mobile Sticky Bottom Action Bar */}
        <Box className="md:hidden absolute bottom-4 left-0 right-0 flex-row items-center justify-between px-4 bg-transparent pointer-events-box-none">
          {isMobileSelectionMode ? (
            <Menu
              offset={5}
              placement="top left"
              trigger={({ ...triggerProps }) => (
                <Button {...triggerProps} action="secondary" className="rounded-xl bg-slate-900 flex-1 h-12 mr-3 pointer-events-auto" disabled={selectedItems.size === 0}>
                  <ButtonText className="font-bold text-sm text-white">Ações ({selectedItems.size})</ButtonText>
                  <ButtonIcon as={ChevronDown} size="xs" color="white" className="ml-1" />
                </Button>
              )}
            >
              <MenuItem key="delete" textValue="Excluir itens" onPress={handleDeleteSelected}>
                <HStack space="sm" className="items-center">
                  <Icon as={Trash2} size="sm" color="#ef4444" />
                  <MenuItemLabel size="sm" className="text-red-500 font-medium">Excluir itens</MenuItemLabel>
                </HStack>
              </MenuItem>
            </Menu>
          ) : (
            <Button action="primary" className="rounded-xl bg-slate-950 flex-1 h-12 mr-3 pointer-events-auto" onPress={() => router.push("/app/items/create")}>
              <ButtonText className="font-bold text-sm">Adicionar item</ButtonText>
            </Button>
          )}

          <Menu
            offset={5}
            placement="top right"
            trigger={({ ...triggerProps }) => (
              <Button {...triggerProps} variant="outline" className="rounded-xl bg-white border border-slate-200 w-12 h-12 p-0 justify-center items-center mr-2 shadow-sm pointer-events-auto">
                <MoreVertical size={20} color="#0f172a" />
              </Button>
            )}
          >
            <MenuItem key="import" textValue="Importar">
              <HStack space="sm" className="items-center">
                <Icon as={Download} size="sm" color="#0f172a" />
                <MenuItemLabel size="sm" className="text-slate-700">Importar</MenuItemLabel>
              </HStack>
            </MenuItem>
            <MenuItem key="export" textValue="Exportar">
              <HStack space="sm" className="items-center">
                <Icon as={Upload} size="sm" color="#0f172a" />
                <MenuItemLabel size="sm" className="text-slate-700">Exportar</MenuItemLabel>
              </HStack>
            </MenuItem>
            <MenuSeparator />
            <MenuItem key="bulk-add" textValue="Adicionar itens em massa" onPress={() => router.push("/app/items/bulk-add")}>
              <MenuItemLabel size="sm" className="text-slate-700">Adicionar itens em massa</MenuItemLabel>
            </MenuItem>
          </Menu>
          <Button 
            variant={isMobileSelectionMode ? "solid" : "outline"}
            className={`rounded-xl border border-slate-200 w-12 h-12 p-0 justify-center items-center shadow-sm pointer-events-auto ${isMobileSelectionMode ? 'bg-slate-900 border-slate-900' : 'bg-white'}`}
            onPress={() => {
              if (isMobileSelectionMode) setSelectedItems(new Set());
              setIsMobileSelectionMode(!isMobileSelectionMode);
            }}
          >
            {isMobileSelectionMode ? (
              <X size={18} color="white" />
            ) : (
              <Pencil size={18} color="#0f172a" />
            )}
          </Button>
        </Box>
      </VStack>
    </ScrollView>
  );
}
