import React, { useState, useEffect } from "react";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { 
  MoreVertical, 
  ChevronDown, 
  Pencil, 
  Plus, 
  Trash2,
  X,
  Image as ImageIcon,
  Grid
} from "lucide-react-native";
import { EmptyState } from "@/components/empty-state";
import { Pressable, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableData 
} from "@/components/ui/table";
import { 
  Menu, 
  MenuItem, 
  MenuItemLabel 
} from "@/components/ui/menu";
import { 
  Modal, 
  ModalBackdrop, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  ModalCloseButton
} from "@/components/ui/modal";
import { 
  Actionsheet, 
  ActionsheetBackdrop, 
  ActionsheetContent, 
  ActionsheetDragIndicator, 
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText
} from "@/components/ui/actionsheet";
import { Icon } from "@/components/ui/icon";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { useRouter } from "expo-router";

const categoriesData = [
  { id: "1", name: "Cerveja 600ml", itemCount: 6 },
  { id: "2", name: "Cerveja longneck", itemCount: 3 },
  { id: "3", name: "Consumíveis", itemCount: 2 },
];

import { supabase } from "@/utils/supabase";

export default function Categories() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('@store_categories');
        if (cached) setCategories(JSON.parse(cached));
      } catch (e) {}
      fetchCategories();
    };
    loadCache();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    // Fetch categories with item counts
    const { data, error } = await supabase
      .from('categories')
      .select('*, items(count)')
      .order('created_at', { ascending: false });
      
    if (data) {
      // Map data to include itemCount from the items object
      const mapped = data.map((cat: any) => ({
        ...cat,
        itemCount: cat.items?.[0]?.count || 0
      }));
      setCategories(mapped);
      AsyncStorage.setItem('@store_categories', JSON.stringify(mapped)).catch(() => {});
    } else if (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setNewCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setNewCategoryName("");
    }
    setShowAddModal(true);
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;

    if (editingCategory) {
      // Update
      const { data, error } = await supabase
        .from('categories')
        .update({ name: newCategoryName.trim() })
        .eq('id', editingCategory.id)
        .select();
        
      if (data) {
        setCategories(categories.map(c => c.id === editingCategory.id ? data[0] : c));
        setShowAddModal(false);
      }
    } else {
      // Create
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim() }])
        .select();
        
      if (data) {
        setCategories([data[0], ...categories]);
        setShowAddModal(false);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
      
    if (!error) {
      setCategories(categories.filter(c => c.id !== id));
    } else {
      console.error(error);
    }
  };

  return (
    <Box className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <VStack space="xl" className="flex-1 p-4 md:p-8">
          {/* Header */}
          <HStack className="justify-between items-center">
            <Heading size="xl" className="text-slate-900 font-bold">Categorias</Heading>
            <Button 
              action="primary" 
              className="rounded-xl bg-slate-950 px-6 hidden md:flex"
              onPress={() => handleOpenModal()}
            >
              <ButtonText className="font-bold text-sm">Adicionar categoria</ButtonText>
            </Button>
          </HStack>

          {/* Categories List */}
          <VStack className="mt-4 pb-24">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <HStack key={index} space="md" className="p-4 border-b border-slate-50 items-center justify-between">
                  <VStack space="xs">
                    <SkeletonText _lines={1} className="w-40 h-5" />
                    <SkeletonText _lines={1} className="w-20 h-3" />
                  </VStack>
                  <Skeleton className="w-6 h-6 rounded" />
                </HStack>
              ))
            ) : categories.length === 0 ? (
              <EmptyState icon={Grid} message="Nenhuma categoria encontrada." />
            ) : (
              categories.map((cat) => (
                <Box 
                  key={cat.id} 
                  className="p-4 border-b border-slate-50 flex-row items-center justify-between"
                >
                  <VStack space="xs" className="flex-1">
                    <Text className="text-slate-900 font-semibold text-[15px]">{cat.name}</Text>
                    <Text className="text-slate-400 text-xs font-medium">{cat.itemCount} {cat.itemCount === 1 ? 'item' : 'itens'}</Text>
                  </VStack>
                  <Pressable 
                    onPress={() => {
                      setEditingCategory(cat);
                      setShowActionsheet(true);
                    }} 
                    className="p-2 rounded-lg active:bg-slate-100"
                  >
                    <Icon as={MoreVertical} size="sm" color="#0f172a" />
                  </Pressable>
                </Box>
              ))
            )}
          </VStack>
        </VStack>
      </ScrollView>

      {/* Category Actionsheet */}
      <Actionsheet isOpen={showActionsheet} onClose={() => setShowActionsheet(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent className="pb-8">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack className="w-full px-4 pt-4" space="md">
            <HStack className="justify-between items-center mb-2">
              <Text className="font-bold text-slate-900 text-lg">Opções</Text>
              <Pressable onPress={() => setShowActionsheet(false)} className="p-2">
                <Icon as={X} size="md" color="#64748b" />
              </Pressable>
            </HStack>

            <ActionsheetItem 
              onPress={() => {
                setShowActionsheet(false);
                handleOpenModal(editingCategory);
              }}
            >
              <Icon as={Pencil} size="sm" className="mr-3" />
              <ActionsheetItemText className="text-slate-900 font-medium">Editar</ActionsheetItemText>
            </ActionsheetItem>

            <ActionsheetItem 
              onPress={() => {
                setShowActionsheet(false);
                router.push({
                  pathname: "/app/items/create",
                  params: { categoryId: editingCategory.id }
                });
              }}
            >
              <Icon as={Plus} size="sm" className="mr-3" />
              <ActionsheetItemText className="text-slate-900 font-medium">Adicionar item</ActionsheetItemText>
            </ActionsheetItem>

            <ActionsheetItem 
              onPress={() => {
                setShowActionsheet(false);
                handleDeleteCategory(editingCategory.id);
              }}
            >
              <Icon as={Trash2} size="sm" className="mr-3" color="#ef4444" />
              <ActionsheetItemText className="text-red-500 font-medium">Excluir</ActionsheetItemText>
            </ActionsheetItem>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>



      {/* Mobile Sticky Bottom Action Bar */}
      <Box className="md:hidden absolute bottom-4 left-0 right-0 flex-row items-center px-4 bg-transparent pointer-events-box-none z-50">
        <Button action="primary" className="rounded-xl bg-slate-950 flex-1 h-12 shadow-sm pointer-events-auto" onPress={() => handleOpenModal()}>
          <ButtonText className="font-bold text-sm text-white">Adicionar categoria</ButtonText>
        </Button>
      </Box>

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        size="md"
      >
        <ModalBackdrop />
        <ModalContent className="rounded-[32px] p-8 border-0 shadow-2xl">
          <ModalHeader className="mb-6">
            <Heading size="lg" className="text-slate-900">
              {editingCategory ? "Editar categoria" : "Adicionar categoria"}
            </Heading>
            <ModalCloseButton>
               <Icon as={X} size="md" color="#64748b" />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody className="mb-8">
            <VStack space="xs">
              <Text className="text-sm font-bold text-slate-700 mb-1">Nome da categoria</Text>
              <Input className="rounded-2xl border-slate-200 h-14 bg-slate-50/50">
                <InputField 
                  placeholder="Ex: Bebidas, Sobremesas..." 
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
              </Input>
              <Text className="text-[10px] text-slate-400 mt-1 italic">Caracteres restantes: {Math.max(0, 30 - newCategoryName.length)}</Text>
            </VStack>
          </ModalBody>
          <ModalFooter className="gap-3">
            <Button 
              variant="outline" 
              action="secondary" 
              className="rounded-xl border-slate-200 px-6"
              onPress={() => setShowAddModal(false)}
            >
              <ButtonText className="text-slate-700 font-bold">Cancelar</ButtonText>
            </Button>
            <Button 
              action="primary" 
              className="rounded-xl bg-slate-950 px-8"
              onPress={handleSaveCategory}
            >
              <ButtonText className="font-bold">Salvar</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}