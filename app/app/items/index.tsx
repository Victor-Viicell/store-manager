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
import { useRouter } from "expo-router";
import {
  ChevronDown,
  Download,
  Image as ImageIcon,
  MoreVertical,
  Search,
  Settings2,
  Trash2,
  Upload
} from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Pressable } from "react-native";
import { supabase } from "@/utils/supabase";

export default function ItemsLibrary() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
      
    if (data) setItems(data);
    else if (error) console.error(error);
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
      fetchItems();
    }
  };

  const isAllSelected = selectedItems.size === items.length && items.length > 0;

  return (
    <VStack space="xl" className="flex-1">
      {/* Header */}
      <HStack className="justify-between items-center">
        <Heading size="xl" className="text-slate-900 font-bold">Biblioteca de itens</Heading>
        <HStack space="sm">
          <Button variant="outline" action="secondary" className="rounded-xl border-slate-200">
            <ButtonIcon as={Upload} className="mr-2" size="sm" />
            <ButtonText className="text-slate-700 font-semibold">Upload</ButtonText>
          </Button>
          <Button variant="outline" action="secondary" className="rounded-xl border-slate-200">
            <ButtonIcon as={Download} className="mr-2" size="sm" />
            <ButtonText className="text-slate-700 font-semibold text-sm">Download</ButtonText>
          </Button>
          <Button variant="outline" action="secondary" className="rounded-xl border-slate-200">
            <ButtonText className="text-slate-700 font-semibold text-sm">Adicionar itens em massa</ButtonText>
          </Button>
          <Button action="primary" className="rounded-xl bg-slate-950" onPress={() => router.push("/app/items/create")}>
            <ButtonText className="font-bold text-sm">Adicionar item</ButtonText>
          </Button>
        </HStack>
      </HStack>

      {/* Filters & Search */}
      <HStack className="justify-between items-center mt-4">
        <HStack space="md" className="items-center">
          {selectedItems.size > 0 ? (
            <Menu
              offset={5}
              trigger={({ ...triggerProps }) => {
                return (
                  <Button {...triggerProps} variant="outline" action="secondary" className="rounded-xl border-slate-200 px-4">
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
              <Button variant="outline" action="secondary" className="rounded-xl border-slate-200 px-4">
                <ButtonText className="text-slate-700 font-semibold text-sm mr-2">Categoria</ButtonText>
                <ButtonIcon as={ChevronDown} size="xs" />
              </Button>
              <Button variant="outline" action="secondary" className="rounded-xl border-slate-200 px-4">
                <ButtonText className="text-slate-700 font-semibold text-sm mr-2">Valor</ButtonText>
                <ButtonIcon as={ChevronDown} size="xs" />
              </Button>
            </>
          )}
        </HStack>

        <Input className="w-72 rounded-xl border-slate-200 bg-white">
          <InputSlot className="pl-3">
            <InputIcon as={Search} size="sm" color="#94a3b8" />
          </InputSlot>
          <InputField placeholder="Pesquisar por nome do ite..." className="text-sm" />
        </Input>
      </HStack>

      {/* Items Table */}
      <Box className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mt-2">
        <Table className="w-full">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-slate-100">
              <TableHead className="w-16 px-6 py-4">
                <Checkbox
                  value="all"
                  size="sm"
                  isChecked={isAllSelected}
                  onChange={toggleSelectAll}
                >
                  <CheckboxIndicator>
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                </Checkbox>
              </TableHead>
              <TableHead className="px-6 py-4 font-bold text-slate-900">Nome</TableHead>
              <TableHead className="px-6 py-4 font-bold text-slate-900">Categoria</TableHead>
              <TableHead className="px-6 py-4 font-bold text-slate-900">Valor</TableHead>
              <TableHead className="px-6 py-4 font-bold text-slate-900">Unidade</TableHead>
              <TableHead className="w-16 px-6 py-4 text-right">
                <Settings2 size={18} color="#64748b" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableData className="px-6 py-6 text-center">
                  <Text className="text-slate-500">Carregando...</Text>
                </TableData>
                <TableData /><TableData /><TableData /><TableData /><TableData />
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableData className="px-6 py-6 text-center">
                  <Text className="text-slate-500">Nenhum item encontrado.</Text>
                </TableData>
                <TableData /><TableData /><TableData /><TableData /><TableData />
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 ${selectedItems.has(item.id) ? 'bg-primary-50/30' : ''}`}>
                  <TableData className="px-6 py-4">
                    <Checkbox
                      value={item.id}
                      size="sm"
                      isChecked={selectedItems.has(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                    >
                      <CheckboxIndicator>
                        <CheckboxIcon as={CheckIcon} />
                      </CheckboxIndicator>
                    </Checkbox>
                  </TableData>
                  <TableData className="px-6 py-4">
                    <HStack space="md" className="items-center">
                      <Box className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden items-center justify-center border border-slate-100">
                        {item.image_url ? (
                          <Image
                            source={{ uri: item.image_url }}
                            alt={item.name}
                            className="w-full h-full"
                          />
                        ) : (
                          <ImageIcon size={20} color="#94a3b8" />
                        )}
                      </Box>
                      <Text className="text-slate-900 font-semibold">{item.name}</Text>
                    </HStack>
                  </TableData>
                  <TableData className="px-6 py-4">
                    <Text className="text-slate-600">{item.categories?.name || "-"}</Text>
                  </TableData>
                  <TableData className="px-6 py-4">
                    <Text className="text-slate-600">R$ {item.price.toString().replace('.', ',')}</Text>
                  </TableData>
                  <TableData className="px-6 py-4">
                    <Text className="text-slate-600">{item.unit}</Text>
                  </TableData>
                  <TableData className="px-6 py-4 text-right">
                    <Pressable className="p-2 rounded-lg hover:bg-slate-100 self-end">
                      <MoreVertical size={20} color="#64748b" />
                    </Pressable>
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
