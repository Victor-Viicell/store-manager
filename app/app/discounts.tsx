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
  Plus,
  X,
  Pencil,
  Trash2,
  MoreVertical,
  Check
} from "lucide-react-native";
import { Pressable, ScrollView } from "react-native";
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
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setDiscounts(data);
    else if (error) console.error(error);
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

  if (viewMode === "edit") {
    const isNew = !editingDiscount;

    return (
      <VStack className="flex-1 w-full bg-slate-50/50 -m-4 md:-m-8 p-4 md:p-8">
        <VStack space="xl" className="max-w-[1000px] w-full mx-auto pb-12">
          
          {/* Header */}
          <HStack className="items-center justify-between mb-8">
            <HStack space="md" className="items-center">
              <Pressable onPress={closeEditView} className="p-2 rounded-full hover:bg-slate-200">
                <Icon as={X} size="xl" color="#0f172a" />
              </Pressable>
              <Heading size="xl" className="text-slate-900 font-bold ml-2">
                {isNew ? "Criar desconto" : "Editar desconto"}
              </Heading>
            </HStack>
            <Button 
              action="primary" 
              className="rounded-xl px-6 bg-slate-950 h-11"
              onPress={handleSave}
            >
              <ButtonIcon as={Check} size="sm" className="mr-2" />
              <ButtonText className="font-bold">Salvar</ButtonText>
            </Button>
          </HStack>

          {/* Form */}
          <VStack space="xl">
            <VStack space="xs">
              <Text className="text-sm font-semibold text-slate-500">Nome do desconto</Text>
              <Input className="rounded-xl border-slate-200 bg-white h-12">
                <InputField 
                  placeholder="ex.: Desconto de amigo" 
                  value={name}
                  onChangeText={setName}
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text className="text-sm font-semibold text-slate-500">Valor</Text>
              <HStack space="md" className="items-center">
                <Input className="flex-1 rounded-xl border-slate-200 bg-white h-12">
                  <InputField 
                    placeholder="0" 
                    value={value}
                    onChangeText={setValue}
                    keyboardType="numeric"
                  />
                  <InputSlot className="pr-4">
                    <Text className="text-slate-400">{discountType === "percentage" ? "%" : "R$"}</Text>
                  </InputSlot>
                </Input>
                
                {/* Segmented Control */}
                <HStack className="bg-white border border-slate-200 rounded-xl p-1 h-12">
                  <Pressable 
                    onPress={() => setDiscountType("percentage")}
                    className={`px-6 justify-center rounded-lg ${discountType === "percentage" ? "bg-slate-100 border border-slate-900" : ""}`}
                  >
                    <Text className={`font-bold text-sm ${discountType === "percentage" ? "text-slate-900" : "text-slate-500"}`}>Porcentagem</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => setDiscountType("fixed")}
                    className={`px-6 justify-center rounded-lg ${discountType === "fixed" ? "bg-slate-100 border border-slate-900" : ""}`}
                  >
                    <Text className={`font-bold text-sm ${discountType === "fixed" ? "text-slate-900" : "text-slate-500"}`}>Fixo</Text>
                  </Pressable>
                </HStack>
              </HStack>
            </VStack>
          </VStack>

        </VStack>
      </VStack>
    );
  }

  return (
    <VStack space="xl" className="flex-1 max-w-[1200px] w-full mx-auto">
      {/* Header */}
      <HStack className="justify-between items-center mb-2">
        <Heading size="xl" className="text-slate-900 font-bold">Descontos</Heading>
        <Button 
          action="primary" 
          className="rounded-xl bg-slate-950 px-6 h-11"
          onPress={openCreateView}
        >
          <ButtonText className="font-bold text-sm">Criar desconto</ButtonText>
        </Button>
      </HStack>

      {/* Description */}
      <Text className="text-slate-600 leading-relaxed max-w-[1000px]">
        Crie e gerencie descontos para aplicar no checkout.
      </Text>

      {/* Table */}
      <Box className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mt-4">
        <Table className="w-full">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-slate-100">
              <TableHead className="px-6 py-5">
                <Text className="font-bold text-slate-900 text-sm">Nome</Text>
              </TableHead>
              <TableHead className="px-6 py-5">
                <Text className="font-bold text-slate-900 text-sm">Valor</Text>
              </TableHead>
              <TableHead className="px-6 py-5 text-right w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableData className="px-6 py-6 text-center">
                  <Text className="text-slate-500">Carregando...</Text>
                </TableData>
              </TableRow>
            ) : discounts.length === 0 ? (
              <TableRow>
                <TableData className="px-6 py-6 text-center">
                  <Text className="text-slate-500">Nenhum desconto encontrado.</Text>
                </TableData>
              </TableRow>
            ) : (
              discounts.map((discount) => (
                <TableRow key={discount.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <TableData className="px-6 py-6">
                    <Text className="text-slate-900 font-medium">{discount.name}</Text>
                  </TableData>
                  <TableData className="px-6 py-6">
                    <Text className="text-slate-600">
                      {discount.type === "fixed" ? "R$ " : ""}
                      {discount.value}
                      {discount.type === "percentage" ? "%" : ""}
                    </Text>
                  </TableData>
                  <TableData className="px-6 py-6 text-right">
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
                  </TableData>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </VStack>
  );
}