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
  MenuItemLabel,
  MenuSeparator,
} from "@/components/ui/menu";
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@/components/ui/drawer";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  MoreVertical,
  Check,
  Tag
} from "lucide-react-native";
import { EmptyState } from "@/components/empty-state";
import { Pressable, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";

export default function Discounts() {
  const [viewMode, setViewMode] = useState<"list" | "edit">("list");
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('@store_discounts');
        if (cached) setDiscounts(JSON.parse(cached));
      } catch (e) {}
      fetchDiscounts();
    };
    loadCache();
  }, []);

  const fetchDiscounts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) {
      setDiscounts(data);
      AsyncStorage.setItem('@store_discounts', JSON.stringify(data)).catch(() => {});
    } else if (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const openCreateView = () => {
    setEditingDiscount(null);
    setName("");
    setValue("");
    setDiscountType("percentage");
    setViewMode("edit");
  };

  const openEditView = (discount: any) => {
    setEditingDiscount(discount);
    setName(discount.name);
    setValue(discount.value.toString());
    setDiscountType(discount.type);
    setViewMode("edit");
  };

  const closeEditView = () => {
    setEditingDiscount(null);
    setViewMode("list");
  };

  const handleSave = async () => {
    if (!name.trim() || !value.trim()) return;

    const payload = {
      name: name.trim(),
      value: parseFloat(value),
      type: discountType
    };

    if (editingDiscount) {
      const { data, error } = await supabase
        .from('discounts')
        .update(payload)
        .eq('id', editingDiscount.id)
        .select();
        
      if (data) {
        setDiscounts(discounts.map(d => d.id === editingDiscount.id ? data[0] : d));
        closeEditView();
      }
    } else {
      const { data, error } = await supabase
        .from('discounts')
        .insert([payload])
        .select();
        
      if (data) {
        setDiscounts([data[0], ...discounts]);
        closeEditView();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('discounts')
      .delete()
      .eq('id', id);
      
    if (!error) {
      setDiscounts(discounts.filter(d => d.id !== id));
    }
  };



  return (
    <VStack space="xl" className="flex-1 max-w-[1200px] w-full mx-auto">
      {/* Header */}
      <HStack className="justify-between items-center mb-2">
        <Heading size="xl" className="text-slate-900 font-bold">Descontos</Heading>
        <Button 
          action="primary" 
          className="rounded-xl bg-slate-950 px-6 h-11 hidden md:flex"
          onPress={openCreateView}
        >
          <ButtonText className="font-bold text-sm">Criar desconto</ButtonText>
        </Button>
      </HStack>

      {/* Description */}
      <Text className="text-slate-600 leading-relaxed max-w-[1000px]">
        Crie e gerencie descontos para aplicar no checkout.
      </Text>

      {/* Discounts List */}
      <VStack className="mt-4 pb-24">
        {isLoading ? (
          Array.from({ length: discounts.length > 0 ? discounts.length : 1 }).map((_, index) => (
            <VStack key={index} space="xs" className="p-4 border-b border-slate-50 justify-center">
              <SkeletonText _lines={1} className="w-32 h-4" />
              <SkeletonText _lines={1} className="w-16 h-3 mt-1" />
            </VStack>
          ))
        ) : discounts.length === 0 ? (
          <EmptyState icon={Tag} message="Nenhum desconto encontrado." />
        ) : (
          discounts.map((discount) => (
            <Box 
              key={discount.id} 
              className="p-4 border-b border-slate-50 flex-row items-center justify-between"
            >
              <VStack space="xs" className="flex-1">
                <Text className="text-slate-900 font-semibold">{discount.name}</Text>
                <Text className="text-slate-500 text-sm">{discount.type === 'percentage' ? `${discount.value}%` : `R$ ${discount.value.toString().replace('.', ',')}`}</Text>
              </VStack>
              <Menu
                offset={5}
                placement="bottom right"
                trigger={({ ...triggerProps }) => {
                  return (
                    <Pressable {...triggerProps} className="p-2 rounded-lg hover:bg-slate-100">
                      <Icon as={MoreVertical} size="sm" color="#0f172a" />
                    </Pressable>
                  );
                }}
              >
                <MenuItem key="edit" textValue="Editar" onPress={() => openEditView(discount)}>
                  <Icon as={Pencil} size="sm" className="mr-3" />
                  <MenuItemLabel size="sm">Editar</MenuItemLabel>
                </MenuItem>
                <MenuSeparator />
                <MenuItem key="delete" textValue="Excluir" onPress={() => handleDelete(discount.id)}>
                  <Icon as={Trash2} size="sm" className="mr-3" color="#ef4444" />
                  <MenuItemLabel size="sm" className="text-red-500">Excluir</MenuItemLabel>
                </MenuItem>
              </Menu>
            </Box>
          ))
        )}
      </VStack>

      {/* Mobile Sticky Bottom Action Bar */}
      <Box className="md:hidden absolute bottom-4 left-0 right-0 flex-row items-center px-4 bg-transparent pointer-events-box-none z-50">
        <Button action="primary" className="rounded-xl bg-slate-950 flex-1 h-12 shadow-sm pointer-events-auto" onPress={openCreateView}>
          <ButtonText className="font-bold text-sm text-white">Criar desconto</ButtonText>
        </Button>
      </Box>

      {/* Drawer: Create/Edit Discount */}
      <Drawer
        isOpen={viewMode === "edit"}
        onClose={closeEditView}
        size="full"
        anchor="right"
      >
        <DrawerBackdrop />
        <DrawerContent className="w-full md:w-[450px] p-0 shadow-2xl">
          <DrawerHeader className="p-6 pb-2 border-b-0 flex-row justify-between items-center">
            <HStack space="sm" className="items-center">
              <Pressable onPress={closeEditView} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
                <Icon as={X} size="md" color="#0f172a" />
              </Pressable>
              <Heading size="lg" className="text-slate-900 font-bold">
                {!editingDiscount ? "Criar desconto" : "Editar desconto"}
              </Heading>
            </HStack>
          </DrawerHeader>
          <DrawerBody className="p-6 pt-4">
            <VStack space="xl">
              <VStack space="xs">
                <Text className="text-sm text-slate-700">Nome do desconto</Text>
                <Input className="rounded-xl border-slate-200 bg-white h-12">
                  <InputField 
                    placeholder="ex.: Desconto de amigo" 
                    value={name}
                    onChangeText={setName}
                  />
                </Input>
              </VStack>

              <VStack space="md">
                <VStack space="xs">
                  <Text className="text-sm text-slate-700">Valor</Text>
                  <Input className="rounded-xl border-slate-200 bg-white h-12">
                    <InputField 
                      placeholder="0" 
                      value={value}
                      onChangeText={setValue}
                      keyboardType="numeric"
                      className="text-right"
                    />
                    <InputSlot className="pr-4">
                      <Text className="text-slate-500 font-medium">{discountType === "percentage" ? "%" : "R$"}</Text>
                    </InputSlot>
                  </Input>
                </VStack>
                
                {/* Segmented Control as separate buttons */}
                <HStack space="md">
                  <Pressable 
                    onPress={() => setDiscountType("percentage")}
                    className={`h-11 px-6 justify-center items-center rounded-xl border ${discountType === "percentage" ? "border-slate-900 bg-slate-50" : "border-slate-300 bg-white"}`}
                  >
                    <Text className={`font-medium ${discountType === "percentage" ? "text-slate-900" : "text-slate-700"}`}>Porcentagem</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => setDiscountType("fixed")}
                    className={`h-11 px-6 justify-center items-center rounded-xl border ${discountType === "fixed" ? "border-slate-900 bg-slate-50" : "border-slate-300 bg-white"}`}
                  >
                    <Text className={`font-medium ${discountType === "fixed" ? "text-slate-900" : "text-slate-700"}`}>Fixo</Text>
                  </Pressable>
                </HStack>
              </VStack>
            </VStack>
          </DrawerBody>
          <Box className="p-6 border-t border-slate-100 bg-white">
            <Button 
              action="primary" 
              className="rounded-xl w-full bg-slate-950 h-14"
              onPress={handleSave}
            >
              <ButtonIcon as={Check} size="sm" className="mr-2" color="white" />
              <ButtonText className="font-bold text-white text-base">Salvar</ButtonText>
            </Button>
          </Box>
        </DrawerContent>
      </Drawer>
    </VStack>
  );
}