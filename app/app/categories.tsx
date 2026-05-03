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
  X
} from "lucide-react-native";
import { Pressable, ScrollView } from "react-native";
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
import { Icon } from "@/components/ui/icon";

const categoriesData = [
  { id: "1", name: "Cerveja 600ml", itemCount: 6 },
  { id: "2", name: "Cerveja longneck", itemCount: 3 },
  { id: "3", name: "Consumíveis", itemCount: 2 },
];

import { supabase } from "@/utils/supabase";

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    // In a real scenario we'd also fetch itemCount, but let's just get the categories for now
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) {
      setCategories(data);
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
    <VStack space="xl" className="flex-1">
      {/* Header */}
      <HStack className="justify-between items-center">
        <Heading size="xl" className="text-slate-900 font-bold">Categorias</Heading>
        <Button 
          action="primary" 
          className="rounded-xl bg-slate-950 px-6"
          onPress={() => handleOpenModal()}
        >
          <ButtonText className="font-bold text-sm">Adicionar categoria</ButtonText>
        </Button>
      </HStack>

      {/* Categories Table */}
      <Box className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mt-4">
        <Table className="w-full">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-slate-100">
              <TableHead className="px-8 py-5 flex-row items-center">
                <ChevronDown size={16} color="#64748b" className="mr-2" />
                <Text className="font-bold text-slate-900">Nome</Text>
              </TableHead>
              <TableHead className="px-8 py-5 font-bold text-slate-900 text-right">Itens</TableHead>
              <TableHead className="px-8 py-5 font-bold text-slate-900 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableData className="px-8 py-6 text-center">
                  <Text className="text-slate-500">Carregando...</Text>
                </TableData>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableData className="px-8 py-6 text-center">
                  <Text className="text-slate-500">Nenhuma categoria encontrada.</Text>
                </TableData>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <TableData className="px-8 py-6">
                    <HStack space="md" className="items-center">
                      <Box className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center border border-slate-100 overflow-hidden">
                         <Text className="text-slate-500 font-bold">{category.name.charAt(0).toUpperCase()}</Text>
                      </Box>
                      <Text className="text-slate-900 font-semibold text-base">{category.name}</Text>
                    </HStack>
                  </TableData>
                  <TableData className="px-8 py-6 text-right">
                    <Text className="text-slate-600 font-medium">0</Text>
                  </TableData>
                  <TableData className="px-8 py-6 text-right">
                    <Box className="flex-row justify-end">
                      <Menu
                        offset={5}
                        placement="bottom right"
                        trigger={({ ...triggerProps }) => {
                          return (
                            <Pressable {...triggerProps} className="p-2 rounded-lg hover:bg-slate-100">
                              <MoreVertical size={20} color="#64748b" />
                            </Pressable>
                          );
                        }}
                      >
                        <MenuItem key="edit" textValue="Editar" onPress={() => handleOpenModal(category)}>
                          <HStack space="sm" className="items-center">
                            <Icon as={Pencil} size="xs" color="#64748b" />
                            <MenuItemLabel size="sm" className="text-slate-700">Editar</MenuItemLabel>
                          </HStack>
                        </MenuItem>
                        <MenuItem key="delete" textValue="Excluir" className="hover:bg-red-50" onPress={() => handleDeleteCategory(category.id)}>
                          <HStack space="sm" className="items-center">
                            <Icon as={Trash2} size="xs" color="#ef4444" />
                            <MenuItemLabel size="sm" className="text-red-500 font-medium">Excluir</MenuItemLabel>
                          </HStack>
                        </MenuItem>
                      </Menu>
                    </Box>
                  </TableData>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
    </VStack>
  );
}