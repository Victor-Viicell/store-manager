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
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
} from "@/components/ui/drawer";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  Info
} from "lucide-react-native";
import { Pressable, ScrollView } from "react-native";
import { supabase } from "@/utils/supabase";

export default function Options() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<any>(null);
  
  const [optionSets, setOptionSets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [optionsList, setOptionsList] = useState<{ id?: string, name: string }[]>([]);
  const [newOptionText, setNewOptionText] = useState("");

  useEffect(() => {
    fetchOptionSets();
  }, []);

  const fetchOptionSets = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('option_sets')
      .select('*, options(*)');
      
    if (data) {
      // Sort options by created_at inside each set
      data.forEach(set => {
        if (set.options) {
          set.options.sort((a: any, b: any) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
      });
      setOptionSets(data);
    } else if (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const openCreateDrawer = () => {
    setEditingSet(null);
    setName("");
    setOptionsList([{ name: "" }]);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (set: any) => {
    setEditingSet(set);
    setName(set.name);
    setOptionsList(set.options?.length ? [...set.options] : [{ name: "" }]);
    setIsDrawerOpen(true);
  };

  const handleUpdateOption = (index: number, val: string) => {
    const newList = [...optionsList];
    newList[index].name = val;
    setOptionsList(newList);
  };

  const handleDeleteOptionInput = (index: number) => {
    const newList = [...optionsList];
    newList.splice(index, 1);
    setOptionsList(newList);
  };

  const handleAddOptionInput = (val: string) => {
    if (val.trim()) {
      setOptionsList([...optionsList, { name: val.trim() }]);
      setNewOptionText("");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    const validOptions = optionsList.filter(o => o.name.trim() !== "");
    
    let setId = editingSet?.id;

    if (editingSet) {
      // Update Option Set
      const { error: setError } = await supabase
        .from('option_sets')
        .update({ name: name.trim() })
        .eq('id', setId);
        
      if (setError) return;

      // Simplest approach: Delete all options for this set and re-insert
      await supabase.from('options').delete().eq('option_set_id', setId);
      
    } else {
      // Create Option Set
      const { data, error: setError } = await supabase
        .from('option_sets')
        .insert([{ name: name.trim() }])
        .select();
        
      if (setError || !data) return;
      setId = data[0].id;
    }

    // Insert new options
    if (validOptions.length > 0) {
      const optionsToInsert = validOptions.map(o => ({
        option_set_id: setId,
        name: o.name.trim()
      }));
      await supabase.from('options').insert(optionsToInsert);
    }

    await fetchOptionSets();
    setIsDrawerOpen(false);
  };

  const handleDeleteSet = async () => {
    if (!editingSet) return;
    const { error } = await supabase
      .from('option_sets')
      .delete()
      .eq('id', editingSet.id);
      
    if (!error) {
      await fetchOptionSets();
      setIsDrawerOpen(false);
    }
  };

  return (
    <VStack space="xl" className="flex-1 max-w-[1200px] w-full mx-auto">
      {/* Header */}
      <HStack className="justify-between items-center mb-2">
        <Heading size="xl" className="text-slate-900 font-bold">Conjuntos de opções</Heading>
        <Button 
          action="primary" 
          className="rounded-xl bg-slate-950 px-6 h-11"
          onPress={openCreateDrawer}
        >
          <ButtonText className="font-bold text-sm">Adicionar conjunto de opções</ButtonText>
        </Button>
      </HStack>

      {/* Description */}
      <Text className="text-slate-600 leading-relaxed max-w-[1000px]">
        Se você vende itens que têm diferentes tamanhos, cores, materiais etc., você pode aplicar essas opções aos itens para criar a gama completa de variações do item em uma só etapa. <Text className="text-slate-900 font-bold underline">Saiba mais</Text>
      </Text>

      {/* Table */}
      <Box className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden mt-4">
        <Table className="w-full">
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-slate-100">
              <TableHead className="px-6 py-5">
                <HStack space="xs" className="items-center">
                  <ChevronDown size={14} color="#0f172a" />
                  <Text className="font-bold text-slate-900 text-sm">Nome do conjunto de opções</Text>
                </HStack>
              </TableHead>
              <TableHead className="px-6 py-5">
                <Text className="font-bold text-slate-500 text-sm">Opções</Text>
              </TableHead>
              <TableHead className="px-6 py-5 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableData className="px-6 py-6 text-center">
                  <Text className="text-slate-500">Carregando...</Text>
                </TableData>
                <TableData /><TableData />
              </TableRow>
            ) : optionSets.length === 0 ? (
              <TableRow>
                <TableData className="px-6 py-6 text-center">
                  <Text className="text-slate-500">Nenhum conjunto encontrado.</Text>
                </TableData>
                <TableData /><TableData />
              </TableRow>
            ) : (
              optionSets.map((set) => (
                <TableRow key={set.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <TableData className="px-6 py-6">
                    <Text className="text-slate-900 font-medium pl-4">{set.name}</Text>
                  </TableData>
                  <TableData className="px-6 py-6">
                    <Text className="text-slate-600 leading-relaxed">
                      {set.options?.map((o: any) => o.name).join(" · ") || "-"}
                    </Text>
                  </TableData>
                  <TableData className="px-6 py-6 text-right">
                    <Pressable 
                      className="p-2 rounded-lg hover:bg-slate-100 self-end ml-auto"
                      onPress={() => openEditDrawer(set)}
                    >
                      <Icon as={Pencil} size="sm" color="#0f172a" />
                    </Pressable>
                  </TableData>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Drawer: Create/Edit Option Set */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        size="sm"
        anchor="right"
      >
        <DrawerBackdrop />
        <DrawerContent className="w-[450px] p-0 shadow-2xl">
          <DrawerHeader className="p-6 border-b border-slate-50 flex-row justify-between items-center">
            <Heading size="md" className="text-slate-900 font-bold">
              {editingSet ? "Editar conjunto de opções" : "Criar conjunto de opções"}
            </Heading>
            <DrawerCloseButton>
              <Icon as={X} size="md" color="#0f172a" />
            </DrawerCloseButton>
          </DrawerHeader>
          
          <DrawerBody className="p-6">
            <ScrollView showsVerticalScrollIndicator={false}>
              <VStack space="xl">
                
                {/* Info Banner */}
                <Box className="p-4 bg-white border border-slate-900 rounded-xl flex-row items-start">
                  <Icon as={Info} size="sm" color="#0f172a" className="mt-0.5 mr-3" />
                  <Text className="flex-1 text-sm text-slate-900 leading-relaxed font-medium">
                    As alterações que você faz nesse conjunto de opções não afetam os itens que já usam esse conjunto.
                  </Text>
                </Box>

                {/* Set Name Input */}
                <VStack space="xs">
                  <Text className="text-sm font-semibold text-slate-700">Nome do conjunto de opções</Text>
                  <Input className="rounded-xl border-slate-200 h-12 bg-white">
                    <InputField 
                      placeholder="Ex: Cor, Tamanho..." 
                      value={name}
                      onChangeText={setName}
                    />
                  </Input>
                </VStack>

                {/* Options List */}
                <VStack space="md">
                  <Heading size="sm" className="text-slate-900 font-bold">
                    Opções {name ? `de ${name}` : ""}
                  </Heading>
                  
                  <VStack space="sm">
                    {optionsList.map((opt, index) => (
                      <HStack key={index} space="sm" className="items-center">
                        <Icon as={GripVertical} size="md" color="#cbd5e1" />
                        <Input className="flex-1 rounded-xl border-slate-200 h-12 bg-white">
                          <InputField 
                            value={opt.name} 
                            onChangeText={(val) => handleUpdateOption(index, val)} 
                          />
                        </Input>
                        <Pressable className="p-2" onPress={() => handleDeleteOptionInput(index)}>
                          <Icon as={Trash2} size="md" color="#0f172a" />
                        </Pressable>
                      </HStack>
                    ))}
                    
                    {/* Add New Option Input */}
                    <HStack space="sm" className="items-center opacity-60">
                      <Box className="w-5" /> {/* Spacer for grip icon alignment */}
                      <Input className="flex-1 rounded-xl border-slate-200 h-12 bg-white border-dashed">
                        <InputField 
                          placeholder="Adicionar outra opção" 
                          value={newOptionText}
                          onChangeText={setNewOptionText}
                          onSubmitEditing={() => handleAddOptionInput(newOptionText)}
                        />
                      </Input>
                      <Box className="w-9" /> {/* Spacer for trash icon alignment */}
                    </HStack>
                  </VStack>
                </VStack>

                {/* Actions */}
                <VStack space="md" className="mt-8 mb-4">
                  <Button action="primary" className="rounded-xl bg-slate-950 h-12 w-full" onPress={handleSave}>
                    <ButtonText className="font-bold text-base">Salvar</ButtonText>
                  </Button>
                  
                  {editingSet && (
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-slate-200 h-12 w-full"
                      onPress={handleDeleteSet}
                    >
                      <ButtonText className="text-red-500 font-bold text-base">Excluir conjunto de opções</ButtonText>
                    </Button>
                  )}
                </VStack>

              </VStack>
            </ScrollView>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </VStack>
  );
}