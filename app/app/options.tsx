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
  Checkbox,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxIcon,
} from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
} from "@/components/ui/drawer";
import {
  Menu,
  MenuItem,
  MenuItemLabel,
  MenuSeparator,
} from "@/components/ui/menu";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  List,
  Check,
  MoreVertical,
  ChevronRight,
  Info
} from "lucide-react-native";
import { EmptyState } from "@/components/empty-state";
import { Pressable, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";

export default function Options() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<any>(null);
  const [createAnother, setCreateAnother] = useState(false);
  
  const [optionSets, setOptionSets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [optionsList, setOptionsList] = useState<{ id?: string, name: string }[]>([]);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('@store_options');
        if (cached) setOptionSets(JSON.parse(cached));
      } catch (e) {}
      fetchOptionSets();
    };
    loadCache();
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
      AsyncStorage.setItem('@store_options', JSON.stringify(data)).catch(() => {});
    } else if (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  const openCreateDrawer = () => {
    setEditingSet(null);
    setName("");
    setOptionsList([{ id: 'init-' + Date.now(), name: "" }]);
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
    
    // If we're typing in the last field and it's not empty, add a new empty field
    if (index === newList.length - 1 && val.trim() !== "") {
      newList.push({ name: "" });
    }
    
    setOptionsList(newList);
  };

  const handleDeleteOptionInput = (index: number) => {
    if (optionsList.length === 1) {
      setOptionsList([{ name: "" }]);
      return;
    }
    const newList = [...optionsList];
    newList.splice(index, 1);
    setOptionsList(newList);
  };

  const handleMoveOption = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0) return;
    // Don't swap into the trailing empty placeholder
    const lastFilled = optionsList.findIndex(o => o.name.trim() === "");
    const maxTarget = lastFilled >= 0 ? lastFilled - 1 : optionsList.length - 1;
    if (toIndex > maxTarget) return;
    const newList = [...optionsList];
    [newList[fromIndex], newList[toIndex]] = [newList[toIndex], newList[fromIndex]];
    setOptionsList(newList);
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
    
    if (createAnother && !editingSet) {
      setName("");
      setOptionsList([{ name: "" }]);
    } else {
      setIsDrawerOpen(false);
    }
  };

  const handleDeleteSet = async (id?: string) => {
    const targetId = id || editingSet?.id;
    if (!targetId) return;

    const { error } = await supabase
      .from('option_sets')
      .delete()
      .eq('id', targetId);
      
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
          className="rounded-xl bg-slate-950 px-6 h-11 hidden md:flex"
          onPress={openCreateDrawer}
        >
          <ButtonText className="font-bold text-sm">Adicionar conjunto de opções</ButtonText>
        </Button>
      </HStack>

      {/* Description */}
      <Text className="text-slate-600 leading-relaxed max-w-[1000px]">
        Se você vende itens que têm diferentes tamanhos, cores, materiais etc., você pode aplicar essas opções aos itens para criar a gama completa de variações do item em uma só etapa. <Text className="text-slate-900 font-bold underline">Saiba mais</Text>
      </Text>

      {/* Options List */}
      <VStack className="mt-4 pb-24">
        {isLoading ? (
          Array.from({ length: optionSets.length > 0 ? optionSets.length : 1 }).map((_, index) => (
            <VStack key={index} space="xs" className="p-4 border-b border-slate-50 justify-center">
              <SkeletonText _lines={1} className="w-40 h-4" />
              <SkeletonText _lines={1} className="w-48 h-3 mt-1" />
            </VStack>
          ))
        ) : optionSets.length === 0 ? (
          <EmptyState icon={List} message="Nenhum conjunto encontrado." />
        ) : (
          optionSets.map((set) => (
             <Pressable 
               key={set.id} 
               className="p-4 border-b border-slate-50 flex-row items-center justify-between"
               onPress={() => openEditDrawer(set)}
             >
               <VStack space="xs" className="flex-1 pr-4">
                 <Text className="text-slate-900 font-semibold text-lg">{set.name}</Text>
                 <Text className="text-slate-500 text-sm leading-relaxed">
                   {set.options?.map((o: any) => o.name).join(" · ") || "-"}
                 </Text>
               </VStack>
               <Icon as={ChevronRight} size="sm" color="#94a3b8" />
             </Pressable>
          ))
        )}
      </VStack>

      {/* Drawer: Create/Edit Option Set */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        size="full"
        anchor="right"
      >
        <DrawerBackdrop />
        <DrawerContent className="w-full md:w-[450px] p-0 shadow-2xl">
          <DrawerHeader className="p-6 border-b-0 flex-row justify-between items-center">
            <Heading size="lg" className="text-slate-900 font-bold flex-1 text-center ml-8">
              {editingSet ? "Editar conjunto de opções" : "Adicionar conjunto de opções"}
            </Heading>
            <Pressable onPress={() => setIsDrawerOpen(false)} className="p-2">
              <Icon as={X} size="lg" color="#0f172a" />
            </Pressable>
          </DrawerHeader>
          
          <DrawerBody className="p-0">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              <VStack space="2xl" className="p-6">
                {/* Info Banner - only on edit */}
                {editingSet && (
                  <Box className="p-4 bg-white border border-slate-900 rounded-xl flex-row items-start mb-2">
                    <Icon as={Info} size="sm" color="#0f172a" className="mt-0.5 mr-3" />
                    <Text className="flex-1 text-sm text-slate-900 leading-relaxed font-medium">
                      As alterações que você faz nesse conjunto de opções não afetam os itens que já usam esse conjunto.
                    </Text>
                  </Box>
                )}

                {/* Set Name Input */}
                <VStack space="sm">
                  <Text className="text-base text-slate-800">Nome do conjunto de opções</Text>
                  <Input className="rounded-xl border-slate-200 h-14 bg-white">
                    <InputField 
                      placeholder="Nome do conjunto" 
                      value={name}
                      onChangeText={setName}
                    />
                  </Input>
                </VStack>

                {/* Options List */}
                <VStack space="lg">
                  <Heading size="sm" className="text-slate-900 font-bold text-xl">
                    Opções {name ? `de ${name}` : "de"}
                  </Heading>
                  
                  <VStack space="sm">
                    {optionsList.map((opt, index) => {
                      const isLast = index === optionsList.length - 1;
                      const isEmpty = opt.name.trim() === "";
                      const filledCount = optionsList.filter(o => o.name.trim() !== "").length;
                      const isFilledItem = !isLast || !isEmpty;
                      
                      return (
                        <HStack key={index} space="sm" className="items-center">
                          {isFilledItem ? (
                            <VStack className="items-center">
                              <Pressable
                                onPress={() => handleMoveOption(index, index - 1)}
                                className={`p-0.5 ${index === 0 ? 'opacity-15' : 'opacity-50'}`}
                                disabled={index === 0}
                              >
                                <Icon as={ChevronDown} size="xs" color="#64748b" style={{ transform: [{ rotate: '180deg' }] }} />
                              </Pressable>
                              <Icon as={GripVertical} size="sm" color="#cbd5e1" />
                              <Pressable
                                onPress={() => handleMoveOption(index, index + 1)}
                                className={`p-0.5 ${index >= filledCount - 1 ? 'opacity-15' : 'opacity-50'}`}
                                disabled={index >= filledCount - 1}
                              >
                                <Icon as={ChevronDown} size="xs" color="#64748b" />
                              </Pressable>
                            </VStack>
                          ) : (
                            <Box className="w-5" />
                          )}
                          
                          <Input className={`flex-1 rounded-xl border-slate-200 h-14 bg-white ${isLast && isEmpty ? 'border-dashed opacity-60' : ''}`}>
                            <InputField 
                              placeholder={index === 0 ? "ex.: pequeno" : "Adicionar outra opção"}
                              value={opt.name} 
                              onChangeText={(val) => handleUpdateOption(index, val)} 
                            />
                          </Input>

                          {isFilledItem ? (
                            <Pressable className="p-2" onPress={() => handleDeleteOptionInput(index)}>
                              <Icon as={Trash2} size="md" color="#0f172a" />
                            </Pressable>
                          ) : (
                            <Box className="w-9" />
                          )}
                        </HStack>
                      );
                    })}
                  </VStack>
                </VStack>

                {/* Create Another Checkbox */}
                {!editingSet && (
                  <Checkbox 
                    size="md" 
                    value="create-another"
                    isChecked={createAnother}
                    onChange={(isChecked) => setCreateAnother(isChecked)}
                  >
                    <CheckboxIndicator>
                      <CheckboxIcon as={Check} />
                    </CheckboxIndicator>
                    <CheckboxLabel className="text-slate-700 text-base ml-2">
                      Crie outro conjunto de opções após salvar este
                    </CheckboxLabel>
                  </Checkbox>
                )}

                {/* Actions */}
                <VStack space="md" className="mt-4 mb-12">
                  <Button action="primary" className="rounded-xl bg-slate-950 h-14 w-full" onPress={handleSave}>
                    <ButtonText className="font-bold text-white text-lg">Salvar</ButtonText>
                  </Button>
                  
                  {editingSet && (
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-slate-300 h-14 w-full mt-2"
                      onPress={() => handleDeleteSet()}
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

      {/* Mobile Sticky Bottom Action Bar */}
      <Box className="md:hidden absolute bottom-4 left-0 right-0 flex-row items-center px-4 bg-transparent pointer-events-box-none z-50">
        <Button action="primary" className="rounded-xl bg-slate-950 flex-1 h-12 shadow-sm pointer-events-auto" onPress={openCreateDrawer}>
          <ButtonText className="font-bold text-sm text-white">Adicionar conjunto de opções</ButtonText>
        </Button>
      </Box>
    </VStack>
  );
}